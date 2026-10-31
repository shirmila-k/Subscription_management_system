import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services';
import {
  AnalyticsOverview,
  MonthlyRevenueTrendItem,
  ChurnAnalytics,
  PaymentMethodBreakdownResponse,
} from '../../types';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'ytd' | 'all'>('ytd');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [trendData, setTrendData] = useState<MonthlyRevenueTrendItem[]>([]);
  const [churnData, setChurnData] = useState<ChurnAnalytics | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodBreakdownResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const monthsForRange = timeRange === '30d' ? 3 : timeRange === '90d' ? 3 : timeRange === 'ytd' ? 6 : 12;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ov, trend, churn, pm] = await Promise.all([
        analyticsService.getOverview(),
        analyticsService.getRevenueTrend(monthsForRange),
        analyticsService.getChurnAnalytics(),
        analyticsService.getPaymentMethodBreakdown(),
      ]);
      setOverview(ov);
      setTrendData(trend || []);
      setChurnData(churn);
      setPaymentMethods(pm);
    } catch (err: any) {
      console.error('Failed to load analytics', err);
      showToast('Error loading live analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      await analyticsService.downloadFinancialReportCsv();
      showToast('Executive financial summary exported successfully.');
    } catch (err) {
      showToast('Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  const kpis = overview?.kpis;
  const mrr = kpis?.mrr ?? 0;
  const arr = kpis?.arr ?? 0;
  const netRevenue = kpis?.netCollectedRevenue ?? kpis?.totalCollectedRevenue ?? 0;
  const grossRevenue = kpis?.grossCollectedRevenue ?? netRevenue;
  const totalRefunded = kpis?.totalRefunded ?? 0;
  const outstandingReceivables = kpis?.outstandingBalanceTotal ?? 0;
  const overdueAmount = kpis?.overdueInvoicesAmount ?? 0;
  const overdueCount = kpis?.overdueInvoicesCount ?? 0;
  const activeSubs = kpis?.activeSubscriptions ?? 0;
  const totalSubs = kpis?.totalSubscriptions ?? 0;
  const arpu = kpis?.arpu ?? 0;
  const realizationRate = kpis?.realizationRate ?? 100;
  const churnRate = churnData?.churnRatePercentage ?? kpis?.churnRate ?? 0;
  const retentionRate = churnData?.retentionRatePercentage ?? Math.max(0, 100 - churnRate);

  // Maximum revenue in trend data for chart scaling
  const maxTrendVal = Math.max(...trendData.map((t) => Math.max(t.grossRevenue, t.netRevenue, 1000)), 1000);

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#421747] text-white px-4 py-3 rounded-xl shadow-lg border border-[#6D286F] animate-fade-in">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">insights</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#84418A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Executive Intelligence</span>
            <span>•</span>
            <span>Real-time Financials</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">Revenue &amp; Portfolio Analytics</h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Holistic recurring revenue trajectory, net retention, realization efficiency, and cohort churn.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 text-[#817986] hover:text-[#27212B] bg-white border border-[#EAE5EC] hover:bg-[#FAF9FB] rounded-lg transition shadow-xs disabled:opacity-50"
            title="Refresh Data"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
          </button>

          {/* Time Range Switcher */}
          <div className="flex items-center bg-white border border-[#EAE5EC] rounded-lg p-1 shadow-xs text-xs font-medium">
            {[
              { id: '30d', label: '30 Days' },
              { id: '90d', label: 'Quarterly' },
              { id: 'ytd', label: '6 Months' },
              { id: 'all', label: '12 Months' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id as any)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  timeRange === t.id
                    ? 'bg-[#6D286F] text-white shadow-xs font-semibold'
                    : 'text-[#817986] hover:text-[#27212B]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FAF9FB] hover:bg-[#F3EAF5] text-[#27212B] border border-[#EAE5EC] text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px] text-[#6D286F]">
              {exporting ? 'hourglass_empty' : 'download'}
            </span>
            {exporting ? 'Exporting...' : 'Export Financial CSV'}
          </button>
        </div>
      </div>

      {/* Persisted Database Data Transparency Banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#6D286F]">verified</span>
          <span>
            <strong>Verified Persistent Records:</strong> Financial metrics are calculated strictly from persisted database
            transactions. Uncollected invoice balances are accounted under A/R, never counted as collected revenue.
          </span>
        </div>
        <div className="flex items-center gap-3">
          {overview?.executionTimeMs !== undefined && (
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Query SLA: {overview.executionTimeMs}ms
            </span>
          )}
          <span className="font-semibold text-slate-900">INR Base (₹)</span>
        </div>
      </div>

      {/* 4 Core Financial KPI Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">
              Monthly Recurring (MRR)
            </span>
            <span className="p-2 rounded-lg bg-[#F3EAF5] text-[#6D286F]">
              <span className="material-symbols-outlined text-[20px]">trending_up</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[#817986] text-sm">₹</span>
              <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">
                {mrr.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#16845B]">
              <span className="material-symbols-outlined text-[15px]">layers</span>
              <span>{activeSubs} active subscriber contracts</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#FAF9FB] rounded-full mt-4 overflow-hidden border border-[#EAE5EC]">
            <div
              className="h-full bg-[#6D286F] rounded-full transition-all duration-500"
              style={{ width: `${totalSubs > 0 ? Math.min(100, Math.round((activeSubs / totalSubs) * 100)) : 0}%` }}
            ></div>
          </div>
        </div>

        {/* ARR */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Annualized Run-Rate (ARR)</span>
            <span className="p-2 rounded-lg bg-[#F3EAF5] text-[#84418A]">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[#817986] text-sm">₹</span>
              <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">
                {arr.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#16845B]">
              <span className="material-symbols-outlined text-[15px]">verified</span>
              <span>{retentionRate}% Net Retention Rate</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#FAF9FB] rounded-full mt-4 overflow-hidden border border-[#EAE5EC]">
            <div
              className="h-full bg-[#84418A] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, retentionRate)}%` }}
            ></div>
          </div>
        </div>

        {/* Net Realized Collections */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Net Realized Collections</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-[#16845B]">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[#817986] text-sm">₹</span>
              <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">
                {netRevenue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-[#817986]">
              <span>Gross: ₹{grossRevenue.toLocaleString('en-IN')}</span>
              {totalRefunded > 0 ? (
                <span className="text-rose-600 font-semibold">-₹{totalRefunded.toLocaleString('en-IN')} refunds</span>
              ) : (
                <span className="text-emerald-700 font-semibold">0 refunds</span>
              )}
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#FAF9FB] rounded-full mt-4 overflow-hidden border border-[#EAE5EC]">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, realizationRate)}%` }}
            ></div>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">
              Outstanding Receivables (A/R)
            </span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[#817986] text-sm">₹</span>
              <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">
                {outstandingReceivables.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#817986]">
              {overdueCount > 0 ? (
                <>
                  <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                    {overdueCount} Overdue
                  </span>
                  <span>₹{overdueAmount.toLocaleString('en-IN')}</span>
                </>
              ) : (
                <span className="text-emerald-700 font-semibold">0 overdue invoices</span>
              )}
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#FAF9FB] rounded-full mt-4 overflow-hidden border border-[#EAE5EC]">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  netRevenue + outstandingReceivables > 0
                    ? Math.min(100, Math.round((outstandingReceivables / (netRevenue + outstandingReceivables)) * 100))
                    : 0
                }%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Middle Row: Revenue Trajectory Spline Chart & Retention Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Monthly Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAE5EC]">
            <div>
              <h2 className="text-base font-bold text-[#27212B]">Recurring Revenue Growth &amp; Realization</h2>
              <p className="text-xs text-[#817986]">Persisted monthly payment settlement volume</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-[#817986]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6D286F]"></span> Net Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Refunds
              </span>
            </div>
          </div>

          <div className="py-6">
            {trendData.length === 0 ? (
              <div className="h-56 flex flex-col items-center justify-center text-[#817986] text-xs">
                <span className="material-symbols-outlined text-[32px] text-slate-400 mb-2">bar_chart</span>
                <span>No payment activity recorded yet in this window</span>
              </div>
            ) : (
              <div className="w-full h-56 relative flex items-end justify-between gap-4 px-2">
                {trendData.map((point, i) => {
                  const netH = maxTrendVal > 0 ? (point.netRevenue / maxTrendVal) * 100 : 0;
                  const isCurrent = i === trendData.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="text-[11px] font-bold text-[#6D286F] opacity-0 group-hover:opacity-100 transition-opacity text-center whitespace-nowrap">
                        ₹{point.netRevenue.toLocaleString('en-IN')}
                        {point.refunds > 0 && (
                          <div className="text-[9px] text-rose-600 font-normal">
                            -₹{point.refunds.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <div className="w-full flex flex-col items-center justify-end h-40">
                        <div
                          className={`w-full max-w-[42px] rounded-t-lg transition-all duration-500 ${
                            isCurrent
                              ? 'bg-gradient-to-t from-[#421747] to-[#6D286F] shadow-md'
                              : 'bg-[#F3EAF5] hover:bg-[#84418A]/50'
                          }`}
                          style={{ height: `${Math.max(netH, 4)}%` }}
                        ></div>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isCurrent ? 'text-[#6D286F] font-bold' : 'text-[#817986]'
                        }`}
                      >
                        {point.month.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#EAE5EC] flex flex-wrap items-center justify-between text-xs text-[#817986] gap-2">
            <span>
              Average Revenue Per Account (ARPU):{' '}
              <strong className="text-[#27212B]">₹{arpu.toLocaleString('en-IN')} / mo</strong>
            </span>
            <span className="font-semibold text-[#16845B]">
              Realization Efficiency: {realizationRate}%
            </span>
          </div>
        </div>

        {/* Churn & Retention Dynamics */}
        <div className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5EC]">
              <h2 className="text-base font-bold text-[#27212B]">Retention Dynamics</h2>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  churnRate <= 5 ? 'text-[#16845B] bg-emerald-50' : 'text-amber-700 bg-amber-50'
                }`}
              >
                {churnRate}% Gross Churn
              </span>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#27212B]">Active Contracts</span>
                  <span className="font-bold text-[#16845B]">
                    {activeSubs} / {totalSubs} accounts
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] overflow-hidden">
                  <div
                    className="h-full bg-[#16845B] rounded-full"
                    style={{ width: `${totalSubs > 0 ? (activeSubs / totalSubs) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#27212B]">Active Contract MRR</span>
                  <span className="font-bold text-[#6D286F]">₹{mrr.toLocaleString('en-IN')}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] overflow-hidden">
                  <div className="h-full bg-[#6D286F] rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#27212B]">Churned MRR Loss</span>
                  <span className="font-bold text-rose-600">
                    -₹{(churnData?.churnedMRRLoss ?? 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${
                        mrr + (churnData?.churnedMRRLoss ?? 0) > 0
                          ? Math.min(
                              100,
                              Math.round(((churnData?.churnedMRRLoss ?? 0) / (mrr + (churnData?.churnedMRRLoss ?? 0))) * 100)
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#27212B]">Terminated Contracts</span>
                  <span className="font-bold text-[#817986]">
                    {(churnData?.closedSubscriptions ?? 0) + (churnData?.cancelledSubscriptions ?? 0)} subscriptions
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full"
                    style={{ width: `${Math.min(100, churnRate)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC] mt-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-[#6D286F]">auto_awesome</span>
            <div>
              <p className="text-xs font-bold text-[#27212B]">
                {churnRate <= 2 ? 'Industry Leading Retention' : 'Monitored Portfolio Health'}
              </p>
              <p className="text-[11px] text-[#817986]">
                {churnData?.insufficientHistory
                  ? 'Awaiting more subscriber history for cohort analysis'
                  : `${retentionRate}% cohort retention efficiency`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Breakdown & Payment Methods Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier & Plan Distribution */}
        <div className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#27212B]">Plan Distribution</h2>
              <p className="text-xs text-[#817986]">Top performing subscription products</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F3EAF5] text-[#6D286F]">
              {overview?.topPlans.length ?? 0} Plans Active
            </span>
          </div>

          {overview?.topPlans && overview.topPlans.length > 0 ? (
            <div className="space-y-3">
              {overview.topPlans.map((p, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC]"
                >
                  <div>
                    <p className="text-xs font-bold text-[#27212B]">{p.planName}</p>
                    <p className="text-[11px] text-[#817986]">
                      {p.subscribersCount} subscribers • {p.billingFrequency || 'MONTHLY'} • ₹{p.price.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#6D286F] tabular-nums">
                    ₹{(p.estimatedMRR ?? p.price * p.subscribersCount).toLocaleString('en-IN')} MRR
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#817986]">
              No active subscription plans assigned yet.
            </div>
          )}
        </div>

        {/* Real Payment Method Breakdown */}
        <div className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#27212B]">Payment Method Breakdown</h2>
              <p className="text-xs text-[#817986]">Settlement channel realization volume</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#16845B]">
              ₹{(paymentMethods?.totalNetCollected ?? 0).toLocaleString('en-IN')} Total
            </span>
          </div>

          {paymentMethods?.methods && paymentMethods.methods.some((m) => m.transactionCount > 0) ? (
            <div className="space-y-3">
              {paymentMethods.methods
                .filter((m) => m.transactionCount > 0)
                .map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC]"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#27212B]">{m.method.replace('_', ' ')}</p>
                      <p className="text-[11px] text-[#817986]">
                        {m.successCount} successful • {m.percentage}% volume
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-[#27212B] tabular-nums">
                        ₹{m.netCollected.toLocaleString('en-IN')}
                      </p>
                      {m.refundedAmount > 0 && (
                        <span className="text-[10px] text-rose-600 font-medium">
                          -₹{m.refundedAmount.toLocaleString('en-IN')} ref.
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-[#817986]">
              No payments recorded across channels yet.
            </div>
          )}
        </div>
      </div>

      {/* Recent Persisted Subscription Activity Table */}
      {overview?.recentActivity && overview.recentActivity.length > 0 && (
        <div className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#27212B] mb-1">Recent Subscriber Records</h2>
          <p className="text-xs text-[#817986] mb-4">Latest persisted subscriptions in database</p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9FB] border-b border-[#EAE5EC] text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4">Subscription ID</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Plan</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Contract Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5EC]">
                {overview.recentActivity.map((sub: any) => (
                  <tr key={sub.id} className="hover:bg-[#FAF9FB] transition">
                    <td className="py-3 px-4 font-semibold text-[#6D286F]">{sub.subscriptionNumber}</td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-[#27212B]">
                          {sub.customer?.firstName} {sub.customer?.lastName}
                        </span>
                        {sub.customer?.companyName && (
                          <span className="text-[#817986] block text-[11px]">
                            {sub.customer.companyName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#817986]">
                      {sub.plan?.name} ({sub.plan?.billingFrequency})
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          sub.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : sub.status === 'PAUSED'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#27212B] tabular-nums">
                      ₹{Number(sub.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;

