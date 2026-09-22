import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { itemService, distributionService, stockService } from '../../services/store.service';
import { Department } from '../../types';
import { format } from 'date-fns';

const distributionSchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  quantity: z.number().min(1, 'Quantity must be greater than 0'),
  toDepartment: z.string().min(1, 'Department is required'),
  remarks: z.string().min(10, 'Purpose/Remarks must be at least 10 characters'),
  receivedDate: z.string().optional(),
});

type DistributionFormData = z.infer<typeof distributionSchema>;

interface DistributionItem {
  itemId: string;
  quantity: number;
  toDepartment: Department;
  remarks: string;
}

const departments: { value: Department; label: string }[] = [
  { value: 'COMPUTER_ENGINEERING', label: 'Computer Engineering' },
  { value: 'CIVIL_ENGINEERING', label: 'Civil Engineering' },
  { value: 'ELECTRICAL_ENGINEERING', label: 'Electrical Engineering' },
  { value: 'ELECTRONICS_TELECOMMUNICATION', label: 'Electronics & Telecommunication' },
  { value: 'MECHANICAL_ENGINEERING', label: 'Mechanical Engineering' },
];

export const DistributeItems = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<DistributionItem[]>([]);
  const [currentItem, setCurrentItem] = useState<DistributionItem>({
    itemId: searchParams.get('itemId') || '',
    quantity: 0,
    toDepartment: 'COMPUTER_ENGINEERING',
    remarks: '',
  });

  // Fetch data
  const { data: allItems } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemService.getAll(),
  });

  const { data: stock } = useQuery({
    queryKey: ['item-stock', currentItem.itemId],
    queryFn: () => stockService.getByItemId(currentItem.itemId),
    enabled: !!currentItem.itemId,
  });

  const selectedItem = allItems?.find((item) => item.id === currentItem.itemId);
  const availableStock = stock?.quantity || 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<DistributionFormData>({
    resolver: zodResolver(distributionSchema),
    defaultValues: {
      receivedDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const createDistributionMutation = useMutation({
    mutationFn: async (data: DistributionFormData) => {
      return distributionService.create({
        ...data,
        toDepartment: data.toDepartment as Department,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-stock'] });
      queryClient.invalidateQueries({ queryKey: ['distributions'] });
      navigate('/store/distributions');
    },
  });

  const addItemToList = () => {
    if (currentItem.itemId && currentItem.quantity > 0 && currentItem.remarks.length >= 10) {
      if (currentItem.quantity > availableStock) {
        alert(`Insufficient stock. Available: ${availableStock}`);
        return;
      }
      setItems([...items, { ...currentItem }]);
      setCurrentItem({
        itemId: '',
        quantity: 0,
        toDepartment: 'COMPUTER_ENGINEERING',
        remarks: '',
      });
      reset();
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const submitAll = async () => {
    if (items.length === 0) {
      alert('Please add at least one item to distribute');
      return;
    }

    try {
      // Distribute each item
      for (const item of items) {
        await distributionService.create({
          itemId: item.itemId,
          quantity: item.quantity,
          toDepartment: item.toDepartment,
          remarks: item.remarks,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['store-stock'] });
      queryClient.invalidateQueries({ queryKey: ['distributions'] });
      navigate('/store/distributions');
    } catch (error: any) {
      alert(error.message || 'Failed to distribute items');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/store"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-gray-900">Distribute Items</h1>
          <p className="text-gray-600 mt-1">Send items from store to departments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Item Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Item to Distribute</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Item Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Item <span className="text-red-500">*</span>
              </label>
              <select
                value={currentItem.itemId}
                onChange={(e) => {
                  setCurrentItem({ ...currentItem, itemId: e.target.value });
                  setValue('itemId', e.target.value);
                }}
                className="w-full input"
              >
                <option value="">Choose an item...</option>
                {allItems?.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category?.name})
                  </option>
                ))}
              </select>
              {selectedItem && (
                <p className="text-sm text-gray-500 mt-1">
                  Available stock: <span className="font-semibold">{availableStock}</span>{' '}
                  {selectedItem.unit}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={currentItem.quantity || ''}
                onChange={(e) => {
                  const qty = parseInt(e.target.value) || 0;
                  setCurrentItem({ ...currentItem, quantity: qty });
                  setValue('quantity', qty);
                }}
                className="w-full input"
                min="1"
                max={availableStock}
              />
              {currentItem.quantity > availableStock && (
                <p className="text-sm text-red-500 mt-1">
                  Quantity exceeds available stock ({availableStock})
                </p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Department <span className="text-red-500">*</span>
              </label>
              <select
                value={currentItem.toDepartment}
                onChange={(e) => {
                  setCurrentItem({
                    ...currentItem,
                    toDepartment: e.target.value as Department,
                  });
                  setValue('toDepartment', e.target.value);
                }}
                className="w-full input"
              >
                {departments.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Purpose/Remarks */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose/Remarks <span className="text-red-500">*</span>
              </label>
              <textarea
                value={currentItem.remarks}
                onChange={(e) => {
                  setCurrentItem({ ...currentItem, remarks: e.target.value });
                  setValue('remarks', e.target.value);
                }}
                className="w-full input"
                rows={3}
                placeholder="Enter purpose or remarks (min 10 characters)"
              />
              {currentItem.remarks.length > 0 && currentItem.remarks.length < 10 && (
                <p className="text-sm text-red-500 mt-1">
                  Must be at least 10 characters ({currentItem.remarks.length}/10)
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={addItemToList}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
              disabled={
                !currentItem.itemId ||
                currentItem.quantity <= 0 ||
                currentItem.remarks.length < 10 ||
                currentItem.quantity > availableStock
              }
            >
              <Plus className="w-4 h-4" />
              Add to List
            </button>
          </CardContent>
        </Card>

        {/* Distribution List */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution List ({items.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            {items.length > 0 ? (
              <div className="space-y-4">
                {items.map((item, index) => {
                  const itemData = allItems?.find((i) => i.id === item.itemId);
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{itemData?.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Quantity: {item.quantity} {itemData?.unit} →{' '}
                          {departments.find((d) => d.value === item.toDepartment)?.label}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{item.remarks}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={submitAll}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                  disabled={createDistributionMutation.isPending}
                >
                  {createDistributionMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Distributing...
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      Confirm Distribution
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No items added yet</p>
                <p className="text-sm mt-2">Add items from the form on the left</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

