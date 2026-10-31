import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../../app';
import prisma from '../../config/db';
import { UserRole, BillingFrequency, ProductStatus, PlanStatus, SubscriptionStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

describe('Products & Plans Modules (Phase 2)', () => {
  let server: http.Server;
  let apiBase: string;

  let adminToken: string;
  let customerToken: string;
  let staffToken: string;

  // Track created entities for cleanup
  const createdProductIds: string[] = [];
  const createdPlanIds: string[] = [];
  const createdSubscriptionIds: string[] = [];

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        apiBase = `http://localhost:${address.port}/api/v1`;
        resolve();
      });
    });

    // 1. Obtain Admin Token
    const adminRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@brightloop.com',
        password: 'Brightloop@2026',
      }),
    });
    const adminData = await adminRes.json();
    assert.strictEqual(adminRes.status, 200);
    adminToken = adminData.data.token;

    // 2. Obtain Staff Token
    const staffRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'staff@brightloop.com',
        password: 'Brightloop@2026',
      }),
    });
    const staffData = await staffRes.json();
    assert.strictEqual(staffRes.status, 200);
    staffToken = staffData.data.token;

    // 3. Obtain Customer Token
    const customerRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@brightloop.com',
        password: 'Brightloop@2026',
      }),
    });
    const customerData = await customerRes.json();
    assert.strictEqual(customerRes.status, 200);
    customerToken = customerData.data.token;
  });

  after(async () => {
    // Clean up created subscriptions, plans, and products
    if (createdSubscriptionIds.length > 0) {
      await prisma.subscriptionItem.deleteMany({
        where: { subscriptionId: { in: createdSubscriptionIds } },
      });
      await prisma.subscription.deleteMany({
        where: { id: { in: createdSubscriptionIds } },
      });
    }

    if (createdPlanIds.length > 0) {
      await prisma.plan.deleteMany({
        where: { id: { in: createdPlanIds } },
      });
    }

    if (createdProductIds.length > 0) {
      await prisma.productVariant.deleteMany({
        where: { productId: { in: createdProductIds } },
      });
      await prisma.product.deleteMany({
        where: { id: { in: createdProductIds } },
      });
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ==========================================================================
  // SECTION 1: PRODUCTS MODULE TESTS
  // ==========================================================================
  describe('1. Products Management (Admin-Only, Types, Prices, Variants)', () => {
    let testProductId: string;

    it('should FORBID non-admin (Customer & Staff) from creating products (403 Forbidden)', async () => {
      // Customer attempt
      const custRes = await fetch(`${apiBase}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          name: 'Unauthorized Product',
          code: 'UNAUTH-01',
          salesPrice: 100,
        }),
      });
      assert.strictEqual(custRes.status, 403);

      // Staff attempt
      const staffRes = await fetch(`${apiBase}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          name: 'Unauthorized Staff Product',
          code: 'UNAUTH-02',
          salesPrice: 100,
        }),
      });
      assert.strictEqual(staffRes.status, 403);
    });

    it('should validate monetary values and reject negative sales prices (422 Unprocessable)', async () => {
      const res = await fetch(`${apiBase}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Negative Price Product',
          code: 'NEG-PRICE-01',
          salesPrice: -50.0,
        }),
      });
      assert.strictEqual(res.status, 422);
    });

    it('should ALLOW Admin to create product storing name, type, sales price, cost price, and notes', async () => {
      const uniqueCode = `PROD-TEST-${Date.now()}`;
      const res = await fetch(`${apiBase}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Enterprise Cloud Billing Suite',
          code: uniqueCode,
          type: 'SOFTWARE',
          salesPrice: 1000.0,
          costPrice: 450.0,
          notes: 'Flagship enterprise edition billing suite with high-volume pipelines.',
          category: 'ERP & Billing',
          brand: 'Odoo Ecosystem',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.name, 'Enterprise Cloud Billing Suite');
      assert.strictEqual(body.data.type, 'SOFTWARE');
      assert.strictEqual(Number(body.data.salesPrice), 1000.0);
      assert.strictEqual(Number(body.data.costPrice), 450.0);
      assert.strictEqual(body.data.notes, 'Flagship enterprise edition billing suite with high-volume pipelines.');

      testProductId = body.data.id;
      createdProductIds.push(testProductId);
    });

    it('should add product variant with surcharge and accurately compute effective price (1000 + 560 = 1560)', async () => {
      const variantSku = `VAR-ODOO-${Date.now()}`;
      const res = await fetch(`${apiBase}/products/${testProductId}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Odoo Multi-Company Addon Tier',
          sku: variantSku,
          priceAdjustment: 560.0,
          attributes: { multiCompany: true, dedicatedHost: true },
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.strictEqual(Number(body.data.priceAdjustment), 560.0);

      // Verify product retrieval computes the exact resulting price: 1000 + 560 = 1560
      const getRes = await fetch(`${apiBase}/products/${testProductId}`);
      const getBody = await getRes.json();
      assert.strictEqual(getRes.status, 200);

      const matchedVariant = getBody.data.variants.find((v: any) => v.sku === variantSku.toUpperCase());
      assert.ok(matchedVariant);
      assert.strictEqual(matchedVariant.priceAdjustment, 560.0);
      assert.strictEqual(matchedVariant.effectivePrice, 1560.0);
    });

    it('should ALLOW Admin to update product fields and notes', async () => {
      const res = await fetch(`${apiBase}/products/${testProductId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          salesPrice: 1200.0,
          notes: 'Updated pricing after Q4 revision.',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(Number(body.data.salesPrice), 1200.0);
      assert.strictEqual(body.data.notes, 'Updated pricing after Q4 revision.');
    });

    it('should ALLOW Admin to archive a product', async () => {
      const res = await fetch(`${apiBase}/products/${testProductId}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.data.status, ProductStatus.ARCHIVED);
      assert.strictEqual(body.data.isActive, false);

      // Re-activate for downstream plan tests
      await prisma.product.update({
        where: { id: testProductId },
        data: { status: ProductStatus.ACTIVE, isActive: true },
      });
    });
  });

  // ==========================================================================
  // SECTION 2: PLANS MODULE TESTS
  // ==========================================================================
  describe('2. Plans Management (Frequencies, Lifecycle Settings, Validation)', () => {
    let activePlanId: string;
    let expiredPlanId: string;
    let archivedPlanId: string;

    it('should FORBID non-admin from creating plans (403 Forbidden)', async () => {
      const res = await fetch(`${apiBase}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          productId: createdProductIds[0],
          name: 'Unauthorized Plan',
          code: 'UNAUTH-PLAN',
          billingFrequency: BillingFrequency.MONTHLY,
          price: 50.0,
        }),
      });
      assert.strictEqual(res.status, 403);
    });

    it('should validate dates and reject availableTo before availableFrom (422)', async () => {
      const res = await fetch(`${apiBase}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          productId: createdProductIds[0],
          name: 'Invalid Date Plan',
          code: 'BAD-DATE-01',
          billingFrequency: BillingFrequency.MONTHLY,
          price: 99.0,
          availableFrom: '2026-12-01T00:00:00.000Z',
          availableTo: '2026-01-01T00:00:00.000Z', // Before availableFrom!
        }),
      });
      assert.strictEqual(res.status, 422);
    });

    it('should support DAILY, WEEKLY, MONTHLY, and YEARLY billing frequencies with automatic cycle days', async () => {
      const frequencies = [
        { freq: BillingFrequency.DAILY, expectedDays: 1 },
        { freq: BillingFrequency.WEEKLY, expectedDays: 7 },
        { freq: BillingFrequency.MONTHLY, expectedDays: 30 },
        { freq: BillingFrequency.YEARLY, expectedDays: 365 },
      ];

      for (const item of frequencies) {
        const uniqueCode = `PLAN-${item.freq}-${Date.now()}`;
        const res = await fetch(`${apiBase}/plans`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            productId: createdProductIds[0],
            name: `Test ${item.freq} Plan`,
            code: uniqueCode,
            billingFrequency: item.freq,
            price: 150.0,
            minQuantity: 1,
            autoCloseOnExpiry: true,
            canPause: true,
            canCloseEarly: true,
            autoRenew: true,
          }),
        });

        const body = await res.json();
        assert.strictEqual(res.status, 201);
        assert.strictEqual(body.data.billingFrequency, item.freq);
        assert.strictEqual(body.data.billingCycleDays, item.expectedDays);
        createdPlanIds.push(body.data.id);
      }
    });

    it('should store configurable lifecycle settings (auto-close, pause, early closure, renewal permissions)', async () => {
      const uniqueCode = `PLAN-LIFECYCLE-${Date.now()}`;
      const res = await fetch(`${apiBase}/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          productId: createdProductIds[0],
          name: 'Flexible Enterprise Annual Plan',
          code: uniqueCode,
          billingFrequency: BillingFrequency.YEARLY,
          price: 1200.0,
          minQuantity: 2,
          autoCloseOnExpiry: true,
          canPause: true,
          canCloseEarly: true,
          autoRenew: false,
          trialDays: 14,
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.data.autoCloseOnExpiry, true);
      assert.strictEqual(body.data.canPause, true);
      assert.strictEqual(body.data.canCloseEarly, true);
      assert.strictEqual(body.data.autoRenew, false);
      assert.strictEqual(body.data.trialDays, 14);
      assert.strictEqual(body.data.minQuantity, 2);

      activePlanId = body.data.id;
      createdPlanIds.push(activePlanId);
    });

    it('should ALLOW Admin to archive a plan', async () => {
      const res = await fetch(`${apiBase}/plans/${activePlanId}/archive`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.data.status, PlanStatus.ARCHIVED);
      assert.strictEqual(body.data.isActive, false);

      archivedPlanId = activePlanId;
    });

    // ==========================================================================
    // SECTION 3: SUBSCRIPTION AVAILABILITY & ARCHIVE GUARDS
    // ==========================================================================
    describe('3. Prevent Customers from Subscribing to Unavailable / Archived Plans', () => {
      before(async () => {
        // Create an expired plan
        const expiredPlan = await prisma.plan.create({
          data: {
            productId: createdProductIds[0],
            name: 'Expired Promo Plan',
            code: `PLAN-EXPIRED-${Date.now()}`,
            billingFrequency: BillingFrequency.MONTHLY,
            price: new Prisma.Decimal(50.0),
            availableFrom: new Date(Date.now() - 30 * 86400000), // 30 days ago
            availableTo: new Date(Date.now() - 5 * 86400000), // 5 days ago (EXPIRED)
            status: PlanStatus.ACTIVE,
            isActive: true,
          },
        });
        expiredPlanId = expiredPlan.id;
        createdPlanIds.push(expiredPlanId);
      });

      it('should PREVENT subscription to an ARCHIVED plan (400 Bad Request)', async () => {
        const res = await fetch(`${apiBase}/plans/${archivedPlanId}/availability`);
        const body = await res.json();
        assert.strictEqual(res.status, 400);
        assert.strictEqual(body.success, false);
        assert.ok(body.message.includes('archived'));
      });

      it('should PREVENT subscription to an EXPIRED plan (400 Bad Request)', async () => {
        const res = await fetch(`${apiBase}/plans/${expiredPlanId}/availability`);
        const body = await res.json();
        assert.strictEqual(res.status, 400);
        assert.strictEqual(body.success, false);
        assert.ok(body.message.includes('expired'));
      });

      it('should PREVENT subscription if quantity is below minimum plan quantity', async () => {
        // Create plan requiring minQuantity: 5
        const bulkPlan = await prisma.plan.create({
          data: {
            productId: createdProductIds[0],
            name: 'Bulk Team Plan',
            code: `PLAN-BULK-${Date.now()}`,
            billingFrequency: BillingFrequency.MONTHLY,
            price: new Prisma.Decimal(40.0),
            minQuantity: 5,
            status: PlanStatus.ACTIVE,
            isActive: true,
          },
        });
        createdPlanIds.push(bulkPlan.id);

        const res = await fetch(`${apiBase}/plans/${bulkPlan.id}/availability?quantity=2`);
        const body = await res.json();
        assert.strictEqual(res.status, 400);
        assert.ok(body.message.includes('minimum of 5'));
      });
    });

    // ==========================================================================
    // SECTION 4: PRESERVE EXISTING SUBSCRIPTION PRICING
    // ==========================================================================
    describe('4. Preserve Existing Subscription Agreed Pricing When Product/Plan Prices Change', () => {
      it('should preserve agreed subscription line price when the underlying Plan price changes', async () => {
        // 1. Create a plan with initial price of 100.00
        const initialPrice = 100.0;
        const testPlan = await prisma.plan.create({
          data: {
            productId: createdProductIds[0],
            name: 'Stable Subscription Plan',
            code: `PLAN-STABLE-${Date.now()}`,
            billingFrequency: BillingFrequency.MONTHLY,
            price: new Prisma.Decimal(initialPrice),
            status: PlanStatus.ACTIVE,
            isActive: true,
          },
        });
        createdPlanIds.push(testPlan.id);

        // 2. Fetch customer user id
        const customer = await prisma.user.findUnique({
          where: { email: 'customer@brightloop.com' },
        });
        assert.ok(customer);

        // 3. Create active subscription locking agreed unitPrice: 100.00 and subtotal: 200.00
        const agreedUnitPrice = 100.0;
        const agreedQuantity = 2;
        const agreedSubtotal = 200.0;
        const agreedTotal = 236.0; // with 18% tax

        const subscription = await prisma.subscription.create({
          data: {
            subscriptionNumber: `SUB-AGREED-${Date.now()}`,
            customerId: customer.id,
            planId: testPlan.id,
            status: SubscriptionStatus.ACTIVE,
            quantity: agreedQuantity,
            unitPrice: new Prisma.Decimal(agreedUnitPrice),
            taxRate: new Prisma.Decimal(18.0),
            taxAmount: new Prisma.Decimal(36.0),
            subtotal: new Prisma.Decimal(agreedSubtotal),
            totalAmount: new Prisma.Decimal(agreedTotal),
            startDate: new Date(),
            items: {
              create: [
                {
                  productId: createdProductIds[0],
                  planId: testPlan.id,
                  description: 'Agreed Price Subscription Line Item',
                  quantity: agreedQuantity,
                  unitPrice: new Prisma.Decimal(agreedUnitPrice),
                  lineTotal: new Prisma.Decimal(agreedSubtotal),
                },
              ],
            },
          },
          include: { items: true },
        });
        createdSubscriptionIds.push(subscription.id);

        // Verify initial subscription agreed pricing
        assert.strictEqual(Number(subscription.unitPrice), 100.0);
        assert.strictEqual(Number(subscription.subtotal), 200.0);
        assert.strictEqual(Number(subscription.items[0].unitPrice), 100.0);

        // 4. Admin updates the Plan price drastically from 100.00 to 350.00
        const updatedPlanRes = await fetch(`${apiBase}/plans/${testPlan.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            price: 350.0,
          }),
        });
        const updatedPlanBody = await updatedPlanRes.json();
        assert.strictEqual(updatedPlanRes.status, 200);
        assert.strictEqual(Number(updatedPlanBody.data.price), 350.0);

        // 5. CRITICAL TEST: Verify the existing subscription's pricing REMAINS UNCHANGED at agreed price 100.00!
        const existingSubscription = await prisma.subscription.findUnique({
          where: { id: subscription.id },
          include: { items: true },
        });

        assert.ok(existingSubscription);
        // Stored agreed price on subscription MUST NOT be altered by plan price changes
        assert.strictEqual(Number(existingSubscription.unitPrice), 100.0);
        assert.strictEqual(Number(existingSubscription.subtotal), 200.0);
        assert.strictEqual(Number(existingSubscription.totalAmount), 236.0);
        assert.strictEqual(Number(existingSubscription.items[0].unitPrice), 100.0);
        assert.strictEqual(Number(existingSubscription.items[0].lineTotal), 200.0);
      });
    });
  });
});
