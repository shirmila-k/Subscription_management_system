import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../../services';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.forgotPassword(email);
    } catch {
      // Demo fallback
    }
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[#27212B]">Reset Account Password</h2>
        <p className="text-xs text-[#817986] mt-0.5">
          Enter your registered work email to receive a secure recovery token.
        </p>
      </div>

      {submitted ? (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-emerald-600 shrink-0">check_circle</span>
            <div>
              <p className="font-bold">Password Reset Link Dispatched</p>
              <p className="mt-1">
                If an account exists for <strong className="text-[#27212B]">{email}</strong>, you will receive an email
                with instructions shortly.
              </p>
            </div>
          </div>
          <Link
            to="/login"
            className="w-full py-2.5 px-4 bg-[#FAF9FB] hover:bg-[#F3EAF5] text-[#27212B] font-bold text-xs rounded-lg flex items-center justify-center gap-2 border border-[#EAE5EC] transition-all"
          >
            &larr; Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#27212B] mb-1">Registered Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@brightloop.com"
              className="w-full px-3 py-2 text-xs bg-[#FAF9FB] border border-[#EAE5EC] rounded-lg text-[#27212B] outline-none focus:border-[#6D286F]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-[#6D286F] hover:bg-[#530D57] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 disabled:opacity-50"
          >
            <span>{loading ? 'Sending Recovery Link...' : 'Send Password Reset Link'}</span>
          </button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-[#6D286F] font-bold hover:underline">
              &larr; Return to Sign In
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};
