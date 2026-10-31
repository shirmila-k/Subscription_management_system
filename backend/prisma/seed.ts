import { PrismaClient, Role, BillingFrequency, PaymentTerms, DiscountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Brightloop database...');

  // 1. Seed Users
  const passwordSalt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('Brightloop@2026', passwordSalt);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@brightloop.com' },
    update: {},
    create: {
      email: 'admin@brightloop.com',
      passwordHash: defaultPassword,
      name: 'System Administrator',
      role: Role.ADMIN,
      companyName: 'Brightloop Software HQ',
      phone: '+1-800-555-0199',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@brightloop.com' },
    update: {},
    create: {
      email: 'staff@brightloop.com',
      passwordHash: defaultPassword,
      name: 'Sarah Operations',
      role: Role.STAFF,
      companyName: 'Brightloop Support',
      phone: '+1-800-555-0188',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@acmecorp.com' },
    update: {},
    create: {
      email: 'customer@acmecorp.com',
      passwordHash: defaultPassword,
      name: 'Alex Johnson',
      role: Role.CUSTOMER,
      companyName: 'Acme Corporation',
      phone: '+1-555-234-5678',
      address: '742 Evergreen Terrace, Springfield',
    },
  });

  console.log('Seeded Users: Admin, Staff, Customer');

  // 2. Seed Product with Variants (e.g. Odoo style brand add-ons)
  const erpProduct = await prisma.product.upsert({
    where: { sku: 'PROD-BL-ERP-01' },
    update: {},
    create: {
      sku: 'PROD-BL-ERP-01',
      name: 'Brightloop Cloud ERP Platform',
      type: 'Software / SaaS',
      salesPrice: 99.0,
      costPrice: 45.0,
      notes: 'Flagship ERP platform for small, medium and enterprise clients.',
      brand: 'Brightloop Enterprise',
      category: 'Software / SaaS',
      description: 'Comprehensive business management suite with accounting, inventory, and CRM modules.',
      variants: {
        create: [
          {
            sku: 'VAR-ERP-STD',
            name: 'Standard Edition (Single Tenant)',
            attributes: { storageGB: 50, userSeats: 10, supportTier: 'Standard' },
            extraCost: 0,
          },
          {
            sku: 'VAR-ERP-ENT',
            name: 'Enterprise Edition (Dedicated Cluster & 24/7 SLA)',
            attributes: { storageGB: 500, userSeats: 100, supportTier: 'Dedicated 24/7' },
            extraCost: 150.0,
          },
          {
            sku: 'VAR-ERP-ODOO',
            name: 'Odoo Brand Edition (Integrated Odoo Apps & Connector)',
            attributes: { brand: 'Odoo', connector: 'Odoo ERP Sync', supportTier: 'Gold' },
            extraCost: 560.0,
          },
        ],
      },
    },
    include: { variants: true },
  });

  console.log('Seeded Product and Variants (including Odoo Brand +560)');

  // 3. Seed Plans with Billing Frequencies and Lifecycle Rules
  const monthlyPlan = await prisma.plan.create({
    data: {
      productId: erpProduct.id,
      variantId: erpProduct.variants[0]?.id,
      name: 'Cloud ERP Professional (Monthly)',
      description: 'Monthly billing plan with 10 user seats and standard support.',
      billingFrequency: BillingFrequency.MONTHLY,
      cost: 99.0,
      currency: 'USD',
      minimumQuantity: 1,
      autoClose: true,
      autoRenew: true,
      pauseAllowed: true,
      trialPeriodDays: 14,
      gracePeriodDays: 7,
    },
  });

  const yearlyPlan = await prisma.plan.create({
    data: {
      productId: erpProduct.id,
      variantId: erpProduct.variants[1]?.id,
      name: 'Cloud ERP Enterprise (Annual)',
      description: 'Yearly billing with dedicated cluster and 2 months free discount included.',
      billingFrequency: BillingFrequency.YEARLY,
      cost: 990.0,
      currency: 'USD',
      minimumQuantity: 1,
      autoClose: true,
      autoRenew: true,
      pauseAllowed: true,
      trialPeriodDays: 30,
      gracePeriodDays: 15,
    },
  });

  console.log('Seeded Plans (Monthly & Yearly)');

  // 4. Seed Quotation Template for Sales Team
  await prisma.quotationTemplate.upsert({
    where: { name: 'Standard Corporate ERP Package' },
    update: {},
    create: {
      name: 'Standard Corporate ERP Package',
      description: 'Pre-set offer template for mid-market clients with standard 30-day validity.',
      planId: monthlyPlan.id,
      validityDays: 30,
      defaultPaymentTerms: PaymentTerms.NET30,
      defaultNotes: 'Includes standard onboarding, data migration consultation, and 10 user seats.',
      lines: {
        create: [
          {
            description: 'ERP Professional Monthly Base Subscription',
            quantity: 1,
            unitPrice: 99.0,
            variantId: erpProduct.variants[0]?.id,
          },
        ],
      },
    },
  });

  console.log('Seeded Quotation Template for Sales Team');

  // 5. Seed Promo Discount Code
  await prisma.discount.upsert({
    where: { code: 'WELCOME20' },
    update: {},
    create: {
      code: 'WELCOME20',
      type: DiscountType.PERCENTAGE,
      value: 20.0,
      minQuantity: 1,
      minPurchaseAmount: 50.0,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2027-12-31'),
      maxUses: 500,
      usedCount: 0,
      isActive: true,
    },
  });

  console.log('Seeded Discount Code: WELCOME20');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
