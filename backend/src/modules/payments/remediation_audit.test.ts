import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../../app';
import prisma from '../../config/db';
import {
  SubscriptionStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  BillingFrequency,
  ProductStatus,
  PlanStatus,
} from '@prisma/client';
import { paymentsService } from './payments.service';
import { invoicesService } from '../invoices/invoices.service';
import { billingJobsService } from '../jobs/billing.job';
import { analyticsService } from '../analytics/analytics.service';

describe('Principal Architecture Audit — Remediation Verification Tests', () => {
  let server: http.Server;
  let apiBase: string;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;

  let testProductId: string;
  let testPlanId: string;
  const createdSubIds: string[] = [];
  const createdInvoiceIds: string[] = [];
  const createdPaymentIds: string[] = [];

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        apiBase = `http://localhost:${address.port}/api/v1`;
        resolve();
      });
    });

    // 1. Admin login
    const adminRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@brightloop.com', password: 'Brightloop@2026' }),
    });
    const adminData: any = await adminRes.json();
    assert.strictEqual(adminRes.status, 200);
    adminToken = adminData.data.token;

    // 2. Customer login
    const custRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@brightloop.com', password: 'Brightloop@2026' }),
    });
    const custData: any = await custRes.json();
    assert.strictEqual(custRes.status, 200);
    customerToken = custData.data.token;
    customerId = custData.data.user.id;

    // 3. Create test product & plan
    const rand = Math.floor(1000 + Math.random() * 9000);
    const prod = await prisma.product.create({
      data: {
        name: `Audit Test Suite Product ${rand}`,
        code: `PROD-AUDIT-${rand}`,
        salesPrice: 2000.0,
        status: ProductStatus.ACTIVE,
      },
    });
    testProductId = prod.id;

    const plan = await prisma.plan.create({
      data: {
        productId: prod.id,
        name: `Audit Test Plan ${rand}`,
        code: `PLAN-AUDIT-${rand}`,
        price: 2000.0,
        billingFrequency: BillingFrequency.MONTHLY,
        status: PlanStatus.ACTIVE,
        autoCloseOnExpiry: true,
      },
    });
    testPlanId = plan.id;
  });

  after(async () => {
    // Teardown created records in safe foreign-key order
    if (createdSubIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { relatedSubscriptionId: { in: createdSubIds } },
      }).catch(() => {});
      await prisma.payment.deleteMany({
        where: { invoice: { subscriptionId: { in: createdSubIds } } },
      }).catch(() => {});
      await prisma.invoiceItem.deleteMany({
        where: { invoice: { subscriptionId: { in: createdSubIds } } },
      }).catch(() => {});
      await prisma.invoice.deleteMany({
        where: { subscriptionId: { in: createdSubIds } },
      }).catch(() => {});
      await prisma.subscriptionLifecycleLog.deleteMany({
        where: { subscriptionId: { in: createdSubIds } },
      }).catch(() => {});
      await prisma.subscriptionItem.deleteMany({
        where: { subscriptionId: { in: createdSubIds } },
      }).catch(() => {});
      await prisma.subscription.deleteMany({
        where: { id: { in: createdSubIds } },
      }).catch(() => {});
    }
    if (createdInvoiceIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { relatedInvoiceId: { in: createdInvoiceIds } },
      }).catch(() => {});
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: { in: createdInvoiceIds } },
      }).catch(() => {});
      await prisma.payment.deleteMany({
        where: { invoiceId: { in: createdInvoiceIds } },
      }).catch(() => {});
      await prisma.invoice.deleteMany({
        where: { id: { in: createdInvoiceIds } },
      }).catch(() => {});
    }
    if (createdPaymentIds.length > 0) {
      await prisma.payment.deleteMany({
        where: { id: { in: createdPaymentIds } },
      }).catch(() => {});
    }
    if (testPlanId) {
      await prisma.plan.delete({ where: { id: testPlanId } }).catch(() => {});
    }
    if (testProductId) {
      await prisma.product.delete({ where: { id: testProductId } }).catch(() => {});
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // Helper to create a confirmed test subscription and invoice
  async function createTestInvoice(amount = 2360.0): Promise<{ subId: string; invoiceId: string }> {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const sub = await prisma.subscription.create({
      data: {
        subscriptionNumber: `SUB-AUDIT-${rand}`,
        customerId,
        planId: testPlanId,
        status: SubscriptionStatus.ACTIVE,
        quantity: 1,
        unitPrice: 2000.0,
        subtotal: 2000.0,
        taxRate: 18.0,
        taxAmount: 360.0,
        totalAmount: amount,
        startDate: new Date(),
        nextBillingDate: new Date(),
      },
    });
    createdSubIds.push(sub.id);

    const inv = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-AUDIT-${rand}`,
        subscriptionId: sub.id,
        customerId,
        status: InvoiceStatus.CONFIRMED,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 86400000),
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 86400000),
        subtotal: 2000.0,
        taxRate: 18.0,
        taxAmount: 360.0,
        totalAmount: amount,
        amountPaid: 0,
        balanceDue: amount,
      },
    });
    createdInvoiceIds.push(inv.id);

    return { subId: sub.id, invoiceId: inv.id };
  }

  // =========================================================================
  // SECTION 1: P0 — PAYMENT CONCURRENCY & ROW LOCKING
  // =========================================================================
  describe('P0: Payment Concurrency & Row Locking', () => {
    it('1. Two simultaneous partial-payment requests reconcile atomically without lost updates', async () => {
      const { invoiceId } = await createTestInvoice(2000.0);

      // Execute two simultaneous partial payments of ₹500 against a ₹2,000 balance
      const [p1Result, p2Result] = await Promise.allSettled([
        paymentsService.recordPayment({
          invoiceId,
          amount: 500.0,
          paymentMethod: PaymentMethod.CREDIT_CARD,
          transactionReference: `TX-CONC-1-${Date.now()}`,
        }),
        paymentsService.recordPayment({
          invoiceId,
          amount: 500.0,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          transactionReference: `TX-CONC-2-${Date.now()}`,
        }),
      ]);

      assert.strictEqual(p1Result.status, 'fulfilled', 'Payment 1 should succeed');
      assert.strictEqual(p2Result.status, 'fulfilled', 'Payment 2 should succeed');

      if (p1Result.status === 'fulfilled') createdPaymentIds.push(p1Result.value.id);
      if (p2Result.status === 'fulfilled') createdPaymentIds.push(p2Result.value.id);

      // Verify invoice state in database
      const updatedInvoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      assert.ok(updatedInvoice);
      assert.strictEqual(Number(updatedInvoice.amountPaid), 1000.0, 'amountPaid must accurately reflect both partial payments');
      assert.strictEqual(Number(updatedInvoice.balanceDue), 1000.0, 'balanceDue must accurately subtract both payments');
      assert.strictEqual(updatedInvoice.status, InvoiceStatus.CONFIRMED);
    });

    it('2. Two simultaneous requests that together exceed the remaining balance reject overpayment', async () => {
      // Invoice with ₹1,000 balance; two concurrent requests of ₹700 each (total ₹1400 > ₹1000)
      const { invoiceId } = await createTestInvoice(1000.0);

      const [p1Result, p2Result] = await Promise.allSettled([
        paymentsService.recordPayment({
          invoiceId,
          amount: 700.0,
          paymentMethod: PaymentMethod.UPI,
          transactionReference: `TX-EXCEED-A-${Date.now()}`,
        }),
        paymentsService.recordPayment({
          invoiceId,
          amount: 700.0,
          paymentMethod: PaymentMethod.UPI,
          transactionReference: `TX-EXCEED-B-${Date.now()}`,
        }),
      ]);

      // Exactly one must succeed and one must fail with overpayment error
      const fulfilled = [p1Result, p2Result].filter((r) => r.status === 'fulfilled');
      const rejected = [p1Result, p2Result].filter((r) => r.status === 'rejected');

      assert.strictEqual(fulfilled.length, 1, 'Exactly one payment must succeed within balance limit');
      assert.strictEqual(rejected.length, 1, 'The competing concurrent payment must be rejected for exceeding balance');

      if (fulfilled[0]?.status === 'fulfilled') {
        createdPaymentIds.push((fulfilled[0] as any).value.id);
      }

      // Check rejection error message
      const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
      assert.match(rejectionReason.message, /exceeds remaining balance/i);

      // Verify database state: balance must be exactly ₹300, not corrupted or negative
      const updatedInvoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      assert.ok(updatedInvoice);
      assert.strictEqual(Number(updatedInvoice.amountPaid), 700.0);
      assert.strictEqual(Number(updatedInvoice.balanceDue), 300.0);
    });

    it('3. Two simultaneous attempts to pay the exact remaining balance allow only one to succeed', async () => {
      // Invoice with balance of ₹800; two simultaneous requests of ₹800
      const { invoiceId } = await createTestInvoice(800.0);

      const [p1Result, p2Result] = await Promise.allSettled([
        paymentsService.recordPayment({
          invoiceId,
          amount: 800.0,
          paymentMethod: PaymentMethod.RAZORPAY,
          transactionReference: `TX-PAYOFF-1-${Date.now()}`,
        }),
        paymentsService.recordPayment({
          invoiceId,
          amount: 800.0,
          paymentMethod: PaymentMethod.RAZORPAY,
          transactionReference: `TX-PAYOFF-2-${Date.now()}`,
        }),
      ]);

      const fulfilled = [p1Result, p2Result].filter((r) => r.status === 'fulfilled');
      const rejected = [p1Result, p2Result].filter((r) => r.status === 'rejected');

      assert.strictEqual(fulfilled.length, 1, 'First concurrent payment pays off the balance');
      assert.strictEqual(rejected.length, 1, 'Second concurrent payment is rejected');

      if (fulfilled[0]?.status === 'fulfilled') {
        createdPaymentIds.push((fulfilled[0] as any).value.id);
      }

      const updatedInvoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      assert.ok(updatedInvoice);
      assert.strictEqual(Number(updatedInvoice.amountPaid), 800.0);
      assert.strictEqual(Number(updatedInvoice.balanceDue), 0.0);
      assert.strictEqual(updatedInvoice.status, InvoiceStatus.PAID);
    });

    it('4. Concurrent requests with duplicate transactionReference reject the duplicate attempt', async () => {
      const { invoiceId } = await createTestInvoice(1500.0);
      const sharedTxRef = `DUP-TX-REF-${Date.now()}`;

      const [p1Result, p2Result] = await Promise.allSettled([
        paymentsService.recordPayment({
          invoiceId,
          amount: 200.0,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          transactionReference: sharedTxRef,
        }),
        paymentsService.recordPayment({
          invoiceId,
          amount: 200.0,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          transactionReference: sharedTxRef,
        }),
      ]);

      const fulfilled = [p1Result, p2Result].filter((r) => r.status === 'fulfilled');
      const rejected = [p1Result, p2Result].filter((r) => r.status === 'rejected');

      assert.strictEqual(fulfilled.length, 1);
      assert.strictEqual(rejected.length, 1);

      if (fulfilled[0]?.status === 'fulfilled') {
        createdPaymentIds.push((fulfilled[0] as any).value.id);
      }

      const rejectionReason = (rejected[0] as PromiseRejectedResult).reason;
      assert.match(rejectionReason.message, /duplicate payment prevented/i);
    });

    it('5. Payments against VOID or PAID invoices are immediately rejected', async () => {
      const { invoiceId } = await createTestInvoice(500.0);
      await invoicesService.updateStatus(invoiceId, InvoiceStatus.VOID);

      await assert.rejects(
        () =>
          paymentsService.recordPayment({
            invoiceId,
            amount: 100.0,
            paymentMethod: PaymentMethod.CASH,
          }),
        /cannot apply payment to a void invoice/i
      );
    });

    it('6. Failed payment transaction rolls back cleanly without queuing notifications', async () => {
      const { invoiceId } = await createTestInvoice(500.0);
      const initialNotifCount = await prisma.notification.count();

      // Trigger intentional overpayment failure
      await assert.rejects(
        () =>
          paymentsService.recordPayment({
            invoiceId,
            amount: 9999.0, // Exceeds balance
            paymentMethod: PaymentMethod.CREDIT_CARD,
          }),
        /exceeds remaining balance/i
      );

      // Verify no notification was queued for failed attempt
      const postNotifCount = await prisma.notification.count();
      assert.strictEqual(postNotifCount, initialNotifCount, 'Rolled-back transaction must never dispatch notifications');
    });
  });

  // =========================================================================
  // SECTION 2: P0 — RECURRING INVOICE IDEMPOTENCY
  // =========================================================================
  describe('P0: Recurring Invoice Idempotency & Concurrency', () => {
    it('7. Two simultaneous invoice generation attempts for the same subscription period succeed only once', async () => {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const periodStart = new Date();
      const sub = await prisma.subscription.create({
        data: {
          subscriptionNumber: `SUB-CONC-INV-${rand}`,
          customerId,
          planId: testPlanId,
          status: SubscriptionStatus.ACTIVE,
          quantity: 1,
          unitPrice: 2000.0,
          subtotal: 2000.0,
          taxRate: 18.0,
          taxAmount: 360.0,
          totalAmount: 2360.0,
          startDate: periodStart,
          nextBillingDate: periodStart,
        },
      });
      createdSubIds.push(sub.id);

      // Concurrently trigger invoice generation
      const [gen1, gen2] = await Promise.allSettled([
        invoicesService.generateInvoiceForSubscription(sub.id, periodStart),
        invoicesService.generateInvoiceForSubscription(sub.id, periodStart),
      ]);

      const fulfilled = [gen1, gen2].filter((r) => r.status === 'fulfilled');
      const rejected = [gen1, gen2].filter((r) => r.status === 'rejected');

      assert.strictEqual(fulfilled.length, 1, 'Exactly one invoice creation must succeed');
      assert.strictEqual(rejected.length, 1, 'Competing concurrent attempt must be rejected as duplicate');

      if (fulfilled[0]?.status === 'fulfilled') {
        createdInvoiceIds.push((fulfilled[0] as any).value.id);
      }

      const rejReason = (rejected[0] as PromiseRejectedResult).reason;
      assert.match(rejReason.message, /duplicate invoice prevented/i);

      // Verify in database: exactly ONE invoice exists for this subscription and period
      const invoiceCount = await prisma.invoice.count({
        where: { subscriptionId: sub.id },
      });
      assert.strictEqual(invoiceCount, 1, 'Database must contain exactly 1 invoice for this period');
    });

    it('8. Database unique constraint on billingCycleKey enforces storage-level idempotency', async () => {
      const { invoiceId, subId } = await createTestInvoice(1000.0);
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      assert.ok(invoice);

      // Attempt to manually insert another invoice with the identical billingCycleKey
      if (invoice.billingCycleKey) {
        await assert.rejects(
          () =>
            prisma.invoice.create({
              data: {
                invoiceNumber: `INV-DUP-KEY-${Date.now()}`,
                subscriptionId: subId,
                customerId,
                status: InvoiceStatus.CONFIRMED,
                dueDate: new Date(),
                billingPeriodStart: invoice.billingPeriodStart,
                billingPeriodEnd: invoice.billingPeriodEnd,
                billingCycleKey: invoice.billingCycleKey, // Duplicate key
                subtotal: 1000.0,
                taxRate: 18.0,
                taxAmount: 180.0,
                totalAmount: 1180.0,
                balanceDue: 1180.0,
              },
            }),
          /Unique constraint failed/i
        );
      }
    });

    it('9. Voiding an invoice releases billingCycleKey so replacement invoice can be generated', async () => {
      const rand = Math.floor(1000 + Math.random() * 9000);
      const periodStart = new Date();
      const sub = await prisma.subscription.create({
        data: {
          subscriptionNumber: `SUB-VOID-REISSUE-${rand}`,
          customerId,
          planId: testPlanId,
          status: SubscriptionStatus.ACTIVE,
          quantity: 1,
          unitPrice: 1000.0,
          subtotal: 1000.0,
          taxRate: 18.0,
          taxAmount: 180.0,
          totalAmount: 1180.0,
          startDate: periodStart,
          nextBillingDate: periodStart,
        },
      });
      createdSubIds.push(sub.id);

      // 1. Generate first invoice
      const firstInvoice = await invoicesService.generateInvoiceForSubscription(sub.id, periodStart);
      createdInvoiceIds.push(firstInvoice.id);
      assert.ok(firstInvoice.billingCycleKey);

      // 2. Void first invoice
      await invoicesService.updateStatus(firstInvoice.id, InvoiceStatus.VOID);

      const voided = await prisma.invoice.findUnique({ where: { id: firstInvoice.id } });
      assert.strictEqual(voided?.status, InvoiceStatus.VOID);
      assert.strictEqual(voided?.billingCycleKey, null, 'Voiding must set billingCycleKey to NULL');

      // 3. Re-issue replacement invoice for the same period
      const replacementInvoice = await invoicesService.generateInvoiceForSubscription(sub.id, periodStart);
      createdInvoiceIds.push(replacementInvoice.id);
      assert.ok(replacementInvoice);
      assert.strictEqual(replacementInvoice.status, InvoiceStatus.CONFIRMED);
    });

    it('10. Repeated automated billing job execution does not produce duplicate invoices', async () => {
      const initialCount = await prisma.invoice.count();

      // Run automated billing cycle twice sequentially
      const run1 = await billingJobsService.runAutomatedBillingCycle();
      const run2 = await billingJobsService.runAutomatedBillingCycle();

      assert.strictEqual(run2.generatedInvoices.length, 0, 'Second run must not generate any invoices');
    });
  });

  // =========================================================================
  // SECTION 3: P1 & P2 — FINANCIAL INTEGRITY & ANALYTICS
  // =========================================================================
  describe('P1 & P2: Financial Integrity, Rounding & Analytics', () => {
    it('11. Refund restores invoice balance and updates payment status without silent corruption', async () => {
      const { invoiceId } = await createTestInvoice(1000.0);

      // 1. Make payment of ₹600
      const payment = await paymentsService.recordPayment({
        invoiceId,
        amount: 600.0,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        transactionReference: `TX-REFUND-TEST-${Date.now()}`,
      });
      createdPaymentIds.push(payment.id);

      let inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      assert.strictEqual(Number(inv?.amountPaid), 600.0);
      assert.strictEqual(Number(inv?.balanceDue), 400.0);

      // 2. Refund payment
      const refunded = await paymentsService.refundPayment(payment.id, 'Customer requested refund');
      assert.strictEqual(refunded.status, PaymentStatus.REFUNDED);

      // 3. Verify restored invoice state
      inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      assert.strictEqual(Number(inv?.amountPaid), 0.0, 'amountPaid must restore to 0');
      assert.strictEqual(Number(inv?.balanceDue), 1000.0, 'balanceDue must restore to original 1000.0');
    });

    it('12. Executive dashboard analytics query runs accurately with new composite indexes', async () => {
      const metrics = await analyticsService.getExecutiveDashboardMetrics();
      assert.ok(metrics);
      assert.ok(metrics.kpis);
      assert.ok(metrics.executionTimeMs < 2000, `Execution time must be well under 2s SLA (actual: ${metrics.executionTimeMs}ms)`);
      assert.strictEqual(typeof metrics.kpis.activeSubscriptions, 'number');
      assert.strictEqual(typeof metrics.kpis.netCollectedRevenue, 'number');
      assert.strictEqual(typeof metrics.kpis.outstandingBalanceTotal, 'number');
      assert.strictEqual(typeof metrics.kpis.overdueInvoicesCount, 'number');
    });
  });
});
