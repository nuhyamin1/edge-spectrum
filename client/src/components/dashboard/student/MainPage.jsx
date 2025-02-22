import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import SessionsSection from '../SessionsSection';

const StudentMainPage = () => {
  const [materials, setMaterials] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [visibleMaterials, setVisibleMaterials] = useState(6);
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

      setActiveSessions(
        sessions.filter(session => session.status === 'active')
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      );
      
      setUpcomingSessions(
        sessions.filter(session => session.status === 'scheduled')
          .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      );
      
      setCompletedSessions(
        sessions.filter(session => session.status === 'completed')
          .sort((a, b) => new Date(b.endedAt) - new Date(a.endedAt))
      );
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch dashboard data');
    }
  };

  const handleSeeMore = () => {
    setVisibleMaterials(prev => prev + 6);
  };

  return (
    <Layout userType="student">
      <div className="space-y-8">
        {/* Welcome Section will be included via Layout component */}

        {/* Materials Section */}
        <section>
          <div className="relative mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Available Materials
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.slice(0, visibleMaterials).map((material) => (
              <div
                key={material._id}
                onClick={() => navigate(`/dashboard/material/${material._id}`)}
                className="bg-white/80 backdrop-blur-sm rounded-xl p-6 
                border border-blue-200 hover:border-blue-400
                transition-all duration-300 group cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-transparent opacity-0 
                  group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
                
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
              </button>
            </div>
          )}
        </section>

        {/* Sessions Section */}
        <section className="space-y-8">
          <div className="relative mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              My Learning Sessions
            </h2>
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

export default StudentMainPage;