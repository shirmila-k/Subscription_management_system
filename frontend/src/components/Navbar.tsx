import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserCheck, Briefcase, LogOut, Bell, Zap } from 'lucide-react';
import { Role } from '../types';

export const Navbar: React.FC = () => {
  const { user, role, logout, setMockSession } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800 px-6 py-3.5 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-black text-xl">
          B
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-lg text-white tracking-tight">Brightloop</span>
            <span className="text-[10px] uppercase font-bold tracking-widest bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded-full border border-brand-500/30">
              Subscription OS
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Enterprise Billing & Lifecycle Engine</p>
        </div>
      </div>

      {/* Role Switcher Pill Bar for Quick Evaluation */}
      <div className="hidden lg:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
        <span className="px-2.5 py-1 text-slate-400 flex items-center gap-1 font-semibold">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Switch View:
        </span>
        {(['ADMIN', 'STAFF', 'CUSTOMER'] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => setMockSession(r)}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              role === r
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-4">
        <button
          title="Notifications"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-slate-900" />
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-4 border-l border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center font-bold text-slate-200">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-slate-200">{user.name}</p>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                {role === 'ADMIN' && <Shield className="w-3 h-3 text-rose-400" />}
                {role === 'STAFF' && <Briefcase className="w-3 h-3 text-amber-400" />}
                {role === 'CUSTOMER' && <UserCheck className="w-3 h-3 text-emerald-400" />}
                <span className="capitalize">{role?.toLowerCase()}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
