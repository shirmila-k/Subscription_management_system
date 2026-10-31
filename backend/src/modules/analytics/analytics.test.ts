import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../../app';
import prisma from '../../config/db';
import {
  BillingFrequency,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { analyticsService } from './analytics.service';

describe('Phase 5 — Analytics, Reports & Business Dashboard Tests', () => {
  let server: http.Server;
  let apiBase: string;

  let adminToken: string;
  let staffToken: string;
  let staffId: string;
  let customerToken: string;
  let customerId: string;

  // Tracked IDs for cleanup
  let testProductId: string;
  let monthlyPlanId: string;
  let yearlyPlanId: string;
  const createdSubIds: string[] = [];
  const createdInvIds: string[] = [];
  const createdPayIds: string[] = [];

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        apiBase = `http://localhost:${address.port}/api/v1`;
        resolve();
      });
    });

    // 1. Admin Login
    const adminRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@brightloop.com', password: 'Brightloop@2026' }),
    });
    const adminData: any = await adminRes.json();
    assert.strictEqual(adminRes.status, 200);
    adminToken = adminData.data.token;

    // 2. Create Staff User
    const staffEmail = `staff_analytics_${Date.now()}@brightloop.com`;
    const staffRes = await fetch(`${apiBase}/auth/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        email: staffEmail,
        password: 'Password@123',
        firstName: 'Analytics',
        lastName: 'Staff',
      }),
    });
    const staffData: any = await staffRes.json();
    assert.strictEqual(staffRes.status, 201);
    const staffId = staffData.data.id;

    const staffLoginRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: staffEmail, password: 'Password@123' }),
    });
    const staffLoginData: any = await staffLoginRes.json();
    staffToken = staffLoginData.data.token;

    // 3. Create Customer User
    const custEmail = `cust_analytics_${Date.now()}@example.com`;
    const custRes = await fetch(`${apiBase}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: custEmail,
        password: 'Password@123',
        firstName: 'Analytics',
        lastName: 'Customer',
        companyName: 'Analytics Corp',
      }),
    });
    const custData: any = await custRes.json();
    assert.strictEqual(custRes.status, 201);
    customerToken = custData.data.token;
    customerId = custData.data.user.id;

    // 4. Create Product & Plans
    const product = await prisma.product.create({
      data: {
        name: 'Analytics Test Cloud Suite',
        code: `P5-PROD-${Date.now()}`,
        salesPrice: 5000.0,
      },
    });
    testProductId = product.id;

    const mPlan = await prisma.plan.create({
      data: {
        productId: testProductId,
        name: 'Monthly Analytics Pro',
        code: `P5-PLAN-M-${Date.now()}`,
        billingFrequency: BillingFrequency.MONTHLY,
        billingCycleDays: 30,
        price: 2500.0,
      },
    });
    monthlyPlanId = mPlan.id;

    const yPlan = await prisma.plan.create({
      data: {
        productId: testProductId,
        name: 'Yearly Analytics Enterprise',
        code: `P5-PLAN-Y-${Date.now()}`,
        billingFrequency: BillingFrequency.YEARLY,
        billingCycleDays: 365,
        price: 24000.0,
      },
    });
    yearlyPlanId = yPlan.id;
  });

  after(async () => {
    // Teardown created test entities
    if (createdPayIds.length > 0) {
      await prisma.payment.deleteMany({ where: { id: { in: createdPayIds } } }).catch(() => {});
    }
    if (createdInvIds.length > 0) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: createdInvIds } } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { id: { in: createdInvIds } } }).catch(() => {});
    }
    if (createdSubIds.length > 0) {
      await prisma.subscriptionLifecycleLog.deleteMany({ where: { subscriptionId: { in: createdSubIds } } }).catch(() => {});
      await prisma.subscriptionItem.deleteMany({ where: { subscriptionId: { in: createdSubIds } } }).catch(() => {});
      await prisma.subscription.deleteMany({ where: { id: { in: createdSubIds } } }).catch(() => {});
    }
    if (monthlyPlanId) await prisma.plan.delete({ where: { id: monthlyPlanId } }).catch(() => {});
    if (yearlyPlanId) await prisma.plan.delete({ where: { id: yearlyPlanId } }).catch(() => {});
    if (testProductId) await prisma.product.delete({ where: { id: testProductId } }).catch(() => {});
    if (customerId) await prisma.user.delete({ where: { id: customerId } }).catch(() => {});
    if (staffId) await prisma.user.delete({ where: { id: staffId } }).catch(() => {});

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // =========================================================================
  // SUITE 1: UNIT CALCULATIONS & MRR NORMALIZATION
  // =========================================================================
  describe('1. Unit Calculations & MRR Normalization', () => {
    it('should accurately normalize monthly, yearly, weekly, and daily frequencies to MRR', () => {
      // Monthly: ₹5,000 => MRR: 5000
      assert.strictEqual(analyticsService.calculateNormalizedMRR(5000, BillingFrequency.MONTHLY), 5000);

      // Yearly: ₹24,000 => MRR: 24000 / 12 = 2000
      assert.strictEqual(analyticsService.calculateNormalizedMRR(24000, BillingFrequency.YEARLY), 2000);

      // Weekly: ₹1,000 => MRR: 1000 * 52 / 12 = 4333.33
      assert.strictEqual(analyticsService.calculateNormalizedMRR(1000, BillingFrequency.WEEKLY), 4333.33);

      // Daily: ₹100 => MRR: 100 * 30 = 3000
      assert.strictEqual(analyticsService.calculateNormalizedMRR(100, BillingFrequency.DAILY), 3000);
    });
  });

  // =========================================================================
  // SUITE 2: ACCESS CONTROL & AUTHENTICATION
  // =========================================================================
  describe('2. Role-Based Access Control on Analytics Endpoints', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await fetch(`${apiBase}/analytics/overview`);
      assert.strictEqual(res.status, 401);
    });

    it('should reject customer role from accessing analytics with 403 Forbidden', async () => {
      const res = await fetch(`${apiBase}/analytics/overview`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('should allow staff role to access analytics overview (200 OK)', async () => {
      const res = await fetch(`${apiBase}/analytics/overview`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.kpis !== undefined);
    });

    it('should allow admin role to access analytics overview (200 OK)', async () => {
      const res = await fetch(`${apiBase}/analytics/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.kpis !== undefined);
    });
  });

  // =========================================================================
  // SUITE 3: FINANCIAL REVENUE ACCURACY, INVOICES & REFUNDS
  // =========================================================================
  describe('3. Financial Revenue Accuracy, Invoices & Refunds Accounting', () => {
    let testSubId: string;
    let testInvoiceId: string;
    let baselineGross: number;
    let baselineNet: number;
    let baselineRefunded: number;
    let baselineOutstanding: number;

    it('should capture baseline metrics before financial operations', async () => {
      const res = await fetch(`${apiBase}/analytics/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);

      baselineGross = body.data.kpis.grossCollectedRevenue;
      baselineNet = body.data.kpis.netCollectedRevenue;
      baselineRefunded = body.data.kpis.totalRefunded;
      baselineOutstanding = body.data.kpis.outstandingBalanceTotal;
    });

    it('should NOT count an issued unpaid invoice as collected revenue (never treat invoice as collected)', async () => {
      // Create subscription
      const sub = await prisma.subscription.create({
        data: {
          subscriptionNumber: `SUB-P5-${Date.now()}`,
          customerId,
          planId: monthlyPlanId,
          status: SubscriptionStatus.ACTIVE,
          quantity: 1,
          unitPrice: 2500.0,
          subtotal: 2500.0,
          totalAmount: 2950.0, // With 18% GST
          startDate: new Date(),
        },
      });
      testSubId = sub.id;
      createdSubIds.push(sub.id);

      // Create an uncollected invoice for ₹2,950
      const inv = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-P5-${Date.now()}`,
          subscriptionId: sub.id,
          customerId,
          status: InvoiceStatus.CONFIRMED,
          dueDate: new Date(Date.now() + 15 * 86400000), // Due in 15 days
          billingPeriodStart: new Date(),
          billingPeriodEnd: new Date(Date.now() + 30 * 86400000),
          subtotal: 2500.0,
          taxAmount: 450.0,
          totalAmount: 2950.0,
          amountPaid: 0.0,
          balanceDue: 2950.0,
        },
      });
      testInvoiceId = inv.id;
      createdInvIds.push(inv.id);

      // Verify overview: gross & net collected revenue MUST NOT have increased
      const res = await fetch(`${apiBase}/analytics/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);

      assert.strictEqual(body.data.kpis.grossCollectedRevenue, baselineGross);
      assert.strictEqual(body.data.kpis.netCollectedRevenue, baselineNet);

      // Outstanding A/R must reflect the unpaid invoice
      assert.strictEqual(
        Math.round(body.data.kpis.outstandingBalanceTotal * 100) / 100,
        Math.round((baselineOutstanding + 2950.0) * 100) / 100
      );
    });

    it('should increase collected revenue ONLY upon successful payment recording', async () => {
      // Record payment of ₹2,950 for the invoice
      const payRes = await fetch(`${apiBase}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          invoiceId: testInvoiceId,
          amount: 2950.0,
          paymentMethod: PaymentMethod.UPI,
          transactionReference: `UTR-P5-${Date.now()}`,
        }),
      });
      const payData: any = await payRes.json();
      assert.strictEqual(payRes.status, 201);
      const paymentId = payData.data.id;
      createdPayIds.push(paymentId);

      // Verify overview: collected revenue must now reflect the payment
      const res = await fetch(`${apiBase}/analytics/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);

      assert.strictEqual(
        Math.round(body.data.kpis.grossCollectedRevenue * 100) / 100,
        Math.round((baselineGross + 2950.0) * 100) / 100
      );
      assert.strictEqual(
        Math.round(body.data.kpis.netCollectedRevenue * 100) / 100,
        Math.round((baselineNet + 2950.0) * 100) / 100
      );
      assert.strictEqual(body.data.kpis.totalRefunded, baselineRefunded);

      // Outstanding balance must decrease by 2950
      assert.strictEqual(
        Math.round(body.data.kpis.outstandingBalanceTotal * 100) / 100,
        Math.round(baselineOutstanding * 100) / 100
      );
    });

    it('should deduct refunds from net collected revenue when payment is refunded', async () => {
      const paymentId = createdPayIds[createdPayIds.length - 1];

      // Refund the payment
      const refundRes = await fetch(`${apiBase}/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          reason: 'Customer requested cancellation within 24h grace period',
        }),
      });
      assert.strictEqual(refundRes.status, 200);

      // Verify overview:
      // Gross stays same (payment was made), totalRefunded increases by 2950, netCollected decreases back to baseline
      const res = await fetch(`${apiBase}/analytics/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);

      assert.strictEqual(
        Math.round(body.data.kpis.totalRefunded * 100) / 100,
        Math.round((baselineRefunded + 2950.0) * 100) / 100
      );
      assert.strictEqual(
        Math.round(body.data.kpis.netCollectedRevenue * 100) / 100,
        Math.round(baselineNet * 100) / 100
      );
    });
  });

  // =========================================================================
  // SUITE 4: MONTHLY REVENUE TREND
  // =========================================================================
  describe('4. Monthly Revenue Trend Endpoint', () => {
    it('should retrieve revenue trend buckets with gross, refunds, and net calculations', async () => {
      const res = await fetch(`${apiBase}/analytics/revenue-trend?months=6`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.strictEqual(body.data.length, 6);

      for (const bucket of body.data) {
        assert.ok(typeof bucket.month === 'string');
        assert.ok(typeof bucket.grossRevenue === 'number');
        assert.ok(typeof bucket.refunds === 'number');
        assert.ok(typeof bucket.netRevenue === 'number');
        assert.ok(typeof bucket.paymentCount === 'number');
        assert.ok(bucket.grossRevenue >= bucket.netRevenue);
      }
    });
  });

  // =========================================================================
  // SUITE 5: CHURN & RETENTION ANALYTICS
  // =========================================================================
  describe('5. Churn & Retention Analytics Endpoint', () => {
    it('should retrieve cohort retention, churn rates, and MRR loss dynamics', async () => {
      const res = await fetch(`${apiBase}/analytics/churn`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);

      const d = body.data;
      assert.ok(typeof d.totalSubscriptions === 'number');
      assert.ok(typeof d.activeSubscriptions === 'number');
      assert.ok(typeof d.closedSubscriptions === 'number');
      assert.ok(typeof d.cancelledSubscriptions === 'number');
      assert.ok(typeof d.churnRatePercentage === 'number');
      assert.ok(typeof d.retentionRatePercentage === 'number');
      assert.ok(typeof d.activeMRR === 'number');
      assert.ok(typeof d.churnedMRRLoss === 'number');
      assert.ok(Array.isArray(d.cancellationReasons));

      if (d.totalSubscriptions > 0) {
        assert.strictEqual(
          Math.round((d.churnRatePercentage + d.retentionRatePercentage) * 10) / 10,
          100.0
        );
      }
    });
  });

  // =========================================================================
  // SUITE 6: PAYMENT METHOD BREAKDOWN
  // =========================================================================
  describe('6. Payment Methods Breakdown Endpoint', () => {
    it('should return aggregated payment methods breakdown across channels', async () => {
      const res = await fetch(`${apiBase}/analytics/payment-methods`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(typeof body.data.totalNetCollected === 'number');
      assert.ok(Array.isArray(body.data.methods));

      for (const m of body.data.methods) {
        assert.ok(typeof m.method === 'string');
        assert.ok(typeof m.grossCollected === 'number');
        assert.ok(typeof m.refundedAmount === 'number');
        assert.ok(typeof m.netCollected === 'number');
        assert.ok(typeof m.transactionCount === 'number');
        assert.ok(typeof m.successCount === 'number');
        assert.ok(typeof m.percentage === 'number');
      }
    });
  });

  // =========================================================================
  // SUITE 7: FINANCIAL REPORT CSV EXPORT
  // =========================================================================
  describe('7. Financial Report CSV Export Endpoint', () => {
    it('should export a properly formatted CSV financial report with headers and audit sections', async () => {
      const res = await fetch(`${apiBase}/analytics/export/financial-summary`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      assert.strictEqual(res.status, 200);
      const contentType = res.headers.get('content-type') || '';
      assert.ok(contentType.includes('text/csv'));

      const disposition = res.headers.get('content-disposition') || '';
      assert.ok(disposition.includes('attachment; filename="brightloop_financial_report_'));

      const csvText = await res.text();
      assert.ok(csvText.includes('BRIGHTLOOP SUBSCRIPTION MANAGEMENT - EXECUTIVE FINANCIAL REPORT'));
      assert.ok(csvText.includes('--- SECTION 1: EXECUTIVE FINANCIAL SUMMARY ---'));
      assert.ok(csvText.includes('Net Collected Revenue'));
      assert.ok(csvText.includes('Gross Successful Payments'));
      assert.ok(csvText.includes('Total Refunds Accounted'));
      assert.ok(csvText.includes('Monthly Recurring Revenue (MRR)'));
      assert.ok(csvText.includes('Annualized Run-Rate (ARR)'));
      assert.ok(csvText.includes('--- SECTION 2: TOP SUBSCRIPTION PLANS ---'));
      assert.ok(csvText.includes('--- SECTION 3: PAYMENT METHOD DISTRIBUTION ---'));
      assert.ok(csvText.includes('--- SECTION 4: RECENT SETTLED PAYMENT AUDIT LOG ---'));
    });
  });
});
