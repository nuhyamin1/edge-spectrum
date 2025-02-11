import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Create axios instance with default config
export const api = axios.create({
  baseURL: '/api'
});

// Add axios interceptor to handle auth
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        
        // Ensure all user data is properly loaded
        setUser({
          ...parsedUser,
          token,
          profilePicture: parsedUser.profilePicture || null,
          aboutMe: parsedUser.aboutMe || '',
          isEmailVerified: parsedUser.isEmailVerified || false
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (userData, token) => {
    try {
      // Ensure all user data is included
      const completeUserData = {
        ...userData,
        profilePicture: userData.profilePicture || null,
        aboutMe: userData.aboutMe || '',
        isEmailVerified: userData.isEmailVerified || false
      };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(completeUserData));
      setUser({ ...completeUserData, token });
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (userData) => {
    try {
      // Preserve the token and ensure all data is included
      const token = user?.token;
      const completeUserData = {
        ...userData,
        profilePicture: userData.profilePicture || null,
        aboutMe: userData.aboutMe || '',
        isEmailVerified: userData.isEmailVerified || false
      };
      
      // Update localStorage with complete data
      localStorage.setItem('user', JSON.stringify(completeUserData));
      
      // Update state with complete data
      setUser({ ...completeUserData, token });
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  const value = {
    user,
    setUser,
    loading,
    logout,
    login,
    updateUser,
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
