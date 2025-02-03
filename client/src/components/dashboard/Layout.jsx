import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children, userType }) => {
  const location = useLocation();
  
  const teacherMenus = [
    { path: '/dashboard', label: 'Main Page' },
    { path: '/dashboard/create-session', label: 'Create Session' },
    { path: '/dashboard/sessions', label: 'Session List' },
    { path: '/dashboard/create-material', label: 'Create Material' },
    { path: '/dashboard/profile', label: 'User Profile' },
  ];

  const studentMenus = [
    { path: '/dashboard', label: 'Main Page' },
    { path: '/dashboard/available-sessions', label: 'Available Sessions' },
    { path: '/dashboard/profile', label: 'User Profile' },
  ];

  const menus = userType === 'teacher' ? teacherMenus : studentMenus;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {userType === 'teacher' ? 'Teacher Dashboard' : 'Student Dashboard'}
          </h2>
        </div>
        <nav className="mt-4">
          {menus.map((menu) => (
            <Link
              key={menu.path}
              to={menu.path}
              className={`block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 ${
                location.pathname === menu.path ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              {menu.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {children}
      </div>
    </div>
  );
};

export default Layout;
