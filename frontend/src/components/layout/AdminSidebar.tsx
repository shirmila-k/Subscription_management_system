import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  subscriptionCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ subscriptionCount = 2486 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/admin/dashboard', icon: 'dashboard' },
    { name: 'Subscriptions', path: '/admin/subscriptions', icon: 'autorenew', count: subscriptionCount },
    { name: 'Customers', path: '/admin/customers', icon: 'group' },
    { name: 'Products & Variants', path: '/admin/products', icon: 'inventory_2' },
    { name: 'Subscription Plans', path: '/admin/plans', icon: 'calendar_month' },
    { name: 'Quotations', path: '/admin/quotations', icon: 'request_quote' },
    { name: 'Invoices', path: '/admin/invoices', icon: 'receipt_long' },
    { name: 'Payments', path: '/admin/payments', icon: 'payments' },
    { name: 'Discounts', path: '/admin/discounts', icon: 'percent' },
    { name: 'Analytics', path: '/admin/analytics', icon: 'insights' },
    { name: 'Notifications', path: '/admin/notifications', icon: 'notifications' },
    { name: 'Team Management', path: '/admin/team', icon: 'badge' },
    { name: 'Settings', path: '/admin/settings', icon: 'settings' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-[#421747] text-white z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col min-h-0">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between shrink-0 bg-[#421747] border-b border-[#530D57]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6D286F] to-[#84418A] flex items-center justify-center font-bold text-white shadow-sm">
              <span className="material-symbols-outlined text-[20px]">all_inclusive</span>
            </div>
            <span className="text-base text-white tracking-tight font-bold">Brightloop</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#84418A] text-white text-[10px] font-bold uppercase tracking-wider">
            Enterprise
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin/dashboard'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#6D286F] text-white shadow-sm'
                    : 'text-[#E996E5] hover:bg-[#613465] hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.name}</span>
              </div>
              {item.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#EFE5F3] text-[#27212B] text-[11px] font-semibold">
                  {item.count.toLocaleString()}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 shrink-0 bg-[#421747] border-t border-[#530D57]">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#613465] text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#6D286F] border border-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
              {user?.firstName ? user.firstName.charAt(0) : 'P'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {user ? `${user.firstName} ${user.lastName}` : 'Priya Sharma'}
              </span>
              <span className="text-[10px] text-[#D9A0D9] truncate">
                {user?.role === 'ADMIN' ? 'Head of Billing & Ops' : user?.role || 'Administrator'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="text-[#D9A0D9] hover:text-white p-1 rounded transition"
            aria-label="Sign Out"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
