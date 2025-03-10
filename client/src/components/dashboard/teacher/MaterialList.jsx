import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../context/AuthContext';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../Layout';
import { MaterialListBase } from '../shared/MaterialListBase';
import { PencilIcon, TrashIcon, PlusCircleIcon, BookOpenIcon } from '@heroicons/react/24/outline';

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
      className="px-4 py-2 md:px-6 md:py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white 
      rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-1
      transition-all duration-300 text-sm md:text-base font-semibold
      flex items-center gap-1.5 md:gap-2"
    >
      <PlusCircleIcon className="w-4 h-4 md:w-5 md:h-5" />
      Create New Material
    </button>
  );

  const renderActions = (material) => (
    <div className="flex space-x-3">
      <button
        onClick={() => navigate(`/dashboard/edit-material/${material._id}`)}
        className="p-2.5 text-white bg-blue-500 hover:bg-blue-600 
        rounded-full shadow transition-all duration-200
        flex items-center justify-center group"
        aria-label="Edit material"
      >
        <PencilIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
      <button
        onClick={() => handleDelete(material._id)}
        className="p-2.5 text-white bg-red-500 hover:bg-red-600
        rounded-full shadow transition-all duration-200
        flex items-center justify-center group"
        aria-label="Delete material"
      >
        <TrashIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <Layout userType="teacher">
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p className="text-gray-600 font-medium animate-pulse">Loading materials...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="teacher">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpenIcon className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-800">Teaching Materials</h1>
        </div>
        <p className="text-gray-600">Manage your educational content and resources</p>
      </div>
      
      <MaterialListBase
        materials={materials}
        loading={loading}
        showCreateButton={createButton}
        renderActions={renderActions}
        onSearch={() => {}}
        onSubjectChange={() => {}}
        onMaterialClick={(materialId) => navigate(`/dashboard/material/${materialId}`)}
        className="bg-white rounded-xl shadow-md p-6 border border-gray-100
          [&>*]:py-4
          [&_li]:mb-3 [&_li]:bg-white
          [&_li]:border [&_li]:border-gray-200
          [&_li]:rounded-xl [&_li]:p-6
          [&_li]:transition-all [&_li]:duration-300
          [&_li]:hover:shadow-lg [&_li]:hover:border-blue-200
          [&_li]:hover:bg-gradient-to-r [&_li]:hover:from-blue-50 [&_li]:hover:to-white
          [&_li_h3]:text-xl [&_li_h3]:font-semibold [&_li_h3]:text-blue-700
          [&_li_p]:text-gray-600 [&_li_p]:mt-2
          [&_li]:cursor-pointer
          [&_li]:flex [&_li]:items-center [&_li]:justify-between
          last:[&_li]:mb-0"
      />
    </Layout>
  );
};

export default MaterialList;