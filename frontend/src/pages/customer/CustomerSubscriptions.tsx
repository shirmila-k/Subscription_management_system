import React, { useState } from 'react';

interface SubItem {
  id: string;
  name: string;
  subRef: string;
  planName: string;
  billingFrequency: string;
  startDate: string;
  renewalDate: string;
  price: number;
  status: 'ACTIVE' | 'PAUSED' | 'CLOSED';
  seats: number;
}

const CUSTOMER_SUBS: SubItem[] = [
  {
    id: 'sub-1',
    name: 'Brightloop Enterprise Cloud + Odoo Connector',
    subRef: 'SUB-2024-9102',
    planName: 'Monthly Enterprise Scale',
    billingFrequency: 'Monthly',
    startDate: '01 Jan 2024',
    renewalDate: '30 Nov 2024',
    price: 420000,
    status: 'ACTIVE',
    seats: 25,
  },
  {
    id: 'sub-2',
    name: 'API Edge Gateway Burstable Cluster',
    subRef: 'SUB-2024-8841',
    planName: 'Daily Burstable Unit',
    billingFrequency: 'Daily Metered',
    startDate: '15 Mar 2024',
    renewalDate: '30 Nov 2024',
    price: 145000,
    status: 'ACTIVE',
    seats: 10,
  },
  {
    id: 'sub-3',
    name: 'Legacy Analytics Sandbox (Archived)',
    subRef: 'SUB-2023-4019',
    planName: 'Yearly Committed Pro',
    billingFrequency: 'Yearly',
    startDate: '01 Jan 2023',
    renewalDate: '31 Dec 2023',
    price: 250000,
    status: 'CLOSED',
    seats: 5,
  },
];

export const CustomerSubscriptions: React.FC = () => {
  const [subs, setSubs] = useState<SubItem[]>(CUSTOMER_SUBS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePauseRequest = (id: string, name: string) => {
    setSubs((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const next = s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
          showToast(`Subscription status for ${name} switched to ${next}.`);
          return { ...s, status: next };
        }
        return s;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#421747] text-white px-4 py-3 rounded-xl shadow-lg border border-[#6D286F] animate-fade-in">
          <span className="material-symbols-outlined text-[20px] text-emerald-400">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#84418A] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Customer Self-Service</span>
            <span>•</span>
            <span>Active Contracts</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">My Subscriptions</h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Review provisioned cloud plans, billing frequencies, and manage subscription pause or renewals.
          </p>
        </div>
      </div>

      {/* Subscriptions List */}
      <div className="grid grid-cols-1 gap-4">
        {subs.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-[#6D286F]">{s.subRef}</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    s.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-[#16845B]'
                      : s.status === 'PAUSED'
                      ? 'bg-amber-50 text-[#B7791F]'
                      : 'bg-[#FAF9FB] text-[#817986] border border-[#EAE5EC]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      s.status === 'ACTIVE'
                        ? 'bg-emerald-600'
                        : s.status === 'PAUSED'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  ></span>
                  {s.status}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#27212B]">{s.name}</h3>
              <p className="text-xs text-[#817986]">
                Plan: <strong className="text-[#27212B]">{s.planName}</strong> • {s.seats} Allocated Team Seats •
                Started on {s.startDate}
              </p>
            </div>

            <div className="flex flex-col md:items-end justify-between self-stretch md:self-auto space-y-2">
              <div>
                <span className="text-xs text-[#817986]">Billing Rate</span>
                <div className="text-xl font-bold text-[#27212B] tabular-nums">
                  ₹{s.price.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-[#817986]">/ {s.billingFrequency}</span>
                </div>
                <span className="text-[11px] text-[#817986]">Next renewal: {s.renewalDate}</span>
              </div>

              {s.status !== 'CLOSED' && (
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handlePauseRequest(s.id, s.name)}
                    className="px-3 py-1.5 rounded-lg border border-[#EAE5EC] hover:bg-[#FAF9FB] text-xs font-semibold text-[#27212B] transition-colors"
                  >
                    {s.status === 'ACTIVE' ? 'Pause Service' : 'Resume Service'}
                  </button>
                  <button
                    onClick={() => showToast(`Renewal agreement confirmed for ${s.subRef}`)}
                    className="px-3 py-1.5 rounded-lg bg-[#6D286F] hover:bg-[#530D57] text-white text-xs font-semibold transition-colors"
                  >
                    Early Renew
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
