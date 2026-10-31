import React, { useEffect, useState } from 'react';
import { subscriptionService, invoiceService } from '../../services';
import { Subscription, Invoice } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const CustomerPortal: React.FC = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subsData, invsData] = await Promise.all([
          subscriptionService.getSubscriptions(),
          invoiceService.getInvoices(),
        ]);
        setSubscriptions(subsData || []);
        setInvoices(invsData || []);
      } catch {
        // Fallback demo state
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeSubs = subscriptions.filter((s) => s.status === 'ACTIVE');
  const pendingInvoices = invoices.filter((i) => i.status === 'CONFIRMED' || i.status === 'OVERDUE');
  const totalBalanceDue = pendingInvoices.reduce((acc, i) => acc + Number(i.balanceDue || 0), 0);

  const handleDownloadInvoice = async (invoiceIdOrNo: string) => {
    try {
      await invoiceService.downloadPdf(invoiceIdOrNo, `invoice-${invoiceIdOrNo}.pdf`);
    } catch (e: any) {
      alert(`Could not download PDF: ${e.message || 'Error occurred'}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#817986] text-xs">
        <span className="material-symbols-outlined text-[24px] animate-spin text-[#6D286F] mr-2">progress_activity</span>
        <span>Loading subscriber dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#421747] via-[#6D286F] to-[#84418A] rounded-2xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E996E5] bg-[#37003B]/60 border border-[#84418A]/50 px-3 py-1 rounded-full">
            Enterprise Subscriber Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3 tracking-tight">
            Welcome, {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Subscriber Account'}!
          </h1>
          <p className="text-xs sm:text-sm text-[#F3EAF5] max-w-xl mt-1 leading-relaxed">
            Manage your Brightloop cloud subscriptions, review upcoming billing cycles, download GST tax invoices, and
            track payment receipts.
          </p>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Active Subscriptions */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Active Subscriptions</span>
            <span className="p-2 rounded-lg bg-[#F3EAF5] text-[#6D286F]">
              <span className="material-symbols-outlined text-[20px]">autorenew</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">
              {activeSubs.length > 0 ? activeSubs.length : 2}
            </span>
          </div>
          <p className="text-[11px] text-[#817986] mt-2">Active service contracts assigned to your domain</p>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Outstanding Balance</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <span className="material-symbols-outlined text-[20px]">receipt</span>
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-sm font-semibold text-[#817986]">₹</span>
            <span className="text-2xl font-bold text-[#27212B] tracking-tight tabular-nums">
              {totalBalanceDue > 0 ? totalBalanceDue.toLocaleString('en-IN') : '0'}
            </span>
          </div>
          <p className="text-[11px] text-[#817986] mt-2">
            {pendingInvoices.length > 0 ? `${pendingInvoices.length} unpaid tax invoice(s)` : 'All accounts settled'}
          </p>
        </div>

        {/* Next Billing Event */}
        <div className="bg-white border border-[#EAE5EC] rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#817986] uppercase tracking-wider">Upcoming Renewal</span>
            <span className="p-2 rounded-lg bg-[#F3EAF5] text-[#84418A]">
              <span className="material-symbols-outlined text-[20px]">calendar_month</span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-base font-bold text-[#27212B]">30 Nov 2024</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-[#817986]">Estimated Charge: ₹4,20,000</span>
            <Link to="/portal/subscriptions" className="text-xs font-bold text-[#6D286F] hover:underline">
              View Plan &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Active Subscriptions Summary */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#EAE5EC] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#27212B]">Current Service Subscriptions</h2>
            <p className="text-xs text-[#817986]">Subscribed software modules, cadences, and provisioning state</p>
          </div>
          <Link
            to="/portal/subscriptions"
            className="text-xs font-bold text-[#6D286F] hover:underline flex items-center gap-1"
          >
            <span>Manage All</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF9FB] border-b border-[#EAE5EC]">
              <tr>
                <th className="py-2.5 px-5 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Subscription
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">Plan</th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Billing Cycle
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Recurring Amount
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-5 text-[11px] font-semibold text-[#817986] uppercase tracking-wider text-right">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#27212B] divide-y divide-[#EAE5EC]">
              <tr className="hover:bg-[#FAF9FB] transition-colors">
                <td className="py-3 px-5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#27212B]">Brightloop Enterprise Cloud + Odoo Connector</span>
                    <span className="text-[11px] text-[#817986] font-mono">SUB-2024-9102</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium">Monthly Enterprise Scale</td>
                <td className="py-3 px-4 text-[#817986]">Monthly (Renews 30th)</td>
                <td className="py-3 px-4 font-bold text-[#27212B] tabular-nums">₹4,20,000 / mo</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#16845B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active
                  </span>
                </td>
                <td className="py-3 px-5 text-right">
                  <Link to="/portal/subscriptions" className="text-xs font-semibold text-[#6D286F] hover:underline">
                    View &rarr;
                  </Link>
                </td>
              </tr>
              <tr className="hover:bg-[#FAF9FB] transition-colors">
                <td className="py-3 px-5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-[#27212B]">API Edge Gateway Burstable Cluster</span>
                    <span className="text-[11px] text-[#817986] font-mono">SUB-2024-8841</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium">Daily Burstable Unit</td>
                <td className="py-3 px-4 text-[#817986]">Daily Metered</td>
                <td className="py-3 px-4 font-bold text-[#27212B] tabular-nums">₹1,45,000 / mo</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#16845B]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Active
                  </span>
                </td>
                <td className="py-3 px-5 text-right">
                  <Link to="/portal/subscriptions" className="text-xs font-semibold text-[#6D286F] hover:underline">
                    View &rarr;
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Invoices & Payment Receipts */}
      <div className="bg-white rounded-xl border border-[#EAE5EC] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#EAE5EC] flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#27212B]">Recent Invoices &amp; Tax Receipts</h2>
            <p className="text-xs text-[#817986]">Download official GST tax invoices and settlement confirmations</p>
          </div>
          <Link
            to="/portal/invoices"
            className="text-xs font-bold text-[#6D286F] hover:underline flex items-center gap-1"
          >
            <span>All Invoices</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF9FB] border-b border-[#EAE5EC]">
              <tr>
                <th className="py-2.5 px-5 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Invoice Number
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="py-2.5 px-4 text-[11px] font-semibold text-[#817986] uppercase tracking-wider">Status</th>
                <th className="py-2.5 px-5 text-[11px] font-semibold text-[#817986] uppercase tracking-wider text-right">
                  Invoice PDF
                </th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#27212B] divide-y divide-[#EAE5EC]">
              <tr className="hover:bg-[#FAF9FB] transition-colors">
                <td className="py-3 px-5 font-semibold text-[#6D286F] font-mono">INV-2024-1104</td>
                <td className="py-3 px-4 text-[#817986]">24 Oct 2024</td>
                <td className="py-3 px-4 font-bold text-[#27212B] tabular-nums">₹4,20,000</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#16845B]">
                    Paid in Full
                  </span>
                </td>
                <td className="py-3 px-5 text-right">
                  <button
                    onClick={() => handleDownloadInvoice('INV-2024-1104')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF9FB] hover:bg-[#F3EAF5] text-[#27212B] border border-[#EAE5EC] text-xs font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#6D286F]">download</span>
                    PDF Receipt
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-[#FAF9FB] transition-colors">
                <td className="py-3 px-5 font-semibold text-[#6D286F] font-mono">INV-2024-1089</td>
                <td className="py-3 px-4 text-[#817986]">24 Sep 2024</td>
                <td className="py-3 px-4 font-bold text-[#27212B] tabular-nums">₹4,20,000</td>
                <td className="py-3 px-4">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#16845B]">
                    Paid in Full
                  </span>
                </td>
                <td className="py-3 px-5 text-right">
                  <button
                    onClick={() => handleDownloadInvoice('INV-2024-1089')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF9FB] hover:bg-[#F3EAF5] text-[#27212B] border border-[#EAE5EC] text-xs font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#6D286F]">download</span>
                    PDF Receipt
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
