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
   * Record a payment against an invoice and reconcile balances atomically with row-level locking
   */
  async recordPayment(
    input: RecordPaymentInput,
    performedByUserId?: string,
    userRole?: UserRole
  ) {
    const payAmount = Math.round(Number(input.amount) * 100) / 100;
    if (payAmount <= 0 || isNaN(payAmount)) {
      throw new Error('Payment amount must be greater than zero');
    }

    const paymentNumber = await this.generatePaymentNumber();

    // Use transaction with SELECT ... FOR UPDATE to prevent race conditions during concurrent payments
    const result = await prisma.$transaction(async (tx) => {
      // 1. Acquire exclusive lock on target invoice row in MySQL InnoDB
      const lockedInvoices: any = await tx.$queryRaw`
        SELECT id, invoiceNumber, customerId, status, totalAmount, amountPaid, balanceDue
        FROM invoices
        WHERE id = ${input.invoiceId}
        FOR UPDATE
      `;

      if (!lockedInvoices || lockedInvoices.length === 0) {
        throw new Error('Target invoice not found');
      }

      const lockedInvoice = lockedInvoices[0];

      // Access control: If a customer is recording payment, ensure it belongs to them
      if (userRole === UserRole.CUSTOMER && lockedInvoice.customerId !== performedByUserId) {
        throw new Error('Unauthorized: You can only record payments for your own invoices');
      }

      if (lockedInvoice.status === InvoiceStatus.PAID) {
        throw new Error('This invoice is already fully paid');
      }

      if (lockedInvoice.status === InvoiceStatus.VOID) {
        throw new Error('Cannot apply payment to a void invoice');
      }

      const currentBalance = Number(lockedInvoice.balanceDue);
      if (payAmount > currentBalance + 0.01) {
        throw new Error(
          `Payment amount (₹${payAmount.toFixed(2)}) exceeds remaining balance (₹${currentBalance.toFixed(2)})`
        );
      }

      // 2. Check duplicate transaction reference inside the transaction
      if (input.transactionReference && input.transactionReference.trim().length > 0) {
        const existingPayment = await tx.payment.findUnique({
          where: { transactionReference: input.transactionReference.trim() },
        });
        if (existingPayment) {
          throw new Error(
            `Duplicate payment prevented: A payment with reference '${input.transactionReference}' already exists (ID: ${existingPayment.paymentNumber})`
          );
        }
      }

      // 3. Create payment record atomically
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: lockedInvoice.id,
          customerId: lockedInvoice.customerId,
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

      // 4. Recalculate amountPaid and balanceDue from verified locked state
      const updatedAmountPaid = Math.round((Number(lockedInvoice.amountPaid) + payAmount) * 100) / 100;
      const updatedBalanceDue = Math.max(0, Math.round((currentBalance - payAmount) * 100) / 100);
      const isFullyPaid = updatedBalanceDue <= 0.001;

      await tx.invoice.update({
        where: { id: lockedInvoice.id },
        data: {
          amountPaid: updatedAmountPaid,
          balanceDue: updatedBalanceDue,
          status: isFullyPaid ? InvoiceStatus.PAID : lockedInvoice.status,
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
            invoiceNumber: lockedInvoice.invoiceNumber,
            amount: payAmount,
            remainingBalance: updatedBalanceDue,
            isFullyPaid,
          },
        },
      });

      return { payment, invoiceId: lockedInvoice.id };
    });

    // 5. Post-transaction notification dispatch (only after commit succeeds)
    try {
      if (result.payment.status === PaymentStatus.SUCCESS) {
        const invoiceForEmail = await prisma.invoice.findUnique({
          where: { id: result.invoiceId },
          include: { customer: true },
        });
        if (invoiceForEmail) {
          await notificationsService.queuePaymentSuccess(result.payment, invoiceForEmail);
        }
      }
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue payment notification: ${err.message}`);
    }

    return result.payment;
  }

  /**
   * Refund a previously successful payment with pessimistic row-level locking
   */
  async refundPayment(paymentId: string, reason?: string, performedByUserId?: string) {
    const refundResult = await prisma.$transaction(async (tx) => {
      // 1. Lock payment row
      const lockedPayments: any = await tx.$queryRaw`
        SELECT id, paymentNumber, invoiceId, customerId, amount, status, notes
        FROM payments
        WHERE id = ${paymentId}
        FOR UPDATE
      `;

      if (!lockedPayments || lockedPayments.length === 0) {
        throw new Error('Payment record not found');
      }

      const lockedPayment = lockedPayments[0];

      if (lockedPayment.status === PaymentStatus.REFUNDED) {
        throw new Error('This payment has already been refunded');
      }

      if (lockedPayment.status !== PaymentStatus.SUCCESS) {
        throw new Error(`Cannot refund payment in '${lockedPayment.status}' status`);
      }

      // 2. Lock invoice row
      const lockedInvoices: any = await tx.$queryRaw`
        SELECT id, invoiceNumber, status, dueDate, amountPaid, balanceDue
        FROM invoices
        WHERE id = ${lockedPayment.invoiceId}
        FOR UPDATE
      `;

      if (!lockedInvoices || lockedInvoices.length === 0) {
        throw new Error('Associated invoice record not found');
      }

      const lockedInvoice = lockedInvoices[0];
      const refundAmount = Number(lockedPayment.amount);

      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REFUNDED,
          notes: reason
            ? `${lockedPayment.notes || ''}\n[Refund Reason]: ${reason}`
            : `${lockedPayment.notes || ''}\n[Refunded on ${new Date().toISOString()}]`,
        },
      });

      // Restore invoice balance
      const newAmountPaid = Math.max(0, Math.round((Number(lockedInvoice.amountPaid) - refundAmount) * 100) / 100);
      const newBalanceDue = Math.round((Number(lockedInvoice.balanceDue) + refundAmount) * 100) / 100;

      // If the invoice was marked PAID, restore it to CONFIRMED (or OVERDUE if past due)
      let restoredStatus = lockedInvoice.status;
      if (lockedInvoice.status === InvoiceStatus.PAID) {
        const isPastDue = new Date(lockedInvoice.dueDate) < new Date();
        restoredStatus = isPastDue ? InvoiceStatus.OVERDUE : InvoiceStatus.CONFIRMED;
      }

      await tx.invoice.update({
        where: { id: lockedInvoice.id },
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
          entityId: lockedPayment.id,
          metadata: {
            paymentNumber: lockedPayment.paymentNumber,
            invoiceNumber: lockedInvoice.invoiceNumber,
            refundAmount,
            restoredBalanceDue: newBalanceDue,
            reason,
          },
        },
      });

      return { updatedPayment, invoiceId: lockedInvoice.id };
    });

    try {
      const invoiceForEmail = await prisma.invoice.findUnique({
        where: { id: refundResult.invoiceId },
        include: { customer: true },
      });
      if (invoiceForEmail) {
        await notificationsService.queuePaymentRefunded(refundResult.updatedPayment, invoiceForEmail, reason);
      }
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue refund notification: ${err.message}`);
    }

    return refundResult.updatedPayment;
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
