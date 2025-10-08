# TimeTrack - Time Tracking System

A comprehensive time tracking system with Microsoft SQL Server backend and modern web interface for managing staff time entries, clients, and generating detailed reports.

## 🐳 Quick Start with Docker (Recommended)

The easiest way to run this application on any PC is using Docker. No need to install SQL Server or configure databases manually!

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed on your system

### Run with Docker

1. **Clone or copy the project to your PC**

2. **Start the application:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application at:** http://localhost:3000

That's it! The application and database are now running. The database will be automatically created and seeded with sample data.

**Default Login:**
- Username: `admin`
- Password: `admin123`

For detailed Docker instructions, see [DOCKER_SETUP.md](DOCKER_SETUP.md)

---

## Features

### Core Functionality
- **Punch In/Out System**: Simple interface for staff to clock in and out
- **Real-time Tracking**: See who's currently working and how long they've been punched in
- **Duplicate Prevention**: System prevents staff from punching in twice
- **Client & Staff Management**: Full CRUD operations for staff, clients, and office locations

### Reporting
- **Staff Work Report**: Detailed breakdown of staff hours by client with cost and revenue analysis
- **Client Billing Report**: Itemized services by client with billable amounts and profit margins
- **Client Billing Summary**: High-level summary of client billing totals
- **Date Range Hours Report**: Hours worked by each employee per customer
- **Dashboard Statistics**: Real-time overview of today's activity and monthly metrics

### Hidden Fields (Admin Only)
- Staff cost rates (stored in database, not visible to regular staff)
- Client billing rates (used for revenue calculations)

## Technology Stack

- **Database**: Microsoft SQL Server
- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript with modern HTML5/CSS3
- **Database Driver**: mssql (node-mssql)

## Prerequisites

- Node.js (v14 or higher)
- Microsoft SQL Server (2016 or higher)
- SQL Server Management Studio (optional, for database management)

## Installation & Setup

### 1. Database Setup

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Execute the following SQL scripts in order:
   ```
   database/schema.sql        # Creates database and tables
   database/reports.sql       # Creates stored procedures for reports
   database/sample_data.sql   # (Optional) Loads sample data
   ```

### 2. Application Setup

1. Clone or extract the project files to your desired location

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory (copy from `env.example`):
   ```bash
   # Windows
   copy env.example .env
   
   # Linux/Mac
   cp env.example .env
   ```

4. Edit the `.env` file with your database credentials:
   ```env
   DB_SERVER=localhost
   DB_DATABASE=TimeTrackDB
   DB_USER=your_username
   DB_PASSWORD=your_password
   DB_PORT=1433
   DB_ENCRYPT=true
   DB_TRUST_SERVER_CERTIFICATE=true
   
   PORT=3000
   NODE_ENV=development
   ```

### 3. Start the Application

**Development mode** (with auto-restart):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

The application will be available at:
- Main Interface: http://localhost:3000
- Admin Dashboard: http://localhost:3000/admin
- Reports: http://localhost:3000/reports

## Database Schema

### Tables

**OfficeLocations**
- Office locations where staff work
- Fields: OfficeLocationID, LocationName, Address, IsActive

**Staff**
- Staff member profiles
- Fields: StaffID, StaffName, OfficeLocationID, CostRate (hidden), Email, IsActive

**Clients**
- Client information
- Fields: ClientID, ClientName, BillingRate (hidden), ContactPerson, Email, Phone, IsActive

**TimeEntries**
- Punch in/out records
- Fields: TimeEntryID, StaffID, ClientID, OfficeLocationID, WorkDate, TimeStarted, TimeFinished, WorkDescription, IsPunchedIn

### Stored Procedures

- `sp_StaffWorkReport` - Staff work report with costs and revenue
- `sp_ClientBillingReport` - Detailed client billing report
- `sp_ClientBillingSummary` - Client billing summary totals
- `sp_DateRangeHours` - Hours per employee per customer

## Usage Guide

### For Staff (Main Interface)

1. Navigate to http://localhost:3000
2. Select your name from the staff dropdown
3. If not punched in:
   - Select client you're working for
   - Select your office location
   - Add work description (optional)
   - Click "Punch In"
4. If already punched in:
   - Update work description if needed
   - Click "Punch Out" when finished

### For Administrators (Admin Dashboard)

1. Navigate to http://localhost:3000/admin
2. View dashboard statistics and today's activity
3. Add new staff members, clients, or office locations using the Quick Management buttons
4. View complete lists of all staff and clients with their rates
5. Monitor real-time punch status and today's time entries

### For Managers (Reports)

1. Navigate to http://localhost:3000/reports
2. Select report type:
   - **Staff Work Report**: See what each staff member worked on, hours, costs, and revenue
   - **Client Billing Report**: Detailed line items for client invoicing
   - **Client Billing Summary**: Quick totals by client
   - **Date Range Hours**: Simple hours breakdown by employee and customer
3. Select date range
4. Add filters (optional - specific staff or client)
5. Click "Generate Report"
6. Export to CSV for further analysis

## API Endpoints

### Staff
- `GET /api/staff` - List all active staff
- `GET /api/staff/:id` - Get staff details (includes cost rate)
- `POST /api/staff` - Create new staff member
- `PUT /api/staff/:id` - Update staff member
- `GET /api/staff/:id/punch-status` - Check if staff is punched in

### Clients
- `GET /api/clients` - List all active clients
- `GET /api/clients/:id` - Get client details (includes billing rate)
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client

### Office Locations
- `GET /api/offices` - List all active offices
- `GET /api/offices/:id` - Get office details
- `POST /api/offices` - Create new office
- `PUT /api/offices/:id` - Update office

### Time Entries
- `GET /api/time-entries` - List time entries (with filters)
- `GET /api/time-entries/today` - Get today's entries
- `GET /api/time-entries/punched-in` - Get currently punched in staff
- `POST /api/time-entries/punch-in` - Punch in
- `POST /api/time-entries/punch-out` - Punch out
- `GET /api/time-entries/:id` - Get specific entry
- `PUT /api/time-entries/:id` - Update entry (admin)
- `DELETE /api/time-entries/:id` - Delete entry (admin)

### Reports
- `GET /api/reports/staff-work` - Staff work report
- `GET /api/reports/client-billing` - Client billing report
- `GET /api/reports/client-billing-summary` - Client summary
- `GET /api/reports/date-range-hours` - Date range hours
- `GET /api/reports/dashboard-stats` - Dashboard statistics

## Configuration Options

### Environment Variables

- `DB_SERVER` - SQL Server hostname/IP
- `DB_DATABASE` - Database name (default: TimeTrackDB)
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password
- `DB_PORT` - SQL Server port (default: 1433)
- `DB_ENCRYPT` - Enable encryption (true/false)
- `DB_TRUST_SERVER_CERTIFICATE` - Trust server certificate for development (true/false)
- `PORT` - Web server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Security Considerations

### For Internal Network Deployment

1. **Firewall Configuration**: Ensure port 3000 (or your configured port) is only accessible within your internal network
2. **SQL Server Security**: Use Windows Authentication or strong SQL credentials
3. **HTTPS**: For production, consider setting up HTTPS with SSL certificates
4. **Authentication**: This system currently has no user authentication - add authentication layer if needed for your environment

### Recommended Production Enhancements

- Implement user authentication (e.g., Active Directory integration)
- Add role-based access control (RBAC)
- Enable HTTPS/SSL
- Set up automated backups for the database
- Implement audit logging for sensitive operations
- Add input validation and sanitization

## Backup and Maintenance

### Database Backup

Regular backups recommended using SQL Server backup tools:

```sql
BACKUP DATABASE TimeTrackDB 
TO DISK = 'C:\Backups\TimeTrackDB.bak'
WITH FORMAT, COMPRESSION;
```

### Data Retention

The system keeps all historical time entries. Consider archiving old records periodically:

```sql
-- Example: Archive entries older than 2 years
SELECT * INTO TimeEntries_Archive_2023
FROM TimeEntries
WHERE WorkDate < '2023-01-01';
```

## Troubleshooting

### Cannot connect to database
- Verify SQL Server is running
- Check database credentials in `.env` file
- Ensure SQL Server allows TCP/IP connections
- Verify SQL Server port (usually 1433)
- Check firewall settings

### Punch in/out not working
- Check browser console for errors
- Verify staff member is not already punched in
- Ensure database connection is active
- Check that all required fields are filled

### Reports not generating
- Verify stored procedures were created successfully
- Check that date range contains data
- Ensure database connection is stable
- Check browser console for API errors

## Extending the System

### Adding New Fields

1. Add column to database table
2. Update relevant API endpoint in `/routes/` folder
3. Update frontend forms and displays

### Adding New Reports

1. Create stored procedure in SQL Server
2. Add endpoint in `/routes/reports.js`
3. Add report UI in `/public/reports.html`

### Custom Integrations

The REST API can be integrated with:
- Payroll systems
- Invoicing software
- HR management systems
- Custom business applications

## Support and Maintenance

For a non-technical manager to extend:

1. **Adding Staff/Clients/Offices**: Use the Admin Dashboard interface (no coding required)
2. **Modifying Reports**: Edit SQL stored procedures in `database/reports.sql`
3. **Changing UI**: Edit HTML files in `/public/` folder
4. **Adjusting Business Logic**: Edit route files in `/routes/` folder

## License

This project is provided as-is for internal business use.

## Version History

- **v1.0.0** (2025-10-07) - Initial release
  - Core punch in/out functionality
  - Staff, client, and office management
  - Four standard reports
  - Dashboard statistics
  - CSV export capability

