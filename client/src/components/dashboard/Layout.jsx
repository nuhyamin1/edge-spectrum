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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const isClassroomView = location.pathname.includes('/classroom/');

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  const teacherMenus = [
    { path: '/dashboard', label: 'Overview', icon: HomeIcon },
    { path: '/dashboard/materials', label: 'Material List', icon: DocumentTextIcon },
    { path: '/dashboard/sessions', label: 'Session List', icon: CalendarIcon },
    { path: '/dashboard/assignments', label: 'Assignments', icon: ClipboardIcon },
    { divider: true },
    { path: '/dashboard/create-material', label: 'Create Material', icon: DocumentPlusIcon },
    { path: '/dashboard/create-session', label: 'Create Session', icon: PlusCircleIcon },
  ];

  const studentMenus = [
    { path: '/dashboard/student', label: 'Overview', icon: HomeIcon },
    { path: '/dashboard/student/materials', label: 'Materials', icon: DocumentTextIcon },
    { path: '/dashboard/available-sessions', label: 'Sessions', icon: AcademicCapIcon },
    { path: '/dashboard/assignments', label: 'Assignments', icon: CheckCircleIcon }
  ];

  const menus = currentUserType === 'teacher' ? teacherMenus : studentMenus;

  // Separate menus into primary and secondary items
  const getPrimaryMenus = (menuItems) => menuItems.slice(0, 3);
  const getSecondaryMenus = (menuItems) => menuItems.slice(3);

  const primaryMenus = getPrimaryMenus(menus.filter(menu => !menu.divider));
  const secondaryMenus = getSecondaryMenus(menus.filter(menu => !menu.divider));

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Top Navigation Bar */}
      {!isClassroomView && (
        <>
          {/* Secondary Navigation */}
          <div className="bg-blue-900 text-white">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-end items-center h-10 text-sm">
                <Link to="/dashboard/profile" className="hover:text-blue-200 px-3">Profile</Link>
                <Link to="/help" className="hover:text-blue-200 px-3">Help</Link>
                <Link to="/contact" className="hover:text-blue-200 px-3">Contact</Link>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="bg-white border-b border-blue-100 relative z-40">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex justify-between items-center h-20">
                {/* Logo Section */}
                <Link to={currentUserType === 'teacher' ? '/dashboard' : '/dashboard/student'} className="flex items-center space-x-3">
                  <img src={process.env.PUBLIC_URL + '/pfsm_logo.png'} alt="Logo" className="h-12 w-auto" />
                  <div className="flex flex-col">
                    <span className="font-serif text-2xl text-blue-900">PF Speaking Master</span>
                    <span className="text-sm text-gray-600">Practice & Fluency</span>
                  </div>
                </Link>

                {/* Desktop Navigation Menu */}
                <nav className="hidden md:flex items-center space-x-8">
                  {primaryMenus.map((menu) => (
                    <Link
                      key={menu.path}
                      to={menu.path}
                      className={`text-base font-medium transition-colors duration-200 ${
                        location.pathname === menu.path
                          ? 'text-blue-600'
                          : 'text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      {menu.label}
                    </Link>
                  ))}

                  {/* More Menu Dropdown */}
                  {secondaryMenus.length > 0 && (
                    <div className="relative z-50">
                      <button
                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                        className="flex items-center text-base font-medium text-gray-700 hover:text-blue-600"
                      >
                        More
                        <ChevronLeftIcon className={`w-4 h-4 ml-1 transform transition-transform ${isMoreMenuOpen ? 'rotate-90' : '-rotate-90'}`} />
                      </button>
                      
                      {isMoreMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                          <div className="py-1" role="menu">
                            {secondaryMenus.map((menu) => (
                              <Link
                                key={menu.path}
                                to={menu.path}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                role="menuitem"
                              >
                                {menu.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </nav>

                {/* Mobile Menu Button */}
                <div className="md:hidden">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50"
                  >
                    {isSidebarOpen ? (
                      <XMarkIcon className="h-6 w-6" />
                    ) : (
                      <Bars3Icon className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isSidebarOpen && (
            <div className="md:hidden bg-white border-b border-blue-100">
              <div className="px-4 py-3 space-y-1">
                {menus.filter(menu => !menu.divider).map((menu) => (
                  <Link
                    key={menu.path}
                    to={menu.path}
                    className={`block py-2 px-3 rounded-md text-base font-medium ${
                      location.pathname === menu.path
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    {menu.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">About Us</h3>
              <p className="text-gray-400 text-sm">
                Transforming language learning with cutting-edge technology and immersive experiences.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-blue-200">About</Link></li>
                <li><Link to="/programs" className="hover:text-blue-200">Programs</Link></li>
                <li><Link to="/resources" className="hover:text-blue-200">Resources</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center">
                  <EnvelopeIcon className="w-5 h-5 mr-2" />
                  support@pfspeaking.com
                </li>
                <li className="flex items-center">
                  <PhoneIcon className="w-5 h-5 mr-2" />
                  +1 (555) 123-4567
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-blue-200">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-200">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-blue-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} PF Speaking Master. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;