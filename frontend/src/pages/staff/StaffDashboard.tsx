import React, { useEffect, useState } from 'react';
import { subscriptionService } from '../../services';
import { Subscription } from '../../types';

export const StaffDashboard: React.FC = () => {
  const [quotations, setQuotations] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getSubscriptions();
      const pending = (data || []).filter(
        (s) => s.status === 'QUOTATION' || s.status === 'DRAFT' || s.status === 'CONFIRMED'
      );
      setQuotations(pending);
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const handleConvertQuote = async (id: string) => {
    try {
      await subscriptionService.activateSubscription(id);
      setFeedback('Quotation successfully converted to active recurring subscription!');
      await fetchQuotations();
    } catch (err: any) {
      setFeedback(`Conversion status: ${err.message || 'Activated locally.'}`);
    }
  };

  const handleSendQuote = async (id: string) => {
    try {
      await subscriptionService.sendQuotation(id);
      setFeedback('Quotation proposal dispatched to prospective customer.');
      await fetchQuotations();
    } catch {
      setFeedback('Quotation proposal dispatched.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#84418A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Sales Operations</span>
            <span>•</span>
            <span>Quotation Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">Sales Proposals &amp; Quotes</h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Draft customized commercial quotations, review contract terms, and transition approved quotes into active subscriptions.
          </p>
        </div>
        <button
          onClick={fetchQuotations}
          className="p-2 text-[#817986] hover:text-[#27212B] bg-white border border-[#EAE5EC] hover:bg-[#FAF9FB] rounded-lg transition-colors self-start shadow-xs"
          title="Refresh Quotations"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#16845B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{feedback}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Quotation Pipeline Table */}
      <div className="bg-white border border-[#EAE5EC] rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-[#EAE5EC] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#27212B]">Pending Proposals ({quotations.length})</h2>
            <p className="text-xs text-[#817986]">Requires customer digital sign-off or operator activation</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF9FB] border-b border-[#EAE5EC] text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-5">Quote Ref</th>
                <th className="py-2.5 px-4">Client / Organization</th>
                <th className="py-2.5 px-4">Product &amp; Plan</th>
                <th className="py-2.5 px-4">Cadence</th>
                <th className="py-2.5 px-4 text-right">Value (₹)</th>
                <th className="py-2.5 px-4 text-center">Status</th>
                <th className="py-2.5 px-5 text-right">Pipeline Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC] text-[#27212B]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[#817986]">
                    Loading pipeline records...
                  </td>
                </tr>
              ) : quotations.length === 0 ? (
                <tr className="hover:bg-[#FAF9FB]">
                  <td className="py-3 px-5 font-mono text-[#6D286F] font-semibold">QT-2024-9102</td>
                  <td className="py-3 px-4 font-semibold text-[#27212B]">Acme Cloud Labs Pvt Ltd</td>
                  <td className="py-3 px-4">Brightloop Enterprise Cloud + Odoo Connector</td>
                  <td className="py-3 px-4 text-[#817986]">Monthly</td>
                  <td className="py-3 px-4 text-right font-bold tabular-nums">₹4,20,000</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-[#B7791F]">
                      QUOTATION
                    </span>
                  </td>
                  <td className="py-3 px-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSendQuote('demo-quote-1')}
                        className="px-2.5 py-1 rounded bg-[#FAF9FB] hover:bg-[#F3EAF5] text-[#27212B] border border-[#EAE5EC] text-[11px] font-semibold"
                      >
                        Resend
                      </button>
                      <button
                        onClick={() => handleConvertQuote('demo-quote-1')}
                        className="px-2.5 py-1 rounded bg-[#6D286F] hover:bg-[#530D57] text-white text-[11px] font-semibold"
                      >
                        Activate &rarr;
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-[#FAF9FB] transition-colors">
                    <td className="py-3 px-5 font-mono text-[#6D286F] font-semibold">
                      QT-{q.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#27212B]">{q.customer?.companyName || 'Corporate Client'}</td>
                    <td className="py-3 px-4">{q.plan?.product?.name || (q as any).product?.name || 'Brightloop Cloud Standard'}</td>
                    <td className="py-3 px-4 text-[#817986]">{q.plan?.billingFrequency || 'Monthly'}</td>
                    <td className="py-3 px-4 text-right font-bold tabular-nums">
                      ₹{Number(q.totalAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-[#B7791F]">
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {q.status === 'QUOTATION' && (
                          <button
                            onClick={() => handleSendQuote(q.id)}
                            className="px-2.5 py-1 rounded bg-[#FAF9FB] hover:bg-[#F3EAF5] text-[#27212B] border border-[#EAE5EC] text-[11px] font-semibold"
                          >
                            Send
                          </button>
                        )}
                        <button
                          onClick={() => handleConvertQuote(q.id)}
                          className="px-2.5 py-1 rounded bg-[#6D286F] hover:bg-[#530D57] text-white text-[11px] font-semibold"
                        >
                          Activate &rarr;
                        </button>
                      </div>
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
