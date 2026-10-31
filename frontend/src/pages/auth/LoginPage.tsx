import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';
import { Role } from '../../types';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, setMockSession } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: Role) => {
    setMockSession(role);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Sign in to your account</h2>
      <p className="text-xs text-slate-400 mb-6">Enter your credentials to access the workspace</p>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@brightloop.com"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* 1-Click Quick Demo Evaluation Buttons */}
      <div className="mt-8 pt-6 border-t border-slate-800">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 text-center">
          ⚡ 1-Click Sandbox Test Sessions
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('ADMIN')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition group"
          >
            <ShieldCheck className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
            <span className="text-[11px] font-medium mt-1">Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('STAFF')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition group"
          >
            <Briefcase className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
            <span className="text-[11px] font-medium mt-1">Staff</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('CUSTOMER')}
            className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition group"
          >
            <UserCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span className="text-[11px] font-medium mt-1">Customer</span>
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-brand-400 hover:text-brand-300 font-semibold transition"
          >
            Register company
          </button>
        </p>
      </div>
    </div>
  );
};
