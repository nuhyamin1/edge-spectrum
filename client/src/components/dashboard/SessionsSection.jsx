import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline';

const SessionsSection = ({ title, sessions, type }) => {
  const navigate = useNavigate();

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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
      <div className="space-y-4">
        {sessions.map((session) => (
          <div
            key={session._id}
            onClick={() => navigate(`/dashboard/session/${session._id}`)}
            className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{session.title}</h3>
                <p className="text-sm text-blue-600 mb-2">{session.subject}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                {session.status}
              </span>
            </div>
            
            <p className="text-gray-600 text-sm mb-3">{session.description}</p>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {formatDate(session.dateTime)}
              </div>
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                {session.duration} mins
              </div>
              {session.enrolledStudents && (
                <div className="flex items-center">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  {session.enrolledStudents.length} students
                </div>
              )}
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-gray-500 text-center py-4">No {type} sessions available.</p>
        )}
      </div>
    </div>
  );
};

export default SessionsSection;
