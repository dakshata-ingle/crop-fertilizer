# Authentication Setup Guide

This guide walks you through setting up the complete authentication system for the CropFertilizer application.

## Backend Setup

### 1. Install Dependencies
```bash
cd backend_cropferti-main
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the backend root (copy from `.env.example`):
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/crop-fertilizer
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

**Important**: Change `JWT_SECRET` to a strong random string in production.

### 3. Setup MongoDB
- **Local**: Install MongoDB and ensure it's running on `localhost:27017`
- **Cloud**: Use MongoDB Atlas and update `MONGODB_URI` in `.env` with your connection string

### 4. Start Backend Server
```bash
npm run dev
```
Server will run on `http://localhost:3001`

### Backend API Endpoints
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires token)
- `POST /api/calculate` - Calculate fertilizer (existing)
- `GET /api/catalog` - Get fertilizer catalog (existing)

## Frontend Setup

### 1. Install Dependencies
```bash
cd Fertilizer_Calculator-master
npm install
```

### 2. Configure Environment Variables
Frontend already has `.env.local` with:
```
VITE_API_URL=http://localhost:3001
```

### 3. Start Frontend Development Server
```bash
npm run dev
```
Frontend will run on `http://localhost:5173`

## Features Implemented

### Backend Features
✅ User Registration (Signup)
  - Name, Email, Password validation
  - Password confirmation check
  - Duplicate email prevention
  - Password hashing with bcryptjs
  - JWT token generation

✅ User Login
  - Email/password verification
  - JWT token generation
  - Error handling

✅ Protected Routes
  - Middleware for token validation
  - Get current user info

### Frontend Features
✅ Login Page
  - Email and password input
  - Form validation
  - Error messages
  - Link to signup page
  - Password visibility toggle

✅ Signup Page
  - Name, email, password, confirm password inputs
  - Password strength validation
  - Confirmation password check
  - Error messages
  - Link to login page
  - Password visibility toggles

✅ Auth Context
  - Global state management
  - Token storage (localStorage)
  - User info persistence
  - Login/Signup/Logout functions

✅ Protected Routes
  - Fertilizer Calculator page now requires authentication
  - Automatic redirect to login for unauthorized access

✅ Updated Header
  - Shows user name when logged in
  - Logout button for authenticated users
  - Login/Signup links for guests

## User Flow

### New User
1. Click "Sign Up" in header
2. Fill signup form (name, email, password)
3. Get auto-logged in and redirected to home
4. Can use calculator
5. Click logout to go back to login page

### Existing User
1. Click "Login" in header
2. Enter email and password
3. Get logged in and redirected to home
4. Can use calculator

## Testing

### Test Credentials (After First Signup)
- Any account created through signup form

### Test API with cURL or Postman

**Signup:**
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Get Current User (use token from login response):**
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Optional Enhancements

You can further extend this by:

1. **Email Verification**
   - Send verification email on signup
   - Verify email before allowing login

2. **Password Reset**
   - Forgot password functionality
   - Reset link via email

3. **Social Login**
   - Google OAuth
   - GitHub OAuth

4. **Two-Factor Authentication (2FA)**
   - SMS/Email OTP verification

5. **User Profile**
   - Update user details
   - Change password
   - Profile picture upload

6. **Role-Based Access**
   - Admin/User roles
   - Different permissions

## Troubleshooting

### "Cannot connect to MongoDB"
- Ensure MongoDB is running locally or update MONGODB_URI with Atlas connection string

### "Invalid token" error
- Token might be expired (7-day expiration)
- Clear browser localStorage and login again

### CORS errors
- Backend CORS is configured to accept requests from any origin
- Ensure API_URL in frontend .env matches backend URL

### "Email already registered"
- Use a different email or login with existing account

## Production Deployment

Before deploying to production:

1. **Change JWT_SECRET** to a strong random value
2. **Enable HTTPS** for all API calls
3. **Set secure MongoDB** (Atlas with IP whitelist)
4. **Update API URLs** in frontend for production backend
5. **Add rate limiting** to auth endpoints
6. **Enable HTTPS-only cookies** for token storage
7. **Add request validation** for all inputs
8. **Setup proper error logging**
9. **Use environment-specific configs**

---

Happy coding! 🌾
