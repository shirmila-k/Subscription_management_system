import { Request, Response, NextFunction } from 'express';
import { invoicesService } from './invoices.service';
import { sendSuccess, sendError } from '../../utils/response';
import { InvoiceStatus, UserRole } from '@prisma/client';

export class InvoicesController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId, subscriptionId, status, search } = req.query;

      let targetCustomerId = customerId as string | undefined;
      if (req.user?.role === UserRole.CUSTOMER) {
        targetCustomerId = req.user.id;
      }

      const invoices = await invoicesService.getAllInvoices({
        customerId: targetCustomerId,
        subscriptionId: subscriptionId as string,
        status: status as InvoiceStatus,
        search: search as string,
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
        sendError(res, 'Access denied: not your invoice', 403);
        return;
      }

      sendSuccess(res, 'Invoice retrieved successfully', invoice);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async generateForSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subscriptionId } = req.body;
      if (!subscriptionId) {
        sendError(res, 'Subscription ID is required', 400);
        return;
      }
      const invoice = await invoicesService.generateInvoiceForSubscription(subscriptionId);
      sendSuccess(res, 'Invoice generated successfully', invoice, 201);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }

  async downloadPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await invoicesService.getInvoiceById(req.params.id);

      if (req.user?.role === UserRole.CUSTOMER && invoice.customerId !== req.user.id) {
        sendError(res, 'Access denied: not your invoice', 403);
        return;
      }

      const { buffer, filename } = await invoicesService.getInvoicePdfBuffer(invoice.id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length.toString());
      res.status(200).end(buffer);
    } catch (error: any) {
      sendError(res, error.message, 404);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const updated = await invoicesService.updateStatus(req.params.id, status as InvoiceStatus);
      sendSuccess(res, 'Invoice status updated', updated);
    } catch (error: any) {
      sendError(res, error.message, 400);
    }
  }
}

export const invoicesController = new InvoicesController();
