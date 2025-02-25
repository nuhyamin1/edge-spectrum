import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../../utils/axios';

const AdminDashboard = () => {
  // State management
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [editedValue, setEditedValue] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState({
    collections: false,
    documents: false,
    stats: false,
    action: false
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isCreatingSemester, setIsCreatingSemester] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: '_id', direction: 'asc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [newDocument, setNewDocument] = useState('{}');
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Reset pagination when changing collections
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [selectedCollection]);

  // Initial data loading
  useEffect(() => {
    fetchCollections();
    fetchStats();
  }, []);

  // Show success message for 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch collections list
  const fetchCollections = async () => {
    setLoading(prev => ({ ...prev, collections: true }));
    try {
      const response = await axios.get('/api/admin/collections');
      setCollections(response.data.collections);
      // Auto-select first collection if none is selected
      if (!selectedCollection && response.data.collections.length > 0) {
        fetchDocuments(response.data.collections[0]);
      }
    } catch (err) {
      setError('Failed to fetch collections: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, collections: false }));
    }
  };

  // Fetch dashboard statistics
  const fetchStats = async () => {
    setLoading(prev => ({ ...prev, stats: true }));
    try {
      const response = await axios.get('/api/admin/stats');
      setStats(response.data.stats);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to fetch statistics: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  // Fetch documents for a collection with pagination, sorting and search
  const fetchDocuments = useCallback(async (collectionName) => {
    setLoading(prev => ({ ...prev, documents: true }));
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction,
        search: searchTerm
      });
      
      const response = await axios.get(`/api/admin/collections/${collectionName}?${params}`);
      setDocuments(response.data.documents);
      setPagination(prev => ({ 
        ...prev, 
        total: response.data.total || response.data.documents.length 
      }));
      setSelectedCollection(collectionName);
      setError(null);
    } catch (err) {
      setError('Failed to fetch documents: ' + (err.response?.data?.message || err.message));
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, documents: false }));
    }
  }, [pagination.page, pagination.limit, sortConfig, searchTerm]);

  // Refetch documents when pagination, sort or search changes
  useEffect(() => {
    if (selectedCollection) {
      fetchDocuments(selectedCollection);
    }
  }, [pagination.page, pagination.limit, sortConfig, selectedCollection, fetchDocuments]);

  // Handle document update
  const handleUpdateDocument = async (docId, updatedData) => {
    setLoading(prev => ({ ...prev, action: true }));
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
      setError(null);
      setSuccess(`Document updated successfully`);
    } catch (err) {
      console.error('Document update error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError('Failed to update document: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Handle document creation
  const handleCreateDocument = async () => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      let newDocObj;
      try {
        newDocObj = JSON.parse(newDocument);
      } catch (e) {
        throw new Error('Invalid JSON format');
      }

      const response = await axios.post(
        `/api/admin/collections/${selectedCollection}`,
        newDocObj,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      console.log('Document created:', response.data);
      fetchDocuments(selectedCollection);
      setIsCreatingDocument(false);
      setNewDocument('{}');
      setSuccess('Document created successfully');
    } catch (err) {
      setError('Failed to create document: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (docId) => {
    setConfirmAction({
      type: 'delete',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      confirm: async () => {
        setLoading(prev => ({ ...prev, action: true }));
        try {
          await axios.delete(`/api/admin/collections/${selectedCollection}/${docId}`);
          fetchDocuments(selectedCollection);
          setSuccess('Document deleted successfully');
        } catch (err) {
          setError('Failed to delete document: ' + (err.response?.data?.message || err.message));
          console.error(err);
        } finally {
          setLoading(prev => ({ ...prev, action: false }));
          setConfirmAction(null);
        }
      },
      cancel: () => setConfirmAction(null)
    });
  };

  // Handle user creation
  const handleCreateUser = async () => {
    setLoading(prev => ({ ...prev, action: true }));
    try {
      // Validate user data
      if (!newUser.name.trim()) throw new Error('Name is required');
      if (!newUser.email.trim()) throw new Error('Email is required');
      if (!newUser.password || newUser.password.length < 6) throw new Error('Password must be at least 6 characters');

      const response = await axios.post('/api/admin/users', newUser);
      console.log('User created:', response.data);
      setIsCreatingUser(false);
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'student'
      });
      setSuccess('User created successfully');
      
      // Refresh the users collection if it's currently selected
      if (selectedCollection === 'users') {
        fetchDocuments('users');
      }
    } catch (err) {
      setError('Failed to create user: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Handle semester creation
  const handleCreateSemester = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, action: true }));
    
    try {
      const formData = {
        year: parseInt(e.target.year.value),
        term: e.target.term.value,
        startDate: e.target.startDate.value,
        endDate: e.target.endDate.value
      };

      // Validate dates
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        throw new Error('Start date must be before end date');
      }

      console.log('Creating semester with data:', formData);

      const response = await axios.post('/api/admin/semesters', formData);
      console.log('Semester created:', response.data);
      
      setIsCreatingSemester(false);
      setSuccess('Semester created successfully');

      // Refresh the semesters collection if it's currently selected
      if (selectedCollection === 'semesters') {
        await fetchDocuments('semesters');
      }
    } catch (err) {
      console.error('Failed to create semester:', err);
      setError('Failed to create semester: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(prev => ({ ...prev, action: false }));
    }
  };

  // Start editing a document
  const startEditing = (doc) => {
    setEditedValue(JSON.stringify(doc, null, 2));
    setEditingDoc(doc._id);
    setError(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingDoc(null);
    setEditedValue('');
    setError(null);
  };

  // Format document for display
  const formatJsonForDisplay = (doc) => {
    try {
      // Highlight fields based on their types for better readability
      const formatted = JSON.stringify(doc, null, 2)
        .replace(/"_id":\s"([^"]+)"/g, '"_id": "<span class="text-blue-600">$1</span>"')
        .replace(/"(true|false)"/g, '<span class="text-purple-600">$1</span>')
        .replace(/:\s(\d+)(,?)/g, ': <span class="text-green-600">$1</span>$2');
      
      return <div dangerouslySetInnerHTML={{ __html: formatted }} />;
    } catch (e) {
      return <pre>{JSON.stringify(doc, null, 2)}</pre>;
    }
  };

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Pagination components
  const renderPagination = () => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    return (
      <div className="flex items-center justify-between mt-4">
        <div>
          <span className="text-sm text-gray-700">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
          </span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
            disabled={pagination.page === 1}
            className={`px-3 py-1 rounded ${pagination.page === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'}`}
          >
            &laquo;
          </button>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className={`px-3 py-1 rounded ${pagination.page === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'}`}
          >
            &lsaquo;
          </button>
          
          <select 
            value={pagination.page}
            onChange={(e) => setPagination(prev => ({ ...prev, page: parseInt(e.target.value) }))}
            className="px-2 py-1 rounded border"
          >
            {[...Array(totalPages)].map((_, i) => (
              <option key={i} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page >= totalPages}
            className={`px-3 py-1 rounded ${pagination.page >= totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'}`}
          >
            &rsaquo;
          </button>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: totalPages }))}
            disabled={pagination.page >= totalPages}
            className={`px-3 py-1 rounded ${pagination.page >= totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'}`}
          >
            &raquo;
          </button>
        </div>
        <div>
          <select
            value={pagination.limit}
            onChange={(e) => setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
            className="px-2 py-1 rounded border"
          >
            {[10, 25, 50, 100].map(value => (
              <option key={value} value={value}>
                {value} per page
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  // Stats card component
  const renderStats = () => {
    if (!stats) return (
      <div className="bg-white p-4 rounded-lg shadow mb-6 animate-pulse">
        <h2 className="text-xl font-bold mb-4">Database Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 p-3 rounded h-20"></div>
          ))}
        </div>
      </div>
    );

    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">Database Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.collectionsCount).map(([collection, count]) => (
            <div 
              key={collection} 
              className="bg-gray-50 p-3 rounded border-l-4 border-blue-500 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => fetchDocuments(collection)}
            >
              <h3 className="font-semibold text-gray-700">{collection}</h3>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-gray-500">documents</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Document component
  const renderDocument = (doc) => {
    if (editingDoc === doc._id) {
      return (
        <div key={doc._id} className="bg-white p-4 rounded shadow mb-4 border-l-4 border-yellow-500">
          <div className="mb-2 flex justify-between items-center">
            <h3 className="font-bold">Editing document ID: {doc._id}</h3>
            <div className="space-x-2">
              <button 
                className="text-red-500 hover:text-red-700"
                onClick={cancelEditing}
              >
                Cancel
              </button>
            </div>
          </div>
          <textarea
            className="w-full h-64 font-mono text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editedValue}
            onChange={(e) => setEditedValue(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button
              className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${loading.action ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              disabled={loading.action}
            >
              {loading.action ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={doc._id} className="bg-white p-4 rounded shadow mb-4 border-l-4 border-blue-500 hover:border-blue-600 transition-colors">
        <div className="mb-2 flex justify-between items-center">
          <h3 className="font-bold text-gray-700 truncate w-1/2">ID: {doc._id}</h3>
          <div className="space-x-2">
            <button
              className="text-blue-500 hover:text-blue-700"
              onClick={() => startEditing(doc)}
            >
              Edit
            </button>
            <button
              className="text-red-500 hover:text-red-700"
              onClick={() => handleDeleteDocument(doc._id)}
            >
              Delete
            </button>
          </div>
        </div>
        <div className="overflow-x-auto text-sm bg-gray-50 p-2 rounded font-mono">
          {formatJsonForDisplay(doc)}
        </div>
      </div>
    );
  };

  // Search and filter component
  const renderSearchAndFilters = () => {
    return (
      <div className="mb-4 flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
        <div className="flex-grow">
          <div className="relative">
            <input
              type="text"
              placeholder={`Search in ${selectedCollection || 'documents'}...`}
              className="w-full px-4 py-2 pr-10 rounded border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPagination(prev => ({ ...prev, page: 1 }));
                  fetchDocuments(selectedCollection);
                }
              }}
            />
            <button 
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setPagination(prev => ({ ...prev, page: 1 }));
                fetchDocuments(selectedCollection);
              }}
            >
              🔍
            </button>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            onClick={() => setIsCreatingDocument(true)}
          >
            Add Document
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => {
              setPagination(prev => ({ ...prev, page: 1 }));
              setSearchTerm('');
              fetchDocuments(selectedCollection);
            }}
          >
            Refresh
          </button>
        </div>
      </div>
    );
  };

  // Confirmation dialog
  const renderConfirmDialog = () => {
    if (!confirmAction) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md w-full">
          <h3 className="text-xl font-bold mb-4">Confirm Action</h3>
          <p className="mb-6">{confirmAction.message}</p>
          <div className="flex justify-end space-x-3">
            <button
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              onClick={confirmAction.cancel}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={confirmAction.confirm}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Create document modal
  const renderCreateDocumentModal = () => {
    if (!isCreatingDocument) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
        <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
          <h2 className="text-xl font-bold mb-4">Create New Document in {selectedCollection}</h2>
          <div className="mb-4">
            <textarea
              className="w-full h-64 font-mono text-sm p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={newDocument}
              onChange={(e) => setNewDocument(e.target.value)}
              placeholder="Enter JSON document..."
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              onClick={() => setIsCreatingDocument(false)}
            >
              Cancel
            </button>
            <button
              className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ${loading.action ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleCreateDocument}
              disabled={loading.action}
            >
              {loading.action ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          <div className="flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            <p>{error}</p>
          </div>
          <button 
            className="mt-2 text-sm text-red-700 hover:text-red-900"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xl mr-2">✅</span>
            <p>{success}</p>
          </div>
          <button 
            className="text-sm text-green-700 hover:text-green-900"
            onClick={() => setSuccess(null)}
          >
            ✕
          </button>
        </div>
      )}

      {renderStats()}

      <div className="mb-6 flex flex-wrap gap-4">
        <button
          className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700 transition-colors flex items-center"
          onClick={() => setIsCreatingUser(true)}
        >
          <span className="mr-2">👤</span> Create New User
        </button>
        <button
          className="bg-purple-600 text-white px-6 py-2 rounded shadow hover:bg-purple-700 transition-colors flex items-center"
          onClick={() => setIsCreatingSemester(true)}
        >
          <span className="mr-2">📅</span> Create New Semester
        </button>
        <button
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition-colors flex items-center"
          onClick={() => {
            fetchCollections();
            fetchStats();
          }}
        >
          <span className="mr-2">🔄</span> Refresh Dashboard
        </button>
      </div>

      {/* Create semester modal */}
      {isCreatingSemester && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Semester</h2>
            <form onSubmit={handleCreateSemester}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <input
                    type="number"
                    name="year"
                    defaultValue={new Date().getFullYear()}
                    min="2000"
                    max="2100"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Term</label>
                  <select
                    name="term"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    type="button"
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    onClick={() => setIsCreatingSemester(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${loading.action ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading.action}
                  >
                    {loading.action ? 'Creating...' : 'Create Semester'}
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
