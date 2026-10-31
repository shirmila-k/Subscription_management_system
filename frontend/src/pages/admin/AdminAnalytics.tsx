import React, { useState } from 'react';
import { StatCard } from '../../components/StatCard';
import { RevenueChart } from '../../components/charts/RevenueChart';
import { SubscriptionChart } from '../../components/charts/SubscriptionChart';
import { formatINR } from '../../utils/format';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Users,
  Repeat,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'30D' | '90D' | '12M'>('12M');
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = () => {
    setExporting(true);
    setTimeout(() => {
      const csvContent =
        'data:text/csv;charset=utf-8,Month,MRR,ARR,Active_Subs,Churn_Rate\nJan,450000,5400000,120,1.2%\nFeb,520000,6240000,138,1.1%\nMar,610000,7320000,165,0.9%\nOct,945000,11340000,240,1.0%';
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Brightloop_Finance_Report_${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#817986] font-medium mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#6D286F] font-semibold">Financial Analytics</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B]">Finance Lead Executive Intelligence</h1>
          <p className="text-xs text-[#817986] mt-0.5">
            Centralized Recurring Revenue analytics, ARR/MRR modeling, cohort churn, and cash flow health
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sub-2-Second Query SLA Indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#16845B]/10 border border-[#16845B]/20 rounded-xl text-xs font-semibold text-[#16845B]">
            <Zap className="w-3.5 h-3.5" />
            <span>Query: 118ms (&lt;2.0s SLA)</span>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Download className="w-3.5 h-3.5" />
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="MRR (Monthly Recurring)"
          value={formatINR(945000)}
          icon={TrendingUp}
          trend={{ value: 16.4, isPositive: true }}
          description="Normalized recurring volume"
        />
        <StatCard
          label="ARR (Annual Run Rate)"
          value={formatINR(11340000)}
          icon={Repeat}
          trend={{ value: 24.8, isPositive: true }}
          description="12-month forward annualized"
        />
        <StatCard
          label="Customer Lifetime Value"
          value={formatINR(84500)}
          icon={Users}
          trend={{ value: 8.2, isPositive: true }}
          description="Average LTV per corporate account"
        />
        <StatCard
          label="Gross Revenue Retention"
          value="98.8%"
          icon={ShieldCheck}
          trend={{ value: 1.2, isPositive: true }}
          description="Monthly churn under 1.2%"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Area Chart */}
        <div className="bg-white rounded-2xl border border-[#EAE5EC] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#27212B]">Recurring Revenue Growth Trend</h2>
              <p className="text-xs text-[#817986] mt-0.5">Trailing 6-month ARR & MRR trajectory (₹ INR)</p>
            </div>
            <span className="text-xs font-bold text-[#16845B] bg-[#16845B]/10 px-2 py-0.5 rounded-lg">
              +16.4% MoM
            </span>
          </div>
          <div className="h-64">
            <RevenueChart />
          </div>
        </div>

        {/* Subscription Distribution Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#EAE5EC] p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#27212B]">Subscription Cohort Velocity</h2>
              <p className="text-xs text-[#817986] mt-0.5">New signups vs recurring renewals across plans</p>
            </div>
            <span className="text-xs font-bold text-[#6D286F] bg-[#F3EAF5] px-2 py-0.5 rounded-lg">
              240 Active Accounts
            </span>
          </div>
          <div className="h-64">
            <SubscriptionChart />
          </div>
        </div>
      </div>

      {/* Financial Health Summary Table */}
      <div className="bg-white rounded-2xl border border-[#EAE5EC] shadow-card p-5">
        <h2 className="text-sm font-bold text-[#27212B] mb-3">Enterprise Financial Health Ratios</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC]">
            <p className="text-xs text-[#817986] font-semibold">Average Revenue Per Account (ARPA)</p>
            <p className="text-xl font-bold text-[#27212B] mt-1">{formatINR(3937)}/mo</p>
            <p className="text-[11px] text-[#16845B] mt-1 font-medium">↑ +5.4% expansion with Odoo brand variants</p>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC]">
            <p className="text-xs text-[#817986] font-semibold">Net Invoicing to Cash Conversion</p>
            <p className="text-xl font-bold text-[#27212B] mt-1">94.2%</p>
            <p className="text-[11px] text-[#817986] mt-1 font-medium">Average collection cycle: 11.4 days</p>
          </div>
          <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC]">
            <p className="text-xs text-[#817986] font-semibold">Grace Period Recovery Rate</p>
            <p className="text-xl font-bold text-[#27212B] mt-1">87.5%</p>
            <p className="text-[11px] text-[#16845B] mt-1 font-medium">Recovered before auto-closure threshold</p>
          </div>
        </div>
      </div>
    </div>
  );
};
