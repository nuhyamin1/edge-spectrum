import React from 'react';
import Layout from '../Layout';

const TeacherMainPage = () => {
  return (
    <Layout userType="teacher">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Teacher Dashboard</h1>
        <p className="text-gray-600">
          This is your main dashboard page. More content will be added soon.
        </p>
      </div>
    </Layout>
  );
};

export default TeacherMainPage;
