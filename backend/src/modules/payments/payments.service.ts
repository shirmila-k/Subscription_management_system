import crypto from 'crypto';
import prisma from '../../config/prisma';
import { env } from '../../config/env';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import { InvoicesService } from '../invoices/invoices.service';

export class PaymentsService {
  public static async generatePaymentNumber(): Promise<string> {
    const count = await prisma.payment.count();
    const year = new Date().getFullYear();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `PAY-${year}-${sequence}`;
  }

  public static async recordPayment(data: {
    invoiceId: string;
    customerId: string;
    amount: number;
    method: PaymentMethod;
    transactionReference?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
    notes?: string;
  }) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found.');
    }

    if (invoice.status === 'PAID') {
      throw new BadRequestError('Invoice has already been fully paid.');
    }

    const paymentNumber = await this.generatePaymentNumber();

    const payment = await prisma.payment.create({
      data: {
        paymentNumber,
        invoiceId: data.invoiceId,
        customerId: data.customerId,
        amount: data.amount,
        currency: invoice.currency,
        method: data.method,
        status: PaymentStatus.SUCCESS,
        transactionReference: data.transactionReference,
        razorpayOrderId: data.razorpayOrderId,
        razorpaySignature: data.razorpaySignature,
        notes: data.notes,
      },
    });

    // Reconcile total payments against invoice total
    const totalPaid = invoice.payments
      .filter((p) => p.status === PaymentStatus.SUCCESS)
      .reduce((sum, p) => sum + Number(p.amount), Number(data.amount));

    if (totalPaid >= Number(invoice.totalAmount)) {
      await InvoicesService.markAsPaid(invoice.id);
    }

    return payment;
  }

  /**
   * Razorpay payment signature verification
   */
  public static verifyRazorpaySignature(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    signature: string
  ): boolean {
    if (!env.RAZORPAY_KEY_SECRET) {
      // In dev or sandbox when secret is not configured, accept validation
      return true;
    }

    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    return expectedSignature === signature;
  }

  public static async getAll(filter?: {
    invoiceId?: string;
    customerId?: string;
    status?: PaymentStatus;
  }) {
    const where: any = {};

    if (filter?.invoiceId) {
      where.invoiceId = filter.invoiceId;
    }

    if (filter?.customerId) {
      where.customerId = filter.customerId;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    return prisma.payment.findMany({
      where,
      include: {
        invoice: { select: { id: true, invoiceNumber: true, totalAmount: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  public static async getById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        invoice: true,
        customer: true,
      },
    });

    if (!payment) {
      throw new NotFoundError(`Payment with ID ${id} not found.`);
    }

    return payment;
  }
}
