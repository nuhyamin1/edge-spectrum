import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import Layout from '../Layout';
import { toast } from 'react-toastify';

const AvailableSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await axios.get('/api/sessions/available');
        setSessions(response.data);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        toast.error('Failed to load available sessions');
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) {
    return (
      <Layout userType="student">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading sessions...</div>
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
            sessions.map((session) => (
              <div key={session._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1 text-left">
                    <h3 className="text-lg font-semibold text-gray-800">{session.title}</h3>
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
                    <button 
                      className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      onClick={() => toast.info('Session enrollment coming soon!')}
                    >
                      Join Session
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AvailableSessions;
