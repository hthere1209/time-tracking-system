# TimeTrack - Quick Start Guide

Get TimeTrack running in 10 minutes!

## Prerequisites Checklist
- [ ] SQL Server installed
- [ ] Node.js installed
- [ ] TimeTrack files extracted

## Quick Installation

### 1. Create Database (2 minutes)
```sql
-- Open SQL Server Management Studio
-- Run these files in order:
1. database/schema.sql
2. database/reports.sql
3. database/sample_data.sql (optional)
```

### 2. Install Dependencies (1 minute)
```bash
cd D:\timetrack
npm install
```

### 3. Configure Environment (1 minute)
Create a file named `.env` with this content:
```env
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=TimeTrackDB
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
PORT=3000
NODE_ENV=development
```

**Using Windows Authentication?** Leave DB_USER and DB_PASSWORD empty.

### 4. Start the Server (30 seconds)
```bash
npm start
```

### 5. Open Your Browser (30 seconds)
Go to: http://localhost:3000

## What to Do First

### Add Your Data
1. Go to **Admin Dashboard**: http://localhost:3000/admin
2. Click "➕ Add Office" - add your office locations
3. Click "➕ Add Client" - add your clients with billing rates
4. Click "➕ Add Staff" - add your staff with cost rates

### Try Punching In
1. Go to **Main Interface**: http://localhost:3000
2. Select a staff member
3. Select a client
4. Select an office
5. Click "Punch In"
6. Wait a minute
7. Click "Punch Out"

### Generate a Report
1. Go to **Reports**: http://localhost:3000/reports
2. Select "Staff Work Report"
3. Choose date range
4. Click "Generate Report"
5. Click "📥 Export CSV"

## Common Issues

**Can't connect to database?**
- Check SQL Server is running
- Verify DB_SERVER name (might need `\SQLEXPRESS`)
- Try Windows Authentication (empty username/password)

**Port 3000 in use?**
- Change PORT to 3001 in .env file

**No data in reports?**
- Make sure you've punched out (not just punched in)
- Check your date range includes the work date

## Next Steps

1. Read SETUP.md for production deployment
2. Read README.md for full documentation
3. Configure as Windows service (see SETUP.md)
4. Set up network access (see SETUP.md)

## Support

- Full setup guide: `SETUP.md`
- Complete documentation: `README.md`
- Database schema: `database/schema.sql`

That's it! You're ready to start tracking time!

