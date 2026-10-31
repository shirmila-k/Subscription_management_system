import React, { useEffect, useState } from 'react';
import { notificationsService, jobsService } from '../../services';
import { NotificationItem, NotificationStats, NotificationStatus, NotificationEventType } from '../../types';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals & Action States
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState<'html' | 'text' | 'meta'>('html');
  const [actionConfirm, setActionConfirm] = useState<{ type: 'retry' | 'cancel'; item: NotificationItem } | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isJobRunning, setIsJobRunning] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [notifsRes, statsRes] = await Promise.all([
        notificationsService.getNotifications({
          page,
          limit: 15,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          eventType: eventTypeFilter === 'ALL' ? undefined : eventTypeFilter,
          search: searchQuery.trim() || undefined,
        }),
        notificationsService.getStats(),
      ]);

      setNotifications(notifsRes?.data || []);
      setTotalPages(notifsRes?.pagination?.totalPages || 1);
      setTotalItems(notifsRes?.pagination?.total || 0);
      setStats(statsRes || null);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter, eventTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleExecuteAction = async () => {
    if (!actionConfirm) return;
    setIsActionLoading(true);
    try {
      if (actionConfirm.type === 'retry') {
        await notificationsService.retryNotification(actionConfirm.item.id);
        showToast('Notification scheduled for immediate retry');
      } else if (actionConfirm.type === 'cancel') {
        await notificationsService.cancelNotification(actionConfirm.item.id);
        showToast('Pending notification cancelled');
      }
      setActionConfirm(null);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Action failed', 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRunNotificationsWorker = async () => {
    setIsJobRunning('notifications');
    try {
      const result = await jobsService.runNotifications(25);
      showToast(`Processed ${result.processed} notifications: ${result.sent} sent, ${result.failed} failed`);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Worker run failed', 'error');
    } finally {
      setIsJobRunning(null);
    }
  };

  const handleRunRemindersJob = async () => {
    setIsJobRunning('reminders');
    try {
      const result = await jobsService.runReminders();
      showToast(`Reminders check complete: ${result.subscriptionsNotified} subscription reminders and ${result.invoicesNotified} invoice reminders queued`);
      await loadData();
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Reminders run failed', 'error');
    } finally {
      setIsJobRunning(null);
    }
  };

  const formatEventType = (type: NotificationEventType): string => {
    switch (type) {
      case 'SUBSCRIPTION_QUOTATION': return 'Quotation Sent';
      case 'SUBSCRIPTION_CONFIRMED': return 'Subscription Confirmed';
      case 'SUBSCRIPTION_ACTIVATED': return 'Subscription Activated';
      case 'SUBSCRIPTION_PAUSED': return 'Subscription Paused';
      case 'SUBSCRIPTION_RESUMED': return 'Subscription Resumed';
      case 'SUBSCRIPTION_CLOSED': return 'Subscription Closed';
      case 'SUBSCRIPTION_RENEWED': return 'Subscription Renewed';
      case 'SUBSCRIPTION_EXPIRING_SOON': return 'Expiry / Renewal Warning';
      case 'INVOICE_GENERATED': return 'Invoice Generated';
      case 'INVOICE_DUE_SOON': return 'Invoice Due Soon';
      case 'INVOICE_OVERDUE': return 'Invoice Overdue Notice';
      case 'PAYMENT_SUCCESS': return 'Payment Receipt';
      case 'PAYMENT_FAILED': return 'Payment Failed Notice';
      case 'PAYMENT_REFUNDED': return 'Refund Notice';
      default: return String(type).replace(/_/g, ' ');
    }
  };

  const getStatusBadge = (status: NotificationStatus) => {
    switch (status) {
      case 'SENT':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>SENT</span>;
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>PENDING</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>PROCESSING</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"><span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>FAILED</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">CANCELLED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white font-medium flex items-center gap-2 transition-all ${
            toastMessage.type === 'success' ? 'bg-[#107C41]' : 'bg-[#BA1A1A]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#ECE7EE] shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-[#F3EBF5] text-[#6D286F] rounded-lg material-symbols-outlined text-[24px]">
              notifications_active
            </span>
            <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">Notification Center &amp; Email Automation</h1>
          </div>
          <p className="text-sm text-[#6D6175] mt-1">
            Automated customer notices, renewal warnings, delivery monitoring, and background worker controls
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRunNotificationsWorker}
            disabled={Boolean(isJobRunning)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#6D286F] hover:bg-[#581F59] text-white text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${isJobRunning === 'notifications' ? 'animate-spin' : ''}`}>
              {isJobRunning === 'notifications' ? 'autorenew' : 'send'}
            </span>
            Process Pending Queue
          </button>

          <button
            onClick={handleRunRemindersJob}
            disabled={Boolean(isJobRunning)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#D9D1DE] text-[#27212B] hover:bg-[#FAF8FB] text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[18px] ${isJobRunning === 'reminders' ? 'animate-spin' : ''}`}>
              {isJobRunning === 'reminders' ? 'autorenew' : 'alarm'}
            </span>
            Run Reminders
          </button>

          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 rounded-lg border border-[#D9D1DE] text-[#6D6175] hover:bg-[#FAF8FB] transition"
          >
            <span className="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#ECE7EE] shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#6D6175]">Total Logged</div>
          <div className="text-2xl font-bold text-[#27212B] mt-1">{stats ? stats.total.toLocaleString() : '—'}</div>
          <div className="text-[11px] text-[#8F8397] mt-0.5">All events</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ECE7EE] shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Sent</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats ? stats.sent.toLocaleString() : '—'}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Dispatched</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ECE7EE] shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats ? stats.pending.toLocaleString() : '—'}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Awaiting dispatch</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ECE7EE] shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">Processing</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats ? stats.processing.toLocaleString() : '—'}</div>
          <div className="text-[11px] text-blue-700 mt-0.5">In flight</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ECE7EE] shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-700">Failed</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats ? stats.failed.toLocaleString() : '—'}</div>
          <div className="text-[11px] text-rose-700 mt-0.5">Retry eligible</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ECE7EE] shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Cancelled</div>
          <div className="text-2xl font-bold text-gray-700 mt-1">{stats ? stats.cancelled.toLocaleString() : '—'}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">Suppressed</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#ECE7EE] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['ALL', 'PENDING', 'SENT', 'FAILED', 'PROCESSING', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-[#6D286F] text-white shadow-sm'
                    : 'text-[#6D6175] hover:bg-[#F3EBF5] hover:text-[#421747]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Event Filter & Search */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md">
            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setPage(1);
              }}
              className="text-xs font-medium border border-[#D9D1DE] rounded-lg px-2.5 py-1.5 bg-white text-[#27212B] focus:outline-none focus:ring-1 focus:ring-[#6D286F]"
            >
              <option value="ALL">All Event Types</option>
              <option value="SUBSCRIPTION_QUOTATION">Quotation Sent</option>
              <option value="SUBSCRIPTION_CONFIRMED">Subscription Confirmed</option>
              <option value="SUBSCRIPTION_ACTIVATED">Subscription Activated</option>
              <option value="SUBSCRIPTION_PAUSED">Subscription Paused</option>
              <option value="SUBSCRIPTION_RESUMED">Subscription Resumed</option>
              <option value="SUBSCRIPTION_CLOSED">Subscription Closed</option>
              <option value="SUBSCRIPTION_RENEWED">Subscription Renewed</option>
              <option value="SUBSCRIPTION_EXPIRING_SOON">Expiry Notice</option>
              <option value="INVOICE_GENERATED">Invoice Generated</option>
              <option value="INVOICE_DUE_SOON">Invoice Due Soon</option>
              <option value="INVOICE_OVERDUE">Invoice Overdue</option>
              <option value="PAYMENT_SUCCESS">Payment Success</option>
              <option value="PAYMENT_FAILED">Payment Failed</option>
              <option value="PAYMENT_REFUNDED">Payment Refunded</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-[#8F8397]">
                search
              </span>
              <input
                type="text"
                placeholder="Search email, subject, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#D9D1DE] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6D286F] placeholder-[#8F8397]"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Main Notification Table */}
      <div className="bg-white rounded-xl border border-[#ECE7EE] shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#6D6175]">
            <span className="material-symbols-outlined text-[36px] animate-spin text-[#6D286F]">autorenew</span>
            <span className="text-sm font-medium">Loading notifications ledger...</span>
          </div>
        ) : errorMessage ? (
          <div className="p-8 text-center text-rose-600 bg-rose-50 border border-rose-200 m-4 rounded-lg">
            <span className="material-symbols-outlined text-[32px] mb-1">error</span>
            <p className="font-semibold text-sm">{errorMessage}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-[#6D6175]">
            <span className="material-symbols-outlined text-[44px] text-[#A69CB0] mb-2">mail</span>
            <p className="font-semibold text-base text-[#27212B]">No notification records found</p>
            <p className="text-xs text-[#8F8397] mt-1">Try relaxing filters or trigger a background reminder job</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8FB] text-[#6D6175] border-b border-[#ECE7EE] uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECE7EE] text-[#27212B]">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-[#FAF8FB] transition">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(notif.status)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-[#421747]">
                      {formatEventType(notif.eventType)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#27212B] truncate max-w-[180px]">{notif.recipientEmail}</div>
                      {notif.customer && (
                        <div className="text-[11px] text-[#8F8397] truncate">
                          {notif.customer.firstName} {notif.customer.lastName}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 max-w-[240px] truncate" title={notif.subject}>
                      <span className="font-medium text-[#27212B]">{notif.subject}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {notif.isSimulated ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-[#6D286F] border border-purple-200">
                          Simulated
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Live SMTP
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-[11px]">
                        {notif.attemptCount}/{notif.maxAttempts}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#6D6175]">
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => {
                          setSelectedNotification(notif);
                          setIsPreviewModalOpen(true);
                          setPreviewTab('html');
                        }}
                        title="View Email & Details"
                        className="p-1.5 text-[#6D286F] hover:bg-[#F3EBF5] rounded-md transition"
                      >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                      </button>

                      {(notif.status === 'FAILED' || notif.status === 'CANCELLED') && (
                        <button
                          onClick={() => setActionConfirm({ type: 'retry', item: notif })}
                          title="Retry Notification"
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-md transition"
                        >
                          <span className="material-symbols-outlined text-[18px]">replay</span>
                        </button>
                      )}

                      {notif.status === 'PENDING' && (
                        <button
                          onClick={() => setActionConfirm({ type: 'cancel', item: notif })}
                          title="Cancel Notification"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition"
                        >
                          <span className="material-symbols-outlined text-[18px]">block</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#FAF8FB] border-t border-[#ECE7EE] text-xs text-[#6D6175]">
          <div>
            Showing Page <span className="font-semibold text-[#27212B]">{page}</span> of <span className="font-semibold text-[#27212B]">{totalPages}</span> ({totalItems} total records)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded border border-[#D9D1DE] bg-white text-[#27212B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8F7FA] transition"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded border border-[#D9D1DE] bg-white text-[#27212B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F8F7FA] transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Email Preview & Delivery Details Modal */}
      {isPreviewModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#ECE7EE]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#ECE7EE] flex items-center justify-between bg-[#FAF8FB]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#27212B]">{selectedNotification.subject}</span>
                  {getStatusBadge(selectedNotification.status)}
                </div>
                <div className="text-xs text-[#6D6175] mt-1 flex items-center gap-2">
                  <span>To: <strong>{selectedNotification.recipientEmail}</strong></span>
                  <span>&bull;</span>
                  <span>Event: <strong>{formatEventType(selectedNotification.eventType)}</strong></span>
                </div>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-[#8F8397] hover:text-[#27212B] p-1.5 rounded-lg hover:bg-[#EFE5F3] transition"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-[#ECE7EE] px-5 bg-white gap-4">
              <button
                onClick={() => setPreviewTab('html')}
                className={`py-2.5 text-xs font-semibold border-b-2 transition ${
                  previewTab === 'html'
                    ? 'border-[#6D286F] text-[#6D286F]'
                    : 'border-transparent text-[#6D6175] hover:text-[#27212B]'
                }`}
              >
                Rendered HTML Preview
              </button>
              <button
                onClick={() => setPreviewTab('text')}
                className={`py-2.5 text-xs font-semibold border-b-2 transition ${
                  previewTab === 'text'
                    ? 'border-[#6D286F] text-[#6D286F]'
                    : 'border-transparent text-[#6D6175] hover:text-[#27212B]'
                }`}
              >
                Plain Text Body
              </button>
              <button
                onClick={() => setPreviewTab('meta')}
                className={`py-2.5 text-xs font-semibold border-b-2 transition ${
                  previewTab === 'meta'
                    ? 'border-[#6D286F] text-[#6D286F]'
                    : 'border-transparent text-[#6D6175] hover:text-[#27212B]'
                }`}
              >
                Delivery Diagnostics &amp; Audit
              </button>
            </div>

            {/* Modal Content Body */}
            <div className="p-5 flex-1 overflow-y-auto min-h-0 bg-[#FAF8FB]">
              {previewTab === 'html' && (
                <div className="bg-white rounded-xl border border-[#ECE7EE] p-4 shadow-sm">
                  {selectedNotification.bodyHtml ? (
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedNotification.bodyHtml }}
                    />
                  ) : (
                    <div className="text-center py-10 text-xs text-[#8F8397]">No HTML payload recorded</div>
                  )}
                </div>
              )}

              {previewTab === 'text' && (
                <div className="bg-white rounded-xl border border-[#ECE7EE] p-4 font-mono text-xs text-[#27212B] whitespace-pre-wrap leading-relaxed">
                  {selectedNotification.bodyText || 'No plain text payload recorded'}
                </div>
              )}

              {previewTab === 'meta' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-white rounded-xl border border-[#ECE7EE] p-4 space-y-2.5">
                    <h3 className="font-bold text-[#421747] text-sm border-b border-[#ECE7EE] pb-2">Technical Delivery Identity</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-[#8F8397]">Notification ID:</span> <span className="font-mono">{selectedNotification.id}</span></div>
                      <div><span className="text-[#8F8397]">Idempotency Key:</span> <span className="font-mono">{selectedNotification.idempotencyKey || 'None'}</span></div>
                      <div><span className="text-[#8F8397]">Transport Mode:</span> <span>{selectedNotification.isSimulated ? 'Simulated Local Transport (Dev)' : 'Live SMTP Provider'}</span></div>
                      <div><span className="text-[#8F8397]">Provider Message ID:</span> <span className="font-mono">{selectedNotification.providerMessageId || 'N/A'}</span></div>
                      <div><span className="text-[#8F8397]">Attempts:</span> <span>{selectedNotification.attemptCount} of {selectedNotification.maxAttempts} max</span></div>
                      <div><span className="text-[#8F8397]">Created At:</span> <span>{new Date(selectedNotification.createdAt).toLocaleString('en-IN')}</span></div>
                      <div><span className="text-[#8F8397]">Sent At:</span> <span>{selectedNotification.sentAt ? new Date(selectedNotification.sentAt).toLocaleString('en-IN') : 'Pending'}</span></div>
                      <div><span className="text-[#8F8397]">Next Retry:</span> <span>{selectedNotification.nextRetryAt ? new Date(selectedNotification.nextRetryAt).toLocaleString('en-IN') : 'None'}</span></div>
                    </div>
                  </div>

                  {selectedNotification.lastError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-800">
                      <div className="font-bold text-xs flex items-center gap-1.5 mb-1">
                        <span className="material-symbols-outlined text-[16px]">warning</span>
                        Last Delivery Error Trace (Redacted)
                      </div>
                      <pre className="font-mono text-[11px] whitespace-pre-wrap">{selectedNotification.lastError}</pre>
                    </div>
                  )}

                  <div className="bg-white rounded-xl border border-[#ECE7EE] p-4 space-y-2">
                    <h3 className="font-bold text-[#421747] text-sm border-b border-[#ECE7EE] pb-2">Associated Entities</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-[#8F8397]">Subscription ID:</span> <span className="font-mono">{selectedNotification.relatedSubscriptionId || 'N/A'}</span></div>
                      <div><span className="text-[#8F8397]">Invoice ID:</span> <span className="font-mono">{selectedNotification.relatedInvoiceId || 'N/A'}</span></div>
                      <div><span className="text-[#8F8397]">Payment ID:</span> <span className="font-mono">{selectedNotification.relatedPaymentId || 'N/A'}</span></div>
                      <div><span className="text-[#8F8397]">Customer ID:</span> <span className="font-mono">{selectedNotification.customerId || 'N/A'}</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-[#ECE7EE] bg-white flex justify-end gap-2">
              {(selectedNotification.status === 'FAILED' || selectedNotification.status === 'CANCELLED') && (
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    setActionConfirm({ type: 'retry', item: selectedNotification });
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition"
                >
                  Schedule Retry
                </button>
              )}
              {selectedNotification.status === 'PENDING' && (
                <button
                  onClick={() => {
                    setIsPreviewModalOpen(false);
                    setActionConfirm({ type: 'cancel', item: selectedNotification });
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition"
                >
                  Cancel Notification
                </button>
              )}
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#D9D1DE] text-[#27212B] hover:bg-[#FAF8FB] text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {actionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#ECE7EE] space-y-4">
            <div className="flex items-center gap-3">
              <span className={`p-2.5 rounded-full ${actionConfirm.type === 'retry' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'} material-symbols-outlined text-[24px]`}>
                {actionConfirm.type === 'retry' ? 'replay' : 'block'}
              </span>
              <div>
                <h3 className="font-bold text-base text-[#27212B]">
                  {actionConfirm.type === 'retry' ? 'Confirm Notification Retry' : 'Confirm Cancellation'}
                </h3>
                <p className="text-xs text-[#6D6175]">
                  {actionConfirm.type === 'retry'
                    ? `Queue this ${formatEventType(actionConfirm.item.eventType)} message for retry to ${actionConfirm.item.recipientEmail}?`
                    : `Cancel pending notification to ${actionConfirm.item.recipientEmail}?`}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setActionConfirm(null)}
                disabled={isActionLoading}
                className="px-4 py-2 rounded-lg border border-[#D9D1DE] text-[#27212B] hover:bg-[#FAF8FB] text-xs font-semibold transition"
              >
                Back
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={isActionLoading}
                className={`px-4 py-2 rounded-lg text-white font-semibold text-xs transition shadow-sm ${
                  actionConfirm.type === 'retry'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isActionLoading ? 'Processing...' : actionConfirm.type === 'retry' ? 'Confirm Retry' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
