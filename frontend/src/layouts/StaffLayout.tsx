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
      <aside className="w-[260px] bg-[#421747] text-white flex flex-col justify-between shrink-0 shadow-[0_1px_8px_rgba(0,0,0,0.06)] z-30">
        <div className="flex flex-col min-h-0">
          <div className="h-16 px-5 flex items-center justify-between border-b border-[#530D57] bg-[#421747]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6D286F] to-[#84418A] flex items-center justify-center font-bold text-white shadow-sm">
                <span className="material-symbols-outlined text-[20px]">all_inclusive</span>
              </div>
              <div className="flex flex-col">
                <span className="text-base text-white font-bold tracking-tight leading-none">Brightloop</span>
                <span className="text-[10px] text-[#D9A0D9] font-semibold tracking-wider uppercase mt-1">
                  Staff Workspace
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#84418A] text-white text-[10px] font-bold uppercase tracking-wider">
              Staff
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/staff'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#6D286F] text-white shadow-sm'
                      : 'text-[#E996E5] hover:bg-[#613465] hover:text-white'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-3 shrink-0 bg-[#421747] border-t border-[#530D57]">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#613465] text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-[#6D286F] border border-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {user?.firstName?.charAt(0) || 'S'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Operations Staff'}
                </span>
                <span className="text-[10px] text-[#D9A0D9] truncate">Billing Specialist</span>
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
