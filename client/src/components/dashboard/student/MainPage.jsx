import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../Layout';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import { DocumentDuplicateIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import SessionsSection from '../SessionsSection';
import { MicrophoneIcon, UserGroupIcon, ChartBarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import PronunciationChecker from '../PronunciationChecker';
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
        axios.get('/api/sessions?include=enrolledStudents')
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
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-900 to-blue-700 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
          <div className="relative px-8 py-16 md:px-12 lg:px-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white mb-6">
              Welcome to PF Speaking Master
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mb-8">
              Master speaking with real-time feedback and interactive tools designed for immersive learning.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/dashboard/active-sessions')}
                className="bg-white text-blue-900 px-6 py-3 rounded-md font-medium hover:bg-blue-50 transition-colors"
              >
                Start Learning
              </button>
              <button 
                onClick={() => navigate('/dashboard/available-sessions')}
                className="border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white/10 transition-colors"
              >
                Find Classes
              </button>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-100 border border-gray-400 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <MicrophoneIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Real-Time Feedback</h3>
            <p className="text-gray-600">Get instant pronunciation and fluency insights to improve your speaking skills.</p>
          </div>
          <div className="bg-gray-100 border border-gray-400 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Interactive Sessions</h3>
            <p className="text-gray-600">Join live sessions with teachers and peers for collaborative learning.</p>
          </div>
          <div className="bg-gray-100 border border-gray-400 p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Progress Tracking</h3>
            <p className="text-gray-600">Monitor your improvement with detailed analytics and insights.</p>
          </div>
        </div>

        {/* Pronunciation Checker Section */}
        <PronunciationChecker />

        {/* Latest Materials Section */}
        <div className="bg-white rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-serif text-gray-900 mb-2">Latest Materials</h2>
              <div className="h-1 w-20 bg-blue-600 rounded"></div>
            </div>
            <Link
              to="/dashboard/student/materials"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View All
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {materials.slice(0, 3).map((material) => (
              <div key={material._id} className="border rounded-lg p-6 hover:shadow-md transition-shadow hover:border-blue-200">
                <h3 className="font-medium text-lg mb-2">{material.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{material.description}</p>
                <Link
                  to={`/dashboard/material/${material._id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Learn More →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-serif text-gray-900 mb-2">Upcoming Sessions</h2>
              <div className="h-1 w-20 bg-blue-600 rounded"></div>
            </div>
            <Link
              to="/dashboard/available-sessions"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
            >
              View All
              <ArrowRightIcon className="w-4 h-4 ml-1" />
            </Link>
          </div>
          {upcomingSessions ? (
            <SessionsSection sessions={upcomingSessions} type="upcoming" />
          ) : (
            <p className="text-gray-500 text-center py-8">Loading sessions...</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentMainPage;
