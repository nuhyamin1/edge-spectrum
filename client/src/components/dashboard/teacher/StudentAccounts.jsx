import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  AcademicCapIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { api, useAuth } from '../../../context/AuthContext';
import Layout from '../Layout';

const StudentAccounts = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { logout } = useAuth();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users', { params: { role: 'student' } });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching student accounts:', error);
      if (error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        logout();
      } else {
        toast.error('Failed to load student accounts');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) => {
      const name = student.name?.toLowerCase() || '';
      const email = student.email?.toLowerCase() || '';
      return name.includes(normalizedSearch) || email.includes(normalizedSearch);
    });
  }, [searchTerm, students]);

  const verifiedCount = students.filter((student) => student.isEmailVerified).length;

  const formatJoinedDate = (dateString) => {
    if (!dateString) return 'Not available';

    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout userType="teacher">
        <div className="flex flex-col justify-center items-center h-64 gap-4">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-blue-500"></div>
          <p className="text-gray-600 font-medium">Loading student accounts...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userType="teacher">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AcademicCapIcon className="w-7 h-7 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Student Accounts</h1>
            </div>
            <p className="text-gray-600">
              View registered student accounts and contact details.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search students..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Registered Students</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">{students.length}</p>
          </div>
          <div className="rounded-lg border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Verified Accounts</p>
            <p className="mt-2 text-3xl font-bold text-green-700">{verifiedCount}</p>
          </div>
          <div className="rounded-lg border border-amber-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Pending Verification</p>
            <p className="mt-2 text-3xl font-bold text-amber-700">{students.length - verifiedCount}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Registered Students</h2>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <UserCircleIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 font-medium text-gray-700">No student accounts found</p>
              <p className="mt-1 text-sm text-gray-500">
                {students.length === 0
                  ? 'Registered student accounts will appear here.'
                  : 'Try a different name or email search.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Student
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Email
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-blue-50/60">
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-3">
                          {student.profilePicture?.data ? (
                            <img
                              src={student.profilePicture.data}
                              alt=""
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserCircleIcon className="h-10 w-10 text-gray-400" />
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{student.name}</p>
                            <p className="text-xs uppercase tracking-wide text-gray-500">{student.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <a
                          href={`mailto:${student.email}`}
                          className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                          {student.email}
                        </a>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        {student.isEmailVerified ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                            <CheckCircleIcon className="h-4 w-4" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
                            <XCircleIcon className="h-4 w-4" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {formatJoinedDate(student.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentAccounts;
