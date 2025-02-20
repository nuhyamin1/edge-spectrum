import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  UserCircleIcon, 
  Bars3Icon, 
  XMarkIcon, 
  ChevronLeftIcon,
  HomeIcon,
  DocumentPlusIcon,
  PlusCircleIcon,
  CalendarIcon,
  ClipboardIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';
import { useAuth } from '../../context/AuthContext';

const Layout = ({ children, userType }) => {
  const location = useLocation();
  const { user } = useAuth();
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
    { path: '/dashboard/create-material', label: 'Create Material', icon: DocumentPlusIcon },
    { path: '/dashboard/create-session', label: 'Create Session', icon: PlusCircleIcon },
    { path: '/dashboard/sessions', label: 'Session List', icon: CalendarIcon },
    { path: '/dashboard/assignments', label: 'Assignments', icon: ClipboardIcon }
  ];

  const studentMenus = [
    { path: '/dashboard', label: 'Overview', icon: HomeIcon },
    { path: '/dashboard/available-sessions', label: 'Available Sessions', icon: AcademicCapIcon },
    { path: '/dashboard/assignments', label: 'Assignments', icon: CheckCircleIcon }
  ];

  const menus = userType === 'teacher' ? teacherMenus : studentMenus;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-400 to-blue-50">
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
          className={`fixed md:static inset-y-0 left-0 z-40 transform 
            ${isSidebarOpen ? 'w-64' : 'w-20'} 
            transition-all duration-300 ease-in-out bg-blue-900 shadow-2xl shadow-blue-100/50`}
        >
          {/* Collapse Button (Desktop Only) */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:flex absolute -right-3 top-8 bg-blue-800 text-white p-1 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          >
            <ChevronLeftIcon className={`w-5 h-5 transform transition-transform ${isSidebarOpen ? '' : 'rotate-180'}`} />
          </button>

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
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="font-bold text-blue-100">
                    {user?.name || 'User Name'}
                  </span>
                  <span className="text-sm text-blue-300/80 capitalize">{userType}</span>
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
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 group ${
                  location.pathname === menu.path
                    ? 'bg-blue-300/10 border-l-4 border-blue-300 text-blue-100 font-semibold'
                    : 'text-blue-200/80 hover:bg-blue-800/20 hover:pl-5 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center">
                  <menu.icon className={`sidebar-icon ${isSidebarOpen ? 'mr-3' : ''} transition-all duration-300`} />
                  <span className="relative whitespace-nowrap">
                    {isSidebarOpen ? (
                      menu.label
                    ) : (
                      <span className="hidden">{menu.label}</span>
                    )}
                    <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-0.5 bg-blue-300 transition-all duration-300"></span>
                  </span>
                </div>
                {/* Tooltip for collapsed state */}
                {!isSidebarOpen && (
                  <div className="absolute left-20 bg-blue-800 text-white px-2 py-1 rounded-md text-sm 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    {menu.label}
                  </div>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${
        !isClassroomView && isSidebarOpen ? 'md:ml-0' : ''
      }`}>
        <div className="h-full px-4 py-8 md:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Welcome Section */}
            {location.pathname === '/dashboard' && (
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-white rounded-2xl shadow-sm border border-blue-100 p-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDA3NWZmIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')]"></div>
                <div className="relative">
                  <h1 className="font-['Inter'] text-4xl font-black text-blue-900 mb-3">
                    <span className="relative inline-block pb-2">
                      PF Speaking Master
                      <span className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-300 to-transparent rounded-full"></span>
                    </span>
                  </h1>
                  {/* Enhanced Platform Description - Full Width */}
                  <div className="relative mt-10 p-8 bg-gradient-to-r from-blue-200 via-blue-100 to-blue-50 rounded-3xl shadow-xl overflow-hidden transform transition-transform duration-500 hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTBweCIgaGVpZ2h0PSI1MHB4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')] opacity-10" />
                    <div className="relative z-10">
                      <h2 className="text-3xl font-extrabold text-blue-900 mb-4 max-w-3xl mx-auto">
                        Transform Your Language Learning Journey
                      </h2>
                      <p className="text-lg text-blue-700 leading-relaxed mb-8 max-w-3xl mx-auto">
                        Experience a revolutionary way to master speaking with real-time interaction, instant feedback, and cutting-edge technology. Whether you're a teacher or student, PF Speaking Master brings the language classroom to life in the digital world.
                      </p>
                      {/* Four column grid for larger screens */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="relative bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-blue-200 transform transition-all duration-500 hover:bg-white hover:shadow-2xl">
                          <h3 className="text-xl font-semibold text-blue-800 mb-3 flex items-center">
                            <span className="text-blue-500 mr-2">🎯</span>
                            Interactive Learning Experience
                          </h3>
                          <ul className="space-y-3 text-blue-600 text-sm">
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Real-time video communication for authentic conversation practice
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Live pronunciation feedback and correction
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Interactive exercises and discussion rooms
                            </li>
                          </ul>
                        </div>
                        <div className="relative bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-blue-200 transform transition-all duration-500 hover:bg-white hover:shadow-2xl">
                          <h3 className="text-2xl font-semibold text-blue-800 mb-3 flex items-center">
                            <span className="text-blue-500 mr-2">💡</span>
                            Advanced Learning Tools
                          </h3>
                          <ul className="space-y-3 text-blue-600 text-sm">
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Screen sharing for enhanced demonstrations
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Digital whiteboard for visual explanations
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Breakout rooms for small group practice
                            </li>
                          </ul>
                        </div>
                        <div className="relative bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-blue-200 transform transition-all duration-500 hover:bg-white hover:shadow-2xl">
                          <h3 className="text-2xl font-semibold text-blue-800 mb-3 flex items-center">
                            <span className="text-blue-500 mr-2">📊</span>
                            Progress Tracking
                          </h3>
                          <ul className="space-y-3 text-blue-600 text-sm">
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Detailed feedback on pronunciation and fluency
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Record and review speaking sessions
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Track improvement over time
                            </li>
                          </ul>
                        </div>
                        <div className="relative bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-blue-200 transform transition-all duration-500 hover:bg-white hover:shadow-2xl">
                          <h3 className="text-2xl font-semibold text-blue-800 mb-3 flex items-center">
                            <span className="text-blue-500 mr-2">🌟</span>
                            Engagement Features
                          </h3>
                          <ul className="space-y-3 text-blue-600 text-sm">
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Hand raise and participation tracking
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Real-time discussion and feedback
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                              Interactive exercises and games
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Page Content */}
            <div className="space-y-8">
              {children}
            </div>

            {/* Info and Contact Section */}
            <footer className="mt-32 border-t border-blue-100 pt-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900">About Us</h3>
                  <p className="text-blue-600 text-sm leading-relaxed">
                    PF Speaking Master is dedicated to revolutionizing language learning through innovative technology and interactive experiences.
                  </p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900">Contact Us</h3>
                  <div className="space-y-2 text-sm text-blue-600">
                    <p>Email: support@pfspeakingmaster.com</p>
                    <p>Phone: +1 (555) 123-4567</p>
                    <p>Hours: Mon-Fri 9:00 AM - 6:00 PM EST</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-blue-900">Quick Links</h3>
                  <div className="space-y-2 text-sm">
                    <p><a href="/help" className="text-blue-600 hover:text-blue-800 transition-colors">Help Center</a></p>
                    <p><a href="/privacy" className="text-blue-600 hover:text-blue-800 transition-colors">Privacy Policy</a></p>
                    <p><a href="/terms" className="text-blue-600 hover:text-blue-800 transition-colors">Terms of Service</a></p>
                  </div>
                </div>
              </div>
              <div className="mt-8 text-center text-sm text-blue-500">
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