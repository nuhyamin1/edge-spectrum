import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import Layout from '../Layout';

const EditMaterial = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    content: ''
  });

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await axios.get(`/api/materials/${id}`);
        setFormData(response.data);
      } catch (error) {
        toast.error('Failed to fetch material');
        navigate('/dashboard');
      }
    };

    fetchMaterial();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.patch(`/api/materials/${id}`, formData);
      toast.success('Material updated successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update material');
    }
  };

  return (
    <Layout userType="teacher">
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Edit Material</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={10}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditMaterial;
