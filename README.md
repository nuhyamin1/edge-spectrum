# EduFlow - Modern Learning Platform

EduFlow is a comprehensive learning platform that connects teachers and students through interactive virtual classrooms. Built with modern web technologies, it provides a seamless educational experience with features like video conferencing, real-time discussions, and organized learning materials.

## Features

### Authentication
- User registration for both teachers and students
- Secure email verification system
- JWT-based authentication
- Protected routes and user sessions

### Coming Soon
- Virtual Classrooms with Video Chat (Agora)
- Real-time Discussion Boards
- Learning Materials Management
- Interactive Teaching Tools

## Tech Stack

### Frontend
- React.js
- React Router for navigation
- Tailwind CSS for styling
- Axios for API requests
- React Toastify for notifications

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Nodemailer for email services

### Video Integration (Coming Soon)
- Agora SDK for video conferencing

## Prerequisites

Before running the application, make sure you have:
- Node.js (v14 or higher)
- MongoDB installed and running
- Gmail account for email verification service

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd learning-platform
   ```

2. Install dependencies for both server and client:
   ```bash
   # Install server dependencies
   npm install

   # Install client dependencies
   cd client
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/learning_platform
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```

4. Start the development server:
   ```bash
   # From the root directory
   npm run dev
   ```

## Development

The application uses a concurrent server setup:
- Backend API runs on `http://localhost:5000`
- React frontend runs on `http://localhost:3000`
- MongoDB should be running on `mongodb://127.0.0.1:27017`

## Scripts

- `npm run dev`: Runs both frontend and backend in development mode
- `npm run server`: Runs only the backend server
- `npm run client`: Runs only the frontend client
- `npm run install-all`: Installs dependencies for both frontend and backend

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
