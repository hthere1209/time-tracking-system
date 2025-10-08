# Database Auto-Initialization Fix

## Issue Fixed
**Problem:** "Invalid object name 'Users'" error when starting the server with an empty database.

**Root Cause:** The system was trying to seed the admin user before verifying that tables were successfully created.

## Changes Made

### 1. Enhanced Table Creation (`seed.js`)
- Added database name verification to confirm connection context
- All CREATE TABLE statements now explicitly use `dbo` schema prefix
- Added return value to track successful table creation
- Better logging to show which database and tables are being processed

### 2. Improved Initialization Flow (`seed.js`)
```
seedDatabase()
  ↓
createTablesIfNotExist()
  ↓
Verify Users table exists
  ↓
seedAdminUser()
  ↓
Seed sample data
```

### 3. Better Error Handling
- Added explicit verification that Users table exists before attempting to seed admin user
- Clear error messages if table creation fails
- Prevents cascading errors

## How to Test

1. **Drop the database** (if it exists):
   ```sql
   USE master;
   DROP DATABASE TimeTrackDB;
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Expected Output**:
   ```
   === Initializing Database ===
   Checking database tables in: TimeTrackDB
   ⚠️  Missing tables: OfficeLocations, Staff, Clients, TimeEntries, Users
   🔧 Creating missing tables...
     → Creating OfficeLocations table...
     → Creating Staff table...
     → Creating Clients table...
     → Creating TimeEntries table...
     → Creating Users table...
   ✓ All required tables created successfully!
   
   Creating default admin user...
   ✓ Default admin user created successfully!
     Username: admin
     Password: admin123
   ```

4. **Verify Login**:
   - Navigate to `http://localhost:3000/login.html`
   - Login with:
     - Username: `admin`
     - Password: `admin123`

## Troubleshooting

### Still Getting "Invalid object name" Error

**Check 1: Database Connection**
```bash
# Check your .env file has correct values:
DB_SERVER=localhost
DB_DATABASE=TimeTrackDB
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=1433
```

**Check 2: SQL Server User Permissions**
Your SQL Server user needs permissions to:
- Create databases
- Create tables
- Create indexes

To grant permissions:
```sql
-- Grant database creation
ALTER SERVER ROLE dbcreator ADD MEMBER [your_username];

-- Or create database manually and grant table creation
CREATE DATABASE TimeTrackDB;
GO
USE TimeTrackDB;
GO
EXEC sp_addrolemember 'db_owner', 'your_username';
GO
```

**Check 3: Look at Console Output**
The first line after "Initializing Database" should show:
```
Checking database tables in: TimeTrackDB
```

If it shows a different database name, your connection config is wrong.

### Tables Not Created

**Symptom:** Server starts but tables are missing

**Solution:** Check the console output for specific error messages. Common issues:
- Insufficient permissions
- Connection to wrong database
- Network/firewall issues

### Admin User Not Created

**Symptom:** Tables exist but can't login

**Solution:** 
1. Check if Users table has data:
   ```sql
   SELECT * FROM TimeTrackDB.dbo.Users;
   ```

2. If empty, manually run seed:
   ```bash
   node -e "require('./seed').seedAdminUser()"
   ```

## Technical Details

### Schema Prefix
All tables now use explicit `dbo` schema:
- `CREATE TABLE dbo.Users (...)`
- `CREATE TABLE dbo.Staff (...)`
- etc.

This ensures tables are created in the default schema regardless of user settings.

### Foreign Keys
TimeEntries table foreign keys now reference fully qualified table names:
- `FOREIGN KEY (StaffID) REFERENCES dbo.Staff(StaffID)`
- `FOREIGN KEY (ClientID) REFERENCES dbo.Clients(ClientID)`
- `FOREIGN KEY (LocationID) REFERENCES dbo.OfficeLocations(OfficeLocationID)`

### Verification Step
After table creation, the system explicitly verifies the Users table exists:
```sql
SELECT COUNT(*) AS TableExists
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME = 'Users' AND TABLE_SCHEMA = 'dbo'
```

This prevents attempting to insert data into non-existent tables.

## Files Modified

1. **seed.js**
   - `createTablesIfNotExist()` - Enhanced with schema prefix and verification
   - `seedAdminUser()` - Simplified to rely on prior table existence check
   - `seedDatabase()` - Added explicit verification step

2. **config/database.js**
   - `ensureDatabaseExists()` - Creates database if missing
   - `getConnection()` - Calls database creation before connecting

## Next Steps

✅ Test with fresh database  
✅ Verify admin login works  
✅ Test with existing database (should skip creation)  
✅ Document any remaining issues  

---

**Status:** Fixed and tested
**Date:** 2025-10-08

