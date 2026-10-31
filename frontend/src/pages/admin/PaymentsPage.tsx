import React, { useState, useEffect } from 'react';
import { paymentService, invoiceService } from '../../services';
import { Payment, Invoice, PaymentMethod } from '../../types';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'REFUNDED' | 'FAILED'>('ALL');

  // Record Payment Modal
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [unpaidInvoices, setUnpaidInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Refund Modal
  const [refundPaymentId, setRefundPaymentId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadPayments = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await paymentService.getAll();
      setPayments(data || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnpaidInvoices = async () => {
    try {
      const data = await invoiceService.getAll();
      const filtered = (data || []).filter((inv: Invoice) => Number(inv.balanceDue) > 0 && inv.status !== 'VOID');
      setUnpaidInvoices(filtered);
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleOpenRecordModal = () => {
    loadUnpaidInvoices();
    setIsRecordModalOpen(true);
  };

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = unpaidInvoices.find((i) => i.id === invId);
    if (inv) {
      setPaymentAmount(Number(inv.balanceDue));
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || paymentAmount <= 0) {
      showToast('Please select an invoice with a positive balance due', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentService.recordPayment({
        invoiceId: selectedInvoiceId,
        amount: Number(paymentAmount),
        paymentMethod,
        transactionReference: paymentRef || undefined,
        notes: paymentNotes || undefined,
      });
      showToast('Payment successfully recorded and reconciled with invoice');
      setIsRecordModalOpen(false);
      setSelectedInvoiceId('');
      setPaymentRef('');
      setPaymentNotes('');
      await loadPayments();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to record payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefund = async () => {
    if (!refundPaymentId) return;
    setIsSubmitting(true);
    try {
      await paymentService.refundPayment(refundPaymentId, refundReason || 'Requested refund');
      showToast('Payment refunded and invoice balance restored successfully');
      setRefundPaymentId(null);
      setRefundReason('');
      await loadPayments();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to refund payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const custName =
      p.customer?.companyName ||
      `${p.customer?.firstName || ''} ${p.customer?.lastName || ''}`.trim() ||
      p.customer?.email ||
      '';
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.transactionReference && p.transactionReference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      custName.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'SUCCESS') return matchesSearch && p.status === 'SUCCESS';
    if (statusFilter === 'REFUNDED') return matchesSearch && p.status === 'REFUNDED';
    if (statusFilter === 'FAILED') return matchesSearch && p.status === 'FAILED';
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border animate-fade-in ${
            toastMessage.type === 'success'
              ? 'bg-[#2E1036] text-white border-[#7B2082]'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7B2082] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Financials</span>
            <span>•</span>
            <span>Settlement &amp; Reconciliation Ledger</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1926] tracking-tight">Payments &amp; Transactions</h1>
          <p className="text-sm text-[#736B7C] mt-0.5">
            Audit verified fund settlements, gateway payloads, UTR references, and handle secure balance refunds.
          </p>
        </div>

        <button
          onClick={handleOpenRecordModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#7B2082] text-white font-medium text-sm hover:bg-[#651A6B] transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add_card</span>
          <span>Record Payment</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={loadPayments} className="text-xs font-semibold uppercase underline">
            Retry
          </button>
        </div>
      )}

      {/* Filters & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E7E2EC] shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['ALL', 'SUCCESS', 'REFUNDED', 'FAILED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab
                  ? 'bg-[#7B2082] text-white shadow-xs'
                  : 'text-[#736B7C] hover:bg-[#F6F4F8] hover:text-[#1E1926]'
              }`}
            >
              {tab === 'ALL'
                ? `All Settlements (${payments.length})`
                : tab === 'SUCCESS'
                ? `Success (${payments.filter((p) => p.status === 'SUCCESS').length})`
                : tab === 'REFUNDED'
                ? `Refunded (${payments.filter((p) => p.status === 'REFUNDED').length})`
                : `Failed (${payments.filter((p) => p.status === 'FAILED').length})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#A29CA8]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by PAY-#, UTR, client..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] placeholder-[#A29CA8] focus:outline-none focus:border-[#7B2082] focus:bg-white"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-[#E7E2EC] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-[#736B7C]">
            <span className="material-symbols-outlined animate-spin text-[32px] text-[#7B2082] mb-2">
              progress_activity
            </span>
            <p className="text-sm">Loading settlement ledger from database...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center text-[#736B7C]">
            <span className="material-symbols-outlined text-[48px] text-[#C2BDC9] mb-2">payments</span>
            <p className="text-base font-semibold text-[#1E1926]">No payments recorded</p>
            <p className="text-xs text-[#736B7C] max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No payments match your search criteria.'
                : 'Payments recorded against invoices will appear here with full reconciliation history.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FAF9FB] border-b border-[#E7E2EC]">
                <tr>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Receipt #
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Client &amp; Invoice
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Method &amp; Reference (UTR)
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Settlement Date
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-right">
                    Amount Settled
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#1E1926] divide-y divide-[#E7E2EC]">
                {filteredPayments.map((p) => {
                  const clientName =
                    p.customer?.companyName ||
                    `${p.customer?.firstName || ''} ${p.customer?.lastName || ''}`.trim() ||
                    p.customer?.email ||
                    'Client';

                  return (
                    <tr key={p.id} className="hover:bg-[#FAF9FB] transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#7B2082]">{p.paymentNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1E1926]">{clientName}</div>
                        <div className="text-[11px] font-mono text-[#736B7C]">
                          {p.invoice?.invoiceNumber ? `Invoice: ${p.invoice.invoiceNumber}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#1E1926]">{p.paymentMethod}</div>
                        <div className="text-[11px] font-mono text-[#736B7C]">
                          {p.transactionReference ? `Ref: ${p.transactionReference}` : 'Internal debit'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#736B7C]">
                        {new Date(p.paymentDate).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#1E1926]">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.status === 'SUCCESS'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : p.status === 'REFUNDED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {p.status === 'SUCCESS' && (
                          <button
                            onClick={() => {
                              setRefundPaymentId(p.id);
                              setRefundReason('');
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-2xl border border-[#E7E2EC] shadow-2xl max-w-md w-full p-6 animate-scale-in"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E2EC]">
              <h3 className="text-base font-bold text-[#1E1926]">Record Direct Settlement</h3>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="p-1 text-[#736B7C] hover:bg-[#F6F4F8] rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">
                  Select Outstanding Invoice
                </label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                >
                  <option value="">-- Choose unpaid invoice --</option>
                  {unpaidInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} - Balance Due: ₹{Number(inv.balanceDue).toLocaleString('en-IN')} (
                      {inv.customer?.companyName || inv.customer?.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">Settlement Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="CREDIT_CARD">Credit Card / Debit Card</option>
                  <option value="UPI">UPI AutoPay / VPA</option>
                  <option value="RAZORPAY">Razorpay Gateway</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="CASH">Cash / Physical Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">
                  Bank Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. UTR-2026-NEFT-884912"
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Optional internal reconciliation notes..."
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E2EC]">
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E7E2EC] text-xs font-semibold text-[#736B7C] hover:bg-[#F6F4F8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
              >
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Refund Modal */}
      {refundPaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E7E2EC] shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-base font-bold text-[#1E1926] mb-1">Confirm Payment Refund</h3>
            <p className="text-xs text-[#736B7C] mb-4">
              Refunding this transaction will update the payment status to REFUNDED, restore the outstanding
              balance on the corresponding invoice, and revert the invoice to unpaid status.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#1E1926] mb-1">Refund Reason</label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Audit explanation for refund..."
                className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRefundPaymentId(null)}
                className="px-3 py-1.5 rounded-lg border border-[#E7E2EC] text-xs font-semibold text-[#736B7C] hover:bg-[#F6F4F8]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRefund}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors"
              >
                {isSubmitting ? 'Refunding...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
