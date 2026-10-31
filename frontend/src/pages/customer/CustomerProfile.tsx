import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const CustomerProfile: React.FC = () => {
  const { user } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [companyName, setCompanyName] = useState(user?.companyName || 'Acme Cloud Labs Pvt Ltd');
  const [contactName, setContactName] = useState(
    user?.firstName ? `${user.firstName} ${user.lastName}` : 'Rohan Nambiar'
  );
  const [email] = useState(user?.email || 'customer@acmecorp.com');
  const [phone, setPhone] = useState('+91 98450 19283');
  const [gstin, setGstin] = useState('29AABCU9603R1ZM');
  const [address, setAddress] = useState('Level 4, Embassy Tech Village, Outer Ring Road, Bengaluru, Karnataka 560103');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Customer billing and organization details updated successfully.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
            <span>Account Details</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B] tracking-tight">Organization &amp; Tax Profile</h1>
          <p className="text-sm text-[#817986] mt-0.5">
            Manage your legal entity registration, GSTIN identification, and billing contacts.
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-[#EAE5EC] p-6 shadow-xs space-y-6">
        {/* Tier status banner */}
        <div className="p-4 rounded-xl bg-[#FAF9FB] border border-[#EAE5EC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F3EAF5] flex items-center justify-center text-[#6D286F]">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <p className="text-sm font-bold text-[#27212B]">Enterprise Tier Subscriber</p>
              <p className="text-xs text-[#817986]">Dedicated Account Manager: Rajesh Kumar (staff@brightloop.com)</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#16845B] text-xs font-semibold">
            KYC Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Company / Entity Name</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Authorized Billing Contact</label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Official Billing Email</label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#817986] cursor-not-allowed"
            />
            <span className="text-[11px] text-[#817986] mt-1 block">Invoices and renewal reminders are dispatched here.</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">Goods &amp; Services Tax Identification (GSTIN)</label>
          <input
            type="text"
            value={gstin}
            onChange={(e) => setGstin(e.target.value)}
            className="w-full max-w-sm px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs font-mono font-bold text-[#6D286F] outline-none focus:border-[#6D286F]"
          />
          <span className="text-[11px] text-[#817986] mt-1 block">Printed on all tax invoices for input tax credit (ITC) claims.</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">Registered Billing Address</label>
          <textarea
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#FAF9FB] border border-[#EAE5EC] text-xs text-[#27212B] outline-none focus:border-[#6D286F]"
          ></textarea>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-[#EAE5EC]">
          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-[#6D286F] text-white text-xs font-bold hover:bg-[#530D57] transition-all shadow-xs active:scale-95"
          >
            Update Organization Profile
          </button>
        </div>
      </form>
    </div>
  );
};
