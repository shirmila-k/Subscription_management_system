import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Subscription, Plan, QuotationTemplate, User } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { Button } from '../../components/Button';
import { SearchInput } from '../../components/SearchInput';
import { formatINR, formatDate } from '../../utils/format';
import {
  Play,
  Pause,
  XCircle,
  RefreshCw,
  Filter,
  Clock,
  Plus,
  FileText,
  FileCheck2,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const AdminSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [templates, setTemplates] = useState<QuotationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'templates'>('subscriptions');

  // Quotation form states
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [paymentTerms, setPaymentTerms] = useState('NET30');
  const [discountCode, setDiscountCode] = useState('');
  const [validityDays, setValidityDays] = useState('30');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchSubscriptions();
    fetchSupportData();
  }, [statusFilter]);

  const fetchSupportData = async () => {
    try {
      const [plansData, templatesData] = await Promise.all([
        ApiClient.get<Plan[]>('/plans'),
        ApiClient.get<QuotationTemplate[]>('/quotation-templates'),
      ]);
      setPlans(plansData);
      setTemplates(templatesData);
      if (plansData.length > 0) setSelectedPlanId(plansData[0].id);
    } catch (err) {
      // Mock Fallbacks matching Stitch Design
      setTemplates([
        {
          id: 'qt-1',
          name: 'Standard Corporate ERP Package',
          description: 'Pre-set offer template for mid-market clients with standard 30-day validity.',
          planId: 'p1',
          validityDays: 30,
          defaultPaymentTerms: 'NET30',
          defaultNotes: 'Includes standard onboarding and 10 user seats.',
          isActive: true,
        },
        {
          id: 'qt-2',
          name: 'Enterprise Cloud Acceleration Package',
          description: 'Dedicated cluster with 24/7 SLA and annual upfront billing.',
          planId: 'p2',
          validityDays: 45,
          defaultPaymentTerms: 'IMMEDIATE',
          defaultNotes: 'Priority 24/7 white-glove support included.',
          isActive: true,
        },
      ]);
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const endpoint =
        statusFilter === 'ALL'
          ? '/subscriptions'
          : `/subscriptions?status=${statusFilter}`;
      const data = await ApiClient.get<Subscription[]>(endpoint);
      setSubscriptions(data);
    } catch (err) {
      // Mock Fallback matching Stitch Design
      setSubscriptions([
        {
          id: 'sub-01',
          subscriptionNumber: 'SUB-2026-0001',
          customerId: 'cust-1',
          planId: 'plan-1',
          status: 'ACTIVE',
          quantity: 5,
          unitPrice: 8250.0,
          discountAmount: 0,
          totalAmount: 41250.0,
          paymentTerms: 'IMMEDIATE',
          startDate: '2026-01-01T00:00:00Z',
          expiryDate: '2027-01-01T00:00:00Z',
          nextBillingDate: '2026-11-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          customer: {
            id: 'c1',
            name: 'Acme Cloud Dynamics',
            email: 'billing@acmecloud.com',
            companyName: 'Acme Cloud Dynamics Ltd',
            role: 'CUSTOMER',
            createdAt: '',
          },
          plan: {
            id: 'p1',
            productId: 'prod-1',
            name: 'Cloud ERP Professional',
            billingFrequency: 'MONTHLY',
            cost: 8250.0,
            currency: 'INR',
            minimumQuantity: 1,
            autoClose: true,
            autoRenew: true,
            pauseAllowed: true,
            trialPeriodDays: 14,
            gracePeriodDays: 7,
            isActive: true,
          },
        },
        {
          id: 'sub-02',
          subscriptionNumber: 'SUB-2026-0002',
          customerId: 'cust-2',
          planId: 'plan-2',
          status: 'QUOTATION',
          quantity: 2,
          unitPrice: 82500.0,
          discountAmount: 16500.0,
          totalAmount: 148500.0,
          paymentTerms: 'NET30',
          quotationNotes: 'Sales quote generated from Corporate ERP template with 30-day price lock.',
          quotationExpiresAt: '2026-11-30T00:00:00Z',
          createdAt: '2026-10-25T00:00:00Z',
          customer: {
            id: 'c2',
            name: 'Indus Logistics Pvt Ltd',
            email: 'finance@induslogistics.in',
            companyName: 'Indus Logistics',
            role: 'CUSTOMER',
            createdAt: '',
          },
          plan: {
            id: 'p2',
            productId: 'prod-1',
            name: 'Cloud ERP Enterprise (Annual)',
            billingFrequency: 'YEARLY',
            cost: 82500.0,
            currency: 'INR',
            minimumQuantity: 1,
            autoClose: true,
            autoRenew: true,
            pauseAllowed: true,
            trialPeriodDays: 30,
            gracePeriodDays: 15,
            isActive: true,
          },
        },
        {
          id: 'sub-03',
          subscriptionNumber: 'SUB-2026-0003',
          customerId: 'cust-3',
          planId: 'plan-3',
          status: 'CONFIRMED',
          quantity: 1,
          unitPrice: 46800.0,
          discountAmount: 0,
          totalAmount: 46800.0,
          paymentTerms: 'NET15',
          startDate: '2026-11-01T00:00:00Z',
          createdAt: '2026-10-29T00:00:00Z',
          customer: {
            id: 'c3',
            name: 'Bharat Retail Solutions',
            email: 'accounts@bharatretail.com',
            companyName: 'Bharat Retail Ltd',
            role: 'CUSTOMER',
            createdAt: '',
          },
          plan: {
            id: 'p3',
            productId: 'prod-1',
            name: 'Odoo Connected Platform',
            billingFrequency: 'MONTHLY',
            cost: 46800.0,
            currency: 'INR',
            minimumQuantity: 1,
            autoClose: true,
            autoRenew: true,
            pauseAllowed: true,
            trialPeriodDays: 14,
            gracePeriodDays: 7,
            isActive: true,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'activate' | 'pause' | 'resume' | 'close' | 'renew' | 'confirm') => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/${action}`, {});
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message || `Failed to execute ${action}`);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const t = templates.find((item) => item.id === templateId);
    if (t) {
      setSelectedPlanId(t.planId);
      setPaymentTerms(t.defaultPaymentTerms || 'NET30');
      setValidityDays(t.validityDays ? String(t.validityDays) : '30');
      if (t.defaultNotes) setNotes(t.defaultNotes);
    }
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/subscriptions/quotation', {
        templateId: selectedTemplateId || undefined,
        planId: selectedPlanId,
        customerId: selectedCustomerId || 'cust-1',
        quantity: Number(quantity),
        paymentTerms,
        discountCode: discountCode || undefined,
        quotationNotes: notes,
        quotationExpiresInDays: Number(validityDays),
      });

      setIsQuoteModalOpen(false);
      setSelectedTemplateId('');
      setDiscountCode('');
      setNotes('');
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to create quotation');
    }
  };

  const filtered = subscriptions.filter(
    (sub) =>
      sub.subscriptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      (sub.customer?.name && sub.customer.name.toLowerCase().includes(search.toLowerCase())) ||
      (sub.customer?.companyName && sub.customer.companyName.toLowerCase().includes(search.toLowerCase())) ||
      (sub.plan?.name && sub.plan.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27212B] tracking-tight">
            Subscriptions & Sales Lifecycle
          </h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Progress contracts through stages: Draft &rarr; Quotation &rarr; Confirmed &rarr; Active &rarr; Closed
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-[#EAE5EC] p-0.5 rounded-xl text-xs font-semibold shadow-xs">
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'subscriptions'
                  ? 'bg-[#6D286F] text-white shadow-xs'
                  : 'text-[#817986] hover:text-[#27212B]'
              }`}
            >
              All Contracts ({subscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'templates'
                  ? 'bg-[#6D286F] text-white shadow-xs'
                  : 'text-[#817986] hover:text-[#27212B]'
              }`}
            >
              Quotation Templates ({templates.length})
            </button>
          </div>

          <Button
            onClick={() => setIsQuoteModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Quotation
          </Button>
        </div>
      </div>

      {activeTab === 'templates' ? (
        /* Quotation Templates View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#27212B] flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#6D286F]" />
                Standardized Quotation Templates
              </h3>
              <p className="text-xs text-[#817986]">
                Sales reps initiate deals from templates with pre-set terms and validity windows
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white p-6 rounded-2xl border border-[#EAE5EC] shadow-card hover:shadow-cardHover transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-bold text-[#27212B]">{tpl.name}</h4>
                    <p className="text-xs text-[#817986] mt-1">{tpl.description}</p>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F3EAF5] text-[#6D286F] border border-[#E5D1E8] font-semibold">
                    {tpl.validityDays} Days Validity
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#FAF9FB] p-3 rounded-xl border border-[#EAE5EC]">
                  <div>
                    <span className="text-[#817986] block text-[10px] uppercase font-bold">Default Terms</span>
                    <span className="font-semibold text-[#27212B]">{tpl.defaultPaymentTerms}</span>
                  </div>
                  <div>
                    <span className="text-[#817986] block text-[10px] uppercase font-bold">Target Plan</span>
                    <span className="font-semibold text-[#27212B]">{tpl.plan?.name || 'Standard Enterprise'}</span>
                  </div>
                </div>

                {tpl.defaultNotes && (
                  <p className="text-xs text-[#817986] italic bg-[#FAF9FB] p-2 rounded-lg border border-[#EAE5EC]">
                    "{tpl.defaultNotes}"
                  </p>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    handleTemplateSelect(tpl.id);
                    setActiveTab('subscriptions');
                    setIsQuoteModalOpen(true);
                  }}
                  className="w-full"
                  rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Create Offer Using This Template
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Subscriptions Pipeline View */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search contracts by number, company, or plan..."
              className="w-full max-w-md"
            />

            <div className="flex items-center gap-2 bg-white border border-[#EAE5EC] rounded-xl px-3 py-1.5 text-xs shadow-xs">
              <Filter className="w-3.5 h-3.5 text-[#817986]" />
              <span className="text-[#817986] font-semibold">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-[#27212B] font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL">All States (Full Pipeline)</option>
                <option value="DRAFT">Draft</option>
                <option value="QUOTATION">Quotation</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EAE5EC] shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#27212B]">
                <thead className="text-[11px] uppercase tracking-wider bg-[#FAF9FB] text-[#817986] border-b border-[#EAE5EC]">
                  <tr>
                    <th className="py-3.5 px-5">Subscription #</th>
                    <th className="py-3.5 px-5">Customer</th>
                    <th className="py-3.5 px-5">Plan & Cadence</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5">Next Billing / Expiry</th>
                    <th className="py-3.5 px-5">Total Value</th>
                    <th className="py-3.5 px-5 text-right">Lifecycle Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5EC]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#817986]">
                        <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
                        Fetching contracts...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#817986]">
                        No subscriptions found matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#FAF9FB] transition">
                        <td className="py-3.5 px-5 font-mono font-bold text-[#6D286F]">
                          {sub.subscriptionNumber}
                        </td>
                        <td className="py-3.5 px-5">
                          <p className="font-semibold text-[#27212B]">{sub.customer?.name}</p>
                          <p className="text-xs text-[#817986]">{sub.customer?.companyName || sub.customer?.email}</p>
                        </td>
                        <td className="py-3.5 px-5">
                          <p className="text-xs font-semibold text-[#27212B]">{sub.plan?.name}</p>
                          <p className="text-[11px] text-[#817986]">
                            Qty: {sub.quantity} • {sub.plan?.billingFrequency} • Terms: {sub.paymentTerms}
                          </p>
                        </td>
                        <td className="py-3.5 px-5">
                          <StatusBadge status={sub.status} />
                        </td>
                        <td className="py-3.5 px-5 text-xs text-[#817986]">
                          {sub.nextBillingDate
                            ? `Billing: ${formatDate(sub.nextBillingDate)}`
                            : sub.quotationExpiresAt
                            ? `Quote exp: ${formatDate(sub.quotationExpiresAt)}`
                            : '—'}
                        </td>
                        <td className="py-3.5 px-5 font-extrabold text-[#27212B]">
                          {formatINR(sub.totalAmount)}
                          {Number(sub.discountAmount) > 0 && (
                            <span className="block text-[10px] text-[#16845B]">
                              (-{formatINR(sub.discountAmount)})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-right space-x-1">
                          {sub.status === 'QUOTATION' && (
                            <button
                              onClick={() => handleAction(sub.id, 'confirm')}
                              title="Confirm Quotation into contract"
                              className="px-2.5 py-1 text-xs bg-[#6D286F] hover:bg-[#581F5A] text-white rounded-lg transition font-semibold"
                            >
                              Confirm
                            </button>
                          )}
                          {sub.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleAction(sub.id, 'activate')}
                              title="Activate Subscription"
                              className="px-2.5 py-1 text-xs bg-[#16845B] hover:bg-[#126b4a] text-white rounded-lg transition font-semibold"
                            >
                              Activate
                            </button>
                          )}
                          {sub.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => handleAction(sub.id, 'pause')}
                                title="Pause Subscription"
                                className="p-1.5 text-xs text-[#B7791F] hover:bg-[#FEF7EC] rounded-lg transition"
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleAction(sub.id, 'renew')}
                                title="Trigger Instant Renewal"
                                className="p-1.5 text-xs text-[#6D286F] hover:bg-[#F3EAF5] rounded-lg transition"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {sub.status === 'PAUSED' && (
                            <button
                              onClick={() => handleAction(sub.id, 'resume')}
                              title="Resume Subscription"
                              className="p-1.5 text-xs text-[#16845B] hover:bg-[#E8F5EE] rounded-lg transition"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          {sub.status !== 'CLOSED' && (
                            <button
                              onClick={() => handleAction(sub.id, 'close')}
                              title="Close Contract"
                              className="p-1.5 text-xs text-[#C53B4B] hover:bg-[#FDF0F2] rounded-lg transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating Quotation */}
      <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} title="Generate New Sales Quotation" maxWidth="xl">
        <form onSubmit={handleCreateQuotation} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">
              Start from Quotation Template (Optional)
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            >
              <option value="">Custom Quotation (No Template)</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.validityDays}d validity, {tpl.defaultPaymentTerms})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Target Pricing Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              required
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatINR(p.cost)}/{p.billingFrequency.toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Seats / Quantity</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              >
                <option value="IMMEDIATE">Immediate (Upon Invoice)</option>
                <option value="NET15">Net 15 Days</option>
                <option value="NET30">Net 30 Days</option>
                <option value="NET60">Net 60 Days</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Validity Period (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                placeholder="30"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Discount Promo Code</label>
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME20"
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Quotation Notes & Scope</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Enterprise discount for 10 seats valid for 30 days..."
              className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-[#EAE5EC]">
            <Button type="button" variant="outline" onClick={() => setIsQuoteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Generate Quotation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminSubscriptions;
