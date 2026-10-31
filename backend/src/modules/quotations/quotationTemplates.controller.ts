import { Request, Response, NextFunction } from 'express';
import { quotationTemplatesService } from './quotationTemplates.service';
import {
  createQuotationTemplateSchema,
  updateQuotationTemplateSchema,
} from './quotationTemplates.validation';
import { sendSuccess, sendError } from '../../utils/response';

export class QuotationTemplatesController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive } = req.query;
      const templates = await quotationTemplatesService.getAllTemplates({
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
      });
      sendSuccess(res, 'Quotation templates retrieved successfully', templates);
    } catch (error: any) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const template = await quotationTemplatesService.getTemplateById(req.params.id);
      sendSuccess(res, 'Quotation template retrieved successfully', template);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createQuotationTemplateSchema.parse(req.body);
      const template = await quotationTemplatesService.createTemplate(validated);
      sendSuccess(res, 'Quotation template created successfully', template, 201);
    } catch (error: any) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = updateQuotationTemplateSchema.parse(req.body);
      const updated = await quotationTemplatesService.updateTemplate(req.params.id, validated);
      sendSuccess(res, 'Quotation template updated successfully', updated);
    } catch (error: any) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await quotationTemplatesService.deleteTemplate(req.params.id);
      sendSuccess(res, 'Quotation template deleted or deactivated successfully');
    } catch (error: any) {
      next(error);
    }
  }
}

export const quotationTemplatesController = new QuotationTemplatesController();
