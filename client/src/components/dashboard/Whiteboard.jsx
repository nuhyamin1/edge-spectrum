import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { FaEraser, FaPaintBrush, FaTrash, FaLayerGroup } from 'react-icons/fa';

function Whiteboard({ sessionId, inVideoRoom = false }) {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(2);
  const [tool, setTool] = useState('brush'); // 'brush' or 'eraser'
  const [isTransparent, setIsTransparent] = useState(true);

  const colors = [
    '#000000', // Black
    '#FFFFFF', // White
    '#FF0000', // Red
    '#00FF00', // Green
    '#0000FF', // Blue
    '#FFFF00', // Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FFA500', // Orange
    '#800080', // Purple
    '#A52A2A', // Brown
    '#808080', // Gray
  ];

  const brushSizes = [2, 4, 6, 8, 10, 12, 14, 16];

  useEffect(() => {
    // Initialize socket connection
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    socketRef.current = socket;
    socket.emit('joinWhiteboard', { sessionId });

    // Listen for drawing events from other users
    socket.on('drawing', onDrawingEvent);

    // Listen for whiteboard clear requests
    socket.on('clearWhiteboard', handleClearBoard);

    // Initialize canvas with transparent background
    updateCanvasBackground();

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  useEffect(() => {
    updateCanvasBackground();
  }, [isTransparent]);

  const updateCanvasBackground = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (isTransparent) {
        // Save current drawings
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height);
        // Restore drawings
        context.putImageData(imageData, 0, 0);
      } else {
        // Fill with white background while preserving drawings
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.putImageData(imageData, 0, 0);
      }
    }
  };

  const onDrawingEvent = (data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    drawLine(
      context,
      data.x0,
      data.y0,
      data.x1,
      data.y1,
      data.color,
      data.lineWidth,
      data.tool,
      false
    );
  };

  const drawLine = (context, x0, y0, x1, y1, color, lineWidth, drawingTool, emit) => {
    context.beginPath();
    context.moveTo(x0, y0);
    context.lineTo(x1, y1);
    
    if (drawingTool === 'eraser') {
      context.strokeStyle = '#FFFFFF'; // White for eraser
      context.lineWidth = lineWidth * 2; // Make eraser slightly larger
    } else {
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
    }
    
    context.lineCap = 'round';
    context.stroke();
    context.closePath();

    if (!emit) return;
    socketRef.current.emit('drawing', {
      x0,
      y0,
      x1,
      y1,
      color,
      lineWidth,
      tool: drawingTool,
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

    drawLine(
      context,
      lastPos.current.x,
      lastPos.current.y,
      currentPos.x,
      currentPos.y,
      selectedColor,
      brushSize,
      tool,
      true
    );
    lastPos.current = currentPos;
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleClearBoard = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (isTransparent) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    } else {
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    socketRef.current.emit('clearWhiteboard', { sessionId });
  };

  // Handle touch events for mobile devices
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Tools and Controls */}
      <div className="mb-4 p-4 bg-gray-800 bg-opacity-75 backdrop-blur-sm rounded-lg shadow-lg w-full max-w-4xl flex flex-wrap gap-4 items-center justify-center">
        {/* Tool Selection */}
        <div className="flex gap-2">
          <button
            onClick={() => setTool('brush')}
            className={`p-2 rounded-lg ${
              tool === 'brush' ? 'bg-blue-500' : 'bg-gray-600'
            } hover:bg-blue-600 transition-colors`}
            title="Brush"
          >
            <FaPaintBrush className="text-white" />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg ${
              tool === 'eraser' ? 'bg-blue-500' : 'bg-gray-600'
            } hover:bg-blue-600 transition-colors`}
            title="Eraser"
          >
            <FaEraser className="text-white" />
          </button>
          {/* Background Toggle - Only show in video room */}
          {inVideoRoom && (
            <button
              onClick={() => setIsTransparent(!isTransparent)}
              className={`p-2 rounded-lg ${
                isTransparent ? 'bg-gray-600' : 'bg-blue-500'
              } hover:bg-blue-600 transition-colors`}
              title={isTransparent ? "Switch to White Background" : "Switch to Transparent Background"}
            >
              <FaLayerGroup className="text-white" />
            </button>
          )}
        </div>

        {/* Color Palette */}
        <div className="flex flex-wrap gap-1 items-center">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`w-6 h-6 rounded-full border-2 ${
                selectedColor === color ? 'border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>

        {/* Brush Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-white text-sm">Size:</span>
          <select
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="bg-gray-600 text-white rounded-lg p-1"
          >
            {brushSizes.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        {/* Clear Button */}
        <button
          onClick={handleClearBoard}
          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg flex items-center gap-2 transition-colors"
          title="Clear Board"
        >
          <FaTrash /> Clear
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="rounded-lg shadow-lg"
        style={{ 
          background: isTransparent ? 'transparent' : 'white'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}

export default Whiteboard; 