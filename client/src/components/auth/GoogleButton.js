import React from 'react';
import { signInWithRedirect, GoogleAuthProvider, getRedirectResult } from 'firebase/auth';
import { auth } from '../../config/firebase';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const GoogleButton = ({ role }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  // Check for redirect result when component mounts
  React.useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const accessToken = await result.user.getIdToken();
          
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/google`, {
            token: accessToken,
            role,
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
        if (error.response) {
          console.error('Server error:', error.response.data);
          toast.error(error.response.data.message || 'Failed to sign in with Google');
        } else {
          toast.error('Failed to sign in with Google');
        }
      }
    };

    handleRedirectResult();
  }, [login, navigate, role]);

  const handleGoogleSignIn = () => {
    signInWithRedirect(auth, provider);
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors duration-300"
    >
      <img
        src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png"
        alt="Google"
        className="w-5 h-5"
      />
      <span className="text-gray-600 font-medium">Continue with Google</span>
    </button>
  );
};

export default GoogleButton; 