import prisma from '../../config/db';
import { DiscountType } from '@prisma/client';

export interface CreateDiscountInput {
  code: string;
  description?: string;
  type: DiscountType;
  value: number;
  minQuantity?: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  startDate?: Date;
  endDate?: Date;
  usageLimit?: number;
  isActive?: boolean;
}

export class DiscountsService {
  async getAllDiscounts(params?: { isActive?: boolean }) {
    const where: any = {};
    if (params?.isActive !== undefined) where.isActive = params.isActive;

    return prisma.discount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDiscountById(id: string) {
    const discount = await prisma.discount.findUnique({ where: { id } });
    if (!discount) throw new Error('Discount rule not found');
    return discount;
  }

  async createDiscount(input: CreateDiscountInput) {
    return prisma.discount.create({
      data: {
        code: input.code.toUpperCase().trim(),
        description: input.description,
        type: input.type,
        value: input.value,
        minQuantity: input.minQuantity ?? 1,
        minPurchaseAmount: input.minPurchaseAmount ?? null,
        maxDiscountAmount: input.maxDiscountAmount ?? null,
        startDate: input.startDate ? new Date(input.startDate) : new Date(),
        endDate: input.endDate ? new Date(input.endDate) : null,
        usageLimit: input.usageLimit ?? null,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateDiscount(id: string, input: Partial<CreateDiscountInput>) {
    return prisma.discount.update({
      where: { id },
      data: {
        ...input,
        ...(input.code && { code: input.code.toUpperCase().trim() }),
      },
    });
  }

  async deleteDiscount(id: string) {
    return prisma.discount.delete({ where: { id } });
  }

  /**
   * Validate and compute discount value based on quantity and subtotal
   */
  async validateAndApplyDiscount(code: string, quantity: number, subtotal: number) {
    const discount = await prisma.discount.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!discount) {
      throw new Error(`Discount coupon '${code}' is invalid.`);
    }

    if (!discount.isActive) {
      throw new Error(`Discount coupon '${code}' is inactive.`);
    }

    const now = new Date();
    if (discount.startDate > now) {
      throw new Error(`Discount coupon '${code}' is not yet active.`);
    }

    if (discount.endDate && discount.endDate < now) {
      throw new Error(`Discount coupon '${code}' has expired.`);
    }

    if (discount.usageLimit && discount.timesUsed >= discount.usageLimit) {
      throw new Error(`Discount coupon '${code}' has reached its usage limit.`);
    }

    if (quantity < discount.minQuantity) {
      throw new Error(
        `Discount coupon '${code}' requires a minimum quantity of ${discount.minQuantity}.`
      );
    }

    if (discount.minPurchaseAmount && subtotal < Number(discount.minPurchaseAmount)) {
      throw new Error(
        `Discount coupon '${code}' requires a minimum subtotal of $${discount.minPurchaseAmount}.`
      );
    }

    let calculatedDiscount = 0;
    const discountValue = Number(discount.value);

    if (discount.type === DiscountType.PERCENTAGE) {
      calculatedDiscount = (subtotal * discountValue) / 100;
      if (discount.maxDiscountAmount && calculatedDiscount > Number(discount.maxDiscountAmount)) {
        calculatedDiscount = Number(discount.maxDiscountAmount);
      }
    } else {
      // FIXED discount
      calculatedDiscount = Math.min(discountValue, subtotal);
    }

    return {
      discount,
      discountAmount: Math.round(calculatedDiscount * 100) / 100,
    };
  }

  /**
   * Increment timesUsed counter when an order/subscription is locked
   */
  async incrementUsage(discountId: string) {
    return prisma.discount.update({
      where: { id: discountId },
      data: { timesUsed: { increment: 1 } },
    });
  }
}

export const discountsService = new DiscountsService();
