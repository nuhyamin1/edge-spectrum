import React, { useEffect, useState } from 'react';
import Layout from '../Layout';
import axios from '../../../utils/axios';
import { useNavigate } from 'react-router-dom';
import SessionsSection from '../SessionsSection';

const StudentMainPage = () => {
  const [materials, setMaterials] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [completedSessions, setCompletedSessions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
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
      }
    };

    fetchData();
  }, []);

  return (
    <Layout userType="student">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Student Dashboard</h1>
          <p className="text-gray-600">
            Access your learning materials and join sessions from this dashboard.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Semester Materials</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {materials.map((material) => (
              <div 
                key={material._id} 
                className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/dashboard/material/${material._id}`)}
              >
                <h3 className="text-lg font-semibold text-gray-800">{material.title}</h3>
                <p className="text-sm text-blue-600 mb-2">{material.subject}</p>
                <p className="text-gray-600 text-sm">{material.description}</p>
              </div>
            ))}
          </div>
          {materials.length === 0 && (
            <p className="text-gray-500 text-center py-4">No materials available yet.</p>
          )}
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

export default StudentMainPage;
