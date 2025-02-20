import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import { PencilIcon, TrashIcon, DocumentDuplicateIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import SessionsSection from '../SessionsSection';

const TeacherMainPage = () => {
  const [materials, setMaterials] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]); // New state for active sessions
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [visibleMaterials, setVisibleMaterials] = useState(4); // Show first 4 materials
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
      
      // Split sessions into active, upcoming and completed
      const sessions = sessionsRes.data;
      
      // Helper function to safely parse dates
      const parseDate = (dateString) => {
        if (!dateString) return null;
        try {
          return new Date(dateString);
        } catch (e) {
          console.error("Error parsing date:", dateString, e);
          return null;
        }
      };
      
      // Active sessions: status is "active"
      setActiveSessions(
        sessions.filter(session => session.status === 'active')
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      );
      
      // Upcoming sessions: status is "scheduled"
      setUpcomingSessions(
        sessions.filter(session => session.status === 'scheduled')
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      );
      
      // Completed sessions: status is "completed"
      setCompletedSessions(
        sessions.filter(session => session.status === 'completed')
          .sort((a, b) => {
            const endedAtA = parseDate(a.endedAt) || parseDate(a.endTime);
            const endedAtB = parseDate(b.endedAt) || parseDate(b.endTime);
            if (!endedAtA || !endedAtB) return 0;
            return endedAtB - endedAtA; // Most recent first
          })
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

  const handleSeeMore = () => {
    setVisibleMaterials(prev => prev + 4); // Show 4 more materials when clicked
  };

  return (
    <Layout userType="teacher">
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 p-6">
        <div className="space-y-12">
          {/* Materials Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-extrabold text-blue-800">
                Semester Materials
              </h2>
              <button
                onClick={() => navigate('/dashboard/create-material')}
                className="bg-blue-300 text-white px-6 py-2.5 rounded-lg hover:bg-blue-400 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Create Material
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {materials.slice(0, visibleMaterials).map((material) => (
                <div
                  key={material._id}
                  className="bg-white/90 backdrop-blur-sm rounded-xl p-6 
                  border-2 border-transparent hover:border-blue-300/50
                  transition-all duration-300 group flex flex-col min-h-[200px]
                  shadow-[0_4px_20px_-1px_rgba(0,0,0,0.1)] 
                  hover:shadow-[0_8px_30px_rgb(219,234,254,0.3)]
                  hover:transform hover:-translate-y-1
                  relative overflow-hidden"
                >
                  {/* Add decorative highlight effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100/10 to-blue-300/10 opacity-0 
                    group-hover:opacity-100 transition-opacity duration-300" 
                  />
                  <div className="absolute -inset-x-1 -inset-y-1 bg-gradient-to-r from-transparent via-blue-200/20 to-transparent 
                    group-hover:animate-shimmer" 
                  />

                  <div 
                    onClick={() => navigate(`/dashboard/material/${material._id}`)}
                    className="cursor-pointer flex-1 relative"
                  >
                    <h3 className="text-xl font-semibold text-blue-800 mb-3 
                      group-hover:text-blue-600 transition-colors">
                      {material.title}
                    </h3>
                    <p className="text-sm text-blue-600 mb-3 font-medium">{material.subject}</p>
                    <p className="text-slate-600 text-sm line-clamp-4 leading-relaxed">
                      {material.description}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-blue-100 flex justify-end space-x-2 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyMaterialLink(material._id);
                      }}
                      className="p-2.5 text-blue-500 hover:text-blue-700 
                      rounded-lg transition-all duration-300 
                      hover:bg-blue-50/80 hover:shadow-lg
                      active:scale-95"
                      title="Copy material link"
                    >
                      <DocumentDuplicateIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/dashboard/edit-material/${material._id}`);
                      }}
                      className="p-2.5 text-blue-500 hover:text-blue-700 
                      rounded-lg transition-all duration-300 
                      hover:bg-blue-50/80 hover:shadow-lg
                      active:scale-95"
                      title="Edit material"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(material._id);
                      }}
                      className="p-2.5 text-red-500 hover:text-red-700 
                      rounded-lg transition-all duration-300 
                      hover:bg-red-50/80 hover:shadow-lg
                      active:scale-95"
                      title="Delete material"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* See More Button */}
            {materials.length > visibleMaterials && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleSeeMore}
                  className="flex items-center gap-2 bg-blue-300/80 backdrop-blur-sm text-white 
                  px-8 py-3 rounded-lg hover:bg-blue-400 transition-all duration-300 
                  shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  See More
                  <ChevronDownIcon className="w-5 h-5 animate-bounce" />
                </button>
              </div>
            )}

            {materials.length === 0 && (
              <p className="text-slate-500 text-center py-8 bg-white/50 backdrop-blur-sm rounded-lg">
                No materials available yet.
              </p>
            )}
          </section>

          {/* Sessions Section */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-extrabold text-blue-800">
                Sessions
              </h2>
              <button
                onClick={() => navigate('/dashboard/create-session')}
                className="bg-blue-300 text-white px-6 py-2.5 rounded-lg hover:bg-blue-400 
                transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Create Session
              </button>
            </div>
            <div className="space-y-12">
              <div>
                <SessionsSection 
                  title="Active Sessions"
                  sessions={activeSessions}
                  type="active"
                />
              </div>
              <div>
                <SessionsSection 
                  title="Upcoming Sessions"
                  sessions={upcomingSessions}
                  type="upcoming"
                />
              </div>
              <div>
                <SessionsSection 
                  title="Completed Sessions"
                  sessions={completedSessions}
                  type="completed"
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherMainPage;
