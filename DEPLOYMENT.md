# Deployment Checklist

## 1. Environment Configuration

### Backend (.env)
- [ ] Update `MONGODB_URI` with production database connection string
- [ ] Set a strong `JWT_SECRET` (current value is temporary)
- [ ] Update `EMAIL_USER` and `EMAIL_PASS` with production email service credentials
- [ ] Configure `CLIENT_URL` to match your production frontend URL
- [ ] Verify `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are correct for production
- [ ] Add `ELEVENLABS_API_KEY` with the production ElevenLabs credential

### Frontend (client/.env.production)
- [ ] Set `REACT_APP_API_URL` to your production backend URL
- [ ] Verify `REACT_APP_AGORA_APP_ID` matches backend configuration

## 2. Build Steps

### Backend
1. Install dependencies:
   ```bash
   npm install
   ```
2. Ensure all environment variables are set correctly
3. Test the server locally:
   ```bash
   npm start
   ```

### Frontend
1. Install dependencies:
   ```bash
   cd client
   npm install
   ```
2. Build the production bundle:
   ```bash
   npm run build
   ```
3. Test the production build locally:
   ```bash
   serve -s build
   ```

## 3. Hosting Setup

### Backend Requirements
- Node.js environment (v14+ recommended)
- Support for WebSocket connections (for video chat)
- Environment variable configuration
- Adequate storage for file uploads
- SSL/HTTPS certificate
- Sufficient memory for MongoDB connections
- Support for long-running processes (video sessions)

### Frontend Requirements
- Static file hosting
- SSL/HTTPS certificate
- Custom domain configuration (if needed)
- CDN setup (recommended)

## 4. Database Setup
- [ ] Create production MongoDB database
- [ ] Set up database user with restricted permissions
- [ ] Configure network access for production server IP
- [ ] Set up database backups
- [ ] Test database connection from production environment

## 5. Security Checklist
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set secure session cookies
- [ ] Hide error stack traces in production
- [ ] Set up rate limiting
- [ ] Configure security headers
- [ ] Set up monitoring and logging
- [ ] Implement backup strategy

## 6. Testing Checklist
- [ ] Test user registration/login flow
- [ ] Verify email functionality
- [ ] Test video call features
- [ ] Check file upload functionality
- [ ] Verify database operations
- [ ] Test error handling
- [ ] Check mobile responsiveness
- [ ] Verify OAuth (Google) integration

## 7. Post-Deployment
- [ ] Monitor error logs
- [ ] Set up health checks
- [ ] Configure alerts for system issues
- [ ] Document API endpoints
- [ ] Set up analytics
- [ ] Create backup schedule
- [ ] Plan scaling strategy

## 8. Performance Optimization
- [ ] Enable compression
- [ ] Configure caching
- [ ] Optimize static assets
- [ ] Set up CDN
- [ ] Configure database indexes
- [ ] Optimize API responses

## Additional Notes
- Keep production credentials secure and separate from development
- Document deployment process for team members
- Set up continuous integration/deployment if needed
- Plan for scalability and future updates
