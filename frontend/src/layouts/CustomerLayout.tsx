import React from 'react';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';

interface CustomerLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FB] text-[#27212B]">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar currentTab={currentTab} onTabChange={onTabChange} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAF9FB]">
          <div className="max-w-6xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default CustomerLayout;
