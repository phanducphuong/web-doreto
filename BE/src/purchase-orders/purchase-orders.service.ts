import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PurchaseOrderStatus as PrismaStatus } from '@prisma/client';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { Role } from 'src/common/enums/role.enum';
import { AuthUser } from 'src/@types/auth.types';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportingService } from 'src/reporting/reporting.service';
import { PurchaseItemDto } from './dto/purchase-item.dto';
import { CrmLeadOutboxService } from 'src/crm-lead-outbox/crm-lead-outbox.service';
import { CrmLeadOutboxWorker } from 'src/crm-lead-outbox/crm-lead-outbox.worker';
import { buildOrderLeadPayload } from 'src/crm-lead-outbox/decor-lead-payload';

type SnapshotItem = {
  productId: string;
  productOptionValueId: string;
  count: number;
};

type BuiltItem = SnapshotItem & {
  price: number;
  product: Prisma.InputJsonValue;
  productOptionValue: Prisma.InputJsonValue;
};

// BuiltItem kèm field combo tạm (dùng để áp giá combo rồi loại bỏ trước khi lưu).
type ComboRawItem = BuiltItem & {
  comboGroupId?: string;
  comboQuantity?: number;
  comboLabel?: string;
  comboTiers?: Prisma.JsonValue;
};

const ORDER_INCLUDE = {
  purchaseItems: true,
  user: { omit: { password: true, refreshToken: true } },
};

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportingService: ReportingService,
    // Outbox lead decor→CRM (plan 38-03): enqueue in-tx + bắn gần-tức-thì sau commit
    private readonly outbox: CrmLeadOutboxService,
    private readonly worker: CrmLeadOutboxWorker,
  ) {}

  /**
   * Bắn flush outbox gần-tức-thì sau commit — FAIL-SAFE tuyệt đối: dù worker
   * (hoặc CRM) lỗi cũng KHÔNG được làm fail request đặt hàng. Worker nền ~30s
   * vẫn gửi lại. Non-blocking (không await).
   */
  private triggerFlushSafe() {
    try {
      this.worker.triggerFlushSoon();
    } catch (error) {
      this.logger.error(
        'triggerFlushSoon lỗi (bỏ qua, worker nền sẽ gửi lại)',
        error as Error,
      );
    }
  }

  /** Đơn đã ghi thành công thì lỗi đồng bộ báo cáo không được làm fail request. */
  private async syncReportSafe(date: Date) {
    try {
      await this.reportingService.syncByOrderDate(date);
    } catch (error) {
      this.logger.error('Đồng bộ báo cáo theo ngày thất bại', error);
    }
  }

  /** Bổ sung purchasePriceDetail và nonLoginUser để giữ đúng shape API cũ. */
  private shape(order: any) {
    if (!order) return order;
    return {
      ...order,
      purchasePriceDetail: { summaryPrice: order.summaryPrice },
      nonLoginUser: order.nonLoginUserEmail
        ? { email: order.nonLoginUserEmail }
        : undefined,
    };
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  }

  async createPurchaseOrder(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    caller: AuthUser | null,
  ) {
    const role = caller?.role;
    const status = (createPurchaseOrderDto.status ??
      PurchaseOrderStatus.PENDING) as PurchaseOrderStatus;

    if (
      role !== Role.ADMIN &&
      ![PurchaseOrderStatus.CART, PurchaseOrderStatus.PENDING].includes(status)
    ) {
      throw new ForbiddenException(
        'You are not allowed to create a purchase order',
      );
    }

    // Không tin userId từ body: user thường luôn gắn đơn vào chính mình,
    // khách vãng lai gắn null; chỉ admin được chỉ định userId tùy ý.
    const userId =
      role === Role.ADMIN
        ? createPurchaseOrderDto.userId || null
        : (caller?.userId ?? null);

    const items = await this.buildPurchaseItemSnapshots(
      createPurchaseOrderDto.purchaseItems,
    );
    const summaryPrice = this.calcSummaryPrice(items);

    // Đơn thật (không phải giỏ, không phải hủy) = một chuyển đổi → enqueue lead CRM
    const isConversion =
      status !== PurchaseOrderStatus.CART &&
      status !== PurchaseOrderStatus.CANCELLED;

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.purchaseOrder.create({
        data: {
          userId,
          status: status as PrismaStatus,
          summaryPrice,
          nonLoginUserEmail: createPurchaseOrderDto.nonLoginUser?.email,
          address: createPurchaseOrderDto.address
            ? this.toJson(createPurchaseOrderDto.address)
            : undefined,
          // Attribution nguyên văn (D-03/D-06); thiếu = undefined = cột null (D-07)
          visitorId: createPurchaseOrderDto.visitorId,
          camp: createPurchaseOrderDto.camp,
          utm: createPurchaseOrderDto.utm
            ? this.toJson(createPurchaseOrderDto.utm)
            : undefined,
          purchaseItems: { create: items.map((i) => this.itemCreateData(i)) },
        },
        include: ORDER_INCLUDE,
      });

      // Đơn tạo thẳng ở trạng thái đã đặt (vd "mua ngay" POST pending)
      // phải trừ kho ngay như đơn checkout từ giỏ
      if (isConversion) {
        await this.applyInventoryDelta(
          tx,
          items.map((i) => ({
            productId: i.productId,
            productOptionValueId: i.productOptionValueId,
            count: i.count,
          })),
          -1,
        );

        // Enqueue lead CÙNG tx (at-least-once): đơn commit thì lead chắc chắn đã
        // xếp hàng. sourceId = order.id → UNIQUE(sourceKind,sourceId) chống double
        // enqueue nếu về sau PATCH lại (D-08). KHÔNG gọi CRM ở đây, không await webhook.
        await this.outbox.enqueue(tx, {
          sourceKind: 'order',
          sourceId: created.id,
          payload: buildOrderLeadPayload(created),
        });
      }

      return created;
    });

    // Bắn gần-tức-thì SAU commit (D-04) — non-blocking, đã nuốt lỗi trong worker.
    // Lỗi gửi webhook KHÔNG bao giờ chặn/làm chậm luồng trả kết quả đặt hàng cho khách.
    if (isConversion) this.triggerFlushSafe();

    await this.syncReportSafe(order.createdAt);
    return this.shape(order);
  }

  async findOne(id: string, caller: AuthUser) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
    // Trả 404 (không phải 403) khi đơn của người khác để không lộ id đơn tồn tại
    if (
      !order ||
      (caller.role !== Role.ADMIN && order.userId !== caller.userId)
    ) {
      throw new NotFoundException('Purchase order not found');
    }
    return this.shape(order);
  }

  async updatePurchaseOrder(
    id: string,
    dto: UpdatePurchaseOrderDto,
    caller: AuthUser,
  ) {
    const updatedOrder = await this.updateExistingOrder(id, dto, caller);
    await this.syncReportSafe(updatedOrder.createdAt);
    return this.shape(updatedOrder);
  }

  /** User thường chỉ được: sửa giỏ của mình (CART→CART/PENDING) hoặc tự hủy đơn PENDING. */
  private assertCustomerCanUpdate(
    prevStatus: PurchaseOrderStatus | undefined,
    dto: UpdatePurchaseOrderDto,
  ) {
    if (prevStatus === PurchaseOrderStatus.CART) {
      const next = (dto.status ?? PurchaseOrderStatus.CART) as PurchaseOrderStatus;
      if (
        ![PurchaseOrderStatus.CART, PurchaseOrderStatus.PENDING].includes(next)
      ) {
        throw new ForbiddenException('Trạng thái đơn hàng không hợp lệ');
      }
      return;
    }
    if (
      prevStatus === PurchaseOrderStatus.PENDING &&
      dto.status === PurchaseOrderStatus.CANCELLED &&
      !dto.purchaseItems
    ) {
      return;
    }
    throw new ForbiddenException('Bạn không có quyền sửa đơn hàng này');
  }

  private async updateExistingOrder(
    id: string,
    dto: UpdatePurchaseOrderDto,
    caller: AuthUser,
  ) {
    const existing = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { purchaseItems: true },
    });

    // Không còn upsert: PATCH id lạ (vd cart id Mongo cũ trong localStorage) trả 404
    // để FE tạo giỏ mới bằng POST, thay vì cho client tự đặt khóa chính
    if (!existing) {
      throw new NotFoundException('Purchase order not found');
    }

    if (caller.role !== Role.ADMIN) {
      if (existing.userId !== caller.userId) {
        throw new NotFoundException('Purchase order not found');
      }
      this.assertCustomerCanUpdate(this.toStatus(existing.status), dto);
    }

    const prevStatus = this.toStatus(existing.status);
    const nextStatus = this.toStatus(dto.status ?? existing.status);

    // Checkout giỏ: cart → pending (lần đầu thành đơn thật) = chuyển đổi → enqueue lead.
    // Dùng lại đúng điều kiện movedOutFromCart của trừ kho (không phải hủy).
    const movedOutFromCart =
      prevStatus === PurchaseOrderStatus.CART &&
      nextStatus !== PurchaseOrderStatus.CART &&
      nextStatus !== PurchaseOrderStatus.CANCELLED;

    const data: Prisma.PurchaseOrderUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status as PrismaStatus;
    if (dto.address !== undefined) {
      data.address = dto.address ? this.toJson(dto.address) : Prisma.JsonNull;
    }
    if (dto.nonLoginUser !== undefined) {
      data.nonLoginUserEmail = dto.nonLoginUser?.email;
    }
    // Attribution ở đường checkout giỏ (PATCH): chỉ ghi khi payload có, nguyên văn (D-03/D-06)
    if (dto.visitorId !== undefined) data.visitorId = dto.visitorId;
    if (dto.camp !== undefined) data.camp = dto.camp;
    if (dto.utm !== undefined) {
      data.utm = dto.utm ? this.toJson(dto.utm) : Prisma.JsonNull;
    }
    if (prevStatus !== PurchaseOrderStatus.DELIVERED &&
        nextStatus === PurchaseOrderStatus.DELIVERED) {
      data.deliveriedAt = new Date();
    }

    let builtItems: BuiltItem[] | undefined;
    if (dto.purchaseItems) {
      builtItems = await this.buildPurchaseItemSnapshots(dto.purchaseItems);
      data.summaryPrice = this.calcSummaryPrice(builtItems);
    }

    const prevItems = this.toSnapshotItems(existing.purchaseItems);
    const nextItems = builtItems
      ? builtItems.map((i) => ({
          productId: i.productId,
          productOptionValueId: i.productOptionValueId,
          count: i.count,
        }))
      : prevItems;

    const order = await this.prisma.$transaction(async (tx) => {
      if (builtItems) {
        await tx.purchaseItem.deleteMany({ where: { orderId: id } });
      }
      const saved = await tx.purchaseOrder.update({
        where: { id },
        data: {
          ...data,
          ...(builtItems
            ? {
                purchaseItems: {
                  create: builtItems.map((i) => this.itemCreateData(i)),
                },
              }
            : {}),
        },
        include: ORDER_INCLUDE,
      });

      await this.handleInventoryOnStatusTransition(
        tx,
        prevStatus,
        nextStatus,
        prevItems,
        nextItems,
      );

      // Enqueue lead CÙNG tx khi giỏ chuyển thành đơn thật (D-04). sourceId = id đơn
      // → nếu POST tạo pending đã enqueue trước đó thì UNIQUE outbox làm no-op (D-08).
      if (movedOutFromCart) {
        await this.outbox.enqueue(tx, {
          sourceKind: 'order',
          sourceId: id,
          payload: buildOrderLeadPayload(saved),
        });
      }

      return saved;
    });

    // Bắn gần-tức-thì sau commit (non-blocking) — lỗi webhook không chặn khách.
    if (movedOutFromCart) this.triggerFlushSafe();

    return order;
  }

  async remove(id: string) {
    // Chặn xóa CỨNG đơn đã bán (confirmed/shipped/delivered): xóa sẽ cuốn theo
    // purchase_items (cascade) + viết lại báo cáo ngày = MẤT DẤU KẾ TOÁN không hồi.
    // Muốn bỏ đơn đã bán thì HỦY (chuyển cancelled) — vẫn giữ bản ghi + trừ đúng "đã bán".
    const existing = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      select: { status: true },
    });
    if (existing) {
      const s = existing.status as unknown as PurchaseOrderStatus;
      if (
        s === PurchaseOrderStatus.CONFIRMED ||
        s === PurchaseOrderStatus.SHIPPED ||
        s === PurchaseOrderStatus.DELIVERED
      ) {
        throw new BadRequestException(
          'Không thể xóa đơn đã xác nhận/đang giao/đã giao. Hãy hủy đơn (chuyển sang "đã hủy") thay vì xóa để giữ dấu kế toán.',
        );
      }
    }

    let order;
    try {
      order = await this.prisma.purchaseOrder.delete({
        where: { id },
        include: ORDER_INCLUDE,
      });
    } catch (error) {
      // Chỉ coi "không tồn tại" (P2025) / "id không phải uuid" (P2023) là 404,
      // lỗi khác (mất kết nối DB, FK...) phải ném ra thật
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2025', 'P2023'].includes(error.code)
      ) {
        throw new NotFoundException('Purchase order not found');
      }
      throw error;
    }
    await this.syncReportSafe(order.createdAt);
    return this.shape(order);
  }

  async findAllByUserId(userId: string, page: number = 1, limit: number = 10) {
    return this.paginate({ userId }, page, limit);
  }

  /**
   * Các đơn của user đủ điều kiện đánh giá 1 sản phẩm: trạng thái confirmed/shipped/
   * delivered VÀ có chứa sản phẩm đó. Lọc thẳng ở DB thay vì FE kéo 100 đơn rồi lọc
   * (khách >100 đơn sẽ mất quyền đánh giá vì đơn cũ rơi ngoài trang 1).
   */
  async findFeedbackEligibleOrders(userId: string, productId: string) {
    if (!productId) return [];
    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        userId,
        status: {
          in: [
            PurchaseOrderStatus.CONFIRMED,
            PurchaseOrderStatus.SHIPPED,
            PurchaseOrderStatus.DELIVERED,
          ] as PrismaStatus[],
        },
        purchaseItems: { some: { productId } },
      },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => this.shape(order));
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    userId?: string,
    status?: PurchaseOrderStatus,
    fromDate?: Date,
    toDate?: Date,
  ) {
    const where: Prisma.PurchaseOrderWhereInput = {
      status: status
        ? (status as PrismaStatus)
        : { not: PurchaseOrderStatus.CART as PrismaStatus },
    };
    if (userId) where.userId = userId;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) (where.createdAt as Prisma.DateTimeFilter).gte = fromDate;
      if (toDate) (where.createdAt as Prisma.DateTimeFilter).lte = toDate;
    }

    return this.paginate(where, page, limit);
  }

  private async paginate(
    where: Prisma.PurchaseOrderWhereInput,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: data.map((o) => this.shape(o)),
      total,
      page,
      count: limit,
    };
  }

  // ==== Helpers ====

  private itemCreateData(i: BuiltItem): Prisma.PurchaseItemCreateWithoutOrderInput {
    return {
      productRef: { connect: { id: i.productId } },
      optionValue: { connect: { id: i.productOptionValueId } },
      count: i.count,
      price: i.price,
      product: i.product,
      productOptionValue: i.productOptionValue,
    };
  }

  private async buildPurchaseItemSnapshots(
    purchaseItems: PurchaseItemDto[],
  ): Promise<BuiltItem[]> {
    const built = await Promise.all(
      purchaseItems.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new NotFoundException('Product not found');
        }

        const optionValue = await this.prisma.optionValue.findUnique({
          where: { id: item.productOptionValueId },
        });
        if (!optionValue) {
          throw new NotFoundException('Product option value not found');
        }

        return {
          productId: item.productId,
          productOptionValueId: item.productOptionValueId,
          count: item.count,
          // Mặc định giá lẻ của biến thể; combo sẽ ghi đè bên dưới.
          price: optionValue.price,
          product: this.toJson(product),
          productOptionValue: this.toJson(optionValue),
          // Field tạm để áp giá combo, xóa trước khi trả về.
          comboGroupId: item.comboGroupId,
          comboQuantity: item.comboQuantity,
          comboLabel: item.comboLabel,
          comboTiers: product.comboTiers,
        } as ComboRawItem;
      }),
    );

    this.applyComboPricing(built);

    // Gỡ field combo tạm; gắn snapshot combo (để hiển thị) vào biến thể combo.
    return built.map((raw) => {
      const { comboGroupId, comboQuantity, comboLabel, comboTiers, ...rest } =
        raw;
      void comboTiers;
      if (comboGroupId) {
        rest.productOptionValue = this.toJson({
          ...(rest.productOptionValue as Record<string, unknown>),
          __combo: {
            groupId: comboGroupId,
            quantity: comboQuantity ?? null,
            label: comboLabel ?? null,
          },
        });
      }
      return rest;
    });
  }

  /**
   * Áp giá combo: các dòng cùng comboGroupId gộp thành 1 gói. BE KHÔNG tin giá
   * client — tự tra Product.comboTiers theo comboQuantity, lấy tier.price làm giá
   * gói rồi chia đều cho từng sản phẩm (phần dư dồn vào các dòng đầu) để tổng
   * đúng bằng giá combo. Mỗi dòng combo phải count=1 (1 dòng = 1 sản phẩm).
   */
  private applyComboPricing(items: ComboRawItem[]) {
    const groups = new Map<string, ComboRawItem[]>();
    for (const item of items) {
      if (!item.comboGroupId) continue;
      const arr = groups.get(item.comboGroupId) ?? [];
      arr.push(item);
      groups.set(item.comboGroupId, arr);
    }

    for (const groupItems of groups.values()) {
      if (groupItems.some((i) => i.count !== 1)) {
        throw new BadRequestException(
          'Mỗi sản phẩm trong combo phải là 1 (count=1)',
        );
      }
      const quantity = groupItems[0]!.comboQuantity;
      if (!quantity || quantity !== groupItems.length) {
        throw new BadRequestException('Số lượng combo không khớp');
      }
      const productId = groupItems[0]!.productId;
      if (groupItems.some((i) => i.productId !== productId)) {
        throw new BadRequestException('Combo phải cùng một sản phẩm');
      }
      const tier = this.parseComboTiers(groupItems[0]!.comboTiers).find(
        (t) => t.quantity === quantity,
      );
      if (!tier) {
        throw new BadRequestException(
          'Bậc combo không tồn tại cho sản phẩm này',
        );
      }
      const total = Math.max(0, Math.round(tier.price));
      const base = Math.floor(total / quantity);
      const remainder = total - base * quantity;
      groupItems.forEach((item, index) => {
        item.price = base + (index < remainder ? 1 : 0);
      });
    }
  }

  /** Đọc an toàn mảng comboTiers từ cột JSON của product. */
  private parseComboTiers(
    raw: unknown,
  ): { quantity: number; price: number }[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((tier) => tier as Record<string, unknown>)
      .filter((tier) => !!tier && typeof tier === 'object')
      .map((tier) => ({
        quantity: Number(tier.quantity),
        price: Number(tier.price),
      }))
      .filter((tier) => Number.isFinite(tier.quantity) && Number.isFinite(tier.price));
  }

  private calcSummaryPrice(items: Array<{ price: number; count: number }>) {
    return items.reduce((total, item) => total + item.price * item.count, 0);
  }

  private toSnapshotItems(items: unknown[] | undefined): SnapshotItem[] {
    return (items ?? []).map((item) => {
      const r = item as Record<string, unknown>;
      return {
        productId: String(r.productId),
        productOptionValueId: String(r.productOptionValueId),
        count: Number(r.count ?? 0),
      };
    });
  }

  private toStatus(status: string | undefined): PurchaseOrderStatus | undefined {
    if (!status) return undefined;
    return Object.values(PurchaseOrderStatus).includes(
      status as PurchaseOrderStatus,
    )
      ? (status as PurchaseOrderStatus)
      : undefined;
  }

  /**
   * Trạng thái được tính vào "đã bán" (purchaseCount): mọi trạng thái TRỪ giỏ (CART)
   * và đã hủy (CANCELLED). Giữ đúng quy tắc hiện hành (pending cũng tính là đã bán).
   */
  private static isCountedStatus(status?: PurchaseOrderStatus): boolean {
    return (
      !!status &&
      status !== PurchaseOrderStatus.CART &&
      status !== PurchaseOrderStatus.CANCELLED
    );
  }

  /**
   * Cập nhật "đã bán" theo mô hình gỡ-cũ-cộng-mới thay vì bắt từng cặp chuyển đổi.
   * Đúng cho MỌI trường hợp, kể cả các case trước đây bị lệch:
   *  - cancel → confirm: trước đây KHÔNG cộng lại → nay cộng lại nextItems.
   *  - sửa items khi giữ nguyên status (đơn confirmed): trước đây return sớm →
   *    nay trừ items cũ, cộng items mới = điều chỉnh đúng phần chênh.
   * Nếu trước và sau đều không-được-tính (CART→CART) hoặc đều được tính & items y hệt
   * thì tổng delta = 0 (an toàn, chỉ tốn vài lệnh increment trong cùng transaction).
   */
  private async handleInventoryOnStatusTransition(
    tx: Prisma.TransactionClient,
    previousStatus: PurchaseOrderStatus | undefined,
    nextStatus: PurchaseOrderStatus | undefined,
    previousItems: SnapshotItem[],
    nextItems: SnapshotItem[],
  ) {
    const wasCounted = PurchaseOrdersService.isCountedStatus(previousStatus);
    const isCounted = PurchaseOrdersService.isCountedStatus(nextStatus);

    // Gỡ đóng góp cũ (nếu trước đây được tính) rồi cộng đóng góp mới (nếu giờ được tính).
    if (wasCounted) await this.applyInventoryDelta(tx, previousItems, 1);
    if (isCounted) await this.applyInventoryDelta(tx, nextItems, -1);
  }

  private async applyInventoryDelta(
    tx: Prisma.TransactionClient,
    items: SnapshotItem[],
    stockDirection: 1 | -1,
  ) {
    // KHO ẢO: đặt/hủy đơn KHÔNG trừ/cộng tồn kho (stock do admin đặt, luôn dư),
    // cũng không chặn khi "hết hàng". Chỉ cập nhật lượt mua (đã bán) để thống kê.
    for (const item of items) {
      await tx.optionValue.updateMany({
        where: { id: item.productOptionValueId },
        data: { purchaseCount: { increment: -stockDirection * item.count } },
      });

      await tx.product.updateMany({
        where: { id: item.productId },
        data: { purchaseCount: { increment: -stockDirection * item.count } },
      });
    }
  }
}
