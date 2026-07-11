import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import Layout from '../Layout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { MATERIAL_SUBJECTS } from '../../../constants/materialSubjects';
import MaterialRichTextEditor from './MaterialRichTextEditor';

const CreateMaterial = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    content: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleContentChange = (content) => {
    setFormData((current) => ({
      ...current,
      content
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await axios.post('/api/materials', formData);
      toast.success('Material created successfully');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create material');
    }
  };

  return (
    <Layout userType="teacher">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center text-blue-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden
          border border-blue-200 group hover:border-blue-400
          transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-blue-900 group-hover:text-blue-600 transition-colors mb-6">
              Create New Material
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                  text-blue-900 placeholder-blue-300
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                  transition-all duration-300"
              />

              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                  text-blue-900 placeholder-blue-300
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                  transition-all duration-300"
              >
                <option value="" disabled>Select subject</option>
                {MATERIAL_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="w-full px-4 py-2 bg-white border border-blue-200 rounded-lg
                  text-blue-900 placeholder-blue-300
                  focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400
                  transition-all duration-300 resize-none"
              />

              <MaterialRichTextEditor
                value={formData.content}
                onChange={handleContentChange}
              />

              <div className="flex justify-end space-x-3 pt-6 border-t border-blue-200">
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
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg
                  hover:bg-blue-600 transition-all duration-300
                  border border-blue-400
                  hover:shadow-lg hover:shadow-blue-400/20"
                >
                  Create Material
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreateMaterial;
