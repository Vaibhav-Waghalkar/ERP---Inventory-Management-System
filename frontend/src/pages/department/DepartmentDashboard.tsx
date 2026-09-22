import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Package, AlertTriangle, TrendingUp, Plus, ArrowRight, BarChart3, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getDashboard } from '../../services/analytics.service';
import { getIncomingItems } from '../../services/department.service';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Department } from '../../types';

const getDepartmentFromRole = (role: string): Department | null => {
  const roleToDept: Record<string, Department> = {
    DEPT_ADMIN_COMPUTER: 'COMPUTER_ENGINEERING',
    DEPT_ADMIN_CIVIL: 'CIVIL_ENGINEERING',
    DEPT_ADMIN_ELECTRICAL: 'ELECTRICAL_ENGINEERING',
    DEPT_ADMIN_ELECTRONICS: 'ELECTRONICS_TELECOMMUNICATION',
    DEPT_ADMIN_MECHANICAL: 'MECHANICAL_ENGINEERING',
  };
  return roleToDept[role] || null;
};

const getDepartmentName = (dept: Department): string => {
  const names: Record<Department, string> = {
    STORE: 'Store',
    COMPUTER_ENGINEERING: 'Computer Engineering',
    CIVIL_ENGINEERING: 'Civil Engineering',
    ELECTRICAL_ENGINEERING: 'Electrical Engineering',
    ELECTRONICS_TELECOMMUNICATION: 'Electronics & Telecommunication',
    MECHANICAL_ENGINEERING: 'Mechanical Engineering',
  };
  return names[dept] || dept;
};

export const DepartmentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const department = user?.role ? getDepartmentFromRole(user.role) : null;

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['department-dashboard', department],
    queryFn: () => getDashboard('DEPT_ADMIN', department!),
    enabled: !!department,
  });

  const { data: incomingItems } = useQuery({
    queryKey: ['incoming-items', department],
    queryFn: () => getIncomingItems(department!),
    enabled: !!department,
  });

  if (!department) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Department not found for your role.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load dashboard data" />;
  }

  const pendingItems = incomingItems?.filter((item) => !item.isConfirmed) || [];
  const recentIncoming = incomingItems?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold">
              🏫 {getDepartmentName(department)} Department
            </h1>
            <p className="text-blue-100 mt-2">
              Admin: {user?.fullName} | Last Login: {format(new Date(), 'dd MMM yyyy, hh:mm a')}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
            <Package className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalItems || 0}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Good
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.lowStockCount || 0}</div>
            <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Warning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Usage</CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.todayUsage || 0}</div>
            <p className="text-xs text-gray-500 mt-1">items used today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">This Month</CardTitle>
            <BarChart3 className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.monthlyConsumption || 0}</div>
            <p className="text-xs text-gray-500 mt-1">items consumed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incoming Items */}
      {pendingItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Pending Confirmations ({pendingItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.item.name}</p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} {item.item.category?.name || ''} | From: {item.distributedBy.fullName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Received: {format(new Date(item.receivedDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <Link
                    to={`/department/incoming`}
                    className="btn btn-sm btn-primary"
                  >
                    Confirm
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to={`/department/log-usage`}
          className="btn btn-primary flex items-center justify-center gap-2 h-20"
        >
          <Plus className="w-5 h-5" />
          <span>Log Daily Usage</span>
        </Link>
        <Link
          to={`/department/stock`}
          className="btn btn-outline flex items-center justify-center gap-2 h-20"
        >
          <Package className="w-5 h-5" />
          <span>View Stock</span>
        </Link>
        <Link
          to={`/department/usage-history`}
          className="btn btn-outline flex items-center justify-center gap-2 h-20"
        >
          <BarChart3 className="w-5 h-5" />
          <span>Usage History</span>
        </Link>
        <Link
          to={`/department/reports`}
          className="btn btn-outline flex items-center justify-center gap-2 h-20"
        >
          <TrendingUp className="w-5 h-5" />
          <span>Generate Reports</span>
        </Link>
      </div>

      {/* Usage Chart */}
      {dashboardData?.monthlyTrend && dashboardData.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="usage" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Alerts Panel */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dashboardData.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    alert.severity === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <p className="text-sm font-medium">{alert.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

