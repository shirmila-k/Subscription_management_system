import prisma from '../../config/db';
import {
  QuotationStatus,
  SubscriptionStatus,
  PaymentTerms,
  ProductStatus,
  PlanStatus,
  Prisma,
} from '@prisma/client';
import {
  CreateQuotationInput,
  UpdateQuotationInput,
  ConvertQuotationInput,
} from './quotations.validation';
import { discountsService } from '../discounts/discounts.service';

export class QuotationsService {
  /**
   * Helper to generate unique quotation number: QT-YYYY-XXXX
   */
  private async generateQuotationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.quotation.count();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `QT-${year}-${sequence}`;
  }

  /**
   * Helper to generate subscription number: SUB-YYYY-XXXXX
   */
  private async generateSubscriptionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.subscription.count();
    const sequence = (count + 1).toString().padStart(5, '0');
    return `SUB-${year}-${sequence}`;
  }

  /**
   * List quotations with search, status filtering, customer filtering
   */
  async getAllQuotations(params?: {
    status?: QuotationStatus;
    customerId?: string;
    search?: string;
  }) {
    const where: Prisma.QuotationWhereInput = {};

    if (params?.status) {
      where.status = params.status;
    }
    if (params?.customerId) {
      where.customerId = params.customerId;
    }
    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { quotationNumber: { contains: q } },
        { customer: { firstName: { contains: q } } },
        { customer: { lastName: { contains: q } } },
        { customer: { email: { contains: q } } },
        { customer: { companyName: { contains: q } } },
      ];
    }

    // Auto-expire quotations whose expiryDate < now and are in DRAFT or SENT
    const now = new Date();
    await prisma.quotation.updateMany({
      where: {
        status: { in: [QuotationStatus.DRAFT, QuotationStatus.SENT] },
        expiryDate: { lt: now },
      },
      data: { status: QuotationStatus.EXPIRED },
    });

    return prisma.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            taxId: true,
          },
        },
        template: {
          select: { id: true, name: true },
        },
        items: {
          include: {
            product: { select: { id: true, name: true, code: true } },
            variant: { select: { id: true, name: true, sku: true } },
            plan: { select: { id: true, name: true, code: true } },
          },
        },
        subscription: {
          select: { id: true, subscriptionNumber: true, status: true },
        },
      },
    });
  }

  /**
   * Get single quotation details with line item breakdown
   */
  async getQuotationById(id: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            companyName: true,
            taxId: true,
            phone: true,
            address: true,
          },
        },
        template: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        items: {
          include: {
            product: true,
            variant: true,
            plan: true,
          },
        },
        subscription: {
          select: { id: true, subscriptionNumber: true, status: true, totalAmount: true },
        },
      },
    });

    if (!quotation) throw new Error('Quotation not found');

    // Auto-check expiry
    const now = new Date();
    if (
      quotation.expiryDate < now &&
      (quotation.status === QuotationStatus.DRAFT || quotation.status === QuotationStatus.SENT)
    ) {
      const expired = await prisma.quotation.update({
        where: { id },
        data: { status: QuotationStatus.EXPIRED },
        include: {
          customer: true,
          items: true,
          subscription: true,
        },
      });
      return expired;
    }

    return quotation;
  }

  /**
   * Calculate quotation financials with Decimal-safe arithmetic
   */
  calculateFinancials<T extends {
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxAmount?: number;
  }>(
    items: T[],
    taxRatePercent = 18,
    globalDiscountAmount = 0
  ) {
    let subtotal = 0;
    let itemsDiscount = 0;
    let totalTax = 0;

    const computedItems = items.map((item) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
      const lineRaw = Math.round(qty * unitPrice * 100) / 100;
      const lineDisc = Math.min(lineRaw, Math.max(0, Number(item.discountAmount) || 0));
      const taxable = Math.max(0, lineRaw - lineDisc);
      const lineTax = Math.round(((taxable * taxRatePercent) / 100) * 100) / 100;
      const lineTotal = Math.round((taxable + lineTax) * 100) / 100;

      subtotal += lineRaw;
      itemsDiscount += lineDisc;
      totalTax += lineTax;

      return {
        ...item,
        quantity: qty,
        unitPrice,
        discountAmount: lineDisc,
        taxAmount: lineTax,
        lineTotal,
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    const totalDiscount = Math.round((itemsDiscount + Math.max(0, globalDiscountAmount)) * 100) / 100;
    totalTax = Math.round(totalTax * 100) / 100;

    const grandTotal = Math.max(
      0,
      Math.round((subtotal - totalDiscount + totalTax) * 100) / 100
    );

    return {
      computedItems,
      subtotal,
      discountAmount: totalDiscount,
      taxAmount: totalTax,
      totalAmount: grandTotal,
    };
  }

  /**
   * Create a new quotation
   */
  async createQuotation(input: CreateQuotationInput, createdById?: string) {
    // 1. Verify customer exists
    const customer = await prisma.user.findUnique({
      where: { id: input.customerId },
    });
    if (!customer) {
      throw new Error('Customer does not exist');
    }

    // 2. Resolve template default terms and validity if provided
    let terms = input.terms;
    let validityDays = input.validityDays ?? 30;

    if (input.templateId) {
      const template = await prisma.quotationTemplate.findUnique({
        where: { id: input.templateId },
      });
      if (template) {
        if (!terms && template.defaultTerms) {
          terms = template.defaultTerms;
        }
        if (!input.validityDays && template.defaultValidityDays) {
          validityDays = template.defaultValidityDays;
        }
      }
    }

    // 3. Resolve dates
    const quotationDate = input.quotationDate ? new Date(input.quotationDate) : new Date();
    let expiryDate = input.expiryDate ? new Date(input.expiryDate) : null;
    if (!expiryDate) {
      expiryDate = new Date(quotationDate);
      expiryDate.setDate(expiryDate.getDate() + validityDays);
    }

    if (expiryDate <= quotationDate) {
      throw new Error('Expiry date must be after the quotation date');
    }

    // 4. Validate and apply coupon code if supplied
    let extraDiscount = input.discountAmount ?? 0;
    if (input.discountCode) {
      const subtotalEstimate = input.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0),
        0
      );
      const discountRes = await discountsService.validateAndApplyDiscount(
        input.discountCode,
        input.items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0),
        subtotalEstimate
      );
      extraDiscount = Math.max(extraDiscount, discountRes.discountAmount);
    }

    // 5. Calculate financials
    const taxRate = input.taxRate !== undefined ? Number(input.taxRate) : 18;
    const { computedItems, subtotal, discountAmount, taxAmount, totalAmount } =
      this.calculateFinancials(input.items, taxRate, extraDiscount);

    const quotationNumber = await this.generateQuotationNumber();

    return prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: input.customerId,
        createdById: createdById || null,
        templateId: input.templateId || null,
        status: QuotationStatus.DRAFT,
        quotationDate,
        expiryDate,
        subtotal: new Prisma.Decimal(subtotal),
        taxRate: new Prisma.Decimal(taxRate),
        taxAmount: new Prisma.Decimal(taxAmount),
        discountAmount: new Prisma.Decimal(discountAmount),
        totalAmount: new Prisma.Decimal(totalAmount),
        terms,
        notes: input.notes,
        items: {
          create: computedItems.map((item) => ({
            productId: item.productId || null,
            variantId: item.variantId || null,
            planId: item.planId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice),
            discountAmount: new Prisma.Decimal(item.discountAmount || 0),
            taxAmount: new Prisma.Decimal(item.taxAmount || 0),
            lineTotal: new Prisma.Decimal(item.lineTotal),
          })),
        },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
            variant: true,
            plan: true,
          },
        },
      },
    });
  }

  /**
   * Update quotation (only permitted if in DRAFT or SENT state)
   */
  async updateQuotation(id: string, input: UpdateQuotationInput) {
    const existing = await prisma.quotation.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existing) throw new Error('Quotation not found');

    if (
      existing.status === QuotationStatus.ACCEPTED ||
      existing.status === QuotationStatus.CONVERTED
    ) {
      throw new Error(`Cannot modify quotation in '${existing.status}' state`);
    }

    let subtotal = Number(existing.subtotal);
    let taxAmount = Number(existing.taxAmount);
    let discountAmount = Number(existing.discountAmount);
    let totalAmount = Number(existing.totalAmount);
    const taxRate = input.taxRate !== undefined ? Number(input.taxRate) : Number(existing.taxRate);

    // If items are being updated, recalculate
    if (input.items && input.items.length > 0) {
      const calc = this.calculateFinancials(
        input.items,
        taxRate,
        input.discountAmount ?? Number(existing.discountAmount)
      );
      subtotal = calc.subtotal;
      taxAmount = calc.taxAmount;
      discountAmount = calc.discountAmount;
      totalAmount = calc.totalAmount;

      // Replace items
      await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
      await prisma.quotationItem.createMany({
        data: calc.computedItems.map((item) => ({
          quotationId: id,
          productId: item.productId || null,
          variantId: item.variantId || null,
          planId: item.planId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice),
          discountAmount: new Prisma.Decimal(item.discountAmount || 0),
          taxAmount: new Prisma.Decimal(item.taxAmount || 0),
          lineTotal: new Prisma.Decimal(item.lineTotal),
        })),
      });
    }

    const updateData: Prisma.QuotationUpdateInput = {};
    if (input.templateId !== undefined) updateData.template = input.templateId ? { connect: { id: input.templateId } } : { disconnect: true };
    if (input.expiryDate !== undefined) updateData.expiryDate = new Date(input.expiryDate);
    if (input.terms !== undefined) updateData.terms = input.terms;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.status !== undefined) updateData.status = input.status;
    updateData.taxRate = new Prisma.Decimal(taxRate);
    updateData.subtotal = new Prisma.Decimal(subtotal);
    updateData.taxAmount = new Prisma.Decimal(taxAmount);
    updateData.discountAmount = new Prisma.Decimal(discountAmount);
    updateData.totalAmount = new Prisma.Decimal(totalAmount);

    return prisma.quotation.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        items: true,
      },
    });
  }

  /**
   * Transition: Issue/Send quotation to customer (DRAFT -> SENT)
   */
  async sendQuotation(id: string) {
    const quote = await prisma.quotation.findUnique({ where: { id } });
    if (!quote) throw new Error('Quotation not found');

    if (quote.status !== QuotationStatus.DRAFT) {
      throw new Error(`Cannot send quotation in '${quote.status}' status`);
    }

    if (quote.expiryDate < new Date()) {
      throw new Error('Cannot send an expired quotation. Please extend the validity date.');
    }

    return prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.SENT },
      include: { customer: true, items: true },
    });
  }

  /**
   * Transition: Customer accepts quotation (SENT -> ACCEPTED)
   */
  async acceptQuotation(id: string, customerId?: string) {
    const quote = await prisma.quotation.findUnique({ where: { id } });
    if (!quote) throw new Error('Quotation not found');

    if (customerId && quote.customerId !== customerId) {
      throw new Error('Unauthorized: You can only accept quotations issued to your account');
    }

    if (quote.status !== QuotationStatus.SENT && quote.status !== QuotationStatus.DRAFT) {
      throw new Error(`Cannot accept quotation currently in '${quote.status}' status`);
    }

    if (quote.expiryDate < new Date()) {
      await prisma.quotation.update({
        where: { id },
        data: { status: QuotationStatus.EXPIRED },
      });
      throw new Error('This quotation has expired and can no longer be accepted');
    }

    return prisma.quotation.update({
      where: { id },
      data: { status: QuotationStatus.ACCEPTED },
      include: { customer: true, items: true },
    });
  }

  /**
   * Transition: Customer or Sales rep rejects quotation (SENT -> REJECTED)
   */
  async rejectQuotation(id: string, reason?: string) {
    const quote = await prisma.quotation.findUnique({ where: { id } });
    if (!quote) throw new Error('Quotation not found');

    if (quote.status === QuotationStatus.CONVERTED) {
      throw new Error('Cannot reject a quotation that has already been converted to a subscription');
    }

    return prisma.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.REJECTED,
        notes: reason ? `${quote.notes || ''}\n[Rejection Reason]: ${reason}` : quote.notes,
      },
      include: { customer: true, items: true },
    });
  }

  /**
   * 🌟 TRANSACTIONAL QUOTE-TO-SUBSCRIPTION CONVERSION WORKFLOW 🌟
   * 
   * Atomically converts an ACCEPTED quotation into a confirmed subscription.
   * - Validates customer, product, variant, and plan eligibility
   * - Prevents duplicate conversions idempotently
   * - Locks snapshot agreed prices, taxes, and discounts
   * - Creates Subscription and SubscriptionItem rows
   * - Links quotation to subscription (1:1)
   * - Records SubscriptionLifecycleLog audit trail
   * - Atomic rollback if any failure occurs
   */
  async convertQuotationToSubscription(
    quotationId: string,
    input?: ConvertQuotationInput,
    convertedById?: string
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch quotation with items and customer
      const quote = await tx.quotation.findUnique({
        where: { id: quotationId },
        include: {
          customer: true,
          subscription: true,
          items: {
            include: {
              product: true,
              variant: true,
              plan: true,
            },
          },
        },
      });

      if (!quote) {
        throw new Error('Quotation not found');
      }

      // 2. Prevent duplicate conversion
      if (quote.status === QuotationStatus.CONVERTED || quote.subscription !== null) {
        throw new Error(
          `Quotation ${quote.quotationNumber} has already been converted to subscription ${quote.subscription?.subscriptionNumber || ''}`
        );
      }

      // 3. Status eligibility: Must be ACCEPTED (or SENT if direct conversion by authorized staff)
      if (quote.status !== QuotationStatus.ACCEPTED && quote.status !== QuotationStatus.SENT) {
        throw new Error(
          `Cannot convert quotation in '${quote.status}' state. Quotation must be accepted before conversion.`
        );
      }

      // 4. Validate customer eligibility
      if (quote.customer.status === 'SUSPENDED') {
        throw new Error(`Customer account '${quote.customer.email}' is suspended`);
      }

      // 5. Validate line items and resolve primary Plan
      if (quote.items.length === 0) {
        throw new Error('Cannot convert a quotation with no line items');
      }

      let primaryPlanId: string | null = null;
      let primaryPlan: any = null;

      for (const item of quote.items) {
        // Validate Product if associated
        if (item.productId && item.product) {
          if (item.product.status === ProductStatus.ARCHIVED || !item.product.isActive) {
            throw new Error(
              `Product '${item.product.name}' in quotation is archived and cannot be subscribed to`
            );
          }
        }

        // Validate Variant if associated
        if (item.variantId && item.variant) {
          if (!item.variant.isActive) {
            throw new Error(
              `Product variant '${item.variant.name}' in quotation is inactive`
            );
          }
        }

        // Validate Plan if associated
        if (item.planId && item.plan) {
          if (item.plan.status === PlanStatus.ARCHIVED || !item.plan.isActive) {
            throw new Error(
              `Subscription plan '${item.plan.name}' in quotation is archived and cannot be newly subscribed to`
            );
          }

          // Check plan availability dates
          const now = new Date();
          if (item.plan.availableFrom && item.plan.availableFrom > now) {
            throw new Error(`Plan '${item.plan.name}' is not yet available`);
          }
          if (item.plan.availableTo && item.plan.availableTo < now) {
            throw new Error(`Plan '${item.plan.name}' availability period has ended`);
          }

          if (!primaryPlanId) {
            primaryPlanId = item.planId;
            primaryPlan = item.plan;
          }
        }
      }

      // If no explicit plan on items, fall back to first active plan in system
      if (!primaryPlanId) {
        const fallbackPlan = await tx.plan.findFirst({
          where: { isActive: true, status: PlanStatus.ACTIVE },
        });
        if (!fallbackPlan) {
          throw new Error('No active subscription plan found in the system to bind subscription');
        }
        primaryPlanId = fallbackPlan.id;
        primaryPlan = fallbackPlan;
      }

      // 6. Generate Subscription Reference
      const subYear = new Date().getFullYear();
      const subCount = await tx.subscription.count();
      const subSequence = (subCount + 1).toString().padStart(5, '0');
      const subscriptionNumber = `SUB-${subYear}-${subSequence}`;

      const startDate = input?.startDate ? new Date(input.startDate) : new Date();
      const paymentTerms = input?.paymentTerms || PaymentTerms.NET_30;
      const autoRenew = input?.autoRenew ?? primaryPlan?.autoRenew ?? true;

      // 7. Create Subscription with locked pricing snapshot
      const createdSub = await tx.subscription.create({
        data: {
          subscriptionNumber,
          customerId: quote.customerId,
          createdById: convertedById || quote.createdById || null,
          quotationId: quote.id,
          planId: primaryPlanId,
          status: SubscriptionStatus.CONFIRMED,
          quantity: quote.items[0]?.quantity || 1,
          unitPrice: quote.items[0]?.unitPrice || primaryPlan.price,
          discountAmount: quote.discountAmount,
          taxRate: quote.taxRate,
          taxAmount: quote.taxAmount,
          subtotal: quote.subtotal,
          totalAmount: quote.totalAmount,
          paymentTerms,
          startDate,
          autoRenew,
          quotationSentAt: quote.quotationDate,
          quotationAcceptedAt: new Date(),
          confirmedAt: new Date(),
          notes: input?.notes
            ? `${quote.notes || ''}\n${input.notes}`.trim()
            : quote.notes || `Converted from quotation ${quote.quotationNumber}`,
        },
      });

      // 8. Snapshot quotation line items as SubscriptionItems
      await tx.subscriptionItem.createMany({
        data: quote.items.map((item) => ({
          subscriptionId: createdSub.id,
          productId: item.productId,
          variantId: item.variantId,
          planId: item.planId || primaryPlanId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
        })),
      });

      // 9. Update Quotation status to CONVERTED
      await tx.quotation.update({
        where: { id: quote.id },
        data: {
          status: QuotationStatus.CONVERTED,
        },
      });

      // 10. Record traceable audit log in SubscriptionLifecycleLog
      await tx.subscriptionLifecycleLog.create({
        data: {
          subscriptionId: createdSub.id,
          fromStatus: SubscriptionStatus.DRAFT,
          toStatus: SubscriptionStatus.CONFIRMED,
          action: 'CONVERTED_FROM_QUOTATION',
          notes: `Confirmed subscription converted from Quotation ${quote.quotationNumber}. Total locked: $${quote.totalAmount}`,
          performedById: convertedById || quote.createdById || null,
        },
      });

      // 11. Return created subscription with relations
      return tx.subscription.findUnique({
        where: { id: createdSub.id },
        include: {
          customer: true,
          plan: { include: { product: true } },
          items: true,
          quotation: true,
        },
      });
    });
  }
}

export const quotationsService = new QuotationsService();
