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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-100 to-blue-50">
      {/* Mobile Menu Button */}
      {!isClassroomView && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-blue-300 shadow-lg md:hidden hover:bg-blue-400 transition-all duration-300"
        >
          {isSidebarOpen ? (
            <XMarkIcon className="w-6 h-6 text-white" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-white" />
          )}
        </button>
      )}

      {/* Sidebar */}
      {!isClassroomView && (
        <div
          className={`fixed md:static inset-y-0 left-0 z-40 w-64 transform ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0 transition-transform duration-300 ease-in-out bg-blue-900 shadow-2xl shadow-blue-100/50`}
        >
          {/* Profile Section */}
          <Link
            to="/dashboard/profile"
            className="block p-6 hover:bg-blue-800/20 transition-colors duration-300 border-b border-blue-700/50"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                {user?.profilePicture?.data ? (
                  <img
                    src={user.profilePicture.data}
                    alt="Profile"
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-blue-300/30"
                  />
                ) : (
                  <UserCircleIcon className="w-12 h-12 text-blue-300/80" />
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-blue-900"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-blue-100">
                  {user?.name || 'User Name'}
                </span>
                <span className="text-sm text-blue-300/80 capitalize">{userType}</span>
              </div>
            </div>
          </Link>

          {/* Menu Items */}
          <nav className="p-4 space-y-2 mt-4">
            {menus.map((menu) => (
              <Link
                key={menu.path}
                to={menu.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                  location.pathname === menu.path
                    ? 'bg-blue-300/10 border-l-4 border-blue-300 text-blue-100 font-semibold'
                    : 'text-blue-200/80 hover:bg-blue-800/20 hover:pl-5 border-l-4 border-transparent'
                }`}
              >
                <span className="relative">
                  {menu.label}
                  <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-blue-300 transition-all duration-300"></span>
                </span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${!isClassroomView && isSidebarOpen ? 'md:ml-0' : ''}`}>
        <div className="h-full px-4 py-8 md:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            {location.pathname === '/dashboard' && (
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-white rounded-2xl shadow-sm border border-blue-100 p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA3NWZmIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')]"></div>
                <div className="max-w-3xl relative">
                  <h1 className="font-['Inter'] text-4xl font-black text-blue-900 mb-3">
                    <span className="relative inline-block pb-2">
                      My Dashboard
                      <span className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-300 to-transparent rounded-full"></span>
                    </span>
                  </h1>
                  <p className="font-['Inter'] text-lg font-medium text-blue-700/90 tracking-wide capitalize">
                    {user?.name || 'Welcome back!'}
                    <span className="ml-2 animate-pulse">👋</span>
                  </p>
                </div>
              </div>
            )}
            
            {/* Page Content */}
            <div className="space-y-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;