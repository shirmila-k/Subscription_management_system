import PDFDocument from 'pdfkit';
import { env } from '../../config/env';

export interface InvoicePdfData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  status: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string | null;
    address?: string | null;
    taxId?: string | null;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number | string;
    amount: number | string;
  }[];
  subtotal: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  amountPaid: number | string;
  balanceDue: number | string;
  notes?: string | null;
}

export class PdfService {
  /**
   * Generates a PDFKit document buffer for the given invoice
   */
  async generateInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header Banner
      doc
        .fillColor('#1E293B')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(env.companyName, 50, 50);

      doc
        .fillColor('#64748B')
        .fontSize(10)
        .font('Helvetica')
        .text('Subscription Billing & Cloud ERP Platform', 50, 75)
        .text(`Email: ${env.companyEmail}`, 50, 90)
        .text(`Tax / EIN ID: ${env.companyTaxId}`, 50, 105);

      // Invoice Details (Right-aligned)
      doc
        .fillColor('#0F172A')
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('INVOICE', 380, 50, { align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Invoice #: ${data.invoiceNumber}`, 380, 75, { align: 'right' })
        .text(`Issue Date: ${new Date(data.issueDate).toLocaleDateString()}`, 380, 90, { align: 'right' })
        .text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, 380, 105, { align: 'right' })
        .fillColor(data.status === 'PAID' ? '#16A34A' : '#DC2626')
        .font('Helvetica-Bold')
        .text(`Status: ${data.status}`, 380, 120, { align: 'right' });

      doc.moveTo(50, 145).lineTo(550, 145).strokeColor('#E2E8F0').stroke();

      // Bill To Section
      doc
        .fillColor('#334155')
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('BILLED TO:', 50, 160);

      doc
        .fillColor('#0F172A')
        .fontSize(10)
        .font('Helvetica')
        .text(`${data.customer.firstName} ${data.customer.lastName}`, 50, 178)
        .text(data.customer.companyName || 'Individual Customer', 50, 192)
        .text(`Email: ${data.customer.email}`, 50, 206);

      if (data.customer.address) {
        doc.text(`Address: ${data.customer.address}`, 50, 220);
      }
      if (data.customer.taxId) {
        doc.text(`Customer Tax ID: ${data.customer.taxId}`, 50, 234);
      }

      // Line Items Table Header
      const tableTop = 270;
      doc
        .rect(50, tableTop - 5, 500, 22)
        .fill('#F1F5F9');

      doc
        .fillColor('#1E293B')
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Item Description', 60, tableTop)
        .text('Qty', 320, tableTop, { width: 40, align: 'right' })
        .text('Unit Price', 380, tableTop, { width: 70, align: 'right' })
        .text('Total', 470, tableTop, { width: 70, align: 'right' });

      // Line Items Table Content
      let position = tableTop + 25;
      data.items.forEach((item) => {
        doc
          .fillColor('#334155')
          .fontSize(9)
          .font('Helvetica')
          .text(item.description, 60, position, { width: 250 })
          .text(item.quantity.toString(), 320, position, { width: 40, align: 'right' })
          .text(`$${Number(item.unitPrice).toFixed(2)}`, 380, position, { width: 70, align: 'right' })
          .text(`$${Number(item.amount).toFixed(2)}`, 470, position, { width: 70, align: 'right' });

        position += 24;
      });

      doc.moveTo(50, position + 5).lineTo(550, position + 5).strokeColor('#E2E8F0').stroke();

      // Financial Summary (Right column)
      const summaryTop = position + 15;
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Subtotal:', 340, summaryTop, { align: 'right' })
        .text(`$${Number(data.subtotal).toFixed(2)}`, 470, summaryTop, { width: 70, align: 'right' });

      doc
        .text('Discount Applied:', 340, summaryTop + 16, { align: 'right' })
        .text(`-$${Number(data.discountAmount).toFixed(2)}`, 470, summaryTop + 16, { width: 70, align: 'right' });

      doc
        .text(`Tax (${data.taxRate}%):`, 340, summaryTop + 32, { align: 'right' })
        .text(`$${Number(data.taxAmount).toFixed(2)}`, 470, summaryTop + 32, { width: 70, align: 'right' });

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0F172A')
        .text('Total Amount Due:', 340, summaryTop + 52, { align: 'right' })
        .text(`$${Number(data.totalAmount).toFixed(2)}`, 470, summaryTop + 52, { width: 70, align: 'right' });

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#16A34A')
        .text('Amount Paid:', 340, summaryTop + 70, { align: 'right' })
        .text(`$${Number(data.amountPaid).toFixed(2)}`, 470, summaryTop + 70, { width: 70, align: 'right' });

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(Number(data.balanceDue) > 0 ? '#DC2626' : '#16A34A')
        .text('Remaining Balance:', 340, summaryTop + 88, { align: 'right' })
        .text(`$${Number(data.balanceDue).toFixed(2)}`, 470, summaryTop + 88, { width: 70, align: 'right' });

      // Payment Terms / Footer
      doc
        .fillColor('#64748B')
        .fontSize(9)
        .font('Helvetica')
        .text(
          'Thank you for your business! Please settle all outstanding balances prior to the due date to ensure uninterrupted subscription services.',
          50,
          700,
          { width: 500, align: 'center' }
        );

      doc.end();
    });
  }
}

export const pdfService = new PdfService();
