import React, { useState } from 'react';
import { StatCard } from '../../components/StatCard';
import {
  Settings,
  ShieldCheck,
  Building,
  Percent,
  Clock,
  Save,
  CheckCircle2,
  Calendar,
  Sparkles,
  CreditCard,
  FileCheck2,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'billing' | 'taxes' | 'company' | 'integrations'>('billing');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Billing Engine State
  const [cronExpression, setCronExpression] = useState('0 0 * * * (Every night at midnight)');
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [autoCloseExpired, setAutoCloseExpired] = useState(true);
  const [autoRenewActive, setAutoRenewActive] = useState(true);
  const [preventDuplicateBilling, setPreventDuplicateBilling] = useState(true);

  // Tax Configuration State
  const [gstRate, setGstRate] = useState(18);
  const [hsnCode, setHsnCode] = useState('998313 (IT Software Licensing)');
  const [taxInclusivePricing, setTaxInclusivePricing] = useState(false);

  // Company Profile State
  const [companyName, setCompanyName] = useState('Brightloop Software Private Limited');
  const [gstin, setGstin] = useState('29ABCDE1234F1Z5');
  const [billingEmail, setBillingEmail] = useState('billing@brightloop.com');
  const [address, setAddress] = useState('Tower 4, Embassy Tech Village, Outer Ring Road, Bengaluru, Karnataka 560103');
  const [currency, setCurrency] = useState('INR (₹)');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#817986] font-medium mb-1">
            <span>Admin</span>
            <span>/</span>
            <span className="text-[#6D286F] font-semibold">Settings</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B]">System Configuration & Rules</h1>
          <p className="text-xs text-[#817986] mt-0.5">
            Configure automated billing schedules, GST 18% tax rules, currency parameters, and company credentials
          </p>
        </div>

        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition"
        >
          <Save className="w-4 h-4" />
          Save Configurations
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-[#16845B]/10 border border-[#16845B]/20 text-[#16845B] text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          System configuration parameters committed and synchronized with billing engine.
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE5EC] pb-2">
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'billing'
              ? 'bg-[#6D286F] text-white shadow-sm'
              : 'text-[#817986] hover:text-[#27212B]'
          }`}
        >
          <Clock className="w-4 h-4" />
          Automated Billing Engine
        </button>
        <button
          onClick={() => setActiveTab('taxes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'taxes'
              ? 'bg-[#6D286F] text-white shadow-sm'
              : 'text-[#817986] hover:text-[#27212B]'
          }`}
        >
          <Percent className="w-4 h-4" />
          Tax Rules & GST
        </button>
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === 'company'
              ? 'bg-[#6D286F] text-white shadow-sm'
              : 'text-[#817986] hover:text-[#27212B]'
          }`}
        >
          <Building className="w-4 h-4" />
          Company Profile
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'billing' && (
        <div className="bg-white rounded-2xl border border-[#EAE5EC] p-6 shadow-card space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#27212B]">Automated Recurring Billing Engine</h2>
            <p className="text-xs text-[#817986] mt-0.5">
              Governs automated invoice emission, duplicate prevention locks, and renewal triggers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">
                  Node-cron Execution Schedule
                </label>
                <input
                  type="text"
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs font-mono text-[#27212B] focus:border-[#6D286F] focus:outline-none"
                />
                <p className="text-[11px] text-[#817986] mt-1">
                  Executes batch queries to identify active subscriptions needing renewed billing statements
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">
                  Default Grace Period (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(parseInt(e.target.value) || 0)}
                  className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs font-mono text-[#27212B] focus:border-[#6D286F] focus:outline-none"
                />
                <p className="text-[11px] text-[#817986] mt-1">
                  Days before overdue subscriptions undergo automatic lifecycle termination
                </p>
              </div>
            </div>

            <div className="space-y-4 p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#27212B]">Strict Idempotency Guard</p>
                  <p className="text-[11px] text-[#817986]">Prevents duplicate billing if worker retries occur</p>
                </div>
                <input
                  type="checkbox"
                  checked={preventDuplicateBilling}
                  onChange={(e) => setPreventDuplicateBilling(e.target.checked)}
                  className="w-4 h-4 accent-[#6D286F] rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#27212B]">Automatic Contract Renewal</p>
                  <p className="text-[11px] text-[#817986]">Roll over active contracts automatically</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoRenewActive}
                  onChange={(e) => setAutoRenewActive(e.target.checked)}
                  className="w-4 h-4 accent-[#6D286F] rounded"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#27212B]">Auto-close Expired Subscriptions</p>
                  <p className="text-[11px] text-[#817986]">Change status to CLOSED upon term completion</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoCloseExpired}
                  onChange={(e) => setAutoCloseExpired(e.target.checked)}
                  className="w-4 h-4 accent-[#6D286F] rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'taxes' && (
        <div className="bg-white rounded-2xl border border-[#EAE5EC] p-6 shadow-card space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#27212B]">Goods & Services Tax (GST) Rules</h2>
            <p className="text-xs text-[#817986] mt-0.5">
              Admin-controlled automated tax calculations applied across invoice line items
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">
                Standard GST Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={gstRate}
                  onChange={(e) => setGstRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs font-mono text-[#27212B] focus:border-[#6D286F] focus:outline-none"
                />
                <span className="absolute right-3.5 top-2 text-xs font-bold text-[#817986]">%</span>
              </div>
              <p className="text-[11px] text-[#817986] mt-1">Predefined tax rule for SaaS software subscriptions</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">
                HSN / SAC Service Accounting Code
              </label>
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs font-mono text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
              <p className="text-[11px] text-[#817986] mt-1">Appears on verified PDF tax invoice printouts</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'company' && (
        <div className="bg-white rounded-2xl border border-[#EAE5EC] p-6 shadow-card space-y-6">
          <div>
            <h2 className="text-base font-bold text-[#27212B]">Legal Entity & Billing Profile</h2>
            <p className="text-xs text-[#817986] mt-0.5">
              Information rendered on generated customer PDF statements and payment receipts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Entity Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs font-mono text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Billing Support Email</label>
              <input
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Default Platform Currency</label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs font-bold text-[#6D286F]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Registered Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl p-2.5 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
