import { MotionConfig } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Lottie from 'lottie-react';
import speakingAnimation from '../../animations/speaking-animation.json';
import classroomAnimation from '../../animations/classroom.json';
import narrationAudio from '../../assets/pf-speaking-master.mp3';
import React, { useEffect, useRef, useState } from 'react';

const AuthLayout = ({ children }) => {
  const location = useLocation();
  const audioRef = useRef(null);
  const animationRef = useRef(null);
  const classroomAnimationRef = useRef(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const interactionHandledRef = useRef(false);

  // Function to synchronize audio and animation playback
  const startMediaTogether = (e) => {
    // Prevent event from bubbling up
    if (e) {
      e.stopPropagation();
    }
    
    if (interactionHandledRef.current) return;
    
    console.log("Starting media playback...");
    if (audioRef.current && animationRef.current) {
      // Play audio with error handling
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Audio started successfully");
            // Ensure animation is playing
            if (animationRef.current) {
              animationRef.current.play();
            }
            interactionHandledRef.current = true;
            setUserInteracted(true);
          })
          .catch(error => {
            console.error("Audio playback failed:", error);
            // If audio fails, still try to play animation
            if (animationRef.current) {
              animationRef.current.play();
            }
            interactionHandledRef.current = true;
            setUserInteracted(true);
          });
      }
    }
  };

  // Initialize animation to first frame
  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.goToAndStop(0, true);
    }
  }, []);

  // Global click handler (fallback)
  useEffect(() => {
    const handleGlobalInteraction = () => {
      if (!interactionHandledRef.current) {
        startMediaTogether();
      }
    };
    
    document.addEventListener('click', handleGlobalInteraction);
    
    return () => {
      document.removeEventListener('click', handleGlobalInteraction);
    };
  }, []);

  // Reset on unmount or route change
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      interactionHandledRef.current = false;
    };
  }, [location.pathname]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex relative">
        {/* Left side - Website Description */}
        <div className="hidden lg:flex lg:w-[60%] bg-gradient-to-br from-blue-400 to-blue-300 p-12 flex-col justify-between relative overflow-hidden">
          {/* Existing animated floating elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full" />
            <div className="absolute top-1/3 right-0 w-32 h-32 bg-white/15 rounded-full blur-lg" />
            <div className="absolute bottom-16 left-48 w-64 h-64 bg-blue-200/20 rounded-full blur-xl" />
          </div>

          {/* Curved separator with more pronounced curve */}
          <div className="absolute top-0 right-0 h-full">
            <div className="h-full w-[100px]">
              <svg
                className="h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 0 C 60 50, 60 50, 0 100 L100 100 L100 0 Z"
                  fill="white"
                  className="drop-shadow-xl"
                />
              </svg>
            </div>
          </div>
          
          <div className="relative max-w-2xl z-10">
            <h1 className="text-7xl font-black mb-8 bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent">
              PF Speaking Master
            </h1>
            
            {/* Animation Container */}
            <div className="flex space-x-8 mb-8 transform transition-all duration-300">
              {/* Speaking Animation */}
              <div className="w-1/2 relative group">
                  <Lottie
                    lottieRef={animationRef}
                    animationData={speakingAnimation}
                    loop={true}
                    autoplay={false}
                    style={{ width: '100%', height: '300px' }}
                  />
                  <audio 
                    ref={audioRef} 
                    src={narrationAudio} 
                    preload="auto"
                    loop={true}
                  />
                  
                  {!userInteracted && (
                    <button 
                      onClick={(e) => startMediaTogether(e)}
                      className="absolute inset-0 z-10"
                    />
                  )}
              </div>
  
              {/* Classroom Animation */}
              <div className="w-1/2 group">
                  <Lottie
                    lottieRef={classroomAnimationRef}
                    animationData={classroomAnimation}
                    loop={true}
                    autoplay={true}
                    style={{ width: '100%', height: '300px' }}
                  />
              </div>
            </div>
  
            <p className="text-xl text-blue-900/90 mb-8 font-medium">
              Transform your learning journey with our comprehensive virtual learning platform.
            </p>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-white/15">
                <div className="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Interactive Virtual Classrooms</h3>
                  <p className="text-blue-900/80 font-medium">Experience real-time video communication, live discussions, and collaborative learning with our advanced classroom features.</p>
                </div>
              </div>
  
              <div className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-white/15">
                <div className="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Comprehensive Learning Materials</h3>
                  <p className="text-blue-900/80 font-medium">Access rich content with our advanced editor, supporting images, formatting, and interactive elements.</p>
                </div>
              </div>
  
              <div className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-white/15">
                <div className="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Smart Assignment Management</h3>
                  <p className="text-blue-900/80 font-medium">Submit assignments, receive feedback, and track progress with our intuitive assignment system.</p>
                </div>
              </div>
  
              <div className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-white/15">
                <div className="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">Engaging Community</h3>
                  <p className="text-blue-900/80 font-medium">Join live sessions, participate in discussions, and collaborate with peers in real-time.</p>
                </div>
              </div>
            </div>
  
            <div className="mt-8 p-6 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
              <p className="text-blue-900/90 italic font-medium">
                "Join thousands of students and teachers already transforming their educational experience with our cutting-edge virtual learning platform."
              </p>
            </div>
          </div>
          
          <div className="text-white/80 text-sm relative z-10 font-medium">
            © 2025 PF Speaking Master. All rights reserved.
          </div>
        </div>
  
        {/* Right side - Auth Form */}
        <div className="flex-1 flex items-center justify-center h-screen overflow-y-auto p-8">
          <div className="my-auto w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-blue-100/50 transition-all duration-300 hover:shadow-lg">
            {children}
          </div>
        </div>
      </div>
  
      {/* CSS Styles */}
      <style jsx>{`
        .speaking-animation {
          position: relative;
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
  
        .person {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
  
        .head {
          width: 50px;
          height: 50px;
          background: #2c3e50;
          border-radius: 50%;
        }
  
        .body {
          width: 80px;
          height: 100px;
          background: #2c3e50;
          border-radius: 20px 20px 0 0;
          margin-top: 10px;
        }
  
        .speech-bubble {
          position: absolute;
          left: 60%;
          width: 100px;
          height: 60px;
          background: white;
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: float 2s infinite;
        }
  
        .wave {
          width: 60px;
          height: 20px;
          background: repeating-linear-gradient(
            to right,
            #3498db 0%,
            #3498db 10%,
            transparent 10%,
            transparent 20%
          );
          animation: wave 1s infinite linear;
        }
  
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
  
        @keyframes wave {
          0% { background-position: 0 0; }
          100% { background-position: 20px 0; }
        }
      `}</style>
    </MotionConfig>
  );
};

export default AuthLayout;
