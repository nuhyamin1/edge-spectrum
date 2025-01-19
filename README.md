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
- Session status tracking (Scheduled, Active, Completed)
- Material uploads and sharing
- Student enrollment system

### Teacher Features
- Create and edit learning sessions
- View enrolled students
- Start and end live sessions
- Manage classroom activities
- Session dashboard with real-time updates

### Student Features
- Browse available sessions
- Enroll/unenroll from sessions
- Join live sessions
- View session materials
- Real-time session status updates

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

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Nodemailer for email services

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
├── .gitignore                      # Git ignore file for project root
├── README.md                       # Project documentation
├── client                         # Frontend React application
│   ├── .gitignore                 # Git ignore file for client
│   ├── README.md                  # Frontend documentation
│   ├── package-lock.json          # NPM dependencies lock file
│   ├── package.json               # Frontend dependencies and scripts
│   ├── postcss.config.js          # PostCSS configuration for Tailwind
│   ├── public                     # Static assets directory
│   │   ├── favicon.ico            # Website favicon
│   │   ├── index.html            # Main HTML file
│   │   ├── logo192.png           # React logo for PWA
│   │   ├── logo512.png           # React logo for PWA (larger)
│   │   ├── manifest.json         # PWA manifest file
│   │   └── robots.txt            # Search engine crawl rules
│   ├── src                       # Source code directory
│   │   ├── App.css               # Global application styles
│   │   ├── App.js                # Main React component
│   │   ├── App.test.js           # App component tests
│   │   ├── components            # React components directory
│   │   │   ├── auth              # Authentication components
│   │   │   │   ├── EmailVerification.js  # Email verification page
│   │   │   │   ├── Login.js              # Login page
│   │   │   │   └── Register.js           # Registration page
│   │   │   └── dashboard         # Dashboard components
│   │   │       ├── Layout.jsx            # Common dashboard layout
│   │   │       ├── student              # Student-specific components
│   │   │       │   ├── AvailableSessions.jsx    # Available sessions list
│   │   │       │   ├── MainPage.jsx             # Student main page
│   │   │       │   ├── StudentClassroom.jsx     # Student's classroom view
│   │   │       │   └── StudentDashboard.jsx     # Student dashboard
│   │   │       └── teacher               # Teacher-specific components
│   │   │           ├── Classroom.jsx            # Teacher's classroom view
│   │   │           ├── CreateSession.jsx        # Session creation form
│   │   │           ├── EditSession.jsx          # Session editing form
│   │   │           ├── MainPage.jsx             # Teacher main page
│   │   │           └── SessionList.jsx          # Teacher's sessions list
│   │   ├── context             # React context providers
│   │   │   └── AuthContext.js  # Authentication context
│   │   ├── index.css           # Entry point styles
│   │   ├── index.js            # Application entry point
│   │   ├── logo.svg            # React logo asset
│   │   ├── reportWebVitals.js  # Performance monitoring
│   │   ├── setupTests.js       # Test configuration
│   │   └── utils               # Utility functions
│   │       └── axios.js        # Axios instance configuration
│   └── tailwind.config.js      # Tailwind CSS configuration
├── package-lock.json           # Root NPM dependencies lock
├── package.json                # Root package configuration
└── server                      # Backend Node.js application
    ├── middleware             # Express middleware
    │   ├── auth.js            # Authentication middleware
    │   └── isTeacher.js       # Teacher role verification
    ├── models                 # MongoDB models
    │   ├── Session.js         # Session model definition
    │   └── User.js            # User model definition
    ├── routes                 # API routes
    │   ├── auth.js            # Authentication routes
    │   └── sessions.js        # Session management routes
    ├── scripts                # Utility scripts
    │   └── updateSessionStatus.js  # Session status migration
    ├── server.js              # Express server entry point
    └── src                    # Additional source files
        ├── middleware         # Additional middleware
        │   └── isTeacher.js   # Teacher verification (duplicate)
        ├── models             # Additional models
        │   └── Session.js     # Session model (duplicate)
        └── routes             # Additional routes
            └── sessions.js    # Session routes (duplicate)
```

## Session States

Sessions in EduFlow follow a specific lifecycle:

1. **Scheduled**
   - Initial state when created
   - Students can enroll/unenroll
   - Teachers can edit session details

2. **Active**
   - When teacher starts the session
   - Enrolled students can join the classroom
   - Real-time features become available

3. **Completed**
   - Session has ended
   - No further interactions possible
   - Historical data preserved

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Role-based access control
- Session validation middleware

## Future Enhancements

- Real-time chat implementation
- Video conferencing integration
- Interactive whiteboard features
- Screen sharing capabilities
- Student participation analytics
- Session recording and playback
- Resource library management
- Assignment submission system

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License.
