import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Layout from '../Layout';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const Classroom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendanceStatus, setAttendanceStatus] = useState({});

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const response = await axios.get(`/api/sessions/${sessionId}`);
      setSession(response.data);
      // Initialize attendance status for all students as "absent"
      const initialStatus = {};
      response.data.enrolledStudents.forEach(student => {
        initialStatus[student._id] = 'absent';
      });
      setAttendanceStatus(initialStatus);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session details');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

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

  const toggleAttendance = (studentId) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
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

  const renderAttendanceRoom = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Attendance Room</h3>
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
              {attendanceStatus[student._id] === 'present' ? 'Present' : 'Absent'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
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
                disabled
              >
                Video Room
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
            {activeTab === 'attendance' && renderAttendanceRoom()}
            {activeTab === 'video' && <div>Video Room (Coming Soon)</div>}
            {activeTab === 'discussion' && <div>Discussion Room (Coming Soon)</div>}
            {activeTab === 'exercise' && <div>Exercise Room (Coming Soon)</div>}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Classroom;