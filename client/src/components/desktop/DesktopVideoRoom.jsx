import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from '../../utils/axios';
import { useAuth } from '../../context/AuthContext';
import VideoRoom from '../dashboard/VideoRoom';
import './DesktopVideoRoom.css';

const DesktopVideoRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [error, setError] = useState('');
  const joinEmitted = useRef(false);
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    let active = true;
    axios.get(`/api/sessions/${sessionId}`)
      .then(response => {
        if (!active) return;
        if (response.data.status !== 'active') {
          setError('This Video Room is not active. Return to the lobby and start or refresh the session.');
          return;
        }
        setSession(response.data);
      })
      .catch(err => {
        if (active) setError(err.response?.data?.error || 'Could not open this Video Room.');
      });
    return () => { active = false; };
  }, [sessionId]);

  useEffect(() => {
    if (!session || isTeacher || joinEmitted.current) return undefined;
    joinEmitted.current = true;
    const socket = io(process.env.REACT_APP_SOCKET_SERVER || process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      reconnection: true
    });
    socket.on('connect', () => {
      socket.emit('join', { sessionId });
      socket.emit('studentJoinedClassroom', {
        sessionId,
        studentId: user.id,
        studentName: user.name,
        studentEmail: user.email,
        studentProfilePicture: user.profilePicture
      });
    });
    return () => socket.disconnect();
  }, [isTeacher, session, sessionId, user]);

  if (error) {
    return <main className="desktop-video-shell"><div className="desktop-video-room-error"><h1>Video Room unavailable</h1><p>{error}</p><button onClick={() => navigate('/desktop')}>Back to sessions</button></div></main>;
  }

  if (!session) {
    return <main className="desktop-video-shell"><div className="desktop-video-empty"><span className="desktop-video-spinner" /><p>Preparing your Video Room…</p></div></main>;
  }

  return (
    <div className="desktop-video-room">
      <VideoRoom sessionId={sessionId} isTeacher={isTeacher} session={session} onExit={() => navigate('/desktop')} />
    </div>
  );
};

export default DesktopVideoRoom;
