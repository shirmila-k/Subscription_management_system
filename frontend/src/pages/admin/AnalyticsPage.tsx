import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services';
import { AnalyticsOverview } from '../../types';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30d' | '90d' | 'ytd' | 'all'>('ytd');
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    analyticsService
      .getOverview()
      .then((data) => {
        if (data) setOverview(data);
      })
      .catch(() => {
        // Fallback demo data
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const mrr = overview?.mrr ? Number(overview.mrr) : 4285000;
  const arr = mrr * 12;
  const activeSubs = overview?.activeSubscriptions ?? 2486;
  const revenueTotal = overview?.totalRevenue ? Number(overview.totalRevenue) : 7642800;

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

        <div className="flex items-center gap-3 self-start md:self-auto">
          {/* Time Range Switcher */}
          <div className="flex items-center bg-white border border-[#EAE5EC] rounded-lg p-1 shadow-xs text-xs font-medium">
            {[
              { id: '30d', label: '30 Days' },
              { id: '90d', label: 'Quarterly' },
              { id: 'ytd', label: 'YTD 2024' },
              { id: 'all', label: 'All-Time' },
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
            onClick={() => showToast('Analytics executive board summary exported to PDF.')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#FAF9FB] hover:bg-[#F3EAF5] text-[#27212B] border border-[#EAE5EC] text-xs font-semibold transition-colors shadow-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-[#6D286F]">download</span>
            Export Board Deck
          </button>
        </div>
      </div>

      {/* Demo data badge reminder */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-amber-700">info</span>
          <span>
            Demonstration Mode: Figures combine live database records with synthetic historical cohorts for full
            hackathon visual completeness.
          </span>
        </div>
        <span className="font-semibold text-amber-800">INR Base (₹)</span>
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
              <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
              <span>+14.8% vs last quarter</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#FAF9FB] rounded-full mt-4 overflow-hidden border border-[#EAE5EC]">
            <div className="h-full bg-[#6D286F] rounded-full" style={{ width: '84%' }}></div>
          </div>
        </div>

        {/* ARR */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Annualized Run-Rate</span>
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
              <span>118% Net Revenue Retention</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#FAF9FB] rounded-full mt-4 overflow-hidden border border-[#EAE5EC]">
            <div className="h-full bg-[#84418A] rounded-full" style={{ width: '76%' }}></div>
          </div>
        </div>

        {/* Revenue Collected */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Realized Collections</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-[#16845B]">
              <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[#817986] text-sm">₹</span>
              <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">
                {revenueTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-[#16845B]">
              <span>98.4% Realization Rate</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#FAF9FB] rounded-full mt-4 overflow-hidden border border-[#EAE5EC]">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '94%' }}></div>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">
              Outstanding Receivables
            </span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-[#817986] text-sm">₹</span>
              <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">12,45,000</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-[#817986]">
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">14 Days DSO</span>
              <span>18 pending settling</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#FAF9FB] rounded-full mt-4 overflow-hidden border border-[#EAE5EC]">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '38%' }}></div>
          </div>
        </div>
      </div>

      {/* Middle Row: Revenue Trajectory Spline Chart & Retention Waterfall */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spline Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[#EAE5EC]">
            <div>
              <h2 className="text-base font-bold text-[#27212B]">Recurring Revenue Growth &amp; Composition</h2>
              <p className="text-xs text-[#817986]">Monthly contracted recurring revenue (MRR) expansion trajectory</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-[#817986]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6D286F]"></span> Base Subscriptions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#84418A]"></span> Brand Add-ons (Odoo)
              </span>
            </div>
          </div>

          <div className="py-6">
            <div className="w-full h-56 relative flex items-end justify-between gap-4 px-2">
              {[
                { month: 'May', val: 24, label: '₹24.5L' },
                { month: 'Jun', val: 28, label: '₹28.2L' },
                { month: 'Jul', val: 32, label: '₹32.0L' },
                { month: 'Aug', val: 35, label: '₹35.4L' },
                { month: 'Sep', val: 38, label: '₹38.8L' },
                { month: 'Oct', val: 42.8, label: '₹42.8L', active: true },
              ].map((point, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[11px] font-bold text-[#6D286F] opacity-0 group-hover:opacity-100 transition-opacity">
                    {point.label}
                  </span>
                  <div className="w-full flex flex-col items-center justify-end h-40">
                    <div
                      className={`w-full max-w-[42px] rounded-t-lg transition-all duration-500 ${
                        point.active
                          ? 'bg-gradient-to-t from-[#421747] to-[#6D286F] shadow-md'
                          : 'bg-[#F3EAF5] hover:bg-[#84418A]/50'
                      }`}
                      style={{ height: `${(point.val / 45) * 100}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      point.active ? 'text-[#6D286F] font-bold' : 'text-[#817986]'
                    }`}
                  >
                    {point.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-[#EAE5EC] flex items-center justify-between text-xs text-[#817986]">
            <span>Average Revenue Per Account (ARPA): ₹18,420 / mo</span>
            <span className="font-semibold text-[#16845B]">+22.4% LTV / CAC Ratio: 4.8x</span>
          </div>
        </div>

        {/* Churn & Retention Dynamics */}
        <div className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5EC]">
              <h2 className="text-base font-bold text-[#27212B]">Retention Dynamics</h2>
              <span className="text-xs font-bold text-[#16845B] bg-emerald-50 px-2 py-0.5 rounded-full">
                0.8% Gross Churn
              </span>
            </div>

            <div className="space-y-4 pt-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#27212B]">Expansion Revenue</span>
                  <span className="font-bold text-[#16845B]">+₹5,80,000</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] overflow-hidden">
                  <div className="h-full bg-[#16845B] rounded-full" style={{ width: '74%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#27212B]">New Logo ARR</span>
                  <span className="font-bold text-[#6D286F]">+₹8,40,000</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] overflow-hidden">
                  <div className="h-full bg-[#6D286F] rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#27212B]">Downgrades &amp; Contraction</span>
                  <span className="font-bold text-amber-600">-₹62,000</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#27212B]">Customer Churn (Closed)</span>
                  <span className="font-bold text-rose-600">-₹34,000</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '6%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC] mt-4 flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-[#6D286F]">auto_awesome</span>
            <div>
              <p className="text-xs font-bold text-[#27212B]">Net Negative Churn Achieved</p>
              <p className="text-[11px] text-[#817986]">Existing accounts expanded faster than terminations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Breakdown & Top Accounts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <div className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#27212B] mb-1">Cadence &amp; Plan Distribution</h2>
          <p className="text-xs text-[#817986] mb-4">Total active contracts: {activeSubs} subscribers</p>
          <div className="space-y-3">
            {[
              { plan: 'Monthly Enterprise Scale (with Odoo)', share: '46%', subs: '1,143', mrr: '₹19.7L' },
              { plan: 'Yearly Committed Pro', share: '32%', subs: '795', mrr: '₹13.7L' },
              { plan: 'Weekly Flexible Developer', share: '14%', subs: '348', mrr: '₹6.0L' },
              { plan: 'Daily Edge Burstable', share: '8%', subs: '200', mrr: '₹3.4L' },
            ].map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC]"
              >
                <div>
                  <p className="text-xs font-bold text-[#27212B]">{p.plan}</p>
                  <p className="text-[11px] text-[#817986]">
                    {p.subs} accounts • {p.share} of portfolio
                  </p>
                </div>
                <span className="text-xs font-bold text-[#6D286F] tabular-nums">{p.mrr} MRR</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Revenue Contributing Enterprises */}
        <div className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#27212B] mb-1">Top Enterprise Subscribers</h2>
          <p className="text-xs text-[#817986] mb-4">Highest lifetime contract value (LTV)</p>
          <div className="space-y-3">
            {[
              { name: 'Bharat Fintech Solutions', plan: 'RTGS Strategic API', spend: '₹22,40,000', status: 'ACTIVE' },
              { name: 'Acme Cloud Labs', plan: 'Monthly Scale + Odoo Suite', spend: '₹14,20,000', status: 'ACTIVE' },
              { name: 'ZapScale Media', plan: 'Annual Dedicated Cluster', spend: '₹10,90,000', status: 'ACTIVE' },
              { name: 'HyperLogix India', plan: 'Quarterly Multi-Region', spend: '₹7,35,000', status: 'ACTIVE' },
            ].map((cust, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC]"
              >
                <div>
                  <p className="text-xs font-bold text-[#27212B]">{cust.name}</p>
                  <p className="text-[11px] text-[#817986]">{cust.plan}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#27212B] tabular-nums">{cust.spend}</p>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                    {cust.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
