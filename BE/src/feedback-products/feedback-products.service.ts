import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isUUID } from 'class-validator';
import { CreateFeedbackProductDto } from './dto/create-feedback-product.dto';
import { AdminCreateFeedbackProductDto } from './dto/admin-create-feedback-product.dto';
import { AdminUpdateFeedbackProductDto } from './dto/admin-update-feedback-product.dto';
import { Role } from 'src/common/enums/role.enum';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReplyFeedbackProductDto } from './dto/reply-feedback-product.dto';
import { QueryFeedbackManagementDto } from './dto/query-feedback-management.dto';

const USER_SELECT = { id: true, name: true, email: true };
const ORDER_SELECT = {
  id: true,
  status: true,
  createdAt: true,
  purchaseItems: true,
};

const FEEDBACK_INCLUDE = {
  user: { select: USER_SELECT },
  order: { select: ORDER_SELECT },
  replier: { select: USER_SELECT },
  product: { select: { id: true, name: true } },
};

// Shape cho route CÔNG KHAI (findAll, findByProductId): KHÔNG lộ email người mua
// và không lộ mã đơn/ngày mua. Chỉ giữ tên (FE mask lại) + các dòng hàng để hiển
// thị "đã mua biến thể nào". USER_SELECT/ORDER_SELECT đầy đủ chỉ dùng cho route admin.
const PUBLIC_USER_SELECT = { id: true, name: true };
const PUBLIC_ORDER_SELECT = {
  id: true,
  purchaseItems: true,
};

const PUBLIC_FEEDBACK_INCLUDE = {
  user: { select: PUBLIC_USER_SELECT },
  order: { select: PUBLIC_ORDER_SELECT },
  replier: { select: PUBLIC_USER_SELECT },
  product: { select: { id: true, name: true } },
};

/** Feedback thuộc về sản phẩm: gắn trực tiếp (admin tạo) hoặc qua đơn hàng chứa sản phẩm. */
const belongsToProduct = (
  productId: string,
): Prisma.FeedbackProductWhereInput => ({
  OR: [
    { productId },
    { order: { purchaseItems: { some: { productId } } } },
  ],
});

@Injectable()
export class FeedbackProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Giả lập populate kiểu Mongoose: gán object vào userId/purchaseOrderId/repliedBy. */
  private populatedShape(fb: any) {
    const { user, order, replier, product, ...rest } = fb;
    return {
      ...rest,
      userId: user ?? rest.userId,
      purchaseOrderId: order ?? rest.purchaseOrderId,
      repliedBy: replier ?? rest.repliedBy,
    };
  }

  /** Shape cho trang quản trị: dùng key user/purchaseOrder/repliedBy. */
  private managementShape(fb: any) {
    const { user, order, replier, product, ...rest } = fb;
    return {
      ...rest,
      user: user ?? undefined,
      purchaseOrder: order ?? undefined,
      repliedBy: replier ?? undefined,
      // Sản phẩm của feedback admin tạo (FE hiển thị tên sản phẩm ở trang quản trị)
      seededProduct: product ?? undefined,
    };
  }

  async createOrUpdateFeedback(userId: string, dto: CreateFeedbackProductDto) {
    if (!dto.comment && dto.score === undefined && !dto.images?.length) {
      throw new BadRequestException(
        'Feedback must include comment, score, or images',
      );
    }

    await this.assertUserOwnsDeliverablePurchaseOrder(
      userId,
      dto.purchaseOrderId,
    );

    const feedback = await this.prisma.feedbackProduct.upsert({
      where: {
        userId_purchaseOrderId: {
          userId,
          purchaseOrderId: dto.purchaseOrderId,
        },
      },
      update: {
        score: dto.score,
        isActive: true,
        ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
        ...(dto.images !== undefined ? { images: dto.images } : {}),
      },
      create: {
        userId,
        purchaseOrderId: dto.purchaseOrderId,
        score: dto.score,
        isActive: true,
        comment: dto.comment,
        images: dto.images ?? [],
      },
    });

    await Promise.all([
      this.prisma.purchaseOrder.update({
        where: { id: dto.purchaseOrderId },
        data: { isFeedbacked: true },
      }),
      this.syncRatingStatsForProductsInPurchaseOrder(dto.purchaseOrderId),
    ]);

    return feedback;
  }

  async findAll() {
    const rows = await this.prisma.feedbackProduct.findMany({
      where: { isActive: true },
      include: PUBLIC_FEEDBACK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.populatedShape(r));
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

    const where: Prisma.FeedbackProductWhereInput = { isActive: true };
    if (score !== undefined) where.score = score;

    if (replyStatus === 'replied') {
      where.OR = [{ repliedAt: { not: null } }, { adminReply: { not: null } }];
    } else if (replyStatus === 'unreplied') {
      where.AND = [{ repliedAt: null }, { adminReply: null }];
    }

    if (hasImage === 1) where.images = { isEmpty: false };
    else if (hasImage === 0) where.images = { isEmpty: true };

    if (reviewerKeyword?.trim()) {
      const kw = reviewerKeyword.trim();
      // Tìm theo user thật hoặc displayName của feedback admin tạo
      const reviewerFilter: Prisma.FeedbackProductWhereInput = {
        OR: [
          { user: { name: { contains: kw, mode: 'insensitive' } } },
          { user: { email: { contains: kw, mode: 'insensitive' } } },
          { displayName: { contains: kw, mode: 'insensitive' } },
        ],
      };
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        reviewerFilter,
      ];
    }

    const [rows, total] = await Promise.all([
      this.prisma.feedbackProduct.findMany({
        where,
        include: FEEDBACK_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedbackProduct.count({ where }),
    ]);

    return {
      data: rows.map((r) => this.managementShape(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 0,
    };
  }

  async findByProductId(productId: string) {
    const rows = await this.prisma.feedbackProduct.findMany({
      where: {
        isActive: true,
        ...belongsToProduct(productId),
      },
      include: PUBLIC_FEEDBACK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.populatedShape(r));
  }

  async findByUserId(userId: string) {
    const rows = await this.prisma.feedbackProduct.findMany({
      where: { userId, isActive: true },
      include: FEEDBACK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.populatedShape(r));
  }

  async findByUserAndProduct(userId: string, productId: string) {
    const rows = await this.prisma.feedbackProduct.findMany({
      where: {
        userId,
        isActive: true,
        order: { purchaseItems: { some: { productId } } },
      },
      include: FEEDBACK_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.populatedShape(r));
  }

  /** Admin tạo feedback gắn thẳng sản phẩm (migrate từ hệ cũ / tạo mới để marketing). */
  async adminCreateFeedback(dto: AdminCreateFeedbackProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const feedback = await this.prisma.feedbackProduct.create({
      data: {
        productId: dto.productId,
        score: dto.score,
        comment: dto.comment,
        images: dto.images ?? [],
        displayName: dto.displayName,
        isAdminCreated: true,
        isActive: true,
      },
    });

    await this.syncProductRatingStats(dto.productId);
    return feedback;
  }

  /** Admin sửa nội dung một feedback bất kỳ. */
  async adminUpdateFeedback(
    feedbackId: string,
    dto: AdminUpdateFeedbackProductDto,
  ) {
    const feedback = await this.prisma.feedbackProduct.findUnique({
      where: { id: feedbackId },
    });
    if (!feedback || !feedback.isActive) {
      throw new NotFoundException('Feedback not found');
    }

    const updated = await this.prisma.feedbackProduct.update({
      where: { id: feedbackId },
      data: {
        ...(dto.score !== undefined ? { score: dto.score } : {}),
        ...(dto.comment !== undefined ? { comment: dto.comment } : {}),
        ...(dto.images !== undefined ? { images: dto.images } : {}),
        ...(dto.displayName !== undefined
          ? { displayName: dto.displayName }
          : {}),
      },
    });

    await this.syncRatingStatsForFeedback(updated);
    return updated;
  }

  async getAverageByProductId(
    productId: string,
  ): Promise<{ average: number; count: number }> {
    const stats = await this.prisma.feedbackProduct.aggregate({
      where: {
        isActive: true,
        score: { not: null },
        ...belongsToProduct(productId),
      },
      _avg: { score: true },
      _count: { _all: true },
    });

    const avg = stats._avg.score ?? 0;
    return {
      average: Math.round(avg * 10) / 10,
      count: stats._count._all,
    };
  }

  async reply(feedbackId: string, adminId: string, dto: ReplyFeedbackProductDto) {
    const feedback = await this.prisma.feedbackProduct.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback || !feedback.isActive) {
      throw new NotFoundException('Feedback not found');
    }

    if (feedback.adminReply || feedback.repliedAt) {
      throw new BadRequestException('This feedback has already been replied');
    }

    return this.prisma.feedbackProduct.update({
      where: { id: feedbackId },
      data: {
        adminReply: dto.content,
        replyImages: dto.images ?? [],
        repliedBy: adminId,
        repliedAt: new Date(),
      },
    });
  }

  async removeFeedback(id: string, userId: string, role: Role) {
    const feedback = await this.prisma.feedbackProduct.findUnique({
      where: { id },
    });

    if (!feedback || !feedback.isActive) {
      throw new NotFoundException('Feedback not found');
    }

    const isOwner = feedback.userId !== null && feedback.userId === userId;
    const isAdmin = role === Role.ADMIN;

    if (!isOwner && !isAdmin) {
      throw new BadRequestException('You can only delete your own feedback');
    }

    await this.prisma.feedbackProduct.update({
      where: { id },
      data: { isActive: false },
    });

    await this.syncRatingStatsForFeedback(feedback);

    return { message: 'Feedback deleted successfully' };
  }

  /** Đồng bộ lại điểm trung bình cho (các) sản phẩm mà feedback này thuộc về. */
  private async syncRatingStatsForFeedback(feedback: {
    productId: string | null;
    purchaseOrderId: string | null;
  }): Promise<void> {
    if (feedback.productId) {
      await this.syncProductRatingStats(feedback.productId);
    }
    if (feedback.purchaseOrderId) {
      await this.syncRatingStatsForProductsInPurchaseOrder(
        feedback.purchaseOrderId,
      );
    }
  }

  private async assertUserOwnsDeliverablePurchaseOrder(
    userId: string,
    purchaseOrderId: string,
  ): Promise<void> {
    if (!isUUID(purchaseOrderId)) {
      throw new BadRequestException('Purchase order not found');
    }

    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
    });

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
    purchaseOrderId: string,
  ): Promise<void> {
    const items = await this.prisma.purchaseItem.findMany({
      where: { orderId: purchaseOrderId },
      select: { productId: true },
    });
    const productIds = [...new Set(items.map((i) => i.productId))];

    await Promise.all(
      productIds.map((id) => this.syncProductRatingStats(id)),
    );
  }

  private async syncProductRatingStats(productId: string): Promise<void> {
    const stats = await this.prisma.feedbackProduct.aggregate({
      where: {
        isActive: true,
        score: { not: null },
        ...belongsToProduct(productId),
      },
      _avg: { score: true },
      _count: { _all: true },
    });

    const averageRating = stats._avg.score
      ? Math.round(stats._avg.score * 10) / 10
      : 0;
    const ratingCount = stats._count._all ?? 0;

    await this.prisma.product.updateMany({
      where: { id: productId },
      data: { averageRating, ratingCount },
    });
  }
}
