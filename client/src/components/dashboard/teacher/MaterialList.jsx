import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../context/AuthContext';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../Layout';
import { MaterialListBase } from '../shared/MaterialListBase';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const MaterialList = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load materials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (materialId) => {
    if (!window.confirm('Are you sure you want to delete this material?')) {
      return;
    }

    try {
      await api.delete(`/materials/${materialId}`);
      toast.success('Material deleted successfully');
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Failed to delete material');
    }
  };

  const createButton = (
    <button
      onClick={() => navigate('/dashboard/create-material')}
      className="px-6 py-2.5 bg-blue-500 text-white rounded-lg 
      hover:bg-blue-600 transition-all duration-300 
      border border-blue-400 
      hover:shadow-lg hover:shadow-blue-400/20
      flex items-center gap-2"
    >
      <PencilIcon className="w-5 h-5" />
      Create New Material
    </button>
  );

  const renderActions = (material) => (
    <div className="ml-6 flex space-x-2">
      <button
        onClick={() => navigate(`/dashboard/edit-material/${material._id}`)}
        className="p-2 text-blue-600 hover:text-blue-700 transition-colors
        rounded-lg hover:bg-blue-50"
      >
        <PencilIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => handleDelete(material._id)}
        className="p-2 text-red-500 hover:text-red-600 transition-colors
        rounded-lg hover:bg-red-50"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout userType="teacher">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="teacher">
      <MaterialListBase
        materials={materials}
        loading={loading}
        showCreateButton={createButton}
        renderActions={renderActions}
        onSearch={() => {}}
        onSubjectChange={() => {}}
        onMaterialClick={(materialId) => navigate(`/dashboard/material/${materialId}`)}
      />
    </Layout>
  );
};

export default MaterialList; 