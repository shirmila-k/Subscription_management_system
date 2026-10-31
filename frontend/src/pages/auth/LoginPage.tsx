import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, ArrowRight, ShieldCheck, UserCheck, Briefcase } from 'lucide-react';
import { Role } from '../../types';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSwitchToRegister,
  onSwitchToForgotPassword,
}) => {
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
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#27212B]">Sign in to your account</h2>
        <p className="text-xs text-[#817986] mt-1">Enter your credentials to access the Brightloop platform</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-[#C53B4B]/10 border border-[#C53B4B]/20 text-[#C53B4B] text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1.5">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#817986] absolute left-3.5 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@brightloop.com"
              className="w-full bg-white border border-[#EAE5EC] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#27212B] placeholder-[#817986]/50 focus:outline-none focus:border-[#6D286F] focus:ring-1 focus:ring-[#6D286F] transition"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-[#27212B]">Password</label>
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-xs font-semibold text-[#6D286F] hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#817986] absolute left-3.5 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-white border border-[#EAE5EC] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#27212B] placeholder-[#817986]/50 focus:outline-none focus:border-[#6D286F] focus:ring-1 focus:ring-[#6D286F] transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-2.5 px-4 bg-[#6D286F] hover:bg-[#84418A] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 text-sm"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-[#817986]">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-bold text-[#6D286F] hover:underline"
          >
            Create Customer Account
          </button>
        </p>
      </div>

      {/* 1-Click Quick Demo Evaluation Buttons */}
      <div className="mt-8 pt-6 border-t border-[#EAE5EC]">
        <p className="text-[11px] font-bold text-[#817986] uppercase tracking-wider mb-3 text-center">
          ⚡ 1-Click Sandbox Evaluation
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('ADMIN')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF9FB] hover:bg-[#F3EAF5] border border-[#EAE5EC] text-[#27212B] transition group"
          >
            <ShieldCheck className="w-4 h-4 text-[#6D286F] group-hover:scale-110 transition" />
            <span className="text-[11px] font-semibold mt-1">Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('STAFF')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF9FB] hover:bg-[#F3EAF5] border border-[#EAE5EC] text-[#27212B] transition group"
          >
            <Briefcase className="w-4 h-4 text-[#84418A] group-hover:scale-110 transition" />
            <span className="text-[11px] font-semibold mt-1">Staff</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('CUSTOMER')}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#FAF9FB] hover:bg-[#F3EAF5] border border-[#EAE5EC] text-[#27212B] transition group"
          >
            <UserCheck className="w-4 h-4 text-[#16845B] group-hover:scale-110 transition" />
            <span className="text-[11px] font-semibold mt-1">Customer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
