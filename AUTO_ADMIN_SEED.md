# Automatic Admin User Creation

## Overview
The TimeTrack server now automatically creates the default admin user when it starts, if no admin user exists in the database.

## How It Works

### On Server Startup
1. Server checks if the Users table exists
2. If table exists, checks if any admin user exists
3. If no admin exists, creates default admin user with:
   - Username: `admin`
   - Email: `admin@timetrack.com`
   - Password: `admin123` (bcrypt hashed)
   - Role: `admin`

### What You See in Console

**When Admin User is Created:**
```
Creating default admin user...
✓ Default admin user created successfully!
  Username: admin
  Password: admin123
  ⚠️  Please change this password after first login!
```

**When Admin Already Exists:**
```
✓ Admin user already exists.
```

**When Users Table Doesn't Exist:**
```
⚠️  Users table does not exist. Please run database/users-schema.sql
```

## Manual Admin Creation

If you need to manually create the admin user, you can run:

```bash
npm run seed-admin
```

This will:
- Check if admin user exists
- Create one if it doesn't
- Skip if one already exists

## Security Notes

### Default Password
The default password `admin123` is:
- ✅ Automatically hashed with bcrypt (10 rounds)
- ⚠️ Should be changed immediately after first login
- ⚠️ Only created if no admin exists

### Password Hash
The password is hashed at runtime using bcrypt, not stored as a hardcoded hash. This means:
- Each installation gets a unique hash
- More secure than hardcoded hashes
- Requires bcrypt package to be installed

## Behavior Details

### First Time Setup
1. Create Users table with `database/users-schema.sql`
2. Start server with `npm start`
3. Server automatically creates admin user
4. Login at `http://localhost:3000/login.html`

### Subsequent Startups
1. Server checks for admin user
2. Finds existing admin
3. Skips creation
4. Server starts normally

### After Deleting Admin
If you delete or deactivate the admin user:
1. Restart the server
2. A new admin user will be created
3. You can login with default credentials again

## Integration with Seeding

The admin user creation is integrated into the main `seedDatabase()` function:

```javascript
async function seedDatabase() {
    // First, ensure admin user exists
    await seedAdminUser();
    
    // Then seed other data if database is empty
    // ... (rest of seeding logic)
}
```

This ensures:
1. Admin user is always created/checked first
2. Works independently of other seeding
3. Won't interfere with existing data

## Files Modified

### `seed.js`
- Added `seedAdminUser()` function
- Added bcrypt import
- Integrated into main `seedDatabase()` flow
- Exported `seedAdminUser` for manual use

### `package.json`
- Added `seed-admin` script for manual admin creation

### `database/users-schema.sql`
- Removed hardcoded admin INSERT
- Updated to just create table structure
- Admin now created by server on startup

## Error Handling

### Duplicate Admin
If somehow a duplicate admin is attempted:
```
✓ Admin user already exists.
```
(Caught by unique constraint on Username)

### Missing Users Table
If Users table doesn't exist:
```
⚠️  Users table does not exist. Please run database/users-schema.sql
```
Server continues running but authentication won't work.

### Database Connection Error
If database is unreachable:
```
Error seeding admin user: [connection error message]
```
Server continues but you won't be able to login.

## Benefits

### For Development
- ✅ One less setup step
- ✅ Fresh install is ready immediately
- ✅ No need to manually run SQL for admin user
- ✅ Consistent across all installations

### For Production
- ✅ Automatic recovery if admin deleted
- ✅ Can't forget to create admin user
- ✅ Unique password hash per installation
- ✅ Still requires password change after first login

## Troubleshooting

### "Admin user not created"
**Check:**
1. Did you create the Users table? (Run users-schema.sql)
2. Is the database connection working?
3. Check server console for error messages

### "Can't login with admin/admin123"
**Possible reasons:**
1. Admin was created before this feature (old password hash)
2. Password was already changed
3. Admin user was modified/deleted

**Solution:**
Delete the admin user and restart the server, or manually reset the password.

### "Want to change default credentials"
**Edit `seed.js`:**
```javascript
// In seedAdminUser() function
.input('username', sql.NVarChar, 'yourusername')
.input('email', sql.NVarChar, 'your@email.com')
const passwordHash = await bcrypt.hash('yourpassword', 10);
```

## Summary

✅ Admin user automatically created on server start
✅ Only created if no admin exists
✅ Password is bcrypt hashed at runtime
✅ Works independently of other seeding
✅ Can be manually triggered with `npm run seed-admin`
✅ Graceful error handling
✅ Console messages keep you informed

No more manual admin user creation needed! Just create the Users table and start the server.

