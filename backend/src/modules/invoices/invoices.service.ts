import prisma from '../../config/prisma';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { InvoiceStatus } from '@prisma/client';
import { generateInvoicePdf } from '../../utils/pdfGenerator';

export class InvoicesService {
  public static async generateInvoiceNumber(): Promise<string> {
    const count = await prisma.invoice.count();
    const year = new Date().getFullYear();
    const sequence = (count + 1).toString().padStart(4, '0');
    return `INV-${year}-${sequence}`;
  }

  /**
   * Automated billing generation from active subscription
   */
  public static async generateInvoiceForSubscription(
    subscriptionId: string,
    billingPeriodStart: Date,
    billingPeriodEnd: Date
  ) {
    const sub = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: { include: { product: true } },
        items: true,
        customer: true,
      },
    });

    if (!sub) {
      throw new NotFoundError('Subscription not found.');
    }

    const invoiceNumber = await this.generateInvoiceNumber();
    const taxRate = 0.18; // 18% standard VAT/GST

    let subtotal = 0;
    const itemsData = sub.items.length
      ? sub.items.map((item) => {
          const itemAmount = Number(item.subtotal);
          subtotal += itemAmount;
          return {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate,
            amount: itemAmount,
          };
        })
      : [
          {
            description: `${sub.plan.product.name} - ${sub.plan.name} (${sub.plan.billingFrequency} Billing)`,
            quantity: sub.quantity,
            unitPrice: sub.unitPrice,
            taxRate,
            amount: Number(sub.unitPrice) * sub.quantity,
          },
        ];

    if (!sub.items.length) {
      subtotal = Number(sub.unitPrice) * sub.quantity;
    }

    const discountAmount = Number(sub.discountAmount) || 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = taxableAmount * taxRate;
    const totalAmount = taxableAmount + taxAmount;

    // Determine due date according to payment terms
    const dueDate = new Date(billingPeriodStart);
    switch (sub.paymentTerms) {
      case 'NET15':
        dueDate.setDate(dueDate.getDate() + 15);
        break;
      case 'NET30':
        dueDate.setDate(dueDate.getDate() + 30);
        break;
      case 'NET60':
        dueDate.setDate(dueDate.getDate() + 60);
        break;
      case 'IMMEDIATE':
      default:
        dueDate.setDate(dueDate.getDate() + 3); // 3 days grace for immediate
        break;
    }

    return prisma.invoice.create({
      data: {
        invoiceNumber,
        subscriptionId: sub.id,
        customerId: sub.customerId,
        status: InvoiceStatus.CONFIRMED,
        subtotal,
        taxRate,
        taxAmount,
        discountAmount,
        totalAmount,
        currency: sub.plan.currency,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate,
        items: {
          create: itemsData,
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });
  }

  public static async getAll(filter?: {
    customerId?: string;
    status?: InvoiceStatus;
    subscriptionId?: string;
  }) {
    const where: any = {};

    if (filter?.customerId) {
      where.customerId = filter.customerId;
    }

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.subscriptionId) {
      where.subscriptionId = filter.subscriptionId;
    }

    return prisma.invoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true, companyName: true } },
        subscription: { select: { id: true, subscriptionNumber: true } },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        subscription: {
          include: {
            plan: { include: { product: true } },
          },
        },
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice with ID ${id} not found.`);
    }

    return invoice;
  }

  public static async confirmInvoice(id: string) {
    const invoice = await this.getById(id);
    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.CONFIGURED) {
      throw new BadRequestError(`Invoice is already ${invoice.status}`);
    }

    return prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CONFIRMED },
    });
  }

  public static async markAsPaid(id: string) {
    return prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      },
    });
  }

  public static async getPdfBuffer(id: string): Promise<Buffer> {
    const invoice = await this.getById(id);

    return generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      customerEmail: invoice.customer.email,
      companyName: invoice.customer.companyName || undefined,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      discountAmount: Number(invoice.discountAmount),
      totalAmount: Number(invoice.totalAmount),
      currency: invoice.currency,
      items: invoice.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
      })),
    });
  }
}
