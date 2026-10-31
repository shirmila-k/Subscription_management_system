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
        .text('INVOICE', 380, 50, { width: 170, align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Invoice #: ${data.invoiceNumber}`, 380, 75, { width: 170, align: 'right' })
        .text(`Issue Date: ${new Date(data.issueDate).toLocaleDateString()}`, 380, 90, { width: 170, align: 'right' })
        .text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, 380, 105, { width: 170, align: 'right' })
        .fillColor(data.status === 'PAID' ? '#16A34A' : '#DC2626')
        .font('Helvetica-Bold')
        .text(`Status: ${data.status}`, 380, 120, { width: 170, align: 'right' });

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
        .text('Total', 460, tableTop, { width: 85, align: 'right' });

      // Line Items Table Content
      let position = tableTop + 25;
      data.items.forEach((item) => {
        doc.fontSize(9).font('Helvetica');
        const descHeight = doc.heightOfString(item.description, { width: 250 });
        const rowHeight = Math.max(descHeight, 18);

        doc
          .fillColor('#334155')
          .text(item.description, 60, position, { width: 250 })
          .text(item.quantity.toString(), 320, position, { width: 40, align: 'right' })
          .text(`$${Number(item.unitPrice).toFixed(2)}`, 380, position, { width: 70, align: 'right' })
          .text(`$${Number(item.amount).toFixed(2)}`, 460, position, { width: 85, align: 'right' });

        position += rowHeight + 10;
      });

      doc.moveTo(50, position + 5).lineTo(550, position + 5).strokeColor('#E2E8F0').stroke();

      // Financial Summary (Right column)
      const summaryTop = position + 18;
      const labelX = 260;
      const labelWidth = 190;
      const valX = 460;
      const valWidth = 85;

      let currentY = summaryTop;

      // Subtotal
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#64748B')
        .text('Subtotal:', labelX, currentY, { width: labelWidth, align: 'right' })
        .fillColor('#0F172A')
        .text(`$${Number(data.subtotal).toFixed(2)}`, valX, currentY, { width: valWidth, align: 'right' });

      currentY += 18;

      // Discount
      doc
        .fillColor('#64748B')
        .text('Discount Applied:', labelX, currentY, { width: labelWidth, align: 'right' })
        .fillColor('#0F172A')
        .text(`-$${Number(data.discountAmount).toFixed(2)}`, valX, currentY, { width: valWidth, align: 'right' });

      currentY += 18;

      // Tax
      doc
        .fillColor('#64748B')
        .text(`Tax (${data.taxRate}%):`, labelX, currentY, { width: labelWidth, align: 'right' })
        .fillColor('#0F172A')
        .text(`$${Number(data.taxAmount).toFixed(2)}`, valX, currentY, { width: valWidth, align: 'right' });

      currentY += 22;

      // Total Amount Due
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#0F172A')
        .text('Total Amount Due:', labelX, currentY, { width: labelWidth, align: 'right' })
        .text(`$${Number(data.totalAmount).toFixed(2)}`, valX, currentY, { width: valWidth, align: 'right' });

      currentY += 20;

      // Amount Paid
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor('#16A34A')
        .text('Amount Paid:', labelX, currentY, { width: labelWidth, align: 'right' })
        .text(`$${Number(data.amountPaid).toFixed(2)}`, valX, currentY, { width: valWidth, align: 'right' });

      currentY += 18;

      // Remaining Balance
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(Number(data.balanceDue) > 0 ? '#DC2626' : '#16A34A')
        .text('Remaining Balance:', labelX, currentY, { width: labelWidth, align: 'right' })
        .text(`$${Number(data.balanceDue).toFixed(2)}`, valX, currentY, { width: valWidth, align: 'right' });

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
