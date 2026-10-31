import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Subscription } from '../../types';
import { Badge } from '../../components/Badge';
import { Calendar, Layers, Pause, Play, CheckCircle2, Clock } from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMySubscriptions();
  }, []);

  const fetchMySubscriptions = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Subscription[]>('/subscriptions');
      setSubscriptions(data);
    } catch (err) {
      // Mock Fallback
      setSubscriptions([
        {
          id: 'sub-01',
          subscriptionNumber: 'SUB-2026-0001',
          customerId: 'mock-customer-01',
          planId: 'plan-1',
          status: 'ACTIVE',
          quantity: 5,
          unitPrice: 99.0,
          discountAmount: 0,
          totalAmount: 495.0,
          paymentTerms: 'IMMEDIATE',
          startDate: '2026-01-01T00:00:00Z',
          expiryDate: '2027-01-01T00:00:00Z',
          nextBillingDate: '2026-11-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          plan: {
            id: 'p1',
            productId: 'prod-1',
            name: 'Cloud ERP Professional',
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
              isActive: true,
            },
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/pause`, {});
      fetchMySubscriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to pause subscription');
    }
  };

  const handleResume = async (id: string) => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/resume`, {});
      fetchMySubscriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to resume subscription');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Customer Portal</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review your enrolled service subscriptions, active recurring cycles, and billing schedules
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading your active subscriptions...
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 border border-slate-800 text-center">
          <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No active subscriptions</h3>
          <p className="text-sm text-slate-400 mt-1">
            Browse our software catalog to subscribe to enterprise platforms.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subscriptions.map((sub) => (
            <div
              key={sub.id}
              className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-lg border border-brand-500/20">
                    {sub.subscriptionNumber}
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-2">
                    {sub.plan?.product?.name || sub.plan?.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{sub.plan?.name}</p>
                </div>
                <Badge status={sub.status} />
              </div>

              <div className="grid grid-cols-2 gap-3 glass-card p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <p className="text-slate-400">Billing Cadence</p>
                  <p className="font-semibold text-white mt-0.5 capitalize">
                    {sub.plan?.billingFrequency.toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Quantity / Seats</p>
                  <p className="font-semibold text-white mt-0.5">{sub.quantity} units</p>
                </div>
                <div>
                  <p className="text-slate-400">Next Billing Date</p>
                  <p className="font-semibold text-emerald-400 mt-0.5">
                    {sub.nextBillingDate
                      ? new Date(sub.nextBillingDate).toLocaleDateString()
                      : 'Pending'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Total Per Cycle</p>
                  <p className="font-extrabold text-white mt-0.5">
                    ${Number(sub.totalAmount).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Terms: <span className="text-white font-medium">{sub.paymentTerms}</span>
                </span>

                <div className="space-x-2">
                  {sub.status === 'ACTIVE' && sub.plan?.pauseAllowed && (
                    <button
                      onClick={() => handlePause(sub.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      Pause Plan
                    </button>
                  )}
                  {sub.status === 'PAUSED' && (
                    <button
                      onClick={() => handleResume(sub.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Resume Plan
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
