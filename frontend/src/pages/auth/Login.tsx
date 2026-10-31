import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@brightloop.com');
  const [password, setPassword] = useState('Brightloop@2026');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (user.role === 'STAFF') {
        navigate('/admin/subscriptions');
      } else {
        navigate('/portal/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Brightloop@2026');
    setError(null);
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[#27212B]">Sign In to Platform</h2>
        <p className="text-xs text-[#817986] mt-0.5">
          Access your recurring subscriptions, billing runs, and analytics console.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-[#C53B4B]">
          <span className="material-symbols-outlined text-[18px]">error</span>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#27212B] mb-1">Email Address</label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#817986] text-[18px]">
              mail
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@brightloop.com"
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF9FB] border border-[#EAE5EC] rounded-lg text-[#27212B] outline-none focus:border-[#6D286F]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[#27212B]">Password</label>
            <Link to="/forgot-password" className="text-xs text-[#6D286F] font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#817986] text-[18px]">
              lock
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF9FB] border border-[#EAE5EC] rounded-lg text-[#27212B] outline-none focus:border-[#6D286F]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-[#6D286F] hover:bg-[#530D57] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Console'}</span>
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </button>
      </form>

      {/* Quick Demo Switcher */}
      <div className="mt-6 pt-5 border-t border-[#EAE5EC]">
        <p className="text-[11px] font-semibold text-[#817986] uppercase tracking-wider text-center mb-2.5">
          Hackathon 1-Click Role Switcher
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemo('admin@brightloop.com')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
              email === 'admin@brightloop.com'
                ? 'bg-[#F3EAF5] border-[#6D286F] text-[#6D286F]'
                : 'bg-[#FAF9FB] border-[#EAE5EC] text-[#27212B] hover:bg-[#F3EAF5]'
            }`}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('staff@brightloop.com')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
              email === 'staff@brightloop.com'
                ? 'bg-[#F3EAF5] border-[#6D286F] text-[#6D286F]'
                : 'bg-[#FAF9FB] border-[#EAE5EC] text-[#27212B] hover:bg-[#F3EAF5]'
            }`}
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo('customer@acmecorp.com')}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
              email === 'customer@acmecorp.com'
                ? 'bg-[#F3EAF5] border-[#6D286F] text-[#6D286F]'
                : 'bg-[#FAF9FB] border-[#EAE5EC] text-[#27212B] hover:bg-[#F3EAF5]'
            }`}
          >
            Customer
          </button>
        </div>
      </div>

      <div className="mt-5 text-center text-xs text-[#817986]">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-[#6D286F] font-bold hover:underline">
          Register Customer Account
        </Link>
      </div>
    </div>
  );
};
