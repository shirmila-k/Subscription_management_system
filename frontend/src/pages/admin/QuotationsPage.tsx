import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface QuoteLineItem {
  id: string;
  name: string;
  spec: string;
  qty: number;
  unitPrice: number;
  taxPercent: number;
  discountPercent: number;
}

interface QuoteRow {
  id: string;
  number: string;
  customer: string;
  gstin: string;
  plan: string;
  createdDate: string;
  validUntil: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Expired';
}

export const QuotationsPage: React.FC = () => {
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState<QuoteRow[]>([
    {
      id: 'qt-01',
      number: 'QT-2024-0891',
      customer: 'Acme Cloud Labs',
      gstin: '29AABCA1234F1Z5',
      plan: 'Enterprise Multi-Cloud SLA',
      createdDate: '24 Oct 2024',
      validUntil: '07 Nov 2024 (14d)',
      amount: 576000,
      status: 'Sent',
    },
    {
      id: 'qt-02',
      number: 'QT-2024-0892',
      customer: 'FinEdge Tech',
      gstin: '27AABCF9988G1ZQ',
      plan: 'Custom Compute Engine',
      createdDate: '22 Oct 2024',
      validUntil: '29 Oct 2024 (5d)',
      amount: 1420000,
      status: 'Accepted',
    },
    {
      id: 'qt-03',
      number: 'QT-2024-0893',
      customer: 'DataWeave Analytics',
      gstin: '06AAECD4432L1Z9',
      plan: 'Standard B2B Tier',
      createdDate: '25 Oct 2024',
      validUntil: '24 Nov 2024 (30d)',
      amount: 419608,
      status: 'Draft',
    },
    {
      id: 'qt-04',
      number: 'QT-2024-0888',
      customer: 'HyperLogix India',
      gstin: '33AAECP8871K1Z2',
      plan: 'Enterprise Multi-Cloud SLA',
      createdDate: '10 Oct 2024',
      validUntil: '24 Oct 2024 (Expired)',
      amount: 890000,
      status: 'Expired',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Quote Builder State
  const [builderCustomer, setBuilderCustomer] = useState('Acme Cloud Labs Pvt Ltd');
  const [builderTerms, setBuilderTerms] = useState('Net 30 Days');
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    {
      id: 'line-1',
      name: 'Cloud Sync Engine',
      spec: 'Variant: High Throughput Multi-Tenant API Hub',
      qty: 10,
      unitPrice: 35000,
      taxPercent: 18,
      discountPercent: 10,
    },
    {
      id: 'line-2',
      name: 'Odoo Connector Variant Surcharge',
      spec: 'Real-time webhook sync module for enterprise ledger',
      qty: 10,
      unitPrice: 560,
      taxPercent: 18,
      discountPercent: 0,
    },
  ]);

  const handleConvertToSubscription = (quoteNumber: string) => {
    setActionAlert(`Quotation ${quoteNumber} successfully converted to an active recurring subscription!`);
    setQuotes((prev) =>
      prev.map((q) => (q.number === quoteNumber ? { ...q, status: 'Accepted' } : q))
    );
    setTimeout(() => setActionAlert(null), 4000);
  };

  const calculateLineTotal = (item: QuoteLineItem) => {
    const raw = item.qty * item.unitPrice;
    const discounted = raw * (1 - item.discountPercent / 100);
    return discounted;
  };

  const subtotal = lineItems.reduce((acc, item) => acc + calculateLineTotal(item), 0);
  const taxAmount = subtotal * 0.18;
  const grandTotal = subtotal + taxAmount;

  const filteredQuotes = quotes.filter((q) => {
    const matchesSearch =
      q.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.plan.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'draft') return matchesSearch && q.status === 'Draft';
    if (activeTab === 'sent') return matchesSearch && q.status === 'Sent';
    if (activeTab === 'accepted') return matchesSearch && q.status === 'Accepted';
    if (activeTab === 'expired') return matchesSearch && q.status === 'Expired';
    return matchesSearch;
  });

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Action Notification Alert */}
      {actionAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center justify-between">
          <span>{actionAlert}</span>
          <button onClick={() => setActionAlert(null)} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#81737e] uppercase tracking-wider mb-1">
            <span>Revenue Operations</span>
            <span>•</span>
            <span>Pipeline Engine</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1f1924] tracking-tight">Quotations</h1>
          <p className="text-sm text-[#81737e] mt-0.5">
            Prepare offers, configure line item surcharges, and convert approved quotes into active recurring subscriptions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => alert('Exporting quotes to CSV...')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#EAE5EC] hover:bg-[#FAF9FB] text-xs font-medium text-[#1f1924] shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[18px] text-[#81737e]">file_download</span>
            <span>Export Quotes</span>
          </button>
          <a
            href="#quotation-builder"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6D286F] hover:bg-[#530D57] text-white text-xs font-semibold shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Create Quotation</span>
          </a>
        </div>
      </div>

      {/* 5 KPI Pipeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#81737e] font-medium">Total Pipeline</span>
            <span className="p-1 rounded-md bg-[#FAF9FB] text-[#6D286F]">
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1f1924]">148</span>
            <span className="text-xs text-[#81737e]">quotes</span>
          </div>
          <p className="text-xs text-[#81737e] mt-1">
            Pipeline: <span className="font-semibold text-[#6D286F]">₹1.84 Cr</span>
          </p>
          <div className="w-full bg-[#f5eaf9] h-1 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-[#6D286F] h-full w-[78%] rounded-full" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#81737e] font-medium">Drafts</span>
            <span className="p-1 rounded-md bg-[#FAF9FB] text-[#81737e]">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1f1924]">24</span>
            <span className="text-xs text-[#81737e]">pending edit</span>
          </div>
          <p className="text-xs text-[#81737e] mt-1">
            Value: <span className="font-semibold text-[#1f1924]">₹32.40 Lakh</span>
          </p>
          <div className="w-full bg-[#f5eaf9] h-1 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-[#81737e] h-full w-[24%] rounded-full" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#81737e] font-medium">Awaiting Acceptance</span>
            <span className="p-1 rounded-md bg-[#FAF9FB] text-[#84418A]">
              <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1f1924]">86</span>
            <span className="text-xs text-[#81737e]">in review</span>
          </div>
          <p className="text-xs text-[#81737e] mt-1">
            Hold: <span className="font-semibold text-[#84418A]">₹1.18 Cr</span>
          </p>
          <div className="w-full bg-[#f5eaf9] h-1 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-[#84418A] h-full w-[65%] rounded-full" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-xl bg-white border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#C53B4B] font-medium">Expiring Soon</span>
            <span className="p-1 rounded-md bg-[#FDF0F2] text-[#C53B4B]">
              <span className="material-symbols-outlined text-[18px]">alarm</span>
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#C53B4B]">12</span>
            <span className="text-xs text-[#C53B4B]">critical</span>
          </div>
          <p className="text-xs text-[#C53B4B] mt-1 font-medium">Action within 48 hrs</p>
          <div className="w-full bg-[#FDF0F2] h-1 rounded-full mt-2.5 overflow-hidden">
            <div className="bg-[#C53B4B] h-full w-[85%] rounded-full" />
          </div>
        </div>

        {/* Card 5: Grand Value */}
        <div className="p-4 rounded-xl bg-[#6D286F] text-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#d9a0d9]">Total Quoted Value</span>
              <span className="material-symbols-outlined text-[#ffd6f8] text-[20px]">
                account_balance_wallet
              </span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight mt-1 tabular-nums">
              ₹1,84,60,000
            </div>
          </div>
          <div className="pt-2 flex items-center justify-between text-[11px] text-[#eeb3ee]">
            <span>Conversion: 64.2%</span>
            <span className="text-white font-bold">+5.4% MoM</span>
          </div>
        </div>
      </div>

      {/* Tabs and Search Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-[#EAE5EC] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'All', count: 148 },
            { id: 'draft', label: 'Draft', count: 24 },
            { id: 'sent', label: 'Sent / Awaiting', count: 86 },
            { id: 'accepted', label: 'Accepted', count: 28 },
            { id: 'expired', label: 'Expired', count: 10 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-[#6D286F] text-white shadow-xs'
                  : 'bg-[#FAF9FB] text-[#1f1924] hover:bg-[#f5eaf9] border border-[#EAE5EC]'
              }`}
            >
              {tab.label} <span className="opacity-75">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#81737e] text-[18px]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#1f1924] placeholder:text-[#81737e] outline-none focus:border-[#6D286F]"
            placeholder="Filter by customer, ID..."
            type="text"
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF9FB] text-[#81737e] uppercase tracking-wider font-semibold border-b border-[#EAE5EC]">
              <tr>
                <th className="py-3 px-5">Quotation Number</th>
                <th className="py-3 px-5">Customer</th>
                <th className="py-3 px-5">Template / Plan</th>
                <th className="py-3 px-5">Created Date</th>
                <th className="py-3 px-5">Valid Until</th>
                <th className="py-3 px-5 text-right">Total Amount</th>
                <th className="py-3 px-5 text-center">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC] text-[#1f1924]">
              {filteredQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-[#FAF9FB] transition group">
                  <td className="py-3.5 px-5 font-semibold text-[#6D286F] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#81737e]">
                        description
                      </span>
                      <span>{q.number}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="font-semibold text-sm text-[#1f1924]">{q.customer}</div>
                    <span className="text-[10px] text-[#81737e] font-mono">GSTIN: {q.gstin}</span>
                  </td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#1f1924]">
                      {q.plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-[#81737e] whitespace-nowrap">{q.createdDate}</td>
                  <td className="py-3.5 px-5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        q.status === 'Accepted'
                          ? 'bg-emerald-50 text-emerald-700'
                          : q.status === 'Sent'
                          ? 'bg-[#FEF6E9] text-[#B7791F]'
                          : q.status === 'Expired'
                          ? 'bg-[#FDF0F2] text-[#C53B4B]'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {q.validUntil}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-bold tabular-nums whitespace-nowrap">
                    ₹{q.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-5 text-center whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        q.status === 'Accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : q.status === 'Sent'
                          ? 'bg-[#FEF6E9] text-[#B7791F]'
                          : q.status === 'Draft'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-[#FDF0F2] text-[#C53B4B]'
                      }`}
                    >
                      {q.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      {q.status !== 'Accepted' && (
                        <button
                          type="button"
                          onClick={() => handleConvertToSubscription(q.number)}
                          className="px-2.5 py-1 rounded bg-[#6D286F] text-white text-[11px] font-semibold hover:bg-[#530D57] transition shadow-xs"
                        >
                          Convert to Sub
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => alert(`Viewing PDF for ${q.number}`)}
                        className="p-1 rounded text-[#81737e] hover:text-[#1f1924] hover:bg-[#FAF9FB]"
                        title="Download PDF"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive In-Page Quotation Builder */}
      <div
        id="quotation-builder"
        className="w-full bg-white rounded-xl border border-[#EAE5EC] shadow-sm p-6 space-y-6"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2 border-b border-[#EAE5EC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] flex items-center justify-center text-[#6D286F]">
              <span className="material-symbols-outlined text-[24px]">tune</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1f1924]">
                  Quotation Builder: QT-2024-0893
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#f5eaf9] text-[#6D286F] text-xs font-semibold">
                  Draft Mode
                </span>
              </div>
              <p className="text-xs text-[#81737e]">
                Configure line items, apply promotional discounts, and calculate real-time GST taxes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#81737e]">Autosaved 2 mins ago</span>
          </div>
        </div>

        {/* Builder Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC]">
          <div>
            <label className="block text-xs font-semibold text-[#81737e] uppercase tracking-wider mb-1">
              Customer / Account
            </label>
            <select
              value={builderCustomer}
              onChange={(e) => setBuilderCustomer(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#EAE5EC] text-xs text-[#1f1924] outline-none"
            >
              <option>Acme Cloud Labs Pvt Ltd</option>
              <option>FinEdge Technologies</option>
              <option>DataWeave Analytics</option>
              <option>HyperLogix India</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#81737e] uppercase tracking-wider mb-1">
              Validity Period
            </label>
            <input
              readOnly
              value="30 Days - Valid until 24 Nov 2024"
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#EAE5EC] text-xs text-[#1f1924]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#81737e] uppercase tracking-wider mb-1">
              Payment Terms
            </label>
            <select
              value={builderTerms}
              onChange={(e) => setBuilderTerms(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-[#EAE5EC] text-xs text-[#1f1924] outline-none"
            >
              <option>Net 30 Days</option>
              <option>Net 15 Days</option>
              <option>Due On Receipt</option>
              <option>Advance 100%</option>
            </select>
          </div>
        </div>

        {/* Configured Line Items Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1f1924]">Configured Products &amp; Surcharges</h3>
            <button
              type="button"
              onClick={() =>
                setLineItems([
                  ...lineItems,
                  {
                    id: `line-${Date.now()}`,
                    name: 'Enterprise Dedicated Support SLA',
                    spec: 'Variant: 24/7 Named Engineer Allocation',
                    qty: 1,
                    unitPrice: 8000,
                    taxPercent: 18,
                    discountPercent: 0,
                  },
                ])
              }
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#6D286F] hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              <span>Add Custom Line Item</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#EAE5EC]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FB] text-[#81737e] uppercase tracking-wider font-semibold border-b border-[#EAE5EC]">
                <tr>
                  <th className="py-2.5 px-4">Product / Item Spec</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-center">Tax %</th>
                  <th className="py-2.5 px-3 text-center">Discount</th>
                  <th className="py-2.5 px-4 text-right">Line Total</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5EC] text-[#1f1924]">
                {lineItems.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-[#FAF9FB]">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs text-[#1f1924]">{item.name}</div>
                      <div className="text-[10px] text-[#81737e]">{item.spec}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        value={item.qty}
                        onChange={(e) => {
                          const updated = [...lineItems];
                          updated[idx].qty = parseInt(e.target.value) || 1;
                          setLineItems(updated);
                        }}
                        className="w-14 px-1.5 py-0.5 rounded border border-[#EAE5EC] text-center text-xs"
                        type="number"
                      />
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-medium">
                      ₹{item.unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-[#FAF9FB] border border-[#EAE5EC] text-[10px]">
                        {item.taxPercent}% GST
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.discountPercent > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                          {item.discountPercent}% Off
                        </span>
                      ) : (
                        <span className="text-[#81737e] text-[10px]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">
                      ₹{calculateLineTotal(item).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}
                          className="text-[#81737e] hover:text-[#ba1a1a]"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Summary Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#EAE5EC]">
          <div className="space-y-1 text-xs text-[#81737e]">
            <div>Tax Jurisdiction: Inter-State IGST 18% automatically calculated.</div>
            <div>Generated by Brightloop B2B Billing Architecture.</div>
          </div>

          <div className="w-full sm:w-72 space-y-2 p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC]">
            <div className="flex justify-between text-xs text-[#81737e]">
              <span>Taxable Subtotal</span>
              <span className="font-semibold text-[#1f1924] tabular-nums">
                ₹{subtotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#81737e]">
              <span>IGST (18%)</span>
              <span className="font-semibold text-[#1f1924] tabular-nums">
                ₹{taxAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-[#1f1924] pt-2 border-t border-[#EAE5EC]">
              <span>Final Grand Total</span>
              <span className="text-[#6D286F] tabular-nums">
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Builder Final Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => alert('Quotation draft saved!')}
            className="px-4 py-2 rounded-lg bg-white border border-[#EAE5EC] text-xs font-semibold text-[#1f1924] hover:bg-[#FAF9FB]"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleConvertToSubscription('QT-2024-0893')}
            className="px-5 py-2 rounded-lg bg-[#6D286F] hover:bg-[#530D57] text-white text-xs font-semibold shadow-xs"
          >
            Send &amp; Convert to Subscription
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationsPage;
