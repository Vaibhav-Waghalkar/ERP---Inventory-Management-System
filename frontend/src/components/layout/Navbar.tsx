import { LogOut, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { GlobalSearch } from '../common/GlobalSearch';
import { NotificationBell } from '../common/NotificationBell';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: 'Super Administrator',
      STORE_ADMIN: 'Store Administrator',
      DEPT_ADMIN_COMPUTER: 'Computer Engineering Admin',
      DEPT_ADMIN_CIVIL: 'Civil Engineering Admin',
      DEPT_ADMIN_ELECTRICAL: 'Electrical Engineering Admin',
      DEPT_ADMIN_ELECTRONICS: 'Electronics & Telecommunication Admin',
      DEPT_ADMIN_MECHANICAL: 'Mechanical Engineering Admin',
    };
    return roleMap[role] || role;
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and College Name */}
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-lg font-heading font-semibold text-gray-900">
                Rajiv Gandhi Polytechnic
              </h1>
              <p className="text-xs text-gray-600">ERP Inventory Management</p>
            </div>
          </div>

          {/* Search and User Info */}
          <div className="flex items-center gap-4">
            <GlobalSearch />
            <NotificationBell />
            {/* User Info and Logout */}
            <div className="hidden sm:flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4" />
                <span className="font-medium">{user?.fullName}</span>
              </div>
              <div className="text-gray-500">
                {user && getRoleDisplayName(user.role)}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-outline flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

