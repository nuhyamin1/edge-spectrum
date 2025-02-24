const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketService = require('./services/socket');
const fs = require('fs');
const semesterRoutes = require('./routes/semesters');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO only once
const io = socketService.init(server);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads/profile-pictures');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// MongoDB Connection with hardcoded URI to match createAdmin.js
mongoose.connect('mongodb://127.0.0.1:27017/learning_platform')
  .then(() => {
    console.log('MongoDB Connected');
    console.log('Database URL:', mongoose.connection.host);
    console.log('Database Name:', mongoose.connection.name);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/sse', require('./routes/sse'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users')); // Fixed path to users routes
app.use('/api/assignments', require('./routes/assignments')); // Add assignments route
app.use('/api/posts', require('./routes/posts')); // Add this line for posts routes
app.use('/api/semesters', semesterRoutes);
app.use('/api/pronounce', require('./routes/pronounce')); // Add pronunciation route
app.use('/api/admin', require('./routes/admin')); // Add admin routes

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
