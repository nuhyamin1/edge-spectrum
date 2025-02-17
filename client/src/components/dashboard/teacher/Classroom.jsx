import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Layout from '../Layout';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { io } from 'socket.io-client';
import VideoRoom from '../VideoRoom';
import Whiteboard from '../Whiteboard';
import { FaArrowLeft, FaHome } from 'react-icons/fa';

const Classroom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const socketRef = useRef(null);

  const updateAttendanceStatus = useCallback((studentId, status) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  }, []);

  const handleStudentJoined = useCallback(async (data) => {
    console.log('Student joined classroom event received:', data);
    if (data.sessionId === sessionId) {
      try {
        // Update attendance status in the database
        await axios.post(`/api/sessions/${sessionId}/attendance`, {
          studentId: data.studentId,
          status: 'present'
        });

        // Update local attendance state
        updateAttendanceStatus(data.studentId, 'present');

        // Update enrolledStudents list using functional update to avoid duplicates
        if (session && session.enrolledStudents) {
          setSession(prevSession => {
            // Update existing student info if found
            const updatedStudents = prevSession.enrolledStudents.map(student => {
              if (student._id === data.studentId) {
                return {
                  ...student,
                  name: data.studentName,
                  email: data.studentEmail,
                  profilePicture: data.studentProfilePicture
                };
              }
              return student;
            });

            // If the student isn't in the list, add them
            if (!prevSession.enrolledStudents.some(student => student._id === data.studentId)) {
              updatedStudents.push({
                _id: data.studentId,
                name: data.studentName,
                email: data.studentEmail,
                profilePicture: data.studentProfilePicture
              });
            }

            return {
              ...prevSession,
              enrolledStudents: updatedStudents
            };
          });
        }

        // Emit attendance update to all clients
        if (socketRef.current) {
          socketRef.current.emit('attendanceUpdate', {
            sessionId,
            studentId: data.studentId,
            status: 'present'
          });
        }
      } catch (error) {
        console.error('Error updating attendance status:', error);
        toast.error('Failed to update attendance status');
      }
    }
  }, [sessionId, updateAttendanceStatus, session]);

  // Initialize socket connection
  useEffect(() => {
    console.log('Initializing socket connection...');
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Teacher socket connected:', socket.id);
      // Join the session room
      socket.emit('join', { sessionId });
    });

    socket.on('studentJoinedClassroom', (data) => {
      console.log('Received studentJoinedClassroom event:', data);
      handleStudentJoined(data);
    });

    socket.on('attendanceStatusChanged', (data) => {
      console.log('Received attendanceStatusChanged event:', data);
      if (data.sessionId === sessionId) {
        updateAttendanceStatus(data.studentId, data.status);
      }
    });

    socketRef.current = socket;

    return () => {
      console.log('Cleaning up socket connection...');
      if (socket) {
        socket.disconnect();
      }
    };
  }, [sessionId, handleStudentJoined, updateAttendanceStatus]);

  const fetchSessionDetails = useCallback(async () => {
    try {
      const [sessionResponse, attendanceResponse] = await Promise.all([
        axios.get(`/api/sessions/${sessionId}`),
        axios.get(`/api/sessions/${sessionId}/attendance`)
      ]);

      setSession(sessionResponse.data);
      
      // Initialize attendance status from database
      const initialStatus = {};
      sessionResponse.data.enrolledStudents.forEach(student => {
        const attendanceRecord = attendanceResponse.data.find(record => record.studentId === student._id);
        initialStatus[student._id] = attendanceRecord?.status || 'absent';
      });
      
      setAttendanceStatus(initialStatus);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session details');
      navigate('/dashboard');
    }
  }, [sessionId, navigate]);

  // Fetch initial session details
  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  const toggleAttendance = useCallback(async (studentId) => {
    const newStatus = attendanceStatus[studentId] === 'present' ? 'absent' : 'present';
    
    try {
      // Update attendance status in the database
      await axios.post(`/api/sessions/${sessionId}/attendance`, {
        studentId,
        status: newStatus
      });

      // Update local state
      updateAttendanceStatus(studentId, newStatus);

      // Emit socket event for real-time update
      if (socketRef.current) {
        socketRef.current.emit('attendanceUpdate', {
          sessionId,
          studentId,
          status: newStatus
        });
      }
    } catch (error) {
      console.error('Error updating attendance status:', error);
      toast.error('Failed to update attendance status');
    }
  }, [sessionId, attendanceStatus, updateAttendanceStatus]);

  const handleMarkAllPresent = useCallback(async () => {
    try {
      const promises = session.enrolledStudents.map(student => 
        axios.post(`/api/sessions/${sessionId}/attendance`, {
          studentId: student._id,
          status: 'present'
        })
      );
      
      await Promise.all(promises);

      const newStatus = {};
      session.enrolledStudents.forEach(student => {
        newStatus[student._id] = 'present';
        
        // Emit socket event for each student
        if (socketRef.current) {
          socketRef.current.emit('attendanceUpdate', {
            sessionId,
            studentId: student._id,
            status: 'present'
          });
        }
      });
      
      setAttendanceStatus(newStatus);
      toast.success('Marked all students as present');
    } catch (error) {
      console.error('Error marking all present:', error);
      toast.error('Failed to update attendance status');
    }
  }, [session, sessionId]);

  const handleMarkAllAbsent = useCallback(async () => {
    try {
      const promises = session.enrolledStudents.map(student => 
        axios.post(`/api/sessions/${sessionId}/attendance`, {
          studentId: student._id,
          status: 'absent'
        })
      );
      
      await Promise.all(promises);

      const newStatus = {};
      session.enrolledStudents.forEach(student => {
        newStatus[student._id] = 'absent';
        
        // Emit socket event for each student
        if (socketRef.current) {
          socketRef.current.emit('attendanceUpdate', {
            sessionId,
            studentId: student._id,
            status: 'absent'
          });
        }
      });
      
      setAttendanceStatus(newStatus);
      toast.success('Marked all students as absent');
    } catch (error) {
      console.error('Error marking all absent:', error);
      toast.error('Failed to update attendance status');
    }
  }, [session, sessionId]);

  const handleStartSession = async () => {
    try {
      const response = await axios.post(`/api/sessions/${sessionId}/start`);
      setSession(response.data);
      toast.success('Session started successfully');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error(error.response?.data?.error || 'Failed to start session');
    }
  };

  const handleEndSession = async () => {
    try {
      const response = await axios.post(`/api/sessions/${sessionId}/end`);
      setSession(response.data);
      toast.success('Session ended successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error(error.response?.data?.error || 'Failed to end session');
    }
  };

  if (loading) {
    return (
      <Layout userType="teacher">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading classroom...</div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout userType="teacher">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">Session not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col h-screen">
        {/* Navigation bar with home button */}
        <div className="bg-white shadow-sm p-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-lg transition-colors duration-200 group relative"
            title="Back to Dashboard"
          >
            <FaHome className="w-5 h-5" />
            {/* Tooltip */}
            <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-sm px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
              Back to Dashboard
            </span>
          </button>
        </div>

        <Layout userType="teacher">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">{session.title}</h2>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      session.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                      session.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                    {session.status === 'scheduled' && (
                      <button
                        onClick={handleStartSession}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Start Session
                      </button>
                    )}
                    {session.status === 'active' && (
                      <button
                        onClick={handleEndSession}
                        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      >
                        End Session
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('attendance')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'attendance'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Attendance Room
                  </button>
                  <button
                    onClick={() => setActiveTab('video')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'video'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Video Room
                  </button>
                  <button
                    onClick={() => setActiveTab('whiteboard')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'whiteboard'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Whiteboard
                  </button>
                  <button
                    onClick={() => setActiveTab('discussion')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'discussion'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    disabled
                  >
                    Discussion Room
                  </button>
                  <button
                    onClick={() => setActiveTab('exercise')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'exercise'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    disabled
                  >
                    Exercise Room
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'attendance' && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold">Attendance Room</h3>
                      <div className="flex space-x-4">
                        <button
                          onClick={handleMarkAllPresent}
                          className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200 transition-colors"
                        >
                          <CheckIcon className="w-5 h-5 mr-2" />
                          Mark All Present
                        </button>
                        <button
                          onClick={handleMarkAllAbsent}
                          className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                        >
                          <XMarkIcon className="w-5 h-5 mr-2" />
                          Mark All Absent
                        </button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {session.enrolledStudents.map((student) => (
                        <div 
                          key={student._id} 
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            {student.profilePicture?.data ? (
                              <img
                                src={student.profilePicture.data}
                                alt={`${student.name}'s profile`}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <UserCircleIcon className="w-12 h-12 text-gray-400" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.email}</p>
                              {attendanceStatus[student._id] === 'present' && session.status === 'active' && (
                                <span className="text-xs text-green-600 font-medium">
                                  Currently in classroom
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleAttendance(student._id)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              attendanceStatus[student._id] === 'present'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {attendanceStatus[student._id] === 'present' ? <CheckIcon className="w-5 h-5" title="Present" /> : <XMarkIcon className="w-5 h-5" title="Absent" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === 'video' && (
                  <VideoRoom sessionId={sessionId} isTeacher={true} session={session} />
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
                {activeTab === 'exercise' && (
                  <div className="p-4">
                    <h2 className="text-lg font-semibold">Exercise Room</h2>
                    <p className="text-gray-500">Coming soon...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Classroom;