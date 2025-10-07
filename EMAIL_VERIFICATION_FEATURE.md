# Email Verification for Punch Clock

## Overview
This feature ensures that users can only punch in/out for staff members whose email matches their logged-in user email. This adds a security layer to prevent users from clocking time for other staff members.

## Changes Made

### Backend Changes (`routes/timeEntries.js`)

#### 1. Punch In Endpoint (`POST /api/time-entries/punch-in`)
- **Authentication Check**: Verifies user is logged in before allowing punch-in
- **Email Verification**: Compares the logged-in user's email with the selected staff member's email
- **Admin Bypass**: Admin users can punch in for any staff member
- **Case-Insensitive Comparison**: Email matching is case-insensitive

**Error Messages:**
- `401 Unauthorized`: User is not logged in
- `404 Not Found`: Staff member not found or inactive
- `403 Access Denied`: User's email doesn't match staff member's email (non-admin users only)

#### 2. Punch Out Endpoint (`POST /api/time-entries/punch-out`)
- Same validation logic as punch-in
- Ensures users can only punch out for themselves (unless admin)

### Frontend Changes (`public/index.html`)

#### 1. Staff Dropdown Filtering
- **User Email Storage**: Stores logged-in user's email for filtering
- **Smart Filtering**: 
  - Regular users only see staff members with matching emails
  - Admin users see all staff members
- **User Feedback**: Shows warning if no matching staff profile found

#### 2. Enhanced User Experience
- Prevents users from attempting invalid punch-ins/outs
- Automatic filtering reduces confusion
- Clear error messages guide users

## How It Works

### For Regular Users:
1. User logs in with their email (e.g., `john@example.com`)
2. System loads staff members from database
3. Only staff members with email `john@example.com` appear in dropdown
4. User can only punch in/out for themselves
5. Backend validates email match on every request

### For Admin Users:
1. Admin logs in with admin credentials
2. System recognizes admin role
3. All active staff members appear in dropdown
4. Admin can punch in/out for any staff member
5. Backend bypasses email check for admins

## Security Features

1. **Session Validation**: All requests require valid session
2. **Email Verification**: Server-side email matching prevents tampering
3. **Case-Insensitive**: Prevents bypass through case changes
4. **Admin Override**: Admins have full control when needed
5. **Active Status Check**: Only active staff members can be selected

## Database Requirements

### Staff Table Must Have:
- `Email` field (NVarChar)
- Email must match user's login email

### Users Table Must Have:
- `Email` field (NVarChar)
- `Role` field (NVarChar) - for admin detection

## Error Handling

The system provides clear feedback for various scenarios:

| Scenario | Response | HTTP Status |
|----------|----------|-------------|
| Not logged in | "Please log in to punch in" | 401 |
| Staff not found | "Staff member not found or inactive" | 404 |
| Email mismatch | "Your email does not match the selected staff member" | 403 |
| Already punched in | "Staff member is already punched in" | 400 |
| Not punched in | "No active punch-in found" | 400 |

## Testing Instructions

### Test Case 1: Regular User - Matching Email
1. Create a user account with email `test@example.com`
2. Create a staff member with email `test@example.com`
3. Log in as the user
4. Should see only the matching staff member in dropdown
5. Should be able to punch in/out successfully

### Test Case 2: Regular User - No Matching Email
1. Log in with email `user1@example.com`
2. Staff member has email `user2@example.com`
3. Staff member should NOT appear in dropdown
4. Warning message should appear

### Test Case 3: Admin User
1. Log in with admin account
2. Should see ALL active staff members
3. Should be able to punch in/out for any staff member
4. No email verification applied

### Test Case 4: Tampering Attempt
1. Log in as regular user
2. Use browser dev tools to manually add staff option with different email
3. Attempt to punch in
4. Should receive 403 error with "Access denied" message

## Configuration

No additional configuration needed. The feature uses existing:
- Session management
- Database connection
- User authentication system

## Notes

- Email comparison is **case-insensitive**
- Staff members without emails cannot be selected by non-admin users
- Admin role must be exactly "admin" (case-insensitive)
- Feature works seamlessly with existing punch clock functionality

