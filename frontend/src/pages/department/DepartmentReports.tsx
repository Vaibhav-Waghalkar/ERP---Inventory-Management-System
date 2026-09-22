import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Download, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getUsageReport, getMonthlyConsumption, getDepartmentSummary } from '../../services/department.service';
import { Department } from '../../types';
import { format, subMonths } from 'date-fns';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const DepartmentReports = () => {
  const { user } = useAuth();
  const department = user?.role ? getDepartmentFromRole(user.role) : null;

  const [reportType, setReportType] = useState<'summary' | 'usage' | 'consumption'>('summary');
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedItemId, setSelectedItemId] = useState('');

  const { data: summary } = useQuery({
    queryKey: ['department-summary', department],
    queryFn: () => getDepartmentSummary(department!),
    enabled: !!department && reportType === 'summary',
  });

  const { data: usageReport } = useQuery({
    queryKey: ['usage-report', department, startDate, endDate],
    queryFn: () => getUsageReport(department!, startDate, endDate),
    enabled: !!department && reportType === 'usage',
  });

  const { data: consumption } = useQuery({
    queryKey: ['monthly-consumption', department, selectedItemId],
    queryFn: () => getMonthlyConsumption(department!, selectedItemId || undefined),
    enabled: !!department && reportType === 'consumption',
  });

  if (!department) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Department not found for your role.</p>
      </div>
    );
  }

  const handleExport = () => {
    // Placeholder for export functionality
    alert('Export functionality will be implemented');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Department Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view department reports</p>
        </div>
        <button onClick={handleExport} className="btn btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Report Type Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <button
              onClick={() => setReportType('summary')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                reportType === 'summary' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Monthly Summary
            </button>
            <button
              onClick={() => setReportType('usage')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                reportType === 'usage' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Usage Analysis
            </button>
            <button
              onClick={() => setReportType('consumption')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                reportType === 'consumption' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Monthly Consumption
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Report */}
      {reportType === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary?.totalItems || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{summary?.lowStockCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Today's Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary?.todayUsage || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary?.monthlyConsumption || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Analysis Report */}
      {reportType === 'usage' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {usageReport && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Usage by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(usageReport.usageByCategory).map(([name, value]) => ({ name, value }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(usageReport.usageByCategory).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Used Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={usageReport.topUsedItems.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="itemName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="quantity" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Usage Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Usage</p>
                      <p className="text-2xl font-bold">{usageReport.totalUsage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Logs</p>
                      <p className="text-2xl font-bold">{usageReport.totalLogs}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average per Log</p>
                      <p className="text-2xl font-bold">
                        {usageReport.totalLogs > 0 ? Math.round(usageReport.totalUsage / usageReport.totalLogs) : 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Monthly Consumption Report */}
      {reportType === 'consumption' && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Item (Optional)</label>
                <input
                  type="text"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  placeholder="Item ID (leave empty for all items)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          {consumption && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Consumption Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={consumption}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

