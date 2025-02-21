import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../context/AuthContext';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../Layout';
import { PencilIcon, TrashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

const SessionList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions/teacher');
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load sessions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await api.delete(`/sessions/${sessionId}`);
      toast.success('Session deleted successfully');
      fetchSessions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Layout userType="teacher">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="teacher">
      <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden 
        border border-gray-700 group hover:border-neon-blue/50
        transition-all duration-300 hover:shadow-lg hover:shadow-neon-blue/20">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-100 group-hover:text-neon-blue transition-colors">
            My Sessions
          </h2>
          <button
            onClick={() => navigate('/dashboard/create-session')}
            className="px-6 py-2.5 bg-gray-800 text-neon-blue rounded-lg 
            hover:bg-gray-700 transition-all duration-300 
            border border-gray-700 hover:border-neon-blue/50
            hover:shadow-lg hover:shadow-neon-blue/20
            flex items-center gap-2"
          >
            <PencilIcon className="w-5 h-5" />
            Create New Session
          </button>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No sessions found. Create your first session!
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {sessions.map((session) => (
              <div 
                key={session._id} 
                className="relative p-6 hover:bg-gray-800/30 transition-all duration-300 group/item"
              >
                {/* Animated border gradient for each item */}
                <div className="absolute -inset-[1px] rounded-none bg-gradient-to-r from-blue-200/30 to-blue-300/30 
                  opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 -z-10
                  animate-once" />

                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-100 group-hover/item:text-neon-blue transition-colors">
                      {session.title}
                    </h3>
                    <p className="text-sm text-neon-blue mt-1">{session.subject}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {session.description}
                    </p>
                    {session.materials && (
                      <a
                        href={session.materials}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neon-blue hover:text-neon-blue/80 text-sm mt-2 inline-flex items-center gap-1"
                      >
                        View Materials
                        <ArrowRightIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <div className="text-right ml-6 flex flex-col items-end">
                    <p className="text-sm text-gray-400">
                      {formatDateTime(session.dateTime)}
                    </p>
                    <div className="mt-2 space-x-2">
                      <button
                        onClick={() => navigate(`/teacher/classroom/${session._id}`)}
                        className={`px-6 py-2 rounded-lg transition-all duration-300 
                        border hover:shadow-lg w-[140px]
                        ${session.status === 'active' 
                          ? 'bg-gray-800 text-green-400 border-gray-700 hover:border-green-400/50 hover:shadow-green-400/20' 
                          : session.status === 'completed'
                          ? 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-400/50 hover:shadow-gray-400/20'
                          : 'bg-gray-800 text-neon-blue border-gray-700 hover:border-neon-blue/50 hover:shadow-neon-blue/20'
                        }`}
                      >
                        {session.status === 'active' 
                          ? 'Live' 
                          : session.status === 'completed' 
                          ? 'Completed' 
                          : 'Start'}
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/edit-session/${session._id}`)}
                        className="p-2 text-gray-400 hover:text-neon-blue transition-colors
                        rounded-lg hover:bg-gray-700/50"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(session._id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors
                        rounded-lg hover:bg-gray-700/50"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SessionList;
