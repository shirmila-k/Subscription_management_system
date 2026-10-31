import React from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

interface StaffLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const StaffLayout: React.FC<StaffLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onTabChange={onTabChange} />
        <main className="flex-1 overflow-y-auto p-8 bg-gradient-to-b from-slate-900/50 to-slate-950">
          <div className="max-w-7xl mx-auto space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
};
