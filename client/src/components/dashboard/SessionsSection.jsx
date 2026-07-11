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
    <div className="h-full">
      {title && (
        <h3 className="mb-4 flex items-center text-xl font-bold text-gray-800 md:mb-6 md:text-2xl">
          <span className="relative">{title}</span>
        </h3>
      )}
      
      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 bg-white/80 backdrop-blur-xl rounded-xl border border-blue-200">
          <p className="text-gray-500 text-center">No {type} sessions</p>
        </div>
      ) : (
        <div className="grid gap-4 min-h-fit overflow-visible">
          {displayedSessions.map((session) => (
            <div
              key={session._id}
              className="group relative bg-white/80 backdrop-blur-xl rounded-xl p-5 md:p-6
                border border-blue-200 hover:border-blue-400
                transition-all duration-300 hover:shadow-lg hover:shadow-blue-400/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 to-blue-600/5 opacity-0 
                group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />

              <div className="relative">
                {/* Session Title and Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-2 gap-2">
                  <h4 className="text-base md:text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {session.title}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit
                    ${type === 'active' ? 'bg-green-100 text-green-700' : 
                      type === 'upcoming' ? 'bg-blue-100 text-blue-700' : 
                      'bg-gray-100 text-gray-700'}`}>
                    {type === 'active' ? 'In Progress' : 
                     type === 'upcoming' ? 'Scheduled' : 'Completed'}
                  </span>
                </div>

                {/* Session Description */}
                <p className="text-gray-600 text-sm mb-4">
                  {session.description}
                </p>

                {/* Session Details */}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                  {/* Date */}
                  <div className="flex items-center text-gray-600 text-sm">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {new Date(session.dateTime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Time */}
                  <div className="flex items-center text-gray-600 text-sm">
                    <ClockIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {new Date(session.dateTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {session.endTime && ` - ${new Date(session.endTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`}
                    </span>
                  </div>

                  {/* Subject */}
                  <div className="flex items-center text-gray-600 text-sm">
                    <BookOpenIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {session.subject} - {session.topic}
                    </span>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center text-gray-600 text-sm">
                    <UserGroupIcon className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" />
                    {session.enrolledStudents?.length || 0} Participants
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-4 pt-4 border-t border-blue-100">
                  <Link
                    to={`/dashboard/session/${session._id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 
                      transition-colors text-sm font-medium group"
                  >
                    {type === 'active' ? 'Join Session' : 
                     type === 'upcoming' ? 'View Details' : 'View Summary'}
                    <ArrowRightIcon className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="mt-4 md:mt-6 text-center">
          <button
            onClick={handleViewMore}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent
              text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700
              transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
              focus:ring-blue-500"
          >
            View More
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SessionsSection;
