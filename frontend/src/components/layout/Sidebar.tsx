import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Building2,
  FileText,
  BarChart3,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['*'], // All roles
  },
  {
    path: '/store',
    label: 'Store Management',
    icon: <Package className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'STORE_ADMIN'],
  },
  {
    path: '/department',
    label: 'Department Dashboard',
    icon: <Building2 className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL'],
  },
  {
    path: '/department/stock',
    label: 'Department Stock',
    icon: <Package className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL'],
  },
  {
    path: '/department/log-usage',
    label: 'Log Usage',
    icon: <FileText className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL'],
  },
  {
    path: '/department/usage-history',
    label: 'Usage History',
    icon: <FileText className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'DEPT_ADMIN_COMPUTER', 'DEPT_ADMIN_CIVIL', 'DEPT_ADMIN_ELECTRICAL', 'DEPT_ADMIN_ELECTRONICS', 'DEPT_ADMIN_MECHANICAL'],
  },
  {
    path: '/reports',
    label: 'Reports',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['*'], // All roles
  },
  {
    path: '/users',
    label: 'User Management',
    icon: <Users className="w-5 h-5" />,
    roles: ['SUPER_ADMIN'],
  },
  {
    path: '/analytics',
    label: 'Advanced Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['SUPER_ADMIN', 'STORE_ADMIN'],
  },
  {
    path: '/verification',
    label: 'Verification Center',
    icon: <FileText className="w-5 h-5" />,
    roles: ['SUPER_ADMIN'],
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: <FileText className="w-5 h-5" />,
    roles: ['*'],
  },
  {
    path: '/audit',
    label: 'Audit Trail',
    icon: <FileText className="w-5 h-5" />,
    roles: ['SUPER_ADMIN'],
  },
];

export const Sidebar = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const canAccess = (item: MenuItem) => {
    if (!user) return false;
    if (item.roles.includes('*')) return true;
    return item.roles.includes(user.role);
  };

  const accessibleItems = menuItems.filter(canAccess);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white shadow-lg border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          pt-16 lg:pt-0
        `}
      >
        <nav className="p-4 space-y-2">
          {accessibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};


