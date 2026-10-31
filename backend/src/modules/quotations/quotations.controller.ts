import { Request, Response, NextFunction } from 'express';
import { quotationsService } from './quotations.service';
import {
  createQuotationSchema,
  updateQuotationSchema,
  convertQuotationSchema,
} from './quotations.validation';
import { sendSuccess, sendError } from '../../utils/response';
import { UserRole, QuotationStatus } from '@prisma/client';

export class QuotationsController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { status, customerId, search } = req.query;

      // Customer can only view their own quotations
      const effectiveCustomerId =
        user.role === UserRole.CUSTOMER ? user.id : (customerId as string | undefined);

      const quotations = await quotationsService.getAllQuotations({
        status: status as QuotationStatus | undefined,
        customerId: effectiveCustomerId,
        search: search as string | undefined,
      });

      sendSuccess(res, 'Quotations retrieved successfully', quotations);
    } catch (error: any) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const quotation = await quotationsService.getQuotationById(req.params.id);
      const user = req.user!;

      // Customer security boundary check
      if (user.role === UserRole.CUSTOMER && quotation.customerId !== user.id) {
        sendError(res, 'Access forbidden: You cannot view quotations of another customer', 403);
        return;
      }

      sendSuccess(res, 'Quotation retrieved successfully', quotation);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createQuotationSchema.parse(req.body);
      const quotation = await quotationsService.createQuotation(validated, req.user?.id);
      sendSuccess(res, 'Quotation generated successfully', quotation, 201);
    } catch (error: any) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateQuotationSchema.parse(req.body);
      const updated = await quotationsService.updateQuotation(req.params.id, validated);
      sendSuccess(res, 'Quotation updated successfully', updated);
    } catch (error: any) {
      next(error);
    }
  }

  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sent = await quotationsService.sendQuotation(req.params.id);
      sendSuccess(res, `Quotation ${sent.quotationNumber} issued and sent to customer`, sent);
    } catch (error: any) {
      next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const customerId = user.role === UserRole.CUSTOMER ? user.id : undefined;
      const accepted = await quotationsService.acceptQuotation(req.params.id, customerId);
      sendSuccess(res, `Quotation ${accepted.quotationNumber} accepted successfully`, accepted);
    } catch (error: any) {
      next(error);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reason } = req.body;
      const rejected = await quotationsService.rejectQuotation(req.params.id, reason);
      sendSuccess(res, `Quotation ${rejected.quotationNumber} rejected`, rejected);
    } catch (error: any) {
      next(error);
    }
  }

  async convertToSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = req.body ? convertQuotationSchema.parse(req.body) : undefined;
      const subscription = await quotationsService.convertQuotationToSubscription(
        req.params.id,
        validated,
        req.user?.id
      );
      sendSuccess(
        res,
        `Quotation successfully converted to confirmed subscription ${subscription?.subscriptionNumber}`,
        subscription,
        201
      );
    } catch (error: any) {
      next(error);
    }
  }
}

export const quotationsController = new QuotationsController();
