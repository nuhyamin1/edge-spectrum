import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import { DocumentDuplicateIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import SessionsSection from '../SessionsSection';
import '../Dashboard.css';

const StudentMainPage = () => {
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
      const now = new Date();
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
        sessions.filter(session => 
          session.status === 'active'
        ).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      );
      
      // Upcoming sessions: status is "scheduled"
      setUpcomingSessions(
        sessions.filter(session => 
          session.status === 'scheduled'
        ).sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      );
      
      // Completed sessions: status is "completed"
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

  const copyMaterialLink = (id) => {
    const materialUrl = `${window.location.origin}/dashboard/material/${id}`;
    navigator.clipboard.writeText(materialUrl)
      .then(() => toast.success('Material link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'));
  };

  const handleSeeMore = () => {
    setVisibleMaterials(prev => prev + 8); // Show 4 more materials when clicked
  };

  return (
    <Layout userType="student">
      <div className="space-y-8">
        {/* Materials Section */}
        <section>
          <div className="relative mb-8">
            <h2 className="text-3xl font-bold text-gray-100">
              Semester Materials
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.slice(0, visibleMaterials).map((material) => (
              <div
                key={material._id}
                className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 
                border border-gray-700 hover:border-neon-blue/50
                transition-all duration-300 group flex flex-col
                hover:shadow-lg hover:shadow-neon-blue/20"
              >
                {/* Glossy overlay effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 
                  group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
                
                {/* Animated border gradient
                <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-blue-200/30 to-blue-300/30 
                  opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10
                  animate-once" /> */}

                <div 
                  onClick={() => navigate(`/dashboard/material/${material._id}`)}
                  className="cursor-pointer flex-1 relative"
                >
                  <h3 className="text-xl font-bold text-gray-100 mb-3 
                    group-hover:text-neon-blue transition-colors">
                    {material.title}
                  </h3>
                  <span className="inline-block px-3 py-1 bg-gray-700/50 text-gray-300 text-sm font-medium rounded-full mb-4">
                    {material.subject}
                  </span>
                  <p className="text-gray-400 text-sm line-clamp-4 leading-relaxed">
                    {material.description}
                  </p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-700/50 flex justify-end space-x-2 relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyMaterialLink(material._id);
                    }}
                    className="p-2.5 text-gray-400 hover:text-neon-blue 
                    rounded-lg transition-all duration-300 
                    hover:bg-gray-700/50 hover:shadow-md
                    active:scale-95 relative overflow-hidden"
                    title="Copy material link"
                  >
                    <div className="absolute inset-0 bg-gray-600/0 hover:bg-gray-600/10 transition-colors" />
                    <DocumentDuplicateIcon className="w-5 h-5 relative z-10" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {materials.length > visibleMaterials && (
            <div className="flex justify-center mt-8">
              <button
                onClick={handleSeeMore}
                className="text-neon-blue hover:text-neon-blue/80 transition-colors
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
          <div className="relative mb-8">
            <h2 className="text-3xl font-bold text-gray-100">
              Learning Sessions
            </h2>
          </div>

          <div className="space-y-6">
            {/* Active Sessions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 
              border border-gray-700 hover:border-neon-blue/50
              transition-all duration-300">
              <SessionsSection 
                title="Active Sessions"
                sessions={activeSessions}
                type="active"
              />
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 
              border border-gray-700 hover:border-neon-blue/50
              transition-all duration-300">
              <SessionsSection 
                title="Upcoming Sessions"
                sessions={upcomingSessions}
                type="upcoming"
              />
            </div>

            {/* Completed Sessions */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 
              border border-gray-700 hover:border-neon-blue/50
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

export default StudentMainPage;