import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { StaffLayout } from './layouts/StaffLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSubscriptions } from './pages/admin/AdminSubscriptions';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminPlans } from './pages/admin/AdminPlans';
import { AdminInvoices } from './pages/admin/AdminInvoices';
import { AdminDiscounts } from './pages/admin/AdminDiscounts';

// Customer Pages
import { CustomerPortal } from './pages/customer/CustomerPortal';
import { CustomerCatalog } from './pages/customer/CustomerCatalog';
import { CustomerInvoices } from './pages/customer/CustomerInvoices';

// Staff Pages
import { StaffPanel } from './pages/staff/StaffPanel';

export const App: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentTab, setCurrentTab] = useState<string>('admin-dashboard');

  // If user is not authenticated, display login/register
  if (!isAuthenticated) {
    return (
      <AuthLayout>
        {authView === 'login' ? (
          <LoginPage onSwitchToRegister={() => setAuthView('register')} />
        ) : (
          <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
        )}
      </AuthLayout>
    );
  }

  // Admin Portal Router
  if (role === 'ADMIN') {
    return (
      <AdminLayout currentTab={currentTab} onTabChange={setCurrentTab}>
        {currentTab === 'admin-dashboard' && <AdminDashboard />}
        {currentTab === 'admin-subscriptions' && <AdminSubscriptions />}
        {currentTab === 'admin-products' && <AdminProducts />}
        {currentTab === 'admin-plans' && <AdminPlans />}
        {currentTab === 'admin-invoices' && <AdminInvoices />}
        {currentTab === 'admin-discounts' && <AdminDiscounts />}
      </AdminLayout>
    );
  }

  // Staff Portal Router
  if (role === 'STAFF') {
    return (
      <StaffLayout currentTab={currentTab} onTabChange={setCurrentTab}>
        {currentTab === 'staff-queue' && <StaffPanel />}
        {currentTab === 'admin-subscriptions' && <AdminSubscriptions />}
        {currentTab === 'admin-invoices' && <AdminInvoices />}
      </StaffLayout>
    );
  }

  // Customer Portal Router
  return (
    <CustomerLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'customer-portal' && <CustomerPortal />}
      {currentTab === 'customer-catalog' && <CustomerCatalog />}
      {currentTab === 'customer-invoices' && <CustomerInvoices />}
    </CustomerLayout>
  );
};

export default App;
