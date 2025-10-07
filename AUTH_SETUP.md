# Authentication System Setup Guide

## Overview
TimeTrack now has a complete authentication system with role-based access control. Users can sign up, sign in, and access different features based on their role (admin or regular user).

## Installation Steps

### 1. Install New Dependencies
```bash
npm install
```

This will install:
- `bcrypt` - For password hashing
- `express-session` - For session management

### 2. Create Users Table in Database
Run the following SQL script in SQL Server Management Studio (SSMS) or via sqlcmd:

```bash
sqlcmd -S localhost -d TimeTrackDB -i database/users-schema.sql
```

Or manually execute the script in `database/users-schema.sql`

### 3. Start the Server
```bash
npm start
```

The server will now run on `http://localhost:3000` (changed from 3001)

## User Roles

### Admin Users
**Access:**
- ✅ Punch Clock page
- ✅ Admin Dashboard
- ✅ Reports page
- ✅ Can manage staff, clients, offices
- ✅ Can delete records
- ✅ Can view all time entries

**Default Admin Account:**
- Username: `admin`
- Password: `admin123`
- **⚠️ IMPORTANT: Change this password after first login!**

### Regular Users
**Access:**
- ✅ Punch Clock page
- ✅ Users page (view-only dashboard)
- ✅ View today's time entries
- ✅ View all staff (read-only)
- ✅ View all clients (read-only)

**Cannot Access:**
- ❌ Admin Dashboard
- ❌ Reports page
- ❌ Cannot manage/delete records

## User Flows

### Sign Up Flow
1. Go to `http://localhost:3000/signup.html`
2. Enter username, email, and password
3. Click "Sign Up"
4. Automatically logged in and redirected to Users page
5. New users are created with `user` role by default

### Sign In Flow
1. Go to `http://localhost:3000/login.html`
2. Enter username and password
3. Click "Sign In"
4. Redirected based on role:
   - **Admin** → Admin Dashboard
   - **Regular User** → Users Page

### Sign Out Flow
1. Click "Sign Out" button in navigation
2. Session destroyed
3. Redirected to login page

## Pages Overview

### `/login.html` (Public)
- Login form
- Automatically redirects if already logged in
- Routes to admin or users page based on role

### `/signup.html` (Public)
- Sign up form
- Creates new user account with `user` role
- Automatically logs in after signup

### `/` (Public - Punch Clock)
- Main time tracking interface
- Navigation shows different links based on role
- Sign out button when authenticated

### `/admin` (Admin Only)
- Full admin dashboard
- Manage staff, clients, offices
- View and delete time entries
- Protected by `checkAdmin` middleware
- Redirects non-admins to users page

### `/reports` (Admin Only)
- Generate various reports
- Staff work reports
- Client billing reports
- Protected by `checkAdmin` middleware

### `/users` (Authenticated Only)
- Dashboard for regular users
- View today's time entries (read-only)
- View all staff (read-only)
- View all clients (read-only)
- Protected by `checkAuth` middleware

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Login user
- `POST /api/auth/signout` - Logout user
- `GET /api/auth/me` - Get current user session
- `GET /api/auth/check` - Check authentication status

### Protected Endpoints
All other API endpoints (`/api/staff`, `/api/clients`, etc.) work as before but are accessible to authenticated users.

## Session Configuration

Sessions are configured in `server.js`:
- **Duration:** 24 hours
- **Secret:** Set via `SESSION_SECRET` environment variable
- **Storage:** In-memory (for production, use Redis or database)
- **Cookies:** HTTP-only, not secure (change for HTTPS)

## Security Features

### Password Security
- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ Minimum 6 characters required
- ✅ Never stored in plain text

### Session Security
- ✅ HTTP-only cookies
- ✅ 24-hour expiration
- ✅ Secure session secret (should be changed in production)

### Route Protection
- ✅ Middleware checks authentication
- ✅ Role-based access control
- ✅ Automatic redirects for unauthorized access

### Input Validation
- ✅ Required fields validation
- ✅ Email format validation
- ✅ Password length validation
- ✅ Duplicate username/email prevention

## Database Schema

### Users Table
```sql
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL DEFAULT 'user',
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    LastLoginDate DATETIME NULL
);
```

## Environment Variables

Add these to your `.env` file:

```env
# Session secret (change this!)
SESSION_SECRET=your-very-secure-random-secret-here

# Existing variables
DB_SERVER=localhost
DB_DATABASE=TimeTrackDB
DB_USER=your_username
DB_PASSWORD=your_password
DB_ENCRYPT=false
PORT=3000
```

## Testing the Authentication System

### 1. Test Admin Access
```
1. Go to http://localhost:3000/login.html
2. Login with admin/admin123
3. Should redirect to /admin
4. Check navigation shows "Admin" and "Reports"
5. Click "Sign Out"
```

### 2. Test Regular User
```
1. Go to http://localhost:3000/signup.html
2. Create new account (username: testuser, email: test@test.com, password: test123)
3. Should redirect to /users
4. Check navigation shows "Users" (not Admin or Reports)
5. Try accessing /admin directly - should redirect to /users
6. Try accessing /reports directly - should redirect to /users
```

### 3. Test Sign Out
```
1. Click "Sign Out" on any page
2. Should redirect to /login.html
3. Try accessing /admin or /users
4. Should redirect back to /login.html
```

## Production Considerations

### Before Deploying to Production:

1. **Change Default Admin Password**
   - Login as admin
   - Change password immediately
   - Or delete default admin and create new one

2. **Update Session Secret**
   - Generate a strong random secret
   - Set in environment variables
   - Never commit to version control

3. **Use External Session Store**
   - Replace in-memory sessions with Redis or database
   - In-memory sessions don't persist across restarts

4. **Enable HTTPS**
   - Set `secure: true` in session cookie config
   - Use SSL certificates

5. **Add Rate Limiting**
   - Prevent brute force attacks on login
   - Consider `express-rate-limit` package

6. **Add Email Verification**
   - Verify email addresses on signup
   - Add password reset functionality

7. **Improve Password Requirements**
   - Require stronger passwords
   - Add password complexity rules

8. **Add Audit Logging**
   - Log all authentication attempts
   - Track user actions

## Troubleshooting

### Issue: "Cannot find module 'bcrypt'"
**Solution:** Run `npm install`

### Issue: "Invalid column name 'UserID'"
**Solution:** Run the `users-schema.sql` script to create the Users table

### Issue: Sessions not persisting
**Solution:** Check that `SESSION_SECRET` is set and server hasn't restarted

### Issue: Redirecting to login constantly
**Solution:** Check browser cookies are enabled, clear browser cache

### Issue: "Admin" default password doesn't work
**Solution:** The password hash is hardcoded. Run the users-schema.sql script again.

## File Structure

```
timetrack/
├── database/
│   ├── schema.sql           # Main database schema
│   ├── reports.sql          # Report stored procedures
│   └── users-schema.sql     # NEW: Users table
├── middleware/
│   └── auth.js              # NEW: Authentication middleware
├── routes/
│   ├── auth.js              # NEW: Authentication routes
│   ├── staff.js
│   ├── clients.js
│   ├── offices.js
│   ├── timeEntries.js
│   └── reports.js
├── public/
│   ├── login.html           # NEW: Login page
│   ├── signup.html          # NEW: Sign up page
│   ├── users.html           # NEW: Regular user dashboard
│   ├── index.html           # Updated: Auth navigation
│   ├── admin.html           # Updated: Auth check
│   ├── reports.html         # Updated: Auth check
│   └── css/styles.css
├── server.js                # Updated: Session & auth routes
└── package.json             # Updated: New dependencies
```

## Summary

The authentication system is now fully integrated with:
- ✅ User registration and login
- ✅ Role-based access control (admin vs user)
- ✅ Protected routes
- ✅ Secure password hashing
- ✅ Session management
- ✅ Different dashboards for different roles
- ✅ Sign out functionality

All existing functionality remains the same, but now with proper authentication and authorization!

