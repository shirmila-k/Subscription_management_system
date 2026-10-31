import { Request, Response, NextFunction } from 'express';
import { PlansService } from './plans.service';
import { sendSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';
import { BillingFrequency } from '@prisma/client';

export class PlansController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId, billingFrequency, isActive } = req.query;
      const plans = await PlansService.getAll({
        productId: productId as string,
        billingFrequency: billingFrequency as BillingFrequency,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      return sendSuccess(res, plans);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await PlansService.getById(req.params.id);
      return sendSuccess(res, plan);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        productId,
        variantId,
        name,
        description,
        billingFrequency,
        cost,
        currency,
        minimumQuantity,
        validFrom,
        validUntil,
        autoClose,
        autoRenew,
        pauseAllowed,
        trialPeriodDays,
        gracePeriodDays,
      } = req.body;

      if (!productId || !name || !billingFrequency || cost === undefined) {
        throw new BadRequestError('productId, name, billingFrequency, and cost are required fields.');
      }

      const plan = await PlansService.create({
        productId,
        variantId,
        name,
        description,
        billingFrequency,
        cost: Number(cost),
        currency,
        minimumQuantity: minimumQuantity ? Number(minimumQuantity) : 1,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        autoClose,
        autoRenew,
        pauseAllowed,
        trialPeriodDays: trialPeriodDays ? Number(trialPeriodDays) : 0,
        gracePeriodDays: gracePeriodDays ? Number(gracePeriodDays) : 7,
      });

      return sendSuccess(res, plan, 'Plan created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const plan = await PlansService.update(req.params.id, req.body);
      return sendSuccess(res, plan, 'Plan updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await PlansService.delete(req.params.id);
      return sendSuccess(res, null, 'Plan deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
