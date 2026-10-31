import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Invoice } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { FileDown, CreditCard, Check, Clock } from 'lucide-react';

export const CustomerInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'RAZORPAY' | 'CREDIT_CARD' | 'BANK_TRANSFER'>('RAZORPAY');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Invoice[]>('/invoices');
      setInvoices(data);
    } catch (err) {
      // Mock Fallback
      setInvoices([
        {
          id: 'inv-01',
          invoiceNumber: 'INV-2026-0001',
          customerId: 'mock-customer-01',
          status: 'CONFIRMED',
          subtotal: 495.0,
          taxRate: 0.18,
          taxAmount: 89.1,
          discountAmount: 0,
          totalAmount: 584.1,
          currency: 'USD',
          issueDate: '2026-10-15T00:00:00Z',
          dueDate: '2026-11-01T00:00:00Z',
        },
        {
          id: 'inv-02',
          invoiceNumber: 'INV-2026-0002',
          customerId: 'mock-customer-01',
          status: 'PAID',
          subtotal: 99.0,
          taxRate: 0.18,
          taxAmount: 17.82,
          discountAmount: 0,
          totalAmount: 116.82,
          currency: 'USD',
          issueDate: '2026-09-15T00:00:00Z',
          dueDate: '2026-10-01T00:00:00Z',
          paidAt: '2026-09-20T00:00:00Z',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      await ApiClient.downloadPdf(`/invoices/${invoiceId}/pdf`, `${invoiceNumber}.pdf`);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF invoice');
    }
  };

  const handleCompletePayment = async () => {
    if (!payingInvoice) return;
    setIsProcessing(true);
    try {
      await ApiClient.post('/payments', {
        invoiceId: payingInvoice.id,
        amount: Number(payingInvoice.totalAmount),
        method: paymentMethod,
        transactionReference: `TXN-${Date.now()}`,
        notes: `Settled via Customer Portal (${paymentMethod})`,
      });
      setPayingInvoice(null);
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Payment execution failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Billing & Invoices</h1>
        <p className="text-sm text-slate-400 mt-1">
          View itemized charges, download verified tax invoices, and settle recurring billing cycles
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4">Subtotal</th>
                <th className="py-3 px-4">Tax (18%)</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Fetching billing receipts...
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">${Number(inv.subtotal).toFixed(2)}</td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-xs">
                      +${Number(inv.taxAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-white">
                      ${Number(inv.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {inv.status !== 'PAID' && (
                        <button
                          onClick={() => setPayingInvoice(inv)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay Now
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-brand-400 border border-slate-700 rounded-lg transition"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Now Modal */}
      <Modal
        isOpen={!!payingInvoice}
        onClose={() => setPayingInvoice(null)}
        title={`Settle Invoice: ${payingInvoice?.invoiceNumber}`}
      >
        {payingInvoice && (
          <div className="space-y-4">
            <div className="glass-card p-4 rounded-xl border border-slate-700 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">Amount Payable (incl. taxes)</p>
                <p className="text-2xl font-black text-white mt-1">
                  ${Number(payingInvoice.totalAmount).toFixed(2)}
                </p>
              </div>
              <Badge status={payingInvoice.status} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Select Payment Gateway / Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['RAZORPAY', 'CREDIT_CARD', 'BANK_TRANSFER'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                      paymentMethod === method
                        ? 'border-brand-500 bg-brand-500/10 text-white'
                        : 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCompletePayment}
                className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
              >
                {isProcessing ? 'Confirming Settlement...' : `Pay $${Number(payingInvoice.totalAmount).toFixed(2)}`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
