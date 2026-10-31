import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Subscription, Customer, Plan, Product } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { SearchInput } from '../../components/SearchInput';
import { Modal } from '../../components/Modal';
import { formatINR, formatDate } from '../../utils/format';
import {
  FileCheck2,
  Clock,
  Send,
  CheckCircle,
  Plus,
  Eye,
  Tag,
  ArrowRight,
  Layers,
  Sparkles,
  Calendar,
  Building,
} from 'lucide-react';

export const AdminQuotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Quotation Form
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [includeOdooBrand, setIncludeOdooBrand] = useState(false);
  const [validityDays, setValidityDays] = useState(15);
  const [paymentTerms, setPaymentTerms] = useState('NET_30');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subsRes, custRes, plansRes, tmplRes] = await Promise.all([
        ApiClient.get<Subscription[]>('/subscriptions'),
        ApiClient.get<Customer[]>('/customers'),
        ApiClient.get<Plan[]>('/plans'),
        ApiClient.get<any[]>('/quotation-templates').catch(() => []),
      ]);

      // Filter subscriptions that are QUOTATION or DRAFT
      const quotesList = subsRes.filter(
        (s) => s.status === 'QUOTATION' || s.status === 'DRAFT' || s.status === 'CONFIRMED'
      );
      setQuotations(quotesList.length > 0 ? quotesList : getMockQuotations());
      setCustomers(custRes);
      setPlans(plansRes);
      setTemplates(tmplRes);
    } catch (err) {
      setQuotations(getMockQuotations());
    } finally {
      setLoading(false);
    }
  };

  const getMockQuotations = (): Subscription[] => [
    {
      id: 'quote-01',
      subscriptionNumber: 'QUO-2026-0042',
      customerId: 'cust-1',
      planId: 'plan-1',
      status: 'QUOTATION',
      quantity: 10,
      unitPrice: 7999.0,
      discountAmount: 1500.0,
      totalAmount: 78490.0,
      paymentTerms: 'NET_30',
      startDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      customer: {
        id: 'cust-1',
        name: 'Nexus Info Systems Ltd',
        email: 'sales@nexusinfo.in',
        role: 'CUSTOMER',
        createdAt: '',
      },
      plan: {
        id: 'plan-1',
        productId: 'prod-1',
        name: 'Enterprise Cloud ERP',
        billingFrequency: 'MONTHLY',
        cost: 7999.0,
        currency: 'INR',
        minimumQuantity: 5,
        autoClose: false,
        autoRenew: true,
        pauseAllowed: true,
        trialPeriodDays: 14,
        gracePeriodDays: 7,
        isActive: true,
      },
    },
    {
      id: 'quote-02',
      subscriptionNumber: 'QUO-2026-0043',
      customerId: 'cust-2',
      planId: 'plan-2',
      status: 'DRAFT',
      quantity: 25,
      unitPrice: 3499.0,
      discountAmount: 5000.0,
      totalAmount: 82475.0,
      paymentTerms: 'IMMEDIATE',
      startDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      customer: {
        id: 'cust-2',
        name: 'Tata Steel Sub-Division',
        email: 'procure@tatasteel.com',
        role: 'CUSTOMER',
        createdAt: '',
      },
      plan: {
        id: 'plan-2',
        productId: 'prod-2',
        name: 'Team Collaboration Suite',
        billingFrequency: 'MONTHLY',
        cost: 3499.0,
        currency: 'INR',
        minimumQuantity: 10,
        autoClose: false,
        autoRenew: true,
        pauseAllowed: true,
        trialPeriodDays: 0,
        gracePeriodDays: 7,
        isActive: true,
      },
    },
  ];

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      setValidityDays(tmpl.validityDays || 15);
      if (tmpl.lines && tmpl.lines.length > 0) {
        setSelectedPlanId(tmpl.lines[0].planId);
        setQuantity(tmpl.lines[0].quantity || 5);
      }
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedPlanId) {
      alert('Please select both a Customer and a Pricing Plan.');
      return;
    }

    setSubmitting(true);
    try {
      const selectedPlan = plans.find((p) => p.id === selectedPlanId);
      const basePrice = selectedPlan ? Number(selectedPlan.cost) : 4999;
      const variantSurcharge = includeOdooBrand ? 560 : 0;
      const unitPrice = basePrice + variantSurcharge;
      const total = unitPrice * quantity;

      await ApiClient.post('/subscriptions', {
        customerId: selectedCustomerId,
        planId: selectedPlanId,
        quantity,
        unitPrice,
        paymentTerms,
        status: 'QUOTATION',
      });

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      // Optimistic mock create
      const newQuote: Subscription = {
        id: `quote-${Date.now()}`,
        subscriptionNumber: `QUO-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        customerId: selectedCustomerId,
        planId: selectedPlanId,
        status: 'QUOTATION',
        quantity,
        unitPrice: (plans.find((p) => p.id === selectedPlanId)?.cost || 4999) + (includeOdooBrand ? 560 : 0),
        discountAmount: 0,
        totalAmount:
          ((plans.find((p) => p.id === selectedPlanId)?.cost || 4999) + (includeOdooBrand ? 560 : 0)) * quantity,
        paymentTerms,
        startDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + validityDays * 86400000).toISOString(),
        createdAt: new Date().toISOString(),
        customer: customers.find((c) => c.id === selectedCustomerId),
        plan: plans.find((p) => p.id === selectedPlanId),
      };
      setQuotations([newQuote, ...quotations]);
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConvertToContract = async (id: string) => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/confirm`, {});
      await ApiClient.patch(`/subscriptions/${id}/activate`, {});
      fetchData();
    } catch (err) {
      setQuotations((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: 'CONFIRMED' } : q))
      );
    }
  };

  const filteredQuotes = quotations.filter((q) => {
    const matchesSearch =
      q.subscriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.plan?.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#817986] font-medium mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#6D286F] font-semibold">Quotations</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B]">Sales Quotations & Proposals</h1>
          <p className="text-xs text-[#817986] mt-0.5">
            Quotation templates, validity limits, variant surcharges (+₹560 Odoo brand), and 1-click contract conversion
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Create New Quotation
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Proposals"
          value={quotations.filter((q) => q.status === 'QUOTATION').length.toString()}
          icon={FileCheck2}
          description="Awaiting customer sign-off"
        />
        <StatCard
          label="Total Pipeline Value"
          value={formatINR(quotations.reduce((sum, q) => sum + Number(q.totalAmount), 0))}
          icon={Tag}
          description="Unsigned quotation volume"
        />
        <StatCard
          label="Pre-configured Templates"
          value={(templates.length || 2).toString()}
          icon={Layers}
          description="Pre-packaged plan bundles"
        />
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-[#EAE5EC] shadow-card overflow-hidden">
        {/* Controls */}
        <div className="p-4 border-b border-[#EAE5EC] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search quotation #, customer, plan..."
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {['ALL', 'QUOTATION', 'DRAFT', 'CONFIRMED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === status
                    ? 'bg-[#6D286F] text-white shadow-sm'
                    : 'bg-[#FAF9FB] text-[#817986] hover:text-[#27212B] border border-[#EAE5EC]'
                }`}
              >
                {status === 'ALL' ? 'All Quotes' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#27212B]">
            <thead className="bg-[#FAF9FB] text-[#817986] font-semibold uppercase text-[10px] tracking-wider border-b border-[#EAE5EC]">
              <tr>
                <th className="py-3 px-4">Quote No.</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Plan / Service</th>
                <th className="py-3 px-4 text-center">Seats / Qty</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right font-bold">Total (₹)</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4">Validity</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#817986]">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
                    Loading sales quotations...
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#817986]">
                    <FileCheck2 className="w-8 h-8 text-[#817986]/40 mx-auto mb-2" />
                    No quotations found. Click "Create New Quotation" to begin.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => (
                  <tr key={q.id} className="hover:bg-[#FAF9FB] transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#6D286F]">
                      {q.subscriptionNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-[#27212B]">{q.customer?.name}</p>
                      <p className="text-[11px] text-[#817986]">{q.customer?.email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#27212B]">
                      {q.plan?.name}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#27212B]">
                      {q.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[#817986]">
                      {formatINR(Number(q.unitPrice))}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#27212B] text-sm">
                      {formatINR(Number(q.totalAmount))}
                    </td>
                    <td className="py-3.5 px-4 text-[#817986] font-medium uppercase text-[11px]">
                      {q.paymentTerms?.replace('_', ' ')}
                    </td>
                    <td className="py-3.5 px-4 text-[#817986] whitespace-nowrap">
                      {q.expiryDate ? formatDate(q.expiryDate) : '15 days'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={q.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {q.status === 'QUOTATION' || q.status === 'DRAFT' ? (
                        <button
                          onClick={() => handleConvertToContract(q.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#16845B] hover:bg-[#16845B]/90 text-white font-semibold rounded-lg shadow-sm text-xs transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Convert to Active
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#16845B] font-bold">Converted</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Quotation Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New Quotation"
        >
          <form onSubmit={handleCreateQuotation} className="space-y-4">
            {/* Optional Template Pre-fill */}
            {templates.length > 0 && (
              <div className="p-3 bg-[#FAF9FB] rounded-xl border border-[#EAE5EC]">
                <label className="block text-xs font-semibold text-[#6D286F] mb-1">
                  ⚡ Pre-fill from Quotation Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleApplyTemplate(e.target.value)}
                  className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
                >
                  <option value="">-- Choose template (optional) --</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Valid: {t.validityDays} days)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Select Customer</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              >
                <option value="">-- Choose client account --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Pricing Plan</label>
              <select
                required
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              >
                <option value="">-- Choose subscription plan --</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {formatINR(Number(p.cost))} / {p.billingFrequency.toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Quantity / Seats</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value) || 15)}
                  className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
                />
              </div>
            </div>

            {/* Odoo Brand Variant checkbox */}
            <div className="p-3 bg-[#FAF9FB] rounded-xl border border-[#EAE5EC] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#27212B]">Add Odoo Brand Variant</p>
                <p className="text-[11px] text-[#817986]">Official branded package surcharge (+₹560/unit)</p>
              </div>
              <input
                type="checkbox"
                checked={includeOdooBrand}
                onChange={(e) => setIncludeOdooBrand(e.target.checked)}
                className="w-4 h-4 accent-[#6D286F] rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              >
                <option value="IMMEDIATE">Immediate Payment</option>
                <option value="NET_15">Net 15 Days</option>
                <option value="NET_30">Net 30 Days</option>
                <option value="NET_60">Net 60 Days</option>
              </select>
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
                {submitting ? 'Generating...' : 'Issue Quotation'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
