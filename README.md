# EduFlow Learning Platform

A modern virtual learning platform that connects teachers and students through interactive online classrooms.

## Features

### User Management
- User registration with email verification
- Role-based authentication (Teacher/Student)
- Secure login with JWT tokens
- Password hashing and security measures

### Session Management
- Teachers can create and manage learning sessions
- Session scheduling with date and time
- Session duration and grace period settings
- Real-time session status updates
- Real-time session creation and deletion notifications
- Material uploads and sharing
- Student enrollment system

### Teacher Features
- Create and edit learning sessions
- View enrolled students
- Start and end live sessions
- Set session duration and grace period
- Manage classroom activities
- Session dashboard with real-time updates

### Student Features
- Browse available sessions in real-time
- Instant notifications of new sessions
- Enroll/unenroll from sessions
- Join live sessions within grace period
- View session materials
- Real-time session status updates
- Grace period countdown timer

### Classroom Features (In Development)
- Real-time chat
- Video conferencing
- Interactive whiteboard
- Screen sharing
- Student participation tracking

## Technical Stack

### Frontend
- React.js with React Router for navigation
- Tailwind CSS for styling
- Axios for API requests
- React Context for state management
- React-Toastify for notifications
- Socket.IO client for real-time updates

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email services
- Socket.IO for real-time communication

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Set up environment variables:
   Create `.env` file in the server directory with:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email_user
   EMAIL_PASS=your_email_password
   CLIENT_URL=http://localhost:3000
   ```

4. Start the development servers:
   ```bash
   # Start backend server (from server directory)
   npm run dev

   # Start frontend server (from client directory)
   npm start
   ```

## Project Structure

```
learning_platform
├── .gitignore                     # Git ignore file for project root
├── README.md                      # Project documentation
├── client                         # Frontend React application
│   ├── .gitignore                # Git ignore file for client
│   ├── package.json              # Frontend dependencies
│   ├── public                    # Public assets
│   └── src                       # Source files
│       ├── App.js                # Main application component
│       ├── components            # React components
│       │   ├── auth             # Authentication components
│       │   │   ├── Login.jsx    # Login component
│       │   │   └── Register.jsx # Registration component
│       │   └── dashboard        # Dashboard components
│       │       ├── Layout.jsx   # Dashboard layout
│       │       ├── student      # Student components
│       │       │   ├── AvailableSessions.jsx  # Available sessions list
│       │       │   ├── MainPage.jsx           # Student main page
│       │       │   └── StudentClassroom.jsx   # Student classroom view
│       │       └── teacher      # Teacher components
│       │           ├── CreateSession.jsx      # Session creation form
│       │           ├── MainPage.jsx           # Teacher main page
│       │           └── SessionList.jsx        # Teacher's sessions list
│       ├── context              # React context providers
│       │   └── AuthContext.js   # Authentication context
│       ├── utils                # Utility functions
│       │   └── axios.js         # Axios instance
│       └── index.js             # Entry point
├── server                        # Backend Node.js/Express application
│   ├── .env                     # Environment variables
│   ├── .gitignore              # Git ignore file for server
│   ├── package.json            # Backend dependencies
│   ├── models                  # Mongoose models
│   │   ├── Session.js         # Session model
│   │   └── User.js            # User model
│   ├── routes                 # Express routes
│   │   ├── auth.js           # Authentication routes
│   │   └── sessions.js       # Session management routes
│   └── server.js             # Express app entry point
```

## Recent Updates

### Session Management Enhancements (January 20, 2025)
- Added session duration and grace period functionality
- Implemented countdown timer for grace period in student view
- Enhanced session storage handling for classroom access
- Added validation for session joining within grace period
- Improved error handling and user feedback
- Fixed session information persistence between navigation

## Next Steps
- Implement classroom features:
  - Real-time chat functionality
  - Video conferencing integration
  - Interactive whiteboard
  - Screen sharing capabilities
  - Student participation tracking
- Enhance session management:
  - Session recording
  - Attendance tracking
  - Session analytics
