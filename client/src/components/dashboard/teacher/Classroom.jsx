import React from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../Layout';

const Classroom = () => {
  const { sessionId } = useParams();

  return (
    <Layout userType="teacher">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Virtual Classroom</h2>
        <div className="border-t border-gray-200 pt-4">
          <p className="text-gray-600">Session ID: {sessionId}</p>
          {/* Add your classroom features here */}
        </div>
      </div>
    </Layout>
  );
};

export default Classroom; 