import React, { useState } from 'react';
import axios from '../../utils/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import AuthLayout from './AuthLayout';
import GoogleButton from './GoogleButton';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post('/api/auth/login', formData);
      login(res.data.user, res.data.token);
      toast.success('Login successful!');
      navigate('/welcome');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-blue-400 tracking-tight mb-3">
            PF Speaking Master
          </h1>
          <p className="text-lg text-gray-600 font-medium mb-6">
            Sign In and Start Learning
          </p>
          <br />
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="relative group">
              <input
                id="email"
                name="email"
                type="email"
                required
                className="block w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-transparent peer"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
              <label className="absolute left-5 -top-2.5 bg-white/80 px-2 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:bg-white/80">
                Email address
              </label>
            </div>
            
            <div className="relative group">
              <input
                id="password"
                name="password"
                type="password"
                required
                className="block w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder-transparent peer"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <label className="absolute left-5 -top-2.5 bg-white/80 px-2 text-sm text-gray-600 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:bg-transparent peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:bg-white/80">
                Password
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="relative w-full py-4 px-6 rounded bg-blue-400 text-white font-medium text-sm hover:shadow-lg hover:shadow-blue-400/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
          >
            <span className="relative z-10 flex items-center justify-center">
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </span>
            <div className="absolute inset-0 w-full h-full bg-blue-500 opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <GoogleButton />

        <div className="text-center">
          <Link 
            to="/register" 
            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Don't have an account? <span className="font-bold">Sign up</span>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
