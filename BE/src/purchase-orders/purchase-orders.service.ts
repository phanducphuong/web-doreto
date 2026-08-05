import {
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
  ) {}

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
          purchaseItems: { create: items.map((i) => this.itemCreateData(i)) },
        },
        include: ORDER_INCLUDE,
      });

      // Đơn tạo thẳng ở trạng thái đã đặt (vd "mua ngay" POST pending)
      // phải trừ kho ngay như đơn checkout từ giỏ
      if (
        status !== PurchaseOrderStatus.CART &&
        status !== PurchaseOrderStatus.CANCELLED
      ) {
        await this.applyInventoryDelta(
          tx,
          items.map((i) => ({
            productId: i.productId,
            productOptionValueId: i.productOptionValueId,
            count: i.count,
          })),
          -1,
        );
      }

      return created;
    });

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

    const data: Prisma.PurchaseOrderUpdateInput = {};
    if (dto.status !== undefined) data.status = dto.status as PrismaStatus;
    if (dto.address !== undefined) {
      data.address = dto.address ? this.toJson(dto.address) : Prisma.JsonNull;
    }
    if (dto.nonLoginUser !== undefined) {
      data.nonLoginUserEmail = dto.nonLoginUser?.email;
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

      return saved;
    });

    return order;
  }

  async remove(id: string) {
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
    return Promise.all(
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
          price: optionValue.price,
          product: this.toJson(product),
          productOptionValue: this.toJson(optionValue),
        };
      }),
    );
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

  private async handleInventoryOnStatusTransition(
    tx: Prisma.TransactionClient,
    previousStatus: PurchaseOrderStatus | undefined,
    nextStatus: PurchaseOrderStatus | undefined,
    previousItems: SnapshotItem[],
    nextItems: SnapshotItem[],
  ) {
    if (!previousStatus || !nextStatus || previousStatus === nextStatus) {
      return;
    }

    const movedOutFromCart =
      previousStatus === PurchaseOrderStatus.CART &&
      nextStatus !== PurchaseOrderStatus.CART &&
      nextStatus !== PurchaseOrderStatus.CANCELLED;

    if (movedOutFromCart) {
      await this.applyInventoryDelta(tx, nextItems, -1);
      return;
    }

    const movedToCancelledFromNonCart =
      previousStatus !== PurchaseOrderStatus.CART &&
      nextStatus === PurchaseOrderStatus.CANCELLED;

    if (movedToCancelledFromNonCart) {
      await this.applyInventoryDelta(tx, previousItems, 1);
    }
  }

  private async applyInventoryDelta(
    tx: Prisma.TransactionClient,
    items: SnapshotItem[],
    stockDirection: 1 | -1,
  ) {
    for (const item of items) {
      // Khi trừ kho: điều kiện stock >= count chạy nguyên tử trong DB,
      // 2 khách checkout cùng lúc món cuối cùng thì chỉ 1 người thành công
      const optionWhere: Prisma.OptionValueWhereInput =
        stockDirection === -1
          ? { id: item.productOptionValueId, stock: { gte: item.count } }
          : { id: item.productOptionValueId };

      const updated = await tx.optionValue.updateMany({
        where: optionWhere,
        data: {
          stock: { increment: stockDirection * item.count },
          purchaseCount: { increment: -stockDirection * item.count },
        },
      });

      if (stockDirection === -1 && updated.count === 0) {
        throw new ConflictException(
          'Sản phẩm không đủ hàng trong kho, vui lòng giảm số lượng hoặc chọn sản phẩm khác',
        );
      }

      // stock của Product là số gộp các biến thể — không gắn điều kiện gte
      // để tránh chặn nhầm khi số gộp lệch tạm thời với tổng biến thể
      await tx.product.updateMany({
        where: { id: item.productId },
        data: {
          stock: { increment: stockDirection * item.count },
          purchaseCount: { increment: -stockDirection * item.count },
        },
      });
    }
  }
}
