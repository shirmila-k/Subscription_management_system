import React, { useState } from 'react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'billing' | 'tax' | 'gateways' | 'company'>('billing');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Settings State
  const [currency, setCurrency] = useState('INR');
  const [numberFormat, setNumberFormat] = useState('en-IN');
  const [defaultTaxRate, setDefaultTaxRate] = useState(18);
  const [autoInvoiceDays, setAutoInvoiceDays] = useState(3);
  const [gracePeriodDays, setGracePeriodDays] = useState(7);
  const [razorpayKey, setRazorpayKey] = useState('rzp_live_948102834190');
  const [stripeKey, setStripeKey] = useState('pk_live_841029481029');
  const [upiVpa, setUpiVpa] = useState('brightloop.subscriptions@hdfcbank');
  const [companyName, setCompanyName] = useState('Brightloop Technologies Private Limited');
  const [gstin, setGstin] = useState('29AABCU9603R1ZM');
  const [pan, setPan] = useState('AABCU9603R');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Platform configuration saved and synchronized across billing instances.');
  };

  return (
    <div className="flex flex-col w-full space-y-6">
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
            <span>System Configuration</span>
            <span>•</span>
            <span>Enterprise Preferences</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">Billing &amp; Platform Settings</h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Configure Indian Rupee currency format, statutory GST rules, gateway webhooks, and billing schedules.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#6D286F] hover:bg-[#530D57] text-white text-xs font-semibold shadow-xs self-start sm:self-auto transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">save</span>
          Save Changes
        </button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#EAE5EC] pb-2">
        {[
          { id: 'billing', label: 'Billing & Schedules', icon: 'payments' },
          { id: 'tax', label: 'Taxes & GST (18%)', icon: 'receipt' },
          { id: 'gateways', label: 'Payment Gateways', icon: 'account_balance' },
          { id: 'company', label: 'Company Profile & Invoicing', icon: 'domain' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-[#6D286F] text-white shadow-xs'
                : 'text-[#817986] hover:bg-[#FAF9FB] hover:text-[#27212B]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs space-y-6">
        {activeTab === 'billing' && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-[#27212B]">Billing Cadence &amp; Currency Rules</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Base Currency</label>
                <input
                  type="text"
                  disabled
                  value={`${currency} - Indian Rupee (₹)`}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-semibold text-[#27212B] cursor-not-allowed"
                />
                <span className="text-[11px] text-[#817986] mt-1 block">
                  Strictly enforced across all subscription plans and quotations.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Number Formatting Locale</label>
                <select
                  value={numberFormat}
                  onChange={(e) => setNumberFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                >
                  <option value="en-IN">Indian English (₹1,00,000 - Lakhs &amp; Crores)</option>
                  <option value="en-US">International (₹100,000 - Thousands &amp; Millions)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">
                  Advance Invoice Generation (Days Before Renewal)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={autoInvoiceDays}
                  onChange={(e) => setAutoInvoiceDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                />
                <span className="text-[11px] text-[#817986] mt-1 block">
                  Automatically generates DRAFT or CONFIRMED invoices ahead of expiry.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">
                  Overdue Grace Period (Days Before Dunning / Auto-Close)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={gracePeriodDays}
                  onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                />
                <span className="text-[11px] text-[#817986] mt-1 block">
                  Configures plan auto-close triggers when payment is overdue.
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-[#27212B]">Statutory GST &amp; Tax Calculation Rules</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Default GST Rate (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={defaultTaxRate}
                  onChange={(e) => setDefaultTaxRate(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-bold text-[#27212B] outline-none focus:border-[#6D286F]"
                />
                <span className="text-[11px] text-[#817986] mt-1 block">
                  Applied to SaaS subscriptions, Odoo variant surcharges, and setup fees.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Tax Splitting Mechanism</label>
                <select
                  disabled
                  value="auto"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] cursor-not-allowed"
                >
                  <option value="auto">Inter-state: IGST 18% | Intra-state: CGST 9% + SGST 9%</option>
                </select>
                <span className="text-[11px] text-[#817986] mt-1 block">
                  Automatically calculated based on customer billing state vs Karnataka HQ.
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gateways' && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-[#27212B]">Payment Gateway Integrations &amp; Webhooks</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Razorpay Key ID (Live)</label>
                <input
                  type="text"
                  value={razorpayKey}
                  onChange={(e) => setRazorpayKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-mono text-[#27212B] outline-none focus:border-[#6D286F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Stripe Publishable Key</label>
                <input
                  type="text"
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-mono text-[#27212B] outline-none focus:border-[#6D286F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Corporate UPI AutoPay VPA</label>
                <input
                  type="text"
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="space-y-5">
            <h2 className="text-base font-bold text-[#27212B]">Company Legal Profile &amp; Invoice Header</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Legal Entity Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">GSTIN</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-mono text-[#27212B] outline-none focus:border-[#6D286F]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Permanent Account Number (PAN)</label>
              <input
                type="text"
                value={pan}
                onChange={(e) => setPan(e.target.value)}
                className="w-full max-w-sm px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-mono text-[#27212B] outline-none focus:border-[#6D286F]"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE5EC]">
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[#6D286F] text-white text-xs font-bold hover:bg-[#530D57] transition-all shadow-xs active:scale-95"
          >
            Save All Configurations
          </button>
        </div>
      </form>
    </div>
  );
};
