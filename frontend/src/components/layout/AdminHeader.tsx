import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminHeaderProps {
  onSearch?: (query: string) => void;
}

const routeTitles: Record<string, { category: string; title: string }> = {
  '/admin': { category: 'Dashboard', title: 'Overview' },
  '/admin/dashboard': { category: 'Dashboard', title: 'Overview' },
  '/admin/subscriptions': { category: 'Dashboard', title: 'Subscriptions' },
  '/admin/customers': { category: 'Directory', title: 'Customers' },
  '/admin/products': { category: 'Catalog', title: 'Products & Variants' },
  '/admin/plans': { category: 'Catalog', title: 'Subscription Plans' },
  '/admin/quotations': { category: 'Sales', title: 'Quotations' },
  '/admin/invoices': { category: 'Finance', title: 'Invoices & Billing' },
  '/admin/payments': { category: 'Finance', title: 'Payments & Collections' },
  '/admin/discounts': { category: 'Marketing', title: 'Discounts & Offers' },
  '/admin/analytics': { category: 'Executive', title: 'Analytics & KPIs' },
  '/admin/notifications': { category: 'Automation & Comms', title: 'Notification Center & Email Automation' },
  '/admin/team': { category: 'Organization', title: 'Team Management' },
  '/admin/settings': { category: 'System', title: 'Settings' },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onSearch }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const currentPath = location.pathname;
  const breadcrumb = routeTitles[currentPath] || {
    category: 'Dashboard',
    title: currentPath.split('/').filter(Boolean).pop()?.toUpperCase() || 'Overview',
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-[260px] right-0 h-16 bg-white border-b border-[#EAE5EC] shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-8">
      {/* Breadcrumbs & Search */}
      <div className="flex items-center gap-6 flex-1 max-w-2xl">
        <div className="flex items-center gap-1.5 text-xs text-[#81737e]">
          <Link to="/admin/dashboard" className="hover:text-[#1f1924] transition-colors">
            {breadcrumb.category}
          </Link>
          <span>/</span>
          <span className="text-[#1f1924] font-semibold">{breadcrumb.title}</span>
        </div>

        <div className="relative flex-1 max-w-md hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#81737e] text-[18px]">
            search
          </span>
          <input
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full pl-9 pr-12 py-1.5 rounded-lg bg-[#f5eaf9] text-[#1f1924] placeholder:text-[#81737e] text-xs outline-none ring-1 ring-[#d3c2ce] focus:ring-2 focus:ring-[#6D286F] transition"
            placeholder="Search anything (Ctrl + K)..."
            type="text"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-white text-[10px] text-[#81737e] shadow-xs font-mono">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Status, Actions & Profile */}
      <div className="flex items-center gap-4">
        {/* Environment Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f5eaf9] text-[#1f1924] text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Production</span>
        </div>

        {/* Documentation / Help */}
        <button
          type="button"
          className="text-[#81737e] hover:text-[#1f1924] p-1.5 rounded-lg hover:bg-slate-50 transition"
          title="System Help & Docs"
          onClick={() => alert('Brightloop Enterprise Subscription Billing v2.4')}
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            className="text-[#81737e] hover:text-[#1f1924] p-1.5 rounded-lg hover:bg-slate-50 transition"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            <span className="absolute 0 top-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ba1a1a] text-white text-[10px] font-bold">
              3
            </span>
          </button>
        </div>

        {/* Profile Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#EAE5EC]">
          <div className="w-8 h-8 rounded-full bg-[#6D286F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.firstName ? user.firstName.charAt(0).toUpperCase() : 'P'}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-semibold text-[#1f1924] leading-tight">
              {user ? `${user.firstName} ${user.lastName}` : 'Priya Sharma'}
            </span>
            <span className="text-[10px] text-[#81737e]">
              {user?.role === 'ADMIN' ? 'Head of Billing' : user?.role || 'Administrator'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="text-[#81737e] hover:text-[#ba1a1a] p-1 rounded transition"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
