/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { LoginPage } from './features/auth/pages/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { InventoryPage } from './pages/InventoryPage';
import { QrPage } from './pages/QrPage';
import { RequestsPage } from './pages/RequestsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { ReportsPage } from './pages/ReportsPage';
import { PlaceholderPage } from './pages/PlaceholderPages';

function AppContent() {
  const { user } = useAuth();
  const { currentPage } = useNavigation();

  if (!user) {
    return <LoginPage />;
  }

  // SPA Page Routing Router mapping
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'users':
        return (
          <ProtectedRoute allowedRoles={['System Admin']}>
            <UsersPage />
          </ProtectedRoute>
        );
      case 'roles':
        return (
          <ProtectedRoute allowedRoles={['System Admin']}>
            <PlaceholderPage 
              title="Roles & Permissions" 
              desc="Fine-grained system access rules, delegation limits, and transaction authorization structures." 
            />
          </ProtectedRoute>
        );
      case 'departments':
        return (
          <ProtectedRoute allowedRoles={['System Admin']}>
            <DepartmentsPage />
          </ProtectedRoute>
        );
      case 'inventory':
        return <InventoryPage />;
      case 'stock':
        return (
          <ProtectedRoute allowedRoles={['Store Keeper', 'System Admin']}>
            <PlaceholderPage 
              title="Stock In/Out Ledger" 
              desc="Log for managing store intakes, supplier invoices, release orders, and discrepancy reports." 
            />
          </ProtectedRoute>
        );
      case 'requests':
        return <RequestsPage />;
      case 'approvals':
        return (
          <ProtectedRoute allowedRoles={['Department EO', 'Store Keeper', 'System Admin']}>
            <ApprovalsPage />
          </ProtectedRoute>
        );
      case 'qr':
        return <QrPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return (
          <PlaceholderPage 
            title="System Settings" 
            desc="Compliance levels, critical low-stock alert thresholds, notification rules, and email dispatchers." 
          />
        );
      default:
        return <DashboardPage />;
    }
  };

  return <MainLayout>{renderPage()}</MainLayout>;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
}
