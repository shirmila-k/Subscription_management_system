import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiClient } from '../../services/api';
import {
  UserCog,
  Building,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  Check,
  X,
  ShieldCheck,
  Save,
} from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  const { user } = useAuth();

  // Profile Form States
  const [name, setName] = useState(user?.name || 'Alexander Wright');
  const [email] = useState(user?.email || 'billing@acmecorp.com');
  const [companyName, setCompanyName] = useState('Acme Technologies Pvt Ltd');
  const [phone, setPhone] = useState('+91 98450 12345');
  const [gstin, setGstin] = useState('29AABCA1234F1Z6');
  const [billingAddress, setBillingAddress] = useState(
    'Plot 42, Electronics City Phase 1, Hosur Road, Bengaluru, Karnataka 560100'
  );

  // Password Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Password Rules Check
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasSpecial = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword);
  const isMatch = newPassword === confirmPassword && newPassword.length > 0;
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasSpecial && isMatch;

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!isPasswordValid) {
      setPasswordError('Please fulfill all security criteria before saving.');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#817986] font-medium mb-1">
            <span>Customer Portal</span>
            <span>/</span>
            <span className="text-[#6D286F] font-semibold">Account Profile</span>
          </div>
          <h1 className="text-2xl font-bold text-[#27212B]">Company & Security Settings</h1>
          <p className="text-xs text-[#817986] mt-0.5">
            Manage your registered organization credentials, GSTIN verification, and password security policies
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#16845B]/10 border border-[#16845B]/20 rounded-xl text-xs font-semibold text-[#16845B]">
          <ShieldCheck className="w-4 h-4" />
          <span>Verified Customer Account</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company & Billing Info */}
        <div className="bg-white rounded-2xl border border-[#EAE5EC] p-6 shadow-card space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#EAE5EC]">
            <Building className="w-5 h-5 text-[#6D286F]" />
            <div>
              <h2 className="text-sm font-bold text-[#27212B]">Organization Profile</h2>
              <p className="text-xs text-[#817986]">Details printed on official GST invoices</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-[#16845B]/10 border border-[#16845B]/20 rounded-xl text-xs text-[#16845B] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Company credentials updated successfully.
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Company Legal Name</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Primary Contact</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Account Email</label>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="w-full bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#817986]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#27212B] mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Registered Billing Address</label>
              <textarea
                rows={2}
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                className="w-full bg-white border border-[#EAE5EC] rounded-xl p-2.5 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                <Save className="w-3.5 h-3.5" />
                Update Profile
              </button>
            </div>
          </form>
        </div>

        {/* Password Security Form */}
        <div className="bg-white rounded-2xl border border-[#EAE5EC] p-6 shadow-card space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-[#EAE5EC]">
            <Lock className="w-5 h-5 text-[#6D286F]" />
            <div>
              <h2 className="text-sm font-bold text-[#27212B]">Security & Password Policy</h2>
              <p className="text-xs text-[#817986]">Requires 8+ chars, uppercase, lowercase, and symbols</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-[#16845B]/10 border border-[#16845B]/20 rounded-xl text-xs text-[#16845B] font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Password updated securely.
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-[#C53B4B]/10 border border-[#C53B4B]/20 rounded-xl text-xs text-[#C53B4B] font-semibold">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#27212B] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3.5 py-2 text-xs text-[#27212B] focus:border-[#6D286F] focus:outline-none"
              />
            </div>

            {/* Checklist */}
            <div className="p-2.5 bg-[#FAF9FB] rounded-xl border border-[#EAE5EC] grid grid-cols-2 gap-1.5 text-[11px]">
              <span className={`flex items-center gap-1 ${hasMinLength ? 'text-[#16845B] font-bold' : 'text-[#817986]'}`}>
                {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} 8+ Characters
              </span>
              <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-[#16845B] font-bold' : 'text-[#817986]'}`}>
                {hasUpperCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Uppercase (A-Z)
              </span>
              <span className={`flex items-center gap-1 ${hasLowerCase ? 'text-[#16845B] font-bold' : 'text-[#817986]'}`}>
                {hasLowerCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Lowercase (a-z)
              </span>
              <span className={`flex items-center gap-1 ${hasSpecial ? 'text-[#16845B] font-bold' : 'text-[#817986]'}`}>
                {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Special Char (!@#$)
              </span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!isPasswordValid}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#6D286F] hover:bg-[#84418A] text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
