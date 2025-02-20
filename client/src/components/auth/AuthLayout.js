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
<div className="min-h-screen flex relative position-fixed top-0">
        {/* Left side - Website Description */}
        <div className="hidden lg:flex lg:w-[60%] bg-blue-300 p-12 flex-col justify-between">
          {/* Curved separator - updated with SVG for smooth curve */}
          <div className="absolute top-0 right-0 h-full w-24 overflow-hidden">
            <svg
              className="h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ width: '100%', height: '100%' }}
            >
              <path
                d="M 0,0 C 40,50 60,50 100,100 L 100,0 Z"
                fill="#E5E7EB"  // This should match your white background color
              />
            </svg>
          </div>
          
          <div className="relative max-w-2xl">
          <h1 className="text-8xl font-black text-black mb-8" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: '900 !important' }}>
              PF Speaking Master
          </h1>
            
            {/* Animation Container */}
            <div className="flex space-x-8 mb-8">
              {/* Speaking Animation */}
              <div className="w-1/2 relative">
                <Lottie
                  lottieRef={animationRef}
                  animationData={speakingAnimation}
                  loop={true}
                  autoplay={true}
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
              <div className="w-1/2">
                <Lottie
                  lottieRef={classroomAnimationRef}
                  animationData={classroomAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: '300px' }}
                />
              </div>
            </div>

            <p className="text-xl text-black/90 mb-8">
              Transform your learning journey with our comprehensive virtual learning platform.
            </p>
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-black/10 rounded-lg">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">Interactive Virtual Classrooms</h3>
                  <p className="text-black/80">Experience real-time video communication, live discussions, and collaborative learning with our advanced classroom features.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-black/10 rounded-lg">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">Comprehensive Learning Materials</h3>
                  <p className="text-black/80">Access rich content with our advanced editor, supporting images, formatting, and interactive elements.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-black/10 rounded-lg">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">Smart Assignment Management</h3>
                  <p className="text-black/80">Submit assignments, receive feedback, and track progress with our intuitive assignment system.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-black/10 rounded-lg">
                  <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-black">Engaging Community</h3>
                  <p className="text-black/80">Join live sessions, participate in discussions, and collaborate with peers in real-time.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-black/10 rounded-xl">
              <p className="text-black/90 italic">
                "Join thousands of students and teachers already transforming their educational experience with our cutting-edge virtual learning platform."
              </p>
            </div>
          </div>
          
          <div className="text-black/60 text-sm relative">
            © 2025 PF Speaking Master. All rights reserved.
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto" style={{ position: 'fixed', top: '50%', transform: 'translateY(-50%)', right: 0 }}>
          {children}
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
