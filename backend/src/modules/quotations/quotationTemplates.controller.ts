import { Request, Response, NextFunction } from 'express';
import { QuotationTemplatesService } from './quotationTemplates.service';
import { sendSuccess } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

export class QuotationTemplatesController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.query;
      const templates = await QuotationTemplatesService.getAll({
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      return sendSuccess(res, templates);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await QuotationTemplatesService.getById(req.params.id);
      return sendSuccess(res, template);
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, planId, validityDays, defaultPaymentTerms, defaultNotes, lines } = req.body;
      if (!name || !planId) {
        throw new BadRequestError('Template name and target planId are required.');
      }

      const template = await QuotationTemplatesService.create({
        name,
        description,
        planId,
        validityDays: validityDays ? Number(validityDays) : 15,
        defaultPaymentTerms,
        defaultNotes,
        lines,
      });

      return sendSuccess(res, template, 'Quotation template created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await QuotationTemplatesService.update(req.params.id, req.body);
      return sendSuccess(res, template, 'Quotation template updated successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await QuotationTemplatesService.delete(req.params.id);
      return sendSuccess(res, null, 'Quotation template deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
