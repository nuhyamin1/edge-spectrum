# EduFlow Learning Platform

A modern virtual learning platform that connects teachers and students through interactive online classrooms.

## Features

### User Management
- User registration with email verification
- Role-based authentication (Teacher/Student)
- Secure login with JWT tokens
- Password hashing and security measures

### Material Management
- Teachers can create and manage learning materials
- Full-text content support for comprehensive articles
- Material categorization by subject
- Interactive material cards with edit and delete functionality
- Material viewing for both teachers and students
- Real-time material updates

### Session Management
- Teachers can create and manage learning sessions
- Session scheduling with date and time
- Session duration and grace period settings
- Real-time session status updates
- Real-time session creation and deletion notifications
- Material linking with sessions
- Student enrollment system

### Teacher Features
- Create and edit learning sessions
- Create and manage learning materials
- View enrolled students
- Start and end live sessions
- Set session duration and grace period
- Manage classroom activities
- Session dashboard with real-time updates

### Student Features
- Browse available sessions in real-time
- Access semester materials and content
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
- Heroicons for UI icons
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
├── .gitignore
├── README.md
├── client
│   ├── .gitignore
│   ├── README.md
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public
│   │   ├── favicon.ico
│   │   ├── index.html
│   │   ├── logo192.png
│   │   ├── logo512.png
│   │   ├── manifest.json
│   │   └── robots.txt
│   ├── src
│   │   ├── App.css
│   │   ├── App.js
│   │   ├── App.test.js
│   │   ├── components
│   │   │   ├── auth
│   │   │   │   ├── EmailVerification.js
│   │   │   │   ├── Login.js
│   │   │   │   └── Register.js
│   │   │   └── dashboard
│   │   │       ├── Layout.jsx
│   │   │       ├── MaterialView.jsx
│   │   │       ├── student
│   │   │       │   ├── AvailableSessions.jsx
│   │   │       │   ├── MainPage.jsx
│   │   │       │   ├── StudentClassroom.jsx
│   │   │       │   └── StudentDashboard.jsx
│   │   │       └── teacher
│   │   │           ├── Classroom.jsx
│   │   │           ├── CreateMaterial.jsx
│   │   │           ├── CreateSession.jsx
│   │   │           ├── EditMaterial.jsx
│   │   │           ├── EditSession.jsx
│   │   │           ├── MainPage.jsx
│   │   │           └── SessionList.jsx
│   │   ├── context
│   │   │   └── AuthContext.js
│   │   ├── index.css
│   │   ├── index.js
│   │   ├── logo.svg
│   │   ├── reportWebVitals.js
│   │   ├── setupTests.js
│   │   └── utils
│   │       └── axios.js
│   └── tailwind.config.js
├── package-lock.json
├── package.json
└── server
    ├── middleware
    │   ├── auth.js
    │   └── isTeacher.js
    ├── models
    │   ├── Material.js
    │   ├── Session.js
    │   └── User.js
    ├── public
    │   └── uploads
    │       └── profiles
    ├── routes
    │   ├── auth.js
    │   ├── materials.js
    │   ├── sessions.js
    │   └── sse.js
    ├── scripts
    │   └── updateSessionStatus.js
    ├── server.js
    ├── services
    │   ├── sessionEvents.js
    │   └── socket.js
    └── src
        ├── middleware
        │   └── isTeacher.js
        ├── models
        │   └── Session.js
        └── routes
            └── sessions.js
```

## Recent Updates

### Material Management Enhancement (January 21, 2025)
- Added comprehensive material management system
- Implemented material creation and editing functionality
- Added material viewing for students and teachers
- Enhanced UI with modern design and icons
- Improved material organization and display
- Added real-time material updates
- Implemented material deletion with confirmation

### Session Management Enhancements (January 20, 2025)
- Added session duration and grace period functionality
- Implemented countdown timer for grace period
- Enhanced session storage handling
- Added validation for session joining
- Improved error handling and user feedback

## Next Steps
- Implement classroom features
- Add material search and filtering
- Enhance session analytics
- Add student progress tracking
- Implement file upload for materials
- Add rich text editor for material content
