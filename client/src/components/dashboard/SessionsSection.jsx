import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UserGroupIcon, BookOpenIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const MAX_DISPLAY_ITEMS = 3;

const SessionsSection = ({ title, sessions, type }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isTeacher = user?.role === 'teacher';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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

  const handleSessionClick = (sessionId) => {
    navigate(`/dashboard/session/${sessionId}`);
  };

  const handleViewMore = () => {
    if (isTeacher) {
      navigate('/dashboard/sessions');
    } else {
      navigate('/dashboard/available-sessions');
    }
  };

  const displayedSessions = sessions.slice(0, MAX_DISPLAY_ITEMS);
  const hasMore = sessions.length > MAX_DISPLAY_ITEMS;

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-100 mb-4">{title}</h3>
      {sessions.length === 0 ? (
        <p className="text-gray-400">No {type} sessions</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map((session) => (
            <div
              key={session._id}
              className="relative bg-gray-800/30 backdrop-blur-sm rounded-xl p-5 
              border border-gray-700 hover:border-neon-blue/50
              transition-all duration-300 group
              hover:shadow-lg hover:shadow-neon-blue/20"
            >
              {/* Glossy overlay effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 
                group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl" />
{/*               
              Animated border gradient
              <div className="absolute -inset-[2px] rounded-[14px] bg-gradient-to-r from-blue-200/30 to-blue-300/30 
                opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10
                animate-once" /> */}

              <div className="relative">
                {/* Session Title with Icon */}
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-semibold text-gray-100 group-hover:text-neon-blue transition-colors">
                    {session.title}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium
                    ${type === 'active' ? 'bg-green-500/20 text-green-400' : 
                      type === 'upcoming' ? 'bg-blue-500/20 text-blue-400' : 
                      'bg-gray-500/20 text-gray-400'}`}>
                    {type === 'active' ? 'In Progress' : 
                     type === 'upcoming' ? 'Scheduled' : 'Completed'}
                  </span>
                </div>

                {/* Session Details */}
                <div className="space-y-2">
                  {/* Date & Time */}
                  <div className="flex items-center text-gray-300 text-sm">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(session.dateTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  
                  <div className="flex items-center text-gray-300 text-sm">
                    <ClockIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {new Date(session.dateTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {session.endTime && ` - ${new Date(session.endTime).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`}
                  </div>

                  {/* Subject & Topic */}
                  <div className="flex items-center text-gray-300 text-sm">
                    <BookOpenIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {session.subject} - {session.topic}
                  </div>

                  {/* Participants */}
                  <div className="flex items-center text-gray-300 text-sm">
                    <UserGroupIcon className="w-4 h-4 mr-2 text-gray-400" />
                    {session.participants?.length || 0} Participants
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4 pt-4 border-t border-gray-700/50">
                  <Link
                    to={`/dashboard/session/${session._id}`}
                    className="inline-flex items-center text-neon-blue hover:text-neon-blue/80 
                    transition-colors text-sm font-medium"
                  >
                    {type === 'active' ? 'Join Session' : 
                     type === 'upcoming' ? 'View Details' : 'View Summary'}
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsSection;
