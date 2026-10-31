import React, { useEffect, useState } from 'react';
import { planService } from '../../services';

interface PlanItem {
  id: string;
  name: string;
  code: string;
  productName: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  price: number;
  minQuantity: number;
  validity: string;
  autoCloseDays: number;
  pauseAllowed: boolean;
  maxPauseDays: number;
  autoRenew: boolean;
  status: 'Active' | 'Limited' | 'Draft' | 'Archived';
}

export const PlansManager: React.FC = () => {
  const [plans, setPlans] = useState<PlanItem[]>([
    {
      id: 'pln-01',
      name: 'Enterprise Growth',
      code: 'PLN-ENT-YR',
      productName: 'Cloud Sync Engine',
      frequency: 'YEARLY',
      price: 420000,
      minQuantity: 10,
      validity: '01 Jan 2024 - 31 Dec 2025',
      autoCloseDays: 14,
      pauseAllowed: true,
      maxPauseDays: 60,
      autoRenew: true,
      status: 'Active',
    },
    {
      id: 'pln-02',
      name: 'Pro Scale',
      code: 'PLN-PRO-MO',
      productName: 'Workflow Automation Core',
      frequency: 'MONTHLY',
      price: 14500,
      minQuantity: 5,
      validity: 'Perpetual / Ongoing',
      autoCloseDays: 7,
      pauseAllowed: true,
      maxPauseDays: 30,
      autoRenew: true,
      status: 'Active',
    },
    {
      id: 'pln-03',
      name: 'Starter Tier',
      code: 'PLN-STR-MO',
      productName: 'Billing Analytics Suite',
      frequency: 'MONTHLY',
      price: 4999,
      minQuantity: 1,
      validity: 'Perpetual / Ongoing',
      autoCloseDays: 0,
      pauseAllowed: false,
      maxPauseDays: 0,
      autoRenew: true,
      status: 'Active',
    },
    {
      id: 'pln-04',
      name: 'Agile Burst Worker',
      code: 'PLN-WRK-WK',
      productName: 'Compute Elastic Pipeline',
      frequency: 'WEEKLY',
      price: 1200,
      minQuantity: 2,
      validity: '01 Jun 2024 - 31 Dec 2024',
      autoCloseDays: 3,
      pauseAllowed: true,
      maxPauseDays: 7,
      autoRenew: false,
      status: 'Limited',
    },
    {
      id: 'pln-05',
      name: 'High-Frequency Ingestion',
      code: 'PLN-ING-DAY',
      productName: 'Kafka Event Buffer',
      frequency: 'DAILY',
      price: 350,
      minQuantity: 1,
      validity: 'Continuous Provisioning',
      autoCloseDays: 1,
      pauseAllowed: false,
      maxPauseDays: 0,
      autoRenew: true,
      status: 'Active',
    },
  ]);

  const [cadenceFilter, setCadenceFilter] = useState<'ALL' | 'YEARLY' | 'MONTHLY' | 'WEEKLY' | 'DAILY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Modal Form State
  const [formName, setFormName] = useState('Enterprise Custom SLA');
  const [formCode, setFormCode] = useState('PLN-CUST-YR');
  const [formFrequency, setFormFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('YEARLY');
  const [formPrice, setFormPrice] = useState<number>(350000);
  const [formMinQty, setFormMinQty] = useState<number>(5);
  const [formAutoClose, setFormAutoClose] = useState<number>(14);
  const [formPauseAllowed, setFormPauseAllowed] = useState(true);
  const [formMaxPause, setFormMaxPause] = useState<number>(60);
  const [formAutoRenew, setFormAutoRenew] = useState(true);

  useEffect(() => {
    const fetchBackendPlans = async () => {
      try {
        const data = await planService.getAll();
        if (data && data.length > 0) {
          const mapped: PlanItem[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code || `PLN-${p.billingFrequency.substring(0, 3)}`,
            productName: p.product ? p.product.name : 'Platform Suite',
            frequency: p.billingFrequency || 'MONTHLY',
            price: Number(p.costPrice || p.price || 0),
            minQuantity: p.minQuantity || 1,
            validity: p.startDate ? `${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}` : 'Perpetual',
            autoCloseDays: p.autoCloseDays || 14,
            pauseAllowed: p.allowPause ?? true,
            maxPauseDays: p.maxPauseDays || 30,
            autoRenew: p.allowRenew ?? true,
            status: p.isActive ? 'Active' : 'Archived',
          }));
          setPlans(mapped);
        }
      } catch (err) {
        console.info('Backend plans fetch fallback to Stitch demo catalog');
      }
    };
    fetchBackendPlans();
  }, []);

  const handleCreatePlan = async () => {
    try {
      await planService.create({
        name: formName,
        billingFrequency: formFrequency,
        costPrice: formPrice,
        minQuantity: formMinQty,
        autoCloseDays: formAutoClose,
        allowPause: formPauseAllowed,
        allowRenew: formAutoRenew,
      });
    } catch (e) {
      console.info('Backend plan create fallback');
    }

    const newPlan: PlanItem = {
      id: `pln-${Date.now()}`,
      name: formName,
      code: formCode,
      productName: 'Cloud Sync Engine',
      frequency: formFrequency,
      price: formPrice,
      minQuantity: formMinQty,
      validity: '01 Nov 2024 - 31 Oct 2025',
      autoCloseDays: formAutoClose,
      pauseAllowed: formPauseAllowed,
      maxPauseDays: formMaxPause,
      autoRenew: formAutoRenew,
      status: 'Active',
    };

    setPlans([newPlan, ...plans]);
    setIsModalOpen(false);
  };

  const filteredPlans = plans.filter((p) => {
    const matchesCadence = cadenceFilter === 'ALL' ? true : p.frequency === cadenceFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCadence && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#f5eaf9] text-[#6D286F] text-xs font-semibold tracking-wide uppercase">
              Product Catalog
            </span>
            <span className="text-[#81737e] text-xs">•</span>
            <span className="text-xs text-[#81737e]">Tier Governance Engine v2.4</span>
          </div>
          <h1 className="text-3xl font-bold text-[#1f1924] tracking-tight">Subscription Plans</h1>
          <p className="text-sm text-[#81737e] mt-0.5">
            Configure pricing tiers, billing cadences, commitment policies, and lifecycle permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => alert('Exporting subscription plan matrices...')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#EAE5EC] hover:bg-[#FAF9FB] text-[#1f1924] text-xs font-medium shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[18px] text-[#81737e]">file_download</span>
            <span>Export Plans</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6D286F] hover:bg-[#530D57] text-white text-xs font-semibold shadow-xs transition"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Create Subscription Plan</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              Active Catalog
            </span>
            <span className="p-2 rounded-lg bg-[#FAF9FB] text-[#6D286F]">
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1f1924]">{plans.length}</span>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Live Tiers
              </span>
            </div>
            <p className="text-xs text-[#81737e] mt-1">Multi-frequency billing enabled</p>
          </div>
          <div className="w-full bg-[#f5eaf9] rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-[#6D286F] h-full rounded-full" style={{ width: '75%' }} />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              Most Popular Tier
            </span>
            <span className="p-2 rounded-lg bg-[#FAF9FB] text-[#84418A]">
              <span className="material-symbols-outlined text-[20px]">stars</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="text-sm font-bold text-[#1f1924] truncate">Enterprise Growth</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-[#6D286F]">1,140</span>
              <span className="text-xs text-[#81737e]">Active Subscriptions</span>
            </div>
            <p className="text-xs text-[#81737e] mt-1">Annual cadence • 68% total ARR share</p>
          </div>
          <div className="w-full bg-[#f5eaf9] rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-[#84418A] h-full rounded-full" style={{ width: '68%' }} />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              Supported Frequencies
            </span>
            <span className="p-2 rounded-lg bg-[#FAF9FB] text-[#6D286F]">
              <span className="material-symbols-outlined text-[20px]">schedule</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-medium text-[#1f1924]">
                Daily
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-medium text-[#1f1924]">
                Weekly
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#6D286F] text-white text-xs font-semibold">
                Monthly
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-medium text-[#1f1924]">
                Yearly
              </span>
            </div>
            <p className="text-xs text-[#81737e] mt-3">Multi-currency (INR, USD) active</p>
          </div>
          <div className="flex items-center gap-1 mt-3">
            <span className="h-1.5 flex-1 rounded-full bg-[#6D286F]" />
            <span className="h-1.5 flex-1 rounded-full bg-[#84418A]" />
            <span className="h-1.5 flex-1 rounded-full bg-[#421747]" />
            <span className="h-1.5 flex-1 rounded-full bg-[#eeb3ee]" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#81737e]">
              Realization Ratio
            </span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-800">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#1f1924]">94.2%</span>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +1.8%
              </span>
            </div>
            <p className="text-xs text-[#81737e] mt-1">Average renewal retention rate</p>
          </div>
          <div className="w-full bg-[#f5eaf9] rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: '94.2%' }} />
          </div>
        </div>
      </div>

      {/* Cadence Filters & Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-[#EAE5EC] shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Cadence Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['ALL', 'YEARLY', 'MONTHLY', 'WEEKLY', 'DAILY'] as const).map((cadence) => (
            <button
              key={cadence}
              onClick={() => setCadenceFilter(cadence)}
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                cadenceFilter === cadence
                  ? 'bg-[#6D286F] text-white shadow-xs font-semibold'
                  : 'bg-[#FAF9FB] text-[#1f1924] hover:bg-[#f5eaf9] border border-[#EAE5EC]'
              }`}
            >
              {cadence === 'ALL' ? 'All Cadences' : cadence}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#81737e] text-[18px]">
            search
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-[#1f1924] placeholder:text-[#81737e] text-xs outline-none focus:border-[#6D286F]"
            placeholder="Search plans by name, code, product..."
            type="text"
          />
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF9FB] text-[#81737e] uppercase tracking-wider font-semibold border-b border-[#EAE5EC]">
              <tr>
                <th className="py-3 px-5">Plan Code &amp; Tier</th>
                <th className="py-3 px-4">Linked Product</th>
                <th className="py-3 px-4">Cadence</th>
                <th className="py-3 px-4 text-right">Base Pricing (₹)</th>
                <th className="py-3 px-4">Min Qty</th>
                <th className="py-3 px-4">Availability Window</th>
                <th className="py-3 px-4">Governance Policies</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC] text-[#1f1924]">
              {filteredPlans.map((plan) => (
                <tr key={plan.id} className="hover:bg-[#FAF9FB] transition group">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[#6D286F] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {plan.code.substring(4, 7)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-[#1f1924]">{plan.name}</div>
                        <span className="text-[11px] text-[#81737e] font-mono">{plan.code}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 font-medium text-[#1f1924]">{plan.productName}</td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 ${
                        plan.frequency === 'YEARLY'
                          ? 'bg-purple-100 text-purple-900'
                          : plan.frequency === 'MONTHLY'
                          ? 'bg-blue-100 text-blue-900'
                          : plan.frequency === 'WEEKLY'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {plan.frequency === 'YEARLY'
                          ? 'calendar_month'
                          : plan.frequency === 'MONTHLY'
                          ? 'date_range'
                          : 'schedule'}
                      </span>
                      {plan.frequency}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right tabular-nums whitespace-nowrap">
                    <div className="text-sm font-bold text-[#1f1924]">
                      ₹{plan.price.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-[#81737e] block">
                      billed {plan.frequency.toLowerCase()}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-medium text-[#1f1924] whitespace-nowrap">
                    {plan.minQuantity} unit(s)
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-xs text-[#1f1924]">{plan.validity}</div>
                    <span className="text-[10px] text-emerald-700">Valid</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      <span className="px-2 py-0.5 rounded bg-[#FAF9FB] border border-[#EAE5EC] text-[10px] text-[#1f1924]">
                        Auto-Close: {plan.autoCloseDays}d
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#FAF9FB] border border-[#EAE5EC] text-[10px] text-[#1f1924]">
                        Pause: {plan.pauseAllowed ? `${plan.maxPauseDays}d` : 'Disabled'}
                      </span>
                      {plan.autoRenew && (
                        <span className="px-2 py-0.5 rounded bg-[#f5eaf9] text-[#6D286F] text-[10px] font-semibold">
                          Auto-Renew
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                      {plan.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 text-[#81737e]">
                      <button
                        type="button"
                        onClick={() => {
                          setFormName(plan.name);
                          setFormPrice(plan.price);
                          setFormFrequency(plan.frequency);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg hover:text-[#1f1924] hover:bg-[#FAF9FB]"
                        title="Edit Plan"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#FAF9FB] border-b border-[#EAE5EC] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1f1924]">Create / Configure Subscription Plan</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#81737e] hover:text-[#1f1924]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1f1924] pb-1">Plan Name</label>
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs font-medium text-[#1f1924]"
                  type="text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">
                    Billing Frequency
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">
                    Base Price (₹)
                  </label>
                  <input
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs font-bold text-[#1f1924]"
                    type="number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">
                    Minimum Quantity
                  </label>
                  <input
                    value={formMinQty}
                    onChange={(e) => setFormMinQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs"
                    type="number"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1f1924] pb-1">
                    Auto-Close Days if Unpaid
                  </label>
                  <input
                    value={formAutoClose}
                    onChange={(e) => setFormAutoClose(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs"
                    type="number"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#1f1924]">Allow Subscription Pause</span>
                  <input
                    type="checkbox"
                    checked={formPauseAllowed}
                    onChange={(e) => setFormPauseAllowed(e.target.checked)}
                    className="rounded text-[#6D286F]"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#1f1924]">Enable Auto-Renewal</span>
                  <input
                    type="checkbox"
                    checked={formAutoRenew}
                    onChange={(e) => setFormAutoRenew(e.target.checked)}
                    className="rounded text-[#6D286F]"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#FAF9FB] border-t border-[#EAE5EC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white border border-[#EAE5EC] text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePlan}
                className="px-4 py-2 rounded-lg bg-[#6D286F] text-white hover:bg-[#530D57] text-xs font-semibold"
              >
                Save Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManager;
