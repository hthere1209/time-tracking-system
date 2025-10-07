# Database Seeding Guide

## Automatic Seeding

The TimeTrack system will **automatically seed sample data** when you start the server if the database is empty.

### What Gets Seeded

When the server starts and detects an empty database, it will automatically add:

**Office Locations (3)**
- Downtown Office
- North Branch  
- South Branch

**Staff Members (5)**
- John Smith - Downtown Office - $35/hr cost rate
- Sarah Johnson - Downtown Office - $42/hr cost rate
- Mike Williams - North Branch - $38/hr cost rate
- Emily Davis - North Branch - $45/hr cost rate
- Robert Brown - South Branch - $40/hr cost rate

**Clients (5)**
- ABC Corporation - $95/hr billing rate
- XYZ Industries - $110/hr billing rate
- Global Services Ltd - $125/hr billing rate
- Tech Solutions Inc - $100/hr billing rate
- Premier Consulting - $115/hr billing rate

**Sample Time Entries (7)**
- Various completed time entries from the past 5 days
- Mix of different staff working for different clients
- All entries are completed (punched out)

### How It Works

1. **Automatic on Server Start**
   ```bash
   npm start
   ```
   - Server checks if database has any data
   - If empty, automatically seeds sample data
   - If data exists, skips seeding

2. **Manual Seeding (if needed)**
   ```bash
   npm run seed
   ```
   - Manually trigger the seed process
   - Useful if you cleared the database
   - Won't duplicate if data already exists

### Console Output

When seeding runs successfully, you'll see:

```
Checking database for existing data...
Database is empty. Seeding sample data...
  → Adding office locations...
  → Adding staff members...
  → Adding clients...
  → Adding sample time entries...
✓ Sample data seeded successfully!
  • 3 Office Locations
  • 5 Staff Members
  • 5 Clients
  • 7 Sample Time Entries

You can now:
  1. View staff/clients at http://localhost:3000/admin
  2. Punch in/out at http://localhost:3000
  3. Generate reports at http://localhost:3000/reports
```

If data already exists:
```
Checking database for existing data...
✓ Database already has data. Skipping seed.
```

### Smart Detection

The seed script checks for existing data before running:
- Counts records in OfficeLocations, Staff, and Clients tables
- Only seeds if ALL three tables are empty
- Prevents duplicate data
- Safe to run multiple times

## Testing the System

After seeding completes, you can immediately:

1. **Go to Admin Dashboard** (http://localhost:3000/admin)
   - View all 5 staff members with their cost rates
   - View all 5 clients with their billing rates
   - See today's time entries

2. **Try Punching In** (http://localhost:3000)
   - Select "John Smith" from staff dropdown
   - Select "ABC Corporation" as client
   - Select "Downtown Office" as location
   - Click "Punch In"
   - Wait a minute
   - Click "Punch Out"

3. **Generate Reports** (http://localhost:3000/reports)
   - Select "Staff Work Report"
   - Set date range to last 7 days
   - Click "Generate Report"
   - See sample data in the report
   - Try "Export CSV"

## Clearing Data

If you want to clear all data and re-seed:

### Option 1: Delete All Records (Keep Structure)
```sql
-- Run in SQL Server Management Studio
USE TimeTrackDB;
GO

DELETE FROM TimeEntries;
DELETE FROM Staff;
DELETE FROM Clients;
DELETE FROM OfficeLocations;
GO
```

Then restart your server to automatically re-seed.

### Option 2: Reset Identity Columns
```sql
-- Run in SQL Server Management Studio
USE TimeTrackDB;
GO

DELETE FROM TimeEntries;
DELETE FROM Staff;
DELETE FROM Clients;
DELETE FROM OfficeLocations;
GO

DBCC CHECKIDENT ('TimeEntries', RESEED, 0);
DBCC CHECKIDENT ('Staff', RESEED, 0);
DBCC CHECKIDENT ('Clients', RESEED, 0);
DBCC CHECKIDENT ('OfficeLocations', RESEED, 0);
GO
```

This resets the ID counters to start from 1 again.

### Option 3: Complete Database Reset
```sql
-- Run in SQL Server Management Studio
-- WARNING: This deletes everything including structure!

DROP DATABASE TimeTrackDB;
GO
```

Then re-run the database setup scripts:
1. `database/schema.sql`
2. `database/reports.sql`
3. Restart server (will auto-seed)

## Customizing Sample Data

To customize the sample data, edit `seed.js`:

### Change Office Locations
```javascript
// Around line 30
await pool.request().query(`
    INSERT INTO OfficeLocations (LocationName, Address) VALUES
    ('Your Office Name', 'Your Address'),
    ('Another Office', 'Another Address')
`);
```

### Change Staff Members
```javascript
// Around line 36
await pool.request().query(`
    INSERT INTO Staff (StaffName, OfficeLocationID, CostRate, Email) VALUES
    ('Your Name', 1, 40.00, 'your.email@company.com'),
    ('Another Person', 1, 45.00, 'another@company.com')
`);
```

### Change Clients
```javascript
// Around line 46
await pool.request().query(`
    INSERT INTO Clients (ClientName, BillingRate, ContactPerson, Email, Phone) VALUES
    ('Your Client', 100.00, 'Contact Name', 'contact@client.com', '555-1234')
`);
```

## Production Use

For production deployment:

### Option 1: Disable Auto-Seeding
Comment out the seed call in `server.js`:

```javascript
// // Automatically seed database with sample data if empty
// try {
//     await seedDatabase();
// } catch (err) {
//     console.error('⚠ Failed to seed database:', err.message);
// }
```

### Option 2: Environment Variable Control
Add to your `.env` file:
```env
AUTO_SEED=false
```

Then modify `server.js`:
```javascript
if (process.env.AUTO_SEED !== 'false') {
    try {
        await seedDatabase();
    } catch (err) {
        console.error('⚠ Failed to seed database:', err.message);
    }
}
```

### Option 3: Seed Once, Then Remove
1. Start server once to seed
2. Verify data in Admin Dashboard
3. Stop server
4. Remove seed call from `server.js`
5. Restart for production

## Troubleshooting

### "Error seeding database: Login failed"
- Check your `.env` file database credentials
- Verify SQL Server is running
- Test connection with SQL Server Management Studio

### "Error seeding database: Invalid object name"
- Database schema not created yet
- Run `database/schema.sql` first
- Then run `database/reports.sql`
- Then restart server

### Seed runs but data doesn't appear
- Check database in SQL Server Management Studio
- Run: `SELECT * FROM Staff`
- Verify you're connected to correct database
- Check server console for errors

### "Database already has data" but I want to re-seed
- Clear the data using SQL queries above
- Or manually delete records in Admin Dashboard
- Then restart server

## Files Involved

- **seed.js** - The seeding logic
- **server.js** - Calls seed on startup
- **package.json** - Contains `npm run seed` script

## Summary

✅ **Automatic** - Seeds on server start if database is empty
✅ **Safe** - Won't duplicate data  
✅ **Smart** - Detects existing data
✅ **Manual** - Can trigger with `npm run seed`
✅ **Customizable** - Edit `seed.js` for your data
✅ **Production-ready** - Easy to disable for production

No more empty database errors! 🎉

