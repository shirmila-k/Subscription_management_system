import prisma from '../../config/db';
import { InvoiceStatus, PaymentTerms } from '@prisma/client';
import { pdfService } from './pdf.service';

export class InvoicesService {
  /**
   * Helper to generate unique invoice numbers
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count();
    const sequence = (count + 1).toString().padStart(5, '0');
    return `INV-${year}-${sequence}`;
  }

  /**
   * Helper to calculate invoice due date based on payment terms
   */
  private computeDueDate(issueDate: Date, terms: PaymentTerms): Date {
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
   */
  async generateInvoiceForSubscription(subscriptionId: string) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        customer: true,
        plan: {
          include: { product: true, variant: true },
        },
      },
    });

    if (!sub) throw new Error('Subscription not found');

    const issueDate = new Date();
    const dueDate = this.computeDueDate(issueDate, sub.paymentTerms);

    const billingPeriodStart = sub.nextBillingDate ? new Date(sub.nextBillingDate) : new Date(sub.startDate);
    const billingPeriodEnd = new Date(billingPeriodStart);
    billingPeriodEnd.setDate(billingPeriodEnd.getDate() + sub.plan.billingCycleDays);

    const invoiceNumber = await this.generateInvoiceNumber();
    const variantDesc = sub.plan.variant ? ` (${sub.plan.variant.name})` : '';
    const itemDescription = `${sub.plan.product.name}${variantDesc} - ${sub.plan.name} Plan [Billing cycle: ${sub.plan.billingCycleDays} days]`;

    const subtotal = Number(sub.subtotal);
    const discountAmount = Number(sub.discountAmount);
    const taxRate = Number(sub.taxRate);
    const taxAmount = Number(sub.taxAmount);
    const totalAmount = Number(sub.totalAmount);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        status: InvoiceStatus.CONFIRMED,
        issueDate,
        dueDate,
        billingPeriodStart,
        billingPeriodEnd,
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        totalAmount,
        amountPaid: 0,
        balanceDue: totalAmount,
        items: {
          create: [
            {
              description: itemDescription,
              quantity: sub.quantity,
              unitPrice: sub.unitPrice,
              amount: subtotal,
            },
          ],
        },
      },
      include: {
        customer: true,
        items: true,
        subscription: true,
      },
    });

    return invoice;
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
      ];
    }

    return prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, companyName: true },
        },
        subscription: {
          select: { subscriptionNumber: true, status: true },
        },
        items: true,
        payments: true,
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  /**
   * Fetch invoice by ID or invoice number
   */
  async getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [{ id }, { invoiceNumber: id }],
      },
      include: {
        customer: true,
        subscription: {
          include: { plan: { include: { product: true } } },
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
      filename: `invoice-${invoice.id}.pdf`,
    };
  }

  /**
   * Update invoice status
   */
  async updateStatus(id: string, status: InvoiceStatus) {
    return prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }
}

export const invoicesService = new InvoicesService();
