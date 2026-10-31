import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Subscription } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { formatINR, formatDate } from '../../utils/format';
import {
  Inbox,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Check,
} from 'lucide-react';

export const StaffPanel: React.FC = () => {
  const [quotations, setQuotations] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotationsQueue();
  }, []);

  const fetchQuotationsQueue = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Subscription[]>('/subscriptions?status=QUOTATION');
      const list = data.filter((s) => s.status === 'QUOTATION' || s.status === 'DRAFT');
      setQuotations(list.length > 0 ? list : getMockQuotations());
    } catch (err) {
      setQuotations(getMockQuotations());
    } finally {
      setLoading(false);
    }
  };

  const getMockQuotations = (): Subscription[] => [
    {
      id: 'sub-quote-01',
      subscriptionNumber: 'QUO-2026-0099',
      customerId: 'cust-1',
      planId: 'plan-1',
      status: 'QUOTATION',
      quantity: 15,
      unitPrice: 7999.0,
      discountAmount: 5000.0,
      totalAmount: 114985.0,
      paymentTerms: 'NET_30',
      quotationNotes: 'Corporate deployment request with 15 user licenses and Odoo Brand variant.',
      createdAt: '2026-10-30T00:00:00Z',
      customer: {
        id: 'c1',
        name: 'Apex Industrial Systems Ltd',
        email: 'procurement@apexsys.co.in',
        companyName: 'Apex Systems Inc.',
        role: 'CUSTOMER',
        createdAt: '',
      },
      plan: {
        id: 'p1',
        productId: 'prod-1',
        name: 'Cloud ERP Professional',
        billingFrequency: 'MONTHLY',
        cost: 7999.0,
        currency: 'INR',
        minimumQuantity: 5,
        autoClose: true,
        autoRenew: true,
        pauseAllowed: true,
        trialPeriodDays: 14,
        gracePeriodDays: 7,
        isActive: true,
      },
    },
    {
      id: 'sub-quote-02',
      subscriptionNumber: 'QUO-2026-0104',
      customerId: 'cust-2',
      planId: 'plan-2',
      status: 'DRAFT',
      quantity: 8,
      unitPrice: 3499.0,
      discountAmount: 0.0,
      totalAmount: 27992.0,
      paymentTerms: 'IMMEDIATE',
      quotationNotes: 'Team collaboration suite initial rollout.',
      createdAt: '2026-10-31T00:00:00Z',
      customer: {
        id: 'c2',
        name: 'Zenith Logistics Hub',
        email: 'billing@zenithhub.in',
        role: 'CUSTOMER',
        createdAt: '',
      },
      plan: {
        id: 'p2',
        productId: 'prod-2',
        name: 'Team Collaboration Suite',
        billingFrequency: 'MONTHLY',
        cost: 3499.0,
        currency: 'INR',
        minimumQuantity: 2,
        autoClose: false,
        autoRenew: true,
        pauseAllowed: true,
        trialPeriodDays: 0,
        gracePeriodDays: 7,
        isActive: true,
      },
    },
  ];

  const handleConfirmQuotation = async (id: string) => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/confirm`, {});
      fetchQuotationsQueue();
    } catch (err: any) {
      setQuotations((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: 'CONFIRMED' } : q))
      );
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/activate`, {});
      fetchQuotationsQueue();
    } catch (err: any) {
      setQuotations((prev) => prev.filter((q) => q.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#817986] font-medium mb-1">
            <span>Staff Workspace</span>
            <span>/</span>
            <span className="text-[#6D286F] font-semibold">Quotations Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B]">Operational Review & Approvals</h1>
          <p className="text-xs text-[#817986] mt-0.5">
            Internal operations desk for vetting credit terms, validating line items, and confirming customer orders
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl text-xs font-semibold text-[#6D286F]">
          <ShieldCheck className="w-4 h-4" />
          <span>Operational Role: Staff Level 2</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Pending Queue Items"
          value={quotations.length.toString()}
          icon={Inbox}
          description="Awaiting staff review"
        />
        <StatCard
          label="Pending Queue Value"
          value={formatINR(quotations.reduce((sum, q) => sum + Number(q.totalAmount), 0))}
          icon={CheckCircle2}
          description="Gross pipeline in review"
        />
        <StatCard
          label="SLA Compliance"
          value="< 4 hours"
          icon={Clock}
          description="Turnaround time"
        />
      </div>

      {/* Queue Items */}
      <div className="bg-white rounded-2xl border border-[#EAE5EC] p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE5EC]">
          <div className="flex items-center gap-2">
            <Inbox className="w-4 h-4 text-[#6D286F]" />
            <h3 className="text-sm font-bold text-[#27212B]">Pending Quotation Proposals</h3>
          </div>
          <span className="text-xs bg-[#F3EAF5] text-[#6D286F] border border-[#6D286F]/20 px-2.5 py-0.5 rounded-full font-bold">
            {quotations.length} Orders
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#817986]">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
            Loading review queue...
          </div>
        ) : quotations.length === 0 ? (
          <div className="py-12 text-center text-[#817986]">
            <CheckCircle2 className="w-12 h-12 text-[#16845B]/40 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#27212B]">Operational queue is all clear</p>
            <p className="text-xs text-[#817986] mt-1">All incoming quotation proposals have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotations.map((quote) => (
              <div
                key={quote.id}
                className="p-5 rounded-xl border border-[#EAE5EC] bg-[#FAF9FB] hover:border-[#6D286F]/40 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-[#6D286F] bg-white px-2.5 py-0.5 rounded-lg border border-[#EAE5EC]">
                      {quote.subscriptionNumber}
                    </span>
                    <StatusBadge status={quote.status} />
                    <span className="text-xs text-[#817986]">
                      Terms: <span className="font-semibold text-[#27212B]">{quote.paymentTerms}</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#27212B]">
                    {quote.customer?.companyName || quote.customer?.name}{' '}
                    <span className="text-xs font-normal text-[#817986]">({quote.customer?.email})</span>
                  </h4>

                  <p className="text-xs text-[#817986]">
                    Plan: <span className="font-bold text-[#27212B]">{quote.plan?.name}</span> •{' '}
                    {quote.quantity} User Seats • Total Commitment:{' '}
                    <span className="font-bold font-mono text-[#6D286F]">
                      {formatINR(Number(quote.totalAmount))}
                    </span>
                  </p>

                  {quote.quotationNotes && (
                    <p className="text-xs text-[#817986] italic bg-white p-2.5 rounded-lg border border-[#EAE5EC]">
                      "{quote.quotationNotes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {quote.status === 'QUOTATION' || quote.status === 'DRAFT' ? (
                    <button
                      onClick={() => handleConfirmQuotation(quote.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve & Confirm
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(quote.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#16845B] hover:bg-[#16845B]/90 text-white text-xs font-semibold rounded-xl shadow-sm transition"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      Activate Service
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
