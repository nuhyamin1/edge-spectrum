import React, { useState, useEffect } from 'react';
import axios from '../../../utils/axios';
import Layout from '../Layout';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  ClockIcon,
  FunnelIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  VideoCameraIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const AvailableSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolledSessions, setEnrolledSessions] = useState([]);
  const [error, setError] = useState(null);
  const [gracePeriodTimers, setGracePeriodTimers] = useState({});
  
  // Add new state for search and filters
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const navigate = useNavigate();

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

  // Add function to get unique subjects
  const getUniqueSubjects = () => {
    const subjects = new Set();
    sessions.forEach(session => {
      if (session.subject) {
        subjects.add(session.subject);
      }
    });
    return Array.from(subjects);
  };

  // Add handler for search input
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      setSearchTerm(searchInput);
    }
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setError(null);
        const [availableResponse, enrolledResponse] = await Promise.all([
          axios.get('/api/sessions/available'),
          axios.get('/api/sessions/enrolled')
        ]);

        if (availableResponse.data) {
          setSessions(availableResponse.data);
          // Initialize grace period timers for active sessions
          const timers = {};
          availableResponse.data.forEach(session => {
            if (session.status === 'active' && session.startedAt) {
              updateGracePeriodTimer(session._id, new Date(session.startedAt), session.gracePeriod);
            }
          });
          setGracePeriodTimers(timers);
        }
        
        if (enrolledResponse.data) {
          setEnrolledSessions(enrolledResponse.data.map(session => session._id));
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to load available sessions';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();

    // Set up Socket.IO connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true
    });

    // Handle session updates
    socket.on('sessionUpdate', (data) => {
      switch (data.type) {
        case 'statusUpdate':
          setSessions(prevSessions => {
            const updatedSessions = prevSessions.map(session => {
              if (session._id === data.sessionId) {
                // Get the current time in ISO format
                const now = new Date().toISOString();
                const updatedSession = { 
                  ...session, 
                  status: data.status,
                  startedAt: data.status === 'active' ? now : session.startedAt 
                };
                
                // Initialize timer if session becomes active
                if (data.status === 'active') {
                  console.log('Session became active:', updatedSession);
                  updateGracePeriodTimer(session._id, new Date(), session.gracePeriod);
                }
                return updatedSession;
              }
              return session;
            });
            return updatedSessions;
          });
          break;

        case 'sessionCreated':
          // Only add if the session is in the future
          const currentDate = new Date();
          const sessionDate = new Date(data.session.dateTime);
          if (sessionDate > currentDate) {
            setSessions(prevSessions => [...prevSessions, data.session].sort((a, b) => 
              new Date(a.dateTime) - new Date(b.dateTime)
            ));
          }
          break;

        case 'sessionDeleted':
          setSessions(prevSessions => 
            prevSessions.filter(session => session._id !== data.sessionId)
          );
          // Clear timer if exists
          if (gracePeriodTimers[data.sessionId]?.interval) {
            clearInterval(gracePeriodTimers[data.sessionId].interval);
            setGracePeriodTimers(prev => {
              const newTimers = { ...prev };
              delete newTimers[data.sessionId];
              return newTimers;
            });
          }
          break;

        default:
          break;
      }
    });

    // Handle connection errors
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Real-time updates connection failed');
    });

    // Cleanup function to clear all intervals
    return () => {
      Object.values(gracePeriodTimers).forEach(timer => {
        if (timer.interval) clearInterval(timer.interval);
      });
      socket.disconnect();
    };
  }, []);

  const updateGracePeriodTimer = (sessionId, startTime, gracePeriod) => {
    const endTime = new Date(startTime.getTime() + gracePeriod * 60000);
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const timeLeft = endTime - now;
      
      if (timeLeft <= 0) {
        if (gracePeriodTimers[sessionId]?.interval) {
          clearInterval(gracePeriodTimers[sessionId].interval);
        }
        setGracePeriodTimers(prev => ({
          ...prev,
          [sessionId]: { timeLeft: 0, interval: null }
        }));
        return 0;
      }
      
      return timeLeft;
    };

    const interval = setInterval(() => {
      const timeLeft = calculateTimeLeft();
      setGracePeriodTimers(prev => ({
        ...prev,
        [sessionId]: { ...prev[sessionId], timeLeft }
      }));
    }, 1000);

    setGracePeriodTimers(prev => ({
      ...prev,
      [sessionId]: { timeLeft: calculateTimeLeft(), interval }
    }));
  };

  const formatTimeLeft = (timeLeft) => {
    if (timeLeft <= 0) return 'Grace period expired';
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes}m ${seconds}s remaining`;
  };

  const handleEnrollment = async (sessionId, isEnrolled) => {
    try {
      const endpoint = isEnrolled ? 'unenroll' : 'enroll';
      await axios.post(`/api/sessions/${sessionId}/${endpoint}`);
      
      if (isEnrolled) {
        setEnrolledSessions(enrolledSessions.filter(id => id !== sessionId));
        toast.success('Successfully unenrolled from session');
      } else {
        setEnrolledSessions([...enrolledSessions, sessionId]);
        toast.success('Successfully enrolled in session');
      }
    } catch (error) {
      console.error('Enrollment error:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.details || 'Failed to update enrollment';
      toast.error(errorMessage);
    }
  };

  const handleJoinSession = (session) => {
    try {
      console.log('Attempting to join session:', session);
      
      // Check if session is active
      if (session.status !== 'active') {
        toast.error('This session is not currently active');
        return;
      }

      if (!session.startedAt) {
        console.error('Session startedAt is missing:', session);
        toast.error('Session start time information is missing');
        return;
      }

      // Calculate if within grace period
      const startTime = new Date(session.startedAt);
      const currentTime = new Date();
      const gracePeriodEnd = new Date(startTime.getTime() + (session.gracePeriod * 60000));

      console.log('Grace period calculation:', {
        startTime,
        currentTime,
        gracePeriodEnd,
        gracePeriod: session.gracePeriod
      });

      if (currentTime > gracePeriodEnd) {
        toast.error('Grace period has expired for this session');
        return;
      }

      // Store grace period info in sessionStorage
      const storageKey = `gracePeriod_${session._id}`;
      const gracePeriodInfo = {
        startedAt: session.startedAt,
        gracePeriod: session.gracePeriod,
        endTime: gracePeriodEnd.toISOString(),
        sessionId: session._id
      };

      console.log('Storing grace period info:', gracePeriodInfo);
      
      // Store the data and verify it was stored correctly
      sessionStorage.setItem(storageKey, JSON.stringify(gracePeriodInfo));
      const storedData = sessionStorage.getItem(storageKey);
      
      if (!storedData) {
        console.error('Failed to store session data');
        toast.error('Failed to prepare session data');
        return;
      }

      console.log('Verified stored data:', storedData);
      console.log('Navigating to classroom...');

      // If within grace period and data is stored, proceed to join
      navigate(`/classroom/${session._id}`);
    } catch (error) {
      console.error('Error joining session:', error);
      toast.error('Failed to join session');
    }
  };

  const filteredSessions = sessions.filter(session => {
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
  });
  const liveCount = sessions.filter(session => session.status === 'active').length;
  const scheduledCount = sessions.filter(session => (session.status || 'scheduled') === 'scheduled').length;
  const enrolledCount = enrolledSessions.length;
  const hasActiveFilters = Boolean(searchTerm || selectedSubject || selectedStatus || dateRange.start || dateRange.end);

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedSubject('');
    setSelectedStatus('');
    setDateRange({ start: '', end: '' });
  };

  if (loading) {
    return (
      <Layout userType="student">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">Loading sessions...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout userType="student">
        <div className="container mx-auto px-4 py-8">
          <div className="text-red-500 text-center py-8">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="student">
      <div className="mx-auto max-w-7xl space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-3xl bg-blue-950 px-6 py-8 text-white shadow-xl shadow-blue-950/10 sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10 bg-white/[0.04]" />
          <div className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full border border-white/10" />
          <div className="relative max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-200">Learning schedule</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Find your next session</h1>
            <p className="mt-3 max-w-xl leading-7 text-blue-100">Explore upcoming lessons, manage your enrollment, and join live classes when they begin.</p>
          </div>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Available', value: sessions.length, icon: CalendarDaysIcon },
              { label: 'Enrolled', value: enrolledCount, icon: UserGroupIcon },
              { label: 'Live now', value: liveCount, icon: VideoCameraIcon },
              { label: 'Coming up', value: scheduledCount, icon: ClockIcon }
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
              <div><h2 className="font-bold text-slate-900">Find the right class</h2><p className="text-sm text-slate-500">Search by topic, status, or date.</p></div>
            </div>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><XMarkIcon className="h-4 w-4" /> Clear filters</button>
            )}
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.5fr)_repeat(2,minmax(160px,0.7fr))]">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={handleSearchKeyPress} placeholder="Search sessions" className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-24 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
              <button onClick={() => setSearchTerm(searchInput)} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-800">Search</button>
            </div>
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
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="scheduled">Scheduled</option>
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

        {/* Sessions List */}
        {filteredSessions.length === 0 && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <AcademicCapIcon className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-lg font-bold text-slate-800">No sessions match</h2>
            <p className="mt-2 text-sm text-slate-500">Try changing your search or clearing the current filters.</p>
            {hasActiveFilters && <button onClick={clearAllFilters} className="mt-5 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white hover:bg-blue-800">Clear filters</button>}
          </section>
        )}
        <div className="grid gap-5 lg:grid-cols-2">
          {filteredSessions.map((session) => {
              const isEnrolled = enrolledSessions.includes(session._id);
              const status = session.status || 'scheduled';
              const isActive = status === 'active';
              const isCompleted = status === 'completed';
              
              const titleMatch = searchTerm && 
                session.title.toLowerCase().includes(searchTerm.toLowerCase());
              const descriptionMatch = searchTerm && 
                session.description.toLowerCase().includes(searchTerm.toLowerCase());

              return (
                <article key={session._id} className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-950/5 sm:p-6">
                  <div className="flex h-full flex-col">
                    <div className="flex-1 text-left">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-800">
                          {highlightText(session.title, searchTerm)}
                          {!titleMatch && descriptionMatch && (
                            <span className="ml-2 text-xs font-semibold text-slate-400">
                              Match in description
                            </span>
                          )}
                        </h3>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
                          isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
                          isCompleted ? 'border-slate-200 bg-slate-100 text-slate-600' :
                          'border-amber-200 bg-amber-50 text-amber-700'
                        }`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-blue-700">
                        {session.subject} • Taught by {session.teacher?.name || 'Unknown Teacher'}
                      </p>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                        {highlightText(session.description, searchTerm)}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-600">
                        <span>Duration: {session.duration} mins</span>
                        <span className="mx-2">•</span>
                        <span>Grace Period: {session.gracePeriod || 5} mins</span>
                      </div>
                      {session.materials && (
                        <a 
                          href={session.materials} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-900"
                        >
                          <LinkIcon className="h-4 w-4" /> View material
                        </a>
                      )}
                      {session.status === 'active' && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-sm font-bold text-emerald-800">
                            This session is live
                          </p>
                          <p className="mt-1 text-sm text-emerald-700">
                            Grace period: {gracePeriodTimers[session._id] ? 
                              formatTimeLeft(gracePeriodTimers[session._id].timeLeft) :
                              `${session.gracePeriod} minutes`}
                          </p>
                          {session.startedAt && (
                            <p className="mt-1 text-xs text-emerald-600">
                              Started at: {new Date(session.startedAt).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600">
                        <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                        {new Date(session.dateTime).toLocaleString()}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button onClick={() => navigate(`/dashboard/session/${session._id}`)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700">View details</button>
                        <div className="flex-1" />
                        {!isCompleted && (
                          <button
                            onClick={() => handleEnrollment(session._id, isEnrolled)}
                            className={`rounded-lg px-3 py-2 text-sm font-bold transition
                              ${isEnrolled ? 
                                'border border-red-200 text-red-600 hover:bg-red-50' :
                                'bg-blue-700 text-white hover:bg-blue-800'
                              }`}
                          >
                            {isEnrolled ? 'Leave session' : 'Enroll'}
                          </button>
                        )}

                        {isActive && isEnrolled && (
                          <button
                            onClick={() => handleJoinSession(session)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                          >
                            <VideoCameraIcon className="h-4 w-4" /> Join live
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </Layout>
  );
};

export default AvailableSessions;
