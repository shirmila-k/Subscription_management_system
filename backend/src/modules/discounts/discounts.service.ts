import prisma from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { DiscountType } from '@prisma/client';

export class DiscountsService {
  public static async getAll(filter?: { isActive?: boolean }) {
    const where: any = {};
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    return prisma.discount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getById(id: string) {
    const discount = await prisma.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundError(`Discount rule with ID ${id} not found.`);
    }

    return discount;
  }

  public static async validateCode(code: string, quantity = 1, amount = 0) {
    const discount = await prisma.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      throw new NotFoundError('Invalid discount promo code.');
    }

    if (!discount.isActive) {
      throw new BadRequestError('This discount coupon is inactive.');
    }

    const now = new Date();
    if (now < discount.startDate || now > discount.endDate) {
      throw new BadRequestError('This discount coupon is not valid at this time.');
    }

    if (discount.maxUses && discount.usedCount >= discount.maxUses) {
      throw new BadRequestError('This discount coupon usage limit has been reached.');
    }

    if (quantity < discount.minQuantity) {
      throw new BadRequestError(
        `This discount requires a minimum subscription quantity of ${discount.minQuantity}.`
      );
    }

    if (amount < Number(discount.minPurchaseAmount)) {
      throw new BadRequestError(
        `This discount requires a minimum order amount of ${discount.minPurchaseAmount}.`
      );
    }

    let calculatedDiscount = 0;
    if (discount.type === DiscountType.PERCENTAGE) {
      calculatedDiscount = (amount * Number(discount.value)) / 100;
    } else {
      calculatedDiscount = Number(discount.value);
    }

    return {
      valid: true,
      discount,
      calculatedDiscount: Math.min(calculatedDiscount, amount),
    };
  }

  public static async create(data: {
    code: string;
    type: DiscountType;
    value: number;
    minQuantity?: number;
    minPurchaseAmount?: number;
    startDate: Date;
    endDate: Date;
    maxUses?: number;
  }) {
    const existing = await prisma.discount.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestError('A discount rule with this code already exists.');
    }

    return prisma.discount.create({
      data: {
        code: data.code.toUpperCase(),
        type: data.type,
        value: data.value,
        minQuantity: data.minQuantity ?? 1,
        minPurchaseAmount: data.minPurchaseAmount ?? 0,
        startDate: data.startDate,
        endDate: data.endDate,
        maxUses: data.maxUses,
      },
    });
  }

  public static async update(
    id: string,
    data: {
      type?: DiscountType;
      value?: number;
      minQuantity?: number;
      minPurchaseAmount?: number;
      startDate?: Date;
      endDate?: Date;
      maxUses?: number;
      isActive?: boolean;
    }
  ) {
    await this.getById(id);

    return prisma.discount.update({
      where: { id },
      data,
    });
  }

  public static async delete(id: string) {
    await this.getById(id);

    return prisma.discount.delete({
      where: { id },
    });
  }
}
