import { Request, Response, NextFunction } from 'express';
import { plansService } from './plans.service';
import { sendSuccess } from '../../utils/response';
import { BillingFrequency, PlanStatus } from '@prisma/client';

export class PlansController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, frequency, status, availableOnly, search } = req.query;
      const plans = await plansService.getAllPlans({
        productId: productId as string,
        frequency: frequency as BillingFrequency,
        status: status as PlanStatus,
        availableOnly: availableOnly === 'true',
        search: search as string,
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
      next(error);
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

  async archive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const archived = await plansService.archivePlan(req.params.id);
      sendSuccess(res, 'Plan archived successfully', archived);
    } catch (error: any) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await plansService.deletePlan(req.params.id);
      sendSuccess(res, 'Plan deleted permanently');
    } catch (error: any) {
      next(error);
    }
  }

  async checkAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quantity = req.query.quantity ? parseInt(req.query.quantity as string, 10) : 1;
      const result = await plansService.validatePlanForSubscription(req.params.id, quantity);
      sendSuccess(res, 'Plan is active and available for subscription', result);
    } catch (error: any) {
      next(error);
    }
  }
}

export const plansController = new PlansController();
