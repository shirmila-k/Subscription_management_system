import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 items-center justify-center shadow-xl shadow-brand-500/25 text-white font-black text-2xl mb-4">
            B
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Brightloop Software</h1>
          <p className="text-sm text-slate-400 mt-1">Modular Subscription & Billing Management</p>
        </div>

        <div className="glass-panel rounded-3xl p-8 border border-slate-700/60 shadow-2xl backdrop-blur-2xl">
          {children}
        </div>
      </div>
    </div>
  );
};
