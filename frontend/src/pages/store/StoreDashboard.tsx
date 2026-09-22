import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, AlertTriangle, TrendingUp, Plus, ArrowRight, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { stockService, storeEntryService, reportService } from '../../services/store.service';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const StoreDashboard = () => {
  // Fetch stock data
  const { data: stocks, isLoading: stocksLoading, error: stocksError } = useQuery({
    queryKey: ['store-stock'],
    queryFn: () => stockService.getAll(),
  });

  // Fetch low stock items
  const { data: lowStockItems, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => stockService.getLowStock(),
  });

  // Fetch recent entries
  const { data: recentEntries, isLoading: entriesLoading } = useQuery({
    queryKey: ['recent-entries'],
    queryFn: () => storeEntryService.getAll(1, 10),
  });

  // Fetch stock summary for chart
  const { data: stockSummary } = useQuery({
    queryKey: ['stock-summary'],
    queryFn: () => reportService.getStockSummary(),
  });

  if (stocksLoading || lowStockLoading || entriesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (stocksError) {
    return <ErrorMessage message="Failed to load dashboard data" />;
  }

  const totalItems = stocks?.length || 0;
  const totalValue = stocks?.reduce((sum, stock) => {
    // Placeholder calculation - would need price data
    return sum;
  }, 0) || 0;
  const lowStockCount = lowStockItems?.length || 0;
  const todayDistributions = 0; // Placeholder

  // Prepare chart data
  const chartData = stockSummary?.categorySummary
    ? Object.entries(stockSummary.categorySummary).map(([name, data]: [string, any]) => ({
        name,
        quantity: data.totalQuantity,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Store Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage inventory and track stock levels</p>
        </div>
        <Link
          to="/store/add-entry"
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Stock Entry
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
            <Package className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-gray-500 mt-1">In store catalog</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalValue.toLocaleString('en-IN')}</div>
            <p className="text-xs text-gray-500 mt-1">Inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Low Stock</CardTitle>
            <AlertTriangle className="w-4 h-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockCount}</div>
            <p className="text-xs text-gray-500 mt-1">Items need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Distributed Today</CardTitle>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayDistributions}</div>
            <p className="text-xs text-gray-500 mt-1">Items distributed</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/store/add-entry"
          className="card hover:shadow-md transition-shadow p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Add Stock Entry</div>
            <div className="text-sm text-gray-500">Record new inventory</div>
          </div>
        </Link>

        <Link
          to="/store/distribute"
          className="card hover:shadow-md transition-shadow p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <ArrowRight className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Distribute Items</div>
            <div className="text-sm text-gray-500">Send to departments</div>
          </div>
        </Link>

        <Link
          to="/store/stock"
          className="card hover:shadow-md transition-shadow p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">View Low Stock</div>
            <div className="text-sm text-gray-500">Check alerts</div>
          </div>
        </Link>

        <Link
          to="/store/reports"
          className="card hover:shadow-md transition-shadow p-4 flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">Generate Report</div>
            <div className="text-sm text-gray-500">View analytics</div>
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Entries */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Stock Entries</CardTitle>
            <Link
              to="/store/entries"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentEntries?.entries && recentEntries.entries.length > 0 ? (
              <div className="space-y-4">
                {recentEntries.entries.slice(0, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{entry.item?.name}</div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(entry.billDate), 'dd MMM yyyy')} • Qty: {entry.quantity}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">
                        ₹{Number(entry.billAmount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-xs text-gray-500">{entry.vendorName}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent entries</p>
                <p className="text-sm mt-2">Stock entries will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Level Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No data available</p>
                <p className="text-sm mt-2">Chart will populate as you add items</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

