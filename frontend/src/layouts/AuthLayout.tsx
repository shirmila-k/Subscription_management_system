import React from 'react';
import { Outlet, Link } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9FB] flex flex-col justify-center items-center p-6 relative overflow-hidden font-sans">
      {/* Background Decorative Soft Plum Tints */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-[#F3EAF5]/60 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-[#84418A]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <Link to="/login" className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#421747] via-[#6D286F] to-[#84418A] flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[28px] text-white">all_inclusive</span>
          </div>
          <span className="text-2xl font-black tracking-tight text-[#27212B]">Brightloop</span>
        </Link>
        <p className="text-xs text-[#817986] max-w-sm">
          Enterprise Subscription Management &amp; Automated Billing Platform
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white border border-[#EAE5EC] rounded-2xl p-7 shadow-sm relative z-10">
        <Outlet />
      </div>

      <div className="mt-6 text-center text-xs text-[#817986] flex items-center gap-1.5">
        <span className="material-symbols-outlined text-[16px] text-[#6D286F]">shield</span>
        <span>Secured with JWT sessions &amp; RBAC enterprise authorization</span>
      </div>
    </div>
  );
};
