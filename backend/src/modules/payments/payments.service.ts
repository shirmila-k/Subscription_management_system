import prisma from '../../config/db';
import { PaymentMethod, PaymentStatus, InvoiceStatus } from '@prisma/client';

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  notes?: string;
  gatewayResponse?: any;
}

export class PaymentsService {
  private async generatePaymentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.payment.count();
    const sequence = (count + 1).toString().padStart(5, '0');
    return `PAY-${year}-${sequence}`;
  }

  /**
   * Record a payment against an invoice and reconcile balances
   */
  async recordPayment(input: RecordPaymentInput, customerId?: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
    });

    if (!invoice) throw new Error('Target invoice not found');

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('This invoice is already fully paid');
    }

    if (invoice.status === InvoiceStatus.VOID) {
      throw new Error('Cannot apply payment to a void invoice');
    }

    const payAmount = Number(input.amount);
    if (payAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const currentBalance = Number(invoice.balanceDue);
    if (payAmount > currentBalance + 0.01) {
      throw new Error(
        `Payment amount ($${payAmount.toFixed(2)}) exceeds remaining balance ($${currentBalance.toFixed(2)})`
      );
    }

    const paymentNumber = await this.generatePaymentNumber();

    // Use transaction to ensure payment record and invoice update are atomic
    return prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          customerId: customerId || invoice.customerId,
          amount: payAmount,
          currency: input.currency || 'USD',
          paymentMethod: input.paymentMethod,
          status: PaymentStatus.SUCCESS,
          paymentDate: new Date(),
          transactionReference: input.transactionReference,
          notes: input.notes,
          gatewayResponse: input.gatewayResponse || undefined,
        },
      });

      const updatedAmountPaid = Number(invoice.amountPaid) + payAmount;
      const updatedBalanceDue = Math.max(0, currentBalance - payAmount);
      const isFullyPaid = updatedBalanceDue <= 0;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: updatedAmountPaid,
          balanceDue: updatedBalanceDue,
          status: isFullyPaid ? InvoiceStatus.PAID : invoice.status,
        },
      });

      return payment;
    });
  }

  /**
   * Handle Razorpay webhook or simulated signature matching
   */
  async processRazorpayPayment(payload: {
    razorpay_payment_id: string;
    razorpay_order_id?: string;
    invoiceId: string;
    amount: number;
    notes?: string;
  }, customerId: string) {
    return this.recordPayment(
      {
        invoiceId: payload.invoiceId,
        amount: payload.amount,
        paymentMethod: PaymentMethod.RAZORPAY,
        transactionReference: payload.razorpay_payment_id,
        notes: payload.notes || `Razorpay transaction ${payload.razorpay_payment_id}`,
        gatewayResponse: payload,
      },
      customerId
    );
  }

  /**
   * Fetch all payments
   */
  async getAllPayments(params?: { customerId?: string; invoiceId?: string }) {
    const where: any = {};
    if (params?.customerId) where.customerId = params.customerId;
    if (params?.invoiceId) where.invoiceId = params.invoiceId;

    return prisma.payment.findMany({
      where,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        invoice: {
          select: { invoiceNumber: true, totalAmount: true, status: true },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  /**
   * Fetch payment by ID
   */
  async getPaymentById(id: string) {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        customer: true,
        invoice: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!payment) throw new Error('Payment record not found');
    return payment;
  }
}

export const paymentsService = new PaymentsService();
