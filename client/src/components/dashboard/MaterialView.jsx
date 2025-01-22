import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axios';
import Layout from './Layout';
import { toast } from 'react-toastify';
import 'react-quill/dist/quill.snow.css';

const MaterialView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [material, setMaterial] = useState(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await axios.get(`/api/materials/${id}`);
        setMaterial(response.data);
      } catch (error) {
        toast.error('Failed to load material');
        navigate('/dashboard');
      }
    };

    fetchMaterial();
  }, [id, navigate]);

  if (!material) {
    return (
      <Layout userType={user?.role}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType={user?.role}>
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{material.title}</h1>
                <p className="mt-2 text-lg text-blue-600">{material.subject}</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
            <p className="mt-4 text-gray-600">{material.description}</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div 
              className="prose max-w-none ql-editor" 
              dangerouslySetInnerHTML={{ __html: material.content }}
            />
          </div>

          {/* Teacher Actions */}
          {user?.role === 'teacher' && (
            <div className="p-6 bg-gray-50 border-t">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => navigate(`/dashboard/edit-material/${material._id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Edit Material
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MaterialView;
