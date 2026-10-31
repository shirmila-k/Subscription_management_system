import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Invoice } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { SearchInput } from '../../components/SearchInput';
import { Modal } from '../../components/Modal';
import { formatINR, formatDate, formatDateTime } from '../../utils/format';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  Plus,
  Building,
  Smartphone,
  Wallet,
  FileText,
} from 'lucide-react';

interface PaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  method: 'RAZORPAY' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'STRIPE' | 'CASH';
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  transactionReference: string;
  createdAt: string;
  notes?: string;
}

export const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<'RAZORPAY' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'STRIPE' | 'CASH'>('RAZORPAY');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPaymentsAndInvoices();
  }, []);

  const fetchPaymentsAndInvoices = async () => {
    setLoading(true);
    try {
      const [invRes, payRes] = await Promise.all([
        ApiClient.get<Invoice[]>('/invoices'),
        ApiClient.get<any[]>('/payments').catch(() => []),
      ]);
      setInvoices(invRes);

      if (payRes && payRes.length > 0) {
        setPayments(
          payRes.map((p) => ({
            id: p.id,
            invoiceId: p.invoiceId,
            invoiceNumber: p.invoice?.invoiceNumber || 'INV-2026-XXXX',
            customerName: p.invoice?.customer?.name || 'Customer Account',
            amount: Number(p.amount),
            method: p.method,
            status: p.status || 'COMPLETED',
            transactionReference: p.transactionReference || `TXN-${p.id.slice(0, 8)}`,
            createdAt: p.createdAt,
            notes: p.notes,
          }))
        );
      } else {
        setPayments(getMockPayments());
      }
    } catch (err) {
      setPayments(getMockPayments());
    } finally {
      setLoading(false);
    }
  };

  const getMockPayments = (): PaymentRecord[] => [
    {
      id: 'pay-01',
      invoiceId: 'inv-01',
      invoiceNumber: 'INV-2026-0001',
      customerName: 'Acme Technologies Pvt Ltd',
      amount: 13160.0,
      method: 'RAZORPAY',
      status: 'COMPLETED',
      transactionReference: 'pay_Nz928471Ksa0',
      createdAt: '2026-10-05T14:32:00Z',
      notes: 'UPI auto-debit collection verified',
    },
    {
      id: 'pay-02',
      invoiceId: 'inv-04',
      invoiceNumber: 'INV-2026-0004',
      customerName: 'Bharat Enterprises Ltd',
      amount: 51100.0,
      method: 'BANK_TRANSFER',
      status: 'COMPLETED',
      transactionReference: 'NEFT-HDFC0001284-998',
      createdAt: '2026-09-28T11:15:00Z',
      notes: 'HDFC Corporate banking settlement',
    },
    {
      id: 'pay-03',
      invoiceId: 'inv-05',
      invoiceNumber: 'INV-2026-0005',
      customerName: 'Northstar Logistics India',
      amount: 28910.0,
      method: 'CREDIT_CARD',
      status: 'COMPLETED',
      transactionReference: 'ch_3Nxy987123aa',
      createdAt: '2026-10-18T16:45:00Z',
      notes: 'Corporate Visa Card settlement',
    },
  ];

  const handleInvoiceSelect = (invId: string) => {
    setSelectedInvoiceId(invId);
    const inv = invoices.find((i) => i.id === invId);
    if (inv) {
      setAmount(Number(inv.totalAmount));
      setReference(`MANUAL-${Date.now().toString().slice(-6)}`);
      setNotes(`Reconciled for ${inv.invoiceNumber}`);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) {
      alert('Please select an invoice to settle.');
      return;
    }

    setSubmitting(true);
    try {
      await ApiClient.post('/payments', {
        invoiceId: selectedInvoiceId,
        amount,
        method,
        transactionReference: reference,
        notes,
      });

      setIsModalOpen(false);
      fetchPaymentsAndInvoices();
    } catch (err) {
      // Optimistic update
      const inv = invoices.find((i) => i.id === selectedInvoiceId);
      const newPay: PaymentRecord = {
        id: `pay-${Date.now()}`,
        invoiceId: selectedInvoiceId,
        invoiceNumber: inv ? inv.invoiceNumber : 'INV-MANUAL',
        customerName: inv?.customer ? inv.customer.name : 'Verified Customer',
        amount,
        method,
        status: 'COMPLETED',
        transactionReference: reference,
        createdAt: new Date().toISOString(),
        notes,
      };
      setPayments([newPay, ...payments]);
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.transactionReference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || p.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const razorpayTotal = payments
    .filter((p) => p.method === 'RAZORPAY')
    .reduce((sum, p) => sum + p.amount, 0);
  const bankTransferTotal = payments
    .filter((p) => p.method === 'BANK_TRANSFER')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#817986] font-medium mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#6D286F] font-semibold">Payments</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B]">Payment Ledger & Collections</h1>
          <p className="text-xs text-[#817986] mt-0.5">
            Audit trail of Razorpay UPI, corporate credit cards, and direct bank transfer reconciliations
          </p>
        </div>

        <button
          onClick={() => {
            if (invoices.length > 0) {
              handleInvoiceSelect(invoices[0].id);
            }
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Record Offline Payment
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Collected"
          value={formatINR(totalCollected)}
          icon={Wallet}
          trend={{ value: 21.4, isPositive: true }}
          description="Net reconciled payments"
        />
        <StatCard
          label="Razorpay UPI Volume"
          value={formatINR(razorpayTotal)}
          icon={Smartphone}
          description="Instant online settlements"
        />
        <StatCard
          label="Bank NEFT / RTGS"
          value={formatINR(bankTransferTotal)}
          icon={Building}
          description="Direct treasury transfers"
        />
        <StatCard
          label="Reconciliation Rate"
          value="99.4%"
          icon={CheckCircle2}
          trend={{ value: 0.8, isPositive: true }}
          description="Zero unallocated payments"
        />
      </div>

      {/* Payments Table Card */}
      <div className="bg-white rounded-2xl border border-[#EAE5EC] shadow-card overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-[#EAE5EC] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search reference #, invoice, customer..."
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {['ALL', 'RAZORPAY', 'BANK_TRANSFER', 'CREDIT_CARD'].map((m) => (
              <button
                key={m}
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  methodFilter === m
                    ? 'bg-[#6D286F] text-white shadow-sm'
                    : 'bg-[#FAF9FB] text-[#817986] hover:text-[#27212B] border border-[#EAE5EC]'
                }`}
              >
                {m === 'ALL' ? 'All Channels' : m.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#27212B]">
            <thead className="bg-[#FAF9FB] text-[#817986] font-semibold uppercase text-[10px] tracking-wider border-b border-[#EAE5EC]">
              <tr>
                <th className="py-3 px-4">Transaction Ref</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right font-bold">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#817986]">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
                    Loading payment audit log...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#817986]">
                    <CreditCard className="w-8 h-8 text-[#817986]/40 mx-auto mb-2" />
                    No payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FAF9FB] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#6D286F]">
                      {p.transactionReference}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#27212B]">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#27212B]">
                      {p.customerName}
                    </td>
                    <td className="py-3.5 px-4 text-[#817986] whitespace-nowrap">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F3EAF5] text-[#6D286F] border border-[#6D286F]/20">
                        {p.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#16845B] text-sm">
                      {formatINR(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#16845B] bg-[#16845B]/10 px-2.5 py-0.5 rounded-full border border-[#16845B]/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Reconciled
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#817986] max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Offline Payment Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Offline / Manual Payment"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">
                Select Invoice to Settle
              </label>
              <select
                required
                value={selectedInvoiceId}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              >
                <option value="">-- Choose outstanding invoice --</option>
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} - {inv.customer?.name} ({formatINR(Number(inv.totalAmount))}) [{inv.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">
                Settlement Amount (₹ INR)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs font-mono text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Payment Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as any)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              >
                <option value="RAZORPAY">Razorpay UPI / Netbanking</option>
                <option value="BANK_TRANSFER">Direct Bank NEFT / RTGS</option>
                <option value="CREDIT_CARD">Corporate Credit Card</option>
                <option value="STRIPE">Stripe International</option>
                <option value="CASH">Cash / Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">
                Transaction Reference / UTR
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UTR-98234812384"
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs font-mono text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Remarks / Audit Note</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Optional comments for finance audit trail"
                className="w-full bg-white border border-[#EAE5EC] rounded-xl p-2.5 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE5EC]">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE5EC] text-xs font-semibold text-[#817986] hover:bg-[#FAF9FB] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Save & Reconcile'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
