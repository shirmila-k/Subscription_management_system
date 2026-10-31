import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { StaffLayout } from './layouts/StaffLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminSubscriptions } from './pages/admin/AdminSubscriptions';
import { AdminCustomers } from './pages/admin/AdminCustomers';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminPlans } from './pages/admin/AdminPlans';
import { AdminQuotations } from './pages/admin/AdminQuotations';
import { AdminInvoices } from './pages/admin/AdminInvoices';
import { AdminPayments } from './pages/admin/AdminPayments';
import { AdminDiscounts } from './pages/admin/AdminDiscounts';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminTeam } from './pages/admin/AdminTeam';
import { AdminSettings } from './pages/admin/AdminSettings';

// Customer Pages
import { CustomerPortal } from './pages/customer/CustomerPortal';
import { CustomerCatalog } from './pages/customer/CustomerCatalog';
import { CustomerInvoices } from './pages/customer/CustomerInvoices';
import { CustomerPayments } from './pages/customer/CustomerPayments';
import { CustomerProfile } from './pages/customer/CustomerProfile';

// Staff Pages
import { StaffPanel } from './pages/staff/StaffPanel';

export const App: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [resetToken, setResetToken] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>('admin-dashboard');

  // Handle Tab Switch fallback when switching roles
  React.useEffect(() => {
    if (role === 'ADMIN' && !currentTab.startsWith('admin-')) {
      setCurrentTab('admin-dashboard');
    } else if (role === 'STAFF' && !currentTab.startsWith('staff-') && !currentTab.startsWith('admin-')) {
      setCurrentTab('staff-queue');
    } else if (role === 'CUSTOMER' && !currentTab.startsWith('customer-')) {
      setCurrentTab('customer-portal');
    }
  }, [role]);

  // If user is not authenticated, display authentication screens
  if (!isAuthenticated) {
    return (
      <AuthLayout>
        {authView === 'login' && (
          <LoginPage
            onSwitchToRegister={() => setAuthView('register')}
            onSwitchToForgotPassword={() => setAuthView('forgot-password')}
          />
        )}
        {authView === 'register' && (
          <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
        )}
        {authView === 'forgot-password' && (
          <ForgotPasswordPage
            onSwitchToLogin={() => setAuthView('login')}
            onProceedToReset={(token) => {
              if (token) setResetToken(token);
              setAuthView('reset-password');
            }}
          />
        )}
        {authView === 'reset-password' && (
          <ResetPasswordPage
            initialToken={resetToken}
            onSwitchToLogin={() => setAuthView('login')}
          />
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
        {currentTab === 'admin-customers' && <AdminCustomers />}
        {currentTab === 'admin-products' && <AdminProducts />}
        {currentTab === 'admin-plans' && <AdminPlans />}
        {currentTab === 'admin-quotations' && <AdminQuotations />}
        {currentTab === 'admin-invoices' && <AdminInvoices />}
        {currentTab === 'admin-payments' && <AdminPayments />}
        {currentTab === 'admin-discounts' && <AdminDiscounts />}
        {currentTab === 'admin-analytics' && <AdminAnalytics />}
        {currentTab === 'admin-team' && <AdminTeam />}
        {currentTab === 'admin-settings' && <AdminSettings />}
      </AdminLayout>
    );
  }

  // Staff Portal Router
  if (role === 'STAFF') {
    return (
      <StaffLayout currentTab={currentTab} onTabChange={setCurrentTab}>
        {currentTab === 'staff-queue' && <StaffPanel />}
        {currentTab === 'admin-subscriptions' && <AdminSubscriptions />}
        {currentTab === 'admin-customers' && <AdminCustomers />}
        {currentTab === 'admin-invoices' && <AdminInvoices />}
        {currentTab === 'admin-payments' && <AdminPayments />}
      </StaffLayout>
    );
  }

  // Customer Portal Router
  return (
    <CustomerLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'customer-portal' && <CustomerPortal />}
      {currentTab === 'customer-catalog' && <CustomerCatalog />}
      {currentTab === 'customer-invoices' && <CustomerInvoices />}
      {currentTab === 'customer-payments' && <CustomerPayments />}
      {currentTab === 'customer-profile' && <CustomerProfile />}
    </CustomerLayout>
  );
};

export default App;
