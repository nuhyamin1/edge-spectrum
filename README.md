# EduFlow Learning Platform

A modern web application that connects teachers and students through interactive virtual classrooms.

## Features

### Authentication
- JWT-based authentication for users (teachers and students)
- Email verification during registration
- Secure login with role-based access control
- Token-based session management

### Teacher Features
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

### Student Features
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
client/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── EmailVerification.jsx
│   │   └── dashboard/
│   │       ├── teacher/
│   │       │   ├── MainPage.jsx
│   │       │   ├── CreateSession.jsx
│   │       │   ├── SessionList.jsx
│   │       │   └── EditSession.jsx
│   │       └── student/
│   │           ├── MainPage.jsx
│   │           └── AvailableSessions.jsx
│   ├── context/
│   │   └── AuthContext.js
│   └── App.js
│
server/
├── models/
│   ├── User.js
│   └── Session.js
├── routes/
│   ├── auth.js
│   └── sessions.js
├── middleware/
│   ├── auth.js
│   └── isTeacher.js
└── server.js
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
