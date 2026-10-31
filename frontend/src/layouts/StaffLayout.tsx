import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const StaffLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Staff Overview', path: '/staff', icon: 'dashboard' },
    { name: 'Quotations Pipeline', path: '/staff/quotes', icon: 'request_quote' },
    { name: 'Active Subscriptions', path: '/staff/subscriptions', icon: 'autorenew' },
    { name: 'Invoices Review', path: '/staff/invoices', icon: 'receipt_long' },
  ];

  return (
    <div className="flex h-screen bg-[#FAF9FB] text-[#27212B] font-sans antialiased overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-white border-r border-[#EAE5EC] flex flex-col justify-between shrink-0 shadow-xs z-30">
        <div className="flex flex-col min-h-0">
          <div className="h-16 px-5 flex items-center justify-between border-b border-[#EAE5EC] bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6D286F] to-[#84418A] flex items-center justify-center font-bold text-white shadow-xs">
                <span className="material-symbols-outlined text-[20px]">all_inclusive</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base text-[#27212B] font-bold tracking-tight leading-none">Brightloop</span>
                <span className="text-[10px] text-[#84418A] font-semibold tracking-wider uppercase mt-0.5">
                  Staff Workspace
                </span>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/staff'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#F3EAF5] text-[#6D286F]'
                      : 'text-[#817986] hover:bg-[#FAF9FB] hover:text-[#27212B]'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#EAE5EC] bg-[#FAF9FB]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-[#F3EAF5] text-[#6D286F] font-bold flex items-center justify-center text-xs border border-[#EAE5EC]">
              {user?.firstName?.charAt(0) || 'S'}
            </div>
            <div className="flex flex-col min-w-0">
              <p className="text-xs font-bold text-[#27212B] truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Operations Staff'}
              </p>
              <p className="text-[11px] text-[#817986] truncate">Billing Specialist</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-[#EAE5EC] bg-white px-8 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#817986]">
            <span>Operations Workflow</span>
            <span>•</span>
            <span className="text-[#6D286F] font-bold">Quote-to-Subscription Execution</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Authorized Quoting Agent</span>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-xs font-semibold text-[#6D286F] hover:underline px-2 py-1"
            >
              Admin View &rarr;
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
