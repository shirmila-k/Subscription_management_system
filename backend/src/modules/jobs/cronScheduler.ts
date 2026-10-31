import cron from 'node-cron';
import prisma from '../../config/prisma';
import { InvoicesService } from '../invoices/invoices.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionStatus, InvoiceStatus } from '@prisma/client';

export class CronJobs {
  /**
   * 1. Automated Billing Day Invoice Generation
   * Runs daily at midnight (00:05 AM)
   */
  public static async runBillingGeneration() {
    console.log('[Cron Job] Executing Automated Billing Generation...');
    const now = new Date();

    try {
      const dueSubscriptions = await prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: { lte: now },
        },
        include: { plan: true },
      });

      console.log(`[Cron Job] Found ${dueSubscriptions.length} subscriptions due for billing.`);

      for (const sub of dueSubscriptions) {
        try {
          const periodStart = sub.nextBillingDate || now;
          const periodEnd = SubscriptionsService.calculateNextBillingDate(
            periodStart,
            sub.plan.billingFrequency
          );

          await InvoicesService.generateInvoiceForSubscription(sub.id, periodStart, periodEnd);

          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              lastBilledDate: periodStart,
              nextBillingDate: periodEnd,
            },
          });

          console.log(`[Cron Job] Generated invoice for subscription: ${sub.subscriptionNumber}`);
        } catch (err) {
          console.error(`[Cron Job] Error billing subscription ${sub.id}:`, err);
        }
      }
    } catch (error) {
      console.error('[Cron Job] Billing generation failed:', error);
    }
  }

  /**
   * 2. Renewal Reminders
   * Runs daily at 08:00 AM
   * Dispatches reminders for subscriptions expiring within 7 days
   */
  public static async runRenewalReminders() {
    console.log('[Cron Job] Executing Renewal Reminders scan...');
    const today = new Date();
    const reminderThreshold = new Date();
    reminderThreshold.setDate(today.getDate() + 7);

    try {
      const expiringSubscriptions = await prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          expiryDate: {
            gte: today,
            lte: reminderThreshold,
          },
        },
        include: {
          customer: true,
          plan: true,
        },
      });

      console.log(
        `[Cron Job] Found ${expiringSubscriptions.length} subscriptions approaching expiration.`
      );

      for (const sub of expiringSubscriptions) {
        // In production, integrate email/SMS/Webhook dispatch here
        console.log(
          `[Reminder Notification] To: ${sub.customer.email} | Subscription ${sub.subscriptionNumber} for '${sub.plan.name}' expires on ${sub.expiryDate?.toDateString()}.`
        );
      }
    } catch (error) {
      console.error('[Cron Job] Renewal reminders failed:', error);
    }
  }

  /**
   * 3. Expired Subscription Closures
   * Runs daily at 01:00 AM
   * Auto-closes expired subscriptions whose plan mandates auto-close
   */
  public static async runExpiredClosures() {
    console.log('[Cron Job] Checking for expired subscriptions to close...');
    const now = new Date();

    try {
      const expiredSubs = await prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          expiryDate: { lt: now },
          plan: { autoClose: true },
        },
      });

      console.log(`[Cron Job] Found ${expiredSubs.length} expired subscriptions to auto-close.`);

      for (const sub of expiredSubs) {
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            status: SubscriptionStatus.CLOSED,
            cancelledAt: now,
            cancellationReason: 'Automated Lifecycle Rule: Subscription validity period expired.',
          },
        });
        console.log(`[Cron Job] Closed expired subscription: ${sub.subscriptionNumber}`);
      }
    } catch (error) {
      console.error('[Cron Job] Expired subscription closures failed:', error);
    }
  }

  /**
   * 4. Overdue Invoice Tracking
   * Runs every 6 hours
   */
  public static async runOverdueInvoiceTracking() {
    console.log('[Cron Job] Checking for overdue invoices...');
    const now = new Date();

    try {
      const overdueInvoices = await prisma.invoice.updateMany({
        where: {
          status: { in: [InvoiceStatus.CONFIRMED, InvoiceStatus.DRAFT] },
          dueDate: { lt: now },
        },
        data: {
          status: InvoiceStatus.OVERDUE,
        },
      });

      console.log(`[Cron Job] Updated ${overdueInvoices.count} invoices to OVERDUE status.`);
    } catch (error) {
      console.error('[Cron Job] Overdue invoice tracking failed:', error);
    }
  }
}

/**
 * Initializes and schedules all background cron routines
 */
export const initCronJobs = () => {
  console.log('[Cron Service] Initializing background task schedulers...');

  // 1. Billing Generation: Daily at 00:05
  cron.schedule('5 0 * * *', () => {
    CronJobs.runBillingGeneration();
  });

  // 2. Renewal Reminders: Daily at 08:00 AM
  cron.schedule('0 8 * * *', () => {
    CronJobs.runRenewalReminders();
  });

  // 3. Expired Subscription Closures: Daily at 01:00 AM
  cron.schedule('0 1 * * *', () => {
    CronJobs.runExpiredClosures();
  });

  // 4. Overdue Invoice Tracking: Every 6 hours ('0 */6 * * *')
  cron.schedule('0 */6 * * *', () => {
    CronJobs.runOverdueInvoiceTracking();
  });

  console.log('[Cron Service] All background jobs scheduled successfully.');
};
