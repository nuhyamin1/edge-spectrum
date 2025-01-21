import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';

const TeacherMainPage = () => {
  const [materials, setMaterials] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get('/api/materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await axios.delete(`/api/materials/${id}`);
        toast.success('Material deleted successfully');
        fetchMaterials(); // Refresh the list
      } catch (error) {
        toast.error('Failed to delete material');
      }
    }
  };

  return (
    <Layout userType="teacher">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Teacher Dashboard</h1>
          <p className="text-gray-600">
            Manage your sessions and materials from this dashboard.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Semester Materials</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <div 
                key={material._id} 
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div 
                  onClick={() => navigate(`/dashboard/material/${material._id}`)}
                  className="cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-800">{material.title}</h3>
                  <p className="text-sm text-blue-600 mb-2">{material.subject}</p>
                  <p className="text-gray-600 text-sm mb-4">{material.description}</p>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/edit-material/${material._id}`);
                    }}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(material._id);
                    }}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {materials.length === 0 && (
            <p className="text-gray-500 text-center py-4">No materials created yet.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TeacherMainPage;
