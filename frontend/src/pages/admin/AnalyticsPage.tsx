import React, { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../../services';
import {
  AnalyticsOverview,
  RevenueAnalytics,
  SubscriptionAnalytics,
  CustomerAnalytics,
  BillingAnalytics,
  ProductAnalytics,
} from '../../types';
import { AreaChart } from '../../components/charts/AreaChart';
import { BarChart } from '../../components/charts/BarChart';
import { DonutChart } from '../../components/charts/DonutChart';

type TabView = 'overview' | 'revenue' | 'subscriptions' | 'customers' | 'products';
type PeriodKey = 'last7Days' | 'last30Days' | 'currentMonth' | 'previousMonth' | 'last6Months' | 'last12Months' | 'all' | 'custom';

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('overview');
  const [period, setPeriod] = useState<PeriodKey>('last30Days');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [customError, setCustomError] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [subData, setSubData] = useState<SubscriptionAnalytics | null>(null);
  const [customerData, setCustomerData] = useState<CustomerAnalytics | null>(null);
  const [billingData, setBillingData] = useState<BillingAnalytics | null>(null);
  const [productData, setProductData] = useState<ProductAnalytics | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getQueryParams = useCallback(() => {
    if (period === 'custom') {
      return { period: 'custom', startDate: customStart, endDate: customEnd };
    }
    return { period };
  }, [period, customStart, customEnd]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = getQueryParams();
      const [ov, rev, subs, custs, bills, prods] = await Promise.all([
        analyticsService.getOverview(params),
        analyticsService.getRevenue(params),
        analyticsService.getSubscriptions(params),
        analyticsService.getCustomers(params),
        analyticsService.getBilling(params),
        analyticsService.getProducts(),
      ]);

      setOverview(ov);
      setRevenueData(rev);
      setSubData(subs);
      setCustomerData(custs);
      setBillingData(bills);
      setProductData(prods);
    } catch (err: any) {
      console.error('Analytics load error:', err);
      setError(err.message || 'Failed to fetch business analytics. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, [getQueryParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);
    if (!customStart || !customEnd) {
      setCustomError('Please select both start and end dates.');
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      setCustomError('Start date cannot be after end date.');
      return;
    }
    setPeriod('custom');
    setShowCustomModal(false);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsExporting(true);
      await analyticsService.downloadPdf(getQueryParams());
      showToast('Executive Analytics PDF generated and downloaded successfully.');
    } catch (err: any) {
      showToast(`Export failed: ${err.message || 'Could not generate PDF'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCsv = async (type = 'summary') => {
    try {
      setIsExporting(true);
      await analyticsService.downloadCsv(type, getQueryParams());
      showToast(`Analytics ${type.toUpperCase()} CSV report downloaded.`);
    } catch (err: any) {
      showToast(`Export failed: ${err.message || 'Could not generate CSV'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (val: number | undefined) => {
    const num = val ?? 0;
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const kpis = overview?.kpis;

  const statusDonutData = [
    { label: 'Active', value: kpis?.activeSubscriptions ?? 0, color: '#10B981' },
    { label: 'Quotation', value: kpis?.quotationsPending ?? 0, color: '#F59E0B' },
    { label: 'Draft', value: kpis?.draftSubscriptions ?? 0, color: '#94A3B8' },
    { label: 'Paused', value: kpis?.pausedSubscriptions ?? 0, color: '#8B5CF6' },
    { label: 'Closed', value: kpis?.closedSubscriptions ?? 0, color: '#64748B' },
    { label: 'Cancelled', value: kpis?.cancelledSubscriptions ?? 0, color: '#EF4444' },
  ];

  const paymentMethodDonutData = (revenueData?.revenueByPaymentMethod || []).map((m, idx) => {
    const colors = ['#6D286F', '#84418A', '#2563EB', '#0D9488', '#F59E0B', '#64748B'];
    return {
      label: m.method.replace('_', ' '),
      value: m.revenue,
      color: colors[idx % colors.length],
    };
  });

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#27212B] text-white px-4 py-3 rounded-xl shadow-2xl border border-[#6D286F] animate-fade-in text-xs font-medium">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#84418A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Executive Intelligence</span>
            <span>•</span>
            <span>Persisted Database Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">Executive Business &amp; Analytics</h1>
          <p className="text-xs text-[#817986] mt-0.5">
            Holistic recurring revenue trajectory, subscription health, receivables aging, and product realization.
          </p>
        </div>

        {/* Global Controls: Period Filters & Export Center */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Period Selector Tabs */}
          <div className="flex items-center bg-white border border-[#EAE5EC] rounded-lg p-1 shadow-xs text-xs font-medium">
            {[
              { id: 'last7Days', label: '7D' },
              { id: 'last30Days', label: '30D' },
              { id: 'currentMonth', label: 'This Month' },
              { id: 'previousMonth', label: 'Prev Month' },
              { id: 'last6Months', label: '6M' },
              { id: 'last12Months', label: '1Y' },
              { id: 'all', label: 'All' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setPeriod(t.id as PeriodKey)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  period === t.id
                    ? 'bg-[#6D286F] text-white shadow-xs font-semibold'
                    : 'text-[#817986] hover:text-[#27212B]'
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              onClick={() => setShowCustomModal(true)}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                period === 'custom'
                  ? 'bg-[#6D286F] text-white shadow-xs font-semibold'
                  : 'text-[#817986] hover:text-[#27212B]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              <span>{period === 'custom' && customStart ? `${customStart.slice(5)} to ${customEnd.slice(5)}` : 'Custom'}</span>
            </button>
          </div>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting || loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF9FB] hover:bg-[#F3EAF5] text-[#27212B] border border-[#EAE5EC] text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
              title="Download executive PDF summary"
            >
              <span className="material-symbols-outlined text-[16px] text-[#6D286F]">picture_as_pdf</span>
              <span>{isExporting ? 'Exporting...' : 'PDF Report'}</span>
            </button>

            <button
              onClick={() => handleDownloadCsv('summary')}
              disabled={isExporting || loading}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF9FB] hover:bg-[#F3EAF5] text-[#27212B] border border-[#EAE5EC] text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
              title="Download KPI summary CSV"
            >
              <span className="material-symbols-outlined text-[16px] text-emerald-600">csv</span>
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EAE5EC] p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#27212B]">Custom Reporting Period</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-[#817986] hover:text-[#27212B] text-sm"
              >
                ✕
              </button>
            </div>
            {customError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {customError}
              </div>
            )}
            <form onSubmit={handleApplyCustomRange} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Start Date (Inclusive)</label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9FB] border border-[#EAE5EC] rounded-lg text-[#27212B] outline-none focus:border-[#6D286F]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">End Date (Inclusive)</label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FAF9FB] border border-[#EAE5EC] rounded-lg text-[#27212B] outline-none focus:border-[#6D286F]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#817986] hover:text-[#27212B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-[#6D286F] text-white rounded-lg shadow-xs hover:bg-[#581F59]"
                >
                  Apply Filter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Banner with Retry */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[22px] text-rose-600">error</span>
            <div>
              <p className="font-bold">Error loading analytics data</p>
              <p className="text-rose-700">{error}</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-white border border-rose-300 rounded-lg text-rose-700 font-semibold hover:bg-rose-100 transition-colors shadow-xs"
          >
            Retry Query
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !overview && (
        <div className="w-full p-12 bg-white rounded-2xl border border-[#EAE5EC] flex flex-col items-center justify-center text-xs text-[#817986]">
          <span className="material-symbols-outlined text-[32px] text-[#6D286F] animate-spin mb-2">
            progress_activity
          </span>
          <p className="font-semibold text-[#27212B]">Aggregating financial &amp; subscriber metrics...</p>
          <span className="text-[11px] text-[#A69FA9] mt-0.5">Running index-optimized queries on MySQL database</span>
        </div>
      )}

      {/* Core KPI Bento Grid (6 Key Performance Indicator Cards) */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Collected Revenue */}
          <div className="p-4 bg-white rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#817986] text-[11px] font-semibold uppercase tracking-wider mb-1">
                <span>Collected Revenue</span>
                <span className="material-symbols-outlined text-[16px] text-emerald-600">payments</span>
              </div>
              <div className="text-xl font-extrabold text-[#27212B] tracking-tight">
                {formatCurrency(kpis?.totalCollectedRevenue)}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#F3EAF5] flex items-center justify-between text-[11px]">
              <span className="text-[#817986]">MoM Growth:</span>
              <span
                className={`font-semibold flex items-center ${
                  (kpis?.revenueGrowthPercent ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {(kpis?.revenueGrowthPercent ?? 0) >= 0 ? '+' : ''}
                {kpis?.revenueGrowthPercent}%
              </span>
            </div>
          </div>

          {/* Card 2: Normalized MRR */}
          <div className="p-4 bg-white rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#817986] text-[11px] font-semibold uppercase tracking-wider mb-1">
                <span>Normalized MRR</span>
                <span className="material-symbols-outlined text-[16px] text-[#6D286F]">sync</span>
              </div>
              <div className="text-xl font-extrabold text-[#27212B] tracking-tight">
                {formatCurrency(kpis?.mrr)}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#F3EAF5] flex items-center justify-between text-[11px]">
              <span className="text-[#817986]">ARR Run Rate:</span>
              <span className="font-semibold text-[#6D286F]">{formatCurrency(kpis?.arr)}</span>
            </div>
          </div>

          {/* Card 3: Active Subscriptions */}
          <div className="p-4 bg-white rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#817986] text-[11px] font-semibold uppercase tracking-wider mb-1">
                <span>Active Subscriptions</span>
                <span className="material-symbols-outlined text-[16px] text-emerald-600">loyalty</span>
              </div>
              <div className="text-xl font-extrabold text-[#27212B] tracking-tight">
                {kpis?.activeSubscriptions.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#F3EAF5] flex items-center justify-between text-[11px]">
              <span className="text-[#817986]">Total Portfolio:</span>
              <span className="font-semibold text-[#27212B]">{kpis?.totalSubscriptions} subs</span>
            </div>
          </div>

          {/* Card 4: Registered Customers */}
          <div className="p-4 bg-white rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#817986] text-[11px] font-semibold uppercase tracking-wider mb-1">
                <span>Customers</span>
                <span className="material-symbols-outlined text-[16px] text-blue-600">group</span>
              </div>
              <div className="text-xl font-extrabold text-[#27212B] tracking-tight">
                {kpis?.totalCustomers.toLocaleString()}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#F3EAF5] flex items-center justify-between text-[11px]">
              <span className="text-[#817986]">New this month:</span>
              <span className="font-semibold text-emerald-600">+{kpis?.newCustomersThisMonth}</span>
            </div>
          </div>

          {/* Card 5: Invoiced Volume */}
          <div className="p-4 bg-white rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#817986] text-[11px] font-semibold uppercase tracking-wider mb-1">
                <span>Invoiced Amount</span>
                <span className="material-symbols-outlined text-[16px] text-amber-600">receipt_long</span>
              </div>
              <div className="text-xl font-extrabold text-[#27212B] tracking-tight">
                {formatCurrency(kpis?.totalInvoicedAmount)}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#F3EAF5] flex items-center justify-between text-[11px]">
              <span className="text-[#817986]">Total Invoices:</span>
              <span className="font-semibold text-[#27212B]">{kpis?.totalInvoicesCount}</span>
            </div>
          </div>

          {/* Card 6: Outstanding Receivables */}
          <div className="p-4 bg-white rounded-xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[#817986] text-[11px] font-semibold uppercase tracking-wider mb-1">
                <span>Outstanding Balance</span>
                <span className="material-symbols-outlined text-[16px] text-rose-600">pending_actions</span>
              </div>
              <div className="text-xl font-extrabold text-[#C53B4B] tracking-tight">
                {formatCurrency(kpis?.outstandingBalanceTotal)}
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#F3EAF5] flex items-center justify-between text-[11px]">
              <span className="text-[#817986]">Overdue:</span>
              <span className="font-semibold text-rose-600">
                {kpis?.overdueInvoicesCount} ({formatCurrency(kpis?.overdueInvoicesAmount)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Sub-Views Tabs */}
      <div className="border-b border-[#EAE5EC]">
        <nav className="flex space-x-6 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Executive Overview', icon: 'dashboard' },
            { id: 'revenue', label: 'Revenue Analytics', icon: 'monitoring' },
            { id: 'subscriptions', label: 'Subscription Health', icon: 'published_with_changes' },
            { id: 'customers', label: 'Customer Acquisition', icon: 'person_add' },
            { id: 'products', label: 'Products & Plans', icon: 'inventory_2' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabView)}
              className={`flex items-center gap-1.5 pb-3 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[#6D286F] text-[#6D286F]'
                  : 'border-transparent text-[#817986] hover:text-[#27212B]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Charts Row: Revenue Trend & Portfolio Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend Over Time */}
            <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#27212B]">Realized Revenue Trajectory</h3>
                  <p className="text-[11px] text-[#817986]">Successful payment inflows across {overview?.periodLabel}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6D286F]" />
                  <span className="text-xs font-medium text-[#817986]">INR Collected (₹)</span>
                </div>
              </div>
              <AreaChart
                data={revenueData?.revenueTrend.map((t) => ({ label: t.label, value: t.revenue })) || []}
                height={230}
                color="#6D286F"
                fillColor="#84418A"
                emptyMessage="No successful payments recorded during this period."
              />
            </div>

            {/* Subscription Status Donut */}
            <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
              <div className="mb-2">
                <h3 className="text-sm font-bold text-[#27212B]">Subscription Portfolio</h3>
                <p className="text-[11px] text-[#817986]">Distribution across contract lifecycle states</p>
              </div>
              <DonutChart
                data={statusDonutData}
                size={180}
                centerTitle={String(kpis?.totalSubscriptions ?? 0)}
                centerSubtitle="Total Subs"
              />
              <div className="mt-4 pt-3 border-t border-[#EAE5EC] flex items-center justify-between text-xs text-[#817986]">
                <span>Active Retention Rate:</span>
                <span className="font-bold text-emerald-600">{subData?.retentionRate ?? 100}%</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Upcoming Renewals & Recent Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Renewals in Next 30 Days */}
            <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#6D286F]">event_repeat</span>
                  <h3 className="text-sm font-bold text-[#27212B]">Renewals Pipeline (Next 30 Days)</h3>
                </div>
                <span className="text-[11px] font-semibold text-[#84418A] bg-[#F3EAF5] px-2 py-0.5 rounded-full">
                  {subData?.upcomingRenewals.length ?? 0} Due
                </span>
              </div>

              {!subData?.upcomingRenewals || subData.upcomingRenewals.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#EAE5EC] rounded-xl text-xs text-[#817986]">
                  No subscriptions currently scheduled for renewal in the next 30 days.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#EAE5EC] text-[#817986] font-semibold">
                        <th className="pb-2">Subscription</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Plan</th>
                        <th className="pb-2">Renewal Date</th>
                        <th className="pb-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3EAF5]">
                      {subData.upcomingRenewals.slice(0, 5).map((sub) => (
                        <tr key={sub.id} className="hover:bg-[#FAF9FB]">
                          <td className="py-2.5 font-mono font-semibold text-[#6D286F]">{sub.subscriptionNumber}</td>
                          <td className="py-2.5 font-medium text-[#27212B]">{sub.customerName}</td>
                          <td className="py-2.5 text-[#817986]">{sub.planName}</td>
                          <td className="py-2.5 text-[#27212B]">
                            {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-2.5 text-right font-bold text-[#27212B]">{formatCurrency(sub.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Verified Successful Inflows */}
            <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
                  <h3 className="text-sm font-bold text-[#27212B]">Recent Successful Collections</h3>
                </div>
                <button
                  onClick={() => handleDownloadCsv('revenue')}
                  className="text-[11px] text-[#6D286F] hover:underline font-semibold"
                >
                  Export CSV →
                </button>
              </div>

              {!overview?.recentPayments || overview.recentPayments.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-[#EAE5EC] rounded-xl text-xs text-[#817986]">
                  No successful payment transactions recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#EAE5EC] text-[#817986] font-semibold">
                        <th className="pb-2">Payment Ref</th>
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Invoice</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3EAF5]">
                      {overview.recentPayments.slice(0, 5).map((pmt) => (
                        <tr key={pmt.id} className="hover:bg-[#FAF9FB]">
                          <td className="py-2.5 font-mono font-semibold text-[#27212B]">{pmt.paymentNumber}</td>
                          <td className="py-2.5 font-medium text-[#27212B]">
                            {pmt.customer ? `${pmt.customer.firstName} ${pmt.customer.lastName}`.trim() : 'N/A'}
                          </td>
                          <td className="py-2.5 font-mono text-[#817986]">{pmt.invoice?.invoiceNumber || 'N/A'}</td>
                          <td className="py-2.5 text-[#817986]">
                            {new Date(pmt.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 text-right font-bold text-emerald-700">
                            +{formatCurrency(Number(pmt.amount))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE ANALYTICS */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
              <h3 className="text-sm font-bold text-[#27212B] mb-1">Inflow Trend Over Selected Period</h3>
              <p className="text-[11px] text-[#817986] mb-4">
                Strictly counts recorded payments with status SUCCESS ({revenueData?.paymentTransactionsCount} transactions)
              </p>
              <AreaChart
                data={revenueData?.revenueTrend.map((t) => ({ label: t.label, value: t.revenue })) || []}
                height={260}
                color="#0D9488"
                fillColor="#0D9488"
              />
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#27212B] mb-1">Revenue by Payment Method</h3>
                <p className="text-[11px] text-[#817986] mb-4">Gateway and bank distribution</p>
              </div>
              <DonutChart
                data={paymentMethodDonutData}
                size={180}
                centerTitle={formatCurrency(revenueData?.totalCollectedRevenue)}
                centerSubtitle="Total Revenue"
                emptyMessage="No payment method data recorded."
              />
              <div className="mt-4 pt-3 border-t border-[#EAE5EC] flex justify-between text-xs">
                <span className="text-[#817986]">Net Realized Revenue:</span>
                <span className="font-bold text-emerald-700">{formatCurrency(revenueData?.netRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Revenue by Subscription Plan & Product Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Plan */}
            <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
              <h3 className="text-sm font-bold text-[#27212B] mb-1">Revenue Realization by Subscription Plan</h3>
              <p className="text-[11px] text-[#817986] mb-4">Collected inflows mapped via invoices &amp; plans</p>
              <BarChart
                data={
                  revenueData?.revenueByPlan.slice(0, 6).map((p) => ({
                    label: p.name,
                    value: p.revenue,
                    secondaryLabel: `${p.count} successful transactions`,
                  })) || []
                }
                height={220}
                color="#6D286F"
                hoverColor="#84418A"
                emptyMessage="No revenue mapped to specific plans yet."
              />
            </div>

            {/* Revenue by Product */}
            <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
              <h3 className="text-sm font-bold text-[#27212B] mb-1">Revenue Realization by Product Suite</h3>
              <p className="text-[11px] text-[#817986] mb-4">Collected inflows mapped to top products</p>
              <BarChart
                data={
                  revenueData?.revenueByProduct.slice(0, 6).map((p) => ({
                    label: p.name,
                    value: p.revenue,
                    secondaryLabel: `Code: ${p.code} (${p.count} payments)`,
                  })) || []
                }
                height={220}
                color="#2563EB"
                hoverColor="#3B82F6"
                emptyMessage="No revenue mapped to specific products yet."
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBSCRIPTION HEALTH */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
              <h3 className="text-sm font-bold text-[#27212B] mb-1">Subscriptions Created Over Time</h3>
              <p className="text-[11px] text-[#817986] mb-4">New contracts established in {subData?.periodLabel}</p>
              <AreaChart
                data={subData?.subscriptionsCreatedTrend.map((t) => ({ label: t.label, value: t.count })) || []}
                height={250}
                color="#8B5CF6"
                fillColor="#8B5CF6"
                formatValue={(v) => `${v} subs`}
                emptyMessage="No new subscriptions created during this window."
              />
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#27212B] mb-1">Contract Lifecycle Statuses</h3>
                <p className="text-[11px] text-[#817986] mb-3">Portfolio operational distribution</p>
              </div>
              <DonutChart data={statusDonutData} size={180} centerTitle={String(subData?.totalSubscriptions ?? 0)} />
              <div className="mt-4 pt-3 border-t border-[#EAE5EC] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#817986]">Active:</span>
                  <span className="font-bold text-emerald-600">{subData?.activeSubscriptions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#817986]">Pending (Draft/Quote):</span>
                  <span className="font-bold text-amber-600">{subData?.pendingSubscriptions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#817986]">Paused:</span>
                  <span className="font-bold text-purple-600">{subData?.pausedSubscriptions}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Upcoming Renewals Table */}
          <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#27212B]">Upcoming Renewals Roster (Next 30 Days)</h3>
                <p className="text-[11px] text-[#817986]">Track upcoming billing cycles and customer renewal dates</p>
              </div>
              <button
                onClick={() => handleDownloadCsv('subscriptions')}
                className="text-xs text-[#6D286F] font-semibold hover:underline"
              >
                Export All Subscriptions CSV →
              </button>
            </div>

            {!subData?.upcomingRenewals || subData.upcomingRenewals.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#EAE5EC] rounded-xl text-xs text-[#817986]">
                No subscriptions are due for renewal in the next 30 days.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#EAE5EC] text-[#817986] font-semibold">
                      <th className="pb-2.5">Subscription</th>
                      <th className="pb-2.5">Customer / Company</th>
                      <th className="pb-2.5">Contact Email</th>
                      <th className="pb-2.5">Plan</th>
                      <th className="pb-2.5">Renewal Date</th>
                      <th className="pb-2.5">Auto-Renew</th>
                      <th className="pb-2.5 text-right">Term Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EAF5]">
                    {subData.upcomingRenewals.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#FAF9FB]">
                        <td className="py-2.5 font-mono font-bold text-[#6D286F]">{sub.subscriptionNumber}</td>
                        <td className="py-2.5 font-medium text-[#27212B]">
                          {sub.customerName} {sub.companyName && <span className="text-[#817986]">({sub.companyName})</span>}
                        </td>
                        <td className="py-2.5 text-[#817986]">{sub.email}</td>
                        <td className="py-2.5 font-medium text-[#27212B]">{sub.planName}</td>
                        <td className="py-2.5 font-medium text-[#27212B]">
                          {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              sub.autoRenew ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sub.autoRenew ? 'Auto-Renew ON' : 'Manual Close'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-[#27212B]">{formatCurrency(sub.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CUSTOMERS & RECEIVABLES */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
              <h3 className="text-sm font-bold text-[#27212B] mb-1">Customer Acquisition Pace</h3>
              <p className="text-[11px] text-[#817986] mb-4">
                Registered customer growth over time (strictly role = CUSTOMER)
              </p>
              <AreaChart
                data={customerData?.customerGrowthTrend.map((t) => ({ label: t.label, value: t.count })) || []}
                height={240}
                color="#2563EB"
                fillColor="#2563EB"
                formatValue={(v) => `${v} customers`}
                emptyMessage="No customer acquisition events recorded in this period."
              />
            </div>

            <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#27212B] mb-1">Customer Conversion &amp; Aging</h3>
                <p className="text-[11px] text-[#817986] mb-4">Subscriber engagement statistics</p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#FAF9FB] rounded-xl border border-[#EAE5EC]">
                  <span className="text-[#817986] block text-[11px]">Customers with Active Subscriptions</span>
                  <span className="text-lg font-bold text-emerald-700">
                    {customerData?.customersWithActiveSubscriptions} of {customerData?.totalCustomers}
                  </span>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-rose-800 block text-[11px]">Customers with Overdue Balance</span>
                  <span className="text-lg font-bold text-rose-700">
                    {customerData?.customersWithOverduePaymentsCount} accounts
                  </span>
                </div>

                <div className="p-3 bg-[#F3EAF5] rounded-xl border border-[#D8B4E2]">
                  <span className="text-[#6D286F] block text-[11px]">Month-over-Month Acquisition</span>
                  <span className="text-lg font-bold text-[#6D286F]">
                    {customerData?.customerGrowthMoM}% growth
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customers with Overdue Payments Table */}
          <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#27212B]">Accounts with Overdue Balances</h3>
                <p className="text-[11px] text-[#817986]">Customers requiring collections and dunning outreach</p>
              </div>
              <button
                onClick={() => handleDownloadCsv('invoices')}
                className="text-xs text-[#6D286F] font-semibold hover:underline"
              >
                Export Invoices CSV →
              </button>
            </div>

            {!customerData?.overdueCustomers || customerData.overdueCustomers.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[#EAE5EC] rounded-xl text-xs text-emerald-700 bg-emerald-50/50">
                <span className="material-symbols-outlined text-[24px] text-emerald-600 block mb-1">
                  check_circle
                </span>
                Excellent! No customer accounts have overdue invoice balances.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#EAE5EC] text-[#817986] font-semibold">
                      <th className="pb-2.5">Customer Name</th>
                      <th className="pb-2.5">Company</th>
                      <th className="pb-2.5">Email</th>
                      <th className="pb-2.5 text-center">Overdue Invoices</th>
                      <th className="pb-2.5 text-right">Total Overdue Balance</th>
                      <th className="pb-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EAF5]">
                    {customerData.overdueCustomers.map((c) => (
                      <tr key={c.customerId} className="hover:bg-[#FAF9FB]">
                        <td className="py-2.5 font-bold text-[#27212B]">{c.customerName}</td>
                        <td className="py-2.5 text-[#817986]">{c.companyName || '—'}</td>
                        <td className="py-2.5 text-[#817986]">{c.email}</td>
                        <td className="py-2.5 text-center font-bold text-[#27212B]">{c.overdueInvoiceCount}</td>
                        <td className="py-2.5 text-right font-bold text-[#C53B4B]">
                          {formatCurrency(c.totalOverdueAmount)}
                        </td>
                        <td className="py-2.5 text-center">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold">
                            DUNNING ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PRODUCTS & PLANS */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products Table */}
            <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#27212B]">Product Performance Realization</h3>
                <span className="text-[11px] text-[#817986] font-semibold">
                  {productData?.totalProducts} Total Products
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#EAE5EC] text-[#817986] font-semibold">
                      <th className="pb-2">Product Name</th>
                      <th className="pb-2">Code</th>
                      <th className="pb-2 text-center">Active Subs</th>
                      <th className="pb-2 text-right">Realized Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EAF5]">
                    {productData?.topProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF9FB]">
                        <td className="py-2.5 font-medium text-[#27212B]">
                          {p.name}
                          <span className="block text-[10px] text-[#817986]">{p.category}</span>
                        </td>
                        <td className="py-2.5 font-mono text-[#817986]">{p.code}</td>
                        <td className="py-2.5 text-center font-bold text-[#27212B]">{p.activeSubscribersCount}</td>
                        <td className="py-2.5 text-right font-bold text-[#6D286F]">{formatCurrency(p.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Subscription Plans */}
            <div className="p-5 bg-white rounded-2xl border border-[#EAE5EC] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#27212B]">Plan Subscription Volume</h3>
                <span className="text-[11px] text-[#817986] font-semibold">{productData?.totalPlans} Total Plans</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-[#EAE5EC] text-[#817986] font-semibold">
                      <th className="pb-2">Plan Name</th>
                      <th className="pb-2">Frequency</th>
                      <th className="pb-2 text-center">Active Subs</th>
                      <th className="pb-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3EAF5]">
                    {productData?.topPlans.map((pl) => (
                      <tr key={pl.id} className="hover:bg-[#FAF9FB]">
                        <td className="py-2.5 font-medium text-[#27212B]">
                          {pl.name}
                          <span className="block text-[10px] text-[#817986]">{pl.productName}</span>
                        </td>
                        <td className="py-2.5 text-[#817986]">{pl.billingFrequency}</td>
                        <td className="py-2.5 text-center font-bold text-[#27212B]">{pl.activeSubscribersCount}</td>
                        <td className="py-2.5 text-right font-bold text-[#27212B]">{formatCurrency(pl.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Unused Products / Plans Warning Box */}
          {((productData?.unusedPlans && productData.unusedPlans.length > 0) ||
            (productData?.unusedProducts && productData.unusedProducts.length > 0)) && (
            <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-amber-900 font-bold text-xs">
                <span className="material-symbols-outlined text-[18px] text-amber-700">warning</span>
                <span>Catalog Review: Plans with Zero Active Subscriptions</span>
              </div>
              <p className="text-xs text-amber-800 mb-3">
                The following plans have 0 active subscribers. Consider retiring or repackaging them:
              </p>
              <div className="flex flex-wrap gap-2">
                {productData?.unusedPlans.map((p) => (
                  <span
                    key={p.id}
                    className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-[11px] font-semibold text-amber-900 shadow-xs"
                  >
                    {p.name} ({p.billingFrequency}) — {formatCurrency(p.price)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
