import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { Search, Filter, Eye, Edit, Trash2, Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getUsageLogs, updateUsageLog, deleteUsageLog, getUsageLogById } from '../../services/department.service';
import { Department, UsageCategory, UsageLog } from '../../types';
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

const usageCategories: { value: UsageCategory; label: string }[] = [
  { value: 'TEACHING_CLASSROOM', label: 'Teaching/Classroom' },
  { value: 'LAB_EXPERIMENT', label: 'Lab Experiment' },
  { value: 'STUDENT_DISTRIBUTION', label: 'Student Distribution' },
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
  { value: 'MAINTENANCE_REPAIRS', label: 'Maintenance/Repairs' },
  { value: 'EVENTS_ACTIVITIES', label: 'Events/Activities' },
  { value: 'OTHER', label: 'Other' },
];

export const UsageHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const department = user?.role ? getDepartmentFromRole(user.role) : null;

  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [itemFilter, setItemFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<UsageCategory | ''>('');
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editData, setEditData] = useState({ quantityUsed: 0, category: 'OTHER' as UsageCategory, purpose: '', reason: '' });
  const [deleteReason, setDeleteReason] = useState('');

  const { data: logs, isLoading, error } = useQuery({
    queryKey: ['usage-logs', department, startDate, endDate, itemFilter, categoryFilter],
    queryFn: () => getUsageLogs(department!, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      itemId: itemFilter || undefined,
      category: categoryFilter || undefined,
    }),
    enabled: !!department,
  });

  const { data: logDetails } = useQuery({
    queryKey: ['usage-log', department, selectedLog],
    queryFn: () => getUsageLogById(department!, selectedLog!),
    enabled: !!selectedLog && !!department,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateUsageLog(department!, id, data, editData.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-logs', department] });
      queryClient.invalidateQueries({ queryKey: ['department-stock', department] });
      setShowEditModal(false);
      setEditData({ quantityUsed: 0, category: 'OTHER', purpose: '', reason: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => deleteUsageLog(department!, id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-logs', department] });
      queryClient.invalidateQueries({ queryKey: ['department-stock', department] });
      setShowDeleteModal(false);
      setDeleteReason('');
      setSelectedLog(null);
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
    return <ErrorMessage message="Failed to load usage history" />;
  }

  const handleEdit = (log: UsageLog) => {
    setSelectedLog(log.id);
    setEditData({
      quantityUsed: log.quantityUsed,
      category: log.category,
      purpose: log.purpose,
      reason: '',
    });
    setShowEditModal(true);
  };

  const handleDelete = (log: UsageLog) => {
    setSelectedLog(log.id);
    setDeleteReason('');
    setShowDeleteModal(true);
  };

  const handleEditSubmit = () => {
    if (editData.reason.length < 20) {
      alert('Please provide a reason (minimum 20 characters)');
      return;
    }
    if (editData.purpose.length < 10) {
      alert('Purpose must be at least 10 characters');
      return;
    }
    if (editData.quantityUsed <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    updateMutation.mutate({
      id: selectedLog!,
      data: {
        quantityUsed: editData.quantityUsed,
        category: editData.category,
        purpose: editData.purpose,
      },
    });
  };

  const handleDeleteSubmit = () => {
    if (deleteReason.length < 20) {
      alert('Please provide a reason (minimum 20 characters)');
      return;
    }
    deleteMutation.mutate({ id: selectedLog!, reason: deleteReason });
  };

  const uniqueItems = Array.from(new Set(logs?.map((log) => log.item.name) || []));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Usage History</h1>
          <p className="text-gray-600 mt-1">View and manage usage logs</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <select
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">All Items</option>
                {uniqueItems.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as UsageCategory | '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              >
                <option value="">All Categories</option>
                {usageCategories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Logs ({logs?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Item</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Quantity</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Purpose</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Logged By</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">{format(new Date(log.usageDate), 'dd MMM yyyy')}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{log.item.name}</div>
                        <div className="text-sm text-gray-500">{usageCategories.find(c => c.value === log.category)?.label}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">{log.quantityUsed}</span>
                        <span className="text-sm text-gray-500 ml-1">{log.item.category?.name || ''}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs truncate" title={log.purpose}>
                          {log.purpose}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{log.usedBy.fullName}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedLog(log.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleEdit(log)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(log)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No usage logs found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Modal */}
      {selectedLog && logDetails && !showEditModal && !showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-heading font-bold text-gray-900">Usage Log Details</h2>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Item</p>
                <p className="font-semibold">{logDetails.item.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Quantity Used</p>
                <p className="font-semibold">{logDetails.quantityUsed} {logDetails.item.category?.name || ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Usage Date</p>
                <p className="font-semibold">{format(new Date(logDetails.usageDate), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Category</p>
                <p className="font-semibold">{usageCategories.find(c => c.value === logDetails.category)?.label}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Purpose</p>
                <p className="font-semibold">{logDetails.purpose}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Logged By</p>
                <p className="font-semibold">{logDetails.usedBy.fullName} ({logDetails.usedBy.email})</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Created At</p>
                <p className="font-semibold">{format(new Date(logDetails.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
              </div>
              {logDetails.editLogs && logDetails.editLogs.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Edit History</p>
                  <div className="border rounded-lg p-3 space-y-2">
                    {logDetails.editLogs.map((edit) => (
                      <div key={edit.id} className="text-sm">
                        <p className="font-medium">{edit.editedBy.fullName} - {format(new Date(edit.editedAt), 'dd MMM yyyy, hh:mm a')}</p>
                        <p className="text-gray-600">{edit.fieldName}: {edit.oldValue} → {edit.newValue}</p>
                        {edit.reason && <p className="text-gray-500 italic">Reason: {edit.reason}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedLog && logDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-heading font-bold mb-4">Edit Usage Log</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Used</label>
                <input
                  type="number"
                  min="1"
                  value={editData.quantityUsed}
                  onChange={(e) => setEditData({ ...editData, quantityUsed: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={editData.category}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value as UsageCategory })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                >
                  {usageCategories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                <textarea
                  value={editData.purpose}
                  onChange={(e) => setEditData({ ...editData, purpose: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-gray-500 mt-1">{editData.purpose.length}/10 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Edit (min 20 characters)
                </label>
                <textarea
                  value={editData.reason}
                  onChange={(e) => setEditData({ ...editData, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  placeholder="Explain why you are editing this usage log..."
                />
                <p className="text-xs text-gray-500 mt-1">{editData.reason.length}/20 characters</p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleEditSubmit} disabled={updateMutation.isPending} className="btn btn-primary flex-1">
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setShowEditModal(false)} className="btn btn-outline flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-heading font-bold mb-4 text-red-600">Delete Usage Log</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this usage log? This will restore the stock quantity.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Deletion (min 20 characters)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Explain why you are deleting this usage log..."
              />
              <p className="text-xs text-gray-500 mt-1">{deleteReason.length}/20 characters</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleDeleteSubmit}
                disabled={deleteReason.length < 20 || deleteMutation.isPending}
                className="btn btn-danger flex-1"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-outline flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

