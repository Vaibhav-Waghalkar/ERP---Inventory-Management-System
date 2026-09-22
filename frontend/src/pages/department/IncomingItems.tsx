import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { CheckCircle, Clock, Package, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getIncomingItems, confirmReceipt } from '../../services/department.service';
import { Department } from '../../types';
import { format } from 'date-fns';

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

export const IncomingItems = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const department = user?.role ? getDepartmentFromRole(user.role) : null;

  const [selectedDistribution, setSelectedDistribution] = useState<string | null>(null);
  const [receivedQuantity, setReceivedQuantity] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: incomingItems, isLoading, error } = useQuery({
    queryKey: ['incoming-items', department],
    queryFn: () => getIncomingItems(department!),
    enabled: !!department,
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      confirmReceipt(department!, id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incoming-items', department] });
      queryClient.invalidateQueries({ queryKey: ['department-stock', department] });
      setShowConfirmModal(false);
      setSelectedDistribution(null);
      setReceivedQuantity(0);
    },
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
    return <ErrorMessage message="Failed to load incoming items" />;
  }

  const pendingItems = incomingItems?.filter((item) => !item.isConfirmed) || [];
  const confirmedItems = incomingItems?.filter((item) => item.isConfirmed) || [];

  const handleConfirm = (item: any) => {
    setSelectedDistribution(item.id);
    setReceivedQuantity(item.quantity);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    if (receivedQuantity < 0) {
      alert('Received quantity cannot be negative');
      return;
    }
    confirmMutation.mutate({
      id: selectedDistribution!,
      quantity: receivedQuantity,
    });
  };

  const selectedItem = incomingItems?.find((item) => item.id === selectedDistribution);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Incoming Items</h1>
          <p className="text-gray-600 mt-1">Track and confirm items received from store</p>
        </div>
      </div>

      {/* Pending Items */}
      {pendingItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Pending Confirmations ({pendingItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Package className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-900">{item.item.name}</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Quantity Sent</p>
                          <p className="font-semibold">{item.quantity} {item.item.category?.name || ''}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">From Store</p>
                          <p className="font-semibold">{item.distributedBy.fullName}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Received Date</p>
                          <p className="font-semibold">{format(new Date(item.receivedDate), 'dd MMM yyyy')}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Category</p>
                          <p className="font-semibold">{item.item.category?.name || 'N/A'}</p>
                        </div>
                      </div>
                      {item.remarks && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">Remarks: {item.remarks}</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleConfirm(item)}
                      className="btn btn-primary ml-4"
                    >
                      Confirm Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Confirmed Receipts ({confirmedItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {confirmedItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Item</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Sent</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Received</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">From Store</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {confirmedItems.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{format(new Date(item.receivedDate), 'dd MMM yyyy')}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{item.item.name}</div>
                        <div className="text-sm text-gray-500">{item.item.category?.name || ''}</div>
                      </td>
                      <td className="py-3 px-4">{item.quantity}</td>
                      <td className="py-3 px-4">
                        <span className={item.receivedQuantity !== item.quantity ? 'text-orange-600 font-semibold' : ''}>
                          {item.receivedQuantity || item.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{item.distributedBy.fullName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No confirmed receipts yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Receipt Modal */}
      {showConfirmModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-heading font-bold mb-4">Confirm Receipt</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Item</p>
                <p className="font-semibold">{selectedItem.item.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Quantity Sent by Store</p>
                <p className="font-semibold">{selectedItem.quantity} {selectedItem.item.category?.name || ''}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actually Received Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedItem.quantity * 2}
                  value={receivedQuantity}
                  onChange={(e) => setReceivedQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
                {receivedQuantity !== selectedItem.quantity && (
                  <p className="text-xs text-orange-600 mt-1">
                    Mismatch detected. Please verify the quantity.
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleConfirmSubmit}
                  disabled={confirmMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {confirmMutation.isPending ? 'Confirming...' : 'Confirm Receipt'}
                </button>
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setSelectedDistribution(null);
                    setReceivedQuantity(0);
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

