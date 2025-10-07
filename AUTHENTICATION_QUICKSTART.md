# Authentication Quick Start

## 🚀 Getting Started in 3 Steps

### Step 1: Create the Users Table
Run this SQL script in SQL Server Management Studio or via sqlcmd:

**File:** `database/users-schema.sql`

**Or run manually:**
```bash
sqlcmd -S localhost -d TimeTrackDB -i database/users-schema.sql
```

This creates the Users table structure. The admin user will be created automatically in Step 2.

### Step 2: Start the Server
```bash
npm start
```

Server will start on http://localhost:3000

✨ **The server automatically creates the default admin user if one doesn't exist!**

### Step 3: Login
Go to: http://localhost:3000/login.html

**Default Admin Account (auto-created):**
- Username: `admin`
- Password: `admin123`

## 📋 What's New?

### For Admin Users:
- Login to access Admin Dashboard and Reports
- Full access to all features
- Can manage and delete records

### For Regular Users:
- Sign up for a new account at `/signup.html`
- Access Users page with read-only views
- Can view time entries, staff, and clients
- Cannot access Admin or Reports pages

## 🔐 User Types

| Feature | Admin | Regular User |
|---------|-------|--------------|
| Punch Clock | ✅ | ✅ |
| Admin Dashboard | ✅ | ❌ |
| Reports | ✅ | ❌ |
| Users Page | ✅ | ✅ |
| View Data | ✅ | ✅ |
| Manage/Delete | ✅ | ❌ |

## 🔗 All Pages

- **Login:** http://localhost:3000/login.html
- **Sign Up:** http://localhost:3000/signup.html
- **Punch Clock:** http://localhost:3000
- **Admin:** http://localhost:3000/admin (admin only)
- **Reports:** http://localhost:3000/reports (admin only)
- **Users:** http://localhost:3000/users (authenticated users)

## ⚡ Quick Test

1. **Test Admin:**
   - Login with admin/admin123
   - Should see Admin and Reports in navigation
   - Full access to all features

2. **Test Regular User:**
   - Go to /signup.html
   - Create account (e.g., testuser/test@test.com/test123)
   - Should see Users in navigation (no Admin/Reports)
   - Can view but not edit/delete

3. **Test Sign Out:**
   - Click "Sign Out" button
   - Redirects to login page
   - Cannot access protected pages

## ⚠️ Important Notes

1. **Change Default Admin Password** after first login!
2. All existing features still work the same
3. Navigation adapts based on user role
4. Sessions last 24 hours
5. Users table must be created before using auth

## 📖 Full Documentation

See `AUTH_SETUP.md` for complete documentation including:
- Security features
- Production considerations
- Troubleshooting
- API endpoints
- And more!

## 🎯 Summary

Your TimeTrack system now has:
- ✅ User authentication (signup/signin/signout)
- ✅ Role-based access control
- ✅ Protected admin features
- ✅ Separate dashboard for regular users
- ✅ Secure password hashing
- ✅ Session management

Everything is ready to use! Just create the Users table and start the server.

