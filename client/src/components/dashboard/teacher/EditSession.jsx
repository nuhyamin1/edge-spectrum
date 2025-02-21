import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../../context/AuthContext';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../Layout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const EditSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState({
    title: '',
    subject: '',
    description: '',
    dateTime: '',
    materials: ''
  });

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const response = await api.get(`/sessions/${id}`);
      const sessionData = response.data;
      // Format the date to local ISO string for the datetime-local input
      const dateTime = new Date(sessionData.dateTime)
        .toISOString()
        .slice(0, 16); // Get YYYY-MM-DDTHH:mm format
      
      setSession({
        ...sessionData,
        dateTime
      });
    } catch (error) {
      console.error('Error fetching session:', error);
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load session');
        navigate('/dashboard/sessions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSession(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Make sure to send dateTime in ISO format
      const updatedSession = {
        ...session,
        dateTime: new Date(session.dateTime).toISOString()
      };
      
      await api.put(`/sessions/${id}`, updatedSession);
      toast.success('Session updated successfully!');
      navigate('/dashboard/sessions');
    } catch (error) {
      console.error('Error updating session:', error);
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
      } else {
        toast.error(error.response?.data?.error || 'Failed to update session');
      }
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/dashboard/sessions')}
          className="mb-6 flex items-center text-gray-400 hover:text-neon-blue transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
          Back to Sessions
        </button>

        <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden 
          border border-gray-700 group hover:border-neon-blue/50
          transition-all duration-300 hover:shadow-lg hover:shadow-neon-blue/20">
          
          {/* Glossy overlay effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 
            group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Animated border gradient */}
          <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-blue-200/30 to-blue-300/30 
            opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10
            animate-once" />

          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-100 group-hover:text-neon-blue transition-colors mb-6">
              Edit Session
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="title"
                  value={session.title}
                  onChange={handleChange}
                  placeholder="Title"
                  required
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                  text-gray-100 placeholder-gray-500
                  focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                  transition-all duration-300"
                />
              </div>

              <div>
                <input
                  type="text"
                  name="subject"
                  value={session.subject}
                  onChange={handleChange}
                  placeholder="Subject"
                  required
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                  text-gray-100 placeholder-gray-500
                  focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                  transition-all duration-300"
                />
              </div>

              <div>
                <textarea
                  name="description"
                  value={session.description}
                  onChange={handleChange}
                  placeholder="Description"
                  rows="4"
                  required
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                  text-gray-100 placeholder-gray-500
                  focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                  transition-all duration-300 resize-none"
                />
              </div>

              <div>
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={session.dateTime}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                  text-gray-100
                  focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                  transition-all duration-300"
                />
              </div>

              <div>
                <input
                  type="url"
                  name="materials"
                  value={session.materials || ''}
                  onChange={handleChange}
                  placeholder="Materials Link (Optional) - https://"
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                  text-gray-100 placeholder-gray-500
                  focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                  transition-all duration-300"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700/50">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/sessions')}
                  className="px-6 py-2 bg-gray-800 text-gray-400 rounded-lg 
                  hover:bg-gray-700 transition-all duration-300 
                  border border-gray-700 hover:border-gray-400/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-gray-800 text-neon-blue rounded-lg 
                  hover:bg-gray-700 transition-all duration-300 
                  border border-gray-700 hover:border-neon-blue/50
                  hover:shadow-lg hover:shadow-neon-blue/20
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditSession;
