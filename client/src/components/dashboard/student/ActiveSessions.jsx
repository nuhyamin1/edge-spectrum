import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import Layout from '../Layout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const ActiveSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const fetchActiveSessions = async () => {
    try {
      const response = await axios.get('/api/sessions/available');
      // Filter only active sessions
      const activeSessions = response.data.filter(session => session.status === 'active');
      setSessions(activeSessions);
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      toast.error('Failed to fetch active sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = (session) => {
    try {
      // Check if session has startedAt time
      if (!session.startedAt) {
        toast.error('Session start time information is missing');
        return;
      }

      // Calculate if within grace period
      const startTime = new Date(session.startedAt);
      const currentTime = new Date();
      const gracePeriodEnd = new Date(startTime.getTime() + (session.gracePeriod * 60000));

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
      
      sessionStorage.setItem(storageKey, JSON.stringify(gracePeriodInfo));
      navigate(`/classroom/${session._id}`);
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
    }
  };

  if (loading) {
    return (
      <Layout userType="student">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading active sessions...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="student">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Active Sessions</h1>
        
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <p className="text-gray-600">No active sessions at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session._id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{session.title}</h3>
                    <p className="text-sm text-gray-600">{session.description}</p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Duration: {session.duration} mins</p>
                      <p className="text-sm text-gray-600">
                        Started at: {new Date(session.startedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinSession(session)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Join Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ActiveSessions;
