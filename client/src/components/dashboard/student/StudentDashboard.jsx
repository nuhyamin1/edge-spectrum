import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../Layout';
import AvailableSessions from './AvailableSessions';

const StudentDashboard = () => {
  const { user } = useAuth();

  return (
    <Layout userType="student">
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {user?.name || 'Student'}!
          </h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Available Learning Sessions
          </h2>
          <AvailableSessions />
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;
