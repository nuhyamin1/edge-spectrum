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
    setVisibleMaterials(prev => prev + 4); // Show 4 more materials when clicked
  };

  return (
    <Layout userType="student">
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-200 to-blue-400 p-8 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 left-0 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-75" />
        
        <div className="space-y-32 relative z-10">
          {/* Materials Section */}
          <section>
            <div className="relative mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                Semester Materials
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {materials.slice(0, visibleMaterials).map((material) => (
                <div
                  key={material._id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 
                  border-l-4 border-blue-300 hover:border-blue-400
                  transition-all duration-300 group flex flex-col min-h-[220px]
                  shadow-[0_8px_30px_rgba(147,197,253,0.15)]
                  hover:shadow-[0_12px_40px_rgba(147,197,253,0.25)]
                  hover:transform hover:-translate-y-1
                  relative overflow-hidden isolate"
                >
                  {/* Glossy overlay effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0 
                    group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  {/* Animated border gradient */}
                  <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-blue-200/50 to-blue-300/50 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10
                    animate-[shimmer_2s_infinite]" />

                  <div 
                    onClick={() => navigate(`/dashboard/material/${material._id}`)}
                    className="cursor-pointer flex-1 relative"
                  >
                    <h3 className="text-xl font-bold text-blue-900 mb-3 
                      group-hover:text-blue-700 transition-colors">
                      {material.title}
                    </h3>
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full mb-4">
                      {material.subject}
                    </span>
                    <p className="text-slate-700/90 text-sm line-clamp-4 leading-relaxed">
                      {material.description}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-blue-100/50 flex justify-end space-x-2 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyMaterialLink(material._id);
                      }}
                      className="p-2.5 text-blue-500 hover:text-blue-700 
                      rounded-lg transition-all duration-300 
                      hover:bg-blue-50/80 hover:shadow-md
                      active:scale-95 relative overflow-hidden"
                      title="Copy material link"
                    >
                      <div className="absolute inset-0 bg-blue-500/0 hover:bg-blue-500/10 transition-colors" />
                      <DocumentDuplicateIcon className="w-5 h-5 relative z-10" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* See More Link */}
            {materials.length > visibleMaterials && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleSeeMore}
                  className="flex items-center gap-2 relative group"
                >
                  <span className="text-lg bg-gradient-to-r from-blue-600 to-blue-400 
                    bg-clip-text text-transparent font-medium hover:from-blue-700 
                    hover:to-blue-500 transition-all duration-300">
                    See more materials
                  </span>
                  <ChevronDownIcon className="w-5 h-5 text-blue-500 group-hover:text-blue-700
                    transition-all duration-300 transform 
                    animate-float group-hover:translate-y-1" />
                  
                  {/* Animated underline effect */}
                  <div className="absolute -bottom-1 left-0 w-0 h-0.5 
                    bg-gradient-to-r from-blue-600/50 to-blue-400/50 
                    group-hover:w-full transition-all duration-500 ease-out" />
                </button>
              </div>
            )}

            {materials.length === 0 && (
              <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl 
                border-2 border-dashed border-blue-200">
                <p className="text-slate-500/90 text-lg font-light">
                  No materials available yet.
                </p>
              </div>
            )}
          </section>

          {/* Sessions Section */}
          <section className="space-y-12">
            <div className="relative mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-blue-600 
                bg-clip-text text-transparent">
                Learning Sessions
              </h1>
              {/* Decorative element */}
              <div className="absolute -left-4 -top-4 w-20 h-20 bg-blue-200/30 rounded-full 
                blur-2xl animate-pulse z-0" />
            </div>
            
            <div className="space-y-6 relative">
              {/* Active Sessions */}
              <div className="group">
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8 
                  shadow-[0_8px_30px_rgba(147,197,253,0.2)]
                  hover:shadow-[0_15px_35px_rgba(147,197,253,0.25)]
                  transition-all duration-500 ease-out
                  border border-blue-100/50 relative overflow-hidden">
                  {/* Gradient accent */}
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b 
                    from-green-400 to-blue-400 rounded-l" />
                  <SessionsSection 
                    title="Active Sessions"
                    sessions={activeSessions}
                    type="active"
                  />
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="group">
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8
                  shadow-[0_8px_30px_rgba(147,197,253,0.2)]
                  hover:shadow-[0_15px_35px_rgba(147,197,253,0.25)]
                  transition-all duration-500 ease-out
                  border border-blue-100/50 relative overflow-hidden">
                  {/* Gradient accent */}
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b 
                    from-blue-400 to-purple-400 rounded-l" />
                  <SessionsSection 
                    title="Upcoming Sessions"
                    sessions={upcomingSessions}
                    type="upcoming"
                  />
                </div>
              </div>

              {/* Completed Sessions */}
              <div className="group">
                <div className="bg-white/90 backdrop-blur-lg rounded-2xl p-8
                  shadow-[0_8px_30px_rgba(147,197,253,0.2)]
                  hover:shadow-[0_15px_35px_rgba(147,197,253,0.25)]
                  transition-all duration-500 ease-out
                  border border-blue-100/50 relative overflow-hidden">
                  {/* Gradient accent */}
                  <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b 
                    from-gray-400 to-blue-300 rounded-l" />
                  <SessionsSection 
                    title="Completed Sessions"
                    sessions={completedSessions}
                    type="completed"
                  />
                </div>
              </div>

              {/* Decorative background elements */}
              <div className="absolute -right-40 top-1/3 w-80 h-80 bg-blue-200/20 
                rounded-full blur-3xl animate-pulse-slow" />
              <div className="absolute -left-40 bottom-1/4 w-80 h-80 bg-blue-300/20 
                rounded-full blur-3xl animate-pulse-slow delay-1000" />
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default StudentMainPage;