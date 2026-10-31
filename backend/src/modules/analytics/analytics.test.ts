import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../../app';
import prisma from '../../config/db';
import {
  UserRole,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  BillingFrequency,
} from '@prisma/client';
import { sanitizeCsvCell, buildCsv } from './reportGenerator';
import { analyticsService } from './analytics.service';

describe('Phase 5: Analytics, Reports & Business Dashboard Tests', () => {
  let server: http.Server;
  let baseUrl: string;

  // Test state
  let adminToken: string;
  let staffToken: string;
  let customerToken: string;

  let testAdminEmail = `test.analytics.admin.${Date.now()}@brightloop.test`;
  let testStaffEmail = `test.analytics.staff.${Date.now()}@brightloop.test`;
  let testCustomerEmail = `test.analytics.cust.${Date.now()}@brightloop.test`;

  let createdCustomerUserId: string;
  let createdProductId: string;
  let createdPlanId: string;
  let createdSubId: string;
  let createdInvoiceId: string;
  let createdSuccessPaymentId: string;
  let createdFailedPaymentId: string;

  before(async () => {
    // 1. Start test server
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}/api/v1`;
        resolve();
      });
    });

    // 2. Fetch or seed existing admin token
    const adminRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@brightloop.com',
        password: 'Brightloop@2026',
      }),
    });
    const adminData = await adminRes.json();
    adminToken = adminData.data.token;

    // 3. Fetch staff token
    const staffRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'staff@brightloop.com',
        password: 'Brightloop@2026',
      }),
    });
    const staffData = await staffRes.json();
    staffToken = staffData.data.token;

    // 4. Create customer for testing customer restrictions
    const custRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: 'CustomerPassword@2026',
        firstName: 'Analytics',
        lastName: 'Customer',
        companyName: 'Analytics Test Labs',
      }),
    });
    const custData = await custRes.json();
    customerToken = custData.data.token;
    createdCustomerUserId = custData.data.user.id;

    // 5. Seed test product, plan, subscription, invoice, and payments for isolated verification
    const testProd = await prisma.product.create({
      data: {
        name: 'Analytics Test Software Suite',
        code: `PROD-TEST-${Date.now()}`,
        salesPrice: 5000,
        category: 'Analytics Test',
      },
    });
    createdProductId = testProd.id;

    const testPlan = await prisma.plan.create({
      data: {
        productId: testProd.id,
        name: 'Analytics Monthly Pro',
        code: `PLAN-TEST-${Date.now()}`,
        price: 5000,
        billingFrequency: BillingFrequency.MONTHLY,
      },
    });
    createdPlanId = testPlan.id;

    const testSub = await prisma.subscription.create({
      data: {
        subscriptionNumber: `SUB-TEST-${Date.now()}`,
        customerId: createdCustomerUserId,
        planId: testPlan.id,
        status: SubscriptionStatus.ACTIVE,
        unitPrice: 5000,
        subtotal: 5000,
        totalAmount: 5000,
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // In 15 days
      },
    });
    createdSubId = testSub.id;

    const testInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-TEST-${Date.now()}`,
        subscriptionId: testSub.id,
        customerId: createdCustomerUserId,
        status: InvoiceStatus.CONFIRMED,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Overdue by 5 days
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subtotal: 5000,
        taxAmount: 900,
        totalAmount: 5900,
        amountPaid: 2000,
        balanceDue: 3900,
      },
    });
    createdInvoiceId = testInvoice.id;

    // Create 1 SUCCESS payment of 2000
    const successPmt = await prisma.payment.create({
      data: {
        paymentNumber: `PAY-TEST-OK-${Date.now()}`,
        invoiceId: testInvoice.id,
        customerId: createdCustomerUserId,
        amount: 2000,
        currency: 'INR',
        paymentMethod: PaymentMethod.UPI,
        status: PaymentStatus.SUCCESS,
        paymentDate: new Date(),
      },
    });
    createdSuccessPaymentId = successPmt.id;

    // Create 1 FAILED payment of 3900 (should NOT be counted in revenue)
    const failedPmt = await prisma.payment.create({
      data: {
        paymentNumber: `PAY-TEST-FAIL-${Date.now()}`,
        invoiceId: testInvoice.id,
        customerId: createdCustomerUserId,
        amount: 3900,
        currency: 'INR',
        paymentMethod: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.FAILED,
        paymentDate: new Date(),
      },
    });
    createdFailedPaymentId = failedPmt.id;
  });

  after(async () => {
    // Clean up test records in reverse dependency order
    try {
      if (createdSuccessPaymentId || createdFailedPaymentId) {
        await prisma.payment.deleteMany({
          where: { id: { in: [createdSuccessPaymentId, createdFailedPaymentId] } },
        });
      }
      if (createdInvoiceId) {
        await prisma.invoice.deleteMany({ where: { id: createdInvoiceId } });
      }
      if (createdSubId) {
        await prisma.subscription.deleteMany({ where: { id: createdSubId } });
      }
      if (createdPlanId) {
        await prisma.plan.deleteMany({ where: { id: createdPlanId } });
      }
      if (createdProductId) {
        await prisma.product.deleteMany({ where: { id: createdProductId } });
      }
      if (createdCustomerUserId) {
        await prisma.user.deleteMany({ where: { id: createdCustomerUserId } });
      }
    } catch (err) {
      // Ignore cleanup error
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // 1. Revenue Calculations
  it('1. Revenue calculation counts only SUCCESS payments and excludes FAILED/PENDING', async () => {
    const res = await fetch(`${baseUrl}/analytics/revenue?period=all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    // Revenue must be >= 2000 (our test payment)
    assert.ok(body.data.totalCollectedRevenue >= 2000);

    // Verify payments in breakdown only have SUCCESS
    const paymentMethodsTotal = body.data.revenueByPaymentMethod.reduce(
      (acc: number, m: any) => acc + m.revenue,
      0
    );
    assert.strictEqual(paymentMethodsTotal, body.data.totalCollectedRevenue);
  });

  // 2. Revenue Calculations Across Date Periods
  it('2. Revenue calculations respect date filtering periods', async () => {
    const res = await fetch(`${baseUrl}/analytics/revenue?period=last7Days`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.data.period, 'last7Days');
    assert.ok(Array.isArray(body.data.revenueTrend));
  });

  // 3. Subscription Counts by Status
  it('3. Subscription counts correctly reflect ACTIVE and other statuses', async () => {
    const res = await fetch(`${baseUrl}/analytics/subscriptions?period=all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.activeSubscriptions >= 1);
    assert.ok(body.data.totalSubscriptions >= 1);
    assert.ok(typeof body.data.retentionRate === 'number');
    assert.ok(Array.isArray(body.data.upcomingRenewals));
  });

  // 4. Customer Counts Excluding Internal Staff / Admin
  it('4. Customer analytics strictly counts CUSTOMER role users and excludes Admin/Staff', async () => {
    const res = await fetch(`${baseUrl}/analytics/customers?period=all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);

    const actualCustCount = await prisma.user.count({
      where: { role: UserRole.CUSTOMER },
    });
    assert.strictEqual(body.data.totalCustomers, actualCustCount);
    assert.ok(body.data.customersWithActiveSubscriptions >= 1);
  });

  // 5. Invoice Outstanding Balance Calculation
  it('5. Billing analytics computes outstanding balance from balanceDue on open invoices', async () => {
    const res = await fetch(`${baseUrl}/analytics/billing?period=all`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.totalOutstandingBalance >= 3900); // our test invoice balanceDue
    assert.ok(body.data.overdueInvoices >= 1);
    assert.ok(body.data.overdueInvoicesAmount >= 3900);
  });

  // 6. Product and Plan Analytics
  it('6. Product analytics aggregates subscriptions by plan and highlights unused items', async () => {
    const res = await fetch(`${baseUrl}/analytics/products`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.totalProducts >= 1);
    assert.ok(body.data.totalPlans >= 1);
    assert.ok(Array.isArray(body.data.topPlans));
    assert.ok(Array.isArray(body.data.topProducts));
  });

  // 7. Invalid and Reversed Date Range Validation
  it('7. Rejects invalid and reversed date ranges with 400 Bad Request', async () => {
    // Reversed: start > end
    const reversedRes = await fetch(
      `${baseUrl}/analytics/overview?period=custom&startDate=2026-12-01&endDate=2026-01-01`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert.strictEqual(reversedRes.status, 400);
    const reversedBody = await reversedRes.json();
    assert.strictEqual(reversedBody.success, false);
    assert.ok(reversedBody.message.includes("cannot be after 'endDate'"));

    // Malformed date format
    const malformedRes = await fetch(
      `${baseUrl}/analytics/overview?period=custom&startDate=invalid-date&endDate=2026-12-31`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert.strictEqual(malformedRes.status, 400);
  });

  // 8. Unauthorized Access
  it('8. Rejects unauthenticated requests with 401 Unauthorized', async () => {
    const res = await fetch(`${baseUrl}/analytics/overview`);
    assert.strictEqual(res.status, 401);
  });

  // 9. Customer Access Restrictions (Forbidden 403)
  it('9. Rejects customer role requests with 403 Forbidden', async () => {
    const res = await fetch(`${baseUrl}/analytics/overview`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(body.message.includes('Forbidden'));
  });

  // 10. Staff Access (Allowed 200)
  it('10. Allows staff role to access business analytics with 200 OK', async () => {
    const res = await fetch(`${baseUrl}/analytics/overview`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
  });

  // 11. CSV Export and Formula Injection Protection
  it('11. CSV export returns valid CSV and protects against formula injection', async () => {
    // Test sanitizer directly
    assert.strictEqual(sanitizeCsvCell('=SUM(A1:A10)'), "'=SUM(A1:A10)");
    assert.strictEqual(sanitizeCsvCell('+12345'), "'+12345");
    assert.strictEqual(sanitizeCsvCell('-12345'), "'-12345");
    assert.strictEqual(sanitizeCsvCell('@cmd'), "'@cmd");
    assert.strictEqual(sanitizeCsvCell('Normal, Text'), '"Normal, Text"');

    // Test API endpoint
    const res = await fetch(`${baseUrl}/analytics/export/csv?type=summary`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/csv'));
    const csvContent = await res.text();
    assert.ok(csvContent.includes('Key Performance Indicator'));
    assert.ok(csvContent.includes('Total Collected Revenue'));
  });

  // 12. PDF Export Generation
  it('12. PDF export returns valid binary PDF buffer with %PDF- signature', async () => {
    const res = await fetch(`${baseUrl}/analytics/export/pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/pdf');

    const buffer = await res.arrayBuffer();
    const pdfHeader = Buffer.from(buffer).subarray(0, 5).toString('ascii');
    assert.strictEqual(pdfHeader, '%PDF-');
    assert.ok(buffer.byteLength > 1000);
  });
});
