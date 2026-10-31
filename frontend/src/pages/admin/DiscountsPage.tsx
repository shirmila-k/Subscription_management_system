import React, { useState, useEffect } from 'react';
import { discountService } from '../../services';
import { Discount } from '../../types';

interface DemoDiscount {
  id: string;
  name: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minPurchase: number;
  minQty: string;
  appliesTo: string;
  validFrom: string;
  validUntil: string;
  usedCount: number;
  maxUsage: number;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXHAUSTED' | 'EXPIRED';
}

const INITIAL_DISCOUNTS: DemoDiscount[] = [
  {
    id: 'disc-1',
    name: 'Enterprise Annual Tier',
    code: 'ENTERPRISE_ANNUAL_15',
    type: 'PERCENTAGE',
    value: 15,
    minPurchase: 100000,
    minQty: '5 seats min',
    appliesTo: 'Entire Subscription',
    validFrom: '01 Oct 24',
    validUntil: '31 Dec 24',
    usedCount: 48,
    maxUsage: 100,
    status: 'ACTIVE',
  },
  {
    id: 'disc-2',
    name: 'Diwali Scale Incentive',
    code: 'DIWALI_SCALE_50K',
    type: 'FIXED',
    value: 50000,
    minPurchase: 500000,
    minQty: '10 nodes min',
    appliesTo: 'Selected Product SKUs',
    validFrom: '01 Nov 24',
    validUntil: '15 Nov 24',
    usedCount: 0,
    maxUsage: 25,
    status: 'SCHEDULED',
  },
  {
    id: 'disc-3',
    name: 'Startup Accelerate Boost',
    code: 'STARTUP_BOOST_20',
    type: 'PERCENTAGE',
    value: 20,
    minPurchase: 0,
    minQty: '1 min',
    appliesTo: 'Entire Subscription',
    validFrom: '15 Aug 24',
    validUntil: '30 Sep 24',
    usedCount: 50,
    maxUsage: 50,
    status: 'EXHAUSTED',
  },
  {
    id: 'disc-4',
    name: 'Global Partner Channel',
    code: 'PARTNER_TIER_10',
    type: 'PERCENTAGE',
    value: 10,
    minPurchase: 50000,
    minQty: '3 min',
    appliesTo: 'Entire Subscription',
    validFrom: '01 Jan 24',
    validUntil: '31 Dec 24',
    usedCount: 12,
    maxUsage: 50,
    status: 'ACTIVE',
  },
  {
    id: 'disc-5',
    name: 'Summer Cloud Migrations',
    code: 'SUMMER_SCALE_25',
    type: 'PERCENTAGE',
    value: 25,
    minPurchase: 150000,
    minQty: '8 min',
    appliesTo: 'Selected Product SKUs',
    validFrom: '01 Jun 24',
    validUntil: '31 Jul 24',
    usedCount: 32,
    maxUsage: 40,
    status: 'EXPIRED',
  },
];

export const DiscountsPage: React.FC = () => {
  const [discounts, setDiscounts] = useState<DemoDiscount[]>(INITIAL_DISCOUNTS);
  const [activeTab, setActiveTab] = useState<'all' | 'ACTIVE' | 'SCHEDULED' | 'EXPIRED'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New discount form
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 10,
    minPurchase: 10000,
    minQty: '1 seat min',
    appliesTo: 'Entire Subscription',
    validFrom: '2024-11-01',
    validUntil: '2024-12-31',
    maxUsage: 50,
  });

  useEffect(() => {
    // Attempt fetching real discounts from backend
    discountService
      .getDiscounts()
      .then((data: Discount[]) => {
        if (data && data.length > 0) {
          const mapped: DemoDiscount[] = data.map((d) => ({
            id: d.id,
            name: d.code.replace(/_/g, ' '),
            code: d.code,
            type: d.type as any,
            value: Number(d.value),
            minPurchase: Number(d.minPurchaseAmount || 0),
            minQty: d.minQuantity ? `${d.minQuantity} units min` : '1 min',
            appliesTo: 'Entire Subscription',
            validFrom: d.validFrom
              ? new Date(d.validFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
              : 'Ongoing',
            validUntil: d.validUntil
              ? new Date(d.validUntil).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })
              : 'Open',
            usedCount: d.usedCount || 0,
            maxUsage: d.maxUsage || 100,
            status: d.isActive ? 'ACTIVE' : 'EXPIRED',
          }));
          setDiscounts([...mapped, ...INITIAL_DISCOUNTS]);
        }
      })
      .catch(() => {
        // Fallback to high fidelity demo records
      });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Coupon code "${code}" copied to clipboard!`);
  };

  const handleCreateDiscountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert('Please fill out code and name.');
      return;
    }

    try {
      await discountService.createDiscount({
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        minPurchaseAmount: Number(formData.minPurchase),
        minQuantity: 1,
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        maxUsage: Number(formData.maxUsage),
        isActive: true,
      });
    } catch {
      // Offline fallback
    }

    const newDisc: DemoDiscount = {
      id: `disc-${Date.now()}`,
      name: formData.name,
      code: formData.code.toUpperCase(),
      type: formData.type,
      value: Number(formData.value),
      minPurchase: Number(formData.minPurchase),
      minQty: formData.minQty,
      appliesTo: formData.appliesTo,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
      usedCount: 0,
      maxUsage: Number(formData.maxUsage),
      status: 'ACTIVE',
    };

    setDiscounts([newDisc, ...discounts]);
    setIsSlideOverOpen(false);
    showToast(`New promotion rule "${newDisc.code}" created successfully!`);
    setFormData({
      name: '',
      code: '',
      type: 'PERCENTAGE',
      value: 10,
      minPurchase: 10000,
      minQty: '1 seat min',
      appliesTo: 'Entire Subscription',
      validFrom: '2024-11-01',
      validUntil: '2024-12-31',
      maxUsage: 50,
    });
  };

  const handleToggleStatus = (id: string) => {
    setDiscounts((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextStatus = d.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE';
          showToast(`Discount ${d.code} updated to ${nextStatus}.`);
          return { ...d, status: nextStatus };
        }
        return d;
      })
    );
  };

  const filtered = discounts.filter((d) => {
    const matchesTab = activeTab === 'all' || d.status === activeTab;
    const matchesQuery =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.appliesTo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const activeCount = discounts.filter((d) => d.status === 'ACTIVE').length;
  const scheduledCount = discounts.filter((d) => d.status === 'SCHEDULED').length;
  const expiredCount = discounts.filter((d) => d.status === 'EXPIRED' || d.status === 'EXHAUSTED').length;

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#421747] text-white px-4 py-3 rounded-xl shadow-lg border border-[#6D286F] animate-fade-in">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#84418A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Revenue Operations</span>
            <span>•</span>
            <span>Rules Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">Discounts &amp; Promotions</h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Manage coupon codes, volume incentives, subscription-wide discounts, and seasonal offers.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => showToast('Discounts usage audit CSV exported successfully.')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-[#EAE5EC] text-[#27212B] text-xs font-semibold shadow-xs hover:bg-[#FAF9FB] transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px] text-[#817986]">file_download</span>
            Export Usage Report
          </button>
          <button
            onClick={() => setIsSlideOverOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6D286F] text-white text-xs font-semibold shadow-xs hover:bg-[#530D57] transition-all active:scale-95"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create Discount
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Active Discounts */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Active Discounts</span>
            <span className="p-2 rounded-lg bg-[#F3EAF5] text-[#6D286F]">
              <span className="material-symbols-outlined text-[20px]">sell</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">{activeCount}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[#817986] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Live in checkout &amp; quote builder</span>
          </div>
        </div>

        {/* Scheduled Discounts */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Scheduled Discounts</span>
            <span className="p-2 rounded-lg bg-[#F3EAF5] text-[#84418A]">
              <span className="material-symbols-outlined text-[20px]">event_upcoming</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">{scheduledCount}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[#84418A] text-xs font-medium">
            <span className="material-symbols-outlined text-[14px]">bolt</span>
            <span>Upcoming festive campaigns</span>
          </div>
        </div>

        {/* Expired / Deprecated */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Expired / Deprecated</span>
            <span className="p-2 rounded-lg bg-[#FAF9FB] text-[#817986]">
              <span className="material-symbols-outlined text-[20px]">history_toggle_off</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">{expiredCount}</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[#817986] text-xs">
            <span>Archived promotional rules</span>
          </div>
        </div>

        {/* Total Discount Applied */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Total Discount Applied</span>
            <span className="p-2 rounded-lg bg-[#F3EAF5] text-[#6D286F]">
              <span className="material-symbols-outlined text-[20px]">currency_rupee</span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">₹14,80,000</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[#817986] text-xs">
            <span>Across 420 billing cycles</span>
            <span className="text-[#16845B] font-semibold">+18.4% MoM</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Redemption Velocity & Top Campaign Impact */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: Redemption Velocity Bar Chart */}
        <div className="xl:col-span-2 bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-bold text-[#27212B]">Redemption Velocity &amp; Discount Yield</h2>
              <p className="text-xs text-[#817986]">Cumulative monthly discounts given vs revenue captured</p>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#817986]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#6D286F]"></span> Volume (k₹)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#E996E5]"></span> Burn Rate
              </span>
            </div>
          </div>
          <div className="w-full h-44 flex items-end gap-3 sm:gap-6 pt-4 border-b border-[#EAE5EC] pb-2">
            {[
              { month: 'Jun', vol: 48, burn: 30 },
              { month: 'Jul', vol: 60, burn: 42 },
              { month: 'Aug', vol: 52, burn: 38 },
              { month: 'Sep', vol: 75, burn: 54 },
              { month: 'Oct', vol: 92, burn: 68 },
              { month: 'Nov (Est)', vol: 100, burn: 72, highlight: true },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end gap-1 h-32 justify-center">
                  <div
                    className="w-1/2 bg-[#6D286F] rounded-t transition-all duration-500"
                    style={{ height: `${bar.vol}%` }}
                  ></div>
                  <div
                    className="w-1/2 bg-[#E996E5] rounded-t transition-all duration-500"
                    style={{ height: `${bar.burn}%` }}
                  ></div>
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    bar.highlight ? 'text-[#6D286F] font-bold' : 'text-[#817986]'
                  }`}
                >
                  {bar.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Top Campaign Impact */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-bold text-[#27212B]">Top Campaign Impact</h2>
              <span className="text-[11px] text-[#817986] font-semibold bg-[#FAF9FB] px-2 py-0.5 rounded border border-[#EAE5EC]">
                Q3-Q4
              </span>
            </div>
            <p className="text-xs text-[#817986] mb-3">Largest single promotion contribution to closed ACV.</p>
            <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC] mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-bold text-[#6D286F]">ENTERPRISE_ANNUAL_15</span>
                <span className="text-xs font-bold text-[#27212B] tabular-nums">₹8,40,000</span>
              </div>
              <p className="text-xs text-[#817986]">Generated ₹56,00,000 ARR across 48 enterprise contracts.</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#817986]">Coupon Budget Consumed</span>
              <span className="text-[#27212B] font-bold">62.5%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] overflow-hidden">
              <div className="h-full bg-[#6D286F] rounded-full" style={{ width: '62.5%' }}></div>
            </div>
            <div className="flex justify-between items-center pt-1 text-[11px] text-[#817986]">
              <span>₹15L Cap</span>
              <span>₹24L Projected Max</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discounts Ledger Table */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="px-5 py-4 border-b border-[#EAE5EC] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Discounts' },
              { id: 'ACTIVE', label: `Active (${activeCount})` },
              { id: 'SCHEDULED', label: `Scheduled (${scheduledCount})` },
              { id: 'EXPIRED', label: `Expired (${expiredCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#6D286F] text-white shadow-xs font-bold'
                    : 'text-[#817986] hover:bg-[#FAF9FB] hover:text-[#27212B]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#817986] text-[18px]">
                search
              </span>
              <input
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#FAF9FB] text-[#27212B] placeholder:text-[#817986] text-xs outline-none border border-[#EAE5EC] focus:border-[#6D286F]"
                placeholder="Filter code, type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
              />
            </div>
            <button
              onClick={() => showToast('Rules filtered.')}
              className="p-1.5 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-[#27212B] hover:bg-[#F3EAF5] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF9FB] border-b border-[#EAE5EC]">
              <tr>
                <th className="py-2.5 px-5 text-[11px] uppercase tracking-wider text-[#817986] font-semibold">
                  Discount Name &amp; Code
                </th>
                <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#817986] font-semibold">Type</th>
                <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#817986] font-semibold">Value</th>
                <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#817986] font-semibold">
                  Min. Purchase
                </th>
                <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#817986] font-semibold">Min. Qty</th>
                <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#817986] font-semibold">
                  Applies To
                </th>
                <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#817986] font-semibold">
                  Validity Period
                </th>
                <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#817986] font-semibold">Usage</th>
                <th className="py-2.5 px-4 text-[11px] uppercase tracking-wider text-[#817986] font-semibold">Status</th>
                <th className="py-2.5 px-5 text-[11px] uppercase tracking-wider text-[#817986] font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#27212B] divide-y divide-[#EAE5EC]">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-[#FAF9FB] transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#27212B]">{d.name}</span>
                      <span className="text-[11px] text-[#6D286F] font-mono font-bold mt-0.5">{d.code}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-[#F3EAF5] text-[#6D286F] font-medium">
                      {d.type === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-[#27212B]">
                    {d.type === 'PERCENTAGE' ? `${d.value}% OFF` : `₹${d.value.toLocaleString('en-IN')} Flat`}
                  </td>
                  <td className="py-3 px-4 text-[#817986] tabular-nums">
                    {d.minPurchase > 0 ? `₹${d.minPurchase.toLocaleString('en-IN')}` : 'None'}
                  </td>
                  <td className="py-3 px-4 text-[#817986]">{d.minQty}</td>
                  <td className="py-3 px-4 text-[#817986]">{d.appliesTo}</td>
                  <td className="py-3 px-4 text-[#817986] whitespace-nowrap">
                    <span>{d.validFrom}</span> → <span>{d.validUntil}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="w-28 space-y-1">
                      <div className="flex justify-between text-[11px] text-[#817986] tabular-nums font-medium">
                        <span>{d.usedCount}</span>
                        <span>/ {d.maxUsage}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#FAF9FB] border border-[#EAE5EC] overflow-hidden">
                        <div
                          className="h-full bg-[#6D286F] rounded-full"
                          style={{ width: `${Math.min(100, (d.usedCount / d.maxUsage) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        d.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-[#16845B]'
                          : d.status === 'SCHEDULED'
                          ? 'bg-purple-50 text-[#84418A]'
                          : d.status === 'EXHAUSTED'
                          ? 'bg-amber-50 text-[#B7791F]'
                          : 'bg-[#FAF9FB] text-[#817986] border border-[#EAE5EC]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          d.status === 'ACTIVE'
                            ? 'bg-emerald-600'
                            : d.status === 'SCHEDULED'
                            ? 'bg-[#84418A]'
                            : d.status === 'EXHAUSTED'
                            ? 'bg-amber-600'
                            : 'bg-slate-400'
                        }`}
                      ></span>
                      {d.status.charAt(0) + d.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="inline-flex items-center gap-1 text-[#817986]">
                      <button
                        onClick={() => handleCopyCode(d.code)}
                        className="p-1 rounded hover:bg-[#F3EAF5] hover:text-[#6D286F] transition-colors"
                        title="Copy Code"
                      >
                        <span className="material-symbols-outlined text-[18px]">content_copy</span>
                      </button>
                      <button
                        onClick={() => handleToggleStatus(d.id)}
                        className="p-1 rounded hover:bg-rose-50 text-rose-600 transition-colors"
                        title={d.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {d.status === 'ACTIVE' ? 'block' : 'check'}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Discount Drawer / Modal */}
      {isSlideOverOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-[#EAE5EC] shadow-2xl w-full max-w-lg p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE5EC]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#F3EAF5] flex items-center justify-center text-[#6D286F]">
                  <span className="material-symbols-outlined text-[20px]">sell</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#27212B]">Create Discount Rule</h3>
                  <p className="text-xs text-[#817986]">Define promo codes, fixed deductions, or percentage coupons</p>
                </div>
              </div>
              <button
                onClick={() => setIsSlideOverOpen(false)}
                className="text-[#817986] hover:text-[#27212B] transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateDiscountSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#27212B] mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FESTIVE_20"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-mono font-bold text-[#6D286F] uppercase outline-none focus:border-[#6D286F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#27212B] mb-1">Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diwali Scale Incentive"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#27212B] mb-1">Discount Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#27212B] mb-1">
                    {formData.type === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Flat Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-bold text-[#27212B] outline-none focus:border-[#6D286F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#27212B] mb-1">Min. Purchase Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#27212B] mb-1">Max Usages Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({ ...formData, maxUsage: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#27212B] mb-1">Valid From</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#27212B] mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE5EC]">
                <button
                  type="button"
                  onClick={() => setIsSlideOverOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#817986] hover:bg-[#FAF9FB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#6D286F] text-white text-xs font-semibold hover:bg-[#530D57] transition-colors"
                >
                  Save Discount Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
