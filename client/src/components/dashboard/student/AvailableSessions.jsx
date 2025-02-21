import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import Layout from '../Layout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const AvailableSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolledSessions, setEnrolledSessions] = useState([]);
  const [error, setError] = useState(null);
  const [gracePeriodTimers, setGracePeriodTimers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setError(null);
        const [availableResponse, enrolledResponse] = await Promise.all([
          axios.get('/api/sessions/available'),
          axios.get('/api/sessions/enrolled')
        ]);

        if (availableResponse.data) {
          setSessions(availableResponse.data);
          // Initialize grace period timers for active sessions
          const timers = {};
          availableResponse.data.forEach(session => {
            if (session.status === 'active' && session.startedAt) {
              updateGracePeriodTimer(session._id, new Date(session.startedAt), session.gracePeriod);
            }
          });
          setGracePeriodTimers(timers);
        }
        
        if (enrolledResponse.data) {
          setEnrolledSessions(enrolledResponse.data.map(session => session._id));
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to load available sessions';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    // Set up Socket.IO connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true
    });

    // Handle session updates
    socket.on('sessionUpdate', (data) => {
      switch (data.type) {
        case 'statusUpdate':
          setSessions(prevSessions => {
            const updatedSessions = prevSessions.map(session => {
              if (session._id === data.sessionId) {
                // Get the current time in ISO format
                const now = new Date().toISOString();
                const updatedSession = { 
                  ...session, 
                  status: data.status,
                  startedAt: data.status === 'active' ? now : session.startedAt 
                };
                
                // Initialize timer if session becomes active
                if (data.status === 'active') {
                  console.log('Session became active:', updatedSession);
                  updateGracePeriodTimer(session._id, new Date(), session.gracePeriod);
                }
                return updatedSession;
              }
              return session;
            });
            return updatedSessions;
          });
          break;

        case 'sessionCreated':
          // Only add if the session is in the future
          const currentDate = new Date();
          const sessionDate = new Date(data.session.dateTime);
          if (sessionDate > currentDate) {
            setSessions(prevSessions => [...prevSessions, data.session].sort((a, b) => 
              new Date(a.dateTime) - new Date(b.dateTime)
            ));
          }
          break;

        case 'sessionDeleted':
          setSessions(prevSessions => 
            prevSessions.filter(session => session._id !== data.sessionId)
          );
          // Clear timer if exists
          if (gracePeriodTimers[data.sessionId]?.interval) {
            clearInterval(gracePeriodTimers[data.sessionId].interval);
            setGracePeriodTimers(prev => {
              const newTimers = { ...prev };
              delete newTimers[data.sessionId];
              return newTimers;
            });
          }
          break;

        default:
          break;
      }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Real-time updates connection failed');
    });

    // Cleanup function to clear all intervals
    return () => {
      Object.values(gracePeriodTimers).forEach(timer => {
        if (timer.interval) clearInterval(timer.interval);
      });
      socket.disconnect();
    };
  }, []);

  const updateGracePeriodTimer = (sessionId, startTime, gracePeriod) => {
    const endTime = new Date(startTime.getTime() + gracePeriod * 60000);
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const timeLeft = endTime - now;
      
      if (timeLeft <= 0) {
        if (gracePeriodTimers[sessionId]?.interval) {
          clearInterval(gracePeriodTimers[sessionId].interval);
        }
        setGracePeriodTimers(prev => ({
          ...prev,
          [sessionId]: { timeLeft: 0, interval: null }
        }));
        return 0;
      }
      
      return timeLeft;
    };

    const interval = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setGracePeriodTimers(prev => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], timeLeft }
      }));
    }, 1000);

    setGracePeriodTimers(prev => ({
      ...prev,
      [sessionId]: { timeLeft: calculateTimeLeft(), interval }
    }));
  };

  const formatTimeLeft = (timeLeft) => {
    if (timeLeft <= 0) return 'Grace period expired';
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}m ${seconds}s remaining`;
  };

  const handleEnrollment = async (sessionId, isEnrolled) => {
    try {
      const endpoint = isEnrolled ? 'unenroll' : 'enroll';
      await axios.post(`/api/sessions/${sessionId}/${endpoint}`);
      
      if (isEnrolled) {
        setEnrolledSessions(enrolledSessions.filter(id => id !== sessionId));
        toast.success('Successfully unenrolled from session');
      } else {
        setEnrolledSessions([...enrolledSessions, sessionId]);
        toast.success('Successfully enrolled in session');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to update enrollment';
      toast.error(errorMessage);
    }
  };

  const handleJoinSession = (session) => {
    try {
      console.log('Attempting to join session:', session);
      
      // Check if session is active
      if (session.status !== 'active') {
        toast.error('This session is not currently active');
        return;
      }

      if (!session.startedAt) {
        console.error('Session startedAt is missing:', session);
        toast.error('Session start time information is missing');
        return;
      }

      // Calculate if within grace period
      const startTime = new Date(session.startedAt);
      const currentTime = new Date();
      const gracePeriodEnd = new Date(startTime.getTime() + (session.gracePeriod * 60000));

      console.log('Grace period calculation:', {
        startTime,
        currentTime,
        gracePeriodEnd,
        gracePeriod: session.gracePeriod
      });

      if (currentTime > gracePeriodEnd) {
        toast.error('Grace period has expired for this session');
        return;
      }

      // Store grace period info in sessionStorage
      const storageKey = `gracePeriod_${session._id}`;
      const gracePeriodInfo = {
        startedAt: session.startedAt,
        gracePeriod: session.gracePeriod,
        endTime: gracePeriodEnd.toISOString(),
        sessionId: session._id
      };

      console.log('Storing grace period info:', gracePeriodInfo);
      
      // Store the data and verify it was stored correctly
      sessionStorage.setItem(storageKey, JSON.stringify(gracePeriodInfo));
      const storedData = sessionStorage.getItem(storageKey);
      
      if (!storedData) {
        console.error('Failed to store session data');
        toast.error('Failed to prepare session data');
        return;
      }

      console.log('Verified stored data:', storedData);
      console.log('Navigating to classroom...');

      // If within grace period and data is stored, proceed to join
      navigate(`/classroom/${session._id}`);
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
    }
  };

  if (loading) {
    return (
      <Layout userType="student">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading sessions...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout userType="student">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">
            <p>Error: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="student">
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-gray-200">Available Sessions</h2>
        </div>
        
        <div className="divide-y divide-gray-700">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No available sessions at the moment
            </div>
          ) : (
            sessions.map((session) => {
              const isEnrolled = enrolledSessions.includes(session._id);
              const status = session.status || 'scheduled';
              const isActive = status === 'active';
              const isCompleted = status === 'completed';
              
              return (
                <div key={session._id} 
                  className="relative group p-6 hover:bg-gray-800/30 transition-all duration-300"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-200">{session.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isActive ? 'bg-green-100 text-green-800' :
                          isCompleted ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        {session.subject} • Taught by {session.teacher?.name || 'Unknown Teacher'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">{session.description}</p>
                      <div className="mt-2 text-sm text-gray-400">
                        <span>Duration: {session.duration} mins</span>
                        <span className="mx-2">•</span>
                        <span>Grace Period: {session.gracePeriod || 5} mins</span>
                      </div>
                      {session.materials && (
                        <a 
                          href={session.materials} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-400 hover:text-blue-300 mt-2 inline-block"
                        >
                          View Materials
                        </a>
                      )}
                      {session.status === 'active' && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-blue-400">
                            Session is active!
                          </p>
                          <p className="text-sm text-gray-400">
                            Grace period: {gracePeriodTimers[session._id] ? 
                              formatTimeLeft(gracePeriodTimers[session._id].timeLeft) :
                              `${session.gracePeriod} minutes`}
                          </p>
                          {session.startedAt && (
                            <p className="text-xs text-gray-500">
                              Started at: {new Date(session.startedAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {new Date(session.dateTime).toLocaleString()}
                      </p>
                      <div className="flex flex-col gap-2">
                        {!isCompleted && (
                          <button
                            onClick={() => handleEnrollment(session._id, isEnrolled)}
                            className={`px-4 py-2 rounded-lg transition-all duration-300
                              ${isEnrolled ? 
                                'bg-red-400/10 text-red-400 border border-red-400/20 hover:bg-red-400/20 hover:border-red-400/50' :
                                'bg-green-400/10 text-green-400 border border-green-400/20 hover:bg-green-400/20 hover:border-green-400/50'
                              }`}
                          >
                            {isEnrolled ? 'Leave' : 'Enroll'}
                          </button>
                        )}

                        {isActive && isEnrolled && (
                          <button
                            onClick={() => handleJoinSession(session)}
                            className="px-4 py-2 rounded-lg bg-neon-blue/10 text-neon-blue
                              border border-neon-blue/20 hover:bg-neon-blue/20 hover:border-neon-blue/50
                              transition-all duration-300"
                          >
                            Join Live
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AvailableSessions;
