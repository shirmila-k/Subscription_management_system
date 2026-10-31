import dotenv from 'dotenv';
import path from 'path';

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:12345@localhost:3306/brightloop_subscriptions',
  jwtSecret: process.env.JWT_SECRET || 'brightloop_super_secret_jwt_key_2026_production_ready',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  companyName: process.env.COMPANY_NAME || 'Brightloop Software Inc.',
  companyEmail: process.env.COMPANY_EMAIL || 'billing@brightloop.com',
  companyTaxId: process.env.COMPANY_TAX_ID || 'US-EIN-987654321',
  billingTaxPercent: parseFloat(process.env.BILLING_TAX_PERCENT || '18.00'),
  cronScheduleBilling: process.env.CRON_SCHEDULE_BILLING || '0 2 * * *',
  cronScheduleReminders: process.env.CRON_SCHEDULE_REMINDERS || '0 8 * * *',
  cronScheduleLifecycle: process.env.CRON_SCHEDULE_LIFECYCLE || '0 0 * * *',
};
