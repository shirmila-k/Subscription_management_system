import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { Product, Plan } from '../../types';
import {
  ShoppingBag,
  Check,
  Tag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<any | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodList, planList] = await Promise.all([
          api.getProducts({ isActive: true }),
          api.getPlans({ isActive: true }),
        ]);
        setProducts(prodList);
        setPlans(planList);
      } catch (err) {
        console.error('Error fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleValidateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiscountError(null);
    try {
      const res = await api.validateDiscount(discountCode, 1, 100);
      setAppliedDiscount(res.discount);
      setDiscountError(null);
    } catch (err: any) {
      setDiscountError(err.message || 'Invalid coupon code');
      setAppliedDiscount(null);
    }
  };

  const handleSubscribe = async (plan: Plan) => {
    setSubscribingPlanId(plan.id);
    try {
      await api.createSubscription({
        planId: plan.id,
        quantity: plan.minQuantity,
        discountCode: appliedDiscount?.code,
        status: 'QUOTATION',
      });
      setSuccessMessage(`Quotation requested for ${plan.name}! View it in your portal.`);
      setTimeout(() => navigate('/customer/subscriptions'), 1500);
    } catch (err: any) {
      setDiscountError(err.message);
    } finally {
      setSubscribingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RotateCw className="w-6 h-6 animate-spin text-cyan-400 mr-2" />
        <span>Loading product &amp; subscription catalog...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-cyan-400" />
          <span>Product &amp; Cloud Subscription Catalog</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Select cloud modules, enterprise Odoo solutions, and recurring service tiers with custom billing cycles.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-700/60 rounded-xl text-xs text-emerald-200">
          {successMessage}
        </div>
      )}

      {/* Coupon Application Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300 font-medium">Have an Enterprise Promotion Code?</span>
        </div>
        <form onSubmit={handleValidateCoupon} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Try: BRIGHT2026"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Apply
          </button>
        </form>
      </div>

      {appliedDiscount && (
        <div className="p-3 bg-cyan-950/40 border border-cyan-700/50 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>
            Coupon <strong className="font-mono">{appliedDiscount.code}</strong> applied ({appliedDiscount.value}
            {appliedDiscount.type === 'PERCENTAGE' ? '%' : '$'} discount).
          </span>
        </div>
      )}

      {discountError && (
        <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300">
          {discountError}
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition shadow-xl relative overflow-hidden group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {plan.product?.brand || 'Core Suite'}
                </span>
                <span className="text-xs font-mono text-slate-400 uppercase">
                  {plan.billingFrequency}
                </span>
              </div>

              <h2 className="text-lg font-black text-white">{plan.name}</h2>
              <p className="text-xs text-slate-400 mt-1 min-h-[36px]">
                {plan.description || plan.product?.description}
              </p>

              <div className="mt-4 pb-4 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white font-mono">
                    ${Number(plan.price).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400">/{plan.billingFrequency.toLowerCase()}</span>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cycle: {plan.billingCycleDays} billing days</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{plan.autoRenew ? 'Automatic renewal enabled' : 'Manual renewal terms'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{plan.canPause ? 'Flexible pause permitted' : 'Continuous term'}</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe(plan)}
              disabled={subscribingPlanId === plan.id}
              className="mt-6 w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-2 transition shadow-lg shadow-cyan-600/25 disabled:opacity-50"
            >
              <span>{subscribingPlanId === plan.id ? 'Creating Proposal...' : 'Request Quotation'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
