import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  UserCircleIcon, 
  Bars3Icon, 
  XMarkIcon, 
  ChevronLeftIcon,
  HomeIcon,
  DocumentPlusIcon,
  DocumentTextIcon,
  PlusCircleIcon,
  CalendarIcon,
  ClipboardIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children, userType }) => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Add this to ensure userType is consistent
  const currentUserType = user?.role || userType;

  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const isClassroomView = location.pathname.includes('/classroom/');

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const teacherMenus = [
    { path: '/dashboard', label: 'Overview', icon: HomeIcon },
    { path: '/dashboard/materials', label: 'Material List', icon: DocumentTextIcon },
    { path: '/dashboard/sessions', label: 'Session List', icon: CalendarIcon },
    { path: '/dashboard/create-material', label: 'Create Material', icon: DocumentPlusIcon },
    { path: '/dashboard/create-session', label: 'Create Session', icon: PlusCircleIcon },
    { path: '/dashboard/assignments', label: 'Assignments', icon: ClipboardIcon }
  ];

  const studentMenus = [
    { path: '/dashboard/student', label: 'Overview', icon: HomeIcon },
    { path: '/dashboard/student/materials', label: 'Materials', icon: DocumentTextIcon },
    { path: '/dashboard/available-sessions', label: 'Sessions', icon: AcademicCapIcon },
    { path: '/dashboard/assignments', label: 'Assignments', icon: CheckCircleIcon }
  ];

  const menus = currentUserType === 'teacher' ? teacherMenus : studentMenus;

  return (
    <div className="flex min-h-screen bg-blue-300 text-gray-900">
      {/* Mobile Menu Button */}
      {!isClassroomView && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-full bg-gray-800 shadow-lg md:hidden hover:bg-gray-700 transition-all duration-300"
        >
          {isSidebarOpen ? (
            <XMarkIcon className="w-6 h-6 text-blue-400" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-blue-400" />
          )}
        </button>
      )}

      {/* Sidebar */}
      {!isClassroomView && (
        <div
          className={`fixed md:static inset-y-0 left-0 z-40 transform 
            ${isSidebarOpen ? 'w-64' : 'w-20'} 
            transition-all duration-300 ease-in-out bg-blue-50 shadow-2xl shadow-blue-400/20`}
        >
          {/* Collapse Button (Desktop Only) */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex absolute -right-3 top-8 bg-blue-100 text-blue-400 p-1 rounded-full shadow-lg hover:bg-blue-200 transition-colors"
          >
            <ChevronLeftIcon className={`w-5 h-5 transform transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} />
          </button>

          {/* Profile Section */}
          <Link
            to="/dashboard/profile"
            className="block p-6 hover:bg-blue-100/50 transition-colors duration-300 border-b border-blue-200"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                {user?.profilePicture?.data ? (
                  <img
                    src={user.profilePicture.data}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-400/50"
                  />
                ) : (
                  <UserCircleIcon className="w-12 h-12 text-blue-400/80" />
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-800"></div>
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">
                    {user?.name || 'User Name'}
                  </span>
                  <span className="text-sm text-blue-600 capitalize">{currentUserType}</span>
                </div>
              )}
            </div>
          </Link>

          {/* Menu Items */}
          <nav className="p-4 space-y-2 mt-4">
            {menus.map((menu) => (
              <Link
                key={menu.path}
                to={menu.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-300 group ${
                  location.pathname === menu.path
                    ? 'bg-blue-100 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <div className="flex items-center">
                  <menu.icon className={`w-6 h-6 ${isSidebarOpen ? 'mr-3' : ''} transition-all duration-300`} />
                  {isSidebarOpen && (
                    <span className="relative">
                      {menu.label}
                      <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-blue-400 transition-all duration-300"></span>
                    </span>
                  )}
                </div>
                {!isSidebarOpen && (
                  <div className="absolute left-20 bg-blue-100 text-blue-600 px-2 py-1 rounded-md text-sm 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    {menu.label}
                  </div>
                )}
              </Link>
            ))}
            {currentUserType === 'teacher' && (
              <Link
                to="/dashboard/semester-management"
                className="flex items-center px-4 py-2 text-gray-300 hover:text-neon-blue transition-colors"
              >
                <CalendarIcon className="w-5 h-5 mr-2" />
                Semester Management
              </Link>
            )}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 bg-blue-300">
        <div className="h-full px-4 py-8 md:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            {location.pathname === '/dashboard' && (
              <div className="mb-8 bg-gradient-to-r from-blue-200 to-blue-100 rounded-2xl shadow-lg p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDBmZjAwIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')]"></div>
                <div className="relative">
                  <h1 className="text-5xl font-extrabold text-blue-600 mb-4">
                    Welcome to PF Speaking Master
                  </h1>
                  <p className="text-lg text-gray-700 mb-8">
                    Master speaking with real-time feedback and interactive tools designed for immersive learning.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-200 p-6 rounded-xl shadow-md hover:shadow-blue-400/50 transition-shadow duration-300">
                      <h3 className="text-xl font-semibold text-blue-600 mb-2">Real-Time Feedback</h3>
                      <p className="text-gray-700">Get instant pronunciation and fluency insights.</p>
                    </div>
                    <div className="bg-blue-200 p-6 rounded-xl shadow-md hover:shadow-blue-400/50 transition-shadow duration-300">
                      <h3 className="text-xl font-semibold text-blue-600 mb-2">Interactive Sessions</h3>
                      <p className="text-gray-700">Join live sessions with teachers and peers.</p>
                    </div>
                    <div className="bg-blue-200 p-6 rounded-xl shadow-md hover:shadow-blue-400/50 transition-shadow duration-300">
                      <h3 className="text-xl font-semibold text-blue-600 mb-2">Progress Tracking</h3>
                      <p className="text-gray-700">Monitor your improvement with detailed analytics.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Page Content */}
            <div className="space-y-8">
              {children}
            </div>

            {/* Footer */}
            <footer className="mt-16 border-t border-blue-200 pt-8 pb-8 bg-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-600">About Us</h3>
                  <p className="text-gray-700 text-sm">
                    Transforming language learning with cutting-edge technology.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-600">Contact Us</h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><EnvelopeIcon className="w-5 h-5 inline mr-2" /> support@pfspeakingmaster.com</p>
                    <p><PhoneIcon className="w-5 h-5 inline mr-2" /> +1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-600">Quick Links</h3>
                  <div className="space-y-2 text-sm">
                    <p><a href="/help" className="text-gray-700 hover:text-blue-600 transition-colors">Help Center</a></p>
                    <p><a href="/privacy" className="text-gray-700 hover:text-blue-600 transition-colors">Privacy Policy</a></p>
                    <p><a href="/terms" className="text-gray-700 hover:text-blue-600 transition-colors">Terms of Service</a></p>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-center text-sm text-gray-600">
                © {new Date().getFullYear()} PF Speaking Master. All rights reserved.
              </div>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;