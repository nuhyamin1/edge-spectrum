import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Layout from '../Layout';
import axios from '../../../utils/axios';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const SemesterManagement = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    term: 'January-June',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      const response = await axios.get('/api/semesters');
      setSemesters(response.data);
    } catch (error) {
      console.error('Error fetching semesters:', error);
      toast.error('Failed to load semesters');
    } finally {
      setLoading(false);
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
    try {
      if (editingSemester) {
        await axios.put(`/api/semesters/${editingSemester._id}`, formData);
        toast.success('Semester updated successfully');
      } else {
        await axios.post('/api/semesters', formData);
        toast.success('Semester created successfully');
      }
      fetchSemesters();
      resetForm();
    } catch (error) {
      console.error('Error saving semester:', error);
      toast.error(error.response?.data?.error || 'Failed to save semester');
    }
  };

  const handleEdit = (semester) => {
    setEditingSemester(semester);
    setFormData({
      year: semester.year,
      term: semester.term,
      startDate: new Date(semester.startDate).toISOString().split('T')[0],
      endDate: new Date(semester.endDate).toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (semesterId) => {
    if (!window.confirm('Are you sure you want to delete this semester?')) {
      return;
    }

    try {
      await axios.delete(`/api/semesters/${semesterId}`);
      toast.success('Semester deleted successfully');
      fetchSemesters();
    } catch (error) {
      console.error('Error deleting semester:', error);
      toast.error(error.response?.data?.error || 'Failed to delete semester');
    }
  };

  const resetForm = () => {
    setFormData({
      year: new Date().getFullYear(),
      term: 'January-June',
      startDate: '',
      endDate: ''
    });
    setEditingSemester(null);
    setShowForm(false);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-100">Semester Management</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-gray-800 text-neon-blue rounded-lg 
              hover:bg-gray-700 transition-all duration-300 
              border border-gray-700 hover:border-neon-blue/50
              hover:shadow-lg hover:shadow-neon-blue/20
              flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Semester
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="relative bg-gray-800/50 backdrop-blur-sm rounded-xl p-6
            border border-gray-700 hover:border-neon-blue/50
            transition-all duration-300">
            <div className="absolute top-4 right-4">
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-neon-blue transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-xl font-semibold text-gray-100 mb-4">
              {editingSemester ? 'Edit Semester' : 'Create New Semester'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Year
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    min="2000"
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                      text-gray-100 placeholder-gray-500
                      focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                      transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Term
                  </label>
                  <select
                    name="term"
                    value={formData.term}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                      text-gray-100
                      focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                      transition-all duration-300"
                  >
                    <option value="January-June">January-June</option>
                    <option value="July-December">July-December</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                      text-gray-100
                      focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                      transition-all duration-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg
                      text-gray-100
                      focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue
                      transition-all duration-300"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
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
                  {editingSemester ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Semesters List */}
        <div className="grid gap-4">
          {semesters.map((semester) => (
            <div
              key={semester._id}
              className="relative bg-gray-800/30 rounded-lg p-6
                border border-gray-700 hover:border-neon-blue/50
                transition-all duration-300 group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 group-hover:text-neon-blue transition-colors">
                    {semester.year} - {semester.term}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(semester.startDate).toLocaleDateString()} - {new Date(semester.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(semester)}
                    className="p-2 text-gray-400 hover:text-neon-blue transition-colors
                      rounded-lg hover:bg-gray-700/50"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(semester._id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors
                      rounded-lg hover:bg-gray-700/50"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SemesterManagement; 