import React, { useEffect, useState } from 'react';
import { invoiceService, paymentService } from '../../services';

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  customerName: string;
  gstin: string;
  subscriptionCode: string;
  issuedDate: string;
  dueDate: string;
  dueNote: string;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  statusDisplay: string;
}

export const InvoicesList: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceRow[]>([
    {
      id: 'inv-01',
      invoiceNumber: 'INV-2024-1104',
      customerName: 'Acme Cloud Labs Pvt Ltd',
      gstin: '27AABCA1234F1Z9',
      subscriptionCode: 'SUB-9402',
      issuedDate: '15 Oct 2024',
      dueDate: '14 Nov 2024',
      dueNote: 'Due in 5 days',
      taxAmount: 64068,
      totalAmount: 420000,
      paidAmount: 200000,
      balanceDue: 220000,
      status: 'PARTIALLY_PAID',
      statusDisplay: 'Partially Paid',
    },
    {
      id: 'inv-02',
      invoiceNumber: 'INV-2024-1103',
      customerName: 'FinEdge Technologies',
      gstin: '29AAFCS9021K2ZP',
      subscriptionCode: 'SUB-9401',
      issuedDate: '14 Oct 2024',
      dueDate: '14 Oct 2024',
      dueNote: 'Paid 15 Oct',
      taxAmount: 134237,
      totalAmount: 880000,
      paidAmount: 880000,
      balanceDue: 0,
      status: 'PAID',
      statusDisplay: 'Paid',
    },
    {
      id: 'inv-03',
      invoiceNumber: 'INV-2024-1102',
      customerName: 'NexaHealth Solutions',
      gstin: '07AAJCN4411C1ZD',
      subscriptionCode: 'SUB-8919',
      issuedDate: '28 Sep 2024',
      dueDate: '28 Oct 2024',
      dueNote: 'Due 28 Oct (12d late)',
      taxAmount: 25169,
      totalAmount: 165000,
      paidAmount: 0,
      balanceDue: 165000,
      status: 'OVERDUE',
      statusDisplay: 'Overdue',
    },
    {
      id: 'inv-04',
      invoiceNumber: 'INV-2024-1101',
      customerName: 'CloudSprint Info Labs',
      gstin: '33AALCC8810M1ZU',
      subscriptionCode: 'SUB-9355',
      issuedDate: '12 Oct 2024',
      dueDate: '11 Nov 2024',
      dueNote: 'Due 11 Nov 2024',
      taxAmount: 82372,
      totalAmount: 540000,
      paidAmount: 0,
      balanceDue: 540000,
      status: 'CONFIRMED',
      statusDisplay: 'Confirmed',
    },
    {
      id: 'inv-05',
      invoiceNumber: 'INV-2024-1100',
      customerName: 'Veloce Systems Private Ltd',
      gstin: '06AATCS1920L1ZP',
      subscriptionCode: 'SUB-7718',
      issuedDate: '18 Oct 2024',
      dueDate: 'Not finalized',
      dueNote: 'Unposted draft',
      taxAmount: 18305,
      totalAmount: 120000,
      paidAmount: 0,
      balanceDue: 120000,
      status: 'DRAFT',
      statusDisplay: 'Draft',
    },
  ]);

  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow>(invoices[0]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(220000);
  const [paymentMethod, setPaymentMethod] = useState('NEFT');
  const [paymentReference, setPaymentReference] = useState('UTR-2024-99881');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchBackendInvoices = async () => {
    try {
      const data = await invoiceService.getAll();
      if (data && data.length > 0) {
        const mapped: InvoiceRow[] = data.map((inv: any, idx: number) => {
          const total = Number(inv.totalAmount || 10000);
          const paid = Number(inv.paidAmount || 0);
          const balance = total - paid;
          const customerName = inv.customer
            ? inv.customer.companyName || `${inv.customer.firstName || ''} ${inv.customer.lastName || ''}`.trim()
            : 'Enterprise Customer';
          return {
            id: inv.id,
            invoiceNumber: inv.invoiceNumber || `INV-2024-${1100 + idx}`,
            customerName,
            gstin: inv.customer?.gstin || '27AABCA1234F1Z9',
            subscriptionCode: inv.subscription?.code || `SUB-${9400 + idx}`,
            issuedDate: new Date(inv.issueDate || Date.now()).toLocaleDateString(),
            dueDate: new Date(inv.dueDate || Date.now() + 2592000000).toLocaleDateString(),
            dueNote: balance === 0 ? 'Settled' : 'Net 30 terms',
            taxAmount: Number(inv.taxAmount || total * 0.18),
            totalAmount: total,
            paidAmount: paid,
            balanceDue: balance,
            status: inv.status,
            statusDisplay:
              inv.status === 'PAID'
                ? 'Paid'
                : inv.status === 'CONFIRMED'
                ? 'Confirmed'
                : inv.status === 'PARTIALLY_PAID'
                ? 'Partially Paid'
                : inv.status === 'DRAFT'
                ? 'Draft'
                : 'Overdue',
          };
        });
        setInvoices(mapped);
        setSelectedInvoice(mapped[0]);
      }
    } catch (e) {
      console.info('Backend invoice fetch fallback to Stitch reference');
    }
  };

  useEffect(() => {
    fetchBackendInvoices();
  }, []);

  const handleRecordPayment = async () => {
    try {
      await paymentService.recordPayment({
        invoiceId: selectedInvoice.id,
        amount: paymentAmount,
        paymentMethod,
        referenceNumber: paymentReference,
      });
      setFeedback(`Payment of ₹${paymentAmount.toLocaleString('en-IN')} recorded successfully.`);
      await fetchBackendInvoices();
    } catch (e) {
      // Local update
      const updatedBalance = Math.max(0, selectedInvoice.balanceDue - paymentAmount);
      const nextStatus = updatedBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
      const updatedInv = {
        ...selectedInvoice,
        paidAmount: selectedInvoice.paidAmount + paymentAmount,
        balanceDue: updatedBalance,
        status: nextStatus as any,
        statusDisplay: nextStatus === 'PAID' ? 'Paid' : 'Partially Paid',
      };
      setSelectedInvoice(updatedInv);
      setInvoices((prev) => prev.map((inv) => (inv.id === updatedInv.id ? updatedInv : inv)));
      setFeedback(`Payment recorded in local state (Offline fallback).`);
    }

    setIsPaymentModalOpen(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDownloadPdf = async (invoiceId: string, invNum: string) => {
    try {
      const pdfUrl = invoiceService.getPdfUrl(invoiceId);
      window.open(pdfUrl, '_blank');
    } catch (e) {
      alert(`Generating printable PDF for ${invNum}...`);
      window.print();
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.subscriptionCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'CONFIRMED') return matchesSearch && inv.status === 'CONFIRMED';
    if (statusFilter === 'PARTIAL') return matchesSearch && inv.status === 'PARTIALLY_PAID';
    if (statusFilter === 'PAID') return matchesSearch && inv.status === 'PAID';
    if (statusFilter === 'OVERDUE') return matchesSearch && inv.status === 'OVERDUE';
    if (statusFilter === 'DRAFT') return matchesSearch && inv.status === 'DRAFT';
    return matchesSearch;
  });

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-[#1f1924] tracking-tight">Invoices</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f5eaf9] text-[#6D286F] text-xs font-semibold">
              FY 2024-25
            </span>
          </div>
          <p className="text-sm text-[#81737e]">
            Manage recurring billing, customer invoices, and outstanding receivables across active contracts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => alert('Exporting all invoices to CSV...')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#EAE5EC] hover:bg-[#FAF9FB] text-xs font-medium text-[#1f1924] shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[18px] text-[#81737e]">file_download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Matrix (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Invoiced */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#81737e] font-semibold block">
                Total Invoiced (MTD)
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-[#1f1924] tabular-nums">₹84,20,500</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#FAF9FB] flex items-center justify-center text-[#6D286F]">
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between text-xs text-[#81737e]">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              +12.4% vs last month
            </span>
            <span>342 Invoices</span>
          </div>
        </div>

        {/* Settled & Collected */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#81737e] font-semibold block">
                Settled &amp; Collected
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-[#1f1924] tabular-nums">₹71,34,000</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">check_circle</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
              84.7% collection rate
            </span>
            <span className="text-[#81737e]">268 Paid</span>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#81737e] font-semibold block">
                Outstanding Balance
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-[#1f1924] tabular-nums">₹10,02,500</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#FEF6E9] text-[#B7791F] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF6E9] text-[#B7791F] font-semibold">
              34 pending invoices
            </span>
            <span className="text-[#81737e]">11.9% total</span>
          </div>
        </div>

        {/* Overdue in Dunning */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#81737e] font-semibold block">
                Overdue in Dunning
              </span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-bold text-[#C53B4B] tabular-nums">₹2,84,000</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#FDF0F2] text-[#C53B4B] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
          </div>
          <div className="mt-4 pt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FDF0F2] text-[#C53B4B] font-semibold">
              8 in dunning
            </span>
            <span className="text-[#C53B4B] font-semibold">Action required</span>
          </div>
        </div>
      </div>

      {/* Main Table + Active Invoice Inspector Drawer */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Table Container */}
        <div className="flex-1 w-full bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden flex flex-col">
          {/* Search & Tabs */}
          <div className="p-4 border-b border-[#EAE5EC] space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#81737e] text-[18px]">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#1f1924] placeholder:text-[#81737e] outline-none focus:border-[#6D286F]"
                  placeholder="Filter by invoice #, customer name, GSTIN..."
                  type="text"
                />
              </div>
            </div>

            {/* Segment Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs font-semibold">
              {[
                { id: 'ALL', label: 'All', count: 342 },
                { id: 'CONFIRMED', label: 'Confirmed', count: 28 },
                { id: 'PARTIAL', label: 'Partially Paid', count: 14 },
                { id: 'PAID', label: 'Paid', count: 268 },
                { id: 'OVERDUE', label: 'Overdue', count: 24 },
                { id: 'DRAFT', label: 'Draft', count: 8 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  type="button"
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                    statusFilter === tab.id
                      ? 'bg-[#6D286F] text-white shadow-xs'
                      : 'bg-[#FAF9FB] text-[#1f1924] hover:bg-[#f5eaf9] border border-[#EAE5EC]'
                  }`}
                >
                  {tab.label} <span className="opacity-75">({tab.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#FAF9FB] text-[#81737e] uppercase tracking-wider font-semibold border-b border-[#EAE5EC]">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-3">Subscription</th>
                  <th className="py-3 px-3">Issued / Due</th>
                  <th className="py-3 px-3 text-right">Tax (18%)</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5EC] text-[#1f1924]">
                {filteredInvoices.map((inv) => {
                  const isSelected = selectedInvoice?.id === inv.id;
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setSelectedInvoice(inv)}
                      className={`transition cursor-pointer group ${
                        isSelected ? 'bg-[#f5eaf9]/60' : 'hover:bg-[#FAF9FB]'
                      }`}
                    >
                      <td className="py-3.5 px-4 font-semibold text-[#6D286F] whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{inv.invoiceNumber}</span>
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6D286F]" />
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#1f1924] truncate max-w-[140px]">
                          {inv.customerName}
                        </div>
                        <span className="text-[10px] text-[#81737e] font-mono">{inv.gstin}</span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-[#FAF9FB] border border-[#EAE5EC] text-[10px]">
                          {inv.subscriptionCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap text-[11px]">
                        <div>{inv.issuedDate}</div>
                        <div className="text-[#81737e] text-[10px]">{inv.dueNote}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right tabular-nums text-[#81737e]">
                        ₹{inv.taxAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold tabular-nums">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums text-emerald-700 font-medium">
                        ₹{inv.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right tabular-nums font-bold">
                        {inv.balanceDue > 0 ? (
                          <span className="text-[#B7791F]">
                            ₹{inv.balanceDue.toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-[#81737e]">₹0</span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-800'
                              : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-[#FEF6E9] text-[#B7791F]'
                              : inv.status === 'OVERDUE'
                              ? 'bg-[#FDF0F2] text-[#C53B4B]'
                              : inv.status === 'CONFIRMED'
                              ? 'bg-[#f5eaf9] text-[#6D286F]'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.statusDisplay}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 text-[#81737e]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPdf(inv.id, inv.invoiceNumber);
                            }}
                            className="p-1 rounded hover:text-[#1f1924] hover:bg-slate-100"
                            title="Download PDF"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              picture_as_pdf
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Invoice Inspector Drawer (Right Side) */}
        {selectedInvoice && (
          <div className="w-full xl:w-[420px] shrink-0 bg-white rounded-xl border border-[#EAE5EC] shadow-sm overflow-hidden flex flex-col space-y-4">
            <div className="p-4 bg-[#FAF9FB] border-b border-[#EAE5EC] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-[#1f1924]">
                    {selectedInvoice.invoiceNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-[#FEF6E9] text-[#B7791F] text-xs font-semibold">
                    {selectedInvoice.statusDisplay}
                  </span>
                </div>
                <p className="text-xs text-[#81737e] mt-0.5">{selectedInvoice.customerName}</p>
              </div>
            </div>

            {/* Quick Action Grid */}
            <div className="grid grid-cols-2 gap-2 px-4">
              <button
                type="button"
                onClick={() =>
                  handleDownloadPdf(selectedInvoice.id, selectedInvoice.invoiceNumber)
                }
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#6D286F] text-white hover:bg-[#530D57] text-xs font-semibold shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentAmount(selectedInvoice.balanceDue);
                  setIsPaymentModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 text-xs font-semibold shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">add_card</span>
                <span>Record Payment</span>
              </button>
            </div>

            {/* Balance Settlement Card */}
            <div className="px-4">
              <div className="rounded-xl bg-[#FAF9FB] border border-[#EAE5EC] p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#81737e]">
                  <span>Total Invoiced</span>
                  <span className="font-semibold text-[#1f1924] tabular-nums">
                    ₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#81737e]">
                  <span>Amount Collected</span>
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    ₹{selectedInvoice.paidAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1f1924] pt-2 border-t border-[#EAE5EC]">
                  <span>Remaining Balance</span>
                  <span className="text-[#B7791F] tabular-nums">
                    ₹{selectedInvoice.balanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Detail Spec */}
            <div className="px-4 pb-4 space-y-2 text-xs text-[#81737e]">
              <div>
                <strong className="text-[#1f1924]">Linked Agreement:</strong>{' '}
                {selectedInvoice.subscriptionCode}
              </div>
              <div>
                <strong className="text-[#1f1924]">Tax Breakdown:</strong> 18% GST (₹
                {selectedInvoice.taxAmount.toLocaleString('en-IN')})
              </div>
              <div>
                <strong className="text-[#1f1924]">Due Date:</strong> {selectedInvoice.dueDate}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#FAF9FB] border-b border-[#EAE5EC] flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1f1924]">
                Record Payment for {selectedInvoice.invoiceNumber}
              </h2>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-[#81737e]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1f1924] pb-1">
                  Payment Amount (₹)
                </label>
                <input
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-base font-bold text-[#1f1924] tabular-nums"
                  type="number"
                />
                <span className="text-[11px] text-[#81737e] mt-1 block">
                  Outstanding balance: ₹{selectedInvoice.balanceDue.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1f1924] pb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs"
                >
                  <option value="NEFT">NEFT / RTGS Bank Transfer</option>
                  <option value="UPI">UPI / Instant VPA</option>
                  <option value="CREDIT_CARD">Corporate Credit Card</option>
                  <option value="NET_BANKING">Net Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1f1924] pb-1">
                  Reference / UTR Number
                </label>
                <input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs font-mono uppercase"
                  placeholder="e.g. UTR-2024-88412"
                  type="text"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-[#FAF9FB] border-t border-[#EAE5EC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-[#EAE5EC] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecordPayment}
                className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesList;
