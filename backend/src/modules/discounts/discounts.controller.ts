import { Request, Response, NextFunction } from 'express';
import { discountsService } from './discounts.service';
import { sendSuccess, sendError } from '../../utils/response';

export class DiscountsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive } = req.query;
      const discounts = await discountsService.getAllDiscounts({
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      sendSuccess(res, 'Discounts retrieved successfully', discounts);
    } catch (error: any) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const discount = await discountsService.getDiscountById(req.params.id);
      sendSuccess(res, 'Discount retrieved successfully', discount);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const discount = await discountsService.createDiscount(req.body);
      sendSuccess(res, 'Discount rule created successfully', discount, 201);
    } catch (error: any) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await discountsService.updateDiscount(req.params.id, req.body);
      sendSuccess(res, 'Discount updated successfully', updated);
    } catch (error: any) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await discountsService.deleteDiscount(req.params.id);
      sendSuccess(res, 'Discount deleted successfully');
    } catch (error: any) {
      next(error);
    }
  }

  async validateCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { code, quantity, subtotal } = req.body;
      const result = await discountsService.validateAndApplyDiscount(
        code,
        Number(quantity || 1),
        Number(subtotal || 0)
      );
      sendSuccess(res, 'Discount validated successfully', result);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}

export const discountsController = new DiscountsController();
