import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const EmailVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`/api/auth/verify/${token}`);
        setVerificationStatus('success');
        toast.success(response.data.message);
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setVerificationStatus('error');
        toast.error(error.response?.data?.message || 'Verification failed');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {verificationStatus === 'verifying' && (
          <div>
            <h2 className="text-2xl font-bold">Verifying your email...</h2>
            <p className="mt-2">Please wait while we verify your email address.</p>
          </div>
        )}
        
        {verificationStatus === 'success' && (
          <div>
            <h2 className="text-2xl font-bold text-green-600">Email Verified!</h2>
            <p className="mt-2">Your email has been successfully verified.</p>
            <p className="mt-2">Redirecting to login page...</p>
          </div>
        )}
        
        {verificationStatus === 'error' && (
          <div>
            <h2 className="text-2xl font-bold text-red-600">Verification Failed</h2>
            <p className="mt-2">Sorry, we couldn't verify your email.</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
