import React, { useState, useEffect } from 'react';
import { invoiceService } from '../../services';
import { Invoice } from '../../types';

export const CustomerInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadCustomerInvoices = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await invoiceService.getAll();
      setInvoices(data || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to retrieve your invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerInvoices();
  }, []);

  const downloadPdf = (id: string, invNo: string) => {
    try {
      invoiceService.downloadPdf(id);
      showToast(`Downloading official GST Tax Invoice PDF for ${invNo}...`);
    } catch {
      showToast(`Failed to download invoice PDF for ${invNo}`);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#2E1036] text-white px-4 py-3 rounded-xl shadow-lg border border-[#7B2082] animate-fade-in">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7B2082] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Customer Self-Service</span>
            <span>•</span>
            <span>Billing Records</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1926] tracking-tight">Invoices &amp; Tax Receipts</h1>
          <p className="text-sm text-[#736B7C] mt-0.5">
            Access statutory GST compliance invoices, download PDF statements, and review payment settlements.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={loadCustomerInvoices} className="text-xs font-semibold uppercase underline">
            Retry
          </button>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-[#E7E2EC] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-[#736B7C]">
            <span className="material-symbols-outlined animate-spin text-[32px] text-[#7B2082] mb-2">
              progress_activity
            </span>
            <p className="text-sm">Loading your invoices...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-[#736B7C]">
            <span className="material-symbols-outlined text-[48px] text-[#C2BDC9] mb-2">receipt</span>
            <p className="text-base font-semibold text-[#1E1926]">No invoices yet</p>
            <p className="text-xs text-[#736B7C] max-w-sm mx-auto mt-1">
              Invoices for your active subscriptions will appear here automatically upon billing cycle generation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FAF9FB] border-b border-[#E7E2EC]">
                <tr>
                  <th className="py-2.5 px-5 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-right">
                    Subtotal
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-right">
                    GST (18%)
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-right">
                    Total Amount
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-right">
                    Balance Due
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="py-2.5 px-5 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#1E1926] divide-y divide-[#E7E2EC]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#FAF9FB] transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#7B2082] font-mono">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-[#736B7C]">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-[#736B7C]">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      ₹{Number(inv.subtotal).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#736B7C]">
                      ₹{Number(inv.taxAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-[#1E1926]">
                      ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold">
                      <span className={Number(inv.balanceDue) > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        ₹{Number(inv.balanceDue).toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.status === 'OVERDUE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => downloadPdf(inv.id, inv.invoiceNumber)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E7E2EC] text-[#7B2082] hover:bg-[#F6F4F8] font-medium transition-colors text-[11px]"
                      >
                        <span className="material-symbols-outlined text-[14px]">download</span>
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
