import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, UpdateQuery } from 'mongoose';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from './schemas/purchase-order.schema';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { BaseService } from 'src/common/base/base.service';
import { Role } from 'src/common/enums/role.enum';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';
import { ProductOptionValueService } from 'src/products/option-value.service';
import {
  OptionValue,
  OptionValueDocument,
} from 'src/products/schemas/option-value.schema';
import { Product, ProductDocument } from 'src/products/schemas/product.schema';
import { ReportingService } from 'src/reporting/reporting.service';
import { PurchaseItemDto } from './dto/purchase-item.dto';

type SnapshotPurchaseItem = {
  productId: number;
  productOptionValueId: string;
  count: number;
};

@Injectable()
export class PurchaseOrdersService extends BaseService<PurchaseOrderDocument> {
  constructor(
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(OptionValue.name)
    private readonly optionValueModel: Model<OptionValueDocument>,
    private readonly optionValueService: ProductOptionValueService,
    private readonly reportingService: ReportingService,
  ) {
    super(purchaseOrderModel);
  }

  async createPurchaseOrder(
    createPurchaseOrderDto: CreatePurchaseOrderDto,
    role: Role,
  ) {
    if (
      role !== Role.ADMIN &&
      ![PurchaseOrderStatus.CART, PurchaseOrderStatus.PENDING].includes(
        createPurchaseOrderDto.status ?? PurchaseOrderStatus.CART,
      )
    ) {
      throw new ForbiddenException(
        'You are not allowed to create a purchase order',
      );
    }

    const validatedPurchaseItems = await this.buildPurchaseItemSnapshots(
      createPurchaseOrderDto.purchaseItems,
    );
    const purchasePriceDetail = this.buildPurchasePriceDetail(
      validatedPurchaseItems,
    );

    const purchaseOrder = new this.purchaseOrderModel({
      ...createPurchaseOrderDto,
      purchaseItems: validatedPurchaseItems,
      purchasePriceDetail,
    });
    const createdOrder = await purchaseOrder.save();
    await this.reportingService.syncByOrderDate(
      (createdOrder as any).createdAt,
    );
    return createdOrder;
  }

  async findOne(id: string) {
    const purchaseOrder = await this.purchaseOrderModel.findById(id).exec();
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }
    return purchaseOrder;
  }

  //   async update(id: string, updatePurchaseOrderDto: UpdatePurchaseOrderDto) {
  //     super.update(id, updatePurchaseOrderDto);
  //     // const purchaseOrder = await this.purchaseOrderModel
  //     //   .findByIdAndUpdate(id, updatePurchaseOrderDto, { new: true })
  //     //   .exec();
  //     // if (!purchaseOrder) {
  //     //   throw new NotFoundException('Purchase order not found');
  //     // }
  //     // return purchaseOrder;
  //   }

  async updatePurchaseOrder(id: string, dto: UpdatePurchaseOrderDto) {
    const updatedOrder = await this.upsertPurchaseOrder(id, dto);
    await this.reportingService.syncByOrderDate(
      (updatedOrder as any).createdAt,
    );
    return updatedOrder;
  }

  async upsertPurchaseOrder(id: string, dto: UpdatePurchaseOrderDto) {
    const existingOrder = await this.purchaseOrderModel
      .findById(id)
      .lean()
      .exec();
    const payload: UpdatePurchaseOrderDto & {
      purchasePriceDetail?: { summaryPrice: number };
      deliveriedAt?: Date;
    } = { ...dto };
    this.applyDeliveredAtOnStatusTransition(
      this.toPurchaseOrderStatus(existingOrder?.status),
      this.toPurchaseOrderStatus(payload.status ?? existingOrder?.status),
      payload,
    );
    if (payload.purchaseItems) {
      payload.purchaseItems = await this.buildPurchaseItemSnapshots(
        payload.purchaseItems,
      );
      payload.purchasePriceDetail = this.buildPurchasePriceDetail(
        payload.purchaseItems,
      );
    }

    const upsertedOrder = await super.upsert({ _id: id }, {
      $set: payload,
    } as UpdateQuery<PurchaseOrderDocument>);
    await this.handleInventoryOnStatusTransition(
      this.toPurchaseOrderStatus(existingOrder?.status),
      this.toPurchaseOrderStatus(upsertedOrder.status ?? payload.status),
      this.toSnapshotPurchaseItems(existingOrder?.purchaseItems),
      this.toSnapshotPurchaseItems(
        payload.purchaseItems ?? upsertedOrder.purchaseItems,
      ),
    );

    return upsertedOrder;
  }

  async remove(id: string) {
    const purchaseOrder = await this.purchaseOrderModel
      .findByIdAndDelete(id)
      .exec();
    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }
    await this.reportingService.syncByOrderDate(
      (purchaseOrder as any).createdAt,
    );
    return purchaseOrder;
  }

  async findAllByUserId(userId: string, page: number = 1, limit: number = 10) {
    return this.query(
      { userId }, // filter
      {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      ['user'],
    );
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    userId?: string,
    status?: PurchaseOrderStatus,
    fromDate?: Date,
    toDate?: Date,
  ) {
    const filter: QueryFilter<PurchaseOrderDocument> = {
      status: { $ne: PurchaseOrderStatus.CART },
    };
    if (userId) {
      filter.userId = userId;
    }
    if (status) {
      filter.status = status;
    }
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = fromDate;
      }
      if (toDate) {
        filter.createdAt.$lte = toDate;
      }
    }

    const result = await this.query(
      filter,
      {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      },
      ['user'],
    );

    return result;
  }

  private toSnapshot<T extends object>(
    document: T | (T & { toObject: () => T }),
  ): T {
    if ('toObject' in document && typeof document.toObject === 'function') {
      return document.toObject();
    }
    return document;
  }

  private async buildPurchaseItemSnapshots(purchaseItems: PurchaseItemDto[]) {
    return Promise.all(
      purchaseItems.map(async (purchaseItem) => {
        const product = await this.productModel
          .findById(purchaseItem.productId)
          .lean()
          .exec();
        if (!product) {
          throw new NotFoundException('Product not found');
        }

        const productOptionValue = await this.optionValueService.findOne(
          purchaseItem.productOptionValueId,
        );
        if (!productOptionValue) {
          throw new NotFoundException('Product option value not found');
        }

        const productOptionValueSnapshot = this.toSnapshot(productOptionValue);

        return {
          ...purchaseItem,
          product,
          productOptionValue: productOptionValueSnapshot,
          price: productOptionValue.price,
        };
      }),
    );
  }

  private buildPurchasePriceDetail(
    purchaseItems: Array<{ price: number; count: number }>,
  ) {
    const summaryPrice = purchaseItems.reduce(
      (total, item) => total + item.price * item.count,
      0,
    );

    return { summaryPrice };
  }

  private toSnapshotPurchaseItems(
    purchaseItems: unknown[] | undefined,
  ): SnapshotPurchaseItem[] {
    return (purchaseItems ?? []).map((item) => ({
      productId: Number((item as Record<string, unknown>).productId),
      productOptionValueId: String(
        (item as Record<string, unknown>).productOptionValueId,
      ),
      count: Number((item as Record<string, unknown>).count ?? 0),
    }));
  }

  private async handleInventoryOnStatusTransition(
    previousStatus: PurchaseOrderStatus | undefined,
    nextStatus: PurchaseOrderStatus | undefined,
    previousItems: SnapshotPurchaseItem[],
    nextItems: SnapshotPurchaseItem[],
  ) {
    if (!previousStatus || !nextStatus || previousStatus === nextStatus) {
      return;
    }

    const movedOutFromCart =
      previousStatus === PurchaseOrderStatus.CART &&
      nextStatus !== PurchaseOrderStatus.CART &&
      nextStatus !== PurchaseOrderStatus.CANCELLED;

    if (movedOutFromCart) {
      await this.applyInventoryDelta(nextItems, -1);
      return;
    }

    const movedToCancelledFromNonCart =
      previousStatus !== PurchaseOrderStatus.CART &&
      nextStatus === PurchaseOrderStatus.CANCELLED;

    if (movedToCancelledFromNonCart) {
      await this.applyInventoryDelta(previousItems, 1);
    }
  }

  private toPurchaseOrderStatus(
    status: string | undefined,
  ): PurchaseOrderStatus | undefined {
    if (!status) {
      return undefined;
    }

    return Object.values(PurchaseOrderStatus).includes(
      status as PurchaseOrderStatus,
    )
      ? (status as PurchaseOrderStatus)
      : undefined;
  }

  private applyDeliveredAtOnStatusTransition(
    previousStatus: PurchaseOrderStatus | undefined,
    nextStatus: PurchaseOrderStatus | undefined,
    payload: { deliveriedAt?: Date },
  ) {
    if (
      previousStatus !== PurchaseOrderStatus.DELIVERED &&
      nextStatus === PurchaseOrderStatus.DELIVERED
    ) {
      payload.deliveriedAt = new Date();
    }
  }

  private async applyInventoryDelta(
    items: SnapshotPurchaseItem[],
    stockDirection: 1 | -1,
  ) {
    if (!items.length) {
      return;
    }

    const optionValueBulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: item.productOptionValueId },
        update: {
          $inc: {
            stock: stockDirection * item.count,
            purchaseCount: -stockDirection * item.count,
          },
        },
      },
    }));

    const productBulkOps = items.map((item) => ({
      updateOne: {
        filter: { _id: Number(item.productId) },
        update: {
          $inc: {
            stock: stockDirection * item.count,
            purchaseCount: -stockDirection * item.count,
          },
        },
      },
    }));

    await this.optionValueModel.bulkWrite(optionValueBulkOps);
    await this.productModel.bulkWrite(productBulkOps);
  }
}
