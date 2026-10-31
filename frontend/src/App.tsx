import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { StaffLayout } from './layouts/StaffLayout';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { SubscriptionsList } from './pages/admin/SubscriptionsList';
import { CustomersPage } from './pages/admin/CustomersPage';
import { ProductsManager } from './pages/admin/ProductsManager';
import { PlansManager } from './pages/admin/PlansManager';
import { QuotationsPage } from './pages/admin/QuotationsPage';
import { InvoicesList } from './pages/admin/InvoicesList';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { DiscountsPage } from './pages/admin/DiscountsPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { TeamPage } from './pages/admin/TeamPage';
import { SettingsPage } from './pages/admin/SettingsPage';

// Customer Pages
import { CustomerPortal } from './pages/customer/CustomerPortal';
import { CustomerSubscriptions } from './pages/customer/CustomerSubscriptions';
import { CustomerInvoices } from './pages/customer/CustomerInvoices';
import { CustomerPayments } from './pages/customer/CustomerPayments';
import { CustomerProfile } from './pages/customer/CustomerProfile';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';

// Route Guard
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9FB] flex items-center justify-center text-[#817986] text-xs font-semibold">
        <span className="material-symbols-outlined text-[24px] animate-spin text-[#6D286F] mr-2">
          progress_activity
        </span>
        <span>Verifying Brightloop security session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'STAFF') return <Navigate to="/staff" replace />;
    return <Navigate to="/portal/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Authentication Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Admin Routes (Stitch Reference) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="subscriptions" element={<SubscriptionsList />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="products" element={<ProductsManager />} />
            <Route path="plans" element={<PlansManager />} />
            <Route path="quotations" element={<QuotationsPage />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="discounts" element={<DiscountsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Customer Self-Service Portal Routes */}
          <Route
            path="/portal"
            element={
              <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN', 'STAFF']}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/portal/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerPortal />} />
            <Route path="subscriptions" element={<CustomerSubscriptions />} />
            <Route path="invoices" element={<CustomerInvoices />} />
            <Route path="payments" element={<CustomerPayments />} />
            <Route path="profile" element={<CustomerProfile />} />
          </Route>

          {/* Backwards compatibility for customer/ */}
          <Route path="/customer/*" element={<Navigate to="/portal/dashboard" replace />} />

          {/* Staff Operations Routes */}
          <Route
            path="/staff"
            element={
              <ProtectedRoute allowedRoles={['STAFF', 'ADMIN']}>
                <StaffLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StaffDashboard />} />
            <Route path="quotes" element={<StaffDashboard />} />
            <Route path="subscriptions" element={<SubscriptionsList />} />
            <Route path="invoices" element={<InvoicesList />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
