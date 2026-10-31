import prisma from '../../config/prisma';
import { NotFoundError } from '../../utils/errors';
import { BillingFrequency } from '@prisma/client';

export class PlansService {
  public static async getAll(filter?: {
    productId?: string;
    billingFrequency?: BillingFrequency;
    isActive?: boolean;
  }) {
    const where: any = {};

    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter?.productId) {
      where.productId = filter.productId;
    }

    if (filter?.billingFrequency) {
      where.billingFrequency = filter.billingFrequency;
    }

    return prisma.plan.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            brand: true,
            category: true,
          },
        },
        variant: true,
      },
      orderBy: { cost: 'asc' },
    });
  }

  public static async getById(id: string) {
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!plan) {
      throw new NotFoundError(`Plan with ID ${id} not found.`);
    }

    return plan;
  }

  public static async create(data: {
    productId: string;
    variantId?: string;
    name: string;
    description?: string;
    billingFrequency: BillingFrequency;
    cost: number;
    currency?: string;
    minimumQuantity?: number;
    validFrom?: Date;
    validUntil?: Date;
    autoClose?: boolean;
    autoRenew?: boolean;
    pauseAllowed?: boolean;
    trialPeriodDays?: number;
    gracePeriodDays?: number;
  }) {
    return prisma.plan.create({
      data: {
        productId: data.productId,
        variantId: data.variantId,
        name: data.name,
        description: data.description,
        billingFrequency: data.billingFrequency,
        cost: data.cost,
        currency: data.currency || 'USD',
        minimumQuantity: data.minimumQuantity || 1,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        autoClose: data.autoClose ?? true,
        autoRenew: data.autoRenew ?? true,
        pauseAllowed: data.pauseAllowed ?? true,
        trialPeriodDays: data.trialPeriodDays ?? 0,
        gracePeriodDays: data.gracePeriodDays ?? 7,
      },
      include: {
        product: true,
        variant: true,
      },
    });
  }

  public static async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      cost?: number;
      billingFrequency?: BillingFrequency;
      minimumQuantity?: number;
      validFrom?: Date;
      validUntil?: Date;
      autoClose?: boolean;
      autoRenew?: boolean;
      pauseAllowed?: boolean;
      trialPeriodDays?: number;
      gracePeriodDays?: number;
      isActive?: boolean;
    }
  ) {
    await this.getById(id);

    return prisma.plan.update({
      where: { id },
      data,
      include: {
        product: true,
        variant: true,
      },
    });
  }

  public static async delete(id: string) {
    await this.getById(id);

    return prisma.plan.delete({
      where: { id },
    });
  }
}
