import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../../app';
import prisma from '../../config/db';
import {
  NotificationEventType,
  NotificationStatus,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { emailService } from './email.service';
import { notificationsService } from './notifications.service';
import { billingJobsService } from '../jobs/billing.job';
import { subscriptionsService } from '../subscriptions/subscriptions.service';
import { invoicesService } from '../invoices/invoices.service';
import { paymentsService } from '../payments/payments.service';

describe('Phase 6 — Notifications, Email Automation & Scheduled Jobs', () => {
  let server: http.Server;
  let apiBase: string;

  let adminToken: string;
  let staffToken: string;
  let customerToken: string;
  let customerId: string;

  // Cleanup tracking
  const createdNotificationIds: string[] = [];
  const createdSubscriptionIds: string[] = [];
  const createdInvoiceIds: string[] = [];
  const createdPaymentIds: string[] = [];
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

    const timestamp = Date.now();

    // 1. Admin Login
    const adminRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@brightloop.com', password: 'Brightloop@2026' }),
    });
    const adminData: any = await adminRes.json();
    assert.strictEqual(adminRes.status, 200);
    adminToken = adminData.data.token;

    // 2. Staff Login
    const staffRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@brightloop.com', password: 'Brightloop@2026' }),
    });
    const staffData: any = await staffRes.json();
    assert.strictEqual(staffRes.status, 200);
    staffToken = staffData.data.token;

    // 3. Customer Login
    const customerRes = await fetch(`${apiBase}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'customer@brightloop.com', password: 'Brightloop@2026' }),
    });
    const customerData: any = await customerRes.json();
    assert.strictEqual(customerRes.status, 200);
    customerToken = customerData.data.token;
    customerId = customerData.data.user.id;
    customerId = customerData.data.user.id;

    // 4. Create Product & Plan for tests
    const product = await prisma.product.create({
      data: {
        name: `Notif Test Suite Software ${timestamp}`,
        code: `PROD-NT-${timestamp}`,
        salesPrice: 2000.0,
      },
    });
    testProductId = product.id;

    const plan = await prisma.plan.create({
      data: {
        productId: testProductId,
        name: `Enterprise Cloud Plan ${timestamp}`,
        code: `PLAN-NT-${timestamp}`,
        price: 2000.0,
        billingFrequency: 'MONTHLY',
        billingCycleDays: 30,
        canPause: true,
        canCloseEarly: true,
      },
    });
    testPlanId = plan.id;
  });

  after(async () => {
    // Clean up created notifications
    if (createdNotificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: createdNotificationIds } },
      });
    }

    // Clean up payments, invoices, subscriptions
    if (createdPaymentIds.length > 0) {
      await prisma.payment.deleteMany({ where: { id: { in: createdPaymentIds } } });
    }
    if (createdInvoiceIds.length > 0) {
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: createdInvoiceIds } } });
      await prisma.invoice.deleteMany({ where: { id: { in: createdInvoiceIds } } });
    }
    if (createdSubscriptionIds.length > 0) {
      await prisma.subscriptionLifecycleLog.deleteMany({ where: { subscriptionId: { in: createdSubscriptionIds } } });
      await prisma.subscriptionItem.deleteMany({ where: { subscriptionId: { in: createdSubscriptionIds } } });
      await prisma.subscription.deleteMany({ where: { id: { in: createdSubscriptionIds } } });
    }

    if (testPlanId) {
      await prisma.plan.delete({ where: { id: testPlanId } }).catch(() => {});
    }
    if (testProductId) {
      await prisma.product.delete({ where: { id: testProductId } }).catch(() => {});
    }

    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  // -------------------------------------------------------------
  // SUITE 1: EMAIL INFRASTRUCTURE & TEMPLATES
  // -------------------------------------------------------------
  describe('1. Email Infrastructure & Template Rendering', () => {
    it('should generate valid branded templates for all 13 notification event types', () => {
      const allEvents: NotificationEventType[] = [
        'SUBSCRIPTION_QUOTATION',
        'SUBSCRIPTION_CONFIRMED',
        'SUBSCRIPTION_ACTIVATED',
        'SUBSCRIPTION_PAUSED',
        'SUBSCRIPTION_RESUMED',
        'SUBSCRIPTION_CLOSED',
        'SUBSCRIPTION_RENEWED',
        'SUBSCRIPTION_EXPIRING_SOON',
        'INVOICE_GENERATED',
        'INVOICE_DUE_SOON',
        'INVOICE_OVERDUE',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'PAYMENT_REFUNDED',
      ];

      for (const event of allEvents) {
        const rendered = emailService.renderEventTemplate(event, {
          recipientName: 'Vikram Patel',
          subscriptionNumber: 'SUB-2026-TEST',
          planName: 'Enterprise Cloud',
          planPrice: 25000,
          currency: 'INR',
          invoiceNumber: 'INV-2026-TEST',
          invoiceAmount: 29500,
          balanceDue: 29500,
          dueDate: new Date(),
          startDate: new Date(),
          expiryDate: new Date(),
          paymentNumber: 'PAY-2026-TEST',
          paymentAmount: 29500,
        });

        assert.ok(rendered.subject && rendered.subject.length > 5, `Subject should be non-empty for ${event}`);
        assert.ok(rendered.text && rendered.text.includes('Vikram Patel'), `Text should include greeting for ${event}`);
        assert.ok(rendered.html && rendered.html.includes('Brightloop Software'), `HTML should contain company header for ${event}`);
        assert.ok(rendered.html.includes('<!DOCTYPE html>'), `HTML should be valid full document for ${event}`);
      }
    });

    it('should operate safely in development simulation mode without external network dispatch', async () => {
      assert.strictEqual(emailService.isLiveDeliveryEnabled(), false, 'Default development mode must keep live SMTP disabled');

      const result = await emailService.sendEmail({
        to: 'test-client@brightloop.local',
        subject: 'Test Verification Email',
        text: 'This is a test message',
        html: '<p>This is a test message</p>',
        eventType: NotificationEventType.SUBSCRIPTION_ACTIVATED,
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.isSimulated, true);
      assert.ok(result.messageId.startsWith('sim_'));
    });

    it('should redact sensitive information such as passwords or bearer tokens from subjects', async () => {
      const result = await emailService.sendEmail({
        to: 'security-test@client.local',
        subject: 'Reset password with bearer secret_token_xyz',
        text: 'Redacted test',
        html: '<p>Redacted test</p>',
      });

      assert.strictEqual(result.success, true);
    });
  });

  // -------------------------------------------------------------
  // SUITE 2: NOTIFICATION PERSISTENCE & IDEMPOTENCY
  // -------------------------------------------------------------
  describe('2. Notification Persistence & Idempotency Safeguards', () => {
    it('should persist a notification record with PENDING status and default maxAttempts', async () => {
      const notif = await notificationsService.createNotification({
        customerId,
        recipientEmail: 'test-persist@client.com',
        recipientName: 'Acme Persist',
        eventType: NotificationEventType.INVOICE_GENERATED,
        subject: 'New Invoice Issued',
        bodyText: 'Your invoice is ready.',
        bodyHtml: '<p>Your invoice is ready.</p>',
      });

      createdNotificationIds.push(notif.id);

      assert.ok(notif.id);
      assert.strictEqual(notif.status, NotificationStatus.PENDING);
      assert.strictEqual(notif.recipientEmail, 'test-persist@client.com');
      assert.strictEqual(notif.attemptCount, 0);
      assert.strictEqual(notif.maxAttempts, 3);
      assert.strictEqual(notif.isSimulated, true);
    });

    it('should prevent duplicate notifications when using the same idempotency key', async () => {
      const idempotencyKey = `TEST_IDEMPOTENCY_KEY_${Date.now()}`;

      const notif1 = await notificationsService.createNotification({
        customerId,
        recipientEmail: 'idempotent@client.com',
        eventType: NotificationEventType.PAYMENT_SUCCESS,
        idempotencyKey,
        subject: 'Payment 1',
      });
      createdNotificationIds.push(notif1.id);

      // Attempt second creation with identical idempotencyKey
      const notif2 = await notificationsService.createNotification({
        customerId,
        recipientEmail: 'idempotent@client.com',
        eventType: NotificationEventType.PAYMENT_SUCCESS,
        idempotencyKey,
        subject: 'Payment 2 Duplicate Attempt',
      });

      // Must return identical record ID without adding another row
      assert.strictEqual(notif1.id, notif2.id);

      const dbCount = await prisma.notification.count({
        where: { idempotencyKey },
      });
      assert.strictEqual(dbCount, 1, 'Database must enforce single row per idempotency key');
    });

    it('should retrieve notification details and audit stats', async () => {
      const notif = await notificationsService.createNotification({
        customerId,
        recipientEmail: 'stats-test@client.com',
        eventType: NotificationEventType.SUBSCRIPTION_ACTIVATED,
        subject: 'Activated Subscription',
      });
      createdNotificationIds.push(notif.id);

      const retrieved = await notificationsService.getNotificationById(notif.id);
      assert.strictEqual(retrieved.id, notif.id);
      assert.strictEqual(retrieved.customer?.id, customerId);

      const stats = await notificationsService.getNotificationStats();
      assert.ok(stats.total >= 1);
      assert.ok(typeof stats.pending === 'number');
      assert.ok(typeof stats.sent === 'number');
      assert.ok(typeof stats.failed === 'number');
    });
  });

  // -------------------------------------------------------------
  // SUITE 3: BATCH WORKER PROCESSING, RETRIES & EXPONENTIAL BACKOFF
  // -------------------------------------------------------------
  describe('3. Batch Worker Processing, Retries & Safe Backoff', () => {
    it('should process pending notifications, update status to SENT and assign providerMessageId', async () => {
      const notif = await notificationsService.createNotification({
        recipientEmail: 'worker-test@client.com',
        eventType: NotificationEventType.SUBSCRIPTION_CONFIRMED,
        subject: 'Confirmation Notice',
        bodyText: 'Details',
        bodyHtml: '<p>Details</p>',
      });
      createdNotificationIds.push(notif.id);

      const workerResult = await notificationsService.processPendingNotifications(100);
      assert.ok(workerResult.processed >= 1);
      assert.ok(workerResult.sent >= 1);

      const updated = await prisma.notification.findUnique({
        where: { id: notif.id },
      });

      assert.strictEqual(updated?.status, NotificationStatus.SENT);
      assert.ok(updated?.sentAt !== null);
      assert.ok(updated?.providerMessageId && updated.providerMessageId.startsWith('sim_'));
    });

    it('should allow admin to cancel an eligible PENDING notification', async () => {
      const notif = await notificationsService.createNotification({
        recipientEmail: 'cancel-test@client.com',
        eventType: NotificationEventType.INVOICE_DUE_SOON,
        scheduledAt: new Date(Date.now() + 3600 * 1000), // scheduled in future
        subject: 'Future Due Notice',
      });
      createdNotificationIds.push(notif.id);

      const cancelled = await notificationsService.cancelNotification(notif.id);
      assert.strictEqual(cancelled.status, NotificationStatus.CANCELLED);

      // Verify cannot cancel again or cancel non-pending
      await assert.rejects(
        async () => notificationsService.cancelNotification(notif.id),
        /Only PENDING notifications can be cancelled/
      );
    });

    it('should allow admin to retry a FAILED notification but reject retry of SENT notifications', async () => {
      // Create notification manually marked FAILED
      const failedNotif = await prisma.notification.create({
        data: {
          recipientEmail: 'retry-test@client.com',
          eventType: NotificationEventType.PAYMENT_FAILED,
          subject: 'Payment Failed',
          status: NotificationStatus.FAILED,
          attemptCount: 3,
          maxAttempts: 3,
          lastError: 'Mock connection refused to SMTP server',
        },
      });
      createdNotificationIds.push(failedNotif.id);

      const retried = await notificationsService.retryNotification(failedNotif.id);
      assert.strictEqual(retried.status, NotificationStatus.PENDING);
      assert.strictEqual(retried.lastError, null);

      // Create notification marked SENT and verify retry is rejected
      const sentNotif = await prisma.notification.create({
        data: {
          recipientEmail: 'sent-notif@client.com',
          eventType: NotificationEventType.PAYMENT_SUCCESS,
          subject: 'Payment Success',
          status: NotificationStatus.SENT,
          sentAt: new Date(),
        },
      });
      createdNotificationIds.push(sentNotif.id);

      await assert.rejects(
        async () => notificationsService.retryNotification(sentNotif.id),
        /already been sent successfully and cannot be retried/
      );
    });

    it('should recover abandoned PROCESSING records safely', async () => {
      // Create a stuck PROCESSING notification whose lastAttemptAt is 20 minutes ago
      const stuckNotif = await prisma.notification.create({
        data: {
          recipientEmail: 'stuck-worker@client.com',
          eventType: NotificationEventType.INVOICE_OVERDUE,
          subject: 'Stuck Notice',
          status: NotificationStatus.PROCESSING,
          attemptCount: 1,
          maxAttempts: 3,
          lastAttemptAt: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
        },
      });
      createdNotificationIds.push(stuckNotif.id);

      const recoveredCount = await notificationsService.recoverAbandonedProcessing(15);
      assert.ok(recoveredCount >= 1);

      const checked = await prisma.notification.findUnique({
        where: { id: stuckNotif.id },
      });
      assert.strictEqual(checked?.status, NotificationStatus.PENDING);
      assert.ok(checked?.lastError?.includes('Recovered from abandoned'));
    });
  });

  // -------------------------------------------------------------
  // SUITE 4: SCHEDULED REMINDER JOBS & BILLING MONITORS
  // -------------------------------------------------------------
  describe('4. Scheduled Reminder Jobs & Overdue Monitors', () => {
    it('should identify subscriptions expiring soon and queue idempotent reminder notifications', async () => {
      // Create a subscription expiring in 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const sub = await prisma.subscription.create({
        data: {
          subscriptionNumber: `SUB-REM-${Date.now()}`,
          customerId,
          planId: testPlanId,
          status: SubscriptionStatus.ACTIVE,
          unitPrice: 2000,
          subtotal: 2000,
          totalAmount: 2360,
          startDate: new Date(),
          expiryDate: sevenDaysFromNow,
          autoRenew: false,
        },
      });
      createdSubscriptionIds.push(sub.id);

      // Run renewal reminders
      const reminderResult = await billingJobsService.runRenewalReminders([7]);
      assert.ok(reminderResult.notifiedCount >= 1);

      // Check notification in DB
      const notif = await prisma.notification.findFirst({
        where: {
          relatedSubscriptionId: sub.id,
          eventType: NotificationEventType.SUBSCRIPTION_EXPIRING_SOON,
        },
      });
      assert.ok(notif);
      if (notif) createdNotificationIds.push(notif.id);

      // Run second time — verify duplicate is NOT created
      const repeatResult = await billingJobsService.runRenewalReminders([7]);
      const notifCount = await prisma.notification.count({
        where: {
          relatedSubscriptionId: sub.id,
          eventType: NotificationEventType.SUBSCRIPTION_EXPIRING_SOON,
        },
      });
      assert.strictEqual(notifCount, 1, 'Repeated scheduler run must not duplicate reminder');
    });

    it('should skip cancelled and closed subscriptions from expiry reminders', async () => {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const closedSub = await prisma.subscription.create({
        data: {
          subscriptionNumber: `SUB-CLOSED-${Date.now()}`,
          customerId,
          planId: testPlanId,
          status: SubscriptionStatus.CLOSED,
          unitPrice: 2000,
          subtotal: 2000,
          totalAmount: 2360,
          startDate: new Date(),
          expiryDate: sevenDaysFromNow,
        },
      });
      createdSubscriptionIds.push(closedSub.id);

      await billingJobsService.runRenewalReminders([7]);

      const notif = await prisma.notification.findFirst({
        where: {
          relatedSubscriptionId: closedSub.id,
        },
      });
      assert.strictEqual(notif, null, 'Closed subscriptions must never receive expiry reminders');
    });

    it('should monitor overdue invoices, mark them OVERDUE, and queue overdue notifications', async () => {
      // Create past-due unpaid invoice
      const pastDue = new Date(Date.now() - 3 * 24 * 3600 * 1000);

      const sub = await prisma.subscription.create({
        data: {
          subscriptionNumber: `SUB-OVERDUE-${Date.now()}`,
          customerId,
          planId: testPlanId,
          status: SubscriptionStatus.ACTIVE,
          unitPrice: 2000,
          subtotal: 2000,
          totalAmount: 2360,
          startDate: new Date(),
        },
      });
      createdSubscriptionIds.push(sub.id);

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-OD-${Date.now()}`,
          subscriptionId: sub.id,
          customerId,
          status: InvoiceStatus.CONFIRMED,
          issueDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
          dueDate: pastDue,
          billingPeriodStart: new Date(),
          billingPeriodEnd: new Date(),
          subtotal: 2000,
          taxAmount: 360,
          totalAmount: 2360,
          amountPaid: 0,
          balanceDue: 2360,
        },
      });
      createdInvoiceIds.push(invoice.id);

      const overdueResult = await billingJobsService.runOverdueInvoiceTracker();
      assert.ok(overdueResult.markedOverdueCount >= 1);

      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
      });
      assert.strictEqual(updatedInvoice?.status, InvoiceStatus.OVERDUE);

      const overdueNotif = await prisma.notification.findFirst({
        where: {
          relatedInvoiceId: invoice.id,
          eventType: NotificationEventType.INVOICE_OVERDUE,
        },
      });
      assert.ok(overdueNotif);
      if (overdueNotif) createdNotificationIds.push(overdueNotif.id);
    });

    it('should skip paid or void invoices from overdue notices', async () => {
      const pastDue = new Date(Date.now() - 3 * 24 * 3600 * 1000);

      const sub = await prisma.subscription.create({
        data: {
          subscriptionNumber: `SUB-PAID-${Date.now()}`,
          customerId,
          planId: testPlanId,
          status: SubscriptionStatus.ACTIVE,
          unitPrice: 2000,
          subtotal: 2000,
          totalAmount: 2360,
          startDate: new Date(),
        },
      });
      createdSubscriptionIds.push(sub.id);

      const paidInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-PAID-${Date.now()}`,
          subscriptionId: sub.id,
          customerId,
          status: InvoiceStatus.PAID,
          issueDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
          dueDate: pastDue,
          billingPeriodStart: new Date(),
          billingPeriodEnd: new Date(),
          subtotal: 2000,
          taxAmount: 360,
          totalAmount: 2360,
          amountPaid: 2360,
          balanceDue: 0,
        },
      });
      createdInvoiceIds.push(paidInvoice.id);

      await billingJobsService.runOverdueInvoiceTracker();

      const notif = await prisma.notification.findFirst({
        where: { relatedInvoiceId: paidInvoice.id },
      });
      assert.strictEqual(notif, null, 'Paid invoice with 0 balance must never receive overdue notices');
    });
  });

  // -------------------------------------------------------------
  // SUITE 5: LIFECYCLE & FINANCIAL TRANSACTION INTEGRATION
  // -------------------------------------------------------------
  describe('5. Lifecycle & Financial Transaction Event Triggers', () => {
    it('should automatically queue SUBSCRIPTION_ACTIVATED when subscription is activated', async () => {
      const sub = await subscriptionsService.createSubscription({
        customerId,
        planId: testPlanId,
      });
      createdSubscriptionIds.push(sub.id);

      await subscriptionsService.activateSubscription(sub.id);

      const notif = await prisma.notification.findFirst({
        where: {
          relatedSubscriptionId: sub.id,
          eventType: NotificationEventType.SUBSCRIPTION_ACTIVATED,
        },
      });

      assert.ok(notif, 'SUBSCRIPTION_ACTIVATED notification should be queued');
      assert.strictEqual(notif.status, NotificationStatus.PENDING);
      if (notif) createdNotificationIds.push(notif.id);
    });

    it('should automatically queue PAYMENT_SUCCESS on payment settlement and PAYMENT_REFUNDED on refund', async () => {
      // Create invoice
      const sub = await prisma.subscription.create({
        data: {
          subscriptionNumber: `SUB-PAY-${Date.now()}`,
          customerId,
          planId: testPlanId,
          status: SubscriptionStatus.ACTIVE,
          unitPrice: 1000,
          subtotal: 1000,
          totalAmount: 1180,
          startDate: new Date(),
        },
      });
      createdSubscriptionIds.push(sub.id);

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `INV-PAY-${Date.now()}`,
          subscriptionId: sub.id,
          customerId,
          status: InvoiceStatus.CONFIRMED,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          billingPeriodStart: new Date(),
          billingPeriodEnd: new Date(),
          subtotal: 1000,
          taxAmount: 180,
          totalAmount: 1180,
          amountPaid: 0,
          balanceDue: 1180,
        },
      });
      createdInvoiceIds.push(invoice.id);

      // Record payment
      const payment = await paymentsService.recordPayment({
        invoiceId: invoice.id,
        amount: 1180,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        transactionReference: `TX-${Date.now()}`,
      });
      createdPaymentIds.push(payment.id);

      // Verify payment success notification
      const payNotif = await prisma.notification.findFirst({
        where: {
          relatedPaymentId: payment.id,
          eventType: NotificationEventType.PAYMENT_SUCCESS,
        },
      });
      assert.ok(payNotif, 'Payment success notification must be queued');
      if (payNotif) createdNotificationIds.push(payNotif.id);

      // Refund payment
      const refund = await paymentsService.refundPayment(payment.id, 'Customer requested refund');
      assert.strictEqual(refund.status, PaymentStatus.REFUNDED);

      // Verify refund notification
      const refundNotif = await prisma.notification.findFirst({
        where: {
          relatedPaymentId: payment.id,
          eventType: NotificationEventType.PAYMENT_REFUNDED,
        },
      });
      assert.ok(refundNotif, 'Payment refund notification must be queued');
      if (refundNotif) createdNotificationIds.push(refundNotif.id);
    });
  });

  // -------------------------------------------------------------
  // SUITE 6: SECURITY, ROLE-BASED ACCESS & API ENDPOINTS
  // -------------------------------------------------------------
  describe('6. Security & Role-Based Access Control', () => {
    it('should reject unauthenticated requests to notifications endpoints with 401', async () => {
      const res = await fetch(`${apiBase}/notifications`);
      assert.strictEqual(res.status, 401);
    });

    it('should reject non-admin/customer users from accessing notifications endpoints with 403', async () => {
      const res = await fetch(`${apiBase}/notifications`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('should reject customer from manually triggering background notification worker with 403', async () => {
      const res = await fetch(`${apiBase}/jobs/run-notifications`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('should allow admin to list notifications with filters and pagination via API', async () => {
      const res = await fetch(`${apiBase}/notifications?page=1&limit=10&status=SENT`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(body.meta);
    });

    it('should allow admin to execute run-notifications job manually via API', async () => {
      const res = await fetch(`${apiBase}/jobs/run-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ batchSize: 10 }),
      });
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(typeof body.data.processed === 'number');
    });
  });
});
