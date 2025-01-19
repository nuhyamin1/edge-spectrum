# EduFlow Learning Platform

A modern web application that connects teachers and students through interactive virtual classrooms.

## Features

### Authentication
- JWT-based authentication for users (teachers and students)
- Email verification during registration
- Secure login with role-based access control
- Token-based session management

### Teacher Features
- Main page (still an empty page)
- Dashboard with session management
- Create new learning sessions with:
  - Title
  - Subject
  - Description
  - Date/Time scheduling
  - Optional materials link
- View and manage all created sessions
- Edit existing sessions
- Delete sessions
- Start a session

### Student Features
- Main page (still an empty page)
- Dashboard showing available sessions
- View upcoming session details including:
  - Session title and subject
  - Teacher information
  - Date and time
  - Session description
  - Access to session materials
- Session enrollment (Coming soon)

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Axios for API requests
- React Toastify for notifications
- Tailwind CSS for styling

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email services

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
│   │   │       ├── student
│   │   │       │   ├── AvailableSessions.jsx
│   │   │       │   ├── MainPage.jsx
│   │   │       │   └── StudentDashboard.jsx
│   │   │       └── teacher
│   │   │           ├── Classroom.jsx
│   │   │           ├── CreateSession.jsx
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
    │   ├── Session.js
    │   └── User.js
    ├── routes
    │   ├── auth.js
    │   └── sessions.js
    ├── server.js
    └── src
        ├── middleware
        │   └── isTeacher.js
        ├── models
        │   └── Session.js
        └── routes
            └── sessions.js
```

## Environment Variables

### Server
- `JWT_SECRET`: Secret key for JWT token generation
- `MONGODB_URI`: MongoDB connection string
- `EMAIL_USER`: Email service username
- `EMAIL_PASS`: Email service password

### Client
- `REACT_APP_API_URL`: Backend API URL

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
   - Create `.env` file in server directory
   - Create `.env` file in client directory

4. Start the development servers:
   ```bash
   # Start backend server
   cd server
   npm run dev

   # Start frontend server
   cd ../client
   npm start
   ```

## Current Status
- Authentication system implemented
- Teacher dashboard with session management
- Student dashboard with available sessions view
- Session enrollment system (In Progress)
- Real-time session notifications (Planned)
- Interactive classroom features (Planned)

## Next Steps
1. Implement session enrollment functionality
2. Add real-time notifications for session updates
3. Create interactive classroom features
4. Add file upload for session materials
5. Implement student progress tracking

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE.md file for details.
