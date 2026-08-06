import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReportingService } from 'src/reporting/reporting.service';
import { CrmLeadOutboxService } from 'src/crm-lead-outbox/crm-lead-outbox.service';
import { CrmLeadOutboxWorker } from 'src/crm-lead-outbox/crm-lead-outbox.worker';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderStatus } from 'src/common/enums/purchase-order.enum';

/**
 * Test khóa hành vi wiring outbox (plan 38-04):
 * - Đơn pending (chuyển đổi) → enqueue lead in-tx với mã SP + doanh thu đúng.
 * - Giỏ (cart) chưa chuyển đổi → KHÔNG enqueue.
 * - FAIL-SAFE (open-q1 CONTEXT / T-38-14): lỗi bắn webhook (triggerFlushSoon throw)
 *   KHÔNG bao giờ làm fail request đặt hàng — khách vẫn đặt được, worker nền gửi lại.
 *   (Lỗi INSERT outbox cùng tx là ranh giới at-least-once hiếm, chấp nhận rollback cả
 *    2 — không mất lead; ở đây khóa nhánh QUAN TRỌNG: lỗi GỬI không chặn khách.)
 */

const PROD_ID = '11111111-1111-4111-8111-111111111111';
const OV_ID = '22222222-2222-4222-8222-222222222222';
const ORDER_ID = '33333333-3333-4333-8333-333333333333';
const VARIANT_CODE = 'TT-06-DASAC';
const ORDER_SUMMARY_PRICE = 200000;

function buildCreatedOrder() {
  return {
    id: ORDER_ID,
    createdAt: new Date('2026-08-05T00:00:00Z'),
    summaryPrice: ORDER_SUMMARY_PRICE,
    nonLoginUserEmail: null,
    address: {
      name: 'Nguyễn Văn A',
      phoneNumber: '0900000000',
      address: '12 Lê Lợi, Q1',
    },
    visitorId: '44444444-4444-4444-8444-444444444444',
    camp: 'S01-A',
    utm: { utm_source: 'facebook' },
    // Snapshot biến thể lưu trên purchaseItem → builder lấy code từ đây
    purchaseItems: [{ productOptionValue: { code: VARIANT_CODE } }],
  };
}

// Mock PrismaService: findUnique (ngoài tx) + $transaction chạy callback với tx giả.
function buildPrismaMock() {
  const createdOrder = buildCreatedOrder();
  const tx = {
    purchaseOrder: { create: jest.fn().mockResolvedValue(createdOrder) },
    // applyInventoryDelta khi trừ kho cần updateMany trả count > 0 (đủ hàng)
    optionValue: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    product: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
  return {
    // buildPurchaseItemSnapshots gọi trước tx: product + optionValue (có code + price)
    product: {
      findUnique: jest.fn().mockResolvedValue({ id: PROD_ID, stock: 10 }),
    },
    optionValue: {
      findUnique: jest.fn().mockResolvedValue({
        id: OV_ID,
        code: VARIANT_CODE,
        price: 100000,
        productId: PROD_ID,
        stock: 10,
      }),
    },
    $transaction: jest.fn(async (cb: (tx: unknown) => unknown) => cb(tx)),
    __tx: tx,
    __createdOrder: createdOrder,
  };
}

function buildDto(status: PurchaseOrderStatus): CreatePurchaseOrderDto {
  return {
    purchaseItems: [{ productId: PROD_ID, productOptionValueId: OV_ID, count: 2 }],
    address: {
      name: 'Nguyễn Văn A',
      phoneNumber: '0900000000',
      address: '12 Lê Lợi, Q1',
    },
    status,
  } as CreatePurchaseOrderDto;
}

describe('PurchaseOrdersService — wiring outbox lead (38-04)', () => {
  let service: PurchaseOrdersService;
  let prisma: ReturnType<typeof buildPrismaMock>;
  let outbox: { enqueue: jest.Mock };
  let worker: { triggerFlushSoon: jest.Mock };
  let reporting: { syncByOrderDate: jest.Mock };

  beforeEach(async () => {
    prisma = buildPrismaMock();
    outbox = { enqueue: jest.fn().mockResolvedValue(undefined) };
    worker = { triggerFlushSoon: jest.fn() };
    reporting = { syncByOrderDate: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseOrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: ReportingService, useValue: reporting },
        { provide: CrmLeadOutboxService, useValue: outbox },
        { provide: CrmLeadOutboxWorker, useValue: worker },
      ],
    }).compile();

    service = module.get<PurchaseOrdersService>(PurchaseOrdersService);
  });

  it('Case 1: đơn pending → enqueue lead in-tx với mã SP + doanh thu, bắn flush sau commit', async () => {
    const result = await service.createPurchaseOrder(
      buildDto(PurchaseOrderStatus.PENDING),
      null,
    );

    // enqueue gọi đúng 1 lần, đúng tx của $transaction (không mở tx mới)
    expect(outbox.enqueue).toHaveBeenCalledTimes(1);
    const [txArg, input] = outbox.enqueue.mock.calls[0];
    expect(txArg).toBe(prisma.__tx);
    expect(input.sourceKind).toBe('order');
    expect(input.sourceId).toBe(ORDER_ID);
    // payload đủ mã biến thể (D-06) + doanh thu = summaryPrice (D-10) + attribution (D-09)
    expect(input.payload.productCodes).toEqual([VARIANT_CODE]);
    expect(input.payload.summaryPriceVnd).toBe(ORDER_SUMMARY_PRICE);
    expect(input.payload.camp).toBe('S01-A');
    expect(input.payload.phone).toBe('0900000000');

    // Đơn vẫn trả về bình thường
    expect(result.id).toBe(ORDER_ID);
  });

  it('Case 2: status cart → KHÔNG enqueue (giỏ chưa phải chuyển đổi), không bắn flush', async () => {
    await service.createPurchaseOrder(buildDto(PurchaseOrderStatus.CART), null);

    expect(outbox.enqueue).not.toHaveBeenCalled();
    expect(worker.triggerFlushSoon).not.toHaveBeenCalled();
  });

  it('Case 3: FAIL-SAFE — triggerFlushSoon throw KHÔNG làm fail đơn (khách vẫn đặt được)', async () => {
    worker.triggerFlushSoon.mockImplementation(() => {
      throw new Error('CRM/worker chết');
    });

    // Không được throw ra ngoài — đơn vẫn tạo thành công
    const result = await service.createPurchaseOrder(
      buildDto(PurchaseOrderStatus.PENDING),
      null,
    );

    expect(result.id).toBe(ORDER_ID);
    expect(worker.triggerFlushSoon).toHaveBeenCalledTimes(1);
    // enqueue (INSERT cùng tx) vẫn chạy — lead đã xếp hàng, worker nền sẽ gửi lại
    expect(outbox.enqueue).toHaveBeenCalledTimes(1);
  });

  it('Case 4: worker.triggerFlushSoon được gọi sau khi tạo đơn pending thành công', async () => {
    await service.createPurchaseOrder(
      buildDto(PurchaseOrderStatus.PENDING),
      null,
    );

    expect(worker.triggerFlushSoon).toHaveBeenCalledTimes(1);
    // Gọi SAU commit: enqueue (trong tx) phải xảy ra trước trigger (ngoài tx)
    const enqueueOrder = outbox.enqueue.mock.invocationCallOrder[0];
    const triggerOrder = worker.triggerFlushSoon.mock.invocationCallOrder[0];
    expect(triggerOrder).toBeGreaterThan(enqueueOrder);
  });
});
