import React from 'react';
import { MotionConfig, motion } from 'framer-motion';
import './Auth.css';

const benefits = ['Live speaking practice', 'Personal feedback', 'Progress you can see'];

const BrandMark = () => (
  <span className="auth-brand__mark" aria-hidden="true"><span /><span /><span /></span>
);

const AuthLayout = ({ children }) => (
  <MotionConfig reducedMotion="user">
    <main className="auth-shell">
      <section className="auth-story" aria-labelledby="auth-story-title">
        <div className="auth-story__glow" aria-hidden="true" />
        <motion.div className="auth-brand" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <BrandMark /><span>PF Speaking Master</span>
        </motion.div>

        <div className="auth-story__content">
          <motion.p className="auth-eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Speak more. Second-guess less.</motion.p>
          <motion.h1 id="auth-story-title" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>
            Build the confidence to <em>speak English.</em>
          </motion.h1>
          <motion.p className="auth-story__description" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}>
            Practice in real conversations, get useful feedback, and turn every lesson into measurable progress.
          </motion.p>

          <motion.div className="practice-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .3 }}>
            <div className="practice-card__topline">
              <div className="practice-card__person">
                <span className="practice-card__avatar">AM</span>
                <span><strong>Conversation practice</strong><small>Everyday English · 8 min</small></span>
              </div>
              <span className="practice-card__live"><i /> Live</span>
            </div>
            <div className="practice-card__prompt"><span className="practice-card__quote">“</span><p>Tell me about something you learned this week.</p></div>
            <div className="practice-card__feedback">
              <span className="practice-card__check" aria-hidden="true">✓</span>
              <span><strong>Great clarity</strong><small>Your pace sounds natural and confident.</small></span>
              <span className="practice-card__score">92%</span>
            </div>
          </motion.div>

          <motion.ul className="auth-benefits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .45 }}>
            {benefits.map((benefit) => <li key={benefit}><span aria-hidden="true">✓</span>{benefit}</li>)}
          </motion.ul>
        </div>
        <p className="auth-story__footer">Learn at your pace. Speak with confidence.</p>
      </section>

      <section className="auth-main" aria-label="Account access">
        <div className="auth-mobile-brand"><BrandMark /><span>PF Speaking Master</span></div>
        <motion.div className="auth-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}>
          {children}
        </motion.div>
        <p className="auth-help">Need help? <a href="mailto:support@pfspeakingmaster.com">Contact support</a></p>
      </section>
    </main>
  </MotionConfig>
);

export default AuthLayout;
