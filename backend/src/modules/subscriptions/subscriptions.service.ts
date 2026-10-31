import prisma from '../../config/db';
import { discountsService } from '../discounts/discounts.service';
import {
  SubscriptionStatus,
  PaymentTerms,
  BillingFrequency,
} from '@prisma/client';
import { env } from '../../config/env';

export interface CreateSubscriptionInput {
  customerId: string;
  planId: string;
  quantity?: number;
  discountCode?: string;
  paymentTerms?: PaymentTerms;
  startDate?: Date;
  autoRenew?: boolean;
  notes?: string;
  status?: SubscriptionStatus; // DRAFT or QUOTATION
}

export class SubscriptionsService {
  /**
   * Helper to generate unique subscription reference numbers
   */
  private async generateSubscriptionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.subscription.count();
    const sequence = (count + 1).toString().padStart(5, '0');
    return `SUB-${year}-${sequence}`;
  }

  /**
   * Calculate next billing date from start date and billingCycleDays
   */
  private computeNextBillingDate(startDate: Date, days: number): Date {
    const nextDate = new Date(startDate);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  /**
   * Create a new subscription quotation or draft
   */
  async createSubscription(input: CreateSubscriptionInput, createdById?: string) {
    const plan = await prisma.plan.findUnique({
      where: { id: input.planId },
      include: { product: true },
    });

    if (!plan || !plan.isActive) {
      throw new Error('Selected plan is invalid or inactive');
    }

    const quantity = input.quantity ?? plan.minQuantity;
    if (quantity < plan.minQuantity) {
      throw new Error(`Minimum quantity for this plan is ${plan.minQuantity}`);
    }

    const unitPrice = Number(plan.price);
    const subtotal = Math.round(unitPrice * quantity * 100) / 100;

    let discountId: string | null = null;
    let discountAmount = 0;

    if (input.discountCode) {
      const discountResult = await discountsService.validateAndApplyDiscount(
        input.discountCode,
        quantity,
        subtotal
      );
      discountId = discountResult.discount.id;
      discountAmount = discountResult.discountAmount;
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxRate = env.billingTaxPercent;
    const taxAmount = Math.round(((taxableAmount * taxRate) / 100) * 100) / 100;
    const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

    const subNumber = await this.generateSubscriptionNumber();
    const initialStatus = input.status || SubscriptionStatus.DRAFT;
    const startDate = input.startDate ? new Date(input.startDate) : new Date();

    const subscription = await prisma.subscription.create({
      data: {
        subscriptionNumber: subNumber,
        customerId: input.customerId,
        createdById: createdById || null,
        planId: input.planId,
        status: initialStatus,
        quantity,
        unitPrice,
        discountId,
        discountAmount,
        taxRate,
        taxAmount,
        subtotal,
        totalAmount,
        paymentTerms: input.paymentTerms || PaymentTerms.NET_30,
        startDate,
        autoRenew: input.autoRenew ?? plan.autoRenew,
        notes: input.notes,
        ...(initialStatus === SubscriptionStatus.QUOTATION && {
          quotationSentAt: new Date(),
        }),
      },
      include: {
        plan: { include: { product: true } },
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, companyName: true },
        },
      },
    });

    // Record initial lifecycle log
    await prisma.subscriptionLifecycleLog.create({
      data: {
        subscriptionId: subscription.id,
        fromStatus: SubscriptionStatus.DRAFT,
        toStatus: initialStatus,
        action: initialStatus === SubscriptionStatus.QUOTATION ? 'QUOTATION_CREATED' : 'DRAFT_CREATED',
        notes: `Initial subscription ${initialStatus} created. Total: $${totalAmount}`,
        performedById: createdById,
      },
    });

    return subscription;
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
      include: { customer: true, plan: true },
    });

    await prisma.subscriptionLifecycleLog.create({
      data: {
        subscriptionId: id,
        fromStatus: SubscriptionStatus.DRAFT,
        toStatus: SubscriptionStatus.QUOTATION,
        action: 'SENT_QUOTATION',
        notes: 'Quotation sent to customer for approval',
        performedById,
      },
    });

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
      include: { customer: true, plan: true },
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

    return updated;
  }

  /**
   * Confirm and Activate subscription (CONFIRMED -> ACTIVE)
   * Calculates next billing date and optionally expires date based on plan
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
    const nextBillingDate = this.computeNextBillingDate(startDate, sub.plan.billingCycleDays);

    let expiryDate: Date | null = null;
    if (sub.plan.billingFrequency === BillingFrequency.YEARLY) {
      expiryDate = new Date(startDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
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
      include: { customer: true, plan: true },
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
        notes: `Subscription activated. Next billing scheduled on: ${nextBillingDate.toISOString().split('T')[0]}`,
        performedById,
      },
    });

    return updated;
  }

  /**
   * Pause active subscription (ACTIVE -> PAUSED)
   */
  async pauseSubscription(id: string, reason?: string, performedById?: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: { plan: true },
    });

    if (!sub) throw new Error('Subscription not found');
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

    return updated;
  }

  /**
   * Resume paused subscription (PAUSED -> ACTIVE)
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

    const nextBillingDate = this.computeNextBillingDate(new Date(), sub.plan.billingCycleDays);

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate,
      },
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

    return updated;
  }

  /**
   * Close or Cancel subscription (ACTIVE/PAUSED -> CLOSED)
   */
  async closeSubscription(id: string, reason?: string, performedById?: string) {
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new Error('Subscription not found');

    const updated = await prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.CLOSED,
        closedAt: new Date(),
        cancellationReason: reason,
      },
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

    return updated;
  }

  /**
   * Fetch all subscriptions with filters (status, customer, date)
   */
  async getAllSubscriptions(params?: {
    customerId?: string;
    status?: SubscriptionStatus;
    search?: string;
  }) {
    const where: any = {};
    if (params?.customerId) where.customerId = params.customerId;
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { subscriptionNumber: { contains: params.search } },
        { customer: { email: { contains: params.search } } },
        { customer: { companyName: { contains: params.search } } },
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
          },
        },
        discount: true,
        _count: { select: { invoices: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Fetch subscription details including invoices and lifecycle history
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
        discount: true,
        invoices: {
          orderBy: { issueDate: 'desc' },
        },
        lifecycleLogs: {
          orderBy: { createdAt: 'asc' },
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
