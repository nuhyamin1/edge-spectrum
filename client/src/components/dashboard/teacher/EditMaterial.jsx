import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../../utils/axios';
import { toast } from 'react-toastify';
import Layout from '../Layout';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './QuillEditor.css';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const EditMaterial = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    content: ''
  });

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      try {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('/api/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        const imageUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${response.data.url}`;
        console.log('Inserting image with URL:', imageUrl);

        // Get Quill instance
        const quillEditor = document.querySelector('.quill').querySelector('.ql-editor');
        const range = quillEditor.ownerDocument.getSelection().getRangeAt(0);
        
        // Create and insert the image
        const img = document.createElement('img');
        img.src = imageUrl;
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        
        range.deleteContents();
        range.insertNode(img);
      } catch (error) {
        console.error('Image upload error:', error);
        toast.error('Failed to upload image');
      }
    };
  }, []);

  const modules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  };

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

  const handleContentChange = (content) => {
    setFormData({
      ...formData,
      content: content
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
      <div className="max-w-4xl mx-auto">
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
              Edit Material
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
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
                  value={formData.subject}
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
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="Description"
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                  text-gray-100 placeholder-gray-500
                  focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                  transition-all duration-300 resize-none"
                />
              </div>

              <div className="relative">
                <div className="quill-container bg-gray-900/30 rounded-lg border border-gray-700
                  focus-within:border-neon-blue focus-within:ring-1 focus-within:ring-neon-blue
                  transition-all duration-300">
                  <ReactQuill
                    theme="snow"
                    value={formData.content}
                    onChange={handleContentChange}
                    modules={modules}
                    placeholder="Write your content here..."
                    className="h-64 mb-12"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700/50">
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
                  className="px-6 py-2 bg-gray-800 text-neon-blue rounded-lg 
                  hover:bg-gray-700 transition-all duration-300 
                  border border-gray-700 hover:border-neon-blue/50
                  hover:shadow-lg hover:shadow-neon-blue/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditMaterial;
