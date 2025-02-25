import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [contentVisible, setContentVisible] = useState(false);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Particle system configuration
  const particleConfig = {
    count: 50,
    color: '#8EB8FF',
    speedFactor: 0.5,
    sizeRange: [1, 3],
    opacity: 0.6
  };

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Montserrat:wght@300;400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Particle animation setup
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas to full screen
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Create particles
    const particles = [];
    for (let i = 0; i < particleConfig.count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * (particleConfig.sizeRange[1] - particleConfig.sizeRange[0]) + particleConfig.sizeRange[0],
        speedY: (Math.random() * 0.5 + 0.1) * particleConfig.speedFactor,
        opacity: Math.random() * 0.4 + particleConfig.opacity,
        rotation: Math.random() * Math.PI * 2
      });
    }
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw particles
      particles.forEach(particle => {
        // Update position
        particle.y += particle.speedY;
        particle.rotation += 0.01;
        
        // Reset if out of bounds
        if (particle.y > canvas.height) {
          particle.y = -10;
          particle.x = Math.random() * canvas.width;
        }
        
        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.beginPath();
        ctx.fillStyle = particleConfig.color;
        ctx.globalAlpha = particle.opacity;
        
        // Star shape
        const spikes = 4;
        const outerRadius = particle.size;
        const innerRadius = particle.size / 2;
        
        for(let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (Math.PI * 2) * (i / (spikes * 2));
          const x = radius * Math.cos(angle);
          const y = radius * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleEnter = () => {
    navigate('/login');
  };

  // Content for each menu item
  const menuItems = [
    { 
      id: 'what-is-pfsm', 
      label: 'What is PFSM',
      content: "PFSM is an interactive virtual learning platform that enables seamless teacher-student collaboration through dynamic classrooms, real-time sessions, rich material management, and assignment tracking. It combines secure authentication, role-based access, and modern tools like video conferencing to enhance digital education."
    },
    { 
      id: 'vision', 
      label: 'Vision',
      content: "To revolutionize global education by creating an inclusive, tech-driven ecosystem where learning transcends physical boundaries through immersive, real-time collaboration."
    },
    { 
      id: 'mission', 
      label: 'Mission',
      content: "Empower educators and learners with intuitive tools for interactive teaching, personalized content creation, and secure virtual classrooms, fostering engagement and accessibility in education."
    },
    {
      id: 'start-learning',
      label: 'Start Learning',
      content: "Begin your learning journey with PFSM. Join our interactive platform and enhance your speaking skills through personalized lessons and real-time practice sessions.",
      action: handleEnter
    }
  ];

  // Set a slight delay when hovering out to make the UI feel more responsive
  useEffect(() => {
    if (hoveredItem) {
      setContentVisible(true);
    } else {
      const timer = setTimeout(() => {
        setContentVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [hoveredItem]);

  return (
    <div 
      className="absolute inset-0 flex overflow-hidden select-none outline-none pointer-events-none"
      onClick={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/pfsm-welcome.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        cursor: 'default'
      }}
    >
      {/* Canvas for particles */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ mixBlendMode: 'screen', cursor: 'none' }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Logo and Brand Name at lower left corner */}
      <div className="absolute bottom-8 left-8 z-30 pointer-events-auto">
          <div className="flex items-center space-x-4 cursor-default">
          <img 
            src={`${process.env.PUBLIC_URL}/pfsm_logo.png`} 
            alt="PFSM Logo" 
            className="h-16 w-auto"
            style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }}
          />
          <div className="flex flex-col">
            <div 
              className="text-2xl font-medium pointer-events-none"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                background: 'linear-gradient(to right, #60a5fa, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                textShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
                letterSpacing: '1px'
              }}
            >
              PF Speaking Master
            </div>
            <div 
              className="text-sm"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                color: 'rgba(255, 255, 255, 0.8)',
                letterSpacing: '2px',
                textShadow: '0 0 8px rgba(59, 130, 246, 0.4)',
                fontWeight: '300'
              }}
            >
              Practice & Fluency
            </div>
          </div>
        </div>
      </div>

      {/* Content panel that appears at top right - now borderless with glow effect */}
      <div 
        className="absolute top-8 right-8 z-20 max-w-lg w-full transition-all duration-700 transform p-8 overflow-hidden"
        style={{
          transform: contentVisible ? 'translateY(0) translateX(0)' : 'translateY(-30px) translateX(30px)',
          opacity: contentVisible ? 1 : 0,
        }}
      >
        {hoveredItem && (
          <>
            <h2 
              className="text-6xl mb-4 text-white"
              style={{ 
                fontFamily: "'Cormorant Garamond', serif",
                textShadow: '0 0 15px rgba(59, 130, 246, 0.3), 0 0 30px rgba(59, 130, 246, 0.3)',
                letterSpacing: '1px',
                fontWeight: '600',
                animation: 'fadeIn 0.3s ease-out'
              }}
            >
              {menuItems.find(item => item.id === hoveredItem)?.label}
            </h2>
            <div 
              className="text-white text-lg leading-relaxed pointer-events-none"
              style={{
                fontFamily: "'Montserrat', sans-serif",
                animation: 'fadeIn 0.5s ease-in-out',
                textShadow: '0 0 10px rgba(59, 130, 246, 0.3), 0 0 20px rgba(0, 0, 0, 0.3)',
                fontWeight: '300',
                maxWidth: '90%',
                transform: 'translateZ(0)',
                opacity: '0.80'
              }}
            >
              {menuItems.find(item => item.id === hoveredItem)?.content}
            </div>
          </>
        )}
      </div>

      {/* Sidebar menu */}
      <div className="relative z-20 w-72 pt-24 flex flex-col items-start pointer-events-auto">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="px-10 py-6 cursor-pointer relative"
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              onClick={item.action}
            >
              {/* Glow effect container */}
              <div 
                className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-700"
                style={{
                  opacity: hoveredItem === item.id ? 0.3 : 0,
                  background: 'radial-gradient(circle, rgba(147, 197, 253, 0.3) 0%, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0) 100%)'
                }}
              />
            
            {/* Text with animation */}
            <span 
            className="relative transition-all duration-700 pointer-events-none"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: hoveredItem === item.id ? '2.4rem' : '2.2rem',
                fontWeight: hoveredItem === item.id ? '600' : '500',
                color: hoveredItem === item.id ? '#ffffff' : 'rgba(255, 255, 255, 0.8)',
                textShadow: hoveredItem === item.id 
                  ? '0 0 15px rgba(147, 197, 253, 0.9), 0 0 30px rgba(59, 130, 246, 0.6), 0 0 45px rgba(37, 99, 235, 0.4)'
                  : '0 0 8px rgba(59, 130, 246, 0.3)',
                transform: hoveredItem === item.id ? 'translateX(12px)' : 'translateX(0)',
                letterSpacing: hoveredItem === item.id ? '2px' : '1px'
              }}
            >
              {item.label}
            </span>
            </div>
          ))}

        </div>
      </div>

      {/* Main content without Enter button */}
      <div className="relative flex-1 flex items-center justify-center z-20 pointer-events-auto">
        <div className="text-white space-y-8 max-w-2xl px-4 text-center mx-auto">
          {/* Reduced vertical spacing */}
          <div className="h-[450px]" />
          <p style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-2xl font-light italic pointer-events-none">
            "Language is the road map of a culture. It tells you where its people come from and where they are going."
          </p>
          <p style={{ fontFamily: "'Montserrat', sans-serif" }} className="text-xl pointer-events-none">
            ‒ Rita Mae Brown
          </p>

        </div>
      </div>
    </div>
  );
};

export default WelcomePage;
