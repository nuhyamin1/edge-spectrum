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
  const [expandedYears, setExpandedYears] = useState(new Set());
  const [expandedSemesters, setExpandedSemesters] = useState(new Set());
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    fetchSessions();
  }, []);

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
        <div className="p-6 border-b border-blue-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-900 group-hover:text-blue-600 transition-colors">
            My Sessions
          </h2>
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
        
        {Object.keys(sessions).length === 0 ? (
          <div className="p-6 text-center text-gray-400">
            No sessions found. Create your first session!
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {Object.keys(sessions)
              .sort((a, b) => b - a) // Sort years in descending order
              .map(year => (
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
                      {Object.keys(sessions[year]).map(semester => (
                        <div key={`${year}-${semester}`} className="border-l border-gray-700/50">
                          <div
                            className="p-4 cursor-pointer flex items-center"
                            onClick={() => toggleSemester(`${year}-${semester}`)}
                          >
                            {expandedSemesters.has(`${year}-${semester}`) ? 
                              <ChevronUpIcon className="w-4 h-4 mr-2" /> : 
                              <ChevronDownIcon className="w-4 h-4 mr-2" />
                            }
                            <h4 className="text-lg font-medium text-gray-300">{semester}</h4>
                          </div>
                          
                          {expandedSemesters.has(`${year}-${semester}`) && (
                            <div className="pl-6">
                              {sessions[year][semester].map(session => (
                                <div 
                                  key={session._id} 
                                  className="relative p-6 hover:bg-blue-50 transition-all duration-300 group/item"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h3 className="text-lg font-semibold text-blue-900 group-hover/item:text-blue-600 transition-colors">
                                        {session.title}
                                      </h3>
                                      <p className="text-sm text-blue-600 mt-1">{session.subject}</p>
                                      <p className="text-sm text-blue-700 mt-2">
                                        {session.description}
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
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SessionList;
