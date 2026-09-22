import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export const Dashboard = () => {
  const { user } = useAuth();

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'Super Administrator',
      STORE_ADMIN: 'Store Administrator',
      DEPT_ADMIN_COMPUTER: 'Computer Engineering Administrator',
      DEPT_ADMIN_CIVIL: 'Civil Engineering Administrator',
      DEPT_ADMIN_ELECTRICAL: 'Electrical Engineering Administrator',
      DEPT_ADMIN_ELECTRONICS: 'Electronics & Telecommunication Administrator',
      DEPT_ADMIN_MECHANICAL: 'Mechanical Engineering Administrator',
    };
    return roleMap[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-heading font-bold text-gray-900">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user && getRoleDisplayName(user.role)}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Items
            </CardTitle>
            <Package className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">In store/department</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">0</div>
            <p className="text-xs text-gray-500 mt-1">Items need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Recent Activities
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Distributions
            </CardTitle>
            <LayoutDashboard className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No recent transactions</p>
            <p className="text-sm mt-2">Transactions will appear here once you start using the system</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

