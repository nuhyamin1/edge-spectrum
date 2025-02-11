# EduFlow Learning Platform

A modern virtual learning platform that connects teachers and students through interactive online classrooms.

## Features

### User Management
- User registration with email verification
- Role-based authentication (Teacher/Student)
- Secure login with JWT tokens
- Password hashing and security measures
- User profile management:
  - Profile picture upload and display using MongoDB storage
  - Personal information editing (name, email)
  - About Me section
  - Role-specific profile views
  - Secure profile data persistence across sessions
  - Real-time profile updates

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

### Assignment Management
- Teachers can create and manage assignments
- Assignment features:
  - Title and description
  - Due date setting
  - File and link submission options
  - Maximum file and link limits
  - Assignment status tracking
- Student assignment submission:
  - Multiple file upload support
  - External link submission
  - Submission status tracking
  - Resubmission capability for rejected assignments
- Teacher review system:
  - Accept/Reject submissions
  - Numerical marking (0-100)
  - Detailed feedback provision
  - Rejection reason when applicable
- Assignment status management:
  - Status indicators (pending, submitted, accepted, rejected)
  - Color-coded status display
  - Real-time status updates
- Assignment details display:
  - Assignment information
  - Submission status
  - Mark display
  - Teacher feedback
  - Rejection reasons (if applicable)
  - Due date information
- Role-specific views:
  - Teacher view with review capabilities
  - Student view with submission options
  - Real-time updates for both views

### Teacher Features
- Create and edit learning sessions
- Create and manage learning materials
- View enrolled students
- Start and end live sessions
- Set session duration and grace period
- Manage classroom activities
- Session dashboard with real-time updates
- Personalized teacher profile with profile picture
- Professional profile customization

### Student Features
- Browse available sessions in real-time
- Access semester materials and content
- Instant notifications of new sessions
- Enroll/unenroll from sessions
- Join live sessions within grace period
- View session materials
- Real-time session status updates
- Grace period countdown timer
- Customizable student profile
- Personal profile management

### Classroom Features (In Development)
- Real-time chat
- Video conferencing
- Interactive whiteboard
- Screen sharing
- Student participation tracking

## Recent Updates

### Assignment Management Enhancement (February 9, 2025)
- Improved assignment management interface:
  - Streamlined assignment cards showing only essential information
  - Dedicated assignment details page with student list
  - Enhanced review system with separate review dialog
  - File and link submission support
  - Download functionality for submitted files
  - Direct access to submitted links
- Assignment review improvements:
  - Clear status indicators (pending, submitted, accepted, rejected)
  - Individual student review system
  - Grade input (0-100)
  - Feedback and rejection reason fields
  - Submission preview before review
- User experience enhancements:
  - Intuitive navigation between assignments
  - Clear submission status for each student
  - Disabled review buttons for pending submissions
  - Real-time status updates after review
  - Easy access to all student submissions

### Assignment Management System (February 5, 2025)
- Added comprehensive assignment management system for teachers and students
- Implemented features:
  - Teachers can:
    - Create assignments with title, description, due date
    - Assign to individual student or all students at once
    - Review submitted assignments
    - Accept/Reject assignments with feedback
    - Grade assignments (0-100)
    - Download submitted files
  - Students can:
    - View assigned assignments
    - Submit multiple files (PDF, DOCX, PPT files)
    - Submit multiple links
    - View assignment status (pending, submitted, accepted, rejected)
    - View grades and feedback
- Technical improvements:
  - Added Assignment model with dynamic validation
  - Integrated Material-UI components for better UX
  - Implemented secure file upload system
  - Added role-based access control for assignments
  - Enhanced error handling and user feedback
  - Added multi-file download functionality for teachers
  - Implemented bulk assignment creation for all students

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

### Profile Picture System Enhancement (February 4, 2025)
- Switched from local storage to MongoDB for profile pictures
- Implemented base64 encoding for image storage
- Added persistent profile pictures across sessions
- Updated user authentication to include profile data

### Profile and Session View Improvements (February 5, 2025)
- Fixed profile picture display in student profile page
- Enhanced session routes to properly populate student profile pictures
- Updated enrolled students display in classroom view
- Standardized profile picture display across all views
- Fixed profile picture data structure consistency
- Improved enrolled students list layout in classroom view

### Current Working Status (February 5, 2025)
- Working Features:
  - Profile picture upload and storage in MongoDB
  - Profile picture persistence after logout/login
  - Profile picture display in user sidebar
  - Profile picture display in student profile page
  - Profile picture display in session and classroom views
  - Consistent enrolled students list layout
  - Assignment management with multi-file support
  - Bulk assignment creation
  - Assignment file downloads
- In Progress:
  - Image compression for better performance
  - Profile picture update confirmation
  - Classroom features implementation
  - Material search and filtering

### Profile Picture Display Fix (February 6, 2025)
- Fixed profile picture display in assignment details view
- Updated assignment details API to properly include profile picture data
- Enhanced student submission list with proper profile picture rendering
- Improved data structure consistency for profile pictures across views

## Next Steps
- Add assignment filtering and search functionality
- Implement assignment statistics and analytics
- Add batch download for multiple submissions
- Add assignment templates for teachers
- Implement assignment categories/tags
- Add deadline notifications
- Add assignment progress tracking
- Fix enrolled students' profile picture display
- Update session population to include complete student profile data
- Add image compression for better performance
- Implement profile picture update confirmation
- Implement classroom features
- Add material search and filtering
- Enhance session analytics
- Add student progress tracking
- Implement file upload for materials
- Add rich text editor for material content

## Technical Stack

### Frontend
- React.js with React Router for navigation
- Tailwind CSS for styling
- React Quill for rich text editing
- Context API for state management
- Axios for API requests

### Backend
- Node.js with Express
- MongoDB for database (including profile picture storage)
- JWT for authentication
- Multer for file upload handling
- Base64 encoding for image storage

### Security
- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes with role-based access
- Secure profile data handling

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
