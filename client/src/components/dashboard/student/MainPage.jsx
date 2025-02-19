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
      <div className="space-y-8">
        {/* Materials Section */}
        <section>
          <div className="section-title">
            <h2>Semester Materials</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {materials.slice(0, visibleMaterials).map((material) => (
              <div
                key={material._id}
                className="content-card group relative min-h-[200px] flex flex-col hover:border-blue-200"
              >
                <div 
                  onClick={() => navigate(`/dashboard/material/${material._id}`)}
                  className="cursor-pointer flex-1"
                >
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">{material.title}</h3>
                  <p className="text-sm text-blue-600 mb-3">{material.subject}</p>
                  <p className="text-slate-600 text-sm line-clamp-4">{material.description}</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyMaterialLink(material._id);
                    }}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Copy material link"
                  >
                    <DocumentDuplicateIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* See More Button */}
          {materials.length > visibleMaterials && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSeeMore}
                className="flex items-center gap-2 px-6 py-2.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                See More
                <ChevronDownIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {materials.length === 0 && (
            <p className="text-slate-500 text-center py-4">No materials available yet.</p>
          )}
        </section>

        {/* Sessions Section */}
        <section>
          <div className="section-title">
            <h2>Sessions</h2>
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
        </section>
      </div>
    </Layout>
  );
};

export default StudentMainPage;
