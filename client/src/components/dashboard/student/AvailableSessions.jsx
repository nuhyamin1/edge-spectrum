import React from 'react';
import Layout from '../Layout';

const AvailableSessions = () => {
  // TODO: Replace with actual API call
  const mockSessions = [
    {
      id: 1,
      title: 'Introduction to React',
      subject: 'Web Development',
      teacher: 'John Doe',
      dateTime: '2025-01-20T10:00:00',
      description: 'Learn the basics of React development',
    },
    {
      id: 2,
      title: 'Advanced JavaScript Concepts',
      subject: 'Programming',
      teacher: 'Jane Smith',
      dateTime: '2025-01-22T14:00:00',
      description: 'Deep dive into JavaScript advanced topics',
    },
  ];

  return (
    <Layout userType="student">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Available Sessions</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {mockSessions.map((session) => (
            <div key={session.id} className="p-6 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{session.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {session.subject} • Taught by {session.teacher}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{session.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(session.dateTime).toLocaleString()}
                  </p>
                  <button 
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Join Session
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default AvailableSessions;
