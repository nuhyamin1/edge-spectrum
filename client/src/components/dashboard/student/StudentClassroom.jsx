import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Layout from '../Layout';
import io from 'socket.io-client';
import { useAuth } from '../../../context/AuthContext';
import VideoRoom from '../VideoRoom';
import Whiteboard from '../Whiteboard';
import { FaArrowLeft, FaHome, FaUserCheck, FaVideo, FaChalkboard, FaComments } from 'react-icons/fa';

const StudentClassroom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gracePeriodExpired, setGracePeriodExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [socket, setSocket] = useState(null);
  const hasEmittedJoin = useRef(false);
  const [activeTab, setActiveTab] = useState('attendance');

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        // Initialize socket connection
        const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000');
        setSocket(newSocket);

        // Wait for socket connection to be established
        await new Promise((resolve) => {
          newSocket.on('connect', () => {
            console.log('Socket connected:', newSocket.id);
            resolve();
          });
        });

        // Join the session room so that teacher clients can receive events
        newSocket.emit('join', { sessionId });

        // Delay emitting the studentJoinedClassroom event to allow the join event to be processed
        console.log('Waiting 100ms before emitting studentJoinedClassroom event...');
        setTimeout(() => {
          console.log('Emitting studentJoinedClassroom event:', {
            sessionId,
            studentId: user.id,
            studentName: user.name,
            studentEmail: user.email,
            studentProfilePicture: user.profilePicture
          });
          newSocket.emit('studentJoinedClassroom', {
            sessionId,
            studentId: user.id,
            studentName: user.name,
            studentEmail: user.email,
            studentProfilePicture: user.profilePicture
          });
          hasEmittedJoin.current = true;
        }, 100);

        // Listen for session updates
        newSocket.on('sessionUpdate', (data) => {
          if (data.sessionId === sessionId) {
            if (data.status === 'completed') {
              toast.info('The teacher has ended this session');
              navigate('/dashboard');
            }
          }
        });

        // Cleanup socket connection
        return () => {
          if (newSocket) {
            console.log('Disconnecting socket:', newSocket.id);
            newSocket.disconnect();
          }
        };
      } catch (error) {
        console.error('Socket initialization error:', error);
      }
    };

    initializeSocket();
  }, [sessionId, navigate, user.id, user.name, user.email, user.profilePicture]);

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

      // Check grace period only once during initialization
      const now = new Date();
      const endTime = new Date(gracePeriodInfo.endTime);
      if (now > endTime) {
        console.log('Cannot join - grace period has expired');
        toast.error('Cannot join - grace period has expired');
        navigate('/dashboard');
        return;
      }

      // Set up countdown display timer (won't kick out student)
      const interval = setInterval(() => {
        const now = new Date();
        const remaining = endTime - now;

        if (remaining <= 0) {
          console.log('Grace period countdown ended');
          clearInterval(interval);
          setGracePeriodExpired(true);
          setTimeLeft(0);
        } else {
          setTimeLeft(remaining);
        }
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

  if (!session) {
    return (
      <Layout userType="student">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">Session not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-4 border-r border-gray-700 space-y-8">
        {/* Home Button */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors duration-200"
          title="Back to Dashboard"
        >
          <FaHome size={24} />
        </button>

        {/* Divider */}
        <div className="w-8 border-t border-gray-700"></div>

        {/* Tab Icons */}
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'attendance' 
              ? 'text-blue-500 bg-gray-700' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Attendance Room"
        >
          <FaUserCheck size={24} />
        </button>

        <button 
          onClick={() => setActiveTab('video')}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'video' 
              ? 'text-blue-500 bg-gray-700' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Video Room"
        >
          <FaVideo size={24} />
        </button>

        <button 
          onClick={() => setActiveTab('whiteboard')}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'whiteboard' 
              ? 'text-blue-500 bg-gray-700' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Whiteboard"
        >
          <FaChalkboard size={24} />
        </button>

        <button 
          onClick={() => setActiveTab('discussion')}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'discussion' 
              ? 'text-blue-500 bg-gray-700' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Discussion Room"
          disabled={true}
        >
          <FaComments size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold">
                {session?.title || 'Loading...'}
              </h1>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-grow overflow-y-auto">
          {activeTab === 'attendance' && (
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">Attendance Status</h2>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-sm text-gray-600">
                  Your attendance has been recorded for this session.
                </p>
              </div>
            </div>
          )}
          {activeTab === 'video' && (
            <VideoRoom sessionId={sessionId} isTeacher={false} session={session} />
          )}
          {activeTab === 'whiteboard' && (
            <Whiteboard sessionId={sessionId} />
          )}
          {activeTab === 'discussion' && (
            <div className="p-4">
              <h2 className="text-lg font-semibold">Discussion Room</h2>
              <p className="text-gray-500">Coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentClassroom;
