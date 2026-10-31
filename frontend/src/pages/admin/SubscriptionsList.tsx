import React, { useEffect, useState } from 'react';
import { subscriptionService, customerService, planService } from '../../services';
import { Subscription, Customer, Plan } from '../../types';

export const SubscriptionsList: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Tabs & Search
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'QUOTATION' | 'PAUSED' | 'CLOSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Subscription Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [plansList, setPlansList] = useState<Plan[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [createQuantity, setCreateQuantity] = useState(1);
  const [createNotes, setCreateNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lifecycle Action Modal State
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [actionModalType, setActionModalType] = useState<'pause' | 'close' | 'renew' | 'details' | null>(null);
  const [actionReason, setActionReason] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setActionFeedback({ message, type });
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const loadSubscriptions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await subscriptionService.getAll();
      setSubscriptions(data || []);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load subscriptions from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
    customerService.getAll().then((res: any) => setCustomersList(res || [])).catch(() => {});
    planService.getAll().then((res: any) => setPlansList(res || [])).catch(() => {});
  }, []);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedPlanId) {
      showToast('Please select both a customer and a subscription plan', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await subscriptionService.create({
        customerId: selectedCustomerId,
        planId: selectedPlanId,
        quantity: Number(createQuantity) || 1,
        notes: createNotes || undefined,
      });
      showToast('Subscription created successfully');
      setIsCreateModalOpen(false);
      setSelectedCustomerId('');
      setSelectedPlanId('');
      setCreateNotes('');
      await loadSubscriptions();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Error creating subscription', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteLifecycleAction = async () => {
    if (!selectedSub || !actionModalType) return;
    setIsSubmitting(true);
    try {
      if (actionModalType === 'pause') {
        await subscriptionService.pause(selectedSub.id, actionReason || undefined);
        showToast(`Subscription ${selectedSub.subscriptionNumber} paused successfully`);
      } else if (actionModalType === 'close') {
        await subscriptionService.close(selectedSub.id, actionReason || undefined);
        showToast(`Subscription ${selectedSub.subscriptionNumber} closed successfully`);
      } else if (actionModalType === 'renew') {
        await subscriptionService.renew(selectedSub.id, { autoRenew: true });
        showToast(`Subscription ${selectedSub.subscriptionNumber} renewed for next term with new invoice generated`);
      }
      setActionModalType(null);
      setSelectedSub(null);
      setActionReason('');
      await loadSubscriptions();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Lifecycle transition rejected by server', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActivate = async (sub: Subscription) => {
    try {
      await subscriptionService.activateSubscription(sub.id);
      showToast(`Subscription ${sub.subscriptionNumber} confirmed and activated!`);
      await loadSubscriptions();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to activate subscription', 'error');
    }
  };

  const handleResume = async (sub: Subscription) => {
    try {
      await subscriptionService.resume(sub.id);
      showToast(`Subscription ${sub.subscriptionNumber} resumed to ACTIVE status`);
      await loadSubscriptions();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to resume subscription', 'error');
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const custName = sub.customer?.companyName || `${sub.customer?.firstName || ''} ${sub.customer?.lastName || ''}`;
    const matchesSearch =
      sub.subscriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      custName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.plan?.name && sub.plan.name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeTab === 'ACTIVE') return matchesSearch && sub.status === 'ACTIVE';
    if (activeTab === 'QUOTATION') return matchesSearch && (sub.status === 'QUOTATION' || sub.status === 'CONFIRMED' || sub.status === 'DRAFT');
    if (activeTab === 'PAUSED') return matchesSearch && sub.status === 'PAUSED';
    if (activeTab === 'CLOSED') return matchesSearch && (sub.status === 'CLOSED' || sub.status === 'CANCELLED');
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {actionFeedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border animate-fade-in ${
            actionFeedback.type === 'success'
              ? 'bg-[#2E1036] text-white border-[#7B2082]'
              : 'bg-rose-900 text-white border-rose-700'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {actionFeedback.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-medium">{actionFeedback.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#7B2082] text-xs font-semibold uppercase tracking-wider mb-1">
            <span>Subscriptions</span>
            <span>•</span>
            <span>Lifecycle &amp; Financial Operations</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1E1926] tracking-tight">Active Subscriptions Directory</h1>
          <p className="text-sm text-[#736B7C] mt-0.5">
            Manage lifecycle states, policy-governed pauses, automatic renewals, and recurring billing commitments.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#7B2082] text-white font-medium text-sm hover:bg-[#651A6B] transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>New Subscription</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between text-rose-800 text-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-rose-600">warning</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={loadSubscriptions}
            className="text-xs font-semibold uppercase underline hover:text-rose-950"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters & Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E7E2EC] shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['ALL', 'ACTIVE', 'QUOTATION', 'PAUSED', 'CLOSED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-[#7B2082] text-white shadow-xs'
                  : 'text-[#736B7C] hover:bg-[#F6F4F8] hover:text-[#1E1926]'
              }`}
            >
              {tab === 'ALL'
                ? `All (${subscriptions.length})`
                : tab === 'ACTIVE'
                ? `Active (${subscriptions.filter((s) => s.status === 'ACTIVE').length})`
                : tab === 'QUOTATION'
                ? `Quotations/Pending (${subscriptions.filter((s) => s.status === 'QUOTATION' || s.status === 'CONFIRMED' || s.status === 'DRAFT').length})`
                : tab === 'PAUSED'
                ? `Paused (${subscriptions.filter((s) => s.status === 'PAUSED').length})`
                : `Closed (${subscriptions.filter((s) => s.status === 'CLOSED' || s.status === 'CANCELLED').length})`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#A29CA8]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by SUB-#, client, plan..."
            className="w-full pl-9 pr-3 py-1.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] placeholder-[#A29CA8] focus:outline-none focus:border-[#7B2082] focus:bg-white"
          />
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-xl border border-[#E7E2EC] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-[#736B7C]">
            <span className="material-symbols-outlined animate-spin text-[32px] text-[#7B2082] mb-2">
              progress_activity
            </span>
            <p className="text-sm">Loading verified subscriptions from database...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="py-16 text-center text-[#736B7C]">
            <span className="material-symbols-outlined text-[48px] text-[#C2BDC9] mb-2">subscriptions</span>
            <p className="text-base font-semibold text-[#1E1926]">No subscriptions found</p>
            <p className="text-xs text-[#736B7C] max-w-sm mx-auto mt-1">
              {searchQuery
                ? 'No subscriptions match your search filter.'
                : 'Convert an accepted quotation or create a new subscription to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#FAF9FB] border-b border-[#E7E2EC]">
                <tr>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Client &amp; Contact
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Plan &amp; Cadence
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider">
                    Term / Next Billing
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="py-2.5 px-4 text-[11px] font-semibold text-[#736B7C] uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#1E1926] divide-y divide-[#E7E2EC]">
                {filteredSubscriptions.map((sub) => {
                  const clientName =
                    sub.customer?.companyName ||
                    `${sub.customer?.firstName || ''} ${sub.customer?.lastName || ''}`.trim() ||
                    sub.customer?.email ||
                    'Customer';

                  return (
                    <tr key={sub.id} className="hover:bg-[#FAF9FB] transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#7B2082]">
                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setActionModalType('details');
                          }}
                          className="hover:underline flex items-center gap-1 text-left"
                        >
                          <span>{sub.subscriptionNumber}</span>
                          <span className="material-symbols-outlined text-[14px] text-[#A29CA8]">info</span>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1E1926]">{clientName}</div>
                        <div className="text-[11px] text-[#736B7C]">{sub.customer?.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#1E1926]">{sub.plan?.name || 'Custom Plan'}</div>
                        <div className="text-[11px] text-[#736B7C]">
                          {sub.plan?.billingFrequency} • Qty: {sub.quantity}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1E1926]">₹{Number(sub.totalAmount).toLocaleString('en-IN')}</div>
                        <div className="text-[10px] text-[#736B7C]">
                          Sub: ₹{Number(sub.subtotal).toLocaleString('en-IN')} + {sub.taxRate}% GST
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-[#1E1926]">
                          {sub.nextBillingDate ? `Next: ${new Date(sub.nextBillingDate).toLocaleDateString()}` : 'Not scheduled'}
                        </div>
                        <div className="text-[10px] text-[#736B7C]">
                          {sub.expiryDate ? `Expires: ${new Date(sub.expiryDate).toLocaleDateString()}` : 'Perpetual term'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : sub.status === 'PAUSED'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : sub.status === 'CONFIRMED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : sub.status === 'QUOTATION'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : sub.status === 'CLOSED'
                              ? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                              : 'bg-zinc-50 text-zinc-600 border border-zinc-200'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {sub.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleActivate(sub)}
                              title="Activate subscription"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <span className="material-symbols-outlined text-[16px]">play_circle</span>
                            </button>
                          )}

                          {sub.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedSub(sub);
                                  setActionModalType('pause');
                                }}
                                title="Pause subscription (Policy enforced)"
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                              >
                                <span className="material-symbols-outlined text-[16px]">pause_circle</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedSub(sub);
                                  setActionModalType('renew');
                                }}
                                title="Renew subscription term"
                                className="p-1 text-indigo-600 hover:bg-indigo-50 rounded"
                              >
                                <span className="material-symbols-outlined text-[16px]">autorenew</span>
                              </button>
                            </>
                          )}

                          {sub.status === 'PAUSED' && (
                            <button
                              onClick={() => handleResume(sub)}
                              title="Resume subscription"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                            </button>
                          )}

                          {(sub.status === 'ACTIVE' || sub.status === 'PAUSED') && (
                            <button
                              onClick={() => {
                                setSelectedSub(sub);
                                setActionModalType('close');
                              }}
                              title="Close / Cancel subscription"
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {actionModalType === 'details' && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E7E2EC] shadow-2xl max-w-2xl w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E2EC]">
              <div>
                <h2 className="text-lg font-bold text-[#1E1926] font-mono">
                  {selectedSub.subscriptionNumber}
                </h2>
                <p className="text-xs text-[#736B7C]">Comprehensive subscription breakdown &amp; audit record</p>
              </div>
              <button
                onClick={() => setActionModalType(null)}
                className="p-1 text-[#736B7C] hover:bg-[#F6F4F8] rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 text-xs">
              <div>
                <span className="text-[#736B7C] block mb-1">Customer / Enterprise</span>
                <span className="font-semibold text-[#1E1926]">
                  {selectedSub.customer?.companyName || `${selectedSub.customer?.firstName} ${selectedSub.customer?.lastName}`}
                </span>
                <span className="text-[#736B7C] block">{selectedSub.customer?.email}</span>
              </div>
              <div>
                <span className="text-[#736B7C] block mb-1">Plan Configuration</span>
                <span className="font-semibold text-[#1E1926]">{selectedSub.plan?.name}</span>
                <span className="text-[#736B7C] block">
                  Frequency: {selectedSub.plan?.billingFrequency} • Terms: {selectedSub.paymentTerms}
                </span>
              </div>
              <div>
                <span className="text-[#736B7C] block mb-1">Financial Breakdown</span>
                <span className="font-semibold text-[#1E1926]">
                  Total: ₹{Number(selectedSub.totalAmount).toLocaleString('en-IN')}
                </span>
                <span className="text-[#736B7C] block">
                  Subtotal: ₹{Number(selectedSub.subtotal).toLocaleString('en-IN')} | GST: ₹{Number(selectedSub.taxAmount).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[#736B7C] block mb-1">Plan Policy Restrictions</span>
                <span className="block">
                  Pause Permitted: {selectedSub.plan?.canPause ? '✅ Yes' : '❌ No'}
                </span>
                <span className="block">
                  Early Closure Permitted: {selectedSub.plan?.canCloseEarly ? '✅ Yes' : '❌ No'}
                </span>
                <span className="block">Auto-Renew: {selectedSub.autoRenew ? '✅ Enabled' : '❌ Disabled'}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E7E2EC] flex justify-end">
              <button
                onClick={() => setActionModalType(null)}
                className="px-4 py-2 rounded-lg bg-[#FAF9FB] border border-[#E7E2EC] text-xs font-semibold text-[#1E1926] hover:bg-[#F6F4F8]"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lifecycle Action Confirmation Modal (Pause, Close, Renew) */}
      {(actionModalType === 'pause' || actionModalType === 'close' || actionModalType === 'renew') && selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#E7E2EC] shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <h3 className="text-base font-bold text-[#1E1926] mb-1 capitalize">
              {actionModalType === 'pause'
                ? 'Pause Subscription'
                : actionModalType === 'close'
                ? 'Close / Cancel Subscription'
                : 'Renew Subscription'}
            </h3>
            <p className="text-xs text-[#736B7C] mb-4">
              {actionModalType === 'pause'
                ? `Subscription ${selectedSub.subscriptionNumber} will be paused. Recurring billing runs will halt until resumed. Verified against plan policy.`
                : actionModalType === 'close'
                ? `Subscription ${selectedSub.subscriptionNumber} will be permanently closed. Verified against early closure policy.`
                : `Renew subscription ${selectedSub.subscriptionNumber} for the next billing cycle. Contract term will advance and renewal invoice will be created.`}
            </p>

            {(actionModalType === 'pause' || actionModalType === 'close') && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">
                  Reason for {actionModalType}
                </label>
                <textarea
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={`Optional audit explanation for ${actionModalType}...`}
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModalType(null)}
                className="px-3 py-1.5 rounded-lg border border-[#E7E2EC] text-xs font-semibold text-[#736B7C] hover:bg-[#F6F4F8]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleExecuteLifecycleAction}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors ${
                  actionModalType === 'close'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : actionModalType === 'pause'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-[#7B2082] hover:bg-[#651A6B]'
                }`}
              >
                {isSubmitting ? 'Executing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Subscription Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateSubscription}
            className="bg-white rounded-2xl border border-[#E7E2EC] shadow-2xl max-w-lg w-full p-6 animate-scale-in"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E7E2EC]">
              <h3 className="text-base font-bold text-[#1E1926]">Create Direct Subscription</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[#736B7C] hover:bg-[#F6F4F8] rounded-lg"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">Select Customer</label>
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                >
                  <option value="">-- Choose client account --</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName || `${c.firstName} ${c.lastName}`} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">Select Subscription Plan</label>
                <select
                  required
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                >
                  <option value="">-- Choose subscription plan --</option>
                  {plansList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ₹{Number(p.price).toLocaleString('en-IN')}/{p.billingFrequency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">Quantity / Seat Licenses</label>
                <input
                  type="number"
                  min="1"
                  value={createQuantity}
                  onChange={(e) => setCreateQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1926] mb-1">Notes / PO Reference</label>
                <textarea
                  rows={2}
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="Optional customer reference or internal note..."
                  className="w-full p-2.5 bg-[#FAF9FB] border border-[#E7E2EC] rounded-lg text-xs text-[#1E1926] focus:outline-none focus:border-[#7B2082]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E7E2EC]">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E7E2EC] text-xs font-semibold text-[#736B7C] hover:bg-[#F6F4F8]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#7B2082] hover:bg-[#651A6B] transition-colors"
              >
                {isSubmitting ? 'Creating...' : 'Create Subscription'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
