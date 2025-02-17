const { Server } = require('socket.io');
let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);

            // Handle student joining classroom
            socket.on('studentJoinedClassroom', async (data) => {
                const { sessionId, studentId, studentName, studentEmail, studentProfilePicture } = data;
                console.log('Student joined classroom:', { sessionId, studentId, studentName, socketId: socket.id });

                try {
                    // Join the session room
                    socket.join(`session_${sessionId}`);

                    // Broadcast to everyone in the session
                    io.to(`session_${sessionId}`).emit('studentJoinedClassroom', {
                        sessionId,
                        studentId,
                        studentName,
                        studentEmail,
                        studentProfilePicture,
                        timestamp: Date.now()
                    });
                    
                    console.log(`Broadcasted join event for student ${studentName} in session ${sessionId}`);
                } catch (error) {
                    console.error('Error handling student join:', error);
                }
            });

            // Handle attendance updates
            socket.on('attendanceUpdate', (data) => {
                const { sessionId, studentId, status } = data;
                io.to(`session_${sessionId}`).emit('attendanceStatusChanged', {
                    sessionId,
                    studentId,
                    status,
                    timestamp: Date.now()
                });
            });

            // Add join event handler
            socket.on('join', (data) => {
                const { sessionId } = data;
                socket.join(`session_${sessionId}`);
                console.log(`Socket ${socket.id} joined room session_${sessionId}`);
            });

            // Whiteboard event handlers
            socket.on('joinWhiteboard', (data) => {
                const { sessionId } = data;
                const whiteboardRoom = `whiteboard_${sessionId}`;
                socket.join(whiteboardRoom);
                console.log(`Socket ${socket.id} joined whiteboard room ${whiteboardRoom}`);
            });

            socket.on('drawing', (data) => {
                const { sessionId } = data;
                const whiteboardRoom = `whiteboard_${sessionId}`;
                // Broadcast the drawing event to all clients in the same whiteboard room except the sender
                socket.to(whiteboardRoom).emit('drawing', data);
                console.log(`Broadcasting drawing event in room ${whiteboardRoom}`);
            });

            socket.on('clearWhiteboard', (data) => {
                const { sessionId } = data;
                const whiteboardRoom = `whiteboard_${sessionId}`;
                // Broadcast the clear event to all clients in the same whiteboard room
                io.to(whiteboardRoom).emit('clearWhiteboard');
                console.log(`Broadcasting clear whiteboard in room ${whiteboardRoom}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
