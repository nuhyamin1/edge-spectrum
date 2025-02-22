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
  const [semesters, setSemesters] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    dateTime: '',
    duration: '',
    gracePeriod: '',
    materials: '',
    semester: ''
  });

  useEffect(() => {
    fetchMaterials();
    fetchSemesters();
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

  const fetchSemesters = async () => {
    try {
      const response = await axios.get('/api/semesters');
      console.log('Fetched semesters:', response.data);
      setSemesters(response.data);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Failed to load semesters');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.semester) {
        setLoading(false);
        toast.error('Please select a semester');
        return;
      }

      console.log('Sending session data:', {
        ...formData,
        teacher: user._id
      });

      const response = await axios.post('/api/sessions', {
        ...formData,
        teacher: user._id
      });

      toast.success('Session created successfully');
      navigate('/dashboard/sessions');
    } catch (error) {
      console.error('Error creating session:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout userType="teacher">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden 
          border border-blue-200 group hover:border-blue-400
          transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20">
          <div className="p-6 border-b border-blue-200">
            <h2 className="text-2xl font-bold text-blue-900 group-hover:text-blue-600 transition-colors">
              Create New Session
            </h2>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                    text-blue-900
                    focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                    transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                    text-blue-900
                    focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                    transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                    text-blue-900
                    focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                    transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Semester
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                    text-blue-900
                    focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                    transition-all duration-300"
                >
                  <option value="">Select Semester</option>
                  {semesters.map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      {semester.year} ({semester.term})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Date and Time
                  </label>
                  <input
                    type="datetime-local"
                    name="dateTime"
                    value={formData.dateTime}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                      text-blue-900
                      focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                      transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                      text-blue-900
                      focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                      transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Grace Period (minutes)
                </label>
                <input
                  type="number"
                  name="gracePeriod"
                  value={formData.gracePeriod}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                    text-blue-900
                    focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                    transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-900 mb-1">
                  Materials
                </label>
                <select
                  name="materials"
                  value={formData.materials}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                    text-blue-900
                    focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                    transition-all duration-300"
                >
                  <option value="">Select Material</option>
                  {materials.map((material) => (
                    <option key={material._id} value={material._id}>
                      {material.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-blue-200">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-white text-blue-500 rounded-lg 
                    hover:bg-blue-50 transition-all duration-300 
                    border border-blue-200 hover:border-blue-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-2 bg-blue-500 text-white rounded-lg 
                    hover:bg-blue-600 transition-all duration-300 
                    border border-blue-400 
                    hover:shadow-lg hover:shadow-blue-400/20
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
