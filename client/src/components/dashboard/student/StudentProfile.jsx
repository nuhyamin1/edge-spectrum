import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

export default function StudentProfile() {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 p-6">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 overflow-hidden">
        {/* Decorative Background Element */}
        <div className="absolute -top-10 -left-10 w-60 h-60 bg-blue-300 rounded-full opacity-20 transform rotate-45"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-center text-blue-800 mb-8">
            <span className="relative inline-block pb-2">
              Student Profile
              <span className="absolute left-1/2 transform -translate-x-1/2 bottom-0 h-1 w-24 bg-blue-300 rounded-full"></span>
            </span>
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-36 h-36 mb-6">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full border-4 border-blue-300 shadow-md"
                  />
                ) : (
                  <UserCircleIcon className="w-full h-full text-blue-300" />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="absolute bottom-0 right-0 bg-blue-300 text-white p-2 rounded-full hover:bg-blue-400 transition-transform duration-300 transform hover:scale-110"
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
              <label htmlFor="name" className="block text-sm font-medium text-blue-800">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full bg-blue-50 border border-blue-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-300 focus:ring-opacity-50 rounded-md px-4 py-2"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-blue-800">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full bg-blue-50 border border-blue-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-300 focus:ring-opacity-50 rounded-md px-4 py-2"
              />
            </div>

            <div>
              <label htmlFor="aboutMe" className="block text-sm font-medium text-blue-800">
                About Me
              </label>
              <textarea
                id="aboutMe"
                name="aboutMe"
                rows={4}
                value={formData.aboutMe}
                onChange={handleChange}
                className="mt-1 block w-full bg-blue-50 border border-blue-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-300 focus:ring-opacity-50 rounded-md px-4 py-2"
              />
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                className="w-full bg-blue-300 text-white px-4 py-2 rounded-lg hover:bg-blue-400 transition-colors duration-300"
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
                className="w-full border-2 border-blue-300 text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-300 hover:text-white transition-colors duration-300"
              >
                Logout
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
