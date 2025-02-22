import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../context/AuthContext';
import { useAuth } from '../../../context/AuthContext';
import Layout from '../Layout';
import { 
  PencilIcon, 
  TrashIcon, 
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon 
} from '@heroicons/react/24/outline';

const SessionList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modify the initial state for expanded sets
  const getCurrentYearAndSemester = () => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = now.getMonth();
    const semester = month < 6 ? 'January-June' : 'July-December';
    return { year, semester };
  };

  const { year: currentYear, semester: currentSemester } = getCurrentYearAndSemester();
  const [expandedYears, setExpandedYears] = useState(new Set([currentYear]));
  const [expandedSemesters, setExpandedSemesters] = useState(new Set([`${currentYear}-${currentSemester}`]));
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

  // Update expandedYears when year filter changes
  useEffect(() => {
    if (selectedYear) {
      setExpandedYears(new Set([selectedYear]));
      // Expand both semesters for the selected year
      setExpandedSemesters(new Set([
        `${selectedYear}-January-June`,
        `${selectedYear}-July-December`
      ]));
    }
  }, [selectedYear]);

  // Update expanded sections when any filter changes (including date range)
  useEffect(() => {
    if (searchTerm || selectedYear || selectedSubject || selectedStatus || dateRange.start || dateRange.end) {
      const yearsToExpand = new Set();
      const semestersToExpand = new Set();
      
      Object.keys(sessions).forEach(year => {
        Object.keys(sessions[year]).forEach(semester => {
          const hasMatch = sessions[year][semester].some(session => {
            const matchesSearch = !searchTerm || 
              session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              session.description.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesSubject = !selectedSubject || 
              session.subject === selectedSubject;

            const matchesStatus = !selectedStatus || 
              session.status === selectedStatus;

            const sessionDate = new Date(session.dateTime);
            const matchesDateRange = 
              (!dateRange.start || sessionDate >= new Date(dateRange.start)) &&
              (!dateRange.end || sessionDate <= new Date(dateRange.end));

            return matchesSearch && matchesSubject && matchesStatus && matchesDateRange;
          });

          if (hasMatch) {
            yearsToExpand.add(year);
            semestersToExpand.add(`${year}-${semester}`);
          }
        });
      });
      
      setExpandedYears(yearsToExpand);
      setExpandedSemesters(semestersToExpand);
    }
  }, [searchTerm, selectedYear, selectedSubject, selectedStatus, dateRange.start, dateRange.end, sessions]);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions/teacher');
      // Group sessions by year and semester
      const groupedSessions = groupSessionsByYearAndSemester(response.data);
      setSessions(groupedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        logout();
        navigate('/login');
      } else {
        toast.error('Failed to load sessions');
      }
    } finally {
      setLoading(false);
    }
  };

  const groupSessionsByYearAndSemester = (sessionsList) => {
    const grouped = {};
    
    sessionsList.forEach(session => {
      const date = new Date(session.dateTime);
      const year = date.getFullYear();
      const month = date.getMonth();
      const semester = month < 6 ? 'January-June' : 'July-December';
      
      if (!grouped[year]) {
        grouped[year] = {
          'January-June': [],
          'July-December': []
        };
      }
      
      grouped[year][semester].push(session);
    });

    // Sort sessions within each semester by date
    Object.keys(grouped).forEach(year => {
      Object.keys(grouped[year]).forEach(semester => {
        grouped[year][semester].sort((a, b) => 
          new Date(a.dateTime) - new Date(b.dateTime)
        );
      });
    });

    return grouped;
  };

  const toggleYear = (year) => {
    const newExpanded = new Set(expandedYears);
    if (newExpanded.has(year)) {
      newExpanded.delete(year);
    } else {
      newExpanded.add(year);
    }
    setExpandedYears(newExpanded);
  };

  const toggleSemester = (yearSemester) => {
    const newExpanded = new Set(expandedSemesters);
    if (newExpanded.has(yearSemester)) {
      newExpanded.delete(yearSemester);
    } else {
      newExpanded.add(yearSemester);
    }
    setExpandedSemesters(newExpanded);
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await api.delete(`/sessions/${sessionId}`);
      toast.success('Session deleted successfully');
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getUniqueSubjects = () => {
    const subjects = new Set();
    Object.values(sessions).forEach(yearData => {
      Object.values(yearData).forEach(semesterData => {
        semesterData.forEach(session => {
          if (session.subject) {
            subjects.add(session.subject);
          }
        });
      });
    });
    return Array.from(subjects);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setSearchTerm(searchInput);
    }
  };

  // Add function to clear date range
  const clearDateRange = () => {
    setDateRange({ start: '', end: '' });
  };

  // Add helper function to highlight matched text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 font-medium">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Modify the session rendering part
  const renderSession = (session) => {
    const titleMatch = searchTerm && 
      session.title.toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = searchTerm && 
      session.description.toLowerCase().includes(searchTerm.toLowerCase());

    return (
      <div 
        key={session._id} 
        className="relative p-6 hover:bg-blue-50 transition-all duration-300 group/item"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 group-hover/item:text-blue-600 transition-colors">
              {highlightText(session.title, searchTerm)}
              {!titleMatch && descriptionMatch && (
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  (matched in description)
                </span>
              )}
            </h3>
            <p className="text-sm text-blue-600 mt-1">{session.subject}</p>
            <p className="text-sm text-blue-700 mt-2">
              {highlightText(session.description, searchTerm)}
            </p>
            {session.materials && (
              <a
                href={session.materials}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm mt-2 inline-flex items-center gap-1"
              >
                View Materials
                <ArrowRightIcon className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="text-right ml-6 flex flex-col items-end">
            <p className="text-sm text-blue-700">
              {formatDateTime(session.dateTime)}
            </p>
            <div className="mt-2 space-x-2">
              <button
                onClick={() => navigate(`/teacher/classroom/${session._id}`)}
                className={`px-6 py-2 rounded-lg transition-all duration-300 
                border hover:shadow-lg w-[140px]
                ${session.status === 'active' 
                  ? 'bg-green-500 text-white border-green-400 hover:bg-green-600' 
                  : session.status === 'completed'
                  ? 'bg-gray-500 text-white border-gray-400 hover:bg-gray-600'
                  : 'bg-blue-500 text-white border-blue-400 hover:bg-blue-600'
                }`}
              >
                {session.status === 'active' 
                  ? 'Live' 
                  : session.status === 'completed' 
                  ? 'Completed' 
                  : 'Scheduled'}
              </button>
              <button
                onClick={() => navigate(`/dashboard/edit-session/${session._id}`)}
                className="p-2 text-blue-600 hover:text-blue-700 transition-colors
                rounded-lg hover:bg-blue-50"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleDelete(session._id)}
                className="p-2 text-red-500 hover:text-red-600 transition-colors
                rounded-lg hover:bg-red-50"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout userType="teacher">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="teacher">
      <div className="relative bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden 
        border border-blue-200 group hover:border-blue-400
        transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20">
        
        {/* Header */}
        <div className="p-6 border-b border-blue-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-blue-900">My Sessions</h2>
            <button
              onClick={() => navigate('/dashboard/create-session')}
              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg 
              hover:bg-blue-600 transition-all duration-300 
              border border-blue-400 
              hover:shadow-lg hover:shadow-blue-400/20
              flex items-center gap-2"
            >
              <PencilIcon className="w-5 h-5" />
              Create New Session
            </button>
          </div>

          {/* Search Bar - Full Width */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search by title or description... (Press Enter)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-4">
            {/* Dropdowns Row */}
            <div className="flex gap-4 flex-wrap flex-1">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg min-w-[150px]"
              >
                <option value="">All Years</option>
                {Object.keys(sessions).sort((a, b) => b - a).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg min-w-[150px]"
              >
                <option value="">All Subjects</option>
                {getUniqueSubjects().map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="p-2 border border-gray-300 rounded-lg min-w-[150px]"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Date Range Row */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="p-2 border border-gray-300 rounded-lg w-[150px]"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="p-2 border border-gray-300 rounded-lg w-[150px]"
              />
              {(dateRange.start || dateRange.end) && (
                <button
                  onClick={clearDateRange}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Clear date range"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {Object.keys(sessions).length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No sessions found. Create your first session!
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {Object.keys(sessions)
              .sort((a, b) => b - a)
              .map(year => {
                if (selectedYear && year !== selectedYear) return null;
                
                return (
                  <div key={year} className="border-b border-gray-700/50">
                    <div
                      className="p-4 bg-blue-50 cursor-pointer flex items-center"
                      onClick={() => toggleYear(year)}
                    >
                      {expandedYears.has(year) ? 
                        <ChevronUpIcon className="w-5 h-5 mr-2 text-blue-600" /> : 
                        <ChevronDownIcon className="w-5 h-5 mr-2 text-blue-600" />
                      }
                      <h3 className="text-xl font-semibold text-blue-900">{year}</h3>
                    </div>
                    
                    {expandedYears.has(year) && (
                      <div className="pl-6">
                        {Object.keys(sessions[year]).map(semester => {
                          const filteredSessions = sessions[year][semester].filter(session => {
                            const matchesSearch = !searchTerm || 
                              session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              session.description.toLowerCase().includes(searchTerm.toLowerCase());

                            const matchesSubject = !selectedSubject || 
                              session.subject === selectedSubject;

                            const matchesStatus = !selectedStatus || 
                              session.status === selectedStatus;

                            const sessionDate = new Date(session.dateTime);
                            const matchesDateRange = 
                              (!dateRange.start || sessionDate >= new Date(dateRange.start)) &&
                              (!dateRange.end || sessionDate <= new Date(dateRange.end));

                            return matchesSearch && matchesSubject && matchesStatus && matchesDateRange;
                          });

                          if (filteredSessions.length === 0) return null;

                          return (
                            <div key={`${year}-${semester}`} className="border-l border-gray-700/50">
                              <div
                                className="p-4 cursor-pointer flex items-center"
                                onClick={() => toggleSemester(`${year}-${semester}`)}
                              >
                                {expandedSemesters.has(`${year}-${semester}`) ? 
                                  <ChevronUpIcon className="w-4 h-4 mr-2" /> : 
                                  <ChevronDownIcon className="w-4 h-4 mr-2" />
                                }
                                <h4 className="text-lg font-medium text-gray-700">{semester}</h4>
                              </div>
                              
                              {expandedSemesters.has(`${year}-${semester}`) && (
                                <div className="pl-6">
                                  {filteredSessions.map(session => renderSession(session))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SessionList;
