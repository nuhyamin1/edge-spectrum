import React, { useState } from 'react';
import axios from '../../utils/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import AuthLayout from './AuthLayout';
import GoogleButton from './GoogleButton';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('/api/auth/login', formData);
      login(response.data.user, response.data.token);
      toast.success('Welcome back!');
      navigate(response.data.user.role === 'teacher' ? '/dashboard' : '/dashboard/student');
    } catch (error) {
      toast.error(error.response?.data?.message || 'We could not sign you in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="login-form">
        <header className="login-form__header">
          <p className="login-form__eyebrow">Welcome back</p>
          <h2>Sign in to your account</h2>
          <p>Continue your speaking journey where you left off.</p>
        </header>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required placeholder="you@example.com" value={formData.email} onChange={handleChange} />
          </div>
          <div className="login-field">
            <label htmlFor="password">Password</label>
            <div className="login-password">
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required placeholder="Enter your password" value={formData.password} onChange={handleChange} />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button className="login-submit" type="submit" disabled={loading}>
            {loading && <span className="login-spinner" aria-hidden="true" />}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>
        <GoogleButton />
        <p className="login-form__switch">New to PF Speaking Master? <Link to="/register">Create an account</Link></p>
      </div>
    </AuthLayout>
  );
};

export default Login;
