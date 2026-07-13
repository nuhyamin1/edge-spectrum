import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../../utils/axios';
import Layout from '../Layout';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import {
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { io } from 'socket.io-client';
import VideoRoom from '../VideoRoom';
import Whiteboard from '../Whiteboard';
import ExerciseRoom from '../ExerciseRoom';
import { FaHome, FaUserCheck, FaVideo, FaChalkboard, FaComments, FaBook, FaPlayCircle, FaTimesCircle, FaFolder } from 'react-icons/fa';
import DiscussionRoom from '../DiscussionRoom';
import MaterialRoom from '../MaterialRoom';
import { exitAppFullscreen, requestAppFullscreen } from '../../../utils/browserFullscreen';

const Classroom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('attendance');
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [attendanceFilter, setAttendanceFilter] = useState('all');
  const [updatingStudentIds, setUpdatingStudentIds] = useState(() => new Set());
  const [bulkAttendanceStatus, setBulkAttendanceStatus] = useState(null);
  const [exerciseContent, setExerciseContent] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const socketRef = useRef(null);
  const sidebarRef = useRef(null);

  const enterVideoRoom = () => {
    requestAppFullscreen();
    setIsMobileMenuOpen(false);
    setActiveTab('video');
  };

  const exitVideoRoom = () => {
    exitAppFullscreen();
    setActiveTab('attendance');
  };

  const updateAttendanceStatus = useCallback((studentId, status) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  }, []);

  const handleStudentJoined = useCallback(async (data) => {
    console.log('Student joined classroom event received:', data);
    if (data.sessionId === sessionId) {
      try {
        // Update attendance status in the database
        await axios.post(`/api/sessions/${sessionId}/attendance`, {
          studentId: data.studentId,
          status: 'present'
        });

        // Update local attendance state
        updateAttendanceStatus(data.studentId, 'present');

        // Update enrolledStudents list using a functional update to avoid stale socket closures.
        setSession(prevSession => {
          if (!prevSession?.enrolledStudents) return prevSession;

          // Update existing student info if found
          const updatedStudents = prevSession.enrolledStudents.map(student => {
            if (student._id === data.studentId) {
              return {
                ...student,
                name: data.studentName,
                email: data.studentEmail,
                profilePicture: data.studentProfilePicture
              };
            }
            return student;
          });

          // If the student isn't in the list, add them
          if (!prevSession.enrolledStudents.some(student => student._id === data.studentId)) {
            updatedStudents.push({
              _id: data.studentId,
              name: data.studentName,
              email: data.studentEmail,
              profilePicture: data.studentProfilePicture
            });
          }

          return {
            ...prevSession,
            enrolledStudents: updatedStudents
          };
        });

        // Emit attendance update to all clients
        if (socketRef.current) {
          socketRef.current.emit('attendanceUpdate', {
            sessionId,
            studentId: data.studentId,
            status: 'present'
          });
        }
      } catch (error) {
        console.error('Error updating attendance status:', error);
        toast.error('Failed to update attendance status');
      }
    }
  }, [sessionId, updateAttendanceStatus]);

  // Initialize socket connection
  useEffect(() => {
    console.log('Initializing socket connection...');
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('Teacher socket connected:', socket.id);
      // Join the session room
      socket.emit('join', { sessionId });
    });

    socket.on('studentJoinedClassroom', (data) => {
      console.log('Received studentJoinedClassroom event:', data);
      handleStudentJoined(data);
    });

    socket.on('attendanceStatusChanged', (data) => {
      console.log('Received attendanceStatusChanged event:', data);
      if (data.sessionId === sessionId) {
        updateAttendanceStatus(data.studentId, data.status);
      }
    });

    socketRef.current = socket;

    return () => {
      console.log('Cleaning up socket connection...');
      if (socket) {
        socket.disconnect();
      }
    };
  }, [sessionId, handleStudentJoined, updateAttendanceStatus]);

  const fetchSessionDetails = useCallback(async () => {
    try {
      const [sessionResponse, attendanceResponse] = await Promise.all([
        axios.get(`/api/sessions/${sessionId}`),
        axios.get(`/api/sessions/${sessionId}/attendance`)
      ]);

      setSession(sessionResponse.data);
      
      // Initialize attendance status from database
      const initialStatus = {};
      sessionResponse.data.enrolledStudents.forEach(student => {
        const attendanceRecord = attendanceResponse.data.find(record => record.studentId === student._id);
        initialStatus[student._id] = attendanceRecord?.status || 'absent';
      });
      
      setAttendanceStatus(initialStatus);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session details');
      navigate('/dashboard');
    }
  }, [sessionId, navigate]);

  // Fetch initial session details
  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  // Handle click outside sidebar to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && 
          !sidebarRef.current.contains(event.target) && 
          isMobileMenuOpen) {
        // Check if the click is not on the menu button
        const menuButton = document.querySelector('.mobile-menu-button');
        if (!menuButton.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const toggleAttendance = useCallback(async (studentId) => {
    const newStatus = attendanceStatus[studentId] === 'present' ? 'absent' : 'present';

    setUpdatingStudentIds(prev => new Set(prev).add(studentId));
    try {
      // Update attendance status in the database
      await axios.post(`/api/sessions/${sessionId}/attendance`, {
        studentId,
        status: newStatus
      });

      // Update local state
      updateAttendanceStatus(studentId, newStatus);

      // Emit socket event for real-time update
      if (socketRef.current) {
        socketRef.current.emit('attendanceUpdate', {
          sessionId,
          studentId,
          status: newStatus
        });
      }
    } catch (error) {
      console.error('Error updating attendance status:', error);
      toast.error('Failed to update attendance status');
    } finally {
      setUpdatingStudentIds(prev => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  }, [sessionId, attendanceStatus, updateAttendanceStatus]);

  const handleMarkAllAttendance = useCallback(async (status) => {
    if (!session.enrolledStudents.length || bulkAttendanceStatus) return;

    setBulkAttendanceStatus(status);
    try {
      const promises = session.enrolledStudents.map(student => 
        axios.post(`/api/sessions/${sessionId}/attendance`, {
          studentId: student._id,
          status
        })
      );
      
      await Promise.all(promises);

      const newStatus = {};
      session.enrolledStudents.forEach(student => {
        newStatus[student._id] = status;
        
        // Emit socket event for each student
        if (socketRef.current) {
          socketRef.current.emit('attendanceUpdate', {
            sessionId,
            studentId: student._id,
            status
          });
        }
      });
      
      setAttendanceStatus(newStatus);
      toast.success(`Marked all students as ${status}`);
    } catch (error) {
      console.error(`Error marking all ${status}:`, error);
      toast.error('Failed to update attendance status');
    } finally {
      setBulkAttendanceStatus(null);
    }
  }, [session, sessionId, bulkAttendanceStatus]);

  const handleMarkAllPresent = useCallback(() => handleMarkAllAttendance('present'), [handleMarkAllAttendance]);
  const handleMarkAllAbsent = useCallback(() => handleMarkAllAttendance('absent'), [handleMarkAllAttendance]);

  const handleStartSession = async () => {
    try {
      const response = await axios.post(`/api/sessions/${sessionId}/start`);
      setSession(response.data);
      toast.success('Session started successfully');
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error(error.response?.data?.error || 'Failed to start session');
    }
  };

  const handleEndSession = async () => {
    try {
      const response = await axios.post(`/api/sessions/${sessionId}/end`);
      setSession(response.data);
      toast.success('Session ended successfully');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error(error.response?.data?.error || 'Failed to end session');
    }
  };

  if (loading) {
    return (
      <Layout userType="teacher">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading classroom...</div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout userType="teacher">
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">Session not found</div>
        </div>
      </Layout>
    );
  }

  const enrolledStudents = session.enrolledStudents || [];
  const presentCount = enrolledStudents.filter(student => attendanceStatus[student._id] === 'present').length;
  const absentCount = enrolledStudents.length - presentCount;
  const normalizedSearch = attendanceSearch.trim().toLowerCase();
  const filteredStudents = enrolledStudents.filter(student => {
    const matchesSearch = !normalizedSearch ||
      (student.name || '').toLowerCase().includes(normalizedSearch) ||
      (student.email || '').toLowerCase().includes(normalizedSearch);
    const matchesStatus = attendanceFilter === 'all' || attendanceStatus[student._id] === attendanceFilter;
    return matchesSearch && matchesStatus;
  });


  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed md:hidden z-[100] top-4 right-4 p-3 bg-slate-900 rounded-full shadow-lg hover:bg-slate-800 transition-colors mobile-menu-button"
        aria-label={isMobileMenuOpen ? 'Close classroom menu' : 'Open classroom menu'}
        aria-expanded={isMobileMenuOpen}
      >
        <svg 
          className="w-8 h-8 text-white" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
      </button>

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`fixed md:relative z-40 w-16 bg-gray-800 flex flex-col items-center py-4 border-r border-gray-700 space-y-8 transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Section */}
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors duration-200"
          title="Back to Dashboard"
        >
          <FaHome size={24} />
        </button>

        {/* Divider */}
        <div className="w-8 border-t border-gray-700"></div>

        {/* Tab Icons */}
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'attendance' 
              ? 'text-blue-500 bg-gray-700' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Attendance Room"
        >
          <FaUserCheck size={24} />
        </button>

        <button 
          onClick={enterVideoRoom}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'video' 
              ? 'text-blue-500 bg-gray-700' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Video Room"
        >
          <FaVideo size={24} />
        </button>

        <button 
          onClick={() => setActiveTab('whiteboard')}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'whiteboard' 
              ? 'text-blue-500 bg-gray-700' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Whiteboard"
        >
          <FaChalkboard size={24} />
        </button>

        <button 
          onClick={() => setActiveTab('discussion')}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'discussion' 
              ? 'text-blue-500 bg-gray-700' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Discussion Room"
        >
          <FaComments size={24} />
        </button>

        <button 
          onClick={() => setActiveTab('exercise')}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'exercise' 
              ? 'text-blue-500 bg-gray-700' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Exercise Room"
        >
          <FaBook size={24} />
        </button>

        <button 
          onClick={() => setActiveTab('material')}
          className={`p-2 rounded-lg transition-colors duration-200 ${
            activeTab === 'material' 
              ? 'text-blue-500 bg-gray-700' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Material Room"
        >
          <FaFolder size={24} />
        </button>

        {/* Bottom Section with Session Control */}
        <div className="mt-auto">
          <div className="w-8 border-t border-gray-700 mb-4"></div>
          {session.status === 'scheduled' && (
            <button
              onClick={handleStartSession}
              className="text-green-500 hover:text-green-400 p-2 rounded-lg transition-colors duration-200"
              title="Start Session"
            >
              <FaPlayCircle size={24} />
            </button>
          )}
          {session.status === 'active' && (
            <button
              onClick={handleEndSession}
              className="text-red-500 hover:text-red-400 p-2 rounded-lg transition-colors duration-200"
              title="End Session"
            >
              <FaTimesCircle size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <Layout userType="teacher">
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/60">
            {/* Tab Content */}
            <div className="p-4 sm:p-6 lg:p-8">
              {activeTab === 'attendance' && (
                <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-white/80 bg-white shadow-xl shadow-slate-200/60">
                  <div className="relative overflow-hidden bg-gradient-to-r from-blue-950 via-blue-800 to-indigo-700 px-5 py-7 text-white sm:px-8 sm:py-9">
                    <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
                    <div className="absolute right-28 top-16 h-28 w-28 rounded-full bg-cyan-300/10" />
                    <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                      <div>
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-50 backdrop-blur-sm">
                            {session.subject || 'Class session'}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            session.status === 'active' ? 'bg-emerald-400/20 text-emerald-100' : 'bg-white/15 text-blue-50'
                          }`}>
                            <span className={`h-2 w-2 rounded-full ${session.status === 'active' ? 'bg-emerald-300 animate-pulse' : 'bg-blue-200'}`} />
                            {session.status || 'scheduled'}
                          </span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Attendance Room</h1>
                        <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
                          {session.title || 'Review and update student attendance for this class.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={handleMarkAllPresent}
                          disabled={Boolean(bulkAttendanceStatus) || updatingStudentIds.size > 0 || !enrolledStudents.length}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                          {bulkAttendanceStatus === 'present' ? <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" /> : <CheckIcon className="mr-2 h-5 w-5" />}
                          Mark all present
                        </button>
                        <button
                          onClick={handleMarkAllAbsent}
                          disabled={Boolean(bulkAttendanceStatus) || updatingStudentIds.size > 0 || !enrolledStudents.length}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                          {bulkAttendanceStatus === 'absent' ? <ArrowPathIcon className="mr-2 h-5 w-5 animate-spin" /> : <XMarkIcon className="mr-2 h-5 w-5" />}
                          Mark all absent
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 sm:p-8">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <button onClick={() => setAttendanceFilter('all')} aria-pressed={attendanceFilter === 'all'} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${attendanceFilter === 'all' ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 bg-white hover:border-blue-200'}`}>
                        <span className="rounded-xl bg-blue-100 p-2.5 text-blue-700"><UsersIcon className="h-6 w-6" /></span>
                        <span><span className="block text-2xl font-bold text-slate-900">{enrolledStudents.length}</span><span className="text-sm font-medium text-slate-500">Enrolled students</span></span>
                      </button>
                      <button onClick={() => setAttendanceFilter('present')} aria-pressed={attendanceFilter === 'present'} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${attendanceFilter === 'present' ? 'border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100' : 'border-slate-200 bg-white hover:border-emerald-200'}`}>
                        <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700"><CheckCircleIcon className="h-6 w-6" /></span>
                        <span><span className="block text-2xl font-bold text-slate-900">{presentCount}</span><span className="text-sm font-medium text-slate-500">Present</span></span>
                      </button>
                      <button onClick={() => setAttendanceFilter('absent')} aria-pressed={attendanceFilter === 'absent'} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${attendanceFilter === 'absent' ? 'border-rose-300 bg-rose-50 ring-2 ring-rose-100' : 'border-slate-200 bg-white hover:border-rose-200'}`}>
                        <span className="rounded-xl bg-rose-100 p-2.5 text-rose-700"><XCircleIcon className="h-6 w-6" /></span>
                        <span><span className="block text-2xl font-bold text-slate-900">{absentCount}</span><span className="text-sm font-medium text-slate-500">Absent</span></span>
                      </button>
                    </div>

                    <div className="my-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Student attendance</h2>
                        <p className="text-sm text-slate-500">Select a student&apos;s status to update it instantly.</p>
                      </div>
                      <label className="relative block w-full sm:max-w-sm">
                        <span className="sr-only">Search students</span>
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          value={attendanceSearch}
                          onChange={(event) => setAttendanceSearch(event.target.value)}
                          placeholder="Search by name or email"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      {filteredStudents.map((student) => {
                        const isPresent = attendanceStatus[student._id] === 'present';
                        const isUpdating = updatingStudentIds.has(student._id);
                        return (
                          <div
                            key={student._id}
                            className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg hover:shadow-slate-200/60 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                          >
                        <div className="flex min-w-0 items-center gap-4">
                          {student.profilePicture?.data ? (
                            <img
                              src={student.profilePicture.data}
                              alt={`${student.name}'s profile`}
                              className="h-14 w-14 flex-none rounded-2xl object-cover ring-4 ring-slate-100"
                            />
                          ) : (
                            <UserCircleIcon className="h-14 w-14 flex-none text-slate-300" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">{student.name}</p>
                            <p className="truncate text-sm text-slate-500">{student.email}</p>
                            {isPresent && session.status === 'active' && (
                              <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Currently in classroom
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleAttendance(student._id)}
                          disabled={isUpdating || Boolean(bulkAttendanceStatus)}
                          aria-label={`Mark ${student.name} as ${isPresent ? 'absent' : 'present'}`}
                          className={`inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:cursor-wait disabled:opacity-60 sm:w-32 ${
                            isPresent
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {isUpdating ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : isPresent ? <CheckIcon className="h-5 w-5" /> : <XMarkIcon className="h-5 w-5" />}
                          {isPresent ? 'Present' : 'Absent'}
                        </button>
                          </div>
                        );
                      })}

                    {!filteredStudents.length && (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                        <UsersIcon className="mx-auto h-10 w-10 text-slate-300" />
                        <h3 className="mt-3 font-bold text-slate-800">No students found</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {enrolledStudents.length ? 'Try another search or attendance filter.' : 'No students are enrolled in this session yet.'}
                        </p>
                        {(attendanceSearch || attendanceFilter !== 'all') && enrolledStudents.length > 0 && (
                          <button onClick={() => { setAttendanceSearch(''); setAttendanceFilter('all'); }} className="mt-4 text-sm font-bold text-blue-700 hover:text-blue-900">
                            Clear filters
                          </button>
                        )}
                      </div>
                    )}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'video' && (
                <VideoRoom
                  sessionId={sessionId}
                  isTeacher={true}
                  session={session}
                  onExit={exitVideoRoom}
                />
              )}
              {activeTab === 'whiteboard' && (
                <Whiteboard sessionId={sessionId} />
              )}
              {activeTab === 'discussion' && (
                <DiscussionRoom sessionId={sessionId} />
              )}
              {activeTab === 'exercise' && (
                <ExerciseRoom 
                  sessionId={sessionId} 
                  readOnly={false}
                  initialContent={exerciseContent}
                  onContentChange={setExerciseContent}
                />
              )}
              {activeTab === 'material' && (
                <MaterialRoom sessionId={sessionId} session={session} />
              )}
            </div>
          </div>
        </Layout>
      </div>
    </div>
  );
};

export default Classroom;
