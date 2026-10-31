import React, { useEffect, useState } from 'react';
import { invoiceService, paymentService, subscriptionService } from '../../services';
import { Invoice, Subscription, PaymentMethod } from '../../types';

export const InvoicesList: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter & Search
  const [activeTab, setActiveTab] = useState<'ALL' | 'CONFIRMED' | 'PAID' | 'OVERDUE' | 'VOID'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [subscriptionsList, setSubscriptionsList] = useState<Subscription[]>([]);
  const [selectedSubId, setSelectedSubId] = useState('');

  // Payment Recording Modal
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [paymentRef, setPaymentRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadInvoices = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await invoiceService.getAll();
      setInvoices(data || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
    subscriptionService.getAll({ status: 'ACTIVE' }).then((subs: any) => setSubscriptionsList(subs || [])).catch(() => {});
  }, []);

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId) {
      showToast('Please select a subscription', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await invoiceService.generateInvoice(selectedSubId);
      showToast('Invoice generated successfully');
      setIsGenerateModalOpen(false);
      setSelectedSubId('');
      await loadInvoices();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to generate invoice', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice || paymentAmount <= 0) {
      showToast('Please specify a valid payment amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await paymentService.recordPayment({
        invoiceId: paymentInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        transactionReference: paymentRef || undefined,
        notes: `Recorded from Invoices dashboard on ${new Date().toLocaleDateString()}`,
      });
      showToast('Payment recorded and invoice balance reconciled successfully');
      setPaymentInvoice(null);
      setPaymentRef('');
      await loadInvoices();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to record payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoidInvoice = async (id: string) => {
    if (!confirm('Are you sure you want to mark this invoice as VOID?')) return;
    try {
      await invoiceService.updateStatus(id, 'VOID', 'Voided by administrative user');
      showToast('Invoice status updated to VOID');
      await loadInvoices();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to void invoice', 'error');
    }
  };

  const handleDownloadPdf = (id: string, invoiceNumber: string) => {
    try {
      invoiceService.downloadPdf(id);
      showToast(`Downloading official PDF for ${invoiceNumber}...`);
    } catch (err: any) {
      showToast('Failed to initiate PDF download', 'error');
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const custName =
      inv.customer?.companyName ||
      `${inv.customer?.firstName || ''} ${inv.customer?.lastName || ''}`.trim() ||
      inv.customer?.email ||
      '';
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'CONFIRMED') return matchesSearch && inv.status === 'CONFIRMED';
    if (activeTab === 'PAID') return matchesSearch && inv.status === 'PAID';
    if (activeTab === 'OVERDUE') return matchesSearch && inv.status === 'OVERDUE';
    if (activeTab === 'VOID') return matchesSearch && inv.status === 'VOID';
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
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
            <span>Billing Records</span>
            <span>•</span>
            <span>Tax Compliant Invoices</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1926] tracking-tight">Invoices &amp; Accounts Receivable</h1>
          <p className="text-sm text-[#736B7C] mt-0.5">
            Audit recurring billing invoices, statutory GST receipts, outstanding balances, and settlement statuses.
          </p>
        </div>

        <button
          onClick={() => setIsGenerateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#7B2082] text-white font-medium text-sm hover:bg-[#651A6B] transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
          <span>Generate Invoice</span>
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">error</span>
            <span>{errorMessage}</span>
          </div>
          <button onClick={loadInvoices} className="text-xs font-semibold uppercase underline">
            Retry
          </button>
        </div>
      )}

      {/* Filters & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E7E2EC] shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['ALL', 'CONFIRMED', 'PAID', 'OVERDUE', 'VOID'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-[#7B2082] text-white shadow-xs'
                  : 'text-[#736B7C] hover:bg-[#F6F4F8] hover:text-[#1E1926]'
              }`}
            >
              {tab === 'ALL'
                ? `All Invoices (${invoices.length})`
                : tab === 'CONFIRMED'
                ? `Confirmed / Unpaid (${invoices.filter((i) => i.status === 'CONFIRMED').length})`
                : tab === 'PAID'
                ? `Paid (${invoices.filter((i) => i.status === 'PAID').length})`
                : tab === 'OVERDUE'
                ? `Overdue (${invoices.filter((i) => i.status === 'OVERDUE').length})`
                : `Void (${invoices.filter((i) => i.status === 'VOID').length})`}
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
            placeholder="Search by invoice #, client..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] placeholder-[#A29CA8] focus:outline-none focus:border-[#7B2082] focus:bg-white"
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-[#E7E2EC] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-[#736B7C]">
            <span className="material-symbols-outlined animate-spin text-[32px] text-[#7B2082] mb-2">
              progress_activity
            </span>
            <p className="text-sm">Loading billing records from database...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center text-[#736B7C]">
            <span className="material-symbols-outlined text-[48px] text-[#C2BDC9] mb-2">receipt</span>
            <p className="text-base font-semibold text-[#1E1926]">No invoices found</p>
            <p className="text-xs text-[#736B7C] max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No invoices match your search query.'
                : 'Generate a billing invoice or run the automated billing cycle to populate records.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FAF9FB] border-b border-[#E7E2EC]">
                <tr>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Client &amp; Tax ID
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Total (GST 18%)
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Paid / Balance Due
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
                {filteredInvoices.map((inv) => {
                  const clientName =
                    inv.customer?.companyName ||
                    `${inv.customer?.firstName || ''} ${inv.customer?.lastName || ''}`.trim() ||
                    inv.customer?.email ||
                    'Customer';

                  return (
                    <tr key={inv.id} className="hover:bg-[#FAF9FB] transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#7B2082]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1E1926]">{clientName}</div>
                        <div className="text-[11px] text-[#736B7C]">
                          {inv.customer?.taxId ? `GST: ${inv.customer.taxId}` : inv.customer?.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-[#1E1926]">
                          Issued: {new Date(inv.issueDate).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-[#736B7C]">
                          Due: {new Date(inv.dueDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1E1926]">
                          ₹{Number(inv.totalAmount).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-[#736B7C]">
                          Sub: ₹{Number(inv.subtotal).toLocaleString('en-IN')} | Tax: ₹{Number(inv.taxAmount).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] font-medium text-emerald-700">
                          Paid: ₹{Number(inv.amountPaid).toLocaleString('en-IN')}
                        </div>
                        <div
                          className={`text-[11px] font-semibold ${
                            Number(inv.balanceDue) > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          Due: ₹{Number(inv.balanceDue).toLocaleString('en-IN')}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.status === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : inv.status === 'CONFIRMED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadPdf(inv.id, inv.invoiceNumber)}
                            title="Download official PDF Tax Invoice"
                            className="p-1 text-[#7B2082] hover:bg-[#F6F4F8] rounded"
                          >
                            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                          </button>

                          {inv.status !== 'PAID' && inv.status !== 'VOID' && (
                            <button
                              onClick={() => {
                                setPaymentInvoice(inv);
                                setPaymentAmount(Number(inv.balanceDue));
                              }}
                              title="Record payment settlement"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <span className="material-symbols-outlined text-[16px]">payments</span>
                            </button>
                          )}

                          {inv.status !== 'VOID' && Number(inv.amountPaid) === 0 && (
                            <button
                              onClick={() => handleVoidInvoice(inv.id)}
                              title="Mark invoice as VOID"
                              className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <span className="material-symbols-outlined text-[16px]">block</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleGenerateInvoice}
            className="bg-white rounded-2xl border border-[#E7E2EC] shadow-2xl max-w-md w-full p-6 animate-scale-in"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E2EC]">
              <h3 className="text-base font-bold text-[#1E1926]">Generate Subscription Invoice</h3>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="p-1 text-[#736B7C] hover:bg-[#F6F4F8] rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">
                  Select Active Subscription
                </label>
                <select
                  required
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                >
                  <option value="">-- Choose subscription --</option>
                  {subscriptionsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subscriptionNumber} ({s.customer?.companyName || s.customer?.email}) - ₹
                      {Number(s.totalAmount).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#736B7C] mt-1">
                  Duplicate prevention automatically guards against generating duplicate invoices for active periods.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E2EC]">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E7E2EC] text-xs font-semibold text-[#736B7C] hover:bg-[#F6F4F8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#7B2082] hover:bg-[#651A6B] transition-colors"
              >
                {isSubmitting ? 'Generating...' : 'Generate Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleRecordPayment}
            className="bg-white rounded-2xl border border-[#E7E2EC] shadow-2xl max-w-md w-full p-6 animate-scale-in"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E2EC]">
              <div>
                <h3 className="text-base font-bold text-[#1E1926]">Record Invoice Payment</h3>
                <p className="text-xs text-[#736B7C] font-mono">{paymentInvoice.invoiceNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="p-1 text-[#736B7C] hover:bg-[#F6F4F8] rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="bg-[#FAF9FB] p-3 rounded-xl border border-[#E7E2EC] flex justify-between text-xs">
                <div>
                  <span className="text-[#736B7C] block">Total Amount</span>
                  <span className="font-semibold text-[#1E1926]">
                    ₹{Number(paymentInvoice.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#736B7C] block">Outstanding Balance</span>
                  <span className="font-semibold text-rose-600">
                    ₹{Number(paymentInvoice.balanceDue).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={Number(paymentInvoice.balanceDue)}
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
                  <option value="CREDIT_CARD">Credit Card / Corporate Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                  <option value="UPI">UPI AutoPay / VPA</option>
                  <option value="RAZORPAY">Razorpay Gateway</option>
                  <option value="STRIPE">Stripe</option>
                  <option value="CASH">Cash / Direct Cheque</option>
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
                  placeholder="e.g. UTR-2026-HDFC-991823"
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E2EC]">
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
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
    </div>
  );
};
