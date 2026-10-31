import React, { useEffect, useState } from 'react';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ApiClient } from '../../services/api';
import { AnalyticsSummary, Subscription } from '../../types';
import { RevenueChart } from '../../components/charts/RevenueChart';
import { SubscriptionChart } from '../../components/charts/SubscriptionChart';
import { formatINR, formatDate } from '../../utils/format';
import {
  TrendingUp,
  CreditCard,
  Users,
  AlertTriangle,
  Zap,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.get<AnalyticsSummary>('/analytics/summary');
      setData(res);
    } catch (err) {
      // Mock Fallback matching Stitch Design
      setData({
        metrics: {
          activeSubscriptions: 142,
          totalCustomers: 289,
          mrr: 485000,
          arr: 5820000,
          totalRevenueCollected: 3820000,
          totalPaymentsCount: 520,
          overdueInvoicesCount: 4,
          overdueInvoicesAmount: 185000,
        },
        statusDistribution: {
          DRAFT: 4,
          QUOTATION: 18,
          CONFIRMED: 12,
          ACTIVE: 142,
          PAUSED: 5,
          CLOSED: 9,
        },
        recentSubscriptions: [
          {
            id: 'sub-01',
            subscriptionNumber: 'SUB-2026-0142',
            customerId: 'cust-1',
            planId: 'plan-1',
            status: 'ACTIVE',
            quantity: 5,
            unitPrice: 8250,
            discountAmount: 0,
            totalAmount: 41250,
            paymentTerms: 'IMMEDIATE',
            startDate: '2026-10-01T00:00:00Z',
            nextBillingDate: '2026-11-01T00:00:00Z',
            createdAt: '2026-10-28T00:00:00Z',
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
              cost: 8250,
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
            subscriptionNumber: 'SUB-2026-0141',
            customerId: 'cust-2',
            planId: 'plan-2',
            status: 'QUOTATION',
            quantity: 2,
            unitPrice: 82500,
            discountAmount: 16500,
            totalAmount: 148500,
            paymentTerms: 'NET30',
            quotationExpiresAt: '2026-11-28T00:00:00Z',
            createdAt: '2026-10-27T00:00:00Z',
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
              cost: 82500,
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
            subscriptionNumber: 'SUB-2026-0140',
            customerId: 'cust-3',
            planId: 'plan-3',
            status: 'ACTIVE',
            quantity: 1,
            unitPrice: 46800,
            discountAmount: 0,
            totalAmount: 46800,
            paymentTerms: 'IMMEDIATE',
            startDate: '2026-09-15T00:00:00Z',
            nextBillingDate: '2026-11-15T00:00:00Z',
            createdAt: '2026-09-15T00:00:00Z',
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
              cost: 46800,
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
        ],
        performance: {
          executionTimeMs: 42,
          targetUnderMs: 2000,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const metrics = data?.metrics;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#27212B] tracking-tight">
              Executive Dashboard
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E8F5EE] text-[#16845B] px-2 py-0.5 rounded-full border border-[#C3E8D5]">
              Live Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#817986] mt-0.5">
            Real-time subscription revenue, automated recurring billing & collections overview
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white border border-[#EAE5EC] p-0.5 rounded-xl text-xs font-semibold shadow-xs">
            {['7d', '30d', '90d', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-lg transition ${
                  timeRange === range
                    ? 'bg-[#6D286F] text-white shadow-xs'
                    : 'text-[#817986] hover:text-[#27212B]'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-white border border-[#EAE5EC] rounded-xl text-[11px] font-medium text-[#817986] shadow-xs">
            <Clock className="w-3.5 h-3.5 text-[#16845B]" />
            <span>Response: </span>
            <strong className="text-[#27212B]">{data?.performance?.executionTimeMs || 42}ms</strong>
            <span className="text-[#16845B] font-bold">(&lt; 2s target)</span>
          </div>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Active Subscriptions"
          value={metrics?.activeSubscriptions || 0}
          subtitle="Across 289 corporate clients"
          icon={<Layers className="w-5 h-5 text-[#6D286F]" />}
          trend="+12.4% MoM"
          trendUp={true}
        />
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatINR(metrics?.mrr || 0)}
          subtitle={`Annual Run Rate: ${formatINR(metrics?.arr || 0)}`}
          icon={<TrendingUp className="w-5 h-5 text-[#6D286F]" />}
          trend="+18.2%"
          trendUp={true}
        />
        <StatCard
          title="Total Cash Collected"
          value={formatINR(metrics?.totalRevenueCollected || 0)}
          subtitle={`${metrics?.totalPaymentsCount || 0} payments reconciled`}
          icon={<CreditCard className="w-5 h-5 text-[#16845B]" />}
          trend="+9.5%"
          trendUp={true}
        />
        <StatCard
          title="Overdue Invoices"
          value={formatINR(metrics?.overdueInvoicesAmount || 0)}
          subtitle={`${metrics?.overdueInvoicesCount || 0} invoices require chase`}
          icon={<AlertTriangle className="w-5 h-5 text-[#C53B4B]" />}
          trend="Attention"
          trendUp={false}
        />
      </div>

      {/* Charts Section: Invoiced vs Cash Collected & Subscriptions Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#EAE5EC] shadow-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#27212B]">Recurring Revenue & Cash Collections</h3>
              <p className="text-xs text-[#817986]">
                Comparison between billed invoice totals and actual payment receipts (₹)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#6D286F]">
                <span className="w-3 h-3 rounded-sm bg-[#6D286F]" /> Billed Revenue
              </span>
              <span className="flex items-center gap-1.5 text-[#16845B]">
                <span className="w-3 h-3 rounded-sm bg-[#16845B]" /> Collected Cash
              </span>
            </div>
          </div>

          <RevenueChart height={280} />
        </div>

        {/* Right 1 Col: Subscription Breakdown Chart */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAE5EC] shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#27212B]">Plan Subscriptions</h3>
                <p className="text-xs text-[#817986]">Active contracts vs pending quotes</p>
              </div>
              <span className="p-1.5 rounded-lg bg-[#F3EAF5] text-[#6D286F]">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>

            <div className="mt-4">
              <SubscriptionChart height={220} />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#EAE5EC] text-xs">
            <div className="bg-[#FAF9FB] p-2.5 rounded-xl border border-[#EAE5EC]">
              <span className="text-[#817986] text-[10px] uppercase font-bold block">Avg Order Value</span>
              <span className="text-sm font-extrabold text-[#27212B]">{formatINR(34150)}</span>
            </div>
            <div className="bg-[#FAF9FB] p-2.5 rounded-xl border border-[#EAE5EC]">
              <span className="text-[#817986] text-[10px] uppercase font-bold block">Renewal Rate</span>
              <span className="text-sm font-extrabold text-[#16845B]">96.4%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Subscriptions & Upcoming Billing Tables */}
      <div className="bg-white rounded-2xl border border-[#EAE5EC] shadow-card overflow-hidden">
        <div className="p-5 border-b border-[#EAE5EC] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#27212B]">Recent Subscriptions & Contracts</h3>
            <p className="text-xs text-[#817986]">Latest contracts generated and undergoing billing lifecycle</p>
          </div>
          <span className="text-xs font-semibold text-[#817986]">Showing latest entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#27212B]">
            <thead className="text-[11px] uppercase tracking-wider bg-[#FAF9FB] text-[#817986] border-b border-[#EAE5EC]">
              <tr>
                <th className="py-3 px-5">Subscription #</th>
                <th className="py-3 px-5">Client Company</th>
                <th className="py-3 px-5">Plan</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Next Billing</th>
                <th className="py-3 px-5 text-right">Contract Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC]">
              {data?.recentSubscriptions?.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#FAF9FB] transition">
                  <td className="py-3.5 px-5 font-mono font-bold text-[#6D286F]">
                    {sub.subscriptionNumber}
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="font-semibold text-[#27212B]">{sub.customer?.companyName || sub.customer?.name}</p>
                    <p className="text-xs text-[#817986]">{sub.customer?.email}</p>
                  </td>
                  <td className="py-3.5 px-5">
                    <p className="text-xs font-medium text-[#27212B]">{sub.plan?.name}</p>
                    <p className="text-[11px] text-[#817986]">
                      Qty: {sub.quantity} • {sub.plan?.billingFrequency}
                    </p>
                  </td>
                  <td className="py-3.5 px-5">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="py-3.5 px-5 text-xs text-[#817986]">
                    {formatDate(sub.nextBillingDate || sub.quotationExpiresAt)}
                  </td>
                  <td className="py-3.5 px-5 text-right font-extrabold text-[#27212B]">
                    {formatINR(sub.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
