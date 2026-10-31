import prisma from '../../config/db';
import { DiscountType, Prisma } from '@prisma/client';
import { CreateDiscountInput, UpdateDiscountInput } from './discounts.validation';

export class DiscountsService {
  async getAllDiscounts(params?: { isActive?: boolean }) {
    const where: Prisma.DiscountWhereInput = {};
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

  async getDiscountByCode(code: string) {
    return prisma.discount.findUnique({
      where: { code: code.toUpperCase().trim() },
    });
  }

  async createDiscount(input: CreateDiscountInput) {
    const code = input.code.toUpperCase().trim();
    const existing = await prisma.discount.findUnique({ where: { code } });
    if (existing) {
      throw new Error(`Discount with code '${code}' already exists`);
    }

    return prisma.discount.create({
      data: {
        name: input.name || code,
        code,
        description: input.description,
        type: input.type,
        value: new Prisma.Decimal(input.value),
        minQuantity: input.minQuantity ?? 1,
        minPurchaseAmount: input.minPurchaseAmount ? new Prisma.Decimal(input.minPurchaseAmount) : null,
        maxDiscountAmount: input.maxDiscountAmount ? new Prisma.Decimal(input.maxDiscountAmount) : null,
        startDate: input.startDate ? new Date(input.startDate) : new Date(),
        endDate: input.endDate ? new Date(input.endDate) : null,
        usageLimit: input.usageLimit ?? null,
        isActive: input.isActive ?? true,
      },
    });
  }

  async updateDiscount(id: string, input: UpdateDiscountInput) {
    const existing = await prisma.discount.findUnique({ where: { id } });
    if (!existing) throw new Error('Discount rule not found');

    if (input.code) {
      const code = input.code.toUpperCase().trim();
      if (code !== existing.code) {
        const duplicate = await prisma.discount.findUnique({ where: { code } });
        if (duplicate) throw new Error(`Discount with code '${code}' already exists`);
      }
    }

    const updateData: Prisma.DiscountUpdateInput = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.code !== undefined) updateData.code = input.code.toUpperCase().trim();
    if (input.description !== undefined) updateData.description = input.description;
    if (input.type !== undefined) updateData.type = input.type;
    if (input.value !== undefined) updateData.value = new Prisma.Decimal(input.value);
    if (input.minQuantity !== undefined) updateData.minQuantity = input.minQuantity;
    if (input.minPurchaseAmount !== undefined) {
      updateData.minPurchaseAmount = input.minPurchaseAmount !== null ? new Prisma.Decimal(input.minPurchaseAmount) : null;
    }
    if (input.maxDiscountAmount !== undefined) {
      updateData.maxDiscountAmount = input.maxDiscountAmount !== null ? new Prisma.Decimal(input.maxDiscountAmount) : null;
    }
    if (input.startDate !== undefined) updateData.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) updateData.endDate = input.endDate ? new Date(input.endDate) : null;
    if (input.usageLimit !== undefined) updateData.usageLimit = input.usageLimit;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    return prisma.discount.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteDiscount(id: string) {
    const existing = await prisma.discount.findUnique({
      where: { id },
      include: { subscriptions: { select: { id: true } } },
    });
    if (!existing) throw new Error('Discount rule not found');

    if (existing.subscriptions.length > 0) {
      // Soft-archive instead of hard-delete to protect historical records
      return prisma.discount.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.discount.delete({ where: { id } });
  }

  /**
   * Validate and compute discount value based on quantity and subtotal.
   * Supports identifier as either coupon code or discount ID.
   */
  async validateAndApplyDiscount(identifier: string, quantity: number, subtotal: number) {
    if (!identifier || !identifier.trim()) {
      throw new Error('Discount code or ID is required');
    }

    const trimmed = identifier.trim();
    const discount = await prisma.discount.findFirst({
      where: {
        OR: [
          { code: trimmed.toUpperCase() },
          { id: trimmed },
        ],
      },
    });

    if (!discount) {
      throw new Error(`Discount coupon '${identifier}' is invalid.`);
    }

    if (!discount.isActive) {
      throw new Error(`Discount coupon '${discount.code}' is inactive.`);
    }

    const now = new Date();
    if (discount.startDate > now) {
      throw new Error(`Discount coupon '${discount.code}' is not yet active.`);
    }

    if (discount.endDate && discount.endDate < now) {
      throw new Error(`Discount coupon '${discount.code}' has expired.`);
    }

    if (discount.usageLimit !== null && discount.timesUsed >= discount.usageLimit) {
      throw new Error(`Discount coupon '${discount.code}' has reached its usage limit.`);
    }

    const safeQty = Number(quantity) || 1;
    if (safeQty < discount.minQuantity) {
      throw new Error(
        `Discount coupon '${discount.code}' requires a minimum quantity of ${discount.minQuantity}.`
      );
    }

    const safeSubtotal = Math.max(0, Number(subtotal) || 0);
    if (discount.minPurchaseAmount && safeSubtotal < Number(discount.minPurchaseAmount)) {
      throw new Error(
        `Discount coupon '${discount.code}' requires a minimum subtotal of $${discount.minPurchaseAmount}.`
      );
    }

    if (safeSubtotal <= 0) {
      return {
        discount,
        discountAmount: 0,
      };
    }

    let calculatedDiscount = 0;
    const discountValue = Number(discount.value);

    if (discount.type === DiscountType.PERCENTAGE) {
      calculatedDiscount = (safeSubtotal * discountValue) / 100;
      if (discount.maxDiscountAmount && calculatedDiscount > Number(discount.maxDiscountAmount)) {
        calculatedDiscount = Number(discount.maxDiscountAmount);
      }
    } else {
      // FIXED discount - cannot exceed subtotal
      calculatedDiscount = Math.min(discountValue, safeSubtotal);
    }

    // Ensure non-negative and never exceeds subtotal
    calculatedDiscount = Math.max(0, Math.min(calculatedDiscount, safeSubtotal));

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

