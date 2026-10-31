import prisma from '../../config/db';
import { CreatePlanInput, UpdatePlanInput } from './plans.types';
import { BillingFrequency, PlanStatus, ProductStatus } from '@prisma/client';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors';
import { Prisma } from '@prisma/client';

export class PlansService {
  /**
   * Calculate standard billing cycle days based on frequency
   */
  calculateCycleDays(frequency: BillingFrequency, customDays?: number): number {
    if (customDays && customDays > 0) return customDays;
    switch (frequency) {
      case BillingFrequency.DAILY:
        return 1;
      case BillingFrequency.WEEKLY:
        return 7;
      case BillingFrequency.MONTHLY:
        return 30;
      case BillingFrequency.YEARLY:
        return 365;
      default:
        return 30;
    }
  }

  /**
   * Retrieve all plans with optional filtering
   */
  async getAllPlans(params?: {
    productId?: string;
    frequency?: BillingFrequency;
    status?: PlanStatus;
    availableOnly?: boolean;
    search?: string;
  }) {
    const where: any = {};

    if (params?.productId) where.productId = params.productId;
    if (params?.frequency) where.billingFrequency = params.frequency;

    if (params?.availableOnly) {
      const now = new Date();
      where.status = PlanStatus.ACTIVE;
      where.isActive = true;
      where.product = {
        status: ProductStatus.ACTIVE,
        isActive: true,
      };
      where.AND = [
        {
          OR: [{ availableFrom: null }, { availableFrom: { lte: now } }],
        },
        {
          OR: [{ availableTo: null }, { availableTo: { gte: now } }],
        },
      ];
    } else if (params?.status) {
      where.status = params.status;
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search } },
        { code: { contains: params.search } },
        { description: { contains: params.search } },
      ];
    }

    return prisma.plan.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            brand: true,
            type: true,
            salesPrice: true,
            status: true,
          },
        },
        variant: true,
      },
      orderBy: { price: 'asc' },
    });
  }

  /**
   * Fetch single plan by ID
   */
  async getPlanById(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!plan) {
      throw new NotFoundError(`Subscription Plan with ID '${id}' not found`);
    }

    return plan;
  }

  /**
   * Validate if a plan is available for a new customer subscription
   * Requirement: Prevent customers from subscribing to unavailable or archived plans.
   */
  async validatePlanForSubscription(planId: string, quantity = 1) {
    const plan = await this.getPlanById(planId);
    const now = new Date();

    // Check Plan Status
    if (plan.status === PlanStatus.ARCHIVED || !plan.isActive) {
      throw new BadRequestError('This subscription plan is archived and cannot accept new subscriptions.');
    }

    // Check Product Status
    if (plan.product.status === ProductStatus.ARCHIVED || !plan.product.isActive) {
      throw new BadRequestError('The product associated with this plan is archived and unavailable.');
    }

    // Check Availability Start Date
    if (plan.availableFrom && now < new Date(plan.availableFrom)) {
      throw new BadRequestError(
        `This plan is not available yet. Subscriptions open on ${new Date(plan.availableFrom).toISOString().split('T')[0]}.`
      );
    }

    // Check Availability End Date
    if (plan.availableTo && now > new Date(plan.availableTo)) {
      throw new BadRequestError('This subscription plan has expired and is no longer available for subscription.');
    }

    // Check Minimum Quantity
    if (quantity < plan.minQuantity) {
      throw new BadRequestError(
        `Requested quantity (${quantity}) is below the required minimum of ${plan.minQuantity} for this plan.`
      );
    }

    return {
      isValid: true,
      plan,
    };
  }

  /**
   * Create a new Plan (Admin Only)
   */
  async createPlan(input: CreatePlanInput) {
    const normalizedCode = input.code.toUpperCase().trim();

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      include: { variants: true },
    });

    if (!product) {
      throw new NotFoundError(`Product with ID '${input.productId}' does not exist.`);
    }

    // If variantId specified, ensure it belongs to this product
    if (input.variantId) {
      const variantExists = product.variants.some((v) => v.id === input.variantId);
      if (!variantExists) {
        throw new BadRequestError(`Variant '${input.variantId}' does not belong to product '${product.name}'.`);
      }
    }

    // Check unique code
    const existingCode = await prisma.plan.findUnique({
      where: { code: normalizedCode },
    });

    if (existingCode) {
      throw new ConflictError(`A plan with code '${normalizedCode}' already exists.`);
    }

    const cycleDays = this.calculateCycleDays(input.billingFrequency, input.billingCycleDays);

    return prisma.plan.create({
      data: {
        productId: input.productId,
        variantId: input.variantId || null,
        name: input.name.trim(),
        code: normalizedCode,
        description: input.description?.trim() || null,
        billingFrequency: input.billingFrequency,
        billingCycleDays: cycleDays,
        price: new Prisma.Decimal(input.price),
        currency: input.currency || 'INR',
        minQuantity: input.minQuantity ?? 1,
        availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
        availableTo: input.availableTo ? new Date(input.availableTo) : null,
        autoCloseOnExpiry: input.autoCloseOnExpiry ?? true,
        canPause: input.canPause ?? true,
        canCloseEarly: input.canCloseEarly ?? true,
        autoRenew: input.autoRenew ?? true,
        trialDays: input.trialDays ?? 0,
        status: input.status || PlanStatus.ACTIVE,
        isActive: input.status !== PlanStatus.ARCHIVED,
      },
      include: {
        product: true,
        variant: true,
      },
    });
  }

  /**
   * Update an existing Plan (Admin Only)
   */
  async updatePlan(id: string, input: UpdatePlanInput) {
    await this.getPlanById(id);

    if (input.code) {
      const normalizedCode = input.code.toUpperCase().trim();
      const existing = await prisma.plan.findFirst({
        where: { code: normalizedCode, NOT: { id } },
      });
      if (existing) {
        throw new ConflictError(`Another plan with code '${normalizedCode}' already exists.`);
      }
    }

    const data: any = {};
    if (input.name !== undefined) data.name = input.name.trim();
    if (input.code !== undefined) data.code = input.code.toUpperCase().trim();
    if (input.description !== undefined) data.description = input.description?.trim() || null;
    if (input.billingFrequency !== undefined) {
      data.billingFrequency = input.billingFrequency;
      data.billingCycleDays = this.calculateCycleDays(input.billingFrequency, input.billingCycleDays);
    } else if (input.billingCycleDays !== undefined) {
      data.billingCycleDays = input.billingCycleDays;
    }
    if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
    if (input.currency !== undefined) data.currency = input.currency.trim();
    if (input.minQuantity !== undefined) data.minQuantity = input.minQuantity;
    if (input.availableFrom !== undefined) {
      data.availableFrom = input.availableFrom ? new Date(input.availableFrom) : null;
    }
    if (input.availableTo !== undefined) {
      data.availableTo = input.availableTo ? new Date(input.availableTo) : null;
    }
    if (input.autoCloseOnExpiry !== undefined) data.autoCloseOnExpiry = input.autoCloseOnExpiry;
    if (input.canPause !== undefined) data.canPause = input.canPause;
    if (input.canCloseEarly !== undefined) data.canCloseEarly = input.canCloseEarly;
    if (input.autoRenew !== undefined) data.autoRenew = input.autoRenew;
    if (input.trialDays !== undefined) data.trialDays = input.trialDays;
    if (input.status !== undefined) {
      data.status = input.status;
      data.isActive = input.status === PlanStatus.ACTIVE;
    }
    if (input.isActive !== undefined) {
      data.isActive = input.isActive;
      data.status = input.isActive ? PlanStatus.ACTIVE : PlanStatus.ARCHIVED;
    }

    return prisma.plan.update({
      where: { id },
      data,
      include: {
        product: true,
        variant: true,
      },
    });
  }

  /**
   * Archive a Plan (Admin Only)
   */
  async archivePlan(id: string) {
    await this.getPlanById(id);

    return prisma.plan.update({
      where: { id },
      data: {
        status: PlanStatus.ARCHIVED,
        isActive: false,
      },
      include: {
        product: true,
        variant: true,
      },
    });
  }

  /**
   * Delete a plan permanently (Admin Only)
   */
  async deletePlan(id: string) {
    await this.getPlanById(id);

    return prisma.plan.delete({
      where: { id },
    });
  }
}

export const plansService = new PlansService();
