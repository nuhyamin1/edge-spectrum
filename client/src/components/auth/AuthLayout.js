import { motion, MotionConfig } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98
  }
};

const pageTransition = {
  type: "spring",
  stiffness: 400,
  damping: 25,
  duration: 0.3
};

// Faster staggered animation for children elements
const containerVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1
    }
  }
};

const AuthLayout = ({ children }) => {
  const location = useLocation();

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex relative">
        {/* Left side - Website Description */}
        <div className="hidden lg:flex lg:w-[60%] bg-blue-300 p-12 flex-col justify-between relative">
          {/* Curved separator */}
          <div className="absolute right-0 top-0 h-full w-32 overflow-hidden">
            <div className="absolute top-0 right-0 h-full w-[200%] bg-gradient-to-br from-gray-50 to-gray-100 transform translate-x-1/2 rounded-l-[100%]" />
          </div>

          <div className="relative max-w-2xl">
            <h1 className="text-4xl font-black text-black mb-6">
              PF Speaking Master
            </h1>
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
        <motion.div
          key={location.pathname}
          initial="initial"
          animate="in"
          exit="exit"
          variants={pageVariants}
          transition={pageTransition}
          className="w-full lg:w-[40%] flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100"
        >
          <motion.div
            variants={containerVariants}
            className="w-full max-w-md"
          >
            {children}
          </motion.div>
        </motion.div>
      </div>
    </MotionConfig>
  );
};

export default AuthLayout; 