import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserCheck, Briefcase, LogOut, Bell, Search, Zap } from 'lucide-react';
import { Role } from '../types';

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, role, logout, setMockSession } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-[#EAE5EC] px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Search Bar */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#817986]" />
          <input
            type="text"
            placeholder="Search subscriptions, invoices, customers (⌘K)..."
            className="w-full pl-10 pr-4 py-1.5 bg-[#FAF9FB] border border-[#EAE5EC] rounded-xl text-xs text-[#27212B] placeholder-[#817986] focus:outline-none focus:border-[#6D286F] focus:bg-white transition"
          />
        </div>
      </div>

      {/* Center Hackathon Role Switcher */}
      <div className="flex items-center bg-[#F3EAF5] p-1 rounded-xl text-xs border border-[#E5D1E8]">
        <span className="px-2 py-0.5 text-[#6D286F] font-bold flex items-center gap-1 text-[11px]">
          <Zap className="w-3 h-3 text-[#B7791F]" /> View:
        </span>
        {(['ADMIN', 'STAFF', 'CUSTOMER'] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => setMockSession(r)}
            className={`px-2.5 py-0.5 rounded-lg font-semibold transition text-[11px] ${
              role === r
                ? 'bg-[#6D286F] text-white shadow-xs'
                : 'text-[#817986] hover:text-[#27212B] hover:bg-white/60'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-3">
        <button
          title="Notifications"
          className="p-2 text-[#817986] hover:text-[#27212B] hover:bg-[#F3EAF5] rounded-xl transition relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#6D286F] ring-2 ring-white" />
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-[#EAE5EC]">
            <div className="w-8 h-8 rounded-xl bg-[#F3EAF5] text-[#6D286F] font-extrabold flex items-center justify-center text-xs border border-[#E5D1E8]">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-bold text-[#27212B]">{user.name}</p>
              <div className="flex items-center gap-1 text-[11px] text-[#817986]">
                {role === 'ADMIN' && <Shield className="w-3 h-3 text-[#6D286F]" />}
                {role === 'STAFF' && <Briefcase className="w-3 h-3 text-[#B7791F]" />}
                {role === 'CUSTOMER' && <UserCheck className="w-3 h-3 text-[#16845B]" />}
                <span>{role}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-[#817986] hover:text-[#C53B4B] hover:bg-[#FDF0F2] rounded-xl transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
