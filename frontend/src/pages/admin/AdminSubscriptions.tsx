import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Subscription, SubscriptionStatus } from '../../types';
import { Badge } from '../../components/Badge';
import { Play, Pause, XCircle, CheckCircle, RefreshCw, Filter, Clock } from 'lucide-react';

export const AdminSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const endpoint =
        statusFilter === 'ALL'
          ? '/subscriptions'
          : `/subscriptions?status=${statusFilter}`;
      const data = await ApiClient.get<Subscription[]>(endpoint);
      setSubscriptions(data);
    } catch (err) {
      // Mock Fallback
      setSubscriptions([
        {
          id: 'sub-01',
          subscriptionNumber: 'SUB-2026-0001',
          customerId: 'cust-1',
          planId: 'plan-1',
          status: 'ACTIVE',
          quantity: 1,
          unitPrice: 99.0,
          discountAmount: 0,
          totalAmount: 99.0,
          paymentTerms: 'IMMEDIATE',
          startDate: '2026-01-01T00:00:00Z',
          expiryDate: '2027-01-01T00:00:00Z',
          nextBillingDate: '2026-11-01T00:00:00Z',
          createdAt: '2026-01-01T00:00:00Z',
          customer: {
            id: 'c1',
            name: 'Acme Corporation',
            email: 'billing@acmecorp.com',
            companyName: 'Acme Corp',
            role: 'CUSTOMER',
            createdAt: '',
          },
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
          },
        },
        {
          id: 'sub-02',
          subscriptionNumber: 'SUB-2026-0002',
          customerId: 'cust-2',
          planId: 'plan-2',
          status: 'QUOTATION',
          quantity: 2,
          unitPrice: 990.0,
          discountAmount: 198.0,
          totalAmount: 1782.0,
          paymentTerms: 'NET30',
          createdAt: '2026-10-25T00:00:00Z',
          customer: {
            id: 'c2',
            name: 'Global Logistics Ltd',
            email: 'admin@globallogistics.com',
            role: 'CUSTOMER',
            createdAt: '',
          },
          plan: {
            id: 'p2',
            productId: 'prod-1',
            name: 'Cloud ERP Enterprise',
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
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'activate' | 'pause' | 'resume' | 'close' | 'renew' | 'confirm') => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/${action}`, {});
      fetchSubscriptions();
    } catch (err: any) {
      alert(err.message || `Failed to execute ${action}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Subscriptions Lifecycle</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage contract progression: Draft &rarr; Quotation &rarr; Confirmed &rarr; Active &rarr; Closed
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 font-semibold">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">All States</option>
            <option value="DRAFT">Draft</option>
            <option value="QUOTATION">Quotation</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-900/90 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Plan & Cadence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Billing</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Fetching subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No subscriptions found matching the selected filter.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-400">
                      {sub.subscriptionNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{sub.customer?.name}</p>
                      <p className="text-xs text-slate-400">{sub.customer?.companyName || sub.customer?.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-white font-medium">{sub.plan?.name}</p>
                      <p className="text-xs text-slate-400">
                        Qty: {sub.quantity} • {sub.plan?.billingFrequency}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge status={sub.status} />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      {sub.nextBillingDate
                        ? new Date(sub.nextBillingDate).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      ${Number(sub.totalAmount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      {sub.status === 'QUOTATION' && (
                        <button
                          onClick={() => handleAction(sub.id, 'confirm')}
                          title="Confirm Quotation"
                          className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
                        >
                          Confirm
                        </button>
                      )}
                      {sub.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleAction(sub.id, 'activate')}
                          title="Activate Subscription"
                          className="px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                        >
                          Activate
                        </button>
                      )}
                      {sub.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => handleAction(sub.id, 'pause')}
                            title="Pause Subscription"
                            className="p-1.5 text-xs text-amber-400 hover:bg-amber-500/10 rounded-lg transition"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAction(sub.id, 'renew')}
                            title="Renew Subscription"
                            className="p-1.5 text-xs text-brand-400 hover:bg-brand-500/10 rounded-lg transition"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {sub.status === 'PAUSED' && (
                        <button
                          onClick={() => handleAction(sub.id, 'resume')}
                          title="Resume Subscription"
                          className="p-1.5 text-xs text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {sub.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleAction(sub.id, 'close')}
                          title="Cancel/Close"
                          className="p-1.5 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
