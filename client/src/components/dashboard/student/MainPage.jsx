import React, { useEffect, useState } from 'react';
import Layout from '../Layout';
import axios from '../../../utils/axios';

const StudentMainPage = () => {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await axios.get('/api/materials');
        setMaterials(response.data);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };

    fetchMaterials();
  }, []);

  return (
    <Layout userType="student">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Student Dashboard</h1>
          <p className="text-gray-600">
            Access your learning materials and join sessions from this dashboard.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Semester Materials</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <div 
                key={material._id} 
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {/* TODO: Add material view page navigation */}}
              >
                <h3 className="text-lg font-semibold text-gray-800">{material.title}</h3>
                <p className="text-sm text-blue-600 mb-2">{material.subject}</p>
                <p className="text-gray-600 text-sm">{material.description}</p>
              </div>
            ))}
          </div>
          {materials.length === 0 && (
            <p className="text-gray-500 text-center py-4">No materials available yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentMainPage;
