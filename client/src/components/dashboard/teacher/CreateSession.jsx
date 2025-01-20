import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../context/AuthContext';
import Layout from '../Layout';

const CreateSession = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState({
    title: '',
    subject: '',
    description: '',
    dateTime: '',
    duration: '',
    gracePeriod: '',
    materials: ''
  });

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

    // Client-side validation
    if (parseInt(session.duration) < 1) {
      toast.error('Duration must be at least 1 minute');
      setLoading(false);
      return;
    }

    if (parseInt(session.gracePeriod) < 0) {
      toast.error('Grace period must be 0 or more minutes');
      setLoading(false);
      return;
    }

    // Convert string values to numbers for duration and gracePeriod
    const sessionData = {
      ...session,
      duration: parseInt(session.duration),
      gracePeriod: parseInt(session.gracePeriod)
    };

    try {
      await api.post('/sessions', sessionData);
      toast.success('Session created successfully!');
      navigate('/dashboard/sessions');
    } catch (error) {
      console.error('Error creating session:', error.response?.data || error);
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
      } else {
        toast.error(error.response?.data?.error || 'Failed to create session');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout userType="teacher">
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Session</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="title"
              value={session.title}
              onChange={handleChange}
              placeholder="Session Title"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="subject"
              value={session.subject}
              onChange={handleChange}
              placeholder="Subject"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <textarea
              name="description"
              value={session.description}
              onChange={handleChange}
              placeholder="Session Description"
              rows="4"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <input
              type="datetime-local"
              name="dateTime"
              value={session.dateTime}
              onChange={handleChange}
              placeholder="Date and Time"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <input
              type="number"
              name="duration"
              value={session.duration}
              onChange={handleChange}
              placeholder="Duration (in minutes)"
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <input
              type="number"
              name="gracePeriod"
              value={session.gracePeriod}
              onChange={handleChange}
              placeholder="Grace Period (in minutes)"
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="materials"
              value={session.materials}
              onChange={handleChange}
              placeholder="Materials (optional)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full ${
                loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              {loading ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateSession;
