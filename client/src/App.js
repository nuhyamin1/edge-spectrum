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
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

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

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify/:token" element={<EmailVerification />} />
      
      {/* Default redirect based on user role */}
      <Route
        path="/"
        element={
          <Navigate to="/dashboard" replace />
        }
      />

      {/* Teacher Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherMainPage />
          </ProtectedRoute>
        }
      />
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

      {/* Student Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentMainPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/available-sessions"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <AvailableSessions />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
          <ToastContainer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
