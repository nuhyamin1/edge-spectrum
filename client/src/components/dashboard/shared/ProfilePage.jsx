import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowRightOnRectangleIcon,
  CameraIcon,
  CheckIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  SparklesIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { api, useAuth } from '../../../context/AuthContext';

const ProfilePage = ({ role }) => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const objectUrlRef = useRef('');
  const [isSaving, setIsSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    aboutMe: '',
    profilePicture: null
  });

  const roleLabel = role === 'teacher' ? 'Teacher' : 'Student';
  const firstName = formData.name.trim().split(/\s+/)[0] || roleLabel;

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        aboutMe: user.aboutMe || '',
        profilePicture: null
      });
      setPreviewUrl(user.profilePicture?.data || '');
    }
  }, [user]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(file);
    setFormData((current) => ({ ...current, profilePicture: file }));
    setPreviewUrl(objectUrlRef.current);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);

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

      if (response.data?.user) {
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
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-sm">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-indigo-200/50 blur-3xl" />

      <div className="relative px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
        <header className="mb-7 flex flex-col gap-2 sm:mb-9">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            <SparklesIcon className="h-4 w-4" />
            Account settings
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Your profile
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Keep your personal details up to date so your learning community knows who you are.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-5 lg:items-stretch">
          <aside className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-800 p-6 text-white shadow-xl shadow-blue-950/10 sm:p-8 lg:col-span-2">
            <div className="absolute -right-16 -top-14 h-52 w-52 rounded-full border-[32px] border-white/5" />
            <div className="absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-blue-400/10" />

            <div className="relative flex h-full flex-col">
              <span className="mb-7 w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-blue-100">
                {roleLabel} account
              </span>

              <div className="relative mb-5 w-fit">
                <div className="h-32 w-32 overflow-hidden rounded-3xl border-4 border-white/20 bg-white/10 shadow-2xl sm:h-36 sm:w-36">
                  {previewUrl ? (
                    <img src={previewUrl} alt={`${formData.name || roleLabel} profile`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-800">
                      <UserIcon className="h-20 w-20 text-blue-200" />
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-2xl border-4 border-blue-900 bg-white text-blue-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-300/60"
                  aria-label="Choose a new profile picture"
                >
                  <CameraIcon className="h-5 w-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              <h2 className="text-2xl font-bold tracking-tight">{formData.name || `Your ${roleLabel} profile`}</h2>
              <p className="mt-1 flex items-center gap-2 break-all text-sm text-blue-100/80">
                <EnvelopeIcon className="h-4 w-4 shrink-0" />
                {formData.email || 'Add your email address'}
              </p>

              <div className="mt-7 border-t border-white/10 pt-5 lg:mt-auto">
                <p className="text-sm leading-6 text-blue-100/75">
                  A friendly photo and short introduction help make classroom conversations feel more personal.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-blue-200"
                >
                  <CameraIcon className="h-4 w-4" />
                  Change profile photo
                </button>
              </div>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-white bg-white/95 p-6 shadow-xl shadow-slate-900/5 backdrop-blur sm:p-8 lg:col-span-3">
            <div className="mb-7 flex items-start gap-3 border-b border-slate-100 pb-6">
              <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                <PencilSquareIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Personal information</h2>
                <p className="mt-1 text-sm text-slate-500">Edit the details shown across your account.</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor={`${role}-profile-name`} className="mb-2 block text-sm font-semibold text-slate-700">Full name</label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id={`${role}-profile-name`}
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${role}-profile-email`} className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
                <div className="relative">
                  <EnvelopeIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id={`${role}-profile-email`}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label htmlFor={`${role}-profile-about`} className="text-sm font-semibold text-slate-700">About me</label>
                  <span className="text-xs text-slate-400">{formData.aboutMe.length} characters</span>
                </div>
                <textarea
                  id={`${role}-profile-about`}
                  name="aboutMe"
                  rows={5}
                  value={formData.aboutMe}
                  onChange={handleChange}
                  placeholder={`Tell others a little about you, ${firstName}...`}
                  className="block w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-100"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                Log out
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                <CheckIcon className="h-5 w-5" />
                {isSaving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ProfilePage;
