import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children, userType }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isClassroomView = location.pathname.includes('/classroom/');

  const teacherMenus = [
    { path: '/dashboard', label: 'Overview' },
    { path: '/dashboard/create-material', label: 'Create Material' },
    { path: '/dashboard/create-session', label: 'Create Session' },
    { path: '/dashboard/sessions', label: 'Session List' },
    { path: '/dashboard/assignments', label: 'Assignments' }
  ];

  const studentMenus = [
    { path: '/dashboard', label: 'Overview' },
    { path: '/dashboard/available-sessions', label: 'Available Sessions' },
    { path: '/dashboard/assignments', label: 'Assignments' }
  ];

  const menus = userType === 'teacher' ? teacherMenus : studentMenus;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-slate-50">
      {/* Mobile Menu Button */}
      {!isClassroomView && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg md:hidden hover:bg-gray-50 transition-colors"
        >
          {isSidebarOpen ? (
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-gray-600" />
          )}
        </button>
      )}

      {/* Sidebar */}
      {!isClassroomView && (
        <div
          className={`fixed md:static inset-y-0 left-0 z-40 w-64 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-in-out bg-white shadow-lg`}
        >
          {/* Profile Section */}
          <Link
            to="/dashboard/profile"
            className="block p-4 hover:bg-blue-50/70 transition-colors duration-200"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                {user?.profilePicture?.data ? (
                  <img
                    src={user.profilePicture.data}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
                  />
                ) : (
                  <UserCircleIcon className="w-12 h-12 text-gray-400" />
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-800">
                  {user?.name || 'User Name'}
                </span>
                <span className="text-sm text-gray-500 capitalize">{userType}</span>
              </div>
            </div>
          </Link>

          <div className="border-t border-blue-100 my-2"></div>

          {/* Menu Items */}
          <nav className="px-2">
            {menus.map((menu) => (
              <Link
                key={menu.path}
                to={menu.path}
                className={`flex items-center px-4 py-2.5 mb-1 rounded-lg transition-all duration-200 ${
                  location.pathname === menu.path
                    ? 'bg-blue-600 text-white font-medium shadow-md'
                    : 'text-slate-600 hover:bg-blue-50/70'
                }`}
              >
                {menu.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          !isClassroomView && isSidebarOpen ? 'md:ml-0' : ''
        }`}
      >
        <div className="h-full px-4 py-6 md:px-6">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section - Updated with user name */}
            {location.pathname === '/dashboard' && (
              <div className="mb-8 bg-white rounded-xl shadow-sm border border-blue-100 p-8">
                <div className="max-w-3xl">
                  <h1 className="font-['Outfit'] text-4xl font-extrabold text-slate-800 mb-3 relative">
                    <span className="relative inline-block">
                      My Dashboard
                      <span className="absolute -bottom-2 left-0 w-1/3 h-1.5 bg-blue-500 rounded-full"></span>
                    </span>
                  </h1>
                  <p className="font-['Plus_Jakarta_Sans'] text-lg font-semibold text-slate-600 tracking-wide capitalize">
                    {user?.name || 'Welcome back!'}
                  </p>
                </div>
              </div>
            )}
            
            {/* Page Content */}
            <div className="space-y-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
