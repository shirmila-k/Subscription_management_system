import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Plan, BillingFrequency } from '../../types';
import { Modal } from '../../components/Modal';
import { Calendar, Plus, CheckCircle, ShieldCheck, Clock } from 'lucide-react';

export const AdminPlans: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [cost, setCost] = useState('99');
  const [billingFrequency, setBillingFrequency] = useState<BillingFrequency>('MONTHLY');
  const [minimumQuantity, setMinimumQuantity] = useState('1');
  const [trialDays, setTrialDays] = useState('14');
  const [gracePeriodDays, setGracePeriodDays] = useState('7');
  const [autoClose, setAutoClose] = useState(true);
  const [autoRenew, setAutoRenew] = useState(true);
  const [pauseAllowed, setPauseAllowed] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Plan[]>('/plans');
      setPlans(data);
    } catch (err) {
      // Mock Fallback
      setPlans([
        {
          id: 'p1',
          productId: 'prod-1',
          name: 'Cloud ERP Professional (Monthly)',
          billingFrequency: 'MONTHLY',
          cost: 99.0,
          currency: 'USD',
          minimumQuantity: 1,
          autoClose: true,
          autoRenew: true,
          pauseAllowed: true,
          trialPeriodDays: 14,
          gracePeriodDays: 7,
          isActive: true,
          product: {
            id: 'prod-1',
            name: 'Brightloop Cloud ERP Platform',
            sku: 'PROD-BL-ERP-01',
            isActive: true,
          },
        },
        {
          id: 'p2',
          productId: 'prod-1',
          name: 'Cloud ERP Enterprise (Annual)',
          billingFrequency: 'YEARLY',
          cost: 990.0,
          currency: 'USD',
          minimumQuantity: 1,
          autoClose: true,
          autoRenew: true,
          pauseAllowed: true,
          trialPeriodDays: 30,
          gracePeriodDays: 15,
          isActive: true,
          product: {
            id: 'prod-1',
            name: 'Brightloop Cloud ERP Platform',
            sku: 'PROD-BL-ERP-01',
            isActive: true,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In production fetch actual productId
      await ApiClient.post('/plans', {
        productId: plans[0]?.productId || 'mock-prod-id',
        name,
        cost: Number(cost),
        billingFrequency,
        minimumQuantity: Number(minimumQuantity),
        trialPeriodDays: Number(trialDays),
        gracePeriodDays: Number(gracePeriodDays),
        autoClose,
        autoRenew,
        pauseAllowed,
      });
      setIsModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Failed to create plan');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Pricing & Billing Plans</h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure frequencies (Daily, Weekly, Monthly, Yearly) and lifecycle governance rules
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/30 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Plan</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading pricing plans...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                    {plan.billingFrequency}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mt-3">{plan.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{plan.product?.name}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white">${Number(plan.cost).toFixed(2)}</span>
                  <span className="text-xs text-slate-400 font-medium">/ {plan.billingFrequency.toLowerCase()}</span>
                </div>

                <div className="mt-6 space-y-2 border-t border-slate-800/80 pt-4 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min. Quantity:</span>
                    <span className="font-semibold text-white">{plan.minimumQuantity} seat(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trial Period:</span>
                    <span className="font-semibold text-white">{plan.trialPeriodDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Grace Period:</span>
                    <span className="font-semibold text-white">{plan.gracePeriodDays} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Auto-Close on Expiry:</span>
                    <span className={`font-semibold ${plan.autoClose ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {plan.autoClose ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pause Permitted:</span>
                    <span className={`font-semibold ${plan.pauseAllowed ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {plan.pauseAllowed ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                  Auto-Renew: {plan.autoRenew ? 'Active' : 'Off'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan creation modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Subscription Plan">
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Plan Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Cloud ERP Professional (Quarterly)"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cost ($ USD)</label>
              <input
                type="number"
                step="0.01"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Frequency</label>
              <select
                value={billingFrequency}
                onChange={(e) => setBillingFrequency(e.target.value as BillingFrequency)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Min. Quantity</label>
              <input
                type="number"
                value={minimumQuantity}
                onChange={(e) => setMinimumQuantity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Trial Days</label>
              <input
                type="number"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Grace Period (Days)</label>
              <input
                type="number"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2 text-xs">
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoClose}
                onChange={(e) => setAutoClose(e.target.checked)}
                className="rounded text-brand-600 focus:ring-0"
              />
              Auto-close subscription after grace period if unpaid
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
                className="rounded text-brand-600 focus:ring-0"
              />
              Automatic contract renewal on expiration date
            </label>
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={pauseAllowed}
                onChange={(e) => setPauseAllowed(e.target.checked)}
                className="rounded text-brand-600 focus:ring-0"
              />
              Allow customer or staff to pause subscription
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md transition"
            >
              Create Plan
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
