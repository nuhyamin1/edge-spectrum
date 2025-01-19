import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Layout from '../Layout';

const Classroom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessionDetails();
  }, [sessionId]);

  const fetchSessionDetails = async () => {
    try {
      const response = await axios.get(`/api/sessions/${sessionId}`);
      setSession(response.data);
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
      // Optionally navigate back to dashboard
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
    <Layout userType="teacher">
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

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Session Information</h3>
            <p className="text-gray-600">Subject: {session.subject}</p>
            <p className="text-gray-600">Scheduled for: {new Date(session.dateTime).toLocaleString()}</p>
            <p className="text-gray-600">Status: {session.status}</p>
            {session.startedAt && (
              <p className="text-gray-600">Started at: {new Date(session.startedAt).toLocaleString()}</p>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Enrolled Students</h3>
            {session.enrolledStudents?.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {session.enrolledStudents.map((student) => (
                  <li key={student._id} className="py-3">
                    <p className="text-gray-800">{student.name}</p>
                    <p className="text-gray-600 text-sm">{student.email}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No students enrolled yet</p>
            )}
          </div>

          {session.status === 'active' && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Classroom Features</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-gray-600">Classroom features will be implemented here:</p>
                <ul className="list-disc list-inside text-gray-600 mt-2">
                  <li>Real-time chat</li>
                  <li>Video conferencing</li>
                  <li>Interactive whiteboard</li>
                  <li>Screen sharing</li>
                  <li>Student participation tracking</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Classroom;