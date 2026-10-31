import React, { useEffect, useState } from 'react';
import { subscriptionService, customerService, planService } from '../../services';

interface SubscriptionRow {
  id: string;
  code: string;
  companyName: string;
  contactEmail: string;
  initials: string;
  planName: string;
  addonsCount: string;
  cadence: string;
  commitmentFormatted: string;
  rateSuffix: string;
  taxNote: string;
  horizon: string;
  nextInvoice: string;
  mandateNote: string;
  status: 'ACTIVE' | 'QUOTATION' | 'CONFIRMED' | 'PAUSED' | 'CLOSED' | 'IN_DUNNING';
  statusDisplay: string;
}

export const SubscriptionsList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([
    {
      id: 'sub-01',
      code: 'SUB-9402',
      companyName: 'Acme Cloud Labs',
      contactEmail: 'rahul@acmecloud.in',
      initials: 'AC',
      planName: 'Enterprise Growth',
      addonsCount: '2 Addons',
      cadence: 'Annual (Prepaid)',
      commitmentFormatted: '₹4,20,000',
      rateSuffix: '/yr',
      taxNote: 'excl. 18% GST',
      horizon: '12 Nov 2023 → 11 Nov 2025',
      nextInvoice: '12 Nov 2024',
      mandateNote: 'e-Mandate ready',
      status: 'ACTIVE',
      statusDisplay: 'Active',
    },
    {
      id: 'sub-02',
      code: 'SUB-9401',
      companyName: 'FinEdge Technologies',
      contactEmail: 'billing@finedge.co.in',
      initials: 'FE',
      planName: 'Platform Tier 3',
      addonsCount: 'Standard',
      cadence: 'Monthly',
      commitmentFormatted: '₹48,000',
      rateSuffix: '/mo',
      taxNote: 'Incl. GST',
      horizon: '01 Jan 2024 → 31 Dec 2024',
      nextInvoice: '01 Dec 2024',
      mandateNote: 'Auto debit',
      status: 'ACTIVE',
      statusDisplay: 'Active',
    },
    {
      id: 'sub-03',
      code: 'SUB-9398',
      companyName: 'DataWeave Analytics',
      contactEmail: 'accounts@dataweave.ai',
      initials: 'DW',
      planName: 'Data Lake Scale',
      addonsCount: '4 Addons',
      cadence: 'Quarterly',
      commitmentFormatted: '₹2,15,000',
      rateSuffix: '/qtr',
      taxNote: 'excl. GST',
      horizon: '15 Jun 2024 → 14 Jun 2025',
      nextInvoice: '15 Dec 2024',
      mandateNote: 'Renewal Review',
      status: 'QUOTATION',
      statusDisplay: 'Pending Approval',
    },
    {
      id: 'sub-04',
      code: 'SUB-9387',
      companyName: 'HyperLogix India',
      contactEmail: 'procure@hyperlogix.in',
      initials: 'HL',
      planName: 'Enterprise Unlimited',
      addonsCount: 'Custom',
      cadence: 'Annual (Net-30)',
      commitmentFormatted: '₹8,90,000',
      rateSuffix: '/yr',
      taxNote: 'PO Bound',
      horizon: '10 Oct 2023 → 09 Oct 2024',
      nextInvoice: 'Past Due (14d)',
      mandateNote: 'Dunning Step 2',
      status: 'IN_DUNNING',
      statusDisplay: 'In Dunning',
    },
    {
      id: 'sub-05',
      code: 'SUB-9372',
      companyName: 'NexaHealth Solutions',
      contactEmail: 'finance@nexahealth.co',
      initials: 'NH',
      planName: 'HIPAA Secure Pro',
      addonsCount: '1 Addon',
      cadence: 'Annual (Prepaid)',
      commitmentFormatted: '₹5,50,000',
      rateSuffix: '/yr',
      taxNote: 'Wire Transfer',
      horizon: '01 Aug 2024 → 31 Jul 2026',
      nextInvoice: '01 Aug 2025',
      mandateNote: 'Verified Bank',
      status: 'ACTIVE',
      statusDisplay: 'Active',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'PAUSED' | 'EXPIRING' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // New Subscription Form State
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [plansList, setPlansList] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');

  const fetchBackendSubscriptions = async () => {
    try {
      const data = await subscriptionService.getAll();
      if (data && data.length > 0) {
        const mapped: SubscriptionRow[] = data.map((s: any, idx: number) => {
          const customerName = s.customer
            ? s.customer.companyName || `${s.customer.firstName || ''} ${s.customer.lastName || ''}`.trim() || s.customer.email
            : 'Enterprise Client';
          const email = s.customer ? s.customer.email : 'billing@client.com';
          return {
            id: s.id,
            code: s.code || `SUB-${9400 + idx}`,
            companyName: customerName,
            contactEmail: email,
            initials: customerName.substring(0, 2).toUpperCase(),
            planName: s.plan ? s.plan.name : 'Enterprise Custom',
            addonsCount: 'Active SLA',
            cadence: s.plan?.billingFrequency ? `${s.plan.billingFrequency} billing` : 'Monthly',
            commitmentFormatted: `₹${(s.totalAmount || s.price || 50000).toLocaleString('en-IN')}`,
            rateSuffix: s.plan?.billingFrequency === 'YEARLY' ? '/yr' : '/mo',
            taxNote: 'excl. 18% GST',
            horizon: s.startDate
              ? `${new Date(s.startDate).toLocaleDateString()} → ${new Date(s.endDate || Date.now() + 31536000000).toLocaleDateString()}`
              : 'Active Term',
            nextInvoice: s.nextBillingDate
              ? new Date(s.nextBillingDate).toLocaleDateString()
              : 'Auto debit',
            mandateNote: 'Active mandate',
            status: s.status,
            statusDisplay: s.status === 'ACTIVE' ? 'Active' : s.status === 'QUOTATION' ? 'Quotation' : s.status,
          };
        });
        setSubscriptions(mapped);
      }
    } catch (err) {
      console.info('Backend subscription list fallback to Stitch reference');
    }
  };

  useEffect(() => {
    fetchBackendSubscriptions();

    // Fetch lists for modal
    customerService.getAll().then(setCustomersList).catch(() => {});
    planService.getAll().then(setPlansList).catch(() => {});
  }, []);

  const handleLifecycleAction = async (subId: string, action: 'pause' | 'resume' | 'renew' | 'close') => {
    try {
      if (action === 'pause') await subscriptionService.pause(subId);
      if (action === 'resume') await subscriptionService.resume(subId);
      if (action === 'renew') await subscriptionService.renew(subId);
      if (action === 'close') await subscriptionService.close(subId);

      setActionFeedback(`Lifecycle action ${action.toUpperCase()} applied successfully.`);
      await fetchBackendSubscriptions();
    } catch (e: any) {
      // Local state update fallback
      setSubscriptions((prev) =>
        prev.map((sub) => {
          if (sub.id === subId) {
            const nextStatus = action === 'pause' ? 'PAUSED' : action === 'close' ? 'CLOSED' : 'ACTIVE';
            return {
              ...sub,
              status: nextStatus,
              statusDisplay: nextStatus === 'PAUSED' ? 'Paused' : nextStatus === 'CLOSED' ? 'Closed' : 'Active',
            };
          }
          return sub;
        })
      );
      setActionFeedback(`Status updated to ${action.toUpperCase()}`);
    }
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleCreateSubscription = async () => {
    try {
      await subscriptionService.create({
        customerId: selectedCustomerId || 'cust-01',
        planId: selectedPlanId || 'pln-01',
      });
      await fetchBackendSubscriptions();
    } catch (e) {
      console.info('Backend subscription create fallback');
      const newSub: SubscriptionRow = {
        id: `sub-${Date.now()}`,
        code: `SUB-${Math.floor(9400 + Math.random() * 100)}`,
        companyName: 'Apex Cloud Solutions',
        contactEmail: 'billing@apexcloud.in',
        initials: 'AC',
        planName: 'Enterprise Growth',
        addonsCount: 'Standard',
        cadence: 'Annual',
        commitmentFormatted: '₹4,20,000',
        rateSuffix: '/yr',
        taxNote: 'excl. GST',
        horizon: '01 Nov 2024 → 31 Oct 2025',
        nextInvoice: '01 Nov 2024',
        mandateNote: 'e-Mandate registered',
        status: 'ACTIVE',
        statusDisplay: 'Active',
      };
      setSubscriptions([newSub, ...subscriptions]);
    }
    setIsModalOpen(false);
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'ACTIVE') return matchesSearch && sub.status === 'ACTIVE';
    if (activeTab === 'PENDING') return matchesSearch && (sub.status === 'QUOTATION' || sub.status === 'CONFIRMED');
    if (activeTab === 'PAUSED') return matchesSearch && sub.status === 'PAUSED';
    if (activeTab === 'EXPIRING') return matchesSearch && sub.status === 'IN_DUNNING';
    if (activeTab === 'CLOSED') return matchesSearch && sub.status === 'CLOSED';
    return matchesSearch;
  });

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-[#1f1924] tracking-tight">Subscriptions</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#f5eaf9] text-[#6D286F] text-xs font-semibold">
              B2B Contracts
            </span>
          </div>
          <p className="text-sm text-[#81737e]">
            Manage client recurring contracts, renewals, and enterprise lifecycle status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => alert('Exporting all subscription contracts...')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#EAE5EC] text-[#1f1924] text-xs font-medium shadow-xs hover:bg-[#FAF9FB] transition"
          >
            <span className="material-symbols-outlined text-[18px] text-[#81737e]">file_download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6D286F] text-white text-xs font-semibold shadow-xs hover:bg-[#530D57] transition"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Create Subscription</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#81737e] font-semibold block">
                Total Subscriptions
              </span>
              <span className="text-2xl font-bold text-[#1f1924] mt-1 block">2,890</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FAF9FB] flex items-center justify-center text-[#6D286F]">
              <span className="material-symbols-outlined text-[22px]">all_inclusive</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-2">
            <span className="text-[#81737e]">All-time tracked</span>
            <span className="text-emerald-700 font-semibold">99.4% Fulfillment</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#81737e] font-semibold block">
                Active Contracts
              </span>
              <span className="text-2xl font-bold text-[#1f1924] mt-1 block">2,486</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-2">
            <div className="flex items-center gap-1 text-emerald-700 font-semibold">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>+12.8% MoM</span>
            </div>
            <span className="text-[#81737e]">₹18.4 Cr ARR</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#81737e] font-semibold block">
                Pending / In-Review
              </span>
              <span className="text-2xl font-bold text-[#1f1924] mt-1 block">164</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FEF6E9] text-[#B7791F] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">pending_actions</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-2">
            <div className="flex items-center gap-1 text-[#B7791F] font-semibold">
              <span className="material-symbols-outlined text-[16px]">priority_high</span>
              <span>Requires Approval</span>
            </div>
            <span className="text-[#81737e]">42 SLA risk</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#81737e] font-semibold block">
                Expiring / Dunning
              </span>
              <span className="text-2xl font-bold text-[#1f1924] mt-1 block">176</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-[#FDF0F2] text-[#C53B4B] flex items-center justify-center">
              <span className="material-symbols-outlined text-[22px]">warning</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs pt-2">
            <div className="flex items-center gap-1 text-[#C53B4B] font-semibold">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Within 30 Days</span>
            </div>
            <span className="text-[#81737e]">₹1.18 Cr at risk</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar & Lifecycle Segment Tabs */}
      <div className="bg-white rounded-xl p-5 border border-[#EAE5EC] shadow-xs space-y-4">
        {/* Search Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#81737e] text-[20px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#1f1924] placeholder:text-[#81737e] outline-none focus:border-[#6D286F]"
              placeholder="Search by Subscription ID, client name, email, plan..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-2">
            <select className="px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#1f1924] outline-none">
              <option>Cycle: All Cadences</option>
              <option>Yearly</option>
              <option>Monthly</option>
              <option>Quarterly</option>
            </select>
          </div>
        </div>

        {/* Lifecycle Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#EAE5EC]">
          {[
            { id: 'ALL', label: 'All', count: '2,890' },
            { id: 'ACTIVE', label: 'Active', count: '2,486' },
            { id: 'PENDING', label: 'Pending', count: '164' },
            { id: 'PAUSED', label: 'Paused', count: '98' },
            { id: 'EXPIRING', label: 'Expiring Soon', count: '78' },
            { id: 'CLOSED', label: 'Closed', count: '64' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              type="button"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'bg-[#6D286F] text-white shadow-xs'
                  : 'bg-[#FAF9FB] text-[#1f1924] hover:bg-[#f5eaf9] border border-[#EAE5EC]'
              }`}
            >
              {tab.label} <span className="ml-1 opacity-75 font-normal">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF9FB] text-[#81737e] uppercase tracking-wider font-semibold border-b border-[#EAE5EC]">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Subscription ID</th>
                <th className="py-3.5 px-4 font-semibold">Client Organization</th>
                <th className="py-3.5 px-4 font-semibold">Plan &amp; Config</th>
                <th className="py-3.5 px-4 font-semibold">Cadence</th>
                <th className="py-3.5 px-4 font-semibold text-right">Commitment (INR)</th>
                <th className="py-3.5 px-4 font-semibold">Contract Horizon</th>
                <th className="py-3.5 px-4 font-semibold">Next Invoice</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE5EC] text-[#1f1924]">
              {filteredSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-[#FAF9FB] transition group">
                  <td className="py-3.5 px-4 font-semibold text-[#6D286F] whitespace-nowrap">
                    {sub.code}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5 min-w-[190px]">
                      <div className="w-8 h-8 rounded-lg bg-[#f5eaf9] text-[#6D286F] flex items-center justify-center font-bold text-xs shrink-0">
                        {sub.initials}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-[#1f1924] truncate">
                          {sub.companyName}
                        </span>
                        <span className="text-[#81737e] text-[11px] truncate">{sub.contactEmail}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1f1924]">{sub.planName}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#FAF9FB] border border-[#EAE5EC] text-[10px] text-[#81737e]">
                        {sub.addonsCount}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-[#81737e]">{sub.cadence}</td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap tabular-nums">
                    <div className="font-bold text-[#1f1924]">
                      {sub.commitmentFormatted}{' '}
                      <span className="text-[11px] text-[#81737e] font-normal">{sub.rateSuffix}</span>
                    </div>
                    <span className="text-[10px] text-[#81737e]">{sub.taxNote}</span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[#81737e]">
                    {sub.horizon}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-medium text-[#1f1924]">{sub.nextInvoice}</div>
                    <span className="text-[10px] text-[#81737e]">{sub.mandateNote}</span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        sub.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : sub.status === 'QUOTATION'
                          ? 'bg-[#FEF6E9] text-[#B7791F]'
                          : sub.status === 'IN_DUNNING'
                          ? 'bg-[#FDF0F2] text-[#C53B4B]'
                          : sub.status === 'PAUSED'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {sub.statusDisplay}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 text-[#81737e]">
                      {sub.status === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() => handleLifecycleAction(sub.id, 'pause')}
                          className="p-1 rounded hover:bg-[#FAF9FB] hover:text-[#B7791F]"
                          title="Pause Subscription"
                        >
                          <span className="material-symbols-outlined text-[18px]">pause_circle</span>
                        </button>
                      )}
                      {sub.status === 'PAUSED' && (
                        <button
                          type="button"
                          onClick={() => handleLifecycleAction(sub.id, 'resume')}
                          className="p-1 rounded hover:bg-[#FAF9FB] hover:text-emerald-700"
                          title="Resume Subscription"
                        >
                          <span className="material-symbols-outlined text-[18px]">play_circle</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleLifecycleAction(sub.id, 'renew')}
                        className="p-1 rounded hover:bg-[#FAF9FB] hover:text-[#6D286F]"
                        title="Renew Contract"
                      >
                        <span className="material-symbols-outlined text-[18px]">autorenew</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLifecycleAction(sub.id, 'close')}
                        className="p-1 rounded hover:bg-[#FAF9FB] hover:text-[#C53B4B]"
                        title="Close Agreement"
                      >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#FAF9FB] border-b border-[#EAE5EC] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1f1924]">Provision New B2B Subscription</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#81737e] hover:text-[#1f1924]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1f1924] pb-1">
                  Select Customer Entity
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs text-[#1f1924]"
                >
                  <option value="">Acme Cloud Labs (rahul@acmecloud.in)</option>
                  <option value="fe">FinEdge Technologies (arun@finedge.io)</option>
                  <option value="dw">DataWeave Analytics (priya@dataweave.co)</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || c.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1f1924] pb-1">
                  Choose Subscription Plan Tier
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#EAE5EC] text-xs text-[#1f1924]"
                >
                  <option value="">Enterprise Growth (₹4,20,000 /yr)</option>
                  <option value="ps">Pro Scale (₹14,500 /mo)</option>
                  <option value="st">Starter Tier (₹4,999 /mo)</option>
                  {plansList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (₹{p.costPrice || p.price})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3.5 bg-[#f5eaf9] rounded-xl border border-[#d3c2ce] text-xs text-[#6D286F] space-y-1">
                <div className="font-bold">Lifecycle State Machine:</div>
                <div>Contract begins in DRAFT/QUOTATION and enters ACTIVE automatically upon signature.</div>
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
                onClick={handleCreateSubscription}
                className="px-4 py-2 rounded-lg bg-[#6D286F] text-white hover:bg-[#530D57] text-xs font-semibold shadow-xs"
              >
                Create Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;
