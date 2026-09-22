import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Search, Filter, Eye, RefreshCw, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getDepartmentStock, getDepartmentStockItem, reconcileDepartmentStock } from '../../services/department.service';
import { Department, DepartmentStockItem } from '../../types';
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

type StockStatus = 'ALL' | 'GOOD' | 'LOW' | 'OUT';

export const DepartmentStock = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const department = user?.role ? getDepartmentFromRole(user.role) : null;

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'currentStock' | 'lastUpdated'>('name');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [reconcileData, setReconcileData] = useState({ newQuantity: 0, reason: '' });

  const { data: stocks, isLoading, error } = useQuery({
    queryKey: ['department-stock', department],
    queryFn: () => getDepartmentStock(department!),
    enabled: !!department,
  });

  const { data: itemDetails } = useQuery({
    queryKey: ['department-stock-item', department, selectedItem],
    queryFn: () => getDepartmentStockItem(department!, selectedItem!),
    enabled: !!selectedItem && !!department,
  });

  const reconcileMutation = useMutation({
    mutationFn: ({ itemId, newQuantity, reason }: { itemId: string; newQuantity: number; reason: string }) =>
      reconcileDepartmentStock(department!, itemId, newQuantity, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-stock', department] });
      setShowReconcileModal(false);
      setReconcileData({ newQuantity: 0, reason: '' });
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
    return <ErrorMessage message="Failed to load department stock" />;
  }

  // Filter and sort
  let filteredStocks = stocks || [];

  if (search) {
    filteredStocks = filteredStocks.filter(
      (stock) =>
        stock.itemName.toLowerCase().includes(search.toLowerCase()) ||
        stock.category.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (categoryFilter) {
    filteredStocks = filteredStocks.filter((stock) => stock.category === categoryFilter);
  }

  if (statusFilter !== 'ALL') {
    filteredStocks = filteredStocks.filter((stock) => stock.status === statusFilter);
  }

  filteredStocks = [...filteredStocks].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.itemName.localeCompare(b.itemName);
      case 'currentStock':
        return b.currentStock - a.currentStock;
      case 'lastUpdated':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      default:
        return 0;
    }
  });

  const categories = Array.from(new Set(stocks?.map((s) => s.category) || []));

  const getStatusBadge = (status: string) => {
    const styles = {
      GOOD: 'bg-green-100 text-green-800',
      LOW: 'bg-yellow-100 text-yellow-800',
      OUT: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.GOOD}`}>
        {status}
      </span>
    );
  };

  const handleReconcile = (item: DepartmentStockItem) => {
    setReconcileData({ newQuantity: item.currentStock, reason: '' });
    setSelectedItem(item.itemId);
    setShowReconcileModal(true);
  };

  const handleReconcileSubmit = () => {
    if (!selectedItem || reconcileData.reason.length < 20) {
      alert('Please provide a reason (minimum 20 characters)');
      return;
    }
    reconcileMutation.mutate({
      itemId: selectedItem,
      newQuantity: reconcileData.newQuantity,
      reason: reconcileData.reason,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Department Stock</h1>
          <p className="text-gray-600 mt-1">View and manage department inventory</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StockStatus)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="GOOD">Good</option>
              <option value="LOW">Low Stock</option>
              <option value="OUT">Out of Stock</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="name">Sort by Name</option>
              <option value="currentStock">Sort by Stock</option>
              <option value="lastUpdated">Sort by Updated</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Items ({filteredStocks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStocks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Item Name</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Current Stock</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Received (Month)</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Used (Month)</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => (
                    <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{stock.itemName}</div>
                        <div className="text-sm text-gray-500">{stock.unit}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{stock.category}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">{stock.currentStock}</span>
                        <span className="text-sm text-gray-500 ml-1">{stock.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{stock.receivedThisMonth}</td>
                      <td className="py-3 px-4 text-gray-600">{stock.usedThisMonth}</td>
                      <td className="py-3 px-4">{getStatusBadge(stock.status)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedItem(stock.itemId)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleReconcile(stock)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Physical Count / Reconcile"
                          >
                            <RefreshCw className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No items found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Details Modal */}
      {selectedItem && itemDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-heading font-bold text-gray-900">
                  {itemDetails.stock.item.name} - Details
                </h2>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Current Stock</p>
                  <p className="text-lg font-semibold">{itemDetails.stock.quantity} {itemDetails.stock.item.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expected Stock</p>
                  <p className="text-lg font-semibold">{itemDetails.expectedStock} {itemDetails.stock.item.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Discrepancy</p>
                  <p className={`text-lg font-semibold ${itemDetails.discrepancy !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {itemDetails.discrepancy > 0 ? '+' : ''}{itemDetails.discrepancy} {itemDetails.stock.item.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="text-lg font-semibold">{itemDetails.stock.item.category.name}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-2">Distribution History</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left text-sm font-semibold">Date</th>
                        <th className="py-2 px-4 text-left text-sm font-semibold">Quantity</th>
                        <th className="py-2 px-4 text-left text-sm font-semibold">Distributed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemDetails.distributions.map((dist) => (
                        <tr key={dist.id} className="border-t">
                          <td className="py-2 px-4">{format(new Date(dist.receivedDate), 'dd MMM yyyy')}</td>
                          <td className="py-2 px-4">{dist.quantity}</td>
                          <td className="py-2 px-4">{dist.distributedBy.fullName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recent Usage History</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 text-left text-sm font-semibold">Date</th>
                        <th className="py-2 px-4 text-left text-sm font-semibold">Quantity</th>
                        <th className="py-2 px-4 text-left text-sm font-semibold">Purpose</th>
                        <th className="py-2 px-4 text-left text-sm font-semibold">Used By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemDetails.usageLogs.slice(0, 10).map((log) => (
                        <tr key={log.id} className="border-t">
                          <td className="py-2 px-4">{format(new Date(log.usageDate), 'dd MMM yyyy')}</td>
                          <td className="py-2 px-4">{log.quantityUsed}</td>
                          <td className="py-2 px-4 text-sm">{log.purpose.substring(0, 50)}...</td>
                          <td className="py-2 px-4">{log.usedBy.fullName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {showReconcileModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-heading font-bold mb-4">Physical Count / Reconcile Stock</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={reconcileData.newQuantity}
                  onChange={(e) => setReconcileData({ ...reconcileData, newQuantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Reconciliation (min 20 characters)
                </label>
                <textarea
                  value={reconcileData.reason}
                  onChange={(e) => setReconcileData({ ...reconcileData, reason: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Explain why you are adjusting the stock quantity..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {reconcileData.reason.length}/20 characters
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleReconcileSubmit}
                  disabled={reconcileData.reason.length < 20 || reconcileMutation.isPending}
                  className="btn btn-primary flex-1"
                >
                  {reconcileMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setShowReconcileModal(false);
                    setReconcileData({ newQuantity: 0, reason: '' });
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

