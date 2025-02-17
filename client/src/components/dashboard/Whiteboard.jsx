import React, { useRef, useEffect } from 'react';
import io from 'socket.io-client';

function Whiteboard({ sessionId }) {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Initialize a socket connection and join room for whiteboard events.
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    socketRef.current = socket;
    socket.emit('joinWhiteboard', { sessionId });

    // Listen for drawing events from other users.
    socket.on('drawing', onDrawingEvent);

    // Listen for whiteboard clear requests.
    socket.on('clearWhiteboard', () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  const onDrawingEvent = (data) => {
    // Expected data: { x0, y0, x1, y1, color, lineWidth }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    drawLine(context, data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth, false);
  };

  const drawLine = (context, x0, y0, x1, y1, color, lineWidth, emit) => {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
    context.closePath();

    // Emit the drawing data to other clients
    if (!emit) return;
    socketRef.current.emit('drawing', {
      x0,
      y0,
      x1,
      y1,
      color,
      lineWidth,
      sessionId,
    });
  };

  const handleMouseDown = (e) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    lastPos.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseMove = (e) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const currentPos = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    // Draw on canvas and emit drawing event.
    drawLine(
      context,
      lastPos.current.x,
      lastPos.current.y,
      currentPos.x,
      currentPos.y,
      'black', // default color; you can make this configurable
      2,       // default line width
      true
    );
    lastPos.current = currentPos;
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
  };

  const handleClearBoard = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    socketRef.current.emit('clearWhiteboard', { sessionId });
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="border border-gray-300"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <button
        onClick={handleClearBoard}
        className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
      >
        Clear Whiteboard
      </button>
    </div>
  );
}

export default Whiteboard; 