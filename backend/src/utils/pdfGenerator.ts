import PDFDocument from 'pdfkit';

export interface InvoicePdfData {
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  companyName?: string;
  issueDate: Date | string;
  dueDate: Date | string;
  status: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}

export const generateInvoicePdf = (data: InvoicePdfData): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', (err) => reject(err));

    // Brand Header
    doc
      .fillColor('#2563EB')
      .fontSize(24)
      .text('Brightloop Software', 50, 45)
      .fontSize(10)
      .fillColor('#64748B')
      .text('Subscription Billing & Management Platform', 50, 75)
      .text('support@brightloop.com | https://brightloop.io', 50, 90);

    // Invoice Meta Right-Aligned
    doc
      .fontSize(20)
      .fillColor('#0F172A')
      .text('INVOICE', 350, 45, { align: 'right' })
      .fontSize(10)
      .fillColor('#475569')
      .text(`Invoice No: ${data.invoiceNumber}`, 350, 75, { align: 'right' })
      .text(`Issue Date: ${new Date(data.issueDate).toLocaleDateString()}`, 350, 90, { align: 'right' })
      .text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, 350, 105, { align: 'right' })
      .text(`Status: ${data.status.toUpperCase()}`, 350, 120, { align: 'right' });

    doc.moveTo(50, 140).lineTo(550, 140).strokeColor('#E2E8F0').stroke();

    // Bill To Section
    doc
      .fontSize(12)
      .fillColor('#0F172A')
      .text('Billed To:', 50, 155)
      .fontSize(10)
      .fillColor('#334155')
      .text(data.customerName, 50, 175)
      .text(data.customerEmail, 50, 190);

    if (data.companyName) {
      doc.text(data.companyName, 50, 205);
    }

    // Line Items Table Header
    const tableTop = 235;
    doc
      .rect(50, tableTop - 5, 500, 22)
      .fillColor('#F1F5F9')
      .fill();

    doc
      .fillColor('#1E293B')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Description', 60, tableTop)
      .text('Qty', 330, tableTop, { width: 40, align: 'center' })
      .text('Unit Price', 380, tableTop, { width: 70, align: 'right' })
      .text('Amount', 460, tableTop, { width: 80, align: 'right' });

    let currentY = tableTop + 25;
    doc.font('Helvetica');

    data.items.forEach((item) => {
      doc
        .fillColor('#334155')
        .fontSize(9)
        .text(item.description, 60, currentY, { width: 260 })
        .text(item.quantity.toString(), 330, currentY, { width: 40, align: 'center' })
        .text(`${data.currency} ${Number(item.unitPrice).toFixed(2)}`, 380, currentY, { width: 70, align: 'right' })
        .text(`${data.currency} ${Number(item.amount).toFixed(2)}`, 460, currentY, { width: 80, align: 'right' });

      currentY += 22;
    });

    doc.moveTo(50, currentY + 5).lineTo(550, currentY + 5).strokeColor('#E2E8F0').stroke();

    // Summary calculation
    const summaryY = currentY + 15;
    const rightMargin = 420;

    doc
      .fontSize(9)
      .fillColor('#475569')
      .text('Subtotal:', rightMargin, summaryY, { width: 60, align: 'right' })
      .text(`${data.currency} ${Number(data.subtotal).toFixed(2)}`, 490, summaryY, { width: 50, align: 'right' });

    if (data.discountAmount > 0) {
      doc
        .text('Discount:', rightMargin, summaryY + 16, { width: 60, align: 'right' })
        .text(`-${data.currency} ${Number(data.discountAmount).toFixed(2)}`, 490, summaryY + 16, { width: 50, align: 'right' });
    }

    doc
      .text(`Tax (${(data.taxRate * 100).toFixed(0)}%):`, rightMargin, summaryY + 32, { width: 60, align: 'right' })
      .text(`${data.currency} ${Number(data.taxAmount).toFixed(2)}`, 490, summaryY + 32, { width: 50, align: 'right' });

    doc
      .rect(rightMargin - 10, summaryY + 50, 140, 25)
      .fillColor('#EFF6FF')
      .fill();

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#1E40AF')
      .text('Total Due:', rightMargin, summaryY + 57, { width: 60, align: 'right' })
      .text(`${data.currency} ${Number(data.totalAmount).toFixed(2)}`, 470, summaryY + 57, { width: 70, align: 'right' });

    // Footer
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#94A3B8')
      .text(
        'Thank you for partnering with Brightloop Software. Payment terms apply according to your service agreement.',
        50,
        740,
        { align: 'center', width: 500 }
      );

    doc.end();
  });
};
