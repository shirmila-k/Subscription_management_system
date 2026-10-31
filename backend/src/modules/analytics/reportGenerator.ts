import PDFDocument from 'pdfkit';

/**
 * Escapes and sanitizes a cell value for RFC 4180 CSV compliance
 * and guards against CSV formula injection (CSV Injection / CWE-1236).
 */
export function sanitizeCsvCell(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Guard against CSV formula injection in spreadsheet software (Excel, LibreOffice, Google Sheets)
  const dangerousPrefixes = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousPrefixes.some((prefix) => str.startsWith(prefix))) {
    str = `'${str}`;
  }

  // If contains commas, newlines, or double quotes, escape properly
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts headers and row matrix into safe CSV string.
 */
export function buildCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

export interface PdfReportData {
  title: string;
  periodLabel: string;
  generatedAt: Date;
  generatedBy: string;
  currency: string;
  kpis: {
    totalRevenue: number;
    currentMonthRevenue: number;
    mrr: number;
    arr: number;
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalCustomers: number;
    newCustomersThisMonth: number;
    invoicedTotal: number;
    outstandingBalance: number;
    overdueInvoicesCount: number;
  };
  subscriptionStatusCounts: Record<string, number>;
  topPlans: Array<{
    name: string;
    subscribersCount: number;
    revenue: number;
    billingFrequency: string;
  }>;
  recentPayments: Array<{
    paymentNumber: string;
    customerName: string;
    amount: number;
    date: string;
    method: string;
  }>;
}

/**
 * Generates an executive PDF report using PDFKit.
 */
export function generateAnalyticsPdf(data: PdfReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
      info: {
        Title: data.title,
        Author: 'Brightloop Subscription Management Platform',
        Subject: 'Executive Analytics & Performance Report',
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', (err) => reject(err));

    const primaryColor = '#421747'; // Brightloop Deep Plum
    const accentColor = '#6D286F';  // Brightloop Purple
    const textColor = '#27212B';
    const subtleColor = '#64748B';

    // 1. Header Banner
    doc
      .fillColor(primaryColor)
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('BRIGHTLOOP SOFTWARE', 40, 40)
      .fontSize(9)
      .font('Helvetica')
      .fillColor(subtleColor)
      .text('Subscription Billing & Financial Intelligence Platform', 40, 65);

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor(accentColor)
      .text(data.title.toUpperCase(), 300, 40, { align: 'right' })
      .fontSize(8)
      .font('Helvetica')
      .fillColor(subtleColor)
      .text(`Period: ${data.periodLabel}`, 300, 60, { align: 'right' })
      .text(`Generated: ${data.generatedAt.toLocaleString()}`, 300, 72, { align: 'right' })
      .text(`Author: ${data.generatedBy}`, 300, 84, { align: 'right' });

    doc.moveTo(40, 100).lineTo(555, 100).strokeColor('#E2E8F0').lineWidth(1).stroke();

    // 2. Executive Summary Metrics Grid (2x4 Cards)
    let y = 115;
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(textColor)
      .text('Executive Financial & Operational KPIs', 40, y);

    y += 20;

    const cards = [
      {
        label: 'Total Collected Revenue',
        val: `${data.currency} ${data.kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        label: 'Monthly Recurring Revenue (MRR)',
        val: `${data.currency} ${data.kpis.mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        label: 'Active Subscriptions',
        val: `${data.kpis.activeSubscriptions} / ${data.kpis.totalSubscriptions} total`,
      },
      {
        label: 'Total Registered Customers',
        val: `${data.kpis.totalCustomers} (${data.kpis.newCustomersThisMonth} new this mo)`,
      },
      {
        label: 'Total Invoiced Volume',
        val: `${data.currency} ${data.kpis.invoicedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
      {
        label: 'Outstanding Balance (Receivables)',
        val: `${data.currency} ${data.kpis.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    ];

    const cardWidth = 245;
    const cardHeight = 44;

    cards.forEach((card, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const cx = 40 + col * (cardWidth + 25);
      const cy = y + row * (cardHeight + 10);

      // Card Background Box
      doc.rect(cx, cy, cardWidth, cardHeight).fillColor('#F8FAFC').fill().strokeColor('#E2E8F0').stroke();

      // Card Content
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(subtleColor)
        .text(card.label.toUpperCase(), cx + 10, cy + 8);

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .fillColor(textColor)
        .text(card.val, cx + 10, cy + 22);
    });

    y += 3 * (cardHeight + 10) + 15;

    // 3. Subscription Portfolio Breakdown by Status
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(textColor)
      .text('Subscription Portfolio Status Distribution', 40, y);

    y += 18;

    // Status Table Header
    doc.rect(40, y, 515, 20).fillColor('#F1F5F9').fill();
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(textColor)
      .text('STATUS', 50, y + 6)
      .text('SUBSCRIPTION COUNT', 300, y + 6)
      .text('SHARE OF PORTFOLIO', 440, y + 6);

    y += 20;

    const totalSubs = data.kpis.totalSubscriptions || 1;
    Object.entries(data.subscriptionStatusCounts).forEach(([status, count]) => {
      const percent = Math.round((count / totalSubs) * 1000) / 10;
      doc.rect(40, y, 515, 18).strokeColor('#F1F5F9').stroke();
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor(textColor)
        .text(status, 50, y + 5)
        .text(String(count), 300, y + 5)
        .text(`${percent}%`, 440, y + 5);
      y += 18;
    });

    y += 20;

    // 4. Top Performing Subscription Plans
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(textColor)
      .text('Top Performing Subscription Plans', 40, y);

    y += 18;

    doc.rect(40, y, 515, 20).fillColor('#F1F5F9').fill();
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(textColor)
      .text('PLAN NAME', 50, y + 6)
      .text('FREQUENCY', 260, y + 6)
      .text('SUBSCRIBERS', 360, y + 6)
      .text('REVENUE RECORDED', 450, y + 6);

    y += 20;

    if (data.topPlans.length === 0) {
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .fillColor(subtleColor)
        .text('No subscription plans found in this period.', 50, y + 5);
      y += 20;
    } else {
      data.topPlans.slice(0, 5).forEach((plan) => {
        doc.rect(40, y, 515, 18).strokeColor('#F1F5F9').stroke();
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor(textColor)
          .text(plan.name, 50, y + 5)
          .text(plan.billingFrequency, 260, y + 5)
          .text(String(plan.subscribersCount), 360, y + 5)
          .text(`${data.currency} ${plan.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 450, y + 5);
        y += 18;
      });
    }

    y += 20;

    // 5. Recent Verified Successful Payments
    if (y > 650) {
      doc.addPage();
      y = 40;
    }

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor(textColor)
      .text('Recent Successful Payments (Sample)', 40, y);

    y += 18;

    doc.rect(40, y, 515, 20).fillColor('#F1F5F9').fill();
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(textColor)
      .text('PAYMENT NO', 50, y + 6)
      .text('CUSTOMER', 160, y + 6)
      .text('DATE', 320, y + 6)
      .text('METHOD', 400, y + 6)
      .text('AMOUNT', 480, y + 6);

    y += 20;

    if (data.recentPayments.length === 0) {
      doc
        .fontSize(8)
        .font('Helvetica-Oblique')
        .fillColor(subtleColor)
        .text('No successful payment transactions recorded in this period.', 50, y + 5);
      y += 20;
    } else {
      data.recentPayments.slice(0, 6).forEach((pmt) => {
        doc.rect(40, y, 515, 18).strokeColor('#F1F5F9').stroke();
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor(textColor)
          .text(pmt.paymentNumber, 50, y + 5)
          .text(pmt.customerName.slice(0, 22), 160, y + 5)
          .text(new Date(pmt.date).toLocaleDateString(), 320, y + 5)
          .text(pmt.method, 400, y + 5)
          .text(`${data.currency} ${pmt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 480, y + 5);
        y += 18;
      });
    }

    // Footer on all pages
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(7)
        .font('Helvetica')
        .fillColor(subtleColor)
        .text(
          `Page ${i + 1} of ${range.count} • Brightloop Subscription Financial Intelligence • Confidential & Proprietary`,
          40,
          800,
          { align: 'center', width: 515 }
        );
    }

    doc.end();
  });
}
