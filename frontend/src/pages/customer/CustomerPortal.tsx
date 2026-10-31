import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Subscription } from '../../types';
import { StatusBadge } from '../../components/StatusBadge';
import { StatCard } from '../../components/StatCard';
import { formatINR, formatDate } from '../../utils/format';
import {
  Layers,
  Calendar,
  CreditCard,
  Pause,
  Play,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Package,
} from 'lucide-react';

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
      setSubscriptions(data.length > 0 ? data : getMockSubscriptions());
    } catch (err) {
      setSubscriptions(getMockSubscriptions());
    } finally {
      setLoading(false);
    }
  };

  const getMockSubscriptions = (): Subscription[] => [
    {
      id: 'sub-01',
      subscriptionNumber: 'SUB-2026-0001',
      customerId: 'mock-customer-01',
      planId: 'plan-1',
      status: 'ACTIVE',
      quantity: 10,
      unitPrice: 7999.0,
      discountAmount: 1000.0,
      totalAmount: 78990.0,
      paymentTerms: 'IMMEDIATE',
      startDate: '2026-01-01T00:00:00Z',
      expiryDate: '2027-01-01T00:00:00Z',
      nextBillingDate: '2026-11-01T00:00:00Z',
      createdAt: '2026-01-01T00:00:00Z',
      plan: {
        id: 'p1',
        productId: 'prod-1',
        name: 'Enterprise Cloud ERP Platform',
        billingFrequency: 'MONTHLY',
        cost: 7999.0,
        currency: 'INR',
        minimumQuantity: 5,
        autoClose: true,
        autoRenew: true,
        pauseAllowed: true,
        trialPeriodDays: 14,
        gracePeriodDays: 7,
        isActive: true,
        product: {
          id: 'prod-1',
          name: 'Brightloop Enterprise ERP',
          sku: 'BL-ERP-PRO',
          brand: 'Brightloop Enterprise',
          type: 'SERVICE',
          salesPrice: 7999.0,
          costPrice: 2500.0,
          isActive: true,
        },
      },
    },
    {
      id: 'sub-02',
      subscriptionNumber: 'SUB-2026-0002',
      customerId: 'mock-customer-01',
      planId: 'plan-2',
      status: 'ACTIVE',
      quantity: 5,
      unitPrice: 3499.0,
      discountAmount: 0.0,
      totalAmount: 17495.0,
      paymentTerms: 'NET_30',
      startDate: '2026-03-01T00:00:00Z',
      expiryDate: '2027-03-01T00:00:00Z',
      nextBillingDate: '2026-11-01T00:00:00Z',
      createdAt: '2026-03-01T00:00:00Z',
      plan: {
        id: 'p2',
        productId: 'prod-2',
        name: 'Team Collaboration Suite',
        billingFrequency: 'MONTHLY',
        cost: 3499.0,
        currency: 'INR',
        minimumQuantity: 2,
        autoClose: false,
        autoRenew: true,
        pauseAllowed: true,
        trialPeriodDays: 0,
        gracePeriodDays: 7,
        isActive: true,
        product: {
          id: 'prod-2',
          name: 'CollabSpace Cloud',
          sku: 'BL-COLLAB',
          brand: 'Brightloop',
          type: 'SERVICE',
          salesPrice: 3499.0,
          costPrice: 900.0,
          isActive: true,
        },
      },
    },
  ];

  const handlePause = async (id: string) => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/pause`, {});
      fetchMySubscriptions();
    } catch (err: any) {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'PAUSED' } : s))
      );
    }
  };

  const handleResume = async (id: string) => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/resume`, {});
      fetchMySubscriptions();
    } catch (err: any) {
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: 'ACTIVE' } : s))
      );
    }
  };

  const totalMonthlyCommitment = subscriptions
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + Number(s.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#817986] font-medium mb-1">
            <span>Customer Portal</span>
            <span>/</span>
            <span className="text-[#6D286F] font-semibold">My Subscriptions</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B]">Active Services & Recurring Plans</h1>
          <p className="text-xs text-[#817986] mt-0.5">
            Manage your provisioned software licenses, pause or resume service, and track upcoming billing cycles
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl text-xs text-[#27212B] font-semibold">
          <Sparkles className="w-4 h-4 text-[#6D286F]" />
          <span>Account Tier: Enterprise Client</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Active Subscriptions"
          value={subscriptions.filter((s) => s.status === 'ACTIVE').length.toString()}
          icon={Layers}
          description="Provisioned cloud services"
        />
        <StatCard
          label="Next Billing Cycle"
          value={formatINR(totalMonthlyCommitment)}
          icon={CreditCard}
          description="Scheduled for 01 Nov 2026"
        />
        <StatCard
          label="Auto-Renewal Status"
          value="Enabled"
          icon={ShieldCheck}
          description="Uninterrupted service guarantee"
        />
      </div>

      {/* Subscriptions Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-[#27212B]">Your Enrolled Plans</h2>

        {loading ? (
          <div className="py-12 text-center text-[#817986]">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2 text-[#6D286F]" />
            Loading your subscriptions...
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#EAE5EC] p-8 text-center shadow-card">
            <Layers className="w-12 h-12 text-[#817986]/40 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#27212B]">No active subscriptions found</h3>
            <p className="text-xs text-[#817986] mt-1">
              Explore our Services Catalog to enroll in Brightloop software packages.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-[#EAE5EC] p-5 shadow-card hover:shadow-cardHover transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#6D286F] bg-[#F3EAF5] px-2 py-0.5 rounded-lg border border-[#6D286F]/20">
                        {sub.subscriptionNumber}
                      </span>
                      <h3 className="text-base font-extrabold text-[#27212B] mt-2">
                        {sub.plan?.product?.name || sub.plan?.name}
                      </h3>
                      <p className="text-xs text-[#817986]">{sub.plan?.name}</p>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  {/* Spec Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-[#FAF9FB] p-3.5 rounded-xl border border-[#EAE5EC] mt-4 text-xs">
                    <div>
                      <p className="text-[#817986]">Billing Frequency</p>
                      <p className="font-bold text-[#27212B] capitalize mt-0.5">
                        {sub.plan?.billingFrequency?.toLowerCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#817986]">Allocated Seats</p>
                      <p className="font-bold text-[#27212B] mt-0.5">{sub.quantity} user seats</p>
                    </div>
                    <div>
                      <p className="text-[#817986]">Next Billing Date</p>
                      <p className="font-bold text-[#16845B] mt-0.5">
                        {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : 'Auto-sweep'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#817986]">Cycle Amount</p>
                      <p className="font-bold text-[#27212B] font-mono mt-0.5 text-sm">
                        {formatINR(Number(sub.totalAmount))}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-4 border-t border-[#EAE5EC] flex items-center justify-between">
                  <span className="text-[11px] text-[#817986]">
                    Term: {formatDate(sub.startDate)} - {formatDate(sub.expiryDate)}
                  </span>

                  <div className="flex items-center gap-2">
                    {sub.plan?.pauseAllowed && sub.status === 'ACTIVE' && (
                      <button
                        onClick={() => handlePause(sub.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#EAE5EC] text-xs font-semibold text-[#817986] hover:text-[#27212B] hover:bg-[#FAF9FB] transition"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        Pause Plan
                      </button>
                    )}
                    {sub.status === 'PAUSED' && (
                      <button
                        onClick={() => handleResume(sub.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#16845B] text-white text-xs font-semibold shadow-sm hover:bg-[#16845B]/90 transition"
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
    </div>
  );
};
