import prisma from '../../config/prisma';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { SubscriptionStatus, PaymentTerms, BillingFrequency } from '@prisma/client';
import { InvoicesService } from '../invoices/invoices.service';

export class SubscriptionsService {
  /**
   * Helper to calculate the next billing date based on billing frequency
   */
  public static calculateNextBillingDate(fromDate: Date, frequency: BillingFrequency): Date {
    const nextDate = new Date(fromDate);
    switch (frequency) {
      case BillingFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case BillingFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case BillingFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case BillingFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    return nextDate;
  }

  /**
   * Generate sequential subscription number e.g. SUB-2026-0001
   */
  public static async generateSubscriptionNumber(): Promise<string> {
    const count = await prisma.subscription.count();
    const year = new Date().getFullYear();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `SUB-${year}-${sequence}`;
  }

  /**
   * Create a Quotation or Draft subscription
   */
  public static async createQuotation(data: {
    customerId: string;
    planId?: string;
    templateId?: string;
    quantity?: number;
    paymentTerms?: PaymentTerms;
    discountCode?: string;
    quotationNotes?: string;
    quotationExpiresInDays?: number;
    customItems?: Array<{
      variantId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }>;
  }) {
    let targetPlanId = data.planId;
    let effectiveTerms = data.paymentTerms;
    let effectiveNotes = data.quotationNotes;
    let effectiveExpiresInDays = data.quotationExpiresInDays;
    let effectiveItems = data.customItems;

    if (data.templateId) {
      const template = await prisma.quotationTemplate.findUnique({
        where: { id: data.templateId },
        include: { lines: true },
      });

      if (!template) {
        throw new NotFoundError(`Quotation template with ID ${data.templateId} not found.`);
      }

      if (!targetPlanId) targetPlanId = template.planId;
      if (!effectiveTerms) effectiveTerms = template.defaultPaymentTerms;
      if (!effectiveNotes) effectiveNotes = template.defaultNotes || undefined;
      if (!effectiveExpiresInDays) effectiveExpiresInDays = template.validityDays;
      if (!effectiveItems && template.lines.length > 0) {
        effectiveItems = template.lines.map((l) => ({
          variantId: l.variantId || undefined,
          description: l.description,
          quantity: l.quantity,
          unitPrice: Number(l.unitPrice),
        }));
      }
    }

    if (!targetPlanId) {
      throw new BadRequestError('A valid planId or templateId is required to generate a quotation.');
    }

    const plan = await prisma.plan.findUnique({
      where: { id: targetPlanId },
      include: { product: true, variant: true },
    });

    if (!plan || !plan.isActive) {
      throw new BadRequestError('The selected plan is invalid or inactive.');
    }

    const customer = await prisma.user.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found.');
    }

    const quantity = Math.max(data.quantity || 1, plan.minimumQuantity);
    const unitPrice = Number(plan.cost);
    let subtotal = 0;

    if (effectiveItems && effectiveItems.length > 0) {
      subtotal = effectiveItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    } else {
      subtotal = unitPrice * quantity;
    }

    // Check discount if provided
    let discountId: string | undefined = undefined;
    let discountAmount = 0;

    if (data.discountCode) {
      const discount = await prisma.discount.findUnique({
        where: { code: data.discountCode.toUpperCase() },
      });

      const now = new Date();
      if (
        discount &&
        discount.isActive &&
        now >= discount.startDate &&
        now <= discount.endDate &&
        quantity >= discount.minQuantity &&
        (!discount.maxUses || discount.usedCount < discount.maxUses)
      ) {
        discountId = discount.id;
        if (discount.type === 'PERCENTAGE') {
          discountAmount = (subtotal * Number(discount.value)) / 100;
        } else {
          discountAmount = Number(discount.value);
        }
      }
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const subscriptionNumber = await this.generateSubscriptionNumber();

    const quotationExpiresAt = new Date();
    quotationExpiresAt.setDate(quotationExpiresAt.getDate() + (effectiveExpiresInDays || 14));

    return prisma.subscription.create({
      data: {
        subscriptionNumber,
        customerId: data.customerId,
        planId: targetPlanId,
        status: SubscriptionStatus.QUOTATION,
        quantity,
        unitPrice,
        discountId,
        discountAmount,
        totalAmount,
        paymentTerms: effectiveTerms || PaymentTerms.IMMEDIATE,
        quotationNotes: effectiveNotes,
        quotationExpiresAt,
        items: {
          create: effectiveItems?.map((item) => ({
            variantId: item.variantId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
          })) || [
            {
              variantId: plan.variantId,
              description: `${plan.product.name} - ${plan.name} (${plan.billingFrequency})`,
              quantity,
              unitPrice,
              subtotal,
            },
          ],
        },
      },
      include: {
        plan: { include: { product: true } },
        customer: { select: { id: true, name: true, email: true, companyName: true } },
        discount: true,
        items: true,
      },
    });
  }

  /**
   * Confirm quotation (Moves to CONFIRMED state)
   */
  public static async confirmQuotation(subscriptionId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found.');
    }

    if (sub.status !== SubscriptionStatus.QUOTATION && sub.status !== SubscriptionStatus.DRAFT) {
      throw new BadRequestError(`Cannot confirm subscription in ${sub.status} state.`);
    }

    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CONFIRMED,
      },
      include: { plan: true, customer: true },
    });
  }

  /**
   * Activate subscription (Moves to ACTIVE, sets dates, and triggers first Invoice)
   */
  public static async activateSubscription(subscriptionId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true, items: true, customer: true },
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found.');
    }

    if (sub.status !== SubscriptionStatus.CONFIRMED && sub.status !== SubscriptionStatus.QUOTATION) {
      throw new BadRequestError(`Cannot activate subscription currently in ${sub.status} status.`);
    }

    const startDate = new Date();
    const nextBillingDate = this.calculateNextBillingDate(startDate, sub.plan.billingFrequency);

    // Calculate expiry if plan validity exists
    let expiryDate: Date | undefined = undefined;
    if (sub.plan.validUntil) {
      expiryDate = new Date(sub.plan.validUntil);
    } else {
      // Default expiry 1 year out or as per frequency
      expiryDate = new Date(startDate);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    const updatedSub = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        startDate,
        expiryDate,
        nextBillingDate,
        lastBilledDate: startDate,
      },
      include: { plan: true, customer: true, items: true },
    });

    // Auto-generate initial invoice
    await InvoicesService.generateInvoiceForSubscription(updatedSub.id, startDate, nextBillingDate);

    // Increment discount usage if applicable
    if (sub.discountId) {
      await prisma.discount.update({
        where: { id: sub.discountId },
        data: { usedCount: { increment: 1 } },
      });
    }

    return updatedSub;
  }

  /**
   * Pause subscription if permitted by plan lifecycle rules
   */
  public static async pauseSubscription(subscriptionId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found.');
    }

    if (sub.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestError('Only ACTIVE subscriptions can be paused.');
    }

    if (!sub.plan.pauseAllowed) {
      throw new BadRequestError('This subscription plan does not allow pausing.');
    }

    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.PAUSED,
      },
    });
  }

  /**
   * Resume paused subscription
   */
  public static async resumeSubscription(subscriptionId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found.');
    }

    if (sub.status !== SubscriptionStatus.PAUSED) {
      throw new BadRequestError('Subscription is not paused.');
    }

    const now = new Date();
    const nextBillingDate = this.calculateNextBillingDate(now, sub.plan.billingFrequency);

    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate,
      },
    });
  }

  /**
   * Close / Cancel subscription
   */
  public static async closeSubscription(subscriptionId: string, reason?: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found.');
    }

    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.CLOSED,
        cancelledAt: new Date(),
        cancellationReason: reason || 'Closed by user or automated lifecycle rule',
      },
    });
  }

  /**
   * Renew subscription
   */
  public static async renewSubscription(subscriptionId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found.');
    }

    const currentExpiry = sub.expiryDate || new Date();
    const newExpiry = new Date(currentExpiry);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    const nextBillingDate = this.calculateNextBillingDate(new Date(), sub.plan.billingFrequency);

    return prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        expiryDate: newExpiry,
        nextBillingDate,
      },
    });
  }

  public static async getAll(filter?: {
    customerId?: string;
    status?: SubscriptionStatus;
    planId?: string;
  }) {
    const where: any = {};

    if (filter?.customerId) {
      where.customerId = filter.customerId;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.planId) {
      where.planId = filter.planId;
    }

    return prisma.subscription.findMany({
      where,
      include: {
        plan: { include: { product: true } },
        customer: { select: { id: true, name: true, email: true, companyName: true } },
        discount: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getById(id: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id },
      include: {
        plan: { include: { product: true, variant: true } },
        customer: { select: { id: true, name: true, email: true, companyName: true, phone: true } },
        discount: true,
        items: { include: { variant: true } },
        invoices: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!sub) {
      throw new NotFoundError(`Subscription with ID ${id} not found.`);
    }

    return sub;
  }
}
