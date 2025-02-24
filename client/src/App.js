import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import EmailVerification from './components/auth/EmailVerification';
import TeacherMainPage from './components/dashboard/teacher/MainPage';
import CreateSession from './components/dashboard/teacher/CreateSession';
import SessionList from './components/dashboard/teacher/SessionList';
import StudentMainPage from './components/dashboard/student/MainPage';
import AvailableSessions from './components/dashboard/student/AvailableSessions';
import EditSession from './components/dashboard/teacher/EditSession';
import Classroom from './components/dashboard/teacher/Classroom';
import StudentClassroom from './components/dashboard/student/StudentClassroom';
import CreateMaterial from './components/dashboard/teacher/CreateMaterial';
import EditMaterial from './components/dashboard/teacher/EditMaterial';
import MaterialView from './components/dashboard/MaterialView';
import SessionView from './components/dashboard/SessionView';
import TeacherProfile from './components/dashboard/teacher/TeacherProfile';
import StudentProfile from './components/dashboard/student/StudentProfile';
import TeacherAssignments from './components/dashboard/teacher/TeacherAssignments';
import StudentAssignments from './components/dashboard/student/StudentAssignments';
import AssignmentDetails from './components/dashboard/teacher/AssignmentDetails';
import Layout from './components/dashboard/Layout'; 
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

// AppRoutes component to contain all routes
const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify/:token" element={<EmailVerification />} />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'student']}>
                {user?.role === 'teacher' ? <TeacherMainPage /> : <StudentMainPage />}
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes */}
          <Route
            path="/dashboard/create-session"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <CreateSession />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/sessions"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <SessionList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/edit-session/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <EditSession />
              </ProtectedRoute>
            }
          />

          {/* Material Routes */}
          <Route
            path="/dashboard/create-material"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <CreateMaterial />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/edit-material/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <EditMaterial />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard/material/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'student']}>
                <MaterialView />
              </ProtectedRoute>
            }
          />

          {/* Session View Route */}
          <Route
            path="/dashboard/session/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'student']}>
                <SessionView />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/dashboard/available-sessions"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <AvailableSessions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/classroom/:sessionId"
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentClassroom />
              </ProtectedRoute>
            }
          />

          {/* Classroom Routes */}
          <Route
            path="/teacher/classroom/:sessionId"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <Classroom />
              </ProtectedRoute>
            }
          />

          {/* Profile Routes */}
          <Route
            path="/dashboard/profile"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'student']}>
                <Layout userType={user?.role}>
                  {user?.role === 'teacher' ? <TeacherProfile /> : <StudentProfile />}
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Assignment Routes */}
          <Route
            path="/dashboard/assignments"
            element={
              <ProtectedRoute allowedRoles={['teacher', 'student']}>
                <Layout userType={user?.role}>
                  {user?.role === 'teacher' ? <TeacherAssignments /> : <StudentAssignments />}
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Assignment Details Route */}
          <Route
            path="/teacher/assignments/:id"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <Layout userType="teacher">
                  <AssignmentDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>
    </MotionConfig>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-100">
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={5000} />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
