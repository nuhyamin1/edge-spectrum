import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaDoorOpen, FaRedo, FaSignOutAlt, FaVideo } from 'react-icons/fa';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './DesktopVideoRoom.css';

const getJoinState = (session, isTeacher) => {
  if (session.status !== 'active') {
    return { enabled: false, label: isTeacher ? 'Start session' : 'Waiting for teacher' };
  }

  if (!isTeacher && session.startedAt) {
    const gracePeriodEnd = new Date(session.startedAt).getTime() + Number(session.gracePeriod || 0) * 60000;
    if (Date.now() > gracePeriodEnd) {
      return { enabled: false, label: 'Join period ended' };
    }
  }

  return { enabled: true, label: 'Join Video Room' };
};

const DesktopVideoLobby = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const isTeacher = user?.role === 'teacher';

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sessions/video-room/list');
      setSessions(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not load Video Room sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const sortedSessions = useMemo(() => [...sessions].sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (a.status !== 'active' && b.status === 'active') return 1;
    return new Date(a.dateTime) - new Date(b.dateTime);
  }), [sessions]);

  const enterRoom = (session) => {
    if (!isTeacher && session.startedAt) {
      const endTime = new Date(new Date(session.startedAt).getTime() + Number(session.gracePeriod || 0) * 60000);
      sessionStorage.setItem(`gracePeriod_${session._id}`, JSON.stringify({
        startedAt: session.startedAt,
        gracePeriod: session.gracePeriod,
        endTime: endTime.toISOString(),
        sessionId: session._id
      }));
    }
    navigate(`/desktop/room/${session._id}`);
  };

  const startSession = async (session) => {
    setStartingId(session._id);
    try {
      const response = await axios.post(`/api/sessions/${session._id}/start`);
      enterRoom(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Could not start this session');
      loadSessions();
    } finally {
      setStartingId(null);
    }
  };

  const signOut = () => {
    logout();
    navigate('/login', { state: { from: '/desktop' } });
  };

  return (
    <main className="desktop-video-shell">
      <section className="desktop-video-lobby">
        <header className="desktop-video-header">
          <div className="desktop-video-brand">
            <span className="desktop-video-logo"><FaVideo /></span>
            <div>
              <p>PF Speaking Master</p>
              <h1>Video Room</h1>
            </div>
          </div>
          <div className="desktop-video-account">
            <div><strong>{user?.name}</strong><span>{isTeacher ? 'Teacher' : 'Student'}</span></div>
            <button type="button" onClick={loadSessions} title="Refresh sessions"><FaRedo /></button>
            <button type="button" onClick={signOut} title="Sign out"><FaSignOutAlt /></button>
          </div>
        </header>

        <div className="desktop-video-intro">
          <div>
            <span className="desktop-video-kicker">Your meeting desk</span>
            <h2>{isTeacher ? 'Start or rejoin your class.' : 'Join your live class.'}</h2>
            <p>This desktop app is dedicated to calls, screen sharing, and live classroom interaction.</p>
          </div>
          <span className="desktop-video-ready"><i /> Camera and microphone ready</span>
        </div>

        <div className="desktop-video-section-title">
          <div><h3>Sessions</h3><p>{sessions.length} available</p></div>
        </div>

        {loading ? (
          <div className="desktop-video-empty"><span className="desktop-video-spinner" /><p>Finding your sessions…</p></div>
        ) : sortedSessions.length === 0 ? (
          <div className="desktop-video-empty"><FaCalendarAlt /><h3>No Video Rooms right now</h3><p>Scheduled or active sessions will appear here.</p></div>
        ) : (
          <div className="desktop-video-grid">
            {sortedSessions.map(session => {
              const joinState = getJoinState(session, isTeacher);
              const canStart = isTeacher && session.status !== 'active';
              return (
                <article className={`desktop-video-card ${session.status === 'active' ? 'is-live' : ''}`} key={session._id}>
                  <div className="desktop-video-card-top">
                    <span className={`desktop-video-status is-${session.status}`}><i />{session.status}</span>
                    <FaVideo />
                  </div>
                  <h3>{session.title}</h3>
                  <p className="desktop-video-subject">{session.subject || 'Speaking class'}</p>
                  <div className="desktop-video-meta">
                    <span><FaCalendarAlt />{new Date(session.dateTime).toLocaleDateString()}</span>
                    <span><FaClock />{new Date(session.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {session.duration} min</span>
                  </div>
                  <button
                    className="desktop-video-join"
                    type="button"
                    disabled={(!joinState.enabled && !canStart) || startingId === session._id}
                    onClick={() => canStart ? startSession(session) : enterRoom(session)}
                  >
                    <FaDoorOpen />{startingId === session._id ? 'Starting…' : joinState.label}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
};

export default DesktopVideoLobby;
