import prisma from '../../config/db';
import { InvoiceStatus, PaymentTerms, SubscriptionStatus } from '@prisma/client';
import { pdfService } from './pdf.service';
import { calculateNextBillingPeriod, calculateMonetaryBreakdown } from '../subscriptions/billing.calculator';
import { notificationsService } from '../notifications/notifications.service';

export class InvoicesService {
  /**
   * Helper to generate unique invoice numbers: INV-YYYY-XXXXX
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const sequence = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${sequence}-${rand}`;
  }

  /**
   * Helper to calculate invoice due date based on payment terms
   */
  computeDueDate(issueDate: Date, terms: PaymentTerms): Date {
    const due = new Date(issueDate);
    switch (terms) {
      case PaymentTerms.IMMEDIATE:
        return due;
      case PaymentTerms.NET_15:
        due.setDate(due.getDate() + 15);
        return due;
      case PaymentTerms.NET_30:
        due.setDate(due.getDate() + 30);
        return due;
      case PaymentTerms.NET_60:
        due.setDate(due.getDate() + 60);
        return due;
      default:
        due.setDate(due.getDate() + 30);
        return due;
    }
  }

  /**
   * Automatically generate an invoice from an active or confirmed subscription
   * Prevents duplicate invoices for the same subscription and billing period.
   */
  async generateInvoiceForSubscription(subscriptionId: string, customPeriodStart?: Date) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        items: {
          include: { product: true, variant: true, plan: true },
        },
        plan: {
          include: { product: true, variant: true },
        },
      },
    });

    if (!sub) {
      throw new Error(`Subscription with ID '${subscriptionId}' not found`);
    }

    if (sub.status === SubscriptionStatus.CLOSED || sub.status === SubscriptionStatus.CANCELLED) {
      throw new Error(`Cannot generate invoice for a subscription that is '${sub.status}'`);
    }

    const issueDate = new Date();
    const dueDate = this.computeDueDate(issueDate, sub.paymentTerms);

    // Calculate billing period boundaries using frequency-aware calculator
    const periodStart = customPeriodStart
      ? new Date(customPeriodStart)
      : sub.nextBillingDate
      ? new Date(sub.nextBillingDate)
      : new Date(sub.startDate);

    const { periodEnd, nextBillingDate } = calculateNextBillingPeriod(
      periodStart,
      sub.plan.billingFrequency,
      sub.plan.billingCycleDays
    );

    // DUPLICATE INVOICE PREVENTION:
    // Check if an active/confirmed/paid invoice already exists for this subscription covering the current/same billing period
    const existingDuplicate = await prisma.invoice.findFirst({
      where: {
        subscriptionId: sub.id,
        status: { not: InvoiceStatus.VOID },
        OR: [
          {
            billingPeriodStart: {
              gte: new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate()),
              lt: new Date(periodStart.getFullYear(), periodStart.getMonth(), periodStart.getDate() + 1),
            },
          },
          {
            billingPeriodEnd: {
              gt: new Date(),
            },
          },
        ],
      },
    });

    if (existingDuplicate) {
      throw new Error(
        `Duplicate invoice prevented: An active invoice '${existingDuplicate.invoiceNumber}' already exists for subscription '${sub.subscriptionNumber}' covering billing period until ${existingDuplicate.billingPeriodEnd.toISOString().split('T')[0]}`
      );
    }

    const invoiceNumber = await this.generateInvoiceNumber();

    // Line items creation from stored SubscriptionItem records
    let lineItemsData: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      taxAmount: number;
      discountAmount: number;
      amount: number;
      lineTotal: number;
    }> = [];

    if (sub.items && sub.items.length > 0) {
      lineItemsData = sub.items.map((item) => {
        const itemQty = item.quantity || 1;
        const itemUnitPrice = Number(item.unitPrice);
        const itemLineTotal = Number(item.lineTotal || itemUnitPrice * itemQty);
        return {
          description: item.description,
          quantity: itemQty,
          unitPrice: itemUnitPrice,
          taxAmount: 0,
          discountAmount: 0,
          amount: itemLineTotal,
          lineTotal: itemLineTotal,
        };
      });
    } else {
      const variantDesc = sub.plan.variant ? ` (${sub.plan.variant.name})` : '';
      const fallbackDesc = `${sub.plan.product.name}${variantDesc} - ${sub.plan.name} [Frequency: ${sub.plan.billingFrequency}]`;
      const fallbackSubtotal = Number(sub.subtotal);
      lineItemsData = [
        {
          description: fallbackDesc,
          quantity: sub.quantity,
          unitPrice: Number(sub.unitPrice),
          taxAmount: Number(sub.taxAmount),
          discountAmount: Number(sub.discountAmount),
          amount: fallbackSubtotal,
          lineTotal: fallbackSubtotal,
        },
      ];
    }

    const subtotal = Number(sub.subtotal);
    const discountAmount = Number(sub.discountAmount);
    const taxRate = Number(sub.taxRate);
    const taxAmount = Number(sub.taxAmount);
    const totalAmount = Number(sub.totalAmount);

    const createdInvoice = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          subscriptionId: sub.id,
          customerId: sub.customerId,
          status: InvoiceStatus.CONFIRMED,
          issueDate,
          dueDate,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          subtotal,
          taxRate,
          taxAmount,
          discountAmount,
          totalAmount,
          amountPaid: 0,
          balanceDue: totalAmount,
          notes: sub.notes ? `Subscription: ${sub.subscriptionNumber}. ${sub.notes}` : `Subscription: ${sub.subscriptionNumber}`,
          items: {
            create: lineItemsData.map((li) => ({
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              taxAmount: li.taxAmount,
              discountAmount: li.discountAmount,
              amount: li.amount,
              lineTotal: li.lineTotal,
            })),
          },
        },
        include: {
          customer: true,
          items: true,
          subscription: true,
        },
      });

      // Update subscription next billing date if not set or if current period has caught up
      if (!sub.nextBillingDate || sub.nextBillingDate <= periodStart) {
        await tx.subscription.update({
          where: { id: sub.id },
          data: { nextBillingDate },
        });
      }

      await tx.subscriptionLifecycleLog.create({
        data: {
          subscriptionId: sub.id,
          fromStatus: sub.status,
          toStatus: sub.status,
          action: 'INVOICE_GENERATED',
          notes: `Invoice ${invoiceNumber} generated for period ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}. Total: ₹${totalAmount.toFixed(2)}`,
        },
      });

      return invoice;
    });

    try {
      await notificationsService.queueInvoiceGenerated(createdInvoice);
    } catch (err: any) {
      console.warn(`[Notification Notice] Failed to queue invoice notification: ${err.message}`);
    }

    return createdInvoice;
  }

  /**
   * Fetch all invoices with filters
   */
  async getAllInvoices(params?: {
    customerId?: string;
    subscriptionId?: string;
    status?: InvoiceStatus;
    search?: string;
  }) {
    const where: any = {};
    if (params?.customerId) where.customerId = params.customerId;
    if (params?.subscriptionId) where.subscriptionId = params.subscriptionId;
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { invoiceNumber: { contains: params.search } },
        { customer: { email: { contains: params.search } } },
        { customer: { companyName: { contains: params.search } } },
        { subscription: { subscriptionNumber: { contains: params.search } } },
      ];
    }

    return prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, companyName: true, address: true, taxId: true },
        },
        subscription: {
          select: { subscriptionNumber: true, status: true, paymentTerms: true },
        },
        items: true,
        payments: true,
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  /**
   * Fetch invoice by ID
   */
  async getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: {
          include: {
            plan: { include: { product: true, variant: true } },
            items: true,
          },
        },
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) throw new Error(`Invoice with ID '${id}' not found`);
    return invoice;
  }

  /**
   * Generate downloadable PDF buffer for an invoice
   */
  async getInvoicePdfBuffer(id: string): Promise<{ buffer: Buffer; filename: string }> {
    const invoice = await this.getInvoiceById(id);

    const pdfBuffer = await pdfService.generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      customer: {
        firstName: invoice.customer.firstName,
        lastName: invoice.customer.lastName,
        email: invoice.customer.email,
        companyName: invoice.customer.companyName,
        address: invoice.customer.address,
        taxId: invoice.customer.taxId,
      },
      items: invoice.items.map((i) => ({
        description: i.description,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        amount: Number(i.amount),
      })),
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      discountAmount: Number(invoice.discountAmount),
      totalAmount: Number(invoice.totalAmount),
      amountPaid: Number(invoice.amountPaid),
      balanceDue: Number(invoice.balanceDue),
      notes: invoice.notes,
    });

    return {
      buffer: pdfBuffer,
      filename: `${invoice.invoiceNumber}.pdf`,
    };
  }

  /**
   * Update invoice status with safety checks
   */
  async updateStatus(id: string, status: InvoiceStatus, notes?: string) {
    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) throw new Error(`Invoice with ID '${id}' not found`);

    if (status === InvoiceStatus.VOID) {
      if (Number(invoice.amountPaid) > 0) {
        throw new Error(
          `Cannot void invoice '${invoice.invoiceNumber}' with ₹${Number(invoice.amountPaid).toFixed(2)} in recorded payments. Refund all payments first.`
        );
      }
    }

    return prisma.invoice.update({
      where: { id },
      data: {
        status,
        notes: notes ? `${invoice.notes || ''}\n[Status Change]: ${notes}` : invoice.notes,
        ...(status === InvoiceStatus.VOID && { balanceDue: 0 }),
      },
      include: { customer: true, items: true, payments: true },
    });
  }
}

export const invoicesService = new InvoicesService();
