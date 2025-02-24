import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../../context/AuthContext';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../Layout';
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const EditSession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [session, setSession] = useState({
    title: '',
    subject: '',
    description: '',
    dateTime: '',
    duration: '',
    gracePeriod: '',
    materials: '',
    semester: '',
    externalLinks: [],
    files: []
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          fetchSession(),
          fetchMaterials(),
          fetchSemesters()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load session data');
      }
    };
    fetchData();
  }, [id]);

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast.error('Failed to load materials');
    }
  };

  const fetchSemesters = async () => {
    try {
      const response = await api.get('/semesters');
      setSemesters(response.data || []);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Failed to load semesters');
    }
  };

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
        dateTime,
        externalLinks: sessionData.externalLinks || [],
        files: sessionData.files || []
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

  const handleAddExternalLink = () => {
    setSession(prev => ({
      ...prev,
      externalLinks: [...(prev.externalLinks || []), { title: '', url: '' }]
    }));
  };

  const handleExternalLinkChange = (index, field, value) => {
    const updatedLinks = [...(session.externalLinks || [])];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setSession(prev => ({
      ...prev,
      externalLinks: updatedLinks
    }));
  };

  const handleRemoveExternalLink = (index) => {
    setSession(prev => ({
      ...prev,
      externalLinks: (prev.externalLinks || []).filter((_, i) => i !== index)
    }));
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setSession(prev => ({
      ...prev,
      files: [...(prev.files || []), ...newFiles]
    }));
  };

  const handleRemoveFile = (index) => {
    setSession(prev => ({
      ...prev,
      files: (prev.files || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!session.semester) {
        setLoading(false);
        toast.error('Please select a semester');
        return;
      }

      // Ensure arrays are initialized
      const updatedSession = {
        ...session,
        externalLinks: session.externalLinks || [],
        files: session.files || []
      };
      
      const formData = new FormData();
      Object.keys(updatedSession).forEach(key => {
        if (key === 'files') {
          updatedSession.files.forEach(file => {
            if (file instanceof File) {
              formData.append('files', file);
            }
          });
        } else if (key === 'externalLinks') {
          formData.append('externalLinks', JSON.stringify(updatedSession.externalLinks));
        } else {
          formData.append(key, updatedSession[key]);
        }
      });

      await api.put(`/sessions/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-500 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden 
          border border-blue-200 group hover:border-blue-400
          transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20">
          <div className="p-6 border-b border-blue-200">
            <h2 className="text-2xl font-bold text-blue-900 group-hover:text-blue-600 transition-colors">
              Edit Session
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
                  value={session.title}
                  onChange={handleChange}
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
                  value={session.subject}
                  onChange={handleChange}
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
                  value={session.description}
                  onChange={handleChange}
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
                  value={session.semester}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                    text-blue-900
                    focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                    transition-all duration-300"
                >
                  <option value="">Select Semester</option>
                  {semesters?.map((semester) => (
                    <option key={semester._id} value={semester._id}>
                      {semester.year} ({semester.term})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Date and Time
                  </label>
                  <input
                    type="datetime-local"
                    name="dateTime"
                    value={session.dateTime}
                    onChange={handleChange}
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
                    value={session.duration}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                      text-blue-900
                      focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                      transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Grace Period (minutes)
                  </label>
                  <input
                    type="number"
                    name="gracePeriod"
                    value={session.gracePeriod}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                      text-blue-900
                      focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                      transition-all duration-300"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-900 mb-1">
                    Materials
                  </label>
                  <select
                    name="materials"
                    value={session.materials}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                      text-blue-900
                      focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                      transition-all duration-300"
                  >
                    <option value="">Select Material</option>
                    {materials?.map((material) => (
                      <option key={material._id} value={material._id}>
                        {material.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-blue-900">
                      External Links
                    </label>
                    <button
                      type="button"
                      onClick={handleAddExternalLink}
                      className="flex items-center text-sm text-blue-500 hover:text-blue-600"
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Link
                    </button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {(session.externalLinks || []).map((link, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Link Title"
                          value={link.title}
                          onChange={(e) => handleExternalLinkChange(index, 'title', e.target.value)}
                          className="flex-1 px-4 py-2 bg-white border border-blue-200 rounded-lg
                            text-blue-900 text-sm
                            focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        />
                        <input
                          type="url"
                          placeholder="URL"
                          value={link.url}
                          onChange={(e) => handleExternalLinkChange(index, 'url', e.target.value)}
                          className="flex-2 px-4 py-2 bg-white border border-blue-200 rounded-lg
                            text-blue-900 text-sm
                            focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExternalLink(index)}
                          className="p-2 text-red-500 hover:text-red-600"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-blue-900">
                      Files
                    </label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center text-sm text-blue-500 hover:text-blue-600"
                    >
                      <PlusIcon className="w-4 h-4 mr-1" />
                      Add Files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
                    />
                  </div>
                  <div className="mt-2 space-y-2">
                    {(session.files || []).map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                        <span className="text-sm text-blue-900">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="p-1 text-red-500 hover:text-red-600"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-blue-200">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard/sessions')}
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
