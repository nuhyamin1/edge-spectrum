import { MotionConfig, motion } from 'framer-motion';
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
  const [isPlaying, setIsPlaying] = useState(false);
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
            setIsPlaying(true);
          })
          .catch(error => {
            console.error("Audio playback failed:", error);
            // If audio fails, still try to play animation
            if (animationRef.current) {
              animationRef.current.play();
            }
            interactionHandledRef.current = true;
            setUserInteracted(true);
            setIsPlaying(true);
          });
      }
    }
  };

  // Function to stop audio and animation
  const stopMedia = (e) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    if (animationRef.current) {
      animationRef.current.pause();
      animationRef.current.goToAndStop(0, true);
    }
    
    setIsPlaying(false);
  };

  // Toggle play/pause
  const toggleMedia = (e) => {
    if (e) {
      e.stopPropagation();
    }
    
    if (isPlaying) {
      stopMedia();
    } else {
      if (audioRef.current && animationRef.current) {
        audioRef.current.play()
          .then(() => {
            animationRef.current.play();
            setIsPlaying(true);
          })
          .catch(error => {
            console.error("Audio playback failed:", error);
            animationRef.current.play();
            setIsPlaying(true);
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
      setIsPlaying(false);
    };
  }, [location.pathname]);

  // Feature cards for the left sidebar
  const features = [
    {
      title: "Interactive Virtual Classrooms",
      description: "Experience real-time video communication, live discussions, and collaborative learning with our advanced classroom features.",
      icon: (
        <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      title: "Comprehensive Learning Materials",
      description: "Access rich content with our advanced editor, supporting images, formatting, and interactive elements.",
      icon: (
        <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      title: "Smart Assignment Management",
      description: "Submit assignments, receive feedback, and track progress with our intuitive assignment system.",
      icon: (
        <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    },
    {
      title: "Engaging Community",
      description: "Join live sessions, participate in discussions, and collaborate with peers in real-time.",
      icon: (
        <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex relative bg-gradient-to-br from-blue-50 to-white">
        {/* Left side - Website Description */}
        <div className="hidden lg:flex lg:w-[60%] bg-gradient-to-br from-blue-500/90 to-blue-400/80 p-12 flex-col justify-between relative overflow-hidden shadow-2xl">
          {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-full h-full">
            <motion.div 
              className="absolute -top-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-md"
              animate={{ 
                y: [0, 20, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div 
              className="absolute top-1/3 right-0 w-32 h-32 bg-white/15 rounded-full blur-lg"
              animate={{ 
                y: [0, -30, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 12,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div 
              className="absolute bottom-16 left-48 w-64 h-64 bg-blue-200/20 rounded-full blur-xl"
              animate={{ 
                y: [0, 15, 0],
                scale: [1, 0.9, 1]
              }}
              transition={{ 
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
          </div>

          {/* Enhanced curved separator */}
          <div className="absolute top-0 right-0 h-full">
            <div className="h-full w-[100px]">
              <svg
                className="h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 0 C 60 50, 60 50, 0 100 L100 100 L100 0 Z"
                  fill="#3b82f6"
                  className="drop-shadow-xl"
                />
              </svg>
            </div>
          </div>

          {/* Secondary curved separator */}
          <div className="absolute top-0 right-0 h-full">
            <div className="h-full w-[100px]">
              <svg
                className="h-full w-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 0 C 120 50, 120 50, 0 60 L100 100 L100 0 Z"
                  fill="#fafafa"
                  className="drop-shadow-xl"
                />
              </svg>
            </div>
          </div>
          
          <div className="relative max-w-2xl z-10">
            <motion.h1 
              className="text-6xl font-black mb-6 bg-gradient-to-r from-blue-800 to-blue-700 bg-clip-text text-transparent drop-shadow-md"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              PF Speaking Master
            </motion.h1>

            {/* Animation Container */}
            <motion.div 
              className="flex space-x-8 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {/* Speaking Animation */}
              <div className="w-1/2 relative group bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-300 hover:shadow-blue-300/30 hover:bg-white/20">
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
                
                {/* Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                  {!userInteracted ? (
                    <motion.button 
                      onClick={(e) => startMediaTogether(e)}
                      className="p-3 bg-blue-600 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </motion.button>
                  ) : (
                    <>
                      <motion.button 
                        onClick={(e) => toggleMedia(e)}
                        className="p-3 bg-blue-600 rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isPlaying ? (
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                          </svg>
                        ) : (
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        )}
                      </motion.button>
                      <motion.button 
                        onClick={(e) => stopMedia(e)}
                        className="p-3 bg-red-600 rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-all duration-200"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 6h12v12H6z" />
                        </svg>
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* Classroom Animation */}
              <div className="w-1/2 group bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-300 hover:shadow-blue-300/30 hover:bg-white/20">
                <Lottie
                  lottieRef={classroomAnimationRef}
                  animationData={classroomAnimation}
                  loop={true}
                  autoplay={true}
                  style={{ width: '100%', height: '300px' }}
                />
              </div>
            </motion.div>
  
            <motion.p 
              className="text-xl text-gray-800 mb-8 font-medium drop-shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Transform your learning journey with our comprehensive virtual learning platform.
            </motion.p>

            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-white/15 border border-transparent hover:border-white/20"
                  whileHover={{ 
                    y: -5,
                    boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5)"
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
                >
                  <div className="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30 shadow-md">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                    <p className="text-gray-800 font-medium">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
  
            <motion.div 
              className="mt-8 p-6 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 shadow-lg transition-all duration-300 hover:bg-white/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-gray-900 italic font-medium">
                "Join thousands of students and teachers already transforming their educational experience with our cutting-edge virtual learning platform."
              </p>
            </motion.div>
          </div>
          
          <motion.div 
            className="text-gray-800 text-sm relative z-10 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1.2 }}
          >
            © 2025 PF Speaking Master. All rights reserved.
          </motion.div>
        </div>
  
        {/* Right side - Auth Form */}
        <motion.div 
          className="flex-1 flex items-center justify-center h-screen overflow-y-auto p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
        >
          <motion.div 
            className="my-auto w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-blue-100/50 transition-all duration-300 hover:shadow-xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ 
              boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)",
              y: -5
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      </div>
  
      {/* CSS Styles */}
      <style jsx>{`
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