import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { StoreDashboard } from './pages/store/StoreDashboard';
import { AddStockEntry } from './pages/store/AddStockEntry';
import { StockManagement } from './pages/store/StockManagement';
import { DistributeItems } from './pages/store/DistributeItems';
import { EntryHistory } from './pages/store/EntryHistory';
import { Reports } from './pages/store/Reports';
import { DepartmentDashboard } from './pages/department/DepartmentDashboard';
import { DepartmentStock } from './pages/department/DepartmentStock';
import { LogUsage } from './pages/department/LogUsage';
import { UsageHistory } from './pages/department/UsageHistory';
import { IncomingItems } from './pages/department/IncomingItems';
import { DepartmentReports } from './pages/department/DepartmentReports';
import { AdvancedAnalytics } from './pages/admin/AdvancedAnalytics';
import { VerificationCenter } from './pages/admin/VerificationCenter';
import { Settings } from './pages/Settings';
import { AuditTrail } from './pages/admin/AuditTrail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN']}>
                  <Layout>
                    <Users />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/store"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'STORE_ADMIN']}>
                  <Layout>
                    <StoreDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/store/add-entry"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'STORE_ADMIN']}>
                  <Layout>
                    <AddStockEntry />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/store/stock"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'STORE_ADMIN']}>
                  <Layout>
                    <StockManagement />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/store/distribute"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'STORE_ADMIN']}>
                  <Layout>
                    <DistributeItems />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/store/entries"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'STORE_ADMIN']}>
                  <Layout>
                    <EntryHistory />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/store/reports"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'STORE_ADMIN']}>
                  <Layout>
                    <Reports />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/department"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL']}>
                  <Layout>
                    <DepartmentDashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/department/stock"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL']}>
                  <Layout>
                    <DepartmentStock />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/department/log-usage"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL']}>
                  <Layout>
                    <LogUsage />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/department/usage-history"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL']}>
                  <Layout>
                    <UsageHistory />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/department/incoming"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL']}>
                  <Layout>
                    <IncomingItems />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/department/reports"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL']}>
                  <Layout>
                    <DepartmentReports />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN', 'STORE_ADMIN']}>
                  <Layout>
                    <AdvancedAnalytics />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/verification"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN']}>
                  <Layout>
                    <VerificationCenter />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <PrivateRoute requiredRole={['SUPER_ADMIN']}>
                  <Layout>
                    <AuditTrail />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

