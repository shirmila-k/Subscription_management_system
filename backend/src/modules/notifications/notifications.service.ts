import prisma from '../../config/db';
import {
  Notification,
  NotificationStatus,
  NotificationEventType,
  Prisma,
} from '@prisma/client';
import { emailService, TemplateContext } from './email.service';
import { env } from '../../config/env';

export interface CreateNotificationParams {
  customerId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  eventType: NotificationEventType;
  subject?: string;
  bodyText?: string | null;
  bodyHtml?: string | null;
  relatedSubscriptionId?: string | null;
  relatedInvoiceId?: string | null;
  relatedPaymentId?: string | null;
  idempotencyKey?: string | null;
  scheduledAt?: Date;
  maxAttempts?: number;
  metadata?: Prisma.InputJsonValue;
  context?: TemplateContext;
}

export interface ListNotificationsParams {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  eventType?: NotificationEventType;
  recipientEmail?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export class NotificationsService {
  private isProcessing = false;

  /**
   * Safe creation of a persistent notification with idempotency protection.
   * If a notification with the given idempotencyKey already exists, it is returned without duplicate creation.
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const scheduledAt = params.scheduledAt || new Date();
    const maxAttempts = params.maxAttempts || env.notificationMaxAttempts;

    // If subject or body is missing, generate from the template context
    let subject = params.subject;
    let bodyText = params.bodyText;
    let bodyHtml = params.bodyHtml;

    if (!subject || !bodyHtml || !bodyText) {
      const rendered = emailService.renderEventTemplate(params.eventType, {
        recipientName: params.recipientName || undefined,
        ...params.context,
      });
      subject = subject || rendered.subject;
      bodyText = bodyText || rendered.text;
      bodyHtml = bodyHtml || rendered.html;
    }

    // 1. Idempotency Check: if idempotencyKey is specified, check existing record first
    if (params.idempotencyKey) {
      const existing = await prisma.notification.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    try {
      const notification = await prisma.notification.create({
        data: {
          customerId: params.customerId || null,
          recipientEmail: params.recipientEmail.trim().toLowerCase(),
          recipientName: params.recipientName || null,
          eventType: params.eventType,
          subject,
          bodyText,
          bodyHtml,
          status: NotificationStatus.PENDING,
          attemptCount: 0,
          maxAttempts,
          scheduledAt,
          relatedSubscriptionId: params.relatedSubscriptionId || null,
          relatedInvoiceId: params.relatedInvoiceId || null,
          relatedPaymentId: params.relatedPaymentId || null,
          idempotencyKey: params.idempotencyKey || null,
          metadata: params.metadata || Prisma.JsonNull,
          isSimulated: !emailService.isLiveDeliveryEnabled(),
        },
      });

      return notification;
    } catch (err: any) {
      // In case of race-condition on unique idempotencyKey, return the already created record
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' && params.idempotencyKey) {
        const raceWinner = await prisma.notification.findUnique({
          where: { idempotencyKey: params.idempotencyKey },
        });
        if (raceWinner) {
          return raceWinner;
        }
      }
      throw err;
    }
  }

  /**
   * Recover notifications left stuck in PROCESSING due to server restart or network crash
   */
  async recoverAbandonedProcessing(stuckThresholdMinutes = 15): Promise<number> {
    const thresholdDate = new Date(Date.now() - stuckThresholdMinutes * 60 * 1000);

    const abandoned = await prisma.notification.findMany({
      where: {
        status: NotificationStatus.PROCESSING,
        lastAttemptAt: { lte: thresholdDate },
      },
    });

    if (abandoned.length === 0) return 0;

    console.log(`[NotificationsService] Recovering ${abandoned.length} abandoned PROCESSING notifications...`);

    let recoveredCount = 0;
    for (const record of abandoned) {
      if (record.attemptCount >= record.maxAttempts) {
        await prisma.notification.update({
          where: { id: record.id },
          data: {
            status: NotificationStatus.FAILED,
            lastError: 'Processing timed out and maximum attempt count reached',
          },
        });
      } else {
        await prisma.notification.update({
          where: { id: record.id },
          data: {
            status: NotificationStatus.PENDING,
            nextRetryAt: new Date(Date.now() + 60 * 1000), // Retry in 1 min
            lastError: 'Recovered from abandoned worker processing lock',
          },
        });
      }
      recoveredCount++;
    }

    return recoveredCount;
  }

  /**
   * Process a bounded batch of eligible pending notifications.
   * Uses lock flags, atomic status transitions, exponential backoff, and idempotency safeguards.
   */
  async processPendingNotifications(batchSize = env.notificationBatchSize): Promise<{
    processed: number;
    sent: number;
    failed: number;
    simulated: number;
  }> {
    if (this.isProcessing) {
      console.log('[NotificationsService] Batch processing is already in progress, skipping overlapping run.');
      return { processed: 0, sent: 0, failed: 0, simulated: 0 };
    }

    this.isProcessing = true;
    // Add 2 second tolerance buffer to ensure sub-millisecond scheduledAt timestamps are included
    const now = new Date(Date.now() + 2000);
    let sent = 0;
    let failed = 0;
    let simulated = 0;

    try {
      // 1. Recover any abandoned processing locks
      await this.recoverAbandonedProcessing();

      // 2. Fetch due pending notifications
      const pendingNotifications = await prisma.notification.findMany({
        where: {
          status: NotificationStatus.PENDING,
          scheduledAt: { lte: now },
          OR: [
            { nextRetryAt: null },
            { nextRetryAt: { lte: now } },
          ],
        },
        take: batchSize,
        orderBy: { scheduledAt: 'asc' },
      });

      if (pendingNotifications.length === 0) {
        return { processed: 0, sent: 0, failed: 0, simulated: 0 };
      }

      console.log(`[NotificationsService] Found ${pendingNotifications.length} due notifications to process.`);

      for (const notif of pendingNotifications) {
        // Atomic status lock to PROCESSING
        const locked = await prisma.notification.updateMany({
          where: {
            id: notif.id,
            status: NotificationStatus.PENDING,
          },
          data: {
            status: NotificationStatus.PROCESSING,
            attemptCount: { increment: 1 },
            lastAttemptAt: now,
          },
        });

        if (locked.count === 0) {
          // Record was locked or modified by another worker
          continue;
        }

        const currentAttempt = notif.attemptCount + 1;

        // Perform email delivery attempt
        const sendResult = await emailService.sendEmail({
          to: notif.recipientEmail,
          recipientName: notif.recipientName || undefined,
          subject: notif.subject,
          text: notif.bodyText || '',
          html: notif.bodyHtml || '',
          eventType: notif.eventType,
        });

        if (sendResult.success) {
          await prisma.notification.update({
            where: { id: notif.id },
            data: {
              status: NotificationStatus.SENT,
              sentAt: new Date(),
              providerMessageId: sendResult.messageId,
              isSimulated: sendResult.isSimulated,
              lastError: null,
            },
          });
          sent++;
          if (sendResult.isSimulated) simulated++;
        } else {
          // Delivery failed
          const hasExceededAttempts = currentAttempt >= notif.maxAttempts;
          // Bounded exponential backoff: 2 ^ attempt * 60 seconds (max 1 hour)
          const backoffMinutes = Math.min(Math.pow(2, currentAttempt), 60);
          const nextRetryAt = hasExceededAttempts ? null : new Date(Date.now() + backoffMinutes * 60 * 1000);

          await prisma.notification.update({
            where: { id: notif.id },
            data: {
              status: hasExceededAttempts ? NotificationStatus.FAILED : NotificationStatus.PENDING,
              nextRetryAt,
              lastError: sendResult.error ? sendResult.error.substring(0, 500) : 'Delivery failed',
            },
          });
          failed++;
        }
      }

      return {
        processed: pendingNotifications.length,
        sent,
        failed,
        simulated,
      };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Administrator manual retry of a failed or cancelled notification
   */
  async retryNotification(id: string): Promise<Notification> {
    const notif = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notif) {
      throw new Error(`Notification '${id}' not found`);
    }

    if (notif.status === NotificationStatus.SENT) {
      throw new Error('Notification has already been sent successfully and cannot be retried.');
    }

    if (notif.status === NotificationStatus.PROCESSING) {
      throw new Error('Notification is currently being processed by a worker.');
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.PENDING,
        nextRetryAt: null,
        scheduledAt: new Date(),
        lastError: null,
      },
    });

    return updated;
  }

  /**
   * Administrator manual cancellation of an eligible pending notification
   */
  async cancelNotification(id: string): Promise<Notification> {
    const notif = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notif) {
      throw new Error(`Notification '${id}' not found`);
    }

    if (notif.status !== NotificationStatus.PENDING) {
      throw new Error(`Only PENDING notifications can be cancelled. Current status is ${notif.status}.`);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        status: NotificationStatus.CANCELLED,
      },
    });

    return updated;
  }

  /**
   * List notifications with search, filters, and pagination
   */
  async getNotifications(params: ListNotificationsParams = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.eventType) {
      where.eventType = params.eventType;
    }

    if (params.recipientEmail) {
      where.recipientEmail = { contains: params.recipientEmail.toLowerCase() };
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) {
        where.createdAt.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        if (params.endDate.length === 10) {
          end.setHours(23, 59, 59, 999);
        }
        where.createdAt.lte = end;
      }
    }

    if (params.search) {
      const search = params.search.trim();
      where.OR = [
        { recipientEmail: { contains: search } },
        { recipientName: { contains: search } },
        { subject: { contains: search } },
        { relatedSubscriptionId: { contains: search } },
        { relatedInvoiceId: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, companyName: true },
          },
        },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve notification details by ID
   */
  async getNotificationById(id: string) {
    const notif = await prisma.notification.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, companyName: true },
        },
      },
    });

    if (!notif) {
      throw new Error(`Notification '${id}' not found`);
    }

    return notif;
  }

  /**
   * Aggregated metrics for admin notification dashboard
   */
  async getNotificationStats() {
    const [total, pending, processing, sent, failed, cancelled] = await Promise.all([
      prisma.notification.count(),
      prisma.notification.count({ where: { status: NotificationStatus.PENDING } }),
      prisma.notification.count({ where: { status: NotificationStatus.PROCESSING } }),
      prisma.notification.count({ where: { status: NotificationStatus.SENT } }),
      prisma.notification.count({ where: { status: NotificationStatus.FAILED } }),
      prisma.notification.count({ where: { status: NotificationStatus.CANCELLED } }),
    ]);

    return {
      total,
      pending,
      processing,
      sent,
      failed,
      cancelled,
    };
  }

  // -------------------------------------------------------------
  // SUBSCRIPTION LIFECYCLE QUEUE HELPERS
  // -------------------------------------------------------------

  async queueSubscriptionQuotation(sub: any) {
    if (!sub.customer?.email) return null;
    return this.createNotification({
      customerId: sub.customerId,
      recipientEmail: sub.customer.email,
      recipientName: `${sub.customer.firstName || ''} ${sub.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.SUBSCRIPTION_QUOTATION,
      relatedSubscriptionId: sub.id,
      idempotencyKey: `SUB_QUOTATION:${sub.id}`,
      context: {
        recipientName: sub.customer.firstName,
        subscriptionNumber: sub.subscriptionNumber,
        planName: sub.plan?.name,
        planPrice: Number(sub.totalAmount),
        currency: sub.plan?.currency || 'INR',
        expiryDate: sub.expiryDate,
        actionUrl: `${env.frontendUrl}/customer/subscriptions/${sub.id}`,
      },
    });
  }

  async queueSubscriptionConfirmed(sub: any) {
    if (!sub.customer?.email) return null;
    return this.createNotification({
      customerId: sub.customerId,
      recipientEmail: sub.customer.email,
      recipientName: `${sub.customer.firstName || ''} ${sub.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.SUBSCRIPTION_CONFIRMED,
      relatedSubscriptionId: sub.id,
      idempotencyKey: `SUB_CONFIRMED:${sub.id}`,
      context: {
        recipientName: sub.customer.firstName,
        subscriptionNumber: sub.subscriptionNumber,
        planName: sub.plan?.name,
        startDate: sub.startDate,
        actionUrl: `${env.frontendUrl}/customer/subscriptions/${sub.id}`,
      },
    });
  }

  async queueSubscriptionActivated(sub: any) {
    if (!sub.customer?.email) return null;
    return this.createNotification({
      customerId: sub.customerId,
      recipientEmail: sub.customer.email,
      recipientName: `${sub.customer.firstName || ''} ${sub.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.SUBSCRIPTION_ACTIVATED,
      relatedSubscriptionId: sub.id,
      idempotencyKey: `SUB_ACTIVATED:${sub.id}`,
      context: {
        recipientName: sub.customer.firstName,
        subscriptionNumber: sub.subscriptionNumber,
        planName: sub.plan?.name,
        startDate: sub.startDate,
        expiryDate: sub.expiryDate,
        actionUrl: `${env.frontendUrl}/customer/subscriptions/${sub.id}`,
      },
    });
  }

  async queueSubscriptionPaused(sub: any, reason?: string) {
    if (!sub.customer?.email) return null;
    const nowKey = new Date().toISOString().split('T')[0];
    return this.createNotification({
      customerId: sub.customerId,
      recipientEmail: sub.customer.email,
      recipientName: `${sub.customer.firstName || ''} ${sub.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.SUBSCRIPTION_PAUSED,
      relatedSubscriptionId: sub.id,
      idempotencyKey: `SUB_PAUSED:${sub.id}:${nowKey}`,
      context: {
        recipientName: sub.customer.firstName,
        subscriptionNumber: sub.subscriptionNumber,
        planName: sub.plan?.name,
        reason: reason || sub.cancellationReason || 'Requested by customer',
      },
    });
  }

  async queueSubscriptionResumed(sub: any) {
    if (!sub.customer?.email) return null;
    const nowKey = new Date().toISOString().split('T')[0];
    return this.createNotification({
      customerId: sub.customerId,
      recipientEmail: sub.customer.email,
      recipientName: `${sub.customer.firstName || ''} ${sub.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.SUBSCRIPTION_RESUMED,
      relatedSubscriptionId: sub.id,
      idempotencyKey: `SUB_RESUMED:${sub.id}:${nowKey}`,
      context: {
        recipientName: sub.customer.firstName,
        subscriptionNumber: sub.subscriptionNumber,
        planName: sub.plan?.name,
      },
    });
  }

  async queueSubscriptionClosed(sub: any, reason?: string) {
    if (!sub.customer?.email) return null;
    return this.createNotification({
      customerId: sub.customerId,
      recipientEmail: sub.customer.email,
      recipientName: `${sub.customer.firstName || ''} ${sub.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.SUBSCRIPTION_CLOSED,
      relatedSubscriptionId: sub.id,
      idempotencyKey: `SUB_CLOSED:${sub.id}`,
      context: {
        recipientName: sub.customer.firstName,
        subscriptionNumber: sub.subscriptionNumber,
        planName: sub.plan?.name,
        reason: reason || sub.cancellationReason || 'Subscription term concluded',
      },
    });
  }

  async queueSubscriptionRenewed(sub: any) {
    if (!sub.customer?.email) return null;
    const periodKey = sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    return this.createNotification({
      customerId: sub.customerId,
      recipientEmail: sub.customer.email,
      recipientName: `${sub.customer.firstName || ''} ${sub.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.SUBSCRIPTION_RENEWED,
      relatedSubscriptionId: sub.id,
      idempotencyKey: `SUB_RENEWED:${sub.id}:${periodKey}`,
      context: {
        recipientName: sub.customer.firstName,
        subscriptionNumber: sub.subscriptionNumber,
        planName: sub.plan?.name,
        expiryDate: sub.expiryDate,
      },
    });
  }

  async queueSubscriptionExpiring(sub: any, daysBefore: number) {
    if (!sub.customer?.email) return null;
    const expiryKey = sub.expiryDate ? new Date(sub.expiryDate).toISOString().split('T')[0] : 'unknown';
    return this.createNotification({
      customerId: sub.customerId,
      recipientEmail: sub.customer.email,
      recipientName: `${sub.customer.firstName || ''} ${sub.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.SUBSCRIPTION_EXPIRING_SOON,
      relatedSubscriptionId: sub.id,
      idempotencyKey: `SUB_EXPIRING:${sub.id}:${daysBefore}d:${expiryKey}`,
      context: {
        recipientName: sub.customer.firstName,
        subscriptionNumber: sub.subscriptionNumber,
        planName: sub.plan?.name,
        expiryDate: sub.expiryDate,
        autoRenew: sub.autoRenew,
        actionUrl: `${env.frontendUrl}/customer/subscriptions/${sub.id}`,
      },
    });
  }

  // -------------------------------------------------------------
  // BILLING & INVOICE QUEUE HELPERS
  // -------------------------------------------------------------

  async queueInvoiceGenerated(inv: any) {
    if (!inv.customer?.email) return null;
    return this.createNotification({
      customerId: inv.customerId,
      recipientEmail: inv.customer.email,
      recipientName: `${inv.customer.firstName || ''} ${inv.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.INVOICE_GENERATED,
      relatedInvoiceId: inv.id,
      relatedSubscriptionId: inv.subscriptionId,
      idempotencyKey: `INV_GENERATED:${inv.id}`,
      context: {
        recipientName: inv.customer.firstName,
        invoiceNumber: inv.invoiceNumber,
        invoiceAmount: Number(inv.totalAmount),
        balanceDue: Number(inv.balanceDue),
        dueDate: inv.dueDate,
        actionUrl: `${env.frontendUrl}/customer/invoices/${inv.id}`,
      },
    });
  }

  async queueInvoiceDueSoon(inv: any, daysBefore: number) {
    if (!inv.customer?.email) return null;
    const dueKey = inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : 'due';
    return this.createNotification({
      customerId: inv.customerId,
      recipientEmail: inv.customer.email,
      recipientName: `${inv.customer.firstName || ''} ${inv.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.INVOICE_DUE_SOON,
      relatedInvoiceId: inv.id,
      relatedSubscriptionId: inv.subscriptionId,
      idempotencyKey: `INV_DUE_SOON:${inv.id}:${daysBefore}d:${dueKey}`,
      context: {
        recipientName: inv.customer.firstName,
        invoiceNumber: inv.invoiceNumber,
        invoiceAmount: Number(inv.totalAmount),
        balanceDue: Number(inv.balanceDue),
        dueDate: inv.dueDate,
        actionUrl: `${env.frontendUrl}/customer/invoices/${inv.id}`,
      },
    });
  }

  async queueInvoiceOverdue(inv: any) {
    if (!inv.customer?.email) return null;
    const todayKey = new Date().toISOString().split('T')[0];
    return this.createNotification({
      customerId: inv.customerId,
      recipientEmail: inv.customer.email,
      recipientName: `${inv.customer.firstName || ''} ${inv.customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.INVOICE_OVERDUE,
      relatedInvoiceId: inv.id,
      relatedSubscriptionId: inv.subscriptionId,
      idempotencyKey: `INV_OVERDUE:${inv.id}:${todayKey}`,
      context: {
        recipientName: inv.customer.firstName,
        invoiceNumber: inv.invoiceNumber,
        invoiceAmount: Number(inv.totalAmount),
        balanceDue: Number(inv.balanceDue),
        dueDate: inv.dueDate,
        actionUrl: `${env.frontendUrl}/customer/invoices/${inv.id}`,
      },
    });
  }

  async queuePaymentSuccess(payment: any, invoice?: any) {
    let customer = payment.customer || invoice?.customer;
    if (!customer?.email && (payment.customerId || invoice?.customerId)) {
      customer = await prisma.user.findUnique({
        where: { id: payment.customerId || invoice?.customerId },
      });
    }
    if (!customer?.email) return null;
    return this.createNotification({
      customerId: payment.customerId,
      recipientEmail: customer.email,
      recipientName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.PAYMENT_SUCCESS,
      relatedPaymentId: payment.id,
      relatedInvoiceId: payment.invoiceId,
      idempotencyKey: `PAYMENT_SUCCESS:${payment.id}`,
      context: {
        recipientName: customer.firstName,
        paymentNumber: payment.paymentNumber,
        invoiceNumber: invoice?.invoiceNumber,
        paymentAmount: Number(payment.amount),
        currency: payment.currency || 'INR',
        balanceDue: invoice ? Number(invoice.balanceDue) : undefined,
      },
    });
  }

  async queuePaymentFailed(payment: any, invoice?: any, reason?: string) {
    let customer = payment.customer || invoice?.customer;
    if (!customer?.email && (payment.customerId || invoice?.customerId)) {
      customer = await prisma.user.findUnique({
        where: { id: payment.customerId || invoice?.customerId },
      });
    }
    if (!customer?.email) return null;
    return this.createNotification({
      customerId: payment.customerId,
      recipientEmail: customer.email,
      recipientName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.PAYMENT_FAILED,
      relatedPaymentId: payment.id,
      relatedInvoiceId: payment.invoiceId,
      idempotencyKey: `PAYMENT_FAILED:${payment.id}`,
      context: {
        recipientName: customer.firstName,
        paymentNumber: payment.paymentNumber,
        invoiceNumber: invoice?.invoiceNumber,
        paymentAmount: Number(payment.amount),
        currency: payment.currency || 'INR',
        reason: reason || payment.notes || 'Transaction declined by payment provider',
        actionUrl: invoice ? `${env.frontendUrl}/customer/invoices/${invoice.id}` : undefined,
      },
    });
  }

  async queuePaymentRefunded(payment: any, invoice?: any, reason?: string) {
    let customer = payment.customer || invoice?.customer;
    if (!customer?.email && (payment.customerId || invoice?.customerId)) {
      customer = await prisma.user.findUnique({
        where: { id: payment.customerId || invoice?.customerId },
      });
    }
    if (!customer?.email) return null;
    return this.createNotification({
      customerId: payment.customerId,
      recipientEmail: customer.email,
      recipientName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || null,
      eventType: NotificationEventType.PAYMENT_REFUNDED,
      relatedPaymentId: payment.id,
      relatedInvoiceId: payment.invoiceId,
      idempotencyKey: `PAYMENT_REFUNDED:${payment.id}`,
      context: {
        recipientName: customer.firstName,
        paymentNumber: payment.paymentNumber,
        invoiceNumber: invoice?.invoiceNumber,
        paymentAmount: Number(payment.amount),
        refundAmount: Number(payment.amount),
        currency: payment.currency || 'INR',
        reason: reason || payment.notes || 'Customer refund requested',
      },
    });
  }
}

export const notificationsService = new NotificationsService();
