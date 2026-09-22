import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Edit, Trash2, UserCheck, UserX, X } from 'lucide-react';
import { userService } from '../services/user.service';
import { User, Role, Department } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const createUserSchema = z.object({
  email: z.string().email('Please enter a valid email address').optional(),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 8,
      'Password must be at least 8 characters'
    )
    .refine(
      (val) => !val || /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val),
      'Password must contain uppercase, lowercase, and number'
    ),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['SUPER_ADMIN', 'STORE_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL']),
  department: z.enum(['STORE', 'COMPUTER_ENGINEERING', 'CIVIL_ENGINEERING', 'ELECTRICAL_ENGINEERING', 'ELECTRONICS_TELECOMMUNICATION', 'MECHANICAL_ENGINEERING']).nullable().optional(),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

const roleOptions: { value: Role; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Administrator' },
  { value: 'STORE_ADMIN', label: 'Store Administrator' },
  { value: 'DEPT_ADMIN_COMPUTER', label: 'Computer Engineering Admin' },
  { value: 'DEPT_ADMIN_CIVIL', label: 'Civil Engineering Admin' },
  { value: 'DEPT_ADMIN_ELECTRICAL', label: 'Electrical Engineering Admin' },
  { value: 'DEPT_ADMIN_ELECTRONICS', label: 'Electronics & Telecommunication Admin' },
  { value: 'DEPT_ADMIN_MECHANICAL', label: 'Mechanical Engineering Admin' },
];

const departmentOptions: { value: Department; label: string }[] = [
  { value: 'STORE', label: 'Store' },
  { value: 'COMPUTER_ENGINEERING', label: 'Computer Engineering' },
  { value: 'CIVIL_ENGINEERING', label: 'Civil Engineering' },
  { value: 'ELECTRICAL_ENGINEERING', label: 'Electrical Engineering' },
  { value: 'ELECTRONICS_TELECOMMUNICATION', label: 'Electronics & Telecommunication' },
  { value: 'MECHANICAL_ENGINEERING', label: 'Mechanical Engineering' },
];

export const Users = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => userService.getAllUsers(page, 10, search),
  });

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsModalOpen(false);
      setEditingUser(null);
      reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: userService.toggleUserStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: 'STORE_ADMIN',
      department: null,
    },
  });

  const selectedRole = watch('role');

  const onSubmit = (data: CreateUserFormData) => {
    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        data: {
          fullName: data.fullName,
          role: data.role,
          department: data.department,
        },
      });
    } else {
      if (!data.email || !data.password) {
        alert('Email and password are required for new users');
        return;
      }
      createMutation.mutate({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        role: data.role,
        department: data.department,
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    reset({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      department: user.department,
      password: '', // Don't pre-fill password
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    reset({
      role: 'STORE_ADMIN',
      department: null,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
  };

  const getRoleDisplayName = (role: Role) => {
    return roleOptions.find((r) => r.value === role)?.label || role;
  };

  const getDepartmentDisplayName = (dept: Department | null) => {
    if (!dept) return 'N/A';
    return departmentOptions.find((d) => d.value === dept)?.label || dept;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-heading font-bold text-gray-900">User Management</h1>
        <button onClick={openCreateModal} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input pl-10"
        />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : error ? (
            <ErrorMessage message="Failed to load users. Please try again." />
          ) : !data || data.users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No users found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{user.fullName}</td>
                        <td className="py-3 px-4 text-gray-600">{user.email}</td>
                        <td className="py-3 px-4">{getRoleDisplayName(user.role)}</td>
                        <td className="py-3 px-4 text-gray-600">{getDepartmentDisplayName(user.department)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="p-2 text-primary hover:bg-primary/10 rounded"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(user.id)}
                              className={`p-2 rounded ${
                                user.isActive
                                  ? 'text-warning hover:bg-warning/10'
                                  : 'text-success hover:bg-success/10'
                              }`}
                              title={user.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {user.isActive ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                            {user.role !== 'SUPER_ADMIN' && (
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 text-danger hover:bg-danger/10 rounded"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.pagination.total)} of {data.pagination.total} users
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="btn btn-outline text-sm"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
                      className="btn btn-outline text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-heading font-semibold">
                {editingUser ? 'Edit User' : 'Create New User'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  {...register('email')}
                  className="input"
                  placeholder="user@rg-polytechnic.in"
                  disabled={!!editingUser}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-danger">{errors.email.message}</p>
                )}
                {editingUser && (
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                )}
              </div>
              {!editingUser && (
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    {...register('password')}
                    className="input"
                    placeholder="Enter password"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-danger">{errors.password.message}</p>
                  )}
                </div>
              )}
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  {...register('fullName')}
                  className="input"
                  placeholder="John Doe"
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-danger">{errors.fullName.message}</p>
                )}
              </div>
              <div>
                <label className="label">Role</label>
                <select {...register('role')} className="input">
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-danger">{errors.role.message}</p>
                )}
              </div>
              {(selectedRole?.startsWith('DEPT_ADMIN') || selectedRole === 'STORE_ADMIN') && (
                <div>
                  <label className="label">Department</label>
                  <select {...register('department')} className="input">
                    <option value="">Select Department</option>
                    {departmentOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : editingUser ? (
                    'Update User'
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

