import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from '../../utils/axios';
import { toast } from 'react-toastify';
import Layout from './Layout';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  LinkIcon,
  ArrowLeftIcon,
  DocumentIcon,
  VideoCameraIcon,
  CheckCircleIcon,
  PlayIcon,
  ArrowTopRightOnSquareIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const SessionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const response = await axios.get(`/api/sessions/${id}`);
      setSession(response.data);
      const currentUserId = user?._id || user?.id;
      setIsEnrolled(
        (response.data.enrolledStudents || []).some((student) =>
          (student._id || student) === currentUserId
        )
      );
      setLoading(false);
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Failed to load session details');
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      await axios.post(`/api/sessions/${id}/enroll`);
      toast.success('Successfully enrolled in session');
      fetchSession();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to enroll in session');
    }
  };

  const handleUnenroll = async () => {
    try {
      await axios.post(`/api/sessions/${id}/unenroll`);
      toast.success('Successfully unenrolled from session');
      fetchSession();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to unenroll from session');
    }
  };

  const handleFileDownload = async (file) => {
    try {
      const response = await axios.get(
        `/api/sessions/${id}/files/${file.filename}`,
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

  const handleStartSession = async () => {
    try {
      await axios.post(`/api/sessions/${id}/start`);
      toast.success('Session started successfully');
      fetchSession();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start session');
    }
  };

  const handleEndSession = async () => {
    try {
      await axios.post(`/api/sessions/${id}/end`);
      toast.success('Session ended successfully');
      fetchSession();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to end session');
    }
  };

  const handleJoinLiveSession = () => {
    if (!session) return;

    if (session.status !== 'active') {
      toast.error('This session is not currently active');
      return;
    }

    if (isTeacher) {
      navigate(`/teacher/classroom/${session._id}`);
      return;
    }

    if (!isEnrolled) {
      toast.error('Please enroll in this session before joining');
      return;
    }

    if (!session.startedAt) {
      toast.error('Session start time information is missing');
      return;
    }

    const gracePeriod = session.gracePeriod || 5;
    const startTime = new Date(session.startedAt);
    const gracePeriodEnd = new Date(startTime.getTime() + gracePeriod * 60000);

    if (new Date() > gracePeriodEnd) {
      toast.error('Grace period has expired for this session');
      return;
    }

    sessionStorage.setItem(
      `gracePeriod_${session._id}`,
      JSON.stringify({
        startedAt: session.startedAt,
        gracePeriod,
        endTime: gracePeriodEnd.toISOString(),
        sessionId: session._id
      })
    );

    navigate(`/classroom/${session._id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Layout userType={isTeacher ? 'teacher' : 'student'}>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return (
      <Layout userType={isTeacher ? 'teacher' : 'student'}>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-100">Session not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-gray-800 text-neon-blue rounded-lg 
            hover:bg-gray-700 transition-all duration-300 
            border border-gray-700 hover:border-neon-blue/50"
          >
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  const enrolledStudents = session.enrolledStudents || [];
  const statusDetails = {
    active: {
      label: 'Live now',
      badge: 'border-emerald-300 bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500'
    },
    completed: {
      label: 'Completed',
      badge: 'border-slate-200 bg-slate-100 text-slate-600',
      dot: 'bg-slate-400'
    },
    scheduled: {
      label: 'Scheduled',
      badge: 'border-amber-200 bg-amber-50 text-amber-700',
      dot: 'bg-amber-400'
    }
  }[session.status] || {
    label: session.status,
    badge: 'border-blue-200 bg-blue-50 text-blue-700',
    dot: 'bg-blue-500'
  };

  const hasResources = session.materials ||
    (session.externalLinks && session.externalLinks.length > 0) ||
    (session.files && session.files.length > 0);

  return (
    <Layout userType={isTeacher ? 'teacher' : 'student'}>
      <div className="mx-auto max-w-6xl pb-8">
        <button
          onClick={() => navigate(-1)}
          className="group mb-5 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-white hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to sessions
        </button>

        <section className="relative overflow-hidden rounded-3xl bg-blue-950 px-6 py-8 text-white shadow-xl shadow-blue-950/10 sm:px-9 sm:py-10">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border border-white/10 bg-white/[0.04]" />
          <div className="pointer-events-none absolute -bottom-28 right-1/3 h-56 w-56 rounded-full border border-white/10" />
          <div className="relative">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${statusDetails.badge}`}>
                <span className={`h-2 w-2 rounded-full ${statusDetails.dot}`} />
                {statusDetails.label}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                {session.subject}
              </span>
            </div>
            <div className="max-w-3xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">Session details</p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{session.title}</h1>
              {session.description && (
                <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">{session.description}</p>
              )}
            </div>
            <div className="mt-8 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-blue-50 backdrop-blur-sm">
                <CalendarIcon className="h-5 w-5 text-blue-200" />
                {formatDate(session.dateTime)}
              </span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-blue-50 backdrop-blur-sm">
                <ClockIcon className="h-5 w-5 text-blue-200" />
                {session.duration} minutes
              </span>
            </div>
          </div>
        </section>

        <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600">At a glance</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Session information</h2>
                </div>
                <div className="hidden h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 sm:flex">
                  <CalendarIcon className="h-6 w-6" />
                </div>
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <ClockIcon className="h-4 w-4 text-blue-600" /> Grace period
                  </dt>
                  <dd className="mt-2 text-base font-bold text-slate-800">{session.gracePeriod || 5} minutes</dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <UserGroupIcon className="h-4 w-4 text-blue-600" /> Enrollment
                  </dt>
                  <dd className="mt-2 text-base font-bold text-slate-800">{enrolledStudents.length} students</dd>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
                  <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <AcademicCapIcon className="h-4 w-4 text-blue-600" /> Teacher
                  </dt>
                  <dd className="mt-2 text-base font-bold text-slate-800">{session.teacher?.name || 'Teacher not assigned'}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Class roster</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">Enrolled students</h2>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{enrolledStudents.length}</span>
              </div>
              {enrolledStudents.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {enrolledStudents.map((student, index) => (
                    <div
                      key={student._id || student.id || index}
                      className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 p-3.5 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
                    >
                      {student.profilePicture?.data ? (
                        <img
                          src={student.profilePicture.data}
                          alt={`${student.name}'s profile`}
                          className="h-11 w-11 flex-shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                        />
                      ) : (
                        <UserCircleIcon className="h-11 w-11 flex-shrink-0 text-slate-300" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-800">{student.name}</p>
                        <p className="truncate text-sm text-slate-500">{student.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
                  <UsersIcon className="mx-auto h-9 w-9 text-slate-300" />
                  <p className="mt-3 font-semibold text-slate-700">No students enrolled yet</p>
                  <p className="mt-1 text-sm text-slate-500">Enrolled students will appear here.</p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Session controls</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">
                {session.status === 'active' ? 'Class is in progress' : session.status === 'completed' ? 'Session finished' : 'Ready when you are'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {session.status === 'active'
                  ? 'Enter the live classroom to begin or continue the lesson.'
                  : session.status === 'completed'
                    ? 'This session has ended. Its details and resources remain available.'
                    : isTeacher
                      ? 'Start the session when you are ready to teach.'
                      : isEnrolled
                        ? 'You are enrolled. Return here when the teacher starts the session.'
                        : 'Enroll now to reserve your place in this session.'}
              </p>
              <div className="mt-5 space-y-3">
              {isTeacher ? (
                <>
                  {session.status === 'active' && (
                    <button
                      onClick={handleJoinLiveSession}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                    >
                      <VideoCameraIcon className="w-5 h-5" />
                      Join Live
                    </button>
                  )}
                  {session.status === 'scheduled' && (
                    <button
                      onClick={handleStartSession}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    >
                      <PlayIcon className="h-5 w-5" />
                      Start Session
                    </button>
                  )}
                  {session.status === 'active' && (
                    <button
                      onClick={handleEndSession}
                      className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                    >
                      End Session
                    </button>
                  )}
                  {session.status === 'completed' && (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-600" /> Session completed
                    </div>
                  )}
                </>
              ) : (
                <>
                  {session.status === 'scheduled' && (
                    isEnrolled ? (
                      <button
                        onClick={handleUnenroll}
                        className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                      >
                        Unenroll from Session
                      </button>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                      >
                        Enroll in Session
                      </button>
                    )
                  )}
                  {session.status === 'active' && isEnrolled && (
                    <button
                      onClick={handleJoinLiveSession}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
                    >
                      <VideoCameraIcon className="w-5 h-5" />
                      Join Live
                    </button>
                  )}
                  {session.status === 'completed' && (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-600" /> Session completed
                    </div>
                  )}
                </>
              )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Lesson support</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Resources</h2>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                  <DocumentIcon className="h-5 w-5" />
                </div>
              </div>

              {hasResources ? (
                <div className="space-y-3">
                  {session.materials && (
                    <a
                      href={session.materials}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <LinkIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span className="min-w-0 flex-1 truncate">Main material</span>
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-blue-600" />
                    </a>
                  )}
                  {session.externalLinks?.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <LinkIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span className="min-w-0 flex-1 truncate">{link.title}</span>
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 flex-shrink-0 text-slate-400 group-hover:text-blue-600" />
                    </a>
                  ))}
                  {session.files?.map((file, index) => (
                    <button
                      key={index}
                      onClick={() => handleFileDownload(file)}
                      className="flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <DocumentIcon className="h-5 w-5 flex-shrink-0 text-blue-600" />
                      <span className="min-w-0 flex-1 truncate">{file.originalname}</span>
                      <span className="text-xs font-bold text-blue-600">Download</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">No resources have been added.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
    </Layout>
  );
};

export default SessionView;
