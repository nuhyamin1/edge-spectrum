import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AuthLayout from './AuthLayout';
import GoogleButton from './GoogleButton';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('/api/auth/register', formData);
      toast.success('Registration successful! Please check your email for verification.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-md w-full backdrop-blur-lg bg-white/80 rounded-3xl shadow-2xl p-8 space-y-6 border border-white/20">
        <div className="text-center">
          <h1 className="text-3xl font-black text-blue-400 tracking-tight mb-3">
            PF Speaking Master
          </h1>
          <p className="text-lg text-gray-600 font-medium mb-6">
            Join and start learning!
          </p>
          {/* <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Join and Start Learning
          </h2> */}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="relative group">
              <input
                id="name"
                name="name"
                type="text"
                required
                className="block w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-transparent peer"
                placeholder="Full name"
                value={formData.name}
                onChange={handleChange}
              />
              <label className="absolute left-5 -top-2.5 bg-white/80 px-2 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-blue-600 peer-focus:bg-white/80">
                Full name
              </label>
            </div>

            <div className="relative group">
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-transparent peer"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
              <label className="absolute left-5 -top-2.5 bg-white/80 px-2 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-blue-600 peer-focus:bg-white/80">
                Email address
              </label>
            </div>

            <div className="relative group">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-transparent peer"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <label className="absolute left-5 -top-2.5 bg-white/80 px-2 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-blue-600 peer-focus:bg-white/80">
                Password
              </label>
            </div>

            <div className="relative group">
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <GoogleButton role={formData.role} />

          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-4 px-6 rounded-xl bg-blue-400 text-white font-medium text-sm hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </span>
            <div className="absolute inset-0 w-full h-full bg-blue-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
          </button>
        </form>

        <div className="text-center">
          <Link 
            to="/login" 
            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Already have an account? <span className="font-bold">Sign in</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Register;
