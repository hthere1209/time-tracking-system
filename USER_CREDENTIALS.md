# User Credentials

## Current Users in Database

All user passwords have been reset and are now working correctly! ✅

### Login at: http://localhost:3000/login.html

**💡 You can sign in with either Username OR Email!**

| Username | Email | Password | Role | Access Level |
|----------|-------|----------|------|--------------|
| **admin** | admin@timetrack.com | admin123 | admin | Full access (Admin + Reports) |
| **manager** | manager@company.com | manager123 | user | Limited access (Users page) |
| **test** | test@test.com | test123 | user | Limited access (Users page) |
| **cheetah** | cheetah@timetrack.com | cheetah123 | user | Limited access (Users page) |

## Access Levels

### Admin Users
**Username:** `admin`  
**Password:** `admin123`

**Can Access:**
- ✅ Punch Clock page
- ✅ Admin Dashboard
- ✅ Reports page
- ✅ Users page
- ✅ Can manage/delete all records

### Regular Users
**Usernames:** `manager`, `test`, `cheetah`  
**Passwords:** `manager123`, `test123`, `cheetah123`

**Can Access:**
- ✅ Punch Clock page
- ✅ Users page (read-only)
- ❌ Cannot access Admin or Reports
- ❌ Cannot manage/delete records

## Sign In Testing

### Test Admin Login
```
1. Go to http://localhost:3000/login.html
2. Username: admin
3. Password: admin123
4. Click "Sign In"
5. Should redirect to /admin ✅
```

### Test Regular User Login
```
1. Go to http://localhost:3000/login.html
2. Username: test (or manager or cheetah)
3. Password: test123 (or manager123 or cheetah123)
4. Click "Sign In"
5. Should redirect to /users ✅
```

## Creating New Users

New users can sign up at: http://localhost:3000/signup.html

**New users will:**
- Be created with role='user' (regular user)
- Have their password securely hashed
- Be able to access Punch Clock and Users page
- NOT have admin access

## If Sign In Fails

### Check These:
1. ✅ Username is typed correctly (case-sensitive)
2. ✅ Password is typed correctly
3. ✅ Server is running on http://localhost:3000
4. ✅ You're at http://localhost:3000/login.html (not localhost:3001)
5. ✅ Check browser console for errors (press F12)

### Common Issues:

**"Invalid username or password"**
- Username doesn't exist
- Password is wrong
- Try using credentials from table above

**"Account is disabled"**
- User's IsActive = false
- Contact admin to reactivate

**401 or 403 errors**
- Session issues
- Try clearing browser cookies
- Try incognito/private window

## Helper Scripts

### Test if a user can sign in
```bash
npm run test-signin <username> <password>

# Example:
npm run test-signin admin admin123
npm run test-signin test test123
```

### Reset all user passwords
```bash
npm run reset-all-passwords
```

This will reset all passwords to: `{username}123`
- admin → admin123
- test → test123
- manager → manager123
- etc.

### Reset only admin password
```bash
npm run reset-admin-password
```

Resets admin password to `admin123`

## Password Pattern

For development/testing, passwords follow this pattern:
- **Username:** test → **Password:** test123
- **Username:** admin → **Password:** admin123
- **Username:** manager → **Password:** manager123

**Pattern:** `{username}123`

## Security Notes

⚠️ **These are development passwords!**

**For Production:**
1. Change all default passwords
2. Enforce strong password policies
3. Add password reset functionality
4. Consider two-factor authentication
5. Add email verification

## Troubleshooting

### Sign in works for admin but not other users
**Solution:** Run `npm run reset-all-passwords`

### Sign in doesn't work for anyone
**Check:**
1. Is server running? (`npm start`)
2. Is it on port 3000? (check server console)
3. Are you going to the right URL? (localhost:3000/login.html)
4. Check browser console for errors

### After resetting passwords, still can't login
**Try:**
1. Clear browser cookies/cache
2. Use incognito/private window
3. Check that Users table has LastLoginDate column
4. Run `npm run fix-users-table`

## Current Status

✅ **All users can now sign in successfully!**

| User | Password | Status |
|------|----------|--------|
| admin | admin123 | ✅ Working |
| manager | manager123 | ✅ Working |
| test | test123 | ✅ Working |
| cheetah | cheetah123 | ✅ Working |

## Testing Completed

✅ Admin login tested - works!  
✅ Regular user login tested - works!  
✅ Password hashing verified  
✅ Session creation verified  
✅ Role-based redirects working  

**You can now login with any of the users listed above!** 🎉

