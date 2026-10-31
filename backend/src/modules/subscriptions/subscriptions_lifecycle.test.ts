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
import {
  isLeapYear,
  getDaysInMonth,
  addMonthsSafe,
  addYearsSafe,
  calculateNextBillingPeriod,
  calculateMonetaryBreakdown,
} from './billing.calculator';

describe('Phase 4 — Subscription Lifecycle, Billing, Invoicing & Payments', () => {
  let server: http.Server;
  let apiBase: string;

  let adminToken: string;
  let staffToken: string;
  let customerToken: string;
  let customer2Token: string;
  let customerId: string;
  let customer2Id: string;

  // Cleanup tracking
  const createdSubscriptionIds: string[] = [];
  const createdInvoiceIds: string[] = [];
  const createdPaymentIds: string[] = [];
  let testProductId: string;
  let standardPlanId: string;
  let nonPausablePlanId: string;
  let nonCloseablePlanId: string;

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

    // 2. Staff login
    const staffRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@brightloop.com', password: 'Brightloop@2026' }),
    });
    const staffData: any = await staffRes.json();
    assert.strictEqual(staffRes.status, 200);
    staffToken = staffData.data.token;

    // 3. Customer 1 login
    const custRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@brightloop.com', password: 'Brightloop@2026' }),
    });
    const custData: any = await custRes.json();
    assert.strictEqual(custRes.status, 200);
    customerToken = custData.data.token;
    customerId = custData.data.user.id;

    // 4. Create/Login Customer 2 for cross-customer isolation tests
    const customer2Email = `customer2_${Date.now()}@test.com`;
    const regRes = await fetch(`${apiBase}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customer2Email,
        password: 'Password@123',
        firstName: 'Jane',
        lastName: 'Doe',
        companyName: 'Secondary Corp',
      }),
    });
    const regData: any = await regRes.json();
    assert.strictEqual(regRes.status, 201);
    customer2Token = regData.data.token;
    customer2Id = regData.data.user.id;

    // 5. Seed test product
    const product = await prisma.product.create({
      data: {
        name: 'Phase 4 Cloud Platform',
        code: `P4-PROD-${Date.now()}`,
        salesPrice: 2000.0,
        costPrice: 800.0,
      },
    });
    testProductId = product.id;

    // 6. Seed Standard Plan (canPause=true, canCloseEarly=true, Monthly)
    const stdPlan = await prisma.plan.create({
      data: {
        productId: testProductId,
        name: 'Phase 4 Monthly Growth',
        code: `P4-PLAN-STD-${Date.now()}`,
        billingFrequency: BillingFrequency.MONTHLY,
        billingCycleDays: 30,
        price: 2000.0,
        canPause: true,
        canCloseEarly: true,
        autoRenew: true,
        autoCloseOnExpiry: true,
      },
    });
    standardPlanId = stdPlan.id;

    // 7. Seed Non-Pausable Plan (canPause=false)
    const nonPausePlan = await prisma.plan.create({
      data: {
        productId: testProductId,
        name: 'Phase 4 Mission Critical (No Pause)',
        code: `P4-PLAN-NOPAUSE-${Date.now()}`,
        billingFrequency: BillingFrequency.MONTHLY,
        billingCycleDays: 30,
        price: 3500.0,
        canPause: false,
        canCloseEarly: true,
      },
    });
    nonPausablePlanId = nonPausePlan.id;

    // 8. Seed Non-Closeable Early Plan (canCloseEarly=false, Annual Lock-in)
    const nonClosePlan = await prisma.plan.create({
      data: {
        productId: testProductId,
        name: 'Phase 4 1-Year Lock-in (No Early Close)',
        code: `P4-PLAN-NOCLOSE-${Date.now()}`,
        billingFrequency: BillingFrequency.YEARLY,
        billingCycleDays: 365,
        price: 24000.0,
        canPause: true,
        canCloseEarly: false,
      },
    });
    nonCloseablePlanId = nonClosePlan.id;
  });

  after(async () => {
    // Find all subscriptions tied to test plans
    const allSubs = await prisma.subscription.findMany({
      where: {
        planId: { in: [standardPlanId, nonPausablePlanId, nonCloseablePlanId].filter(Boolean) },
      },
      select: { id: true },
    }).catch(() => []);

    const allSubIds = Array.from(new Set([...createdSubscriptionIds, ...allSubs.map((s: any) => s.id)]));

    if (allSubIds.length > 0) {
      await prisma.payment.deleteMany({ where: { invoice: { subscriptionId: { in: allSubIds } } } }).catch(() => {});
      await prisma.invoiceItem.deleteMany({ where: { invoice: { subscriptionId: { in: allSubIds } } } }).catch(() => {});
      await prisma.invoice.deleteMany({ where: { subscriptionId: { in: allSubIds } } }).catch(() => {});
      await prisma.subscriptionLifecycleLog.deleteMany({ where: { subscriptionId: { in: allSubIds } } }).catch(() => {});
      await prisma.subscriptionItem.deleteMany({ where: { subscriptionId: { in: allSubIds } } }).catch(() => {});
      await prisma.subscription.deleteMany({ where: { id: { in: allSubIds } } }).catch(() => {});
    }

    // Cleanup plans & products
    if (standardPlanId) await prisma.plan.delete({ where: { id: standardPlanId } }).catch(() => {});
    if (nonPausablePlanId) await prisma.plan.delete({ where: { id: nonPausablePlanId } }).catch(() => {});
    if (nonCloseablePlanId) await prisma.plan.delete({ where: { id: nonCloseablePlanId } }).catch(() => {});
    if (testProductId) await prisma.product.delete({ where: { id: testProductId } }).catch(() => {});
    if (customer2Id) {
      await prisma.user.delete({ where: { id: customer2Id } }).catch(() => {});
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // =========================================================================
  // SUITE 1: BILLING CALCULATOR, MONTH-END & LEAP YEAR DATES
  // =========================================================================
  describe('1. Billing Calculator Engine & Date Boundary Precision', () => {
    it('should correctly identify leap years and month lengths', () => {
      assert.strictEqual(isLeapYear(2024), true);
      assert.strictEqual(isLeapYear(2025), false);
      assert.strictEqual(isLeapYear(2000), true);
      assert.strictEqual(isLeapYear(1900), false);

      assert.strictEqual(getDaysInMonth(2024, 2), 29); // Leap Feb
      assert.strictEqual(getDaysInMonth(2025, 2), 28); // Non-leap Feb
      assert.strictEqual(getDaysInMonth(2024, 4), 30); // April
      assert.strictEqual(getDaysInMonth(2024, 1), 31); // Jan
    });

    it('should safely calculate month-end dates without calendar spillover', () => {
      // Jan 31 + 1 month in non-leap year (2025) -> Feb 28, 2025
      const jan31_2025 = new Date(2025, 0, 31);
      const febResult_2025 = addMonthsSafe(jan31_2025, 1);
      assert.strictEqual(febResult_2025.getFullYear(), 2025);
      assert.strictEqual(febResult_2025.getMonth(), 1); // Feb
      assert.strictEqual(febResult_2025.getDate(), 28);

      // Jan 31 + 1 month in leap year (2024) -> Feb 29, 2024
      const jan31_2024 = new Date(2024, 0, 31);
      const febResult_2024 = addMonthsSafe(jan31_2024, 1);
      assert.strictEqual(febResult_2024.getFullYear(), 2024);
      assert.strictEqual(febResult_2024.getMonth(), 1); // Feb
      assert.strictEqual(febResult_2024.getDate(), 29);

      // Mar 31 + 1 month -> Apr 30
      const mar31 = new Date(2025, 2, 31);
      const aprResult = addMonthsSafe(mar31, 1);
      assert.strictEqual(aprResult.getMonth(), 3); // Apr
      assert.strictEqual(aprResult.getDate(), 30);

      // Aug 31 + 1 month -> Sep 30
      const aug31 = new Date(2025, 7, 31);
      const sepResult = addMonthsSafe(aug31, 1);
      assert.strictEqual(sepResult.getMonth(), 8); // Sep
      assert.strictEqual(sepResult.getDate(), 30);
    });

    it('should safely handle leap-year Feb 29 for yearly frequencies', () => {
      // Feb 29, 2024 + 1 year -> Feb 28, 2025 (safe leap to non-leap)
      const feb29_2024 = new Date(2024, 1, 29);
      const nextYear = addYearsSafe(feb29_2024, 1);
      assert.strictEqual(nextYear.getFullYear(), 2025);
      assert.strictEqual(nextYear.getMonth(), 1); // Feb
      assert.strictEqual(nextYear.getDate(), 28);

      // Feb 29, 2024 + 4 years -> Feb 29, 2028 (leap to leap)
      const fourYears = addYearsSafe(feb29_2024, 4);
      assert.strictEqual(fourYears.getFullYear(), 2028);
      assert.strictEqual(fourYears.getMonth(), 1); // Feb
      assert.strictEqual(fourYears.getDate(), 29);
    });

    it('should compute billing periods for DAILY, WEEKLY, MONTHLY, and YEARLY frequencies', () => {
      const base = new Date(2025, 0, 15); // Jan 15, 2025

      const daily = calculateNextBillingPeriod(base, BillingFrequency.DAILY);
      assert.strictEqual(daily.nextBillingDate.getDate(), 16);

      const weekly = calculateNextBillingPeriod(base, BillingFrequency.WEEKLY);
      assert.strictEqual(weekly.nextBillingDate.getDate(), 22);

      const monthly = calculateNextBillingPeriod(base, BillingFrequency.MONTHLY);
      assert.strictEqual(monthly.nextBillingDate.getMonth(), 1); // Feb 15
      assert.strictEqual(monthly.nextBillingDate.getDate(), 15);

      const yearly = calculateNextBillingPeriod(base, BillingFrequency.YEARLY);
      assert.strictEqual(yearly.nextBillingDate.getFullYear(), 2026);
      assert.strictEqual(yearly.nextBillingDate.getMonth(), 0);
      assert.strictEqual(yearly.nextBillingDate.getDate(), 15);
    });

    it('should perform decimal-safe monetary breakdown with 18% tax and discount ceiling', () => {
      const breakdown = calculateMonetaryBreakdown({
        unitPrice: 1999.99,
        quantity: 2,
        discountAmount: 400.0,
        taxRatePercent: 18.0,
      });

      // Subtotal = 1999.99 * 2 = 3999.98
      assert.strictEqual(breakdown.subtotal, 3999.98);
      // Taxable = 3999.98 - 400 = 3599.98
      assert.strictEqual(breakdown.taxableAmount, 3599.98);
      // Tax = 3599.98 * 0.18 = 647.9964 -> 648.00
      assert.strictEqual(breakdown.taxAmount, 648.0);
      // Total = 3599.98 + 648.00 = 4247.98
      assert.strictEqual(breakdown.totalAmount, 4247.98);
    });
  });

  // =========================================================================
  // SUITE 2: SUBSCRIPTION LIFECYCLE & PLAN RESTRICTION ENFORCEMENT
  // =========================================================================
  describe('2. Subscription Lifecycle & Plan Policy Enforcement', () => {
    let subStandardId: string;
    let subNoPauseId: string;
    let subNoCloseId: string;

    it('should create subscription in DRAFT status and snapshot agreed unit price', async () => {
      const res = await fetch(`${apiBase}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          customerId,
          planId: standardPlanId,
          quantity: 2,
          notes: 'Enterprise initial rollout',
        }),
      });

      const body: any = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.status, SubscriptionStatus.DRAFT);
      assert.strictEqual(Number(body.data.unitPrice), 2000.0);
      assert.strictEqual(Number(body.data.subtotal), 4000.0);
      assert.strictEqual(Number(body.data.totalAmount), 4720.0); // 4000 + 18% tax (720) = 4720

      subStandardId = body.data.id;
      createdSubscriptionIds.push(subStandardId);

      // Verify SubscriptionItem snapshot in database
      const items = await prisma.subscriptionItem.findMany({ where: { subscriptionId: subStandardId } });
      assert.strictEqual(items.length, 1);
      assert.strictEqual(Number(items[0].unitPrice), 2000.0);
      assert.strictEqual(Number(items[0].lineTotal), 4000.0);
    });

    it('should transition through full lifecycle: DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE', async () => {
      // 1. Send quotation
      const sendRes = await fetch(`${apiBase}/subscriptions/${subStandardId}/send-quote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const sendBody: any = await sendRes.json();
      assert.strictEqual(sendRes.status, 200);
      assert.strictEqual(sendBody.data.status, SubscriptionStatus.QUOTATION);

      // 2. Accept quotation as Customer
      const acceptRes = await fetch(`${apiBase}/subscriptions/${subStandardId}/accept-quote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const acceptBody: any = await acceptRes.json();
      assert.strictEqual(acceptRes.status, 200);
      assert.strictEqual(acceptBody.data.status, SubscriptionStatus.CONFIRMED);

      // 3. Activate subscription as Staff
      const activateRes = await fetch(`${apiBase}/subscriptions/${subStandardId}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const activateBody: any = await activateRes.json();
      assert.strictEqual(activateRes.status, 200);
      assert.strictEqual(activateBody.data.status, SubscriptionStatus.ACTIVE);
      assert.ok(activateBody.data.nextBillingDate);
    });

    it('should strictly reject pause if plan.canPause is FALSE', async () => {
      // Create and activate subscription on non-pausable plan
      const createRes = await fetch(`${apiBase}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          customerId,
          planId: nonPausablePlanId,
          quantity: 1,
        }),
      });
      const createData: any = await createRes.json();
      subNoPauseId = createData.data.id;
      createdSubscriptionIds.push(subNoPauseId);

      await fetch(`${apiBase}/subscriptions/${subNoPauseId}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      // Attempt to pause - must be rejected
      const pauseRes = await fetch(`${apiBase}/subscriptions/${subNoPauseId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: 'Temporarily inactive client' }),
      });

      const pauseData: any = await pauseRes.json();
      assert.strictEqual(pauseRes.status, 400);
      assert.strictEqual(pauseData.success, false);
      assert.match(pauseData.message, /does not permit pausing/i);
    });

    it('should strictly reject early closure if plan.canCloseEarly is FALSE and contract unexpired', async () => {
      // Create and activate subscription on non-closeable plan
      const createRes = await fetch(`${apiBase}/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          customerId,
          planId: nonCloseablePlanId,
          quantity: 1,
        }),
      });
      const createData: any = await createRes.json();
      subNoCloseId = createData.data.id;
      createdSubscriptionIds.push(subNoCloseId);

      await fetch(`${apiBase}/subscriptions/${subNoCloseId}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      // Attempt to close early - must be rejected
      const closeRes = await fetch(`${apiBase}/subscriptions/${subNoCloseId}/close`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: 'Want out early' }),
      });

      const closeData: any = await closeRes.json();
      assert.strictEqual(closeRes.status, 400);
      assert.strictEqual(closeData.success, false);
      assert.match(closeData.message, /Early closure is disallowed/i);
    });

    it('should allow pause and resume on pausable subscription and adjust billing date', async () => {
      // Pause
      const pauseRes = await fetch(`${apiBase}/subscriptions/${subStandardId}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: 'Seasonal maintenance pause' }),
      });
      const pauseData: any = await pauseRes.json();
      assert.strictEqual(pauseRes.status, 200);
      assert.strictEqual(pauseData.data.status, SubscriptionStatus.PAUSED);

      // Resume
      const resumeRes = await fetch(`${apiBase}/subscriptions/${subStandardId}/resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const resumeData: any = await resumeRes.json();
      assert.strictEqual(resumeRes.status, 200);
      assert.strictEqual(resumeData.data.status, SubscriptionStatus.ACTIVE);
      assert.ok(resumeData.data.nextBillingDate);
    });

    it('should renew active subscription and advance contract term and next billing date', async () => {
      const renewRes = await fetch(`${apiBase}/subscriptions/${subStandardId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ autoRenew: true }),
      });

      const renewData: any = await renewRes.json();
      assert.strictEqual(renewRes.status, 200);
      assert.strictEqual(renewData.success, true);
      assert.strictEqual(renewData.data.status, SubscriptionStatus.ACTIVE);
      assert.ok(renewData.data.expiryDate);
    });
  });

  // =========================================================================
  // SUITE 3: INVOICES & DUPLICATE PREVENTION & HISTORICAL PRICING
  // =========================================================================
  describe('3. Invoices, Billing Records & Duplicate Invoice Prevention', () => {
    let generatedInvoiceId: string;
    let targetSubId: string;

    before(async () => {
      // Create dedicated active subscription for invoicing tests
      const sub = await prisma.subscription.create({
        data: {
          subscriptionNumber: `SUB-INV-TEST-${Date.now()}`,
          customerId,
          planId: standardPlanId,
          status: SubscriptionStatus.ACTIVE,
          quantity: 3,
          unitPrice: 2000.0,
          subtotal: 6000.0,
          taxRate: 18.0,
          taxAmount: 1080.0,
          discountAmount: 0.0,
          totalAmount: 7080.0,
          startDate: new Date(),
          nextBillingDate: new Date(),
        },
      });
      targetSubId = sub.id;
      createdSubscriptionIds.push(targetSubId);

      await prisma.subscriptionItem.create({
        data: {
          subscriptionId: sub.id,
          productId: testProductId,
          planId: standardPlanId,
          description: 'Phase 4 Monthly Growth Plan Item',
          quantity: 3,
          unitPrice: 2000.0,
          lineTotal: 6000.0,
        },
      });
    });

    it('should generate invoice for active subscription with item snapshot and balances', async () => {
      const res = await fetch(`${apiBase}/invoices/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ subscriptionId: targetSubId }),
      });

      const body: any = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.ok(body.data.invoiceNumber.startsWith('INV-'));
      assert.strictEqual(body.data.status, InvoiceStatus.CONFIRMED);
      assert.strictEqual(Number(body.data.subtotal), 6000.0);
      assert.strictEqual(Number(body.data.taxAmount), 1080.0);
      assert.strictEqual(Number(body.data.totalAmount), 7080.0);
      assert.strictEqual(Number(body.data.amountPaid), 0.0);
      assert.strictEqual(Number(body.data.balanceDue), 7080.0);

      generatedInvoiceId = body.data.id;
      createdInvoiceIds.push(generatedInvoiceId);

      // Verify line items
      const items = await prisma.invoiceItem.findMany({ where: { invoiceId: generatedInvoiceId } });
      assert.strictEqual(items.length, 1);
      assert.strictEqual(Number(items[0].unitPrice), 2000.0);
      assert.strictEqual(items[0].quantity, 3);
    });

    it('should PREVENT DUPLICATE INVOICES for the same subscription and billing period', async () => {
      // Immediate second generation attempt for same subscription and period must be rejected
      const dupRes = await fetch(`${apiBase}/invoices/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ subscriptionId: targetSubId }),
      });

      const dupBody: any = await dupRes.json();
      assert.strictEqual(dupRes.status, 400);
      assert.strictEqual(dupBody.success, false);
      assert.match(dupBody.message, /Duplicate invoice prevented/i);
    });

    it('should preserve historical agreed prices when plan price changes in catalog', async () => {
      // Modify plan sales price in database catalog from 2000 to 5000
      await prisma.plan.update({
        where: { id: standardPlanId },
        data: { price: 5000.0 },
      });

      // Verify that existing subscription and invoice records preserve the original 2000.00 price
      const sub = await prisma.subscription.findUnique({
        where: { id: targetSubId },
        include: { items: true },
      });
      assert.strictEqual(Number(sub?.unitPrice), 2000.0);
      assert.strictEqual(Number(sub?.items[0].unitPrice), 2000.0);

      const inv = await prisma.invoice.findUnique({
        where: { id: generatedInvoiceId },
        include: { items: true },
      });
      assert.strictEqual(Number(inv?.totalAmount), 7080.0);
      assert.strictEqual(Number(inv?.items[0].unitPrice), 2000.0);

      // Restore plan price
      await prisma.plan.update({
        where: { id: standardPlanId },
        data: { price: 2000.0 },
      });
    });

    it('should prevent voiding an invoice that has recorded payments', async () => {
      // Fake a payment on invoice
      await prisma.invoice.update({
        where: { id: generatedInvoiceId },
        data: { amountPaid: 1000.0, balanceDue: 6080.0 },
      });

      const voidRes = await fetch(`${apiBase}/invoices/${generatedInvoiceId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: InvoiceStatus.VOID }),
      });

      const voidBody: any = await voidRes.json();
      assert.strictEqual(voidRes.status, 400);
      assert.match(voidBody.message, /Cannot void invoice/i);

      // Restore invoice balance
      await prisma.invoice.update({
        where: { id: generatedInvoiceId },
        data: { amountPaid: 0.0, balanceDue: 7080.0 },
      });
    });
  });

  // =========================================================================
  // SUITE 4: PAYMENTS & ATOMIC RECONCILIATION
  // =========================================================================
  describe('4. Payments, Reconciliation, Balances & Refund Safety', () => {
    let testInvoiceId: string;
    let payment1Id: string;

    before(async () => {
      const inv = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-PAY-TEST-${Date.now()}`,
          subscriptionId: createdSubscriptionIds[0],
          customerId,
          status: InvoiceStatus.CONFIRMED,
          dueDate: new Date(Date.now() + 86400000 * 15),
          billingPeriodStart: new Date(),
          billingPeriodEnd: new Date(Date.now() + 86400000 * 30),
          subtotal: 10000.0,
          taxRate: 18.0,
          taxAmount: 1800.0,
          discountAmount: 0.0,
          totalAmount: 11800.0,
          amountPaid: 0.0,
          balanceDue: 11800.0,
        },
      });
      testInvoiceId = inv.id;
      createdInvoiceIds.push(testInvoiceId);
    });

    it('should record partial payment and update amountPaid and balanceDue', async () => {
      const res = await fetch(`${apiBase}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          invoiceId: testInvoiceId,
          amount: 5000.0,
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          transactionReference: `UTR-PARTIAL-${Date.now()}`,
          notes: 'First tranche payment via RTGS',
        }),
      });

      const body: any = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(Number(body.data.amount), 5000.0);
      assert.strictEqual(body.data.status, PaymentStatus.SUCCESS);

      payment1Id = body.data.id;
      createdPaymentIds.push(payment1Id);

      // Verify invoice state
      const updatedInv = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
      assert.strictEqual(Number(updatedInv?.amountPaid), 5000.0);
      assert.strictEqual(Number(updatedInv?.balanceDue), 6800.0);
      assert.strictEqual(updatedInv?.status, InvoiceStatus.CONFIRMED); // Not full yet
    });

    it('should reject payment exceeding remaining balanceDue', async () => {
      const res = await fetch(`${apiBase}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          invoiceId: testInvoiceId,
          amount: 7000.0, // Remaining balance is 6800
          paymentMethod: PaymentMethod.CREDIT_CARD,
        }),
      });

      const body: any = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.success, false);
      assert.match(body.message, /exceeds remaining balance/i);
    });

    it('should reject duplicate payment using identical transactionReference', async () => {
      const uniqueRef = `TX-DEDUP-${Date.now()}`;

      // First payment with reference
      const firstRes = await fetch(`${apiBase}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          invoiceId: testInvoiceId,
          amount: 1000.0,
          paymentMethod: PaymentMethod.UPI,
          transactionReference: uniqueRef,
        }),
      });
      const firstData: any = await firstRes.json();
      assert.strictEqual(firstRes.status, 201);
      createdPaymentIds.push(firstData.data.id);

      // Second payment with same reference - MUST BE REJECTED
      const dupRes = await fetch(`${apiBase}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          invoiceId: testInvoiceId,
          amount: 1000.0,
          paymentMethod: PaymentMethod.UPI,
          transactionReference: uniqueRef,
        }),
      });

      const dupData: any = await dupRes.json();
      assert.strictEqual(dupRes.status, 400);
      assert.match(dupData.message, /Duplicate payment prevented/i);
    });

    it('should reject customer attempting to pay another customer invoice', async () => {
      // Customer 2 attempts to pay Customer 1's invoice
      const res = await fetch(`${apiBase}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customer2Token}`,
        },
        body: JSON.stringify({
          invoiceId: testInvoiceId,
          amount: 500.0,
          paymentMethod: PaymentMethod.CASH,
        }),
      });

      const body: any = await res.json();
      assert.strictEqual(res.status, 400);
      assert.match(body.message, /Unauthorized: You can only record payments for your own invoices/i);
    });

    it('should complete final payment and transition invoice status to PAID with 0 balance', async () => {
      const invBefore = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
      const remaining = Number(invBefore?.balanceDue);

      const res = await fetch(`${apiBase}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          invoiceId: testInvoiceId,
          amount: remaining,
          paymentMethod: PaymentMethod.CREDIT_CARD,
          transactionReference: `PAY-FINAL-${Date.now()}`,
        }),
      });

      const body: any = await res.json();
      assert.strictEqual(res.status, 201);
      createdPaymentIds.push(body.data.id);

      const invAfter = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
      assert.strictEqual(Number(invAfter?.balanceDue), 0);
      assert.strictEqual(invAfter?.status, InvoiceStatus.PAID);
    });

    it('should refund payment, restore invoice balance and revert status from PAID', async () => {
      const refundRes = await fetch(`${apiBase}/payments/${payment1Id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ reason: 'Accidental double wire transfer' }),
      });

      const refundBody: any = await refundRes.json();
      assert.strictEqual(refundRes.status, 200);
      assert.strictEqual(refundBody.data.status, PaymentStatus.REFUNDED);

      const invAfterRefund = await prisma.invoice.findUnique({ where: { id: testInvoiceId } });
      assert.strictEqual(Number(invAfterRefund?.balanceDue), 5000.0);
      assert.strictEqual(invAfterRefund?.status, InvoiceStatus.CONFIRMED);
    });
  });

  // =========================================================================
  // SUITE 5: AUTOMATED BACKGROUND JOBS
  // =========================================================================
  describe('5. Automated Schedulers & Billing Cycles', () => {
    it('should successfully execute run-billing cycle manually via API', async () => {
      const res = await fetch(`${apiBase}/jobs/run-billing`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(typeof body.data.processed === 'number');
    });

    it('should successfully execute run-reminders job manually via API', async () => {
      const res = await fetch(`${apiBase}/jobs/run-reminders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(typeof body.data.notifiedCount === 'number');
    });

    it('should successfully execute run-closures job manually via API', async () => {
      const res = await fetch(`${apiBase}/jobs/run-closures`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(typeof body.data.closedCount === 'number');
    });

    it('should successfully execute run-overdue job manually via API', async () => {
      const res = await fetch(`${apiBase}/jobs/run-overdue`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(typeof body.data.markedOverdueCount === 'number');
    });
  });

  // =========================================================================
  // SUITE 6: ACCESS CONTROL & SCOPING
  // =========================================================================
  describe('6. Security & Multi-Role Scoping', () => {
    it('should restrict customers to only their own subscriptions and invoices', async () => {
      // Customer 2 fetches subscriptions - should get 0 or only Customer 2's
      const subRes = await fetch(`${apiBase}/subscriptions`, {
        headers: { Authorization: `Bearer ${customer2Token}` },
      });
      const subBody: any = await subRes.json();
      assert.strictEqual(subRes.status, 200);
      for (const s of subBody.data) {
        assert.strictEqual(s.customerId, customer2Id);
      }

      // Customer 2 fetches invoices - should get 0 or only Customer 2's
      const invRes = await fetch(`${apiBase}/invoices`, {
        headers: { Authorization: `Bearer ${customer2Token}` },
      });
      const invBody: any = await invRes.json();
      assert.strictEqual(invRes.status, 200);
      for (const i of invBody.data) {
        assert.strictEqual(i.customerId, customer2Id);
      }
    });

    it('should reject non-admin from running background jobs', async () => {
      const res = await fetch(`${apiBase}/jobs/run-billing`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      assert.strictEqual(res.status, 403);
    });
  });
});
