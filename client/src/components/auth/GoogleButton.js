import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../config/firebase';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const GoogleButton = ({ role }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const provider = new GoogleAuthProvider();
      
      // Use signInWithPopup instead of redirect
      const result = await signInWithPopup(auth, provider);
      console.log('Google sign in result:', result);

      if (result.user) {
        const accessToken = await result.user.getIdToken();
        
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
          token: accessToken,
          role: role || 'student',
          email: result.user.email,
          name: result.user.displayName,
          picture: result.user.photoURL
        });

        login(response.data.user, response.data.token);
        toast.success('Successfully signed in with Google!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors duration-300"
      disabled={isLoading}
    >
      <img
        src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
        alt="Google"
        className="w-5 h-5"
      />
      <span className="text-gray-600 font-medium">
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </span>
    </button>
  );
};

export default GoogleButton; 