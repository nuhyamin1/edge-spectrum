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
  ChevronUpIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  VideoCameraIcon,
  FunnelIcon,
  XMarkIcon
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

  // Add helper function to highlight matched text
  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      index % 2 === 1 ? (
        <mark key={index} className="rounded bg-amber-100 px-0.5 font-semibold text-slate-900">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const allSessions = Object.values(sessions).flatMap(yearData =>
    Object.values(yearData).flat()
  );
  const sessionCounts = allSessions.reduce((counts, session) => {
    counts.total += 1;
    counts[session.status] = (counts[session.status] || 0) + 1;
    return counts;
  }, { total: 0, scheduled: 0, active: 0, completed: 0 });
  const hasActiveFilters = Boolean(
    searchTerm || selectedYear || selectedSubject || selectedStatus || dateRange.start || dateRange.end
  );

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedYear('');
    setSelectedSubject('');
    setSelectedStatus('');
    setDateRange({ start: '', end: '' });
  };

  const matchesFilters = (session) => {
    const normalizedSearch = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      (session.title || '').toLowerCase().includes(normalizedSearch) ||
      (session.description || '').toLowerCase().includes(normalizedSearch);
    const matchesSubject = !selectedSubject || session.subject === selectedSubject;
    const matchesStatus = !selectedStatus || session.status === selectedStatus;
    const sessionDate = new Date(session.dateTime);
    const matchesDateRange =
      (!dateRange.start || sessionDate >= new Date(dateRange.start)) &&
      (!dateRange.end || sessionDate <= new Date(`${dateRange.end}T23:59:59`));

    return matchesSearch && matchesSubject && matchesStatus && matchesDateRange;
  };
  const matchingSessionCount = allSessions.filter(matchesFilters).length;

  // Modify the session rendering part
  const renderSession = (session) => {
    const titleMatch = searchTerm && 
      (session.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const descriptionMatch = searchTerm && 
      (session.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const statusStyles = {
      active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      completed: 'border-slate-200 bg-slate-100 text-slate-600',
      scheduled: 'border-amber-200 bg-amber-50 text-amber-700'
    };
    const enrolledCount = session.enrolledStudents?.length || 0;
  
    return (
      <div 
        key={session._id} 
        className="group/session rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5 sm:p-6"
      >
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${statusStyles[session.status] || statusStyles.scheduled}`}>
                {session.status || 'scheduled'}
              </span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{session.subject}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover/session:text-blue-800">
              {highlightText(session.title, searchTerm)}
              {!titleMatch && descriptionMatch && (
                <span className="ml-2 text-xs font-semibold text-slate-400">
                  Match in description
                </span>
              )}
            </h3>
            <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">
              {highlightText(session.description, searchTerm)}
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600">
              <span className="inline-flex items-center gap-2"><CalendarDaysIcon className="h-4 w-4 text-blue-600" />{formatDateTime(session.dateTime)}</span>
              <span className="inline-flex items-center gap-2"><ClockIcon className="h-4 w-4 text-blue-600" />{session.duration} min</span>
              <span className="inline-flex items-center gap-2"><UserGroupIcon className="h-4 w-4 text-blue-600" />{enrolledCount} enrolled</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 xl:max-w-[260px] xl:justify-end">
            {session.materials && (
              <a
                href={session.materials}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50"
              >
                Material <ArrowRightIcon className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={() => navigate(`/dashboard/session/${session._id}`)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            >
              View details
            </button>
            {session.status === 'active' && (
              <button
                onClick={() => navigate(`/teacher/classroom/${session._id}`)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <VideoCameraIcon className="h-4 w-4" /> Join live
              </button>
            )}
            {session.status !== 'active' && (
              <button
                onClick={() => navigate(`/teacher/classroom/${session._id}`)}
                className="rounded-lg bg-blue-700 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                Open classroom
              </button>
            )}
            <div className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" />
              <button
                onClick={() => navigate(`/dashboard/edit-session/${session._id}`)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-700"
                aria-label={`Edit ${session.title}`}
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDelete(session._id)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete ${session.title}`}
              >
                <TrashIcon className="h-5 w-5" />
              </button>
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
      <div className="mx-auto max-w-7xl space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-3xl bg-blue-950 px-6 py-8 text-white shadow-xl shadow-blue-950/10 sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10 bg-white/[0.04]" />
          <div className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full border border-white/10" />
          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">Teaching schedule</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">My sessions</h1>
              <p className="mt-3 max-w-xl leading-7 text-blue-100">
                Plan upcoming classes, manage enrollment, and enter live lessons from one organized workspace.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/create-session')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-950 shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-blue-950"
            >
              <PlusIcon className="h-5 w-5" /> Create new session
            </button>
          </div>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'All sessions', value: sessionCounts.total, icon: CalendarDaysIcon },
              { label: 'Live now', value: sessionCounts.active, icon: VideoCameraIcon },
              { label: 'Scheduled', value: sessionCounts.scheduled, icon: ClockIcon },
              { label: 'Completed', value: sessionCounts.completed, icon: CheckCircleIcon }
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-blue-100"><Icon className="h-5 w-5" /></div>
                <div><p className="text-2xl font-bold">{value}</p><p className="text-xs font-semibold text-blue-200">{label}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><FunnelIcon className="h-5 w-5" /></div>
              <div><h2 className="font-bold text-slate-900">Find a session</h2><p className="text-sm text-slate-500">Search and narrow your teaching schedule.</p></div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                <XMarkIcon className="h-4 w-4" /> Clear filters
              </button>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.5fr)_repeat(3,minmax(140px,0.7fr))]">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search title or description"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-24 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
              <button onClick={() => setSearchTerm(searchInput)} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800">Search</button>
            </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All Years</option>
                {Object.keys(sessions).sort((a, b) => b - a).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All Subjects</option>
                {getUniqueSubjects().map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">From</span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 pb-2 pt-5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="relative">
              <span className="pointer-events-none absolute left-3 top-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">To</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 pb-2 pt-5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>
        </section>

        {Object.keys(sessions).length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <CalendarDaysIcon className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-800">Create your first session</h2>
            <p className="mt-2 text-sm text-slate-500">Your teaching schedule will appear here once a session is added.</p>
            <button onClick={() => navigate('/dashboard/create-session')} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800"><PlusIcon className="h-5 w-5" /> Create session</button>
          </section>
        ) : matchingSessionCount === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-800">No sessions match</h2>
            <p className="mt-2 text-sm text-slate-500">Try changing your search or clearing the current filters.</p>
            <button onClick={clearAllFilters} className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800">Clear filters</button>
          </section>
        ) : (
          <div className="space-y-4">
            {Object.keys(sessions)
              .sort((a, b) => b - a)
              .map(year => {
                if (selectedYear && year !== selectedYear) return null;
                const yearHasMatches = Object.values(sessions[year]).some(semesterSessions =>
                  semesterSessions.some(matchesFilters)
                );
                if (!yearHasMatches) return null;
                
                return (
                  <section key={year} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between bg-slate-50 px-5 py-4 text-left transition hover:bg-blue-50 sm:px-6"
                      onClick={() => toggleYear(year)}
                    >
                      <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Academic year</p><h2 className="mt-0.5 text-xl font-bold text-slate-900">{year}</h2></div>
                      {expandedYears.has(year) ? <ChevronUpIcon className="h-5 w-5 text-slate-500" /> : <ChevronDownIcon className="h-5 w-5 text-slate-500" />}
                    </button>
                    
                    {expandedYears.has(year) && (
                      <div className="space-y-3 border-t border-slate-200 p-3 sm:p-5">
                        {Object.keys(sessions[year]).map(semester => {
                          const filteredSessions = sessions[year][semester].filter(matchesFilters);

                          if (filteredSessions.length === 0) return null;

                          return (
                            <div key={`${year}-${semester}`} className="rounded-xl border border-slate-200 bg-slate-50/50">
                              <button
                                type="button"
                                className="flex w-full items-center justify-between px-4 py-3 text-left sm:px-5"
                                onClick={() => toggleSemester(`${year}-${semester}`)}
                              >
                                <div className="flex items-center gap-3"><CalendarDaysIcon className="h-5 w-5 text-blue-600" /><h3 className="font-bold text-slate-800">{semester}</h3><span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">{filteredSessions.length}</span></div>
                                {expandedSemesters.has(`${year}-${semester}`) ? <ChevronUpIcon className="h-4 w-4 text-slate-500" /> : <ChevronDownIcon className="h-4 w-4 text-slate-500" />}
                              </button>
                              
                              {expandedSemesters.has(`${year}-${semester}`) && (
                                <div className="space-y-3 border-t border-slate-200 p-3 sm:p-4">
                                  {filteredSessions.map(session => renderSession(session))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SessionList;
