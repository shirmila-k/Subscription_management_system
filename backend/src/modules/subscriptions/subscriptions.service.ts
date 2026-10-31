import prisma from '../../config/db';
import { discountsService } from '../discounts/discounts.service';
import {
  SubscriptionStatus,
  PaymentTerms,
  BillingFrequency,
  ProductStatus,
  PlanStatus,
  InvoiceStatus,
} from '@prisma/client';
import { env } from '../../config/env';
import {
  calculateNextBillingPeriod,
  calculateMonetaryBreakdown,
  addYearsSafe,
  addMonthsSafe,
} from './billing.calculator';
import { invoicesService } from '../invoices/invoices.service';
import { notificationsService } from '../notifications/notifications.service';

export interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  quantity?: number;
  discountCode?: string;
  paymentTerms?: PaymentTerms;
  startDate?: Date | string;
  autoRenew?: boolean;
  notes?: string;
  status?: SubscriptionStatus; // DRAFT or QUOTATION
}

export class SubscriptionsService {
  /**
   * Helper to generate unique subscription reference numbers: SUB-YYYY-XXXXX
   */
  private async generateSubscriptionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.subscription.count();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const sequence = (count + 1).toString().padStart(4, '0');
    return `SUB-${year}-${sequence}-${rand}`;
  }

  /**
   * Create a new subscription quotation or draft
   */
  async createSubscription(input: CreateSubscriptionInput, createdById?: string) {
    const plan = await prisma.plan.findUnique({
      where: { id: input.planId },
      include: { product: true, variant: true },
    });

    if (!plan || !plan.isActive || plan.status === PlanStatus.ARCHIVED) {
      throw new Error('Selected plan is invalid, inactive, or archived');
    }

    if (plan.product && (plan.product.status === ProductStatus.ARCHIVED || !plan.product.isActive)) {
      throw new Error(`Product '${plan.product.name}' is archived and cannot be newly subscribed to`);
    }

    if (plan.variant && !plan.variant.isActive) {
      throw new Error(`Product variant '${plan.variant.name}' is inactive and cannot be subscribed to`);
    }

    const now = new Date();
    if (plan.availableFrom && plan.availableFrom > now) {
      throw new Error(`Selected plan '${plan.name}' is not yet available`);
    }
    if (plan.availableTo && plan.availableTo < now) {
      throw new Error(`Selected plan '${plan.name}' availability period has ended`);
    }

    const quantity = input.quantity ?? plan.minQuantity;
    if (quantity < plan.minQuantity) {
      throw new Error(`Minimum quantity for this plan is ${plan.minQuantity}`);
    }

    const unitPrice = Number(plan.price);
    const rawSubtotal = Math.round(unitPrice * quantity * 100) / 100;

    let discountId: string | null = null;
    let discountAmount = 0;

    if (input.discountCode) {
      const discountResult = await discountsService.validateAndApplyDiscount(
        input.discountCode,
        quantity,
        rawSubtotal
      );
      discountId = discountResult.discount.id;
      discountAmount = discountResult.discountAmount;
    }

    const breakdown = calculateMonetaryBreakdown({
      unitPrice,
      quantity,
      discountAmount,
      taxRatePercent: env.billingTaxPercent,
    });

    const subNumber = await this.generateSubscriptionNumber();
    const initialStatus = input.status || SubscriptionStatus.DRAFT;
    const startDate = input.startDate ? new Date(input.startDate) : new Date();

    const { nextBillingDate } = calculateNextBillingPeriod(
      startDate,
      plan.billingFrequency,
      plan.billingCycleDays
    );

    let expiryDate: Date | null = null;
    if (plan.billingFrequency === BillingFrequency.YEARLY) {
      expiryDate = addYearsSafe(startDate, 1);
    } else if (plan.billingFrequency === BillingFrequency.MONTHLY) {
      expiryDate = addMonthsSafe(startDate, 12); // Standard 1-year annual contract term
    }

    return prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.create({
        data: {
          subscriptionNumber: subNumber,
          customerId: input.customerId,
          createdById: createdById || null,
          planId: input.planId,
          status: initialStatus,
          quantity,
          unitPrice,
          discountId,
          discountAmount: breakdown.discountAmount,
          taxRate: breakdown.taxRate,
          taxAmount: breakdown.taxAmount,
          subtotal: breakdown.subtotal,
          totalAmount: breakdown.totalAmount,
          paymentTerms: input.paymentTerms || PaymentTerms.NET_30,
          startDate,
          nextBillingDate,
          expiryDate,
          autoRenew: input.autoRenew ?? plan.autoRenew,
          notes: input.notes,
          ...(initialStatus === SubscriptionStatus.QUOTATION && {
            quotationSentAt: new Date(),
          }),
        },
        include: {
          plan: { include: { product: true, variant: true } },
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, companyName: true },
          },
        },
      });

      // Create snapshot item in subscription_items to preserve agreed price
      const variantDesc = plan.variant ? ` (${plan.variant.name})` : '';
      await tx.subscriptionItem.create({
        data: {
          subscriptionId: subscription.id,
          productId: plan.productId,
          variantId: plan.variantId,
          planId: plan.id,
          description: `${plan.product.name}${variantDesc} - ${plan.name}`,
          quantity,
          unitPrice: plan.price,
          lineTotal: breakdown.subtotal,
        },
      });

      // Record initial lifecycle log
      await tx.subscriptionLifecycleLog.create({
        data: {
          subscriptionId: subscription.id,
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: initialStatus,
          action: initialStatus === SubscriptionStatus.QUOTATION ? 'QUOTATION_CREATED' : 'DRAFT_CREATED',
          notes: `Initial subscription ${initialStatus} created. Total: ₹${breakdown.totalAmount.toFixed(2)}`,
          performedById: createdById,
        },
      });

      return subscription;
    });
  }

  /**
   * Send quotation to customer (DRAFT -> QUOTATION)
   */
  async sendQuotation(id: string, performedById?: string) {
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new Error('Subscription not found');

    if (sub.status !== SubscriptionStatus.DRAFT) {
      throw new Error(`Cannot send quotation for subscription in '${sub.status}' state`);
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.QUOTATION,
        quotationSentAt: new Date(),
      },
      include: { customer: true, plan: true, items: true },
    });

    await prisma.subscriptionLifecycleLog.create({
      data: {
        subscriptionId: id,
        fromStatus: SubscriptionStatus.DRAFT,
        toStatus: SubscriptionStatus.QUOTATION,
        action: 'SENT_QUOTATION',
        notes: 'Quotation sent to customer for review and approval',
        performedById,
      },
    });

    try {
      await notificationsService.queueSubscriptionQuotation(updated);
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue quotation notification: ${err.message}`);
    }

    return updated;
  }

  /**
   * Customer accepts quotation (QUOTATION -> CONFIRMED)
   */
  async acceptQuotation(id: string, customerId?: string) {
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new Error('Subscription not found');

    if (customerId && sub.customerId !== customerId) {
      throw new Error('Unauthorized: You can only accept quotations for your own account');
    }

    if (sub.status !== SubscriptionStatus.QUOTATION) {
      throw new Error(`Cannot accept quotation in '${sub.status}' state`);
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CONFIRMED,
        quotationAcceptedAt: new Date(),
        confirmedAt: new Date(),
      },
      include: { customer: true, plan: true, items: true },
    });

    await prisma.subscriptionLifecycleLog.create({
      data: {
        subscriptionId: id,
        fromStatus: SubscriptionStatus.QUOTATION,
        toStatus: SubscriptionStatus.CONFIRMED,
        action: 'CUSTOMER_ACCEPTED_QUOTATION',
        notes: 'Customer accepted quotation proposal',
        performedById: customerId,
      },
    });

    try {
      await notificationsService.queueSubscriptionConfirmed(updated);
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue confirmed notification: ${err.message}`);
    }

    return updated;
  }

  /**
   * Confirm and Activate subscription (CONFIRMED or DRAFT -> ACTIVE)
   * Computes frequency-aware next billing date and contract expiry
   */
  async activateSubscription(id: string, performedById?: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) throw new Error('Subscription not found');

    if (sub.status !== SubscriptionStatus.CONFIRMED && sub.status !== SubscriptionStatus.DRAFT) {
      throw new Error(`Cannot activate subscription currently in '${sub.status}' status`);
    }

    const startDate = new Date();
    const { nextBillingDate } = calculateNextBillingPeriod(
      startDate,
      sub.plan.billingFrequency,
      sub.plan.billingCycleDays
    );

    let expiryDate: Date | null = null;
    if (sub.plan.billingFrequency === BillingFrequency.YEARLY) {
      expiryDate = addYearsSafe(startDate, 1);
    } else if (sub.plan.billingFrequency === BillingFrequency.MONTHLY) {
      expiryDate = addMonthsSafe(startDate, 12);
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        activatedAt: new Date(),
        startDate,
        nextBillingDate,
        expiryDate,
      },
      include: { customer: true, plan: true, items: true },
    });

    if (sub.discountId) {
      await discountsService.incrementUsage(sub.discountId);
    }

    await prisma.subscriptionLifecycleLog.create({
      data: {
        subscriptionId: id,
        fromStatus: sub.status,
        toStatus: SubscriptionStatus.ACTIVE,
        action: 'ACTIVATED_SUBSCRIPTION',
        notes: `Subscription activated. Next billing scheduled for: ${nextBillingDate.toISOString().split('T')[0]}`,
        performedById,
      },
    });

    try {
      await notificationsService.queueSubscriptionActivated(updated);
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue activated notification: ${err.message}`);
    }

    return updated;
  }

  /**
   * Pause active subscription (ACTIVE -> PAUSED)
   * Validates plan.canPause setting
   */
  async pauseSubscription(id: string, reason?: string, performedById?: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) throw new Error('Subscription not found');

    // Business rule: Check if associated plan permits pausing
    if (!sub.plan.canPause) {
      throw new Error('This plan does not permit pausing active subscriptions');
    }

    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new Error(`Cannot pause a subscription that is currently '${sub.status}'`);
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.PAUSED,
        pausedAt: new Date(),
        notes: reason ? `${sub.notes || ''}\n[Pause Reason]: ${reason}` : sub.notes,
      },
      include: { customer: true, plan: true, items: true },
    });

    await prisma.subscriptionLifecycleLog.create({
      data: {
        subscriptionId: id,
        fromStatus: SubscriptionStatus.ACTIVE,
        toStatus: SubscriptionStatus.PAUSED,
        action: 'PAUSED_SUBSCRIPTION',
        notes: reason || 'Subscription placed on pause by user/admin',
        performedById,
      },
    });

    try {
      await notificationsService.queueSubscriptionPaused(updated, reason);
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue paused notification: ${err.message}`);
    }

    return updated;
  }

  /**
   * Resume paused subscription (PAUSED -> ACTIVE)
   * Recalculates next billing date from resume date
   */
  async resumeSubscription(id: string, performedById?: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) throw new Error('Subscription not found');

    if (sub.status !== SubscriptionStatus.PAUSED) {
      throw new Error(`Cannot resume a subscription that is '${sub.status}'`);
    }

    const resumeDate = new Date();
    const { nextBillingDate } = calculateNextBillingPeriod(
      resumeDate,
      sub.plan.billingFrequency,
      sub.plan.billingCycleDays
    );

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate,
      },
      include: { customer: true, plan: true, items: true },
    });

    await prisma.subscriptionLifecycleLog.create({
      data: {
        subscriptionId: id,
        fromStatus: SubscriptionStatus.PAUSED,
        toStatus: SubscriptionStatus.ACTIVE,
        action: 'RESUMED_SUBSCRIPTION',
        notes: `Subscription resumed. Next billing date adjusted to: ${nextBillingDate.toISOString().split('T')[0]}`,
        performedById,
      },
    });

    try {
      await notificationsService.queueSubscriptionResumed(updated);
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue resumed notification: ${err.message}`);
    }

    return updated;
  }

  /**
   * Close or Cancel subscription (ACTIVE/PAUSED -> CLOSED)
   * Validates plan.canCloseEarly if subscription has not reached expiry date
   */
  async closeSubscription(id: string, reason?: string, performedById?: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) throw new Error('Subscription not found');

    if (sub.status === SubscriptionStatus.CLOSED || sub.status === SubscriptionStatus.CANCELLED) {
      throw new Error(`Subscription is already in terminal '${sub.status}' state`);
    }

    const now = new Date();

    // Business rule: Prevent early closure if plan disallows it and contract is not expired
    if (!sub.plan.canCloseEarly && sub.expiryDate && now < sub.expiryDate) {
      throw new Error(
        `Early closure is disallowed for this subscription's plan before the expiration date (${sub.expiryDate.toISOString().split('T')[0]})`
      );
    }

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CLOSED,
        closedAt: now,
        cancellationReason: reason || 'Subscription closed by request',
      },
      include: { customer: true, plan: true, items: true },
    });

    await prisma.subscriptionLifecycleLog.create({
      data: {
        subscriptionId: id,
        fromStatus: sub.status,
        toStatus: SubscriptionStatus.CLOSED,
        action: 'CLOSED_SUBSCRIPTION',
        notes: reason || 'Subscription closed',
        performedById,
      },
    });

    try {
      await notificationsService.queueSubscriptionClosed(updated, reason);
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue closed notification: ${err.message}`);
    }

    return updated;
  }

  /**
   * Renew subscription for next billing cycle / term
   * Computes next cycle boundaries, advances expiry, generates invoice, and records lifecycle log
   */
  async renewSubscription(id: string, performedById?: string, autoRenewOverride?: boolean) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: true,
        items: true,
      },
    });

    if (!sub) throw new Error('Subscription not found');

    if (sub.status !== SubscriptionStatus.ACTIVE && sub.status !== SubscriptionStatus.CLOSED) {
      throw new Error(`Cannot renew subscription in '${sub.status}' status`);
    }

    const today = new Date();
    // Period start is either the current expiry date or next billing date or today
    const currentAnchor = sub.expiryDate && sub.expiryDate > today ? sub.expiryDate : today;

    const { nextBillingDate: newNextBillingDate, periodEnd: newPeriodEnd } = calculateNextBillingPeriod(
      currentAnchor,
      sub.plan.billingFrequency,
      sub.plan.billingCycleDays
    );

    let newExpiryDate = newPeriodEnd;
    if (sub.plan.billingFrequency === BillingFrequency.YEARLY) {
      newExpiryDate = addYearsSafe(currentAnchor, 1);
    } else if (sub.plan.billingFrequency === BillingFrequency.MONTHLY) {
      newExpiryDate = addMonthsSafe(currentAnchor, 12);
    }

    const updated = await prisma.$transaction(async (tx) => {
      const subUpdate = await tx.subscription.update({
        where: { id: sub.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          nextBillingDate: newNextBillingDate,
          expiryDate: newExpiryDate,
          closedAt: null,
          cancellationReason: null,
          ...(autoRenewOverride !== undefined && { autoRenew: autoRenewOverride }),
        },
        include: { customer: true, plan: true, items: true },
      });

      await tx.subscriptionLifecycleLog.create({
        data: {
          subscriptionId: sub.id,
          fromStatus: sub.status,
          toStatus: SubscriptionStatus.ACTIVE,
          action: 'RENEWED_SUBSCRIPTION',
          notes: `Subscription renewed. New term: ${currentAnchor.toISOString().split('T')[0]} to ${newExpiryDate.toISOString().split('T')[0]}`,
          performedById,
        },
      });

      return subUpdate;
    });

    // Generate renewal invoice outside of the transaction to avoid nested transactions
    try {
      await invoicesService.generateInvoiceForSubscription(sub.id, currentAnchor);
    } catch (err: any) {
      console.warn(`[Renewal Note] ${err.message}`);
    }

    try {
      await notificationsService.queueSubscriptionRenewed(updated);
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue renewed notification: ${err.message}`);
    }

    return updated;
  }

  /**
   * Fetch all subscriptions with filters (status, customer, plan, search)
   */
  async getAllSubscriptions(params?: {
    customerId?: string;
    planId?: string;
    status?: SubscriptionStatus;
    search?: string;
  }) {
    const where: any = {};
    if (params?.customerId) where.customerId = params.customerId;
    if (params?.planId) where.planId = params.planId;
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { subscriptionNumber: { contains: params.search } },
        { customer: { email: { contains: params.search } } },
        { customer: { companyName: { contains: params.search } } },
        { plan: { name: { contains: params.search } } },
      ];
    }

    return prisma.subscription.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            companyName: true,
          },
        },
        plan: {
          include: {
            product: { select: { name: true, code: true, brand: true } },
            variant: { select: { name: true, sku: true } },
          },
        },
        items: true,
        discount: true,
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetch subscription details including items, invoices and lifecycle history
   */
  async getSubscriptionById(id: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        plan: {
          include: {
            product: true,
            variant: true,
          },
        },
        items: {
          include: {
            product: true,
            variant: true,
            plan: true,
          },
        },
        discount: true,
        invoices: {
          orderBy: { issueDate: 'desc' },
          include: { payments: true },
        },
        lifecycleLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!subscription) {
      throw new Error(`Subscription with ID '${id}' not found`);
    }

    return subscription;
  }
}

export const subscriptionsService = new SubscriptionsService();
