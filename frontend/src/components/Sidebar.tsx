import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Layers,
  Users,
  Package,
  CalendarCheck,
  FileCheck2,
  FileText,
  CreditCard,
  Tag,
  BarChart3,
  UserCog,
  Settings,
  ShoppingBag,
  Inbox,
  Sparkles,
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
        { id: 'admin-customers', label: 'Customers', icon: Users },
        { id: 'admin-products', label: 'Products & Variants', icon: Package },
        { id: 'admin-plans', label: 'Pricing Plans', icon: CalendarCheck },
        { id: 'admin-quotations', label: 'Quotations', icon: FileCheck2 },
        { id: 'admin-invoices', label: 'Invoices & Billing', icon: FileText },
        { id: 'admin-payments', label: 'Payments', icon: CreditCard },
        { id: 'admin-discounts', label: 'Discounts & Codes', icon: Tag },
        { id: 'admin-analytics', label: 'Financial Analytics', icon: BarChart3 },
        { id: 'admin-team', label: 'Team & Staff', icon: UserCog },
        { id: 'admin-settings', label: 'Settings', icon: Settings },
      ];
    }

    if (role === 'STAFF') {
      return [
        { id: 'staff-queue', label: 'Quotations Queue', icon: Inbox },
        { id: 'admin-subscriptions', label: 'Subscriptions Management', icon: Layers },
        { id: 'admin-customers', label: 'Customers', icon: Users },
        { id: 'admin-invoices', label: 'Invoice Approvals', icon: FileText },
        { id: 'admin-payments', label: 'Payment Records', icon: CreditCard },
      ];
    }

    // CUSTOMER role
    return [
      { id: 'customer-portal', label: 'My Subscriptions', icon: LayoutDashboard },
      { id: 'customer-catalog', label: 'Services Catalog', icon: ShoppingBag },
      { id: 'customer-invoices', label: 'Invoices & Receipts', icon: FileText },
      { id: 'customer-payments', label: 'Payment History', icon: CreditCard },
      { id: 'customer-profile', label: 'Account Profile', icon: UserCog },
    ];
  };

  const items = getNavItems();

  return (
    <aside className="w-64 bg-[#421747] text-white flex flex-col justify-between py-6 px-3.5 border-r border-[#581F5A] select-none flex-shrink-0 min-h-screen">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6D286F] to-[#84418A] flex items-center justify-center text-white font-extrabold shadow-md border border-[#84418A]/40 text-base">
            BL
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">Brightloop</span>
              <span className="text-[9px] uppercase font-bold tracking-wider bg-[#F3EAF5]/20 text-[#F3EAF5] px-1.5 py-0.5 rounded">
                OS
              </span>
            </div>
            <p className="text-[11px] text-[#D1ACD7]/80">Subscription Platform</p>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-3 pt-2">
          <p className="text-[10px] font-bold text-[#D1ACD7]/60 uppercase tracking-widest">
            {role === 'ADMIN' ? 'Administration' : role === 'STAFF' ? 'Staff Workspace' : 'Customer Portal'}
          </p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#6D286F] text-white shadow-sm font-bold'
                    : 'text-[#D1ACD7] hover:text-white hover:bg-[#581F5A]/50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-[#D1ACD7]/70 group-hover:text-white'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footnote */}
      <div className="pt-4 mt-4 border-t border-[#581F5A]/60 px-2 space-y-2">
        <div className="bg-[#2E0F32]/80 p-3 rounded-xl border border-[#581F5A]/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[#D1ACD7] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#B67EBF]" /> Auto Billing
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16845B] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#16845B]" />
            </span>
          </div>
          <p className="text-[11px] text-white/80 mt-1 font-medium">Node-cron scheduler active</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
