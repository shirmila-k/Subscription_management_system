import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Layers,
  Package,
  CalendarCheck,
  FileText,
  Tag,
  ShoppingBag,
  CreditCard,
  Inbox,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange }) => {
  const { role } = useAuth();

  const getNavItems = () => {
    if (role === 'ADMIN') {
      return [
        { id: 'admin-dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
        { id: 'admin-subscriptions', label: 'Subscriptions', icon: Layers },
        { id: 'admin-products', label: 'Products & Variants', icon: Package },
        { id: 'admin-plans', label: 'Pricing Plans', icon: CalendarCheck },
        { id: 'admin-invoices', label: 'Invoices & Billing', icon: FileText },
        { id: 'admin-discounts', label: 'Discount Codes', icon: Tag },
      ];
    }

    if (role === 'STAFF') {
      return [
        { id: 'staff-queue', label: 'Quotations Queue', icon: Inbox },
        { id: 'admin-subscriptions', label: 'Subscriptions Management', icon: Layers },
        { id: 'admin-invoices', label: 'Invoice Approvals', icon: FileText },
      ];
    }

    // CUSTOMER role
    return [
      { id: 'customer-portal', label: 'My Subscriptions', icon: LayoutDashboard },
      { id: 'customer-catalog', label: 'Services Catalog', icon: ShoppingBag },
      { id: 'customer-invoices', label: 'Invoices & Receipts', icon: CreditCard },
    ];
  };

  const items = getNavItems();

  return (
    <aside className="w-64 glass-panel border-r border-slate-800 flex flex-col justify-between py-6 px-4">
      <div className="space-y-6">
        <div className="px-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {role} WORKSPACE
          </p>
        </div>

        <nav className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-200 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footnote */}
      <div className="glass-card p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Billing Engine Online</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Cron billing scheduler active</p>
      </div>
    </aside>
  );
};
