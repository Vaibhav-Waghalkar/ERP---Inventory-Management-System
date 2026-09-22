import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { itemService, storeEntryService, categoryService } from '../../services/store.service';
import { format } from 'date-fns';

const storeEntrySchema = z.object({
  itemId: z.string().min(1, 'Item is required'),
  quantity: z.number().min(1, 'Quantity must be greater than 0'),
  billNumber: z.string().min(1, 'Bill number is required'),
  billDate: z.string().min(1, 'Bill date is required'),
  billAmount: z.number().min(0, 'Bill amount must be non-negative'),
  vendorName: z.string().min(3, 'Vendor name must be at least 3 characters').max(100),
  vendorContact: z.string().optional(),
  remarks: z.string().optional(),
});

type StoreEntryFormData = z.infer<typeof storeEntrySchema>;

export const AddStockEntry = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [billImage, setBillImage] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>('');

  // Fetch categories and items
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
  });

  const { data: items } = useQuery({
    queryKey: ['items'],
    queryFn: () => itemService.getAll(),
  });

  // Get selected item details
  const selectedItemData = items?.find((item) => item.id === selectedItem);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StoreEntryFormData>({
    resolver: zodResolver(storeEntrySchema),
    defaultValues: {
      billDate: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: StoreEntryFormData) => {
      return storeEntryService.create({
        ...data,
        billImage: billImage || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-stock'] });
      queryClient.invalidateQueries({ queryKey: ['recent-entries'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      navigate('/store/entries');
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setBillImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setBillImage(null);
    setBillPreview(null);
  };

  const onSubmit = (data: StoreEntryFormData) => {
    createEntryMutation.mutate(data);
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
          <h1 className="text-3xl font-heading font-bold text-gray-900">Add Stock Entry</h1>
          <p className="text-gray-600 mt-1">Record new inventory with bill details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Item Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Item <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('itemId')}
                    value={selectedItem}
                    onChange={(e) => {
                      setSelectedItem(e.target.value);
                      setValue('itemId', e.target.value);
                    }}
                    className="w-full input"
                  >
                    <option value="">Choose an item...</option>
                    {items?.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.category?.name}) - {item.unit}
                      </option>
                    ))}
                  </select>
                  {errors.itemId && (
                    <p className="text-sm text-red-500 mt-1">{errors.itemId.message}</p>
                  )}
                  {selectedItemData && (
                    <p className="text-sm text-gray-500 mt-1">
                      Current stock: {selectedItemData.currentStock || 0} {selectedItemData.unit}
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
                    {...register('quantity', { valueAsNumber: true })}
                    className="w-full input"
                    min="1"
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-500 mt-1">{errors.quantity.message}</p>
                  )}
                  {selectedItemData && (
                    <p className="text-sm text-gray-500 mt-1">
                      Unit: {selectedItemData.unit}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bill Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Bill Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('billNumber')}
                    className="w-full input"
                    placeholder="Enter bill number"
                  />
                  {errors.billNumber && (
                    <p className="text-sm text-red-500 mt-1">{errors.billNumber.message}</p>
                  )}
                </div>

                {/* Bill Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('billDate')}
                    className="w-full input"
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                  {errors.billDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.billDate.message}</p>
                  )}
                </div>

                {/* Bill Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bill Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('billAmount', { valueAsNumber: true })}
                    className="w-full input"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  {errors.billAmount && (
                    <p className="text-sm text-red-500 mt-1">{errors.billAmount.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vendor Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('vendorName')}
                    className="w-full input"
                    placeholder="Enter vendor name"
                  />
                  {errors.vendorName && (
                    <p className="text-sm text-red-500 mt-1">{errors.vendorName.message}</p>
                  )}
                </div>

                {/* Vendor Contact */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor Contact
                  </label>
                  <input
                    type="tel"
                    {...register('vendorContact')}
                    className="w-full input"
                    placeholder="Enter contact number"
                  />
                  {errors.vendorContact && (
                    <p className="text-sm text-red-500 mt-1">{errors.vendorContact.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bill Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!billPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <label className="cursor-pointer">
                      <span className="text-primary hover:underline">Click to upload</span> or drag and drop
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      JPG, PNG or PDF (Max 5MB)
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="border border-gray-300 rounded-lg p-4">
                      {billImage?.type.startsWith('image/') ? (
                        <img
                          src={billPreview}
                          alt="Bill preview"
                          className="max-w-full h-auto rounded-lg"
                        />
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-600">PDF File: {billImage?.name}</p>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    {...register('remarks')}
                    className="w-full input"
                    rows={4}
                    placeholder="Any additional notes..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Link to="/store" className="btn btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createEntryMutation.isPending}
          >
            {createEntryMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                Saving...
              </>
            ) : (
              'Save Entry'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

