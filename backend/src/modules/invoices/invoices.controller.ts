import { Request, Response, NextFunction } from 'express';
import { invoicesService } from './invoices.service';
import { sendSuccess, sendError } from '../../utils/response';
import { InvoiceStatus, UserRole } from '@prisma/client';
import { generateInvoiceSchema, updateInvoiceStatusSchema, queryInvoicesSchema } from './invoices.validation';

export class InvoicesController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsedQuery = queryInvoicesSchema.safeParse(req.query);
      const queryParams = parsedQuery.success ? parsedQuery.data : req.query;

      let targetCustomerId = queryParams.customerId as string | undefined;
      if (req.user?.role === UserRole.CUSTOMER) {
        targetCustomerId = req.user.id;
      }

      const invoices = await invoicesService.getAllInvoices({
        customerId: targetCustomerId,
        subscriptionId: queryParams.subscriptionId as string,
        status: queryParams.status as InvoiceStatus,
        search: queryParams.search as string,
      });

      sendSuccess(res, 'Invoices retrieved successfully', invoices);
    } catch (error: any) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await invoicesService.getInvoiceById(req.params.id);

      if (req.user?.role === UserRole.CUSTOMER && invoice.customerId !== req.user.id) {
        sendError(res, 'Access denied: You can only access your own invoices', 403);
        return;
      }

      sendSuccess(res, 'Invoice retrieved successfully', invoice);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async generateForSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = generateInvoiceSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0]?.message || 'Invalid input', 400);
        return;
      }

      const invoice = await invoicesService.generateInvoiceForSubscription(parsed.data.subscriptionId);
      sendSuccess(res, 'Invoice generated successfully', invoice, 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await invoicesService.getInvoiceById(req.params.id);

      if (req.user?.role === UserRole.CUSTOMER && invoice.customerId !== req.user.id) {
        sendError(res, 'Access denied: You can only download your own invoices', 403);
        return;
      }

      const { buffer, filename } = await invoicesService.getInvoicePdfBuffer(req.params.id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateInvoiceStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        sendError(res, parsed.error.errors[0]?.message || 'Invalid input', 400);
        return;
      }

      const updated = await invoicesService.updateStatus(req.params.id, parsed.data.status, parsed.data.notes);
      sendSuccess(res, 'Invoice status updated successfully', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}

export const invoicesController = new InvoicesController();
