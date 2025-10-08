# Automatic Database Setup

## Overview

The TimeTrack system now includes **automatic database initialization**. You no longer need to manually run SQL scripts to set up the database!

## How It Works

When you start the server with `node server.js` or `npm start`, the system will automatically:

1. **Create the Database** (if it doesn't exist)
   - Connects to the SQL Server master database
   - Creates `TimeTrackDB` if it's not already present

2. **Create All Tables** (if they don't exist)
   - OfficeLocations
   - Staff
   - Clients
   - TimeEntries
   - Users

3. **Create Indexes** for better performance

4. **Seed Admin User** (if no admin exists)
   - Username: `admin`
   - Password: `admin123`
   - Email: `admin@timetrack.com`

5. **Seed Sample Data** (if tables are empty)
   - 3 Office Locations
   - 5 Staff Members
   - 5 Clients
   - 7 Sample Time Entries

## What This Means For You

### First-Time Setup

1. Make sure SQL Server is running
2. Configure your `.env` file with database credentials:
   ```env
   DB_SERVER=localhost
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=TimeTrackDB
   DB_PORT=1433
   DB_ENCRYPT=false
   DB_TRUST_SERVER_CERTIFICATE=true
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. The system will automatically:
   - Create the database
   - Create all tables
   - Add the admin user
   - Add sample data

5. Done! You can now login at `http://localhost:3000/login.html`

### Subsequent Starts

On subsequent starts, the system will:
- ✓ Check if database exists (skip if exists)
- ✓ Check if tables exist (skip if exist)
- ✓ Check if admin exists (skip if exists)
- ✓ Check if data exists (skip seeding if exists)

This means it's **safe to restart the server** - it won't duplicate data or recreate existing structures.

## Manual Setup (Optional)

If you prefer to manually set up the database, you can still run the SQL scripts:

```bash
# Create the database and core tables
sqlcmd -S localhost -U your_username -P your_password -i database/schema.sql

# Create the Users table
sqlcmd -S localhost -U your_username -P your_password -i database/users-schema.sql
```

However, with the automatic setup, **this is no longer necessary**!

## Troubleshooting

### "Cannot create database"

**Problem:** Your SQL Server user doesn't have permission to create databases.

**Solution:** Either:
1. Grant the user database creation permissions
2. Manually create `TimeTrackDB` first:
   ```sql
   CREATE DATABASE TimeTrackDB;
   ```

### "Cannot create tables"

**Problem:** Your SQL Server user doesn't have permission to create tables.

**Solution:** Ensure your user has `db_owner` or appropriate permissions on `TimeTrackDB`.

### "Connection failed"

**Problem:** SQL Server isn't running or connection details are incorrect.

**Solution:**
1. Verify SQL Server is running
2. Check your `.env` file credentials
3. Test connection with:
   ```bash
   sqlcmd -S localhost -U your_username -P your_password
   ```

## Files Modified

- `config/database.js` - Added automatic database creation
- `seed.js` - Added automatic table creation and improved seeding logic
- `server.js` - Automatically calls seeding on startup

## Benefits

✅ **Zero Manual Setup** - Just configure and run  
✅ **Idempotent** - Safe to run multiple times  
✅ **Fast Development** - Get started in seconds  
✅ **Production Ready** - Won't overwrite existing data  
✅ **Error Resilient** - Handles missing structures gracefully

## Security Note

⚠️ **Important:** The default admin password is `admin123`. Please change this immediately after first login!

You can change it through the admin interface or by updating the Users table directly:

```sql
UPDATE Users SET PasswordHash = 'new_bcrypt_hash' WHERE Username = 'admin';
```

---

**Happy Time Tracking! ⏱️**

