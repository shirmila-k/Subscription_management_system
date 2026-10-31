import React, { useEffect, useState } from 'react';
import { ApiClient } from '../../services/api';
import { Subscription } from '../../types';
import { Badge } from '../../components/Badge';
import { Check, ArrowRight, Clock, Inbox, ShieldCheck } from 'lucide-react';

export const StaffPanel: React.FC = () => {
  const [quotations, setQuotations] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotationsQueue();
  }, []);

  const fetchQuotationsQueue = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<Subscription[]>('/subscriptions?status=QUOTATION');
      setQuotations(data);
    } catch (err) {
      // Mock Fallback
      setQuotations([
        {
          id: 'sub-quote-01',
          subscriptionNumber: 'SUB-2026-0099',
          customerId: 'cust-1',
          planId: 'plan-1',
          status: 'QUOTATION',
          quantity: 10,
          unitPrice: 99.0,
          discountAmount: 198.0,
          totalAmount: 792.0,
          paymentTerms: 'NET30',
          quotationNotes: 'Enterprise deployment request with 10 user licenses and WELCOME20 applied.',
          createdAt: '2026-10-30T00:00:00Z',
          customer: {
            id: 'c1',
            name: 'Apex Industrial Systems',
            email: 'procurement@apexsys.com',
            companyName: 'Apex Systems Inc.',
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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmQuotation = async (id: string) => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/confirm`, {});
      fetchQuotationsQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm quotation');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await ApiClient.patch(`/subscriptions/${id}/activate`, {});
      fetchQuotationsQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to activate subscription');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Staff Operations Queue</h1>
        <p className="text-sm text-slate-400 mt-1">
          Review customer quotation requests, verify credit payment terms, and convert orders to confirmed subscriptions
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Pending Quotation Approvals</h3>
          </div>
          <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-semibold">
            {quotations.length} Queue Items
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">
            <Clock className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading pending queue items...
          </div>
        ) : quotations.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-white font-semibold">Queue is clear</p>
            <p className="text-xs text-slate-500 mt-1">No pending quotation orders at this moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotations.map((quote) => (
              <div
                key={quote.id}
                className="glass-card p-5 rounded-xl border border-slate-800/80 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-lg border border-brand-500/20">
                      {quote.subscriptionNumber}
                    </span>
                    <Badge status={quote.status} />
                    <span className="text-xs text-slate-400 font-medium">
                      Terms: <span className="text-slate-200">{quote.paymentTerms}</span>
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white">
                    {quote.customer?.companyName || quote.customer?.name}{' '}
                    <span className="text-xs font-normal text-slate-400">({quote.customer?.email})</span>
                  </h4>

                  <p className="text-xs text-slate-300">
                    Plan: <span className="font-semibold text-white">{quote.plan?.name}</span> •{' '}
                    {quote.quantity} Seat(s) • Subtotal: ${Number(quote.totalAmount).toFixed(2)}
                  </p>

                  {quote.quotationNotes && (
                    <p className="text-xs text-slate-400 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                      "{quote.quotationNotes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleConfirmQuotation(quote.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm Quote
                  </button>
                  <button
                    onClick={() => handleActivate(quote.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    Direct Activate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
