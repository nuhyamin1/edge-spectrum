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
  const [gracePeriodExpired, setGracePeriodExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);

  const getGracePeriodInfo = () => {
    const storageKey = `gracePeriod_${sessionId}`;
    console.log('Looking for grace period info with key:', storageKey);
    
    try {
      // Try to get the data multiple times with a small delay
      let attempts = 0;
      const maxAttempts = 3;
      const checkStorage = () => {
        const storedData = sessionStorage.getItem(storageKey);
        console.log(`Attempt ${attempts + 1}: Stored data:`, storedData);
        
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          console.log('Successfully parsed grace period info:', parsedData);
          return parsedData;
        }
        
        if (++attempts < maxAttempts) {
          console.log(`Retrying... (${attempts}/${maxAttempts})`);
          return new Promise(resolve => setTimeout(() => resolve(checkStorage()), 100));
        }
        
        return null;
      };
      
      return checkStorage();
    } catch (error) {
      console.error('Error getting grace period info:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('StudentClassroom mounted with sessionId:', sessionId);
    
    const initializeClassroom = async () => {
      const gracePeriodInfo = await getGracePeriodInfo();
      
      if (!gracePeriodInfo || gracePeriodInfo.sessionId !== sessionId) {
        console.error('Grace period info not found or invalid:', { gracePeriodInfo, sessionId });
        toast.error('Session information not found');
        navigate('/dashboard');
        return;
      }

      // Set up grace period timer
      const endTime = new Date(gracePeriodInfo.endTime);
      console.log('Setting up timer with end time:', endTime);

      const interval = setInterval(() => {
        const now = new Date();
        const remaining = endTime - now;

        if (remaining <= 0) {
          console.log('Grace period expired');
          clearInterval(interval);
          setGracePeriodExpired(true);
          toast.error('Grace period has expired');
          navigate('/dashboard');
          return;
        }

        setTimeLeft(remaining);
      }, 1000);

      // Fetch session details
      try {
        const response = await axios.get(`/api/sessions/${sessionId}`);
        console.log('Session details received:', response.data);
        
        if (response.data.status === 'completed') {
          clearInterval(interval);
          toast.info('This session has ended');
          navigate('/dashboard');
          return;
        }
        
        if (response.data.status !== 'active') {
          clearInterval(interval);
          toast.error('This session is not currently active');
          navigate('/dashboard');
          return;
        }

        setSession(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching session:', error);
        clearInterval(interval);
        toast.error('Failed to load session details');
        navigate('/dashboard');
      }

      // Clean up
      return () => {
        clearInterval(interval);
        sessionStorage.removeItem(`gracePeriod_${sessionId}`);
      };
    };

    initializeClassroom();
  }, [sessionId, navigate]);

  const formatTimeLeft = (ms) => {
    if (!ms) return '';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s remaining`;
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

  if (!session || gracePeriodExpired) {
    return (
      <Layout userType="student">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">
            {gracePeriodExpired ? 'Grace period has expired' : 'Session not found'}
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
            <div className="flex items-center gap-4">
              <span className="text-sm text-blue-600">{formatTimeLeft(timeLeft)}</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                Live Session
              </span>
            </div>
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

          <div className="space-y-6">
            {/* Chat Section */}
            <div className="border rounded-lg p-4">
              <h4 className="text-lg font-medium mb-4">Class Chat</h4>
              <div className="h-64 bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-gray-500 text-center">Chat messages will appear here</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Send
                </button>
              </div>
            </div>

            {/* Video Section */}
            <div className="border rounded-lg p-4">
              <h4 className="text-lg font-medium mb-4">Video Stream</h4>
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Video stream will appear here</p>
              </div>
            </div>

            {/* Materials Section */}
            {session.materials && (
              <div className="border rounded-lg p-4">
                <h4 className="text-lg font-medium mb-4">Session Materials</h4>
                <a
                  href={session.materials}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Materials
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentClassroom;
