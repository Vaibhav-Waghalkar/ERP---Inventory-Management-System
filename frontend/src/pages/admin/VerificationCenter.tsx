import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { verifyDepartmentStock, getIncomingItems } from '../../services/department.service';
import { Department } from '../../types';
import { format } from 'date-fns';

const departments: Department[] = [
  'COMPUTER_ENGINEERING',
  'CIVIL_ENGINEERING',
  'ELECTRICAL_ENGINEERING',
  'ELECTRONICS_TELECOMMUNICATION',
  'MECHANICAL_ENGINEERING',
];

export const VerificationCenter = () => {
  const [selectedDepartment, setSelectedDepartment] = useState<Department>(departments[0]);
  const [verificationType, setVerificationType] = useState<'stock' | 'distribution'>('stock');

  const { data: stockVerifications, isLoading: stockLoading, refetch: refetchStock } = useQuery({
    queryKey: ['stock-verification', selectedDepartment],
    queryFn: () => verifyDepartmentStock(selectedDepartment),
    enabled: verificationType === 'stock',
  });

  const { data: distributions, isLoading: distLoading } = useQuery({
    queryKey: ['incoming-items', selectedDepartment],
    queryFn: () => getIncomingItems(selectedDepartment),
    enabled: verificationType === 'distribution',
  });

  const handleVerifyAll = async () => {
    // Trigger verification for all departments
    alert('Running verification for all departments...');
  };

  const mismatches = stockVerifications?.filter((v) => !v.isMatch) || [];
  const matches = stockVerifications?.filter((v) => v.isMatch) || [];

  const distributionMismatches = distributions?.filter((d) => {
    if (!d.isConfirmed) return false;
    return d.receivedQuantity !== undefined && d.receivedQuantity !== d.quantity;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Verification Center</h1>
          <p className="text-gray-600 mt-1">Verify data consistency across store and departments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleVerifyAll} className="btn btn-primary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Verify All
          </button>
          <button className="btn btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value as Department)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Verification Type</label>
              <select
                value={verificationType}
                onChange={(e) => setVerificationType(e.target.value as 'stock' | 'distribution')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="stock">Stock Balance Verification</option>
                <option value="distribution">Distribution vs Receipt Match</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Balance Verification */}
      {verificationType === 'stock' && (
        <>
          {stockLoading ? (
            <LoadingSpinner />
          ) : stockVerifications ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stockVerifications.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Matches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">{matches.length}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      Mismatches
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">{mismatches.length}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Mismatches Table */}
              {mismatches.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Stock Discrepancies ({mismatches.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="py-3 px-4 text-left text-sm font-semibold">Item</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold">Expected Stock</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold">Actual Stock</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold">Discrepancy</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mismatches.map((item) => (
                            <tr key={item.itemId} className="border-b hover:bg-red-50">
                              <td className="py-3 px-4 font-medium">{item.itemName}</td>
                              <td className="py-3 px-4">{item.expectedStock}</td>
                              <td className="py-3 px-4">{item.actualStock}</td>
                              <td className="py-3 px-4">
                                <span className={`font-semibold ${
                                  item.discrepancy > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                  Requires Review
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Verifications Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Stock Verifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3 px-4 text-left text-sm font-semibold">Item</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold">Expected</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold">Actual</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockVerifications.map((item) => (
                          <tr key={item.itemId} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{item.itemName}</td>
                            <td className="py-3 px-4">{item.expectedStock}</td>
                            <td className="py-3 px-4">{item.actualStock}</td>
                            <td className="py-3 px-4">
                              {item.isMatch ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  Match
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-600">
                                  <XCircle className="w-4 h-4" />
                                  Mismatch
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <ErrorMessage message="Failed to load verification data" />
          )}
        </>
      )}

      {/* Distribution vs Receipt Match */}
      {verificationType === 'distribution' && (
        <>
          {distLoading ? (
            <LoadingSpinner />
          ) : distributions ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Distribution vs Receipt Matching</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-3 px-4 text-left text-sm font-semibold">Date</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold">Item</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold">Sent by Store</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold">Received by Dept</th>
                          <th className="py-3 px-4 text-left text-sm font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {distributions.map((dist) => {
                          const isMatch = dist.isConfirmed
                            ? dist.receivedQuantity === undefined || dist.receivedQuantity === dist.quantity
                            : null;
                          return (
                            <tr key={dist.id} className="border-b hover:bg-gray-50">
                              <td className="py-3 px-4">{format(new Date(dist.receivedDate), 'dd MMM yyyy')}</td>
                              <td className="py-3 px-4">
                                <div className="font-medium">{dist.item.name}</div>
                                <div className="text-sm text-gray-500">{dist.item.category?.name}</div>
                              </td>
                              <td className="py-3 px-4">{dist.quantity}</td>
                              <td className="py-3 px-4">
                                {dist.isConfirmed ? (
                                  <span className={dist.receivedQuantity !== dist.quantity ? 'text-orange-600 font-semibold' : ''}>
                                    {dist.receivedQuantity || dist.quantity}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">Pending</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {dist.isConfirmed ? (
                                  isMatch ? (
                                    <span className="flex items-center gap-1 text-green-600">
                                      <CheckCircle className="w-4 h-4" />
                                      Match
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1 text-red-600">
                                      <XCircle className="w-4 h-4" />
                                      Mismatch
                                    </span>
                                  )
                                ) : (
                                  <span className="flex items-center gap-1 text-yellow-600">
                                    <AlertTriangle className="w-4 h-4" />
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <ErrorMessage message="Failed to load distribution data" />
          )}
        </>
      )}
    </div>
  );
};

