import { Request, Response, NextFunction } from 'express';
import { plansService } from './plans.service';
import { sendSuccess, sendError } from '../../utils/response';
import { BillingFrequency } from '@prisma/client';

export class PlansController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, frequency, isActive } = req.query;
      const plans = await plansService.getAllPlans({
        productId: productId as string,
        frequency: frequency as BillingFrequency,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      sendSuccess(res, 'Plans retrieved successfully', plans);
    } catch (error: any) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await plansService.getPlanById(req.params.id);
      sendSuccess(res, 'Plan retrieved successfully', plan);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const plan = await plansService.createPlan(req.body);
      sendSuccess(res, 'Plan created successfully', plan, 201);
    } catch (error: any) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await plansService.updatePlan(req.params.id, req.body);
      sendSuccess(res, 'Plan updated successfully', updated);
    } catch (error: any) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await plansService.deletePlan(req.params.id);
      sendSuccess(res, 'Plan deleted successfully');
    } catch (error: any) {
      next(error);
    }
  }
}

export const plansController = new PlansController();
