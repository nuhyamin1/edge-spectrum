const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const socketService = require('./services/socket');
const fs = require('fs');
const compression = require('compression');
const helmet = require('helmet');
const semesterRoutes = require('./routes/semesters');

// Load environment variables from root directory
dotenv.config();
const app = express();
const server = http.createServer(app);
// Initialize Socket.IO only once
const io = socketService.init(server);
// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads/profile-pictures');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS Configuration
const corsOptions = {
  origin: [
    'https://edge-spectrum-production.up.railway.app', // Production URL
    'https://pf-speaking-master-ba7a9.firebaseapp.com', // Firebase Auth Domain
    'http://localhost:3000', // Local development URL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

// Security and optimization middleware
// Custom Helmet configuration with CSP for Agora
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "wss://*", "ws://*", "*.agora.io", "*.agoraio.cn", "wss://*.agora.io", "https://generativelanguage.googleapis.com", "https://identitytoolkit.googleapis.com", "https://*.googleapis.com", "https://securetoken.googleapis.com", "https://edge-spectrum-production.up.railway.app"],
        mediaSrc: ["'self'", "blob:", "mediastream:", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://www.google.com", "https://*.googleusercontent.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://apis.google.com", "https://*.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        workerSrc: ["'self'", "blob:"],
        frameSrc: ["'self'", "https://accounts.google.com", "https://*.firebaseapp.com", "https://pf-speaking-master-ba7a9.firebaseapp.com"],
        formAction: ["'self'", "https://accounts.google.com"]
      }
    }
  })
);

app.use(compression()); // Enable gzip compression
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Hide detailed errors in production
if (process.env.NODE_ENV === 'production') {
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });
}

// MongoDB Connection using Atlas URI from environment variables
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB Connected');
    console.log('Database URL:', mongoose.connection.host);
    console.log('Database Name:', mongoose.connection.name);
    console.log('Full Connection String:', process.env.MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//****:****@')); // Hide credentials
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
app.use('/api/gtts', require('./routes/gtts')); // Add gtts route for mobile devices
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