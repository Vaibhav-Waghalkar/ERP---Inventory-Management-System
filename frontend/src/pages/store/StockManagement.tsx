import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, Edit, Package, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { stockService, itemService, categoryService } from '../../services/store.service';
import { Item, StoreStock } from '../../types';

type StockStatus = 'ALL' | 'GOOD' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';

export const StockManagement = () => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatus>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'lastUpdated'>('name');

  // Fetch data
  const { data: stocks, isLoading, error } = useQuery({
    queryKey: ['store-stock'],
    queryFn: () => stockService.getAll(),
  });

  const { data: items } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemService.getAll(),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load stock data" />;
  }

  // Combine stocks with item details
  const stockWithItems = stocks?.map((stock) => {
    const item = items?.find((i) => i.id === stock.itemId);
    return {
      ...stock,
      item,
      stockStatus: stock.stockStatus || getStockStatus(stock.quantity, item?.minStockLevel || 0),
    };
  }) || [];

  // Filter and sort
  let filteredStocks = stockWithItems;

  // Search filter
  if (search) {
    filteredStocks = filteredStocks.filter(
      (stock) =>
        stock.item?.name.toLowerCase().includes(search.toLowerCase()) ||
        stock.item?.category?.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Category filter
  if (categoryFilter) {
    filteredStocks = filteredStocks.filter(
      (stock) => stock.item?.categoryId === categoryFilter
    );
  }

  // Status filter
  if (statusFilter !== 'ALL') {
    filteredStocks = filteredStocks.filter(
      (stock) => stock.stockStatus === statusFilter
    );
  }

  // Sort
  filteredStocks = [...filteredStocks].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return (a.item?.name || '').localeCompare(b.item?.name || '');
      case 'quantity':
        return b.quantity - a.quantity;
      case 'lastUpdated':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      default:
        return 0;
    }
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      GOOD: 'bg-green-100 text-green-800',
      LOW: 'bg-yellow-100 text-yellow-800',
      CRITICAL: 'bg-red-100 text-red-800',
      OUT_OF_STOCK: 'bg-gray-100 text-gray-800',
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.GOOD
        }`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Stock Management</h1>
          <p className="text-gray-600 mt-1">View and manage inventory stock levels</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <Link to="/store/add-entry" className="btn btn-primary">
            Add Stock Entry
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full input pl-10"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StockStatus)}
              className="input"
            >
              <option value="ALL">All Status</option>
              <option value="GOOD">Good</option>
              <option value="LOW">Low</option>
              <option value="CRITICAL">Critical</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input"
            >
              <option value="name">Sort by Name</option>
              <option value="quantity">Sort by Quantity</option>
              <option value="lastUpdated">Sort by Last Updated</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Levels ({filteredStocks.length} items)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStocks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Item Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Current Stock</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Min Level</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map((stock) => (
                    <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{stock.item?.name}</div>
                        <div className="text-sm text-gray-500">{stock.item?.unit}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{stock.item?.category?.name}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-900">{stock.quantity}</span>
                        <span className="text-sm text-gray-500 ml-1">{stock.item?.unit}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{stock.item?.minStockLevel || 0}</td>
                      <td className="py-3 px-4">{getStatusBadge(stock.stockStatus || 'GOOD')}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/store/items/${stock.itemId}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Link>
                          <Link
                            to={`/store/items/${stock.itemId}/edit`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Link>
                          <Link
                            to={`/store/distribute?itemId=${stock.itemId}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Distribute"
                          >
                            <Package className="w-4 h-4 text-gray-600" />
                          </Link>
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
    </div>
  );
};

const getStockStatus = (quantity: number, minLevel: number): string => {
  if (quantity === 0) return 'OUT_OF_STOCK';
  if (quantity < minLevel * 0.5) return 'CRITICAL';
  if (quantity < minLevel) return 'LOW';
  return 'GOOD';
};

