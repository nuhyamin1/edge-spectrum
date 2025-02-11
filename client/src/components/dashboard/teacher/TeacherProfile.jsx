import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

export default function TeacherProfile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    aboutMe: '',
    profilePicture: null
  });
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        aboutMe: user.aboutMe || '',
      });
      setPreviewUrl(user.profilePicture?.data || '');
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, profilePicture: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('aboutMe', formData.aboutMe);
    if (formData.profilePicture) {
      formDataToSend.append('profilePicture', formData.profilePicture);
    }

    try {
      const response = await api.put('/users/profile', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data && response.data.user) {
        const success = updateUser(response.data.user);
        if (success) {
          toast.success('Profile updated successfully');
        } else {
          toast.error('Error saving profile changes');
        }
      } else {
        toast.error('Invalid server response');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.error || 'Error updating profile');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Teacher Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-6">
            <div className="relative w-32 h-32 mb-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserCircleIcon className="w-full h-full text-gray-300" />
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="aboutMe" className="block text-sm font-medium text-gray-700">
              About Me
            </label>
            <textarea
              id="aboutMe"
              name="aboutMe"
              rows={4}
              value={formData.aboutMe}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-4">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
                toast.success('Logged out successfully');
              }}
              className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
