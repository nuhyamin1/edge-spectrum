import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axios';
import Layout from './Layout';
import { toast } from 'react-toastify';
import 'react-quill/dist/quill.snow.css';
import './MaterialView.css';

const MaterialView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [material, setMaterial] = useState(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      try {
        const response = await axios.get(`/api/materials/${id}`);
        // Process image URLs in the content
        const content = response.data.content.replace(
          /src="\/uploads\//g,
          `src="${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/uploads/`
        );
        console.log('Processed content:', content);
        setMaterial({ ...response.data, content });
      } catch (error) {
        toast.error('Failed to load material');
        navigate('/dashboard');
      }
    };

    fetchMaterial();
  }, [id, navigate]);

  if (!material) {
    return (
      <Layout userType={user?.role}>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType={user?.role}>
      <div className="max-w-4xl mx-auto">
        <div className="relative bg-orange-300/50 backdrop-blur-sm rounded-xl overflow-hidden 
          border border-orange-800 group hover:border-neon-blue/50
          transition-all duration-300 hover:shadow-lg hover:shadow-neon-blue/20">
          
          {/* Glossy overlay effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 
            group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          
          {/* Animated border gradient */}
          <div className="absolute -inset-[2px] rounded-xl bg-gradient-to-r from-blue-200/30 to-blue-300/30 
            opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10
            animate-once" />

          {/* Header */}
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-blue-700 group-hover:text-neon-blue transition-colors">
                  {material.title}
                </h1>
                <p className="mt-2 text-lg text-neon-blue">{material.subject}</p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm text-gray-400 hover:text-neon-blue
                transition-colors rounded-lg hover:bg-gray-700/50"
              >
                Back to Dashboard
              </button>
            </div>
            <p className="mt-4 text-black"><i>{material.description}</i></p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div 
              className="prose prose-invert max-w-none ql-editor material-content
              prose-headings:text-gray-100
              prose-p:text-gray-300
              prose-strong:text-gray-200
              prose-a:text-neon-blue hover:prose-a:text-neon-blue/80
              prose-code:text-neon-blue
              prose-pre:bg-gray-800/50
              prose-pre:border prose-pre:border-gray-700
              prose-img:rounded-lg prose-img:shadow-lg"
              dangerouslySetInnerHTML={{ __html: material.content }}
            />
          </div>

          {/* Teacher Actions */}
          {user?.role === 'teacher' && (
            <div className="p-6 bg-gray-800/30 border-t border-gray-700/50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => navigate(`/dashboard/edit-material/${material._id}`)}
                  className="px-4 py-2 bg-gray-800 text-neon-blue rounded-lg 
                  hover:bg-gray-700 transition-all duration-300 
                  border border-gray-700 hover:border-neon-blue/50
                  hover:shadow-lg hover:shadow-neon-blue/20"
                >
                  Edit Material
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MaterialView;
