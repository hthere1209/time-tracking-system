# TimeTrack Project Structure

## Directory Layout

```
D:\timetrack\
│
├── database/                    # SQL Server scripts
│   ├── schema.sql              # Database tables and views
│   ├── reports.sql             # Stored procedures for reports
│   └── sample_data.sql         # Sample data for testing
│
├── config/                      # Application configuration
│   └── database.js             # Database connection setup
│
├── routes/                      # API endpoints (REST API)
│   ├── staff.js                # Staff CRUD operations
│   ├── clients.js              # Client CRUD operations
│   ├── offices.js              # Office location CRUD
│   ├── timeEntries.js          # Punch in/out & time entry management
│   └── reports.js              # Report generation endpoints
│
├── public/                      # Frontend web interface
│   ├── css/
│   │   └── styles.css          # Application styling
│   ├── index.html              # Main punch clock interface
│   ├── admin.html              # Admin dashboard
│   └── reports.html            # Reports interface
│
├── node_modules/                # Node.js dependencies (auto-generated)
│
├── server.js                    # Main application entry point
├── package.json                 # Node.js project configuration
├── package-lock.json            # Dependency lock file
│
├── .env                         # Environment configuration (YOU CREATE THIS)
├── ENV_TEMPLATE.txt             # Template for .env file
├── .gitignore                   # Git ignore rules
│
├── README.md                    # Complete documentation
├── SETUP.md                     # Detailed setup instructions
├── QUICKSTART.md                # Quick start guide
└── PROJECT_STRUCTURE.md         # This file

```

## File Descriptions

### Database Files (`database/`)

**schema.sql**
- Creates the TimeTrackDB database
- Defines 4 main tables: OfficeLocations, Staff, Clients, TimeEntries
- Creates indexes for performance
- Creates views for common queries

**reports.sql**
- Stored procedure: `sp_StaffWorkReport` - Staff work analysis
- Stored procedure: `sp_ClientBillingReport` - Detailed client billing
- Stored procedure: `sp_ClientBillingSummary` - Client summary totals
- Stored procedure: `sp_DateRangeHours` - Simple hours breakdown

**sample_data.sql**
- Sample office locations
- Sample staff members
- Sample clients
- Sample time entries for testing

### Backend Files

**server.js**
- Main application entry point
- Configures Express web server
- Sets up routes and middleware
- Serves static files from public/

**config/database.js**
- SQL Server connection configuration
- Connection pool management
- Database helper functions

**routes/staff.js**
- `GET /api/staff` - List all staff
- `GET /api/staff/:id` - Get staff details (includes cost rate)
- `POST /api/staff` - Create new staff
- `PUT /api/staff/:id` - Update staff
- `GET /api/staff/:id/punch-status` - Check if punched in

**routes/clients.js**
- `GET /api/clients` - List all clients
- `GET /api/clients/:id` - Get client details (includes billing rate)
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client

**routes/offices.js**
- `GET /api/offices` - List all offices
- `GET /api/offices/:id` - Get office details
- `POST /api/offices` - Create new office
- `PUT /api/offices/:id` - Update office

**routes/timeEntries.js**
- `GET /api/time-entries` - List time entries with filters
- `GET /api/time-entries/today` - Today's entries
- `GET /api/time-entries/punched-in` - Currently punched in
- `POST /api/time-entries/punch-in` - Punch in
- `POST /api/time-entries/punch-out` - Punch out
- `PUT /api/time-entries/:id` - Update entry
- `DELETE /api/time-entries/:id` - Delete entry

**routes/reports.js**
- `GET /api/reports/staff-work` - Staff work report
- `GET /api/reports/client-billing` - Client billing report
- `GET /api/reports/client-billing-summary` - Client summary
- `GET /api/reports/date-range-hours` - Date range hours
- `GET /api/reports/dashboard-stats` - Dashboard statistics

### Frontend Files (`public/`)

**index.html** - Main Punch Clock Interface
- Staff selection dropdown
- Client and office selection
- Punch in/out button
- Real-time hours display when punched in
- List of currently punched in staff
- Auto-refresh every 30 seconds

**admin.html** - Admin Dashboard
- Dashboard statistics (today, week, month)
- Today's time entries table
- Add staff/client/office forms
- View all staff with cost rates
- View all clients with billing rates
- Real-time updates

**reports.html** - Reports Interface
- Report type selection
- Date range filters
- Staff/client filters
- Four report types:
  * Staff Work Report
  * Client Billing Report (Detailed)
  * Client Billing Summary
  * Date Range Hours Report
- CSV export functionality
- Calculated totals

**css/styles.css**
- Modern, clean design
- Responsive layout (mobile-friendly)
- Color scheme and branding
- Reusable components (buttons, cards, tables)
- Print-friendly report styles

### Configuration Files

**package.json**
- Node.js project metadata
- Dependencies: express, mssql, dotenv, cors, body-parser
- Scripts: `npm start`, `npm run dev`

**.env** (You create this)
- Database credentials
- Server port
- Environment settings
- NOT included in Git (security)

**.gitignore**
- Excludes node_modules/
- Excludes .env
- Excludes logs and temporary files

## Data Flow

### Punch In Flow
```
1. User selects staff, client, office → index.html
2. JavaScript sends POST to /api/time-entries/punch-in → routes/timeEntries.js
3. API validates (no duplicate punch-in) → routes/timeEntries.js
4. Insert new TimeEntry record → database
5. Return success → frontend
6. Update UI to show "Punched In" status → index.html
```

### Punch Out Flow
```
1. User clicks "Punch Out" → index.html
2. JavaScript sends POST to /api/time-entries/punch-out → routes/timeEntries.js
3. API finds active punch-in record → routes/timeEntries.js
4. Update TimeEntry with TimeFinished → database
5. Calculate total hours → database (computed column)
6. Return success → frontend
7. Reset form → index.html
```

### Report Generation Flow
```
1. User selects report type and dates → reports.html
2. JavaScript sends GET to /api/reports/* → routes/reports.js
3. API calls stored procedure → database
4. Stored procedure calculates:
   - Hours worked
   - Costs (hours × cost rate)
   - Revenue (hours × billing rate)
   - Profit (revenue - cost)
5. Return data → frontend
6. Display in formatted table → reports.html
7. User can export to CSV → reports.html
```

## Database Schema Overview

### OfficeLocations
- Primary key: OfficeLocationID
- Used by: Staff, TimeEntries

### Staff
- Primary key: StaffID
- References: OfficeLocationID
- Hidden field: CostRate ($/hour)
- Used by: TimeEntries

### Clients
- Primary key: ClientID
- Hidden field: BillingRate ($/hour)
- Used by: TimeEntries

### TimeEntries
- Primary key: TimeEntryID
- References: StaffID, ClientID, OfficeLocationID
- Tracks: WorkDate, TimeStarted, TimeFinished
- Status: IsPunchedIn (1 = active, 0 = completed)
- Computed: TotalHours (auto-calculated)

## Key Features Implementation

### Duplicate Punch Prevention
- Before punch-in: Query checks if staff has IsPunchedIn = 1
- If yes: Reject with error message
- If no: Allow punch-in

### Hidden Fields
- Cost rates and billing rates stored in database
- Not visible in main punch interface
- Only shown in admin views (staff.js, clients.js endpoints)
- Used in report calculations

### Real-time Updates
- Frontend uses setInterval() to refresh every 30 seconds
- Dashboard shows live "currently punched in" count
- Hours update automatically while punched in

### Report Calculations
All done in SQL for accuracy and performance:
- Hours = DATEDIFF(minutes) / 60.0
- Cost = Hours × Staff.CostRate
- Revenue = Hours × Client.BillingRate
- Profit = Revenue - Cost

## Customization Points

### To Add a New Field
1. Add column to database table (schema.sql)
2. Update API endpoint (routes/*.js)
3. Update frontend form (public/*.html)

### To Add a New Report
1. Create stored procedure (database/reports.sql)
2. Add API endpoint (routes/reports.js)
3. Add report UI (public/reports.html)

### To Change Styling
1. Edit CSS variables in public/css/styles.css
2. Modify color scheme in :root section
3. Adjust layout and spacing

### To Add Authentication
1. Install passport.js or similar
2. Add user table to database
3. Wrap routes with authentication middleware
4. Add login page

## Dependencies

### Backend (Node.js)
- **express**: Web server framework
- **mssql**: SQL Server database driver
- **dotenv**: Environment variable management
- **cors**: Cross-origin resource sharing
- **body-parser**: Request body parsing

### Frontend
- **No frameworks**: Pure HTML/CSS/JavaScript
- **No build step**: Runs directly in browser
- **Modern browsers**: Chrome, Firefox, Edge, Safari

## Performance Considerations

- Database indexes on commonly queried fields
- Connection pooling for database efficiency
- Computed columns for real-time hour calculations
- Stored procedures for complex report queries
- Client-side caching of dropdown data

## Security Notes

- SQL injection protected (parameterized queries)
- CORS configured for internal network
- No passwords stored in frontend
- Hidden fields not exposed to regular interface
- Environment variables for sensitive data

## Maintenance

### Regular Tasks
- **Database**: Backup weekly, archive old data yearly
- **Application**: Check logs, monitor disk space
- **Updates**: Update Node.js dependencies periodically

### Backup Commands
```sql
-- Backup database
BACKUP DATABASE TimeTrackDB TO DISK = 'C:\Backups\TimeTrackDB.bak';

-- Archive old entries (example)
SELECT * INTO TimeEntries_Archive_2024
FROM TimeEntries WHERE YEAR(WorkDate) = 2024;
```

## Support Resources

- **README.md**: Full feature documentation
- **SETUP.md**: Installation guide
- **QUICKSTART.md**: Quick start in 10 minutes
- **This file**: Project structure reference

