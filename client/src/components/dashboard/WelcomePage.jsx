import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleEnter = () => {
    if (user.role === 'teacher') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard/student');
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center relative"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/pfsm_class.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative text-center text-white space-y-8 max-w-2xl mx-auto px-4">
        {/* Add space here */}
        <div className="h-96" />
        <p className="text-2xl font-light italic">
          "Language is the road map of a culture. It tells you where its people come from and where they are going."
        </p>
        <p className="text-xl">
          ‒ Rita Mae Brown
        </p>

        <button
          onClick={handleEnter}
          className="mt-8 px-12 py-4 bg-blue-600 text-white text-xl rounded-lg
            hover:bg-blue-700 transition-all duration-300
            hover:shadow-lg hover:shadow-blue-600/30
            transform hover:scale-105 active:scale-100"
        >
          Enter
        </button>
      </div>
    </div>
  );
};

export default WelcomePage;
