import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="logo">PF Speaking Master</div>
        <ul className="nav-links">
          <li><a href="#features">Features</a></li>
          <li><a href="#benefits">Benefits</a></li>
          <li><a href="#testimonials">Testimonials</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register" className="signup-btn">Sign Up</Link></li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Master Public Speaking with Interactive Online Learning</h1>
          <p>Join live speaking sessions, get personalized feedback, and practice with peers in a supportive environment.</p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-btn">Start Learning Now</Link>
            <button className="demo-btn" onClick={() => alert('Demo coming soon!')}>Watch Demo</button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <h2>Key Features for Learners</h2>
        <div className="feature-grid">
          {[
            {
              title: "Live Speaking Sessions",
              description: "Practice speaking in real-time with expert instructors and peers.",
              icon: "🎤"
            },
            {
              title: "Learning Materials",
              description: "Access comprehensive speaking guides, exercises, and practice materials.",
              icon: "📚"
            },
            {
              title: "Progress Tracking",
              description: "Monitor your improvement with detailed feedback and progress reports.",
              icon: "📈"
            },
            {
              title: "Community Practice",
              description: "Join speaking clubs and practice sessions with fellow learners.",
              icon: "👥"
            }
          ].map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="benefits">
        <h2>Your Journey to Public Speaking Mastery</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <h3>What You'll Learn</h3>
            <ul>
              <li>Master essential speaking techniques</li>
              <li>Build confidence in public presentations</li>
              <li>Develop clear and engaging delivery</li>
              <li>Handle Q&A sessions effectively</li>
            </ul>
          </div>
          <div className="benefit-card">
            <h3>How You'll Learn</h3>
            <ul>
              <li>Join interactive live sessions</li>
              <li>Get feedback from expert instructors</li>
              <li>Practice with supportive peers</li>
              <li>Access on-demand learning materials</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta">
        <h2>Ready to Become a Confident Speaker?</h2>
        <p>Join our community of learners and start your speaking journey today.</p>
        <Link to="/register" className="cta-btn" style={{ marginTop: '20px', display: 'inline-block' }}>Start Learning</Link>
      </section>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
          </div>
          <p>© 2025 PF Speaking Master. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 