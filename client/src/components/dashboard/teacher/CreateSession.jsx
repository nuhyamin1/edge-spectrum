import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import axios from '../../../utils/axios';
import Layout from '../Layout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const CreateSession = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [session, setSession] = useState({
    title: '',
    subject: '',
    description: '',
    dateTime: '',
    duration: '',
    gracePeriod: '',
    materials: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get('/api/materials');
      setMaterials(response.data);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSession(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMaterialSelect = (e) => {
    const materialId = e.target.value;
    if (materialId) {
      const materialUrl = `${window.location.origin}/dashboard/material/${materialId}`;
      setSession(prev => ({
        ...prev,
        materials: materialUrl
      }));
    } else {
      setSession(prev => ({
        ...prev,
        materials: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

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

    const sessionData = {
      ...session,
      duration: parseInt(session.duration),
      gracePeriod: parseInt(session.gracePeriod)
    };

    try {
      await axios.post('/api/sessions', sessionData);
      toast.success('Session created successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout userType="teacher">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center text-gray-400 hover:text-neon-blue transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
          Back to Dashboard
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
              Create New Session
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="title"
                  value={session.title}
                  onChange={handleChange}
                  required
                  placeholder="Title"
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
                  required
                  placeholder="Subject"
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
                  required
                  placeholder="Description"
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                  text-gray-100 placeholder-gray-500
                  focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                  transition-all duration-300 min-h-[100px]"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input
                    type="number"
                    name="duration"
                    value={session.duration}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="Duration (minutes)"
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                    text-gray-100 placeholder-gray-500
                    focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                    transition-all duration-300"
                  />
                </div>

                <div>
                  <input
                    type="number"
                    name="gracePeriod"
                    value={session.gracePeriod}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="Grace Period (minutes)"
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                    text-gray-100 placeholder-gray-500
                    focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                    transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <div className="mt-1 flex space-x-2">
                  <select
                    onChange={handleMaterialSelect}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                    text-gray-100
                    focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                    transition-all duration-300"
                  >
                    <option value="">Select a material</option>
                    {materials.map((material) => (
                      <option key={material._id} value={material._id}>
                        {material.title}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  name="materials"
                  value={session.materials}
                  onChange={handleChange}
                  placeholder="Material URL will be automatically filled"
                  className="mt-2 w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                  text-gray-400 placeholder-gray-500
                  focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                  transition-all duration-300"
                  readOnly
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700/50">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
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
                  {loading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateSession;
