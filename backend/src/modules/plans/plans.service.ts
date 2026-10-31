import prisma from '../../config/db';
import { BillingFrequency } from '@prisma/client';

export interface CreatePlanInput {
  productId: string;
  variantId?: string;
  name: string;
  code: string;
  description?: string;
  billingFrequency: BillingFrequency;
  billingCycleDays?: number;
  price: number;
  currency?: string;
  minQuantity?: number;
  availableFrom?: Date;
  availableTo?: Date;
  autoCloseOnExpiry?: boolean;
  canPause?: boolean;
  autoRenew?: boolean;
  trialDays?: number;
  isActive?: boolean;
}

export interface UpdatePlanInput extends Partial<CreatePlanInput> {}

export class PlansService {
  private calculateCycleDays(frequency: BillingFrequency, customDays?: number): number {
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

  async getAllPlans(params?: { productId?: string; frequency?: BillingFrequency; isActive?: boolean }) {
    const where: any = {};

    if (params?.productId) where.productId = params.productId;
    if (params?.frequency) where.billingFrequency = params.frequency;
    if (params?.isActive !== undefined) where.isActive = params.isActive;

    return prisma.plan.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            code: true,
            brand: true,
          },
        },
        variant: true,
      },
      orderBy: { price: 'asc' },
    });
  }

  async getPlanById(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!plan) {
      throw new Error(`Plan with ID '${id}' not found`);
    }

    return plan;
  }

  async createPlan(input: CreatePlanInput) {
    const cycleDays = this.calculateCycleDays(input.billingFrequency, input.billingCycleDays);

    return prisma.plan.create({
      data: {
        productId: input.productId,
        variantId: input.variantId || null,
        name: input.name,
        code: input.code.toUpperCase(),
        description: input.description,
        billingFrequency: input.billingFrequency,
        billingCycleDays: cycleDays,
        price: input.price,
        currency: input.currency || 'USD',
        minQuantity: input.minQuantity ?? 1,
        availableFrom: input.availableFrom ? new Date(input.availableFrom) : null,
        availableTo: input.availableTo ? new Date(input.availableTo) : null,
        autoCloseOnExpiry: input.autoCloseOnExpiry ?? true,
        canPause: input.canPause ?? true,
        autoRenew: input.autoRenew ?? true,
        trialDays: input.trialDays ?? 0,
        isActive: input.isActive ?? true,
      },
      include: {
        product: true,
        variant: true,
      },
    });
  }

  async updatePlan(id: string, input: UpdatePlanInput) {
    const data: any = { ...input };
    if (input.code) data.code = input.code.toUpperCase();
    if (input.billingFrequency) {
      data.billingCycleDays = this.calculateCycleDays(input.billingFrequency, input.billingCycleDays);
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

  async deletePlan(id: string) {
    return prisma.plan.delete({
      where: { id },
    });
  }
}

export const plansService = new PlansService();
