import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User as UserIcon, Building, ArrowRight } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Frontend strict password check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        'Password must be at least 8 chars long with uppercase, lowercase, number, and special character.'
      );
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
      <h2 className="text-xl font-bold text-white mb-2">Create an Account</h2>
      <p className="text-xs text-slate-400 mb-6">Join Brightloop Subscription Management System</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
          <div className="relative">
            <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alex Johnson"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Company Name</label>
          <div className="relative">
            <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corporation"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Business Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@acmecorp.com"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Account Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
          >
            <option value="CUSTOMER">Customer (Subscribed Client)</option>
            <option value="STAFF">Staff (Operations & Support)</option>
            <option value="ADMIN">Administrator (Full Access)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Password (Strict security rules apply)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 uppercase, 1 special"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Register'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-400">
          Already registered?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-brand-400 hover:text-brand-300 font-semibold transition"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
};
