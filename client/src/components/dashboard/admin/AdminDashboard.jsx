import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';

const AdminDashboard = () => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editedValue, setEditedValue] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCollections();
    fetchStats();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await axios.get('/api/admin/collections');
      setCollections(response.data.collections);
    } catch (err) {
      setError('Failed to fetch collections');
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchDocuments = async (collectionName) => {
    try {
      const response = await axios.get(`/api/admin/collections/${collectionName}`);
      setDocuments(response.data.documents);
      setSelectedCollection(collectionName);
    } catch (err) {
      setError('Failed to fetch documents');
      console.error(err);
    }
  };

  const handleUpdateDocument = async (docId, updatedData) => {
    try {
      console.log('Updating document:', {
        collection: selectedCollection,
        docId,
        dataSize: JSON.stringify(updatedData).length
      });

      const response = await axios.put(
        `/api/admin/collections/${selectedCollection}/${docId}`, 
        updatedData,
        {
          headers: { 'Content-Type': 'application/json' },
          maxBodyLength: Infinity,
          maxContentLength: Infinity
        }
      );

      console.log('Update response:', response.data);
      
      fetchDocuments(selectedCollection); // Refresh documents
      setEditingDoc(null);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error('Document update error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Failed to update document: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await axios.delete(`/api/admin/collections/${selectedCollection}/${docId}`);
      fetchDocuments(selectedCollection); // Refresh documents
    } catch (err) {
      setError('Failed to delete document');
      console.error(err);
    }
  };

  const startEditing = (doc) => {
    setEditedValue(JSON.stringify(doc, null, 2));
    setEditingDoc(doc._id);
    setError(null); // Clear any previous errors
  };

  const cancelEditing = () => {
    setEditingDoc(null);
    setEditedValue('');
    setError(null); // Clear any previous errors
  };

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Database Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.collectionsCount).map(([collection, count]) => (
            <div key={collection} className="bg-gray-50 p-3 rounded">
              <h3 className="font-semibold">{collection}</h3>
              <p className="text-lg">{count} documents</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDocument = (doc) => {
    if (editingDoc === doc._id) {
      return (
        <div key={doc._id} className="bg-white p-4 rounded shadow mb-4">
          <textarea
            className="w-full h-48 font-mono text-sm p-2 border rounded"
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
          />
          <div className="mt-2">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded mr-2"
              onClick={() => {
                try {
                  const updatedDoc = JSON.parse(editedValue);
                  // Remove _id and __v from the update data
                  const { _id, __v, ...updateData } = updatedDoc;
                  handleUpdateDocument(doc._id, updateData);
                } catch (err) {
                  setError('Invalid JSON format');
                }
              }}
            >
              Save
            </button>
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded"
              onClick={cancelEditing}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={doc._id} className="bg-white p-4 rounded shadow mb-4">
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {JSON.stringify(doc, null, 2)}
        </pre>
        <div className="mt-2">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
            onClick={() => startEditing(doc)}
          >
            Edit
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded"
            onClick={() => handleDeleteDocument(doc._id)}
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {renderStats()}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Collections</h2>
          <ul>
            {collections.map((collection) => (
              <li
                key={collection}
                className={`cursor-pointer p-2 rounded ${
                  selectedCollection === collection
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() => fetchDocuments(collection)}
              >
                {collection}
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-3">
          {selectedCollection && (
            <div>
              <h2 className="text-xl font-bold mb-4">
                {selectedCollection} Documents
              </h2>
              {documents.map((doc) => renderDocument(doc))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
