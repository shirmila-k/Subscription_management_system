import { PrismaClient, UserRole, BillingFrequency, DiscountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Brightloop database seeding...');

  // 1. Seed Users (Admin, Staff, Customer)
  const passwordHash = await bcrypt.hash('Brightloop@2026', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@brightloop.com' },
    update: {},
    create: {
      email: 'admin@brightloop.com',
      passwordHash,
      firstName: 'Alex',
      lastName: 'Sterling',
      role: UserRole.ADMIN,
      companyName: 'Brightloop Software HQ',
      phone: '+1-555-0101',
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: 'staff@brightloop.com' },
    update: {},
    create: {
      email: 'staff@brightloop.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Miller',
      role: UserRole.STAFF,
      companyName: 'Brightloop Sales Ops',
      phone: '+1-555-0102',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@acmecorp.com' },
    update: {},
    create: {
      email: 'customer@acmecorp.com',
      passwordHash,
      firstName: 'David',
      lastName: 'Kovacs',
      role: UserRole.CUSTOMER,
      companyName: 'Acme Corporation',
      phone: '+1-555-0103',
      taxId: 'US-TAX-456789',
      address: '100 Innovation Way, Silicon Valley, CA',
    },
  });

  console.log('✅ Users seeded:');
  console.log(`   Admin:    ${admin.email}`);
  console.log(`   Staff:    ${staff.email}`);
  console.log(`   Customer: ${customer.email}`);

  // 2. Seed Products with Variants (e.g. Odoo Suite and Brightloop ERP)
  const odooProduct = await prisma.product.upsert({
    where: { code: 'PROD-ODOO-ERP' },
    update: {},
    create: {
      name: 'Odoo ERP Business Suite',
      code: 'PROD-ODOO-ERP',
      description: 'Comprehensive business management suite with CRM, Inventory, Invoicing, and HR.',
      category: 'Enterprise ERP',
      brand: 'Odoo Ecosystem',
      isActive: true,
      variants: {
        create: [
          {
            name: 'Standard Cloud Edition',
            sku: 'ODOO-STD-01',
            priceAdjustment: 0.0,
            attributes: { maxApps: 10, multiCompany: false },
          },
          {
            name: 'Multi-Brand Enterprise Edition',
            sku: 'ODOO-ENT-02',
            priceAdjustment: 50.0,
            attributes: { maxApps: 'unlimited', multiCompany: true, dedicatedServer: true },
          },
        ],
      },
    },
    include: { variants: true },
  });

  const brightCloudProduct = await prisma.product.upsert({
    where: { code: 'PROD-BRIGHT-CRM' },
    update: {},
    create: {
      name: 'Brightloop Cloud CRM & Sales Pipeline',
      code: 'PROD-BRIGHT-CRM',
      description: 'AI-assisted customer relationship management, sales intelligence, and automated quoting.',
      category: 'Sales Automation',
      brand: 'Brightloop Suite',
      isActive: true,
      variants: {
        create: [
          {
            name: 'Starter Pro Edition',
            sku: 'BRIGHT-CRM-PRO',
            priceAdjustment: 0.0,
            attributes: { seats: 5, aiCredits: 500 },
          },
        ],
      },
    },
    include: { variants: true },
  });

  console.log('✅ Products & Variants seeded.');

  // 3. Seed Plans
  const standardVariant = odooProduct.variants[0];
  const enterpriseVariant = odooProduct.variants[1];

  await prisma.plan.upsert({
    where: { code: 'PLAN-ODOO-MONTHLY-STD' },
    update: {},
    create: {
      productId: odooProduct.id,
      variantId: standardVariant?.id,
      name: 'Odoo Standard Monthly',
      code: 'PLAN-ODOO-MONTHLY-STD',
      description: 'Monthly subscription for Odoo Standard Cloud edition.',
      billingFrequency: BillingFrequency.MONTHLY,
      billingCycleDays: 30,
      price: 99.0,
      currency: 'USD',
      minQuantity: 1,
      autoCloseOnExpiry: true,
      canPause: true,
      autoRenew: true,
    },
  });

  await prisma.plan.upsert({
    where: { code: 'PLAN-ODOO-YEARLY-ENT' },
    update: {},
    create: {
      productId: odooProduct.id,
      variantId: enterpriseVariant?.id,
      name: 'Odoo Enterprise Annual',
      code: 'PLAN-ODOO-YEARLY-ENT',
      description: 'Annual enterprise multi-brand package with 15% built-in term discount.',
      billingFrequency: BillingFrequency.YEARLY,
      billingCycleDays: 365,
      price: 1499.0,
      currency: 'USD',
      minQuantity: 1,
      autoCloseOnExpiry: true,
      canPause: true,
      autoRenew: true,
    },
  });

  await prisma.plan.upsert({
    where: { code: 'PLAN-BRIGHT-MONTHLY' },
    update: {},
    create: {
      productId: brightCloudProduct.id,
      variantId: brightCloudProduct.variants[0]?.id,
      name: 'Brightloop CRM Growth Monthly',
      code: 'PLAN-BRIGHT-MONTHLY',
      description: 'Monthly subscription for fast-growing sales teams.',
      billingFrequency: BillingFrequency.MONTHLY,
      billingCycleDays: 30,
      price: 49.0,
      currency: 'USD',
      minQuantity: 1,
      autoCloseOnExpiry: false,
      canPause: true,
      autoRenew: true,
    },
  });

  console.log('✅ Plans seeded.');

  // 4. Seed Discounts
  await prisma.discount.upsert({
    where: { code: 'BRIGHT2026' },
    update: {},
    create: {
      code: 'BRIGHT2026',
      description: '20% off launch discount for new subscribers',
      type: DiscountType.PERCENTAGE,
      value: 20.0,
      minQuantity: 1,
      usageLimit: 500,
      isActive: true,
    },
  });

  await prisma.discount.upsert({
    where: { code: 'ENTERPRISE100' },
    update: {},
    create: {
      code: 'ENTERPRISE100',
      description: '$100 flat discount for high-volume enterprise orders',
      type: DiscountType.FIXED,
      value: 100.0,
      minQuantity: 2,
      minPurchaseAmount: 500.0,
      isActive: true,
    },
  });

  console.log('✅ Discounts seeded.');
  console.log('🌟 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
