export type Role =
  | 'SUPER_ADMIN'
  | 'STORE_ADMIN'
  | 'DEPT_ADMIN_COMPUTER'
  | 'DEPT_ADMIN_CIVIL'
  | 'DEPT_ADMIN_ELECTRICAL'
  | 'DEPT_ADMIN_ELECTRONICS'
  | 'DEPT_ADMIN_MECHANICAL';

export type Department =
  | 'STORE'
  | 'COMPUTER_ENGINEERING'
  | 'CIVIL_ENGINEERING'
  | 'ELECTRICAL_ENGINEERING'
  | 'ELECTRONICS_TELECOMMUNICATION'
  | 'MECHANICAL_ENGINEERING';

export type UsageCategory =
  | 'TEACHING_CLASSROOM'
  | 'LAB_EXPERIMENT'
  | 'STUDENT_DISTRIBUTION'
  | 'ADMINISTRATIVE'
  | 'MAINTENANCE_REPAIRS'
  | 'EVENTS_ACTIVITIES'
  | 'OTHER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  department: Department | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  role: Role;
  department?: Department | null;
}

export interface UpdateUserData {
  fullName?: string;
  role?: Role;
  department?: Department | null;
  isActive?: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

// ==================== STORE TYPES ====================

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  _count?: {
    items: number;
  };
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  category?: Category;
  unit: string;
  minStockLevel: number;
  createdAt: string;
  updatedAt: string;
  storeStock?: StoreStock;
  currentStock?: number;
  stockStatus?: 'GOOD' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
}

export interface StoreStock {
  id: string;
  itemId: string;
  item?: Item;
  quantity: number;
  lastUpdated: string;
  stockStatus?: 'GOOD' | 'LOW' | 'CRITICAL' | 'OUT_OF_STOCK';
}

export interface StoreEntry {
  id: string;
  itemId: string;
  item?: Item;
  quantity: number;
  billNumber: string;
  billDate: string;
  billAmount: number;
  vendorName: string;
  vendorContact?: string;
  billImageUrl?: string;
  remarks?: string;
  addedById: string;
  addedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  editLogs?: EditLog[];
}

export interface Distribution {
  id: string;
  itemId: string;
  item?: Item;
  fromStore: boolean;
  toDepartment: Department;
  quantity: number;
  distributedById: string;
  distributedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  receivedDate: string;
  remarks?: string;
  createdAt: string;
  editLogs?: EditLog[];
}

export interface EditLog {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  editedById: string;
  editedBy?: {
    id: string;
    fullName: string;
    email: string;
  };
  editedAt: string;
  reason?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
}

export interface CreateItemData {
  name: string;
  description?: string;
  categoryId: string;
  unit: string;
  minStockLevel?: number;
}

export interface UpdateItemData {
  name?: string;
  description?: string;
  categoryId?: string;
  unit?: string;
  minStockLevel?: number;
}

export interface CreateStoreEntryData {
  itemId: string;
  quantity: number;
  billNumber: string;
  billDate: string;
  billAmount: number;
  vendorName: string;
  vendorContact?: string;
  billImage?: File;
  remarks?: string;
}

export interface UpdateStoreEntryData {
  itemId?: string;
  quantity?: number;
  billNumber?: string;
  billDate?: string;
  billAmount?: number;
  vendorName?: string;
  vendorContact?: string;
  billImage?: File;
  remarks?: string;
  reason?: string;
}

export interface CreateDistributionData {
  itemId: string;
  toDepartment: Department;
  quantity: number;
  remarks?: string;
  receivedDate?: string;
}

export interface UpdateDistributionData {
  itemId?: string;
  toDepartment?: Department;
  quantity?: number;
  remarks?: string;
  receivedDate?: string;
  reason?: string;
}

export interface StoreEntryFilters {
  itemId?: string;
  vendorName?: string;
  billNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  amountFrom?: number;
  amountTo?: number;
}

export interface DistributionFilters {
  itemId?: string;
  toDepartment?: Department;
  dateFrom?: string;
  dateTo?: string;
}

// ==================== DEPARTMENT TYPES ====================

export interface DepartmentStockItem {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  receivedThisMonth: number;
  usedThisMonth: number;
  unit: string;
  status: 'GOOD' | 'LOW' | 'OUT';
  minStockLevel: number;
  lastUpdated: string;
}

export interface UsageLog {
  id: string;
  itemId: string;
  item: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
  department: Department;
  quantityUsed: number;
  usageDate: string;
  category: UsageCategory;
  purpose: string;
  attachmentUrl?: string;
  usedBy: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  editLogs?: EditLog[];
}

export interface CreateUsageLogData {
  itemId: string;
  quantityUsed: number;
  usageDate: string;
  category: UsageCategory;
  purpose: string;
  attachmentUrl?: string;
}

