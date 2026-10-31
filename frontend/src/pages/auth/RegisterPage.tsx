import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User as UserIcon, Building, ArrowRight, Check, X } from 'lucide-react';
import { Role } from '../../types';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('CUSTOMER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Password rules validation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasSpecial = /[@$!%*?&#^()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Please fulfill all password security rules before proceeding.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        companyName,
        password,
        role,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#27212B]">Create an Account</h2>
        <p className="text-xs text-[#817986] mt-1">Join Brightloop Subscription Management System</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#C53B4B]/10 border border-[#C53B4B]/20 text-[#C53B4B] text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">Full Name</label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-[#817986] absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
              className="w-full bg-white border border-[#EAE5EC] rounded-xl pl-10 pr-4 py-2 text-sm text-[#27212B] placeholder-[#817986]/50 focus:outline-none focus:border-[#6D286F] focus:ring-1 focus:ring-[#6D286F] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">Company Name</label>
          <div className="relative">
            <Building className="w-4 h-4 text-[#817986] absolute left-3.5 top-3" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corporation"
              className="w-full bg-white border border-[#EAE5EC] rounded-xl pl-10 pr-4 py-2 text-sm text-[#27212B] placeholder-[#817986]/50 focus:outline-none focus:border-[#6D286F] focus:ring-1 focus:ring-[#6D286F] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">Business Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#817986] absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@acmecorp.com"
              className="w-full bg-white border border-[#EAE5EC] rounded-xl pl-10 pr-4 py-2 text-sm text-[#27212B] placeholder-[#817986]/50 focus:outline-none focus:border-[#6D286F] focus:ring-1 focus:ring-[#6D286F] transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">Account Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full bg-white border border-[#EAE5EC] rounded-xl px-3 py-2 text-sm text-[#27212B] focus:outline-none focus:border-[#6D286F] focus:ring-1 focus:ring-[#6D286F] transition"
          >
            <option value="CUSTOMER">Customer (Subscribed Client)</option>
            <option value="STAFF">Staff (Operations & Support)</option>
            <option value="ADMIN">Administrator (Full Access)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#817986] absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-white border border-[#EAE5EC] rounded-xl pl-10 pr-4 py-2 text-sm text-[#27212B] placeholder-[#817986]/50 focus:outline-none focus:border-[#6D286F] focus:ring-1 focus:ring-[#6D286F] transition"
            />
          </div>

          {/* Password Validation Checklist */}
          <div className="mt-2.5 p-2.5 bg-[#FAF9FB] rounded-xl border border-[#EAE5EC] grid grid-cols-2 gap-1.5 text-[11px]">
            <span className={`flex items-center gap-1 ${hasMinLength ? 'text-[#16845B] font-semibold' : 'text-[#817986]'}`}>
              {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} 8+ Characters
            </span>
            <span className={`flex items-center gap-1 ${hasUpperCase ? 'text-[#16845B] font-semibold' : 'text-[#817986]'}`}>
              {hasUpperCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Uppercase (A-Z)
            </span>
            <span className={`flex items-center gap-1 ${hasLowerCase ? 'text-[#16845B] font-semibold' : 'text-[#817986]'}`}>
              {hasLowerCase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Lowercase (a-z)
            </span>
            <span className={`flex items-center gap-1 ${hasSpecial ? 'text-[#16845B] font-semibold' : 'text-[#817986]'}`}>
              {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Special Char (!@#$)
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !isPasswordValid}
          className="w-full mt-3 py-2.5 px-4 bg-[#6D286F] hover:bg-[#84418A] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 text-sm"
        >
          {loading ? 'Registering...' : 'Complete Registration'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-5 text-center">
        <p className="text-xs text-[#817986]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-[#6D286F] hover:underline"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
