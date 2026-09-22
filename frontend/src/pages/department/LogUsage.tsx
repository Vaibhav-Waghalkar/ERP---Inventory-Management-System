import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Calendar, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { getDepartmentStock, createBulkUsageLogs } from '../../services/department.service';
import { itemService } from '../../services/store.service';
import { Department, UsageCategory, CreateUsageLogData } from '../../types';
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

interface UsageItem {
  itemId: string;
  itemName: string;
  availableStock: number;
  quantityUsed: number;
  category: UsageCategory;
  purpose: string;
}

export const LogUsage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const department = user?.role ? getDepartmentFromRole(user.role) : null;

  const [usageDate, setUsageDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [usageItems, setUsageItems] = useState<UsageItem[]>([]);

  const { data: departmentStock, isLoading: stockLoading } = useQuery({
    queryKey: ['department-stock', department],
    queryFn: () => getDepartmentStock(department!),
    enabled: !!department,
  });

  const { data: allItems } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (logs: CreateUsageLogData[]) => createBulkUsageLogs(department!, logs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['department-stock', department] });
      queryClient.invalidateQueries({ queryKey: ['usage-logs', department] });
      alert('Usage logged successfully!');
      navigate('/department/usage-history');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error || 'Failed to log usage');
    },
  });

  if (!department) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Department not found for your role.</p>
      </div>
    );
  }

  if (stockLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const addItem = () => {
    setUsageItems([
      ...usageItems,
      {
        itemId: '',
        itemName: '',
        availableStock: 0,
        quantityUsed: 0,
        category: 'OTHER',
        purpose: '',
      },
    ]);
  };

  const removeItem = (index: number) => {
    setUsageItems(usageItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof UsageItem, value: any) => {
    const updated = [...usageItems];
    updated[index] = { ...updated[index], [field]: value };

    // If itemId changed, update itemName and availableStock
    if (field === 'itemId') {
      const stockItem = departmentStock?.find((s) => s.itemId === value);
      if (stockItem) {
        updated[index].itemName = stockItem.itemName;
        updated[index].availableStock = stockItem.currentStock;
      }
    }

    setUsageItems(updated);
  };

  const handleSubmit = () => {
    // Validate
    for (const item of usageItems) {
      if (!item.itemId) {
        alert('Please select an item for all entries');
        return;
      }
      if (item.quantityUsed <= 0) {
        alert('Quantity must be greater than 0');
        return;
      }
      if (item.quantityUsed > item.availableStock) {
        alert(`Insufficient stock for ${item.itemName}. Available: ${item.availableStock}`);
        return;
      }
      if (item.purpose.length < 10) {
        alert(`Purpose must be at least 10 characters for ${item.itemName}`);
        return;
      }
    }

    if (usageItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    if (new Date(usageDate) > new Date()) {
      alert('Usage date cannot be in the future');
      return;
    }

    // Convert to API format
    const logs: CreateUsageLogData[] = usageItems.map((item) => ({
      itemId: item.itemId,
      quantityUsed: item.quantityUsed,
      usageDate: new Date(usageDate).toISOString(),
      category: item.category,
      purpose: item.purpose,
    }));

    createMutation.mutate(logs);
  };

  const availableItems = departmentStock?.filter((stock) => stock.currentStock > 0) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Log Daily Usage</h1>
          <p className="text-gray-600 mt-1">Record items used by the department</p>
        </div>
      </div>

      {/* Usage Date */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Date
              </label>
              <input
                type="date"
                value={usageDate}
                max={format(new Date(), 'yyyy-MM-dd')}
                onChange={(e) => setUsageDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Items */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Items Used</CardTitle>
          <button onClick={addItem} className="btn btn-primary btn-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </CardHeader>
        <CardContent>
          {usageItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No items added yet</p>
              <button onClick={addItem} className="btn btn-primary mt-4">
                Add First Item
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {usageItems.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Item #{index + 1}</h3>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Item *
                      </label>
                      <select
                        value={item.itemId}
                        onChange={(e) => updateItem(index, 'itemId', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      >
                        <option value="">-- Select Item --</option>
                        {availableItems.map((stock) => (
                          <option key={stock.itemId} value={stock.itemId}>
                            {stock.itemName} (Available: {stock.currentStock} {stock.unit})
                          </option>
                        ))}
                      </select>
                      {item.itemId && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available Stock: {item.availableStock} {departmentStock?.find(s => s.itemId === item.itemId)?.unit}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity Used *
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={item.availableStock}
                        value={item.quantityUsed || ''}
                        onChange={(e) => updateItem(index, 'quantityUsed', parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="Enter quantity"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose/Category *
                      </label>
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(index, 'category', e.target.value)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Detailed Description * (min 10 characters)
                      </label>
                      <textarea
                        value={item.purpose}
                        onChange={(e) => updateItem(index, 'purpose', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="Describe how this item was used..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {item.purpose.length}/10 characters
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {usageItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-600">
                Total Items: <span className="font-semibold">{usageItems.length}</span>
              </p>
              <p className="text-gray-600">
                Total Quantity: <span className="font-semibold">
                  {usageItems.reduce((sum, item) => sum + item.quantityUsed, 0)}
                </span>
              </p>
              <p className="text-gray-600">
                Usage Date: <span className="font-semibold">{format(new Date(usageDate), 'dd MMM yyyy')}</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleSubmit}
          disabled={usageItems.length === 0 || createMutation.isPending}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {createMutation.isPending ? 'Saving...' : 'Save Usage Log'}
        </button>
        <button
          onClick={() => navigate('/department')}
          className="btn btn-outline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

