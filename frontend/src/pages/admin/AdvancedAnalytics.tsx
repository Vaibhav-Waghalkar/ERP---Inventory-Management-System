import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, PieChart, Activity, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getDepartmentComparison, getStockPredictions } from '../../services/analytics.service';
import { Department } from '../../types';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const departments: Department[] = [
  'COMPUTER_ENGINEERING',
  'CIVIL_ENGINEERING',
  'ELECTRICAL_ENGINEERING',
  'ELECTRONICS_TELECOMMUNICATION',
  'MECHANICAL_ENGINEERING',
];

export const AdvancedAnalytics = () => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | ''>('');

  const { data: comparison, isLoading: comparisonLoading } = useQuery({
    queryKey: ['department-comparison', period],
    queryFn: () => getDepartmentComparison(undefined, period),
  });

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['stock-predictions', selectedDepartment],
    queryFn: () => getStockPredictions(selectedDepartment as Department),
    enabled: !!selectedDepartment,
  });

  if (comparisonLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive analysis across all departments</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'week' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'month' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                period === 'year' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Year
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Department Comparison */}
      {comparison && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Department Usage Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="monthlyUsage" fill="#3b82f6" name="Usage" />
                  <Bar dataKey="totalItems" fill="#10b981" name="Total Items" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {comparison.map((dept) => (
              <Card key={dept.department}>
                <CardHeader>
                  <CardTitle className="text-lg">{dept.department.replace(/_/g, ' ')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-2xl font-bold">{dept.totalItems}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Usage</p>
                      <p className="text-2xl font-bold text-blue-600">{dept.monthlyUsage}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Low Stock Items</p>
                      <p className="text-2xl font-bold text-yellow-600">{dept.lowStockCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-semibold mt-2">Top Items</p>
                      <ul className="text-sm space-y-1">
                        {dept.topItems.slice(0, 3).map((item, idx) => (
                          <li key={idx} className="text-gray-700">
                            {item.itemName}: {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Stock Predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Stock Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Department for Predictions
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value as Department)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {predictionsLoading ? (
            <LoadingSpinner />
          ) : predictions && predictions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Item</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Current Stock</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Avg Monthly Usage</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Days Until Runout</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {predictions.map((pred) => (
                    <tr key={pred.itemId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{pred.itemName}</td>
                      <td className="py-3 px-4">{pred.currentStock}</td>
                      <td className="py-3 px-4">{pred.averageMonthlyUsage.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        {pred.daysUntilRunout !== null ? (
                          <span className={pred.daysUntilRunout < 30 ? 'text-red-600 font-semibold' : pred.daysUntilRunout < 60 ? 'text-yellow-600' : 'text-green-600'}>
                            {pred.daysUntilRunout} days
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          pred.recommendation.includes('URGENT') ? 'bg-red-100 text-red-800' :
                          pred.recommendation.includes('Order soon') ? 'bg-yellow-100 text-yellow-800' :
                          pred.recommendation.includes('Plan') ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {pred.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : selectedDepartment ? (
            <p className="text-center py-8 text-gray-500">No predictions available for this department</p>
          ) : (
            <p className="text-center py-8 text-gray-500">Select a department to view predictions</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

