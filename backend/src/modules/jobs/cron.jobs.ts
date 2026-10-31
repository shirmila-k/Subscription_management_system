import cron from 'node-cron';
import { billingJobsService } from './billing.job';
import { env } from '../../config/env';

export class CronJobManager {
  private static tasks: cron.ScheduledTask[] = [];

  /**
   * Initialize all automated background cron tasks
   */
  static init(): void {
    console.log('[Cron] Initializing Subscription System automated background workers...');

    // 1. Daily Automated Billing Cycle (Default: 2:00 AM)
    const billingTask = cron.schedule(env.cronScheduleBilling, async () => {
      console.log('[Cron Schedule Triggered]: Daily Automated Billing Cycle');
      await billingJobsService.runAutomatedBillingCycle();
    });
    this.tasks.push(billingTask);

    // 2. Daily Renewal & Expiry Reminders (Default: 8:00 AM)
    const reminderTask = cron.schedule(env.cronScheduleReminders, async () => {
      console.log('[Cron Schedule Triggered]: Renewal Reminders');
      await billingJobsService.runRenewalReminders();
    });
    this.tasks.push(reminderTask);

    // 3. Daily Midnight Auto-Closure of Expired Subscriptions (Default: 0:00 AM)
    const lifecycleTask = cron.schedule(env.cronScheduleLifecycle, async () => {
      console.log('[Cron Schedule Triggered]: Expired Subscriptions Auto-Closure');
      await billingJobsService.runExpiredSubscriptionClosures();
    });
    this.tasks.push(lifecycleTask);

    // 4. Overdue Invoice Monitor (Runs every 6 hours)
    const overdueTask = cron.schedule('0 */6 * * *', async () => {
      console.log('[Cron Schedule Triggered]: Overdue Invoice Monitor');
      await billingJobsService.runOverdueInvoiceTracker();
    });
    this.tasks.push(overdueTask);

    console.log('[Cron] All background tasks scheduled successfully.');
  }

  /**
   * Stop all running cron jobs (useful for graceful shutdown)
   */
  static stopAll(): void {
    console.log('[Cron] Stopping all background tasks...');
    this.tasks.forEach((task) => task.stop());
    this.tasks = [];
  }
}
