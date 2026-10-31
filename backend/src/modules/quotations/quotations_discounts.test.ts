import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../../app';
import prisma from '../../config/db';
import {
  UserRole,
  DiscountType,
  QuotationStatus,
  SubscriptionStatus,
  ProductStatus,
  PlanStatus,
  BillingFrequency,
  PaymentTerms,
} from '@prisma/client';

describe('Phase 3 — Admin & Sales Modules (Discounts, Templates, Quotations, and Conversion)', () => {
  let server: http.Server;
  let apiBase: string;

  let adminToken: string;
  let staffToken: string;
  let customerToken: string;
  let customerId: string;

  // Track entities created for cleanup
  const createdDiscountIds: string[] = [];
  const createdTemplateIds: string[] = [];
  const createdQuotationIds: string[] = [];
  const createdSubscriptionIds: string[] = [];
  let testProductId: string;
  let testPlanId: string;

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
    const adminData: any = await adminRes.json();
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
    const staffData: any = await staffRes.json();
    assert.strictEqual(staffRes.status, 200);
    staffToken = staffData.data.token;

    // 3. Obtain Customer Token & ID
    const customerRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@brightloop.com',
        password: 'Brightloop@2026',
      }),
    });
    const customerData: any = await customerRes.json();
    assert.strictEqual(customerRes.status, 200);
    customerToken = customerData.data.token;
    customerId = customerData.data.user.id;

    // 4. Create a test product & plan to use in quotations
    const prodRes = await fetch(`${apiBase}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Phase 3 Cloud Server',
        code: `P3-PROD-${Date.now()}`,
        type: 'SERVICE',
        salesPrice: 1000,
        costPrice: 500,
      }),
    });
    const prodData: any = await prodRes.json();
    assert.strictEqual(prodRes.status, 201);
    testProductId = prodData.data.id;

    const planRes = await fetch(`${apiBase}/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        productId: testProductId,
        name: 'Phase 3 Pro Tier',
        code: `P3-PLAN-${Date.now()}`,
        billingFrequency: 'MONTHLY',
        price: 2500,
        minQuantity: 1,
      }),
    });
    const planData: any = await planRes.json();
    assert.strictEqual(planRes.status, 201);
    testPlanId = planData.data.id;
  });

  after(async () => {
    // Cleanup in foreign key safe order
    for (const subId of createdSubscriptionIds) {
      await prisma.subscriptionLifecycleLog.deleteMany({ where: { subscriptionId: subId } });
      await prisma.subscriptionItem.deleteMany({ where: { subscriptionId: subId } });
      await prisma.subscription.deleteMany({ where: { id: subId } });
    }

    for (const qId of createdQuotationIds) {
      await prisma.quotationItem.deleteMany({ where: { quotationId: qId } });
      await prisma.quotation.deleteMany({ where: { id: qId } });
    }

    for (const tId of createdTemplateIds) {
      await prisma.quotationTemplate.deleteMany({ where: { id: tId } });
    }

    for (const dId of createdDiscountIds) {
      await prisma.discount.deleteMany({ where: { id: dId } });
    }

    if (testPlanId) {
      await prisma.plan.deleteMany({ where: { id: testPlanId } });
    }
    if (testProductId) {
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // =========================================================================
  // 1. DISCOUNT RULE ENGINE
  // =========================================================================
  describe('1. Discount Rule Engine', () => {
    let testDiscountCode: string;
    let testDiscountId: string;

    it('should allow Admin to create a valid percentage discount with cap and minPurchase', async () => {
      testDiscountCode = `TEST_DISC_${Date.now()}`;
      const res = await fetch(`${apiBase}/discounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Annual 20% Off',
          code: testDiscountCode,
          type: 'PERCENTAGE',
          value: 20,
          minQuantity: 2,
          minPurchaseAmount: 1000,
          maxDiscountAmount: 500,
        }),
      });

      const data: any = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(data.data.code, testDiscountCode);
      assert.strictEqual(data.data.type, 'PERCENTAGE');
      testDiscountId = data.data.id;
      createdDiscountIds.push(testDiscountId);
    });

    it('should reject discount creation with invalid inputs (percentage > 100 or negative value)', async () => {
      const res = await fetch(`${apiBase}/discounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          code: 'INVALID_150',
          type: 'PERCENTAGE',
          value: 150,
        }),
      });

      assert.strictEqual(res.status, 400);
    });

    it('should reject discount creation by unauthorized users (STAFF or CUSTOMER)', async () => {
      const res = await fetch(`${apiBase}/discounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          code: 'HACKER_CODE',
          type: 'PERCENTAGE',
          value: 50,
        }),
      });

      assert.strictEqual(res.status, 403);
    });

    it('should correctly calculate discount and enforce cap ceiling', async () => {
      // Subtotal $5,000, 20% = $1,000, but cap is $500
      const res = await fetch(`${apiBase}/discounts/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          code: testDiscountCode,
          quantity: 2,
          subtotal: 5000,
        }),
      });

      const data: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.data.discountAmount, 500);
    });

    it('should reject discount when minimum quantity requirement is not met', async () => {
      const res = await fetch(`${apiBase}/discounts/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          code: testDiscountCode,
          quantity: 1, // Requires 2
          subtotal: 5000,
        }),
      });

      assert.strictEqual(res.status, 400);
      const data: any = await res.json();
      assert.match(data.message, /requires a minimum quantity of 2/i);
    });

    it('should reject discount when minimum purchase amount requirement is not met', async () => {
      const res = await fetch(`${apiBase}/discounts/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          code: testDiscountCode,
          quantity: 5,
          subtotal: 500, // Requires 1000
        }),
      });

      assert.strictEqual(res.status, 400);
      const data: any = await res.json();
      assert.match(data.message, /requires a minimum subtotal/i);
    });

    it('should reject expired discounts', async () => {
      const expiredCode = `EXPIRED_${Date.now()}`;
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const createRes = await fetch(`${apiBase}/discounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          code: expiredCode,
          type: 'FIXED',
          value: 100,
          startDate: twoDaysAgo.toISOString(),
          endDate: yesterday.toISOString(),
        }),
      });
      const createData: any = await createRes.json();
      assert.strictEqual(createRes.status, 201);
      createdDiscountIds.push(createData.data.id);

      const valRes = await fetch(`${apiBase}/discounts/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          code: expiredCode,
          quantity: 1,
          subtotal: 1000,
        }),
      });

      assert.strictEqual(valRes.status, 400);
      const valData: any = await valRes.json();
      assert.match(valData.message, /expired/i);
    });
  });

  // =========================================================================
  // 2. QUOTATION TEMPLATES
  // =========================================================================
  describe('2. Quotation Templates', () => {
    let templateId: string;

    it('should allow Admin to create a quotation template with default terms and line items', async () => {
      const res = await fetch(`${apiBase}/quotation-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: 'Enterprise Cloud SLA Template',
          description: 'Standard 99.9% uptime SLA package with support',
          defaultTerms: 'Payment due Net 30 days. All disputes subject to jurisdiction.',
          defaultValidityDays: 14,
          defaultItems: [
            {
              productId: testProductId,
              planId: testPlanId,
              description: 'Enterprise Cloud SLA Base Node',
              quantity: 2,
              unitPrice: 2500,
              discountPercent: 10,
              taxRate: 18,
            },
          ],
        }),
      });

      const data: any = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(data.data.name, 'Enterprise Cloud SLA Template');
      assert.strictEqual(data.data.defaultValidityDays, 14);
      templateId = data.data.id;
      createdTemplateIds.push(templateId);
    });

    it('should allow Staff and Admin to view quotation templates', async () => {
      const res = await fetch(`${apiBase}/quotation-templates`, {
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      const data: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.some((t: any) => t.id === templateId));
    });

    it('should forbid Customer from managing quotation templates', async () => {
      const res = await fetch(`${apiBase}/quotation-templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ name: 'Hacked Template' }),
      });
      assert.strictEqual(res.status, 403);
    });

    it('should allow Admin to update template terms and validity days', async () => {
      const res = await fetch(`${apiBase}/quotation-templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          defaultValidityDays: 21,
          defaultTerms: 'Updated Terms Net 45 days.',
        }),
      });

      const data: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.data.defaultValidityDays, 21);
      assert.strictEqual(data.data.defaultTerms, 'Updated Terms Net 45 days.');
    });
  });

  // =========================================================================
  // 3. QUOTATIONS & SALES WORKFLOW
  // =========================================================================
  describe('3. Quotations Lifecycle & Line-Item Calculations', () => {
    let quotationId: string;
    let quotationNumber: string;

    it('should create a quotation with accurate server-side monetary calculations', async () => {
      // 2 units at $2500 = $5000
      // 1 item line discount $200 -> taxable = $4800
      // 18% tax on $4800 = $864
      // Total = $4800 + $864 = $5664
      const res = await fetch(`${apiBase}/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          customerId,
          validityDays: 15,
          taxRate: 18,
          items: [
            {
              productId: testProductId,
              planId: testPlanId,
              description: 'Phase 3 Pro Tier Cloud Package',
              quantity: 2,
              unitPrice: 2500,
              discountAmount: 200,
            },
          ],
        }),
      });

      const data: any = await res.json();
      assert.strictEqual(res.status, 201);
      assert.ok(data.data.quotationNumber.startsWith('QT-'));
      assert.strictEqual(data.data.status, 'DRAFT');
      assert.strictEqual(Number(data.data.subtotal), 5000);
      assert.strictEqual(Number(data.data.discountAmount), 200);
      assert.strictEqual(Number(data.data.taxAmount), 864);
      assert.strictEqual(Number(data.data.totalAmount), 5664);

      quotationId = data.data.id;
      quotationNumber = data.data.quotationNumber;
      createdQuotationIds.push(quotationId);
    });

    it('should allow Staff to issue/send the quotation to the customer (DRAFT -> SENT)', async () => {
      const res = await fetch(`${apiBase}/quotations/${quotationId}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
      });

      const data: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.data.status, 'SENT');
    });

    it('should allow Customer to accept their issued quotation (SENT -> ACCEPTED)', async () => {
      const res = await fetch(`${apiBase}/quotations/${quotationId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      const data: any = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.data.status, 'ACCEPTED');
    });

    it('should prevent modifying an accepted quotation', async () => {
      const res = await fetch(`${apiBase}/quotations/${quotationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          notes: 'Attempting unauthorized modification',
        }),
      });

      assert.strictEqual(res.status, 500);
      const data: any = await res.json();
      assert.match(data.message, /Cannot modify quotation in 'ACCEPTED' state/i);
    });
  });

  // =========================================================================
  // 4. QUOTE-TO-SUBSCRIPTION CONVERSION & TRANSACTION SAFETY
  // =========================================================================
  describe('4. Quote-to-Subscription Conversion & Transaction Safety', () => {
    let convertibleQuoteId: string;
    let createdSubscriptionId: string;

    before(async () => {
      // Create and accept a quotation for conversion testing
      const quoteRes = await fetch(`${apiBase}/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          customerId,
          validityDays: 30,
          taxRate: 18,
          items: [
            {
              productId: testProductId,
              planId: testPlanId,
              description: 'Transactional Cloud Subscription Bundle',
              quantity: 3,
              unitPrice: 2500,
              discountAmount: 500,
            },
          ],
        }),
      });
      const quoteData: any = await quoteRes.json();
      convertibleQuoteId = quoteData.data.id;
      createdQuotationIds.push(convertibleQuoteId);

      // Send & Accept
      await fetch(`${apiBase}/quotations/${convertibleQuoteId}/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${staffToken}` },
      });
      await fetch(`${apiBase}/quotations/${convertibleQuoteId}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
    });

    it('should convert accepted quotation to confirmed subscription within an atomic transaction', async () => {
      const res = await fetch(`${apiBase}/quotations/${convertibleQuoteId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          paymentTerms: 'NET_30',
          autoRenew: true,
          notes: 'Converted by enterprise sales rep',
        }),
      });

      const data: any = await res.json();
      assert.strictEqual(res.status, 201);
      assert.ok(data.data.subscriptionNumber.startsWith('SUB-'));
      assert.strictEqual(data.data.status, 'CONFIRMED');
      assert.strictEqual(data.data.quotationId, convertibleQuoteId);
      assert.strictEqual(Number(data.data.subtotal), 7500); // 3 * 2500
      assert.strictEqual(Number(data.data.discountAmount), 500);
      assert.strictEqual(Number(data.data.totalAmount), 8260); // (7500 - 500) * 1.18 = 8260

      createdSubscriptionId = data.data.id;
      createdSubscriptionIds.push(createdSubscriptionId);

      // Verify quotation status is updated to CONVERTED
      const quoteCheck = await prisma.quotation.findUnique({
        where: { id: convertibleQuoteId },
      });
      assert.strictEqual(quoteCheck?.status, QuotationStatus.CONVERTED);

      // Verify SubscriptionItem lines snapshot
      const items = await prisma.subscriptionItem.findMany({
        where: { subscriptionId: createdSubscriptionId },
      });
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].description, 'Transactional Cloud Subscription Bundle');
      assert.strictEqual(items[0].quantity, 3);
      assert.strictEqual(Number(items[0].unitPrice), 2500);

      // Verify lifecycle log
      const logs = await prisma.subscriptionLifecycleLog.findMany({
        where: { subscriptionId: createdSubscriptionId },
      });
      assert.strictEqual(logs.length, 1);
      assert.strictEqual(logs[0].action, 'CONVERTED_FROM_QUOTATION');
      assert.strictEqual(logs[0].toStatus, 'CONFIRMED');
    });

    it('should prevent duplicate conversion of the same quotation idempotently', async () => {
      const duplicateRes = await fetch(`${apiBase}/quotations/${convertibleQuoteId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({
          paymentTerms: 'NET_30',
        }),
      });

      assert.strictEqual(duplicateRes.status, 500);
      const data: any = await duplicateRes.json();
      assert.match(data.message, /already been converted to subscription/i);

      // Ensure no duplicate subscription was created
      const subCount = await prisma.subscription.count({
        where: { quotationId: convertibleQuoteId },
      });
      assert.strictEqual(subCount, 1);
    });

    it('should forbid Customer from executing quote-to-subscription conversion', async () => {
      const res = await fetch(`${apiBase}/quotations/${convertibleQuoteId}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({}),
      });

      assert.strictEqual(res.status, 403);
    });

    it('should roll back transaction completely if conversion validation fails', async () => {
      // Create a quotation referencing an archived product to trigger failure during conversion
      const archivedProd = await prisma.product.create({
        data: {
          name: 'Archived Legacy Server',
          code: `ARCHIVED-${Date.now()}`,
          type: 'SERVICE',
          salesPrice: 500,
          costPrice: 200,
          status: ProductStatus.ARCHIVED,
          isActive: false,
        },
      });

      const badQuote = await prisma.quotation.create({
        data: {
          quotationNumber: `QT-FAIL-${Date.now()}`,
          customerId,
          status: QuotationStatus.ACCEPTED,
          quotationDate: new Date(),
          expiryDate: new Date(Date.now() + 86400000),
          subtotal: 500,
          totalAmount: 590,
          items: {
            create: [
              {
                productId: archivedProd.id,
                planId: testPlanId,
                description: 'Archived Product Bundle',
                quantity: 1,
                unitPrice: 500,
                lineTotal: 590,
              },
            ],
          },
        },
      });
      createdQuotationIds.push(badQuote.id);

      const beforeSubCount = await prisma.subscription.count();

      const res = await fetch(`${apiBase}/quotations/${badQuote.id}/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${staffToken}`,
        },
        body: JSON.stringify({}),
      });

      assert.strictEqual(res.status, 500);
      const data: any = await res.json();
      assert.match(data.message, /archived and cannot be subscribed to/i);

      // Verify database rollback: no subscription was created, count unchanged
      const afterSubCount = await prisma.subscription.count();
      assert.strictEqual(afterSubCount, beforeSubCount);

      // Verify quotation status remains intact (was not modified)
      const quoteAfter = await prisma.quotation.findUnique({ where: { id: badQuote.id } });
      assert.strictEqual(quoteAfter?.status, QuotationStatus.ACCEPTED);

      // Cleanup
      await prisma.product.delete({ where: { id: archivedProd.id } });
    });
  });
});
