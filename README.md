# Learning Platform

A comprehensive learning platform featuring video chat, discussions, and learning materials.

## Features
- Authentication (Teacher/Student)
- Email verification
- Video chat (using Agora)
- Discussion boards
- Learning materials management

## Setup Instructions

1. Clone the repository
2. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_app_password
   ```
3. Install dependencies:
   ```
   npm run install-all
   ```
4. Run the development server:
   ```
   npm run dev
   ```

## Tech Stack
- Frontend: React
- Backend: Node.js/Express
- Database: MongoDB
- Video Chat: Agora SDK
