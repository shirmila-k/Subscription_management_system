import React, { useState, useEffect } from 'react';
import { invoiceService } from '../../services';

interface CustInvoice {
  id: string;
  invoiceNo: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  status: 'PAID' | 'CONFIRMED' | 'OVERDUE';
}

const CUSTOMER_INVOICES: CustInvoice[] = [
  {
    id: 'inv-1',
    invoiceNo: 'INV-2024-1104',
    issueDate: '24 Oct 2024',
    dueDate: '24 Nov 2024',
    subtotal: 355932,
    taxAmount: 64068,
    totalAmount: 420000,
    amountPaid: 420000,
    balanceDue: 0,
    status: 'PAID',
  },
  {
    id: 'inv-2',
    invoiceNo: 'INV-2024-1089',
    issueDate: '24 Sep 2024',
    dueDate: '24 Oct 2024',
    subtotal: 355932,
    taxAmount: 64068,
    totalAmount: 420000,
    amountPaid: 420000,
    balanceDue: 0,
    status: 'PAID',
  },
  {
    id: 'inv-3',
    invoiceNo: 'INV-2024-1065',
    issueDate: '24 Aug 2024',
    dueDate: '24 Sep 2024',
    subtotal: 355932,
    taxAmount: 64068,
    totalAmount: 420000,
    amountPaid: 420000,
    balanceDue: 0,
    status: 'PAID',
  },
];

export const CustomerInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<CustInvoice[]>(CUSTOMER_INVOICES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    invoiceService
      .getAll()
      .then((data) => {
        if (data && data.length > 0) {
          setInvoices(
            data.map((inv: any) => ({
              id: inv.id,
              invoiceNo: inv.invoiceNumber,
              issueDate: new Date(inv.issueDate).toLocaleDateString(),
              dueDate: new Date(inv.dueDate).toLocaleDateString(),
              subtotal: Number(inv.subtotal),
              taxAmount: Number(inv.taxAmount),
              totalAmount: Number(inv.totalAmount),
              amountPaid: Number(inv.amountPaid),
              balanceDue: Number(inv.balanceDue),
              status: inv.status,
            }))
          );
        }
      })
      .catch(() => {
        // Fallback to sample data
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const downloadPdf = async (invIdOrNo: string) => {
    showToast(`Downloading official GST Tax Invoice PDF for ${invIdOrNo}...`);
    try {
      await invoiceService.downloadPdf(invIdOrNo, `invoice-${invIdOrNo}.pdf`);
      showToast(`Invoice ${invIdOrNo} downloaded successfully!`);
    } catch (e: any) {
      showToast(`Download failed: ${e.message || 'Unable to retrieve PDF'}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#421747] text-white px-4 py-3 rounded-xl shadow-lg border border-[#6D286F] animate-fade-in">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#84418A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Customer Self-Service</span>
            <span>•</span>
            <span>Billing Records</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">Invoices &amp; Tax Receipts</h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Access statutory GST compliance invoices, download PDF statements, and review payment settlements.
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF9FB] border-b border-[#EAE5EC]">
              <tr>
                <th className="py-2.5 px-5 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Due Date
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Subtotal (Excl. Tax)
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  GST 18%
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-5 text-[11px] font-semibold text-[#817986] uppercase tracking-wider text-right">
                  Tax Invoice
                </th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#27212B] divide-y divide-[#EAE5EC]">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#FAF9FB] transition-colors">
                  <td className="py-3.5 px-5 font-semibold text-[#6D286F] font-mono">{inv.invoiceNo}</td>
                  <td className="py-3.5 px-4 text-[#817986]">{inv.issueDate}</td>
                  <td className="py-3.5 px-4 text-[#817986]">{inv.dueDate}</td>
                  <td className="py-3.5 px-4 tabular-nums text-[#817986]">₹{inv.subtotal.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 tabular-nums text-[#817986]">₹{inv.taxAmount.toLocaleString('en-IN')}</td>
                  <td className="py-3.5 px-4 font-bold text-[#27212B] tabular-nums">
                    ₹{inv.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-50 text-[#16845B]'
                          : inv.status === 'CONFIRMED'
                          ? 'bg-amber-50 text-[#B7791F]'
                          : 'bg-rose-50 text-[#C53B4B]'
                      }`}
                    >
                      {inv.status === 'PAID' ? 'Paid in Full' : inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => downloadPdf(inv.id || inv.invoiceNo)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9FB] hover:bg-[#F3EAF5] text-[#27212B] border border-[#EAE5EC] text-xs font-semibold transition-colors shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#6D286F]">download</span>
                      Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
