import prisma from '../../config/db';
import { PaymentMethod, PaymentStatus, InvoiceStatus, UserRole } from '@prisma/client';
import { notificationsService } from '../notifications/notifications.service';

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
    const rand = Math.floor(1000 + Math.random() * 9000);
    const sequence = (count + 1).toString().padStart(4, '0');
    return `PAY-${year}-${sequence}-${rand}`;
  }

  /**
   * Record a payment against an invoice and reconcile balances atomically
   */
  async recordPayment(
    input: RecordPaymentInput,
    performedByUserId?: string,
    userRole?: UserRole
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: input.invoiceId },
      include: { customer: true },
    });

    if (!invoice) throw new Error('Target invoice not found');

    // Access control: If a customer is recording payment, ensure it belongs to them
    if (userRole === UserRole.CUSTOMER && invoice.customerId !== performedByUserId) {
      throw new Error('Unauthorized: You can only record payments for your own invoices');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('This invoice is already fully paid');
    }

    if (invoice.status === InvoiceStatus.VOID) {
      throw new Error('Cannot apply payment to a void invoice');
    }

    const payAmount = Math.round(Number(input.amount) * 100) / 100;
    if (payAmount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const currentBalance = Number(invoice.balanceDue);
    if (payAmount > currentBalance + 0.01) {
      throw new Error(
        `Payment amount (₹${payAmount.toFixed(2)}) exceeds remaining balance (₹${currentBalance.toFixed(2)})`
      );
    }

    // DUPLICATE PAYMENT PREVENTION:
    // If a transaction reference is provided, ensure it was not already processed
    if (input.transactionReference && input.transactionReference.trim().length > 0) {
      const existingPayment = await prisma.payment.findUnique({
        where: { transactionReference: input.transactionReference.trim() },
      });
      if (existingPayment) {
        throw new Error(
          `Duplicate payment prevented: A payment with reference '${input.transactionReference}' already exists (ID: ${existingPayment.paymentNumber})`
        );
      }
    }

    const paymentNumber = await this.generatePaymentNumber();

    // Use transaction to ensure payment record creation and invoice balance update are atomic
    const resultPayment = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: payAmount,
          currency: input.currency || 'INR',
          paymentMethod: input.paymentMethod,
          status: PaymentStatus.SUCCESS,
          paymentDate: new Date(),
          transactionReference: input.transactionReference?.trim() || null,
          notes: input.notes,
          gatewayResponse: input.gatewayResponse || undefined,
        },
      });

      const updatedAmountPaid = Math.round((Number(invoice.amountPaid) + payAmount) * 100) / 100;
      const updatedBalanceDue = Math.max(0, Math.round((currentBalance - payAmount) * 100) / 100);
      const isFullyPaid = updatedBalanceDue <= 0.001;

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: updatedAmountPaid,
          balanceDue: updatedBalanceDue,
          status: isFullyPaid ? InvoiceStatus.PAID : invoice.status,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: performedByUserId || null,
          action: 'PAYMENT_RECORDED',
          entity: 'PAYMENT',
          entityId: payment.id,
          metadata: {
            paymentNumber,
            invoiceNumber: invoice.invoiceNumber,
            amount: payAmount,
            remainingBalance: updatedBalanceDue,
            isFullyPaid,
          },
        },
      });

      return payment;
    });

    try {
      if (resultPayment.status === PaymentStatus.SUCCESS) {
        await notificationsService.queuePaymentSuccess(resultPayment, invoice);
      } else if (resultPayment.status === PaymentStatus.FAILED) {
        await notificationsService.queuePaymentFailed(resultPayment, invoice, input.notes);
      }
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue payment notification: ${err.message}`);
    }

    return resultPayment;
  }

  /**
   * Refund a previously successful payment
   */
  async refundPayment(paymentId: string, reason?: string, performedByUserId?: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        customer: true,
        invoice: {
          include: { customer: true },
        },
      },
    });

    if (!payment) throw new Error('Payment record not found');

    if (payment.status === PaymentStatus.REFUNDED) {
      throw new Error('This payment has already been refunded');
    }

    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new Error(`Cannot refund payment in '${payment.status}' status`);
    }

    const refundAmount = Number(payment.amount);
    const invoice = payment.invoice;

    const refundResult = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          notes: reason
            ? `${payment.notes || ''}\n[Refund Reason]: ${reason}`
            : `${payment.notes || ''}\n[Refunded on ${new Date().toISOString()}]`,
        },
      });

      // Restore invoice balance
      const newAmountPaid = Math.max(0, Math.round((Number(invoice.amountPaid) - refundAmount) * 100) / 100);
      const newBalanceDue = Math.round((Number(invoice.balanceDue) + refundAmount) * 100) / 100;

      // If the invoice was marked PAID, restore it to CONFIRMED (or OVERDUE if past due)
      let restoredStatus = invoice.status;
      if (invoice.status === InvoiceStatus.PAID) {
        const isPastDue = invoice.dueDate < new Date();
        restoredStatus = isPastDue ? InvoiceStatus.OVERDUE : InvoiceStatus.CONFIRMED;
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: restoredStatus,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: performedByUserId || null,
          action: 'PAYMENT_REFUNDED',
          entity: 'PAYMENT',
          entityId: payment.id,
          metadata: {
            paymentNumber: payment.paymentNumber,
            invoiceNumber: invoice.invoiceNumber,
            refundAmount,
            restoredBalanceDue: newBalanceDue,
            reason,
          },
        },
      });

      return updatedPayment;
    });

    try {
      await notificationsService.queuePaymentRefunded(refundResult, payment.invoice, reason);
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue refund notification: ${err.message}`);
    }

    return refundResult;
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
          select: { id: true, firstName: true, lastName: true, email: true, companyName: true },
        },
        invoice: {
          select: { invoiceNumber: true, totalAmount: true, amountPaid: true, balanceDue: true, status: true },
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
