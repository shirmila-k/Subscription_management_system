import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Plan, Discount } from '../../types';
import { ShoppingCart, Check, Tag, Clock } from 'lucide-react';

export const CustomerCatalog: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState<{ code: string; calculatedDiscount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Plan[]>('/plans');
      setPlans(data);
      if (data.length > 0) setSelectedPlan(data[0]);
    } catch (err) {
      // Mock Fallback
      const mockPlans: Plan[] = [
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
            brand: 'Brightloop Enterprise',
            description: 'Core ERP suite including CRM, invoicing, project management, and automated ledgers.',
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
            brand: 'Brightloop Enterprise',
            description: 'Dedicated isolated deployment with 99.99% uptime guarantee and priority 24/7 SLA.',
            isActive: true,
          },
        },
      ];
      setPlans(mockPlans);
      setSelectedPlan(mockPlans[0]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode || !selectedPlan) return;
    setPromoError(null);
    try {
      const subtotal = Number(selectedPlan.cost) * quantity;
      const res = await ApiClient.post<{ valid: boolean; calculatedDiscount: number }>(
        '/discounts/validate',
        {
          code: promoCode,
          quantity,
          amount: subtotal,
        }
      );
      setDiscountInfo({
        code: promoCode,
        calculatedDiscount: res.calculatedDiscount,
      });
    } catch (err: any) {
      setPromoError(err.message || 'Invalid promotional code');
      setDiscountInfo(null);
    }
  };

  const handleRequestQuotation = async () => {
    if (!selectedPlan) return;
    setIsOrdering(true);
    setOrderSuccess(null);
    try {
      const res = await ApiClient.post('/subscriptions/quotations', {
        planId: selectedPlan.id,
        quantity,
        discountCode: discountInfo?.code,
        quotationNotes: `Order placed via Customer Catalog on ${new Date().toLocaleDateString()}`,
      });
      setOrderSuccess(
        `Quotation ${res.subscriptionNumber || 'SUB-CREATED'} submitted! Awaiting staff confirmation.`
      );
    } catch (err: any) {
      alert(err.message || 'Failed to submit quotation order.');
    } finally {
      setIsOrdering(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Services & Subscriptions Catalog</h1>
        <p className="text-sm text-slate-400 mt-1">
          Select your enterprise tier, customize user licenses, and apply promotional discounts
        </p>
      </div>

      {orderSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <Check className="w-5 h-5" />
          {orderSuccess}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading software plans...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plans Selection */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-bold text-white mb-2">Available Subscription Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans.map((plan) => {
                const isSelected = selectedPlan?.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => {
                      setSelectedPlan(plan);
                      setDiscountInfo(null);
                    }}
                    className={`glass-panel p-6 rounded-2xl border cursor-pointer transition duration-200 relative ${
                      isSelected
                        ? 'border-brand-500 ring-2 ring-brand-500/30 shadow-xl shadow-brand-500/10'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                        {plan.billingFrequency}
                      </span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-white mt-3">{plan.name}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {plan.product?.description || plan.description}
                    </p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">${Number(plan.cost).toFixed(2)}</span>
                      <span className="text-xs text-slate-400">/ {plan.billingFrequency.toLowerCase()}</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                      <p>✓ {plan.trialPeriodDays} days complimentary trial</p>
                      <p>✓ Cancel or pause anytime</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quotation / Checkout Summary Sidebar */}
          {selectedPlan && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6 h-fit sticky top-24">
              <h3 className="text-base font-bold text-white">Order Summary</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Quantity / Seats</label>
                  <input
                    type="number"
                    min={selectedPlan.minimumQuantity || 1}
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                      setDiscountInfo(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Promo Code Input */}
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Promo Voucher</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. WELCOME20"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase font-mono text-xs focus:outline-none focus:border-brand-500"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-brand-400 font-semibold rounded-xl border border-slate-700 text-xs transition"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="text-rose-400 text-[11px] mt-1">{promoError}</p>}
                  {discountInfo && (
                    <p className="text-emerald-400 text-[11px] mt-1 flex items-center gap-1 font-semibold">
                      <Check className="w-3.5 h-3.5" /> Voucher applied (-${discountInfo.calculatedDiscount.toFixed(2)})
                    </p>
                  )}
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="pt-4 border-t border-slate-800/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>
                    Subtotal ({quantity} seat{quantity > 1 ? 's' : ''})
                  </span>
                  <span>${(Number(selectedPlan.cost) * quantity).toFixed(2)}</span>
                </div>
                {discountInfo && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({discountInfo.code})</span>
                    <span>-${discountInfo.calculatedDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                  <span>Cycle Total</span>
                  <span>
                    $
                    {Math.max(
                      0,
                      Number(selectedPlan.cost) * quantity - (discountInfo?.calculatedDiscount || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isOrdering}
                onClick={handleRequestQuotation}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <ShoppingCart className="w-4 h-4" />
                {isOrdering ? 'Generating Quotation...' : 'Request Quotation'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
