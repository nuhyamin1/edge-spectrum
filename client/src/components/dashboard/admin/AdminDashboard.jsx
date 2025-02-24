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
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });

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

      <div className="mb-6 flex space-x-4">
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={() => setIsCreatingUser(true)}
        >
          Create New User
        </button>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={() => setIsCreatingSemester(true)}
        >
          Create New Semester
        </button>
      </div>

      {isCreatingSemester && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Semester</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              try {
                const formData = {
                  year: parseInt(e.target.year.value),
                  term: e.target.term.value,
                  startDate: e.target.startDate.value,
                  endDate: e.target.endDate.value
                };

                console.log('Creating semester with data:', formData);

                const response = await axios.post('/api/admin/semesters', formData);
                console.log('Semester created:', response.data);
                
                setIsCreatingSemester(false);
                setError(null);

                // Show success message
                alert('Semester created successfully');

                // Refresh the semesters collection if it's currently selected
                if (selectedCollection === 'semesters') {
                  await fetchDocuments('semesters');
                }
              } catch (err) {
                console.error('Failed to create semester:', err);
                setError('Failed to create semester: ' + (err.response?.data?.message || err.message));
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <input
                    type="number"
                    name="year"
                    defaultValue={new Date().getFullYear()}
                    min="2000"
                    max="2100"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Term</label>
                  <select
                    name="term"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                    required
                  >
                    <option value="January-June">January-June</option>
                    <option value="July-December">July-December</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => setIsCreatingSemester(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    Create Semester
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreatingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  className="bg-gray-500 text-white px-4 py-2 rounded"
                  onClick={() => {
                    setIsCreatingUser(false);
                    setNewUser({
                      name: '',
                      email: '',
                      password: '',
                      role: 'student'
                    });
                    setError(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  onClick={async () => {
                    try {
                      const response = await axios.post('/api/admin/users', newUser);
                      console.log('User created:', response.data);
                      setIsCreatingUser(false);
                      setNewUser({
                        name: '',
                        email: '',
                        password: '',
                        role: 'student'
                      });
                      setError(null);
                      // Refresh the users collection if it's currently selected
                      if (selectedCollection === 'users') {
                        fetchDocuments('users');
                      }
                    } catch (err) {
                      setError('Failed to create user: ' + (err.response?.data?.message || err.message));
                    }
                  }}
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
