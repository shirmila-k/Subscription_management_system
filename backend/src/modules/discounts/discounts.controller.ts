import { Request, Response, NextFunction } from 'express';
import { DiscountsService } from './discounts.service';
import { sendSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

export class DiscountsController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.query;
      const discounts = await DiscountsService.getAll({
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      return sendSuccess(res, discounts);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const discount = await DiscountsService.getById(req.params.id);
      return sendSuccess(res, discount);
    } catch (error) {
      next(error);
    }
  }

  public static async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, quantity, amount, productId } = req.body;
      if (!code) {
        throw new BadRequestError('Coupon code is required.');
      }
      const result = await DiscountsService.validateCode(
        code,
        Number(quantity) || 1,
        Number(amount) || 0,
        productId as string
      );
      return sendSuccess(res, result, 'Coupon applied successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, type, value, minQuantity, minPurchaseAmount, startDate, endDate, maxUses, productId } = req.body;
      if (!code || !type || value === undefined || !startDate || !endDate) {
        throw new BadRequestError('code, type, value, startDate, and endDate are required.');
      }
      const discount = await DiscountsService.create({
        code,
        type,
        value: Number(value),
        minQuantity: minQuantity ? Number(minQuantity) : 1,
        minPurchaseAmount: minPurchaseAmount ? Number(minPurchaseAmount) : 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxUses: maxUses ? Number(maxUses) : undefined,
        productId: productId || undefined,
      });
      return sendSuccess(res, discount, 'Discount created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const discount = await DiscountsService.update(req.params.id, req.body);
      return sendSuccess(res, discount, 'Discount updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await DiscountsService.delete(req.params.id);
      return sendSuccess(res, null, 'Discount deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
