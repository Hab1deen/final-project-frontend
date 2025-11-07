import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Package,
  Users,
  X,
  LogOut,
  Settings
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    if (confirm('ต้องการออกจากระบบ?')) {
      logout();
    }
  };

  // ตรวจสอบขนาดหน้าจอ
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ปิด mobile menu เมื่อเปลี่ยนหน้า
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const menuItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: 'Dashboard',
      badge: null
    },
    {
      path: '/quotations',
      icon: FileText,
      label: 'ใบเสนอราคา',
      badge: null
    },
    {
      path: '/invoices',
      icon: Receipt,
      label: 'ใบแจ้งหนี้',
      badge: null
    },
    {
      path: '/appointments',
      icon: CalendarDays,
      label: 'นัดหมาย',
      badge: null
    },
    {
      path: '/products',
      icon: Package,
      label: 'สินค้า/บริการ',
      badge: null
    },
    {
      path: '/customers',
      icon: Users,
      label: 'ลูกค้า',
      badge: null
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const toggleSidebar = () => {
    if (!isMobile) {
      setSidebarOpen(!sidebarOpen);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${mobileMenuOpen ? 'translate-x-0' : isMobile ? '-translate-x-full' : 'translate-x-0'}
          md:translate-x-0
        `}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className={`flex items-center gap-3 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <h1 className="font-bold text-gray-900 text-lg whitespace-nowrap">
                  Business Doc
                </h1>
                <p className="text-xs text-gray-500 whitespace-nowrap">
                  Document System
                </p>
              </div>
            )}
          </div>

          {/* Close Button - Mobile */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100vh-8rem)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  group relative flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${active
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${!sidebarOpen && 'justify-center'}
                `}
              >
                {/* Icon */}
                <Icon
                  className={`
                    w-5 h-5 flex-shrink-0 transition-colors
                    ${active ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}
                  `}
                />

                {/* Label */}
                {sidebarOpen && (
                  <span className="font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {/* Badge */}
                {sidebarOpen && item.badge && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}

                {/* Tooltip - แสดงตอน Sidebar ปิด */}
                {!sidebarOpen && (
                  <div className="
                    absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm
                    rounded-lg whitespace-nowrap opacity-0 invisible
                    group-hover:opacity-100 group-hover:visible
                    transition-all duration-200 pointer-events-none z-50
                  ">
                    {item.label}
                    <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}

                {/* Active Indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
          <button
            className={`
              group relative flex items-center gap-3 w-full px-4 py-3 rounded-lg
              text-gray-700 hover:bg-gray-100 transition-all duration-200
              ${!sidebarOpen && 'justify-center'}
            `}
          >
            <Settings className="w-5 h-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
            {sidebarOpen && <span className="font-medium">ตั้งค่า</span>}

            {!sidebarOpen && (
              <div className="
                absolute left-full ml-6 px-3 py-2 bg-gray-900 text-white text-sm
                rounded-lg whitespace-nowrap opacity-0 invisible
                group-hover:opacity-100 group-hover:visible
                transition-all duration-200 pointer-events-none z-50
              ">
                ตั้งค่า
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
              </div>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}
        `}
      >
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="h-full px-4 md:px-6 flex items-center justify-between">
            {/* Hamburger Button with Hover Effect - Mobile & Desktop */}
            <button
              onClick={isMobile ? () => setMobileMenuOpen(true) : toggleSidebar}
              className="group relative w-10 h-10 flex items-center justify-center hover:bg-blue-50 rounded-lg transition-all duration-200"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 flex flex-col justify-center items-center">
                <span
                  className={`
                    block h-0.5 w-6 rounded-full
                    transition-all duration-300 ease-out
                    ${sidebarOpen && !isMobile 
                      ? 'rotate-45 translate-y-2 bg-blue-600' 
                      : 'bg-gray-600 group-hover:bg-blue-600'
                    }
                  `}
                />
                <span
                  className={`
                    block h-0.5 w-6 rounded-full my-1
                    transition-all duration-300 ease-out
                    ${sidebarOpen && !isMobile 
                      ? 'opacity-0' 
                      : 'opacity-100 bg-gray-600 group-hover:bg-blue-600'
                    }
                  `}
                />
                <span
                  className={`
                    block h-0.5 w-6 rounded-full
                    transition-all duration-300 ease-out
                    ${sidebarOpen && !isMobile 
                      ? '-rotate-45 -translate-y-2 bg-blue-600' 
                      : 'bg-gray-600 group-hover:bg-blue-600'
                    }
                  `}
                />
              </div>
            </button>

            {/* Right Side - User Menu */}
            <div className="flex items-center gap-4 ml-auto">
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setShowUserMenu(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                        <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                        </span>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            // TODO: Navigate to profile page
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <UserIcon className="w-4 h-4" />
                          <span>โปรไฟล์</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>ออกจากระบบ</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;