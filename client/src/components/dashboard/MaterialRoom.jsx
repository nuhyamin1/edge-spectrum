import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';

const MaterialRoom = ({ sessionId, session }) => {
  const [materialDetails, setMaterialDetails] = useState(null);

  useEffect(() => {
    const fetchMaterialDetails = async () => {
      if (session.materials) {
        try {
          const response = await axios.get(`/api/materials/${session.materials}`);
          setMaterialDetails(response.data);
        } catch (error) {
          console.error('Error fetching material details:', error);
        }
      }
    };

    fetchMaterialDetails();
  }, [session.materials]);

  const handleFileDownload = async (file) => {
    try {
      const response = await axios.get(
        `/api/sessions/${sessionId}/files/${file.filename}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalname);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error downloading file');
    }
  };

  const renderWebMaterial = (materialId) => {
    return (
      <div className="bg-white shadow-sm rounded-lg p-4 mb-4">
        <div className="prose max-w-none">
          <Link 
            to={`/dashboard/material/${materialId}`}
            className="text-blue-600 hover:text-blue-800"
          >
            {materialDetails ? materialDetails.title : 'Loading material...'}
          </Link>
          {materialDetails && (
            <p className="text-gray-600 text-sm mt-2">
              {materialDetails.description}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderExternalLink = (link) => {
    return (
      <div key={link.url} className="bg-white shadow-sm rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">{link.title}</h3>
        <a 
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          {link.url}
        </a>
      </div>
    );
  };

  const renderFile = (file) => {
    return (
      <div key={file.filename} className="bg-white shadow-sm rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold mb-2">{file.originalname}</h3>
        <button
          onClick={() => handleFileDownload(file)}
          className="text-blue-600 hover:text-blue-800"
        >
          Download File
        </button>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Material Room</h2>
      
      {/* Web Materials Section */}
      {session.materials && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Web Materials</h3>
          {renderWebMaterial(session.materials)}
        </div>
      )}

      {/* External Links Section */}
      {session.externalLinks && session.externalLinks.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">External Links</h3>
          {session.externalLinks.map(renderExternalLink)}
        </div>
      )}

      {/* Files Section */}
      {session.files && session.files.length > 0 && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Downloadable Files</h3>
          {session.files.map(renderFile)}
        </div>
      )}

      {/* Show message if no materials are available */}
      {(!session.materials && (!session.externalLinks || session.externalLinks.length === 0) && (!session.files || session.files.length === 0)) && (
        <div className="text-gray-500 text-center py-8">
          No materials available for this session.
        </div>
      )}
    </div>
  );
};

export default MaterialRoom;
