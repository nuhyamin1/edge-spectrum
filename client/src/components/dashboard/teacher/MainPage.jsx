import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import { 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon, 
  ChevronDownIcon,
  AcademicCapIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import SessionsSection from '../SessionsSection';

const TeacherMainPage = () => {
  const [materials, setMaterials] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]); // New state for active sessions
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [visibleMaterials, setVisibleMaterials] = useState(6); // Show first 4 materials
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
    setVisibleMaterials(prev => prev + 6); // Show 4 more materials when clicked
  };

  return (
    <Layout userType="teacher">
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
          <div className="relative px-8 py-16 md:px-12 lg:px-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6">
              Welcome to PF Speaking Master
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mb-8">
              Empower your students with interactive tools and real-time feedback for effective language learning.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/dashboard/create-session')}
                className="bg-white text-blue-900 px-6 py-3 rounded-md font-medium hover:bg-blue-50 transition-colors"
              >
                Create Session
              </button>
              <button 
                onClick={() => navigate('/dashboard/create-material')}
                className="border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white/10 transition-colors"
              >
                Create Material
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <AcademicCapIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Session Management</h3>
            <p className="text-gray-600">Create and manage interactive learning sessions with comprehensive tools.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Student Progress</h3>
            <p className="text-gray-600">Track and monitor your students' learning journey and achievements.</p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Analytics Dashboard</h3>
            <p className="text-gray-600">Access detailed insights and analytics about your teaching impact.</p>
          </div>
        </div>

        {/* Materials Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-serif text-gray-900 mb-2">Semester Materials</h2>
              <div className="h-1 w-20 bg-blue-600 rounded"></div>
            </div>
            <button
              onClick={() => navigate('/dashboard/create-material')}
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
            >
              <PencilIcon className="w-5 h-5" />
              Create Material
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.slice(0, visibleMaterials).map((material) => (
              <div
                key={material._id}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 
                border border-blue-200 hover:border-blue-400
                transition-all duration-100 group flex flex-col
                hover:shadow-lg hover:shadow-blue-400/20"
              >
                {/* Glossy overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 
                  group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
                
                {/* Animated border gradient
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-blue-50/50 to-blue-70/50 
                opacity-0 group-hover:opacity-100 transition-opacity duration-50 -z-10
                animate-once" /> */}

                <div 
                  onClick={() => navigate(`/dashboard/material/${material._id}`)}
                  className="cursor-pointer flex-1 relative"
                >
                  <h3 className="text-xl font-bold text-gray-900 mb-3 
                    group-hover:text-blue-600 transition-colors">
                    {material.title}
                  </h3>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 text-sm font-medium rounded-full mb-4">
                    {material.subject}
                  </span>
                  <p className="text-gray-600 text-sm line-clamp-4 leading-relaxed">
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
                    hover:bg-blue-50 hover:shadow-md
                    active:scale-95 relative overflow-hidden"
                    title="Copy material link"
                  >
                    <DocumentDuplicateIcon className="w-5 h-5 relative z-10" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/edit-material/${material._id}`);
                    }}
                    className="p-2.5 text-blue-500 hover:text-blue-700 
                    rounded-lg transition-all duration-300 
                    hover:bg-blue-50 hover:shadow-md
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
                    hover:bg-red-50 hover:shadow-md
                    active:scale-95"
                    title="Delete material"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {materials.length > visibleMaterials && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleSeeMore}
                className="text-blue-600 hover:text-blue-700 transition-colors
                flex items-center gap-2"
              >
                See more materials
                <ChevronDownIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </section>

        {/* Sessions Section */}
        <section className="space-y-8">
          <div className="relative mb-8 flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-900">
              Teaching Sessions
            </h2>
            <button
              onClick={() => navigate('/dashboard/create-session')}
              className="bg-blue-400 text-white px-6 py-2.5 rounded-lg 
              hover:bg-blue-500 transition-all duration-300 
              flex items-center gap-2 group border border-blue-300"
            >
              <PencilIcon className="w-5 h-5" />
              Create Session
            </button>
          </div>

          <div className="space-y-6">
            {/* Active Sessions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 
              border border-blue-200 hover:border-blue-400
              transition-all duration-300">
              <SessionsSection 
                title="Active Sessions"
                sessions={activeSessions}
                type="active"
              />
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 
              border border-blue-200 hover:border-blue-400
              transition-all duration-300">
              <SessionsSection 
                title="Upcoming Sessions"
                sessions={upcomingSessions}
                type="upcoming"
              />
            </div>

            {/* Completed Sessions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 
              border border-blue-200 hover:border-blue-400
              transition-all duration-300">
              <SessionsSection 
                title="Completed Sessions"
                sessions={completedSessions}
                type="completed"
              />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default TeacherMainPage;