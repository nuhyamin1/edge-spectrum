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
  ArrowLeftIcon
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
      setIsEnrolled(response.data.enrolledStudents.some(student => student._id === user._id));
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
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

  return (
    <Layout userType={isTeacher ? 'teacher' : 'student'}>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center text-gray-400 hover:text-neon-blue transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
          Back
        </button>

        <div className="relative bg-gray-100/10 rounded-xl overflow-hidden 
          border border-gray-400 ">
        

          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="mb-5 text-2xl font-bold text-gray-600">
                  {session.title}
                </h1>

                <p className="text-lg text-neon-blue">{session.subject}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium 
                ${session.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                  session.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 
                  'bg-yellow-500/20 text-yellow-400'}`}>
                {session.status}
              </span>
            </div>

            <p className="text-gray-600 mb-6">{session.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center text-gray-600">
                  <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                  {formatDate(session.dateTime)}
                </div>
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="w-5 h-5 mr-2 text-gray-400" />
                  Duration: {session.duration} minutes
                </div>
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="w-5 h-5 mr-2 text-gray-400" />
                  Grace Period: {session.gracePeriod || 5} minutes
                </div>
                <div className="flex items-center text-gray-600">
                  <UserGroupIcon className="w-5 h-5 mr-2 text-gray-400" />
                  {session.enrolledStudents.length} Students Enrolled
                </div>
                <div className="flex items-center text-gray-600">
                  <AcademicCapIcon className="w-5 h-5 mr-2 text-gray-400" />
                  Teacher: {session.teacher.name}
                </div>
              </div>

              {session.materials && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700">Session Material</h3>
                  <a
                    href={session.materials}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-neon-blue hover:text-neon-blue/80 transition-colors"
                  >
                    <LinkIcon className="w-5 h-5 mr-2" />
                    View Material
                  </a>
                </div>
              )}
            </div>

            {/* Enrolled Students Section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Enrolled Students ({session.enrolledStudents.length})
              </h3>
              <div className="space-y-4">
                {session.enrolledStudents.map((student) => (
                  <div key={student._id} 
                    className="flex items-center space-x-3 p-3 
                    bg-gray-200/30 rounded-lg border border-gray-700
                    hover:border-neon-blue/50 transition-all duration-300">
                    {student.profilePicture?.data ? (
                      <img
                        src={student.profilePicture.data}
                        alt={`${student.name}'s profile`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-10 h-10 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-600">{student.name}</p>
                      <p className="text-sm text-blue-600">{student.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-700/50">
              {isTeacher ? (
                <div className="flex space-x-4">
                  {session.status === 'scheduled' && (
                    <button
                      onClick={handleStartSession}
                      className="px-4 py-2 bg-gray-800 text-green-400 rounded-lg 
                      hover:bg-gray-700 transition-all duration-300 
                      border border-gray-700 hover:border-green-400/50
                      hover:shadow-lg hover:shadow-green-400/20"
                    >
                      Start Session
                    </button>
                  )}
                  {session.status === 'active' && (
                    <button
                      onClick={handleEndSession}
                      className="px-4 py-2 bg-gray-800 text-red-400 rounded-lg 
                      hover:bg-gray-700 transition-all duration-300 
                      border border-gray-700 hover:border-red-400/50
                      hover:shadow-lg hover:shadow-red-400/20"
                    >
                      End Session
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex space-x-4">
                  {session.status === 'scheduled' && (
                    isEnrolled ? (
                      <button
                        onClick={handleUnenroll}
                        className="px-4 py-2 bg-gray-800 text-red-400 rounded-lg 
                        hover:bg-gray-700 transition-all duration-300 
                        border border-gray-700 hover:border-red-400/50
                        hover:shadow-lg hover:shadow-red-400/20"
                      >
                        Unenroll from Session
                      </button>
                    ) : (
                      <button
                        onClick={handleEnroll}
                        className="px-4 py-2 bg-gray-800 text-neon-blue rounded-lg 
                        hover:bg-gray-700 transition-all duration-300 
                        border border-gray-700 hover:border-neon-blue/50
                        hover:shadow-lg hover:shadow-neon-blue/20"
                      >
                        Enroll in Session
                      </button>
                    )
                  )}
                  {session.status === 'active' && isEnrolled && (
                    <button
                      onClick={() => navigate(`/dashboard/classroom/${session._id}`)}
                      className="px-4 py-2 bg-gray-800 text-green-400 rounded-lg 
                      hover:bg-gray-700 transition-all duration-300 
                      border border-gray-700 hover:border-green-400/50
                      hover:shadow-lg hover:shadow-green-400/20"
                    >
                      Join Classroom
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SessionView;
