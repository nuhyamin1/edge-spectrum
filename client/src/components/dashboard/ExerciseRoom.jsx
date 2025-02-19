import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { io } from 'socket.io-client';

// ExerciseRoom: A component to display exercise instructions with rich text formatting.
// The readOnly prop allows the component to be rendered either as a display-only component (e.g., for students) or as an editor (for teachers).
const DEFAULT_CONTENT = '<p>Welcome to the Exercise Room! Please read the instructions provided by your teacher.</p>';

const ExerciseRoom = ({ sessionId, readOnly = false, initialContent = DEFAULT_CONTENT, onContentChange }) => {
  const [content, setContent] = useState(initialContent);
  const [socket, setSocket] = useState(null);

  // Connect to socket and join session room
  useEffect(() => {
    const newSocket = io('/');
    setSocket(newSocket);

    // Join the session room
    if (sessionId) {
      newSocket.emit('joinSession', {
        sessionId,
        isTeacher: !readOnly
      });

      // Request current exercise content when joining
      newSocket.emit('get-exercise-content', { sessionId });
    }

    // Listen for exercise updates
    newSocket.on('exercise-update', (data) => {
      if (data && data.content !== undefined) {
        setContent(data.content);
        if (onContentChange) {
          onContentChange(data.content);
        }
      }
    });

    // Listen for current content response
    newSocket.on('current-exercise-content', (data) => {
      if (data && data.content !== undefined) {
        setContent(data.content);
        if (onContentChange) {
          onContentChange(data.content);
        }
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [sessionId, onContentChange]);

  // Handle content changes (only for teachers)
  const handleContentChange = (newContent) => {
    setContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
    
    // Only emit updates if we're in teacher mode
    if (!readOnly && socket && sessionId) {
      socket.emit('exercise-update', {
        sessionId,
        content: newContent
      });
    }
  };

  return (
    <div className="exercise-room-container" style={{ padding: '20px' }}>
      <h2>Tasks to complete</h2>
      <div style={{ 
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: '#fff',
        minHeight: '300px'
      }}>
        <ReactQuill
          value={content}
          onChange={handleContentChange}
          readOnly={readOnly}
          theme={readOnly ? 'bubble' : 'snow'}
          style={{ height: '250px' }}
        />
      </div>
    </div>
  );
};

export default ExerciseRoom;
