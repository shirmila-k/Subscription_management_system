import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from '../components/layout/AdminSidebar';
import { AdminHeader } from '../components/layout/AdminHeader';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FAF9FB] text-[#27212B] font-sans antialiased">
      {/* Stitch Dark Plum Sidebar */}
      <AdminSidebar subscriptionCount={2486} />

      {/* Main Content Area (offset by 260px sidebar) */}
      <div className="pl-[260px] flex flex-col min-h-screen">
        {/* Stitch Header */}
        <AdminHeader />

        {/* Dynamic Route Content */}
        <main className="flex-1 w-full pt-16 px-8 py-8 bg-[#FAF9FB]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
