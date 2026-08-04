import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueryFilter, Model, Types } from 'mongoose';
import {
  FeedbackProduct,
  FeedbackProductDocument,
} from './schemas/feedback-product.schema';
import { BaseService } from 'src/common/base/base.service';
import { CreateFeedbackProductDto } from './dto/create-feedback-product.dto';
import { Product, ProductDocument } from 'src/products/schemas/product.schema';
import { Role } from 'src/common/enums/role.enum';
import {
  PurchaseOrder,
  PurchaseOrderDocument,
} from 'src/purchase-orders/schemas/purchase-order.schema';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';
import { ReplyFeedbackProductDto } from './dto/reply-feedback-product.dto';
import { QueryFeedbackManagementDto } from './dto/query-feedback-management.dto';

function productIdMatchValues(productId: number): (number | string)[] {
  return [productId, String(productId)];
}

@Injectable()
export class FeedbackProductsService extends BaseService<FeedbackProductDocument> {
  constructor(
    @InjectModel(FeedbackProduct.name)
    private readonly feedbackProductModel: Model<FeedbackProductDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(PurchaseOrder.name)
    private readonly purchaseOrderModel: Model<PurchaseOrderDocument>,
  ) {
    super(feedbackProductModel);
  }

  private get purchaseOrderCollectionName(): string {
    return this.purchaseOrderModel.collection.name;
  }

  async createOrUpdateFeedback(
    userId: string,
    dto: CreateFeedbackProductDto,
  ): Promise<FeedbackProductDocument> {
    if (!dto.comment && dto.score === undefined && !dto.images?.length) {
      throw new BadRequestException(
        'Feedback must include comment, score, or images',
      );
    }

    const purchaseOrderIdString: string = dto.purchaseOrderId;
    await this.assertUserOwnsDeliverablePurchaseOrder(
      userId,
      purchaseOrderIdString,
    );

    const purchaseOrderId = new Types.ObjectId(purchaseOrderIdString);
    const setData: Partial<FeedbackProduct> = {
      score: dto.score,
      isActive: true,
    };

    if (dto.comment !== undefined) {
      setData.comment = dto.comment;
    }

    if (dto.images !== undefined) {
      setData.images = dto.images;
    }

    const feedback = await this.feedbackProductModel
      .findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          purchaseOrderId,
        },
        {
          $set: setData,
          $setOnInsert: {
            userId: new Types.ObjectId(userId),
            purchaseOrderId,
          },
        },
        { new: true, upsert: true },
      )
      .exec();

    await Promise.all([
      this.purchaseOrderModel
        .updateOne({ _id: purchaseOrderId }, { $set: { isFeedbacked: true } })
        .exec(),
      this.syncRatingStatsForProductsInPurchaseOrder(purchaseOrderId),
    ]);

    return feedback;
  }

  async findAll() {
    return this.feedbackProductModel
      .find({ isActive: true })
      .populate('userId', 'name email')
      .populate({
        path: 'purchaseOrderId',
        select: 'status purchaseItems createdAt',
      })
      .populate('repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findForManagement(query: QueryFeedbackManagementDto) {
    const {
      page = 1,
      limit = 20,
      score,
      replyStatus,
      hasImage,
      reviewerKeyword,
    } = query;
    const skip = (page - 1) * limit;

    const matchStage: Record<string, unknown> = { isActive: true };
    if (score !== undefined) {
      matchStage.score = score;
    }

    if (replyStatus === 'replied') {
      matchStage.$or = [
        { repliedAt: { $exists: true, $ne: null } },
        { adminReply: { $exists: true, $ne: null } },
      ];
    } else if (replyStatus === 'unreplied') {
      matchStage.$and = [
        {
          $or: [{ repliedAt: { $exists: false } }, { repliedAt: null }],
        },
        {
          $or: [{ adminReply: { $exists: false } }, { adminReply: null }],
        },
      ];
    }

    if (hasImage === 1) {
      matchStage['images.0'] = { $exists: true };
    } else if (hasImage === 0) {
      matchStage['images.0'] = { $exists: false };
    }

    const pipeline: Record<string, unknown>[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ];

    if (reviewerKeyword?.trim()) {
      const keyword = reviewerKeyword.trim();
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: keyword, $options: 'i' } },
            { 'user.email': { $regex: keyword, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: this.purchaseOrderCollectionName,
          localField: 'purchaseOrderId',
          foreignField: '_id',
          as: 'purchaseOrder',
        },
      },
      {
        $unwind: {
          path: '$purchaseOrder',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'repliedBy',
          foreignField: '_id',
          as: 'replier',
        },
      },
      {
        $unwind: {
          path: '$replier',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          comment: 1,
          images: 1,
          score: 1,
          adminReply: 1,
          replyImages: 1,
          repliedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          purchaseOrderId: 1,
          userId: 1,
          user: { _id: '$user._id', name: '$user.name', email: '$user.email' },
          purchaseOrder: {
            _id: '$purchaseOrder._id',
            status: '$purchaseOrder.status',
            purchaseItems: '$purchaseOrder.purchaseItems',
            createdAt: '$purchaseOrder.createdAt',
          },
          repliedBy: {
            _id: '$replier._id',
            name: '$replier.name',
            email: '$replier.email',
          },
        },
      },
    );

    const [data, totalResult] = await Promise.all([
      this.feedbackProductModel
        .aggregate([
          ...(pipeline as any[]),
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ])
        .exec(),
      this.feedbackProductModel
        .aggregate([...(pipeline as any[]), { $count: 'total' }])
        .exec(),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async findByProductId(productId: number) {
    const orderIds = await this.purchaseOrderIdsContainingProduct(productId);
    return this.feedbackProductModel
      .find({ purchaseOrderId: { $in: orderIds }, isActive: true })
      .populate('userId', 'name email')
      .populate({
        path: 'purchaseOrderId',
        select: 'status purchaseItems createdAt',
      })
      .populate('repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserId(userId: string) {
    return this.feedbackProductModel
      .find({ userId: new Types.ObjectId(userId), isActive: true })
      .populate({
        path: 'purchaseOrderId',
        select: 'status purchaseItems createdAt',
      })
      .populate('repliedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUserAndProduct(userId: string, productId: number) {
    const orderIds = await this.purchaseOrderIdsContainingProductForUser(
      userId,
      productId,
    );
    return this.feedbackProductModel
      .find({
        userId: new Types.ObjectId(userId),
        purchaseOrderId: { $in: orderIds },
        isActive: true,
      })
      .populate({
        path: 'purchaseOrderId',
        select: 'status purchaseItems createdAt',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAverageByProductId(
    productId: number,
  ): Promise<{ average: number; count: number }> {
    const variants = productIdMatchValues(productId);
    const [stats] = await this.feedbackProductModel.aggregate([
      {
        $match: {
          isActive: true,
          score: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: this.purchaseOrderCollectionName,
          localField: 'purchaseOrderId',
          foreignField: '_id',
          as: 'po',
        },
      },
      { $unwind: '$po' },
      {
        $match: {
          'po.purchaseItems': {
            $elemMatch: { productId: { $in: variants } },
          },
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$score' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (!stats) {
      return { average: 0, count: 0 };
    }

    return {
      average: Math.round(stats.average * 10) / 10,
      count: stats.count,
    };
  }

  async reply(
    feedbackId: string,
    adminId: string,
    dto: ReplyFeedbackProductDto,
  ) {
    const feedback = await this.feedbackProductModel
      .findById(feedbackId)
      .exec();

    if (!feedback || !feedback.isActive) {
      throw new NotFoundException('Feedback not found');
    }

    if (feedback.adminReply || feedback.repliedAt) {
      throw new BadRequestException('This feedback has already been replied');
    }

    feedback.adminReply = dto.content;
    feedback.replyImages = dto.images ?? [];
    feedback.repliedBy = new Types.ObjectId(adminId);
    feedback.repliedAt = new Date();

    return feedback.save();
  }

  async removeFeedback(id: string, userId: string, role: Role) {
    const feedback = await this.feedbackProductModel.findById(id).exec();

    if (!feedback || !feedback.isActive) {
      throw new NotFoundException('Feedback not found');
    }

    const isOwner = feedback.userId.toString() === userId;
    const isAdmin = role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new BadRequestException('You can only delete your own feedback');
    }

    const purchaseOrderId = feedback.purchaseOrderId;
    feedback.isActive = false;
    await feedback.save();

    await this.syncRatingStatsForProductsInPurchaseOrder(purchaseOrderId);

    return { message: 'Feedback deleted successfully' };
  }

  private async purchaseOrderIdsContainingProduct(
    productId: number,
  ): Promise<Types.ObjectId[]> {
    const variants = productIdMatchValues(productId);
    const rows = await this.purchaseOrderModel
      .find({
        'purchaseItems.productId': { $in: variants },
      } as QueryFilter<PurchaseOrderDocument>)
      .select('_id')
      .lean()
      .exec();
    return rows.map((r) => r._id);
  }

  private async purchaseOrderIdsContainingProductForUser(
    userId: string,
    productId: number,
  ): Promise<Types.ObjectId[]> {
    const variants = productIdMatchValues(productId);
    const rows = await this.purchaseOrderModel
      .find({
        userId,
        'purchaseItems.productId': { $in: variants },
      } as QueryFilter<PurchaseOrderDocument>)
      .select('_id')
      .lean()
      .exec();
    return rows.map((r) => r._id);
  }

  private async assertUserOwnsDeliverablePurchaseOrder(
    userId: string,
    purchaseOrderId: string,
  ): Promise<void> {
    const order = await this.purchaseOrderModel
      .findById(purchaseOrderId)
      .lean()
      .exec();

    if (!order) {
      throw new BadRequestException('Purchase order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException(
        'Only the owner of this purchase order can leave feedback',
      );
    }

    const status = order.status;
    if (
      status !== PurchaseOrderStatus.CONFIRMED &&
      status !== PurchaseOrderStatus.SHIPPED &&
      status !== PurchaseOrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Feedback is only allowed for confirmed, shipped, or delivered orders',
      );
    }
  }

  private async syncRatingStatsForProductsInPurchaseOrder(
    purchaseOrderId: Types.ObjectId | string,
  ): Promise<void> {
    const order = await this.purchaseOrderModel
      .findById(purchaseOrderId)
      .lean()
      .exec();
    if (!order?.purchaseItems?.length) {
      return;
    }

    const productIds = new Set<number>();
    for (const item of order.purchaseItems) {
      const pid = Number((item as { productId?: unknown }).productId);
      if (!Number.isNaN(pid)) {
        productIds.add(pid);
      }
    }

    await Promise.all(
      [...productIds].map((id) => this.syncProductRatingStats(id)),
    );
  }

  private async syncProductRatingStats(productId: number): Promise<void> {
    const variants = productIdMatchValues(productId);
    const [stats] = await this.feedbackProductModel.aggregate([
      {
        $match: {
          isActive: true,
          score: { $exists: true, $ne: null },
        },
      },
      {
        $lookup: {
          from: this.purchaseOrderCollectionName,
          localField: 'purchaseOrderId',
          foreignField: '_id',
          as: 'po',
        },
      },
      { $unwind: '$po' },
      {
        $match: {
          'po.purchaseItems': {
            $elemMatch: { productId: { $in: variants } },
          },
        },
      },
      {
        $group: {
          _id: null,
          average: { $avg: '$score' },
          count: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats?.average
      ? Math.round(stats.average * 10) / 10
      : 0;
    const ratingCount = stats?.count ?? 0;

    await this.productModel
      .updateOne(
        { _id: productId },
        {
          $set: {
            averageRating,
            ratingCount,
          },
        },
      )
      .exec();
  }
}
