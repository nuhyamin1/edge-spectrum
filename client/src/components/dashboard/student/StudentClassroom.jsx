import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Layout from '../Layout';

const StudentClassroom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionDetails();
    // Poll for session status updates
    const interval = setInterval(fetchSessionDetails, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const response = await axios.get(`/api/sessions/${sessionId}`);
      setSession(response.data);
      
      // If session is completed, redirect to dashboard
      if (response.data.status === 'completed') {
        toast.info('This session has ended');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout userType="student">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading classroom...</div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout userType="student">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">Session not found</div>
        </div>
      </Layout>
    );
  }

  if (session.status !== 'active') {
    return (
      <Layout userType="student">
        <div className="flex justify-center items-center h-64">
          <div className="text-yellow-600">
            <p>This session is not currently active</p>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="student">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">{session.title}</h2>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
              Live Session
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Session Information</h3>
            <p className="text-gray-600">Subject: {session.subject}</p>
            <p className="text-gray-600">Teacher: {session.teacher?.name}</p>
            {session.startedAt && (
              <p className="text-gray-600">Started at: {new Date(session.startedAt).toLocaleString()}</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Classroom Features</h3>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-600">Interactive features will be available here:</p>
              <ul className="list-disc list-inside text-gray-600 mt-2">
                <li>Real-time chat</li>
                <li>Video conferencing</li>
                <li>Interactive whiteboard</li>
                <li>Screen sharing</li>
                <li>Participation tracking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentClassroom;
