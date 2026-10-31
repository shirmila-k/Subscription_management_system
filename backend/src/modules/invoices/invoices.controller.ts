import { Request, Response, NextFunction } from 'express';
import { InvoicesService } from './invoices.service';
import { sendSuccess } from '../../utils/response';
import { InvoiceStatus } from '@prisma/client';

export class InvoicesController {
  public static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { customerId, status, subscriptionId } = req.query;

      // If user is a customer, only fetch their invoices
      const effectiveCustomerId =
        req.user?.role === 'CUSTOMER' ? req.user.userId : (customerId as string);

      const invoices = await InvoicesService.getAll({
        customerId: effectiveCustomerId,
        status: status as InvoiceStatus,
        subscriptionId: subscriptionId as string,
      });

      return sendSuccess(res, invoices);
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await InvoicesService.getById(req.params.id);
      return sendSuccess(res, invoice);
    } catch (error) {
      next(error);
    }
  }

  public static async confirm(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await InvoicesService.confirmInvoice(req.params.id);
      return sendSuccess(res, invoice, 'Invoice confirmed');
    } catch (error) {
      next(error);
    }
  }

  public static async downloadPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const pdfBuffer = await InvoicesService.getPdfBuffer(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename=invoice-${req.params.id}.pdf`);
      return res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}
