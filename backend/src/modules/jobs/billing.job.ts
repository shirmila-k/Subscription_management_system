import prisma from '../../config/db';
import { invoicesService } from '../invoices/invoices.service';
import { SubscriptionStatus, InvoiceStatus } from '@prisma/client';
import { calculateNextBillingPeriod } from '../subscriptions/billing.calculator';
import { notificationsService } from '../notifications/notifications.service';

export class BillingJobsService {
  /**
   * 1. Automated Billing Day Invoice Generation
   * Generates invoice for all active subscriptions whose nextBillingDate has arrived
   * Frequency-aware and handles month-end and leap-year boundaries safely
   */
  async runAutomatedBillingCycle(): Promise<{ processed: number; generatedInvoices: string[] }> {
    console.log('[Cron Job] Starting automated billing cycle execution...');
    const today = new Date();

    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: {
          lte: today,
        },
      },
      include: {
        plan: true,
      },
    });

    console.log(`[Cron Job] Found ${dueSubscriptions.length} subscriptions due for billing.`);

    const generatedInvoices: string[] = [];

    for (const sub of dueSubscriptions) {
      try {
        // If subscription has expired and autoRenew is disabled, handle auto-closure or skip billing
        if (sub.expiryDate && sub.expiryDate <= today && !sub.autoRenew) {
          if (sub.plan.autoCloseOnExpiry) {
            await prisma.subscription.update({
              where: { id: sub.id },
              data: {
                status: SubscriptionStatus.CLOSED,
                closedAt: today,
                cancellationReason: 'Auto-closed upon reaching expiration date without active auto-renewal',
              },
            });

            await prisma.subscriptionLifecycleLog.create({
              data: {
                subscriptionId: sub.id,
                fromStatus: SubscriptionStatus.ACTIVE,
                toStatus: SubscriptionStatus.CLOSED,
                action: 'AUTO_CLOSED_ON_EXPIRY',
                notes: 'Subscription reached expiry date and autoRenew was false during billing run.',
              },
            });
            continue;
          }
        }

        const invoice = await invoicesService.generateInvoiceForSubscription(sub.id);
        generatedInvoices.push(invoice.invoiceNumber);

        // Advance nextBillingDate using frequency-aware calculator
        const currentPeriodAnchor = sub.nextBillingDate ? new Date(sub.nextBillingDate) : today;
        const { nextBillingDate } = calculateNextBillingPeriod(
          currentPeriodAnchor,
          sub.plan.billingFrequency,
          sub.plan.billingCycleDays
        );

        await prisma.subscription.update({
          where: { id: sub.id },
          data: { nextBillingDate },
        });

        await prisma.subscriptionLifecycleLog.create({
          data: {
            subscriptionId: sub.id,
            fromStatus: SubscriptionStatus.ACTIVE,
            toStatus: SubscriptionStatus.ACTIVE,
            action: 'AUTOMATED_BILLING_INVOICED',
            notes: `Auto-generated Invoice ${invoice.invoiceNumber}. Next billing scheduled for ${nextBillingDate.toISOString().split('T')[0]}`,
          },
        });
      } catch (err: any) {
        console.error(`[Cron Job Notice] Subscription ${sub.id}: ${err.message}`);
      }
    }

    return { processed: dueSubscriptions.length, generatedInvoices };
  }

  /**
   * 2. Renewal & Expiry Reminder Notice
   * Identifies subscriptions expiring in configured intervals (e.g. 7, 3, 1, 0 days)
   * Prevents duplicates using stable idempotency keys
   */
  async runRenewalReminders(intervals: number[] = [7, 3, 1, 0]): Promise<{ notifiedCount: number; reminderIntervals: number[] }> {
    console.log(`[Cron Job] Checking subscriptions nearing expiration across intervals: ${intervals.join(', ')} days...`);
    const today = new Date();
    let totalNotified = 0;

    for (const days of intervals) {
      const targetStart = new Date(today);
      targetStart.setDate(targetStart.getDate() + days);
      targetStart.setHours(0, 0, 0, 0);

      const targetEnd = new Date(today);
      targetEnd.setDate(targetEnd.getDate() + days);
      targetEnd.setHours(23, 59, 59, 999);

      const expiringSubscriptions = await prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.ACTIVE,
          expiryDate: {
            gte: targetStart,
            lte: targetEnd,
          },
        },
        include: {
          customer: true,
          plan: true,
        },
      });

      console.log(`[Cron Job] Found ${expiringSubscriptions.length} subscriptions expiring in ${days} days.`);

      for (const sub of expiringSubscriptions) {
        try {
          // Record audit log
          await prisma.auditLog.create({
            data: {
              action: 'RENEWAL_REMINDER_SCHEDULED',
              entity: 'SUBSCRIPTION',
              entityId: sub.id,
              metadata: {
                daysBeforeExpiry: days,
                customerEmail: sub.customer?.email,
                expiryDate: sub.expiryDate,
                planName: sub.plan.name,
                autoRenew: sub.autoRenew,
              },
            },
          });

          // Queue persistent notification with stable idempotency
          await notificationsService.queueSubscriptionExpiring(sub, days);
          totalNotified++;
        } catch (err: any) {
          console.error(`[Cron Job Notice] Failed queuing reminder for sub ${sub.id}:`, err.message);
        }
      }
    }

    return { notifiedCount: totalNotified, reminderIntervals: intervals };
  }

  /**
   * 3. Invoice Payment Due Soon Reminders
   * Flags confirmed unpaid invoices approaching due date (e.g. 3, 1 days before)
   */
  async runInvoiceDueSoonReminders(intervals: number[] = [3, 1]): Promise<{ notifiedCount: number }> {
    console.log(`[Cron Job] Checking invoices approaching due date across intervals: ${intervals.join(', ')} days...`);
    const today = new Date();
    let totalNotified = 0;

    for (const days of intervals) {
      const targetStart = new Date(today);
      targetStart.setDate(targetStart.getDate() + days);
      targetStart.setHours(0, 0, 0, 0);

      const targetEnd = new Date(today);
      targetEnd.setDate(targetEnd.getDate() + days);
      targetEnd.setHours(23, 59, 59, 999);

      const dueInvoices = await prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.CONFIRMED,
          balanceDue: { gt: 0 },
          dueDate: {
            gte: targetStart,
            lte: targetEnd,
          },
        },
        include: {
          customer: true,
        },
      });

      console.log(`[Cron Job] Found ${dueInvoices.length} invoices due in ${days} days.`);

      for (const inv of dueInvoices) {
        try {
          await notificationsService.queueInvoiceDueSoon(inv, days);
          totalNotified++;
        } catch (err: any) {
          console.error(`[Cron Job Notice] Failed queuing due reminder for inv ${inv.id}:`, err.message);
        }
      }
    }

    return { notifiedCount: totalNotified };
  }

  /**
   * 4. Expired Subscription Auto-Closure
   * Automatically closes subscriptions that reached expiryDate with autoRenew=false
   */
  async runExpiredSubscriptionClosures(): Promise<{ closedCount: number }> {
    console.log('[Cron Job] Checking for expired subscriptions to auto-close...');
    const now = new Date();

    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        autoRenew: false,
        expiryDate: {
          lt: now,
        },
        plan: {
          autoCloseOnExpiry: true,
        },
      },
    });

    console.log(`[Cron Job] Found ${expiredSubscriptions.length} expired subscriptions to close.`);

    for (const sub of expiredSubscriptions) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.CLOSED,
          closedAt: now,
          cancellationReason: 'Auto-closed upon reaching expiration date without active auto-renewal',
        },
      });

      await prisma.subscriptionLifecycleLog.create({
        data: {
          subscriptionId: sub.id,
          fromStatus: SubscriptionStatus.ACTIVE,
          toStatus: SubscriptionStatus.CLOSED,
          action: 'AUTO_CLOSED_ON_EXPIRY',
          notes: 'Subscription reached expiry date and autoRenew was false.',
        },
      });
    }

    return { closedCount: expiredSubscriptions.length };
  }

  /**
   * 5. Overdue Invoice Monitor
   * Flags confirmed unpaid invoices past their due date as OVERDUE and queues email notice
   */
  async runOverdueInvoiceTracker(): Promise<{ markedOverdueCount: number }> {
    console.log('[Cron Job] Checking for overdue invoices...');
    const now = new Date();

    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.CONFIRMED,
        dueDate: {
          lt: now,
        },
        balanceDue: {
          gt: 0,
        },
      },
      include: {
        customer: true,
      },
    });

    console.log(`[Cron Job] Found ${overdueInvoices.length} invoices to mark OVERDUE.`);

    for (const inv of overdueInvoices) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { status: InvoiceStatus.OVERDUE },
      });

      await prisma.auditLog.create({
        data: {
          action: 'INVOICE_MARKED_OVERDUE',
          entity: 'INVOICE',
          entityId: inv.id,
          metadata: {
            dueDate: inv.dueDate,
            balanceDue: inv.balanceDue,
          },
        },
      });

      // Queue overdue notification
      try {
        await notificationsService.queueInvoiceOverdue(inv);
      } catch (err: any) {
        console.error(`[Cron Job Notice] Failed queuing overdue notice for inv ${inv.id}:`, err.message);
      }
    }

    return { markedOverdueCount: overdueInvoices.length };
  }

  /**
   * 6. Combined Reminder Runner
   * Runs both subscription expiry reminders and invoice due date reminders
   */
  async runCombinedReminders(): Promise<{ notifiedCount: number; subscriptionsNotified: number; invoicesNotified: number }> {
    const subResult = await this.runRenewalReminders();
    const invResult = await this.runInvoiceDueSoonReminders();
    const total = subResult.notifiedCount + invResult.notifiedCount;
    return {
      notifiedCount: total,
      subscriptionsNotified: subResult.notifiedCount,
      invoicesNotified: invResult.notifiedCount,
    };
  }

  /**
   * 7. Process pending notification queue
   */
  async runProcessNotifications(batchSize?: number) {
    return notificationsService.processPendingNotifications(batchSize);
  }
}

export const billingJobsService = new BillingJobsService();

