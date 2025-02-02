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
- Rich text formatting support with React Quill editor
- Advanced image handling features:
  - Image upload and insertion
  - Image resizing with aspect ratio lock
  - Image positioning (left, right, center alignment)
  - Context menu for image editing
  - Image properties dialog for precise control
  - Custom image styling and margins
- Full-text content support for comprehensive articles
- Material categorization by subject
- Interactive material cards with edit and delete functionality
- Material viewing for both teachers and students
- Real-time material updates
- Easy material linking system:
  - Copy material link button on material cards
  - Material selector dropdown in session creation
  - Automatic URL generation for material links
  - Standardized URL pattern: `/dashboard/material/:id`

### Session Management
- Teachers can create and manage learning sessions
- Session scheduling with date and time
- Session duration and grace period settings
- Real-time session status updates
- Real-time session creation and deletion notifications
- Integrated material linking:
  - Easy material selection during session creation
  - Direct access to session materials via standardized URLs
  - Material preview support
- Student enrollment system
- Enhanced session visibility and management:
  - Separate views for upcoming and completed sessions
  - Limited display with "View More" functionality
  - Comprehensive session detail view with role-specific actions
- Session status tracking:
  - Visual status indicators (scheduled, active, completed)
  - Role-appropriate action buttons
  - Real-time status updates
- Clean and intuitive session creation:
  - Placeholder-based form inputs
  - Clear validation messages
  - Streamlined material selection

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
- React Quill for rich text editing
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
│   │   │       ├── MaterialView.css
│   │   │       ├── MaterialView.jsx
│   │   │       ├── SessionView.jsx
│   │   │       ├── SessionsSection.jsx
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
│   │   │           ├── QuillEditor.css
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
├── public
│   └── uploads
│       └── materials
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
    │       ├── materials
    │       └── profiles
    ├── routes
    │   ├── auth.js
    │   ├── materials.js
    │   ├── sessions.js
    │   ├── sse.js
    │   └── upload.js
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

### Rich Text Editor Integration (January 22, 2025)
- Added React Quill editor for rich text formatting in materials
- Implemented image upload functionality in material content
- Enhanced material viewing with proper HTML rendering
- Added support for text formatting (bold, italic, lists, etc.)
- Improved content styling and readability

### Material Linking System (January 23, 2025)
- Implemented easy material linking system
- Added copy material link button on material cards
- Added material selector dropdown in session creation
- Implemented automatic URL generation for material links
- Standardized URL pattern: `/dashboard/material/:id`

### Integrated Material Linking (January 24, 2025)
- Integrated material linking with session management
- Added easy material selection during session creation
- Implemented direct access to session materials via standardized URLs
- Added material preview support

### Enhanced Session Management and UI/UX (January 25, 2025)
- Enhanced session visibility and management
- Improved session creation and editing
- Added visual status indicators and role-appropriate action buttons
- Implemented smart content pagination and responsive layout design
- Enhanced session details with comprehensive information and role-appropriate actions

## Next Steps
- Implement classroom features
- Add material search and filtering
- Enhance session analytics
- Add student progress tracking
- Implement file upload for materials
- Add rich text editor for material content
