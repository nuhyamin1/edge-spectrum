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
      if (data.type === 'statusUpdate') {
        setSessions(prevSessions => 
          prevSessions.map(session => 
            session._id === data.sessionId 
              ? { ...session, status: data.status }
              : session
          )
        );
      }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Real-time updates connection failed');
    });

    // Cleanup socket connection on component unmount
    return () => {
      socket.disconnect();
    };
  }, []);

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

  const handleJoinSession = (sessionId) => {
    navigate(`/student/classroom/${sessionId}`);
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
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Available Sessions</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {sessions.length === 0 ? (
            <div className="p-6 text-center text-gray-600">
              No available sessions at the moment
            </div>
          ) : (
            sessions.map((session) => {
              const isEnrolled = enrolledSessions.includes(session._id);
              const status = session.status || 'scheduled'; // Default to 'scheduled' if status is undefined
              const isActive = status === 'active';
              const isCompleted = status === 'completed';
              return (
                <div key={session._id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 text-left">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-800">{session.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isActive ? 'bg-green-100 text-green-800' :
                          isCompleted ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {session.subject} • Taught by {session.teacher?.name || 'Unknown Teacher'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">{session.description}</p>
                      {session.materials && (
                        <a 
                          href={session.materials} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                        >
                          View Materials
                        </a>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {new Date(session.dateTime).toLocaleString()}
                      </p>
                      {isEnrolled && isActive ? (
                        <button 
                          onClick={() => handleJoinSession(session._id)}
                          className="mt-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                          Join Live Session
                        </button>
                      ) : !isCompleted && (
                        <button 
                          className={`mt-2 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isEnrolled 
                              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white'
                          }`}
                          onClick={() => handleEnrollment(session._id, isEnrolled)}
                          disabled={isCompleted}
                        >
                          {isEnrolled ? 'Leave Session' : 'Join Session'}
                        </button>
                      )}
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
