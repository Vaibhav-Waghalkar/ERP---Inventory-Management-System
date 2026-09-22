import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, TrendingUp, Package, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { reportService } from '../../services/store.service';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type ReportType = 'summary' | 'inward' | 'outward';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const Reports = () => {
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [dateFrom, setDateFrom] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: summaryReport, isLoading: summaryLoading } = useQuery({
    queryKey: ['stock-summary', dateFrom, dateTo],
    queryFn: () => reportService.getStockSummary(dateFrom, dateTo),
    enabled: reportType === 'summary',
  });

  const { data: inwardReport, isLoading: inwardLoading } = useQuery({
    queryKey: ['inward-report', dateFrom, dateTo],
    queryFn: () => reportService.getInwardReport(dateFrom, dateTo),
    enabled: reportType === 'inward',
  });

  const { data: outwardReport, isLoading: outwardLoading } = useQuery({
    queryKey: ['outward-report', dateFrom, dateTo],
    queryFn: () => reportService.getOutwardReport(dateFrom, dateTo),
    enabled: reportType === 'outward',
  });

  const isLoading = summaryLoading || inwardLoading || outwardLoading;

  const handleExport = (format: 'pdf' | 'excel') => {
    // Placeholder for export functionality
    alert(`Export to ${format.toUpperCase()} - Feature coming soon`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and view inventory reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Report Type:</label>
            <div className="flex gap-2">
              {[
                { value: 'summary', label: 'Stock Summary', icon: BarChart3 },
                { value: 'inward', label: 'Inward Report', icon: TrendingUp },
                { value: 'outward', label: 'Outward Report', icon: Package },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setReportType(value as ReportType)}
                  className={`btn ${reportType === value ? 'btn-primary' : 'btn-secondary'} flex items-center gap-2`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          {reportType === 'summary' && summaryReport && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{summaryReport.totalItems || 0}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      ₹{Number(summaryReport.totalValue || 0).toLocaleString('en-IN')}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Low Stock Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-warning">
                      {summaryReport.lowStockItems?.length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Category Chart */}
              {summaryReport.categorySummary && Object.keys(summaryReport.categorySummary).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Stock by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={Object.entries(summaryReport.categorySummary).map(([name, data]: [string, any]) => ({
                          name,
                          quantity: data.totalQuantity,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantity" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Department Distribution */}
              {summaryReport.departmentDistribution && Object.keys(summaryReport.departmentDistribution).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution by Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(summaryReport.departmentDistribution).map(([name, data]: [string, any]) => ({
                            name,
                            value: data.totalQuantity,
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.keys(summaryReport.departmentDistribution).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {reportType === 'inward' && inwardReport && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inward Report Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Entries</label>
                      <p className="text-2xl font-bold">{inwardReport.summary?.totalEntries || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Quantity</label>
                      <p className="text-2xl font-bold">{inwardReport.summary?.totalQuantity || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Amount</label>
                      <p className="text-2xl font-bold">
                        ₹{Number(inwardReport.summary?.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {inwardReport.entries && inwardReport.entries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-4">Date</th>
                            <th className="text-left py-2 px-4">Item</th>
                            <th className="text-left py-2 px-4">Quantity</th>
                            <th className="text-left py-2 px-4">Vendor</th>
                            <th className="text-left py-2 px-4">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inwardReport.entries.slice(0, 10).map((entry: any) => (
                            <tr key={entry.id} className="border-b border-gray-100">
                              <td className="py-2 px-4">{format(new Date(entry.billDate), 'dd MMM yyyy')}</td>
                              <td className="py-2 px-4">{entry.item?.name}</td>
                              <td className="py-2 px-4">{entry.quantity}</td>
                              <td className="py-2 px-4">{entry.vendorName}</td>
                              <td className="py-2 px-4">₹{Number(entry.billAmount).toLocaleString('en-IN')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {reportType === 'outward' && outwardReport && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Outward Report Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Distributions</label>
                      <p className="text-2xl font-bold">{outwardReport.summary?.totalDistributions || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Total Quantity</label>
                      <p className="text-2xl font-bold">{outwardReport.summary?.totalQuantity || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {outwardReport.distributions && outwardReport.distributions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Distributions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-4">Date</th>
                            <th className="text-left py-2 px-4">Item</th>
                            <th className="text-left py-2 px-4">Quantity</th>
                            <th className="text-left py-2 px-4">Department</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outwardReport.distributions.slice(0, 10).map((dist: any) => (
                            <tr key={dist.id} className="border-b border-gray-100">
                              <td className="py-2 px-4">{format(new Date(dist.receivedDate), 'dd MMM yyyy')}</td>
                              <td className="py-2 px-4">{dist.item?.name}</td>
                              <td className="py-2 px-4">{dist.quantity}</td>
                              <td className="py-2 px-4">{dist.toDepartment}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

