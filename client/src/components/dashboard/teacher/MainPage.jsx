import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import { PencilIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import SessionsSection from '../SessionsSection';

const TeacherMainPage = () => {
  const [materials, setMaterials] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialsRes, sessionsRes] = await Promise.all([
        axios.get('/api/materials'),
        axios.get('/api/sessions')
      ]);
      
      setMaterials(materialsRes.data);
      
      // Split sessions into upcoming and completed
      const now = new Date();
      const sessions = sessionsRes.data;
      
      setUpcomingSessions(
        sessions.filter(session => 
          session.status !== 'completed' && new Date(session.dateTime) >= now
        ).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      );
      
      setCompletedSessions(
        sessions.filter(session => 
          session.status === 'completed'
        ).sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
      );
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch dashboard data');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await axios.delete(`/api/materials/${id}`);
        toast.success('Material deleted successfully');
        fetchData(); // Refresh all data
      } catch (error) {
        toast.error('Failed to delete material');
      }
    }
  };

  const copyMaterialLink = (id) => {
    const materialUrl = `${window.location.origin}/dashboard/material/${id}`;
    navigator.clipboard.writeText(materialUrl)
      .then(() => toast.success('Material link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Semester Materials</h2>
            <button
              onClick={() => navigate('/dashboard/create-material')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Material
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <div
                key={material._id}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow relative group"
              >
                <div 
                  onClick={() => navigate(`/dashboard/material/${material._id}`)}
                  className="cursor-pointer"
                >
                  <h3 className="text-lg font-semibold text-gray-800">{material.title}</h3>
                  <p className="text-sm text-blue-600 mb-2">{material.subject}</p>
                  <p className="text-gray-600 text-sm mb-4">{material.description}</p>
                </div>
                
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyMaterialLink(material._id);
                    }}
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                    title="Copy material link"
                  >
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/edit-material/${material._id}`);
                    }}
                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit material"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(material._id);
                    }}
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete material"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {materials.length === 0 && (
            <p className="text-gray-500 text-center py-4">No materials available yet.</p>
          )}
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Sessions</h2>
          <button
            onClick={() => navigate('/dashboard/create-session')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Session
          </button>
        </div>

        <SessionsSection 
          title="Upcoming Sessions"
          sessions={upcomingSessions}
          type="upcoming"
        />

        <SessionsSection 
          title="Completed Sessions"
          sessions={completedSessions}
          type="completed"
        />
      </div>
    </Layout>
  );
};

export default TeacherMainPage;
