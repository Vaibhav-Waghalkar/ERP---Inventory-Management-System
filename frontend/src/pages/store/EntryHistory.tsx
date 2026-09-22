import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Filter, Eye, Edit, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { storeEntryService, itemService, categoryService } from '../../services/store.service';
import { StoreEntry, StoreEntryFilters } from '../../types';
import { format } from 'date-fns';

const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace('/api', '');
};

export const EntryHistory = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<StoreEntryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<StoreEntry | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['store-entries', page, filters],
    queryFn: () => storeEntryService.getAll(page, 20, filters),
  });

  const { data: items } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemService.getAll(),
  });

  const handleFilterChange = (key: keyof StoreEntryFilters, value: any) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load entry history" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Stock Entry History</h1>
          <p className="text-gray-600 mt-1">View and manage all stock entries</p>
        </div>
        <Link to="/store/add-entry" className="btn btn-primary">
          Add New Entry
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
            {(filters.itemId || filters.vendorName || filters.billNumber || filters.dateFrom || filters.dateTo) && (
              <button onClick={clearFilters} className="text-sm text-primary hover:underline">
                Clear Filters
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                <select
                  value={filters.itemId || ''}
                  onChange={(e) => handleFilterChange('itemId', e.target.value || undefined)}
                  className="w-full input"
                >
                  <option value="">All Items</option>
                  {items?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name</label>
                <input
                  type="text"
                  value={filters.vendorName || ''}
                  onChange={(e) => handleFilterChange('vendorName', e.target.value || undefined)}
                  className="w-full input"
                  placeholder="Search vendor..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bill Number</label>
                <input
                  type="text"
                  value={filters.billNumber || ''}
                  onChange={(e) => handleFilterChange('billNumber', e.target.value || undefined)}
                  className="w-full input"
                  placeholder="Search bill..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                  className="w-full input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                  className="w-full input"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Entries ({data?.pagination.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.entries && data.entries.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantity</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Bill No.</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Vendor</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((entry) => (
                      <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {format(new Date(entry.billDate), 'dd MMM yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{entry.item?.name}</div>
                          <div className="text-sm text-gray-500">{entry.item?.category?.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          {entry.quantity} {entry.item?.unit}
                        </td>
                        <td className="py-3 px-4 text-gray-600">{entry.billNumber}</td>
                        <td className="py-3 px-4 text-gray-600">{entry.vendorName}</td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          ₹{Number(entry.billAmount).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedEntry(entry)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <Link
                              to={`/store/entries/${entry.id}/edit`}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </Link>
                            {entry.billImageUrl && (
                              <a
                                href={`${getApiBaseUrl()}${entry.billImageUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View Bill"
                              >
                                <FileText className="w-4 h-4 text-gray-600" />
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn btn-secondary"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
                      className="btn btn-secondary"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No entries found</p>
              <p className="text-sm mt-2">Try adjusting your filters or add a new entry</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-heading font-bold text-gray-900">Entry Details</h2>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Item</label>
                    <p className="text-gray-900">{selectedEntry.item?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-gray-900">{selectedEntry.item?.category?.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Quantity</label>
                    <p className="text-gray-900">
                      {selectedEntry.quantity} {selectedEntry.item?.unit}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bill Number</label>
                    <p className="text-gray-900">{selectedEntry.billNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bill Date</label>
                    <p className="text-gray-900">
                      {format(new Date(selectedEntry.billDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bill Amount</label>
                    <p className="text-gray-900 font-semibold">
                      ₹{Number(selectedEntry.billAmount).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vendor Name</label>
                    <p className="text-gray-900">{selectedEntry.vendorName}</p>
                  </div>
                  {selectedEntry.vendorContact && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vendor Contact</label>
                      <p className="text-gray-900">{selectedEntry.vendorContact}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Added By</label>
                    <p className="text-gray-900">{selectedEntry.addedBy?.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date Added</label>
                    <p className="text-gray-900">
                      {format(new Date(selectedEntry.createdAt), 'dd MMM yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {selectedEntry.remarks && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Remarks</label>
                    <p className="text-gray-900">{selectedEntry.remarks}</p>
                  </div>
                )}

                {selectedEntry.billImageUrl && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Bill Image</label>
                    <a
                      href={`${getApiBaseUrl()}${selectedEntry.billImageUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={`${getApiBaseUrl()}${selectedEntry.billImageUrl}`}
                        alt="Bill"
                        className="max-w-full h-auto rounded-lg border border-gray-200"
                      />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

