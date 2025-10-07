# TimeTrack Setup Guide

This guide will walk you through setting up the TimeTrack system from scratch on a Windows server or internal network.

## Step-by-Step Installation

### Step 1: Install Prerequisites

#### Install SQL Server

1. Download SQL Server 2019 Express (free) from Microsoft:
   - https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Run the installer and select "Basic" installation
3. Note the server name (usually: `localhost` or `COMPUTERNAME\SQLEXPRESS`)
4. Install SQL Server Management Studio (SSMS) for easier database management:
   - https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms

#### Install Node.js

1. Download Node.js LTS version from:
   - https://nodejs.org/
2. Run the installer with default options
3. Verify installation by opening Command Prompt and typing:
   ```
   node --version
   npm --version
   ```

### Step 2: Configure SQL Server

1. Open SQL Server Configuration Manager
2. Enable TCP/IP protocol:
   - Expand "SQL Server Network Configuration"
   - Click "Protocols for SQLEXPRESS" (or your instance name)
   - Right-click "TCP/IP" and select "Enable"
   - Restart SQL Server service

3. Create SQL Server login (if not using Windows Authentication):
   - Open SQL Server Management Studio
   - Connect to your server
   - Expand "Security" → "Logins"
   - Right-click "Logins" → "New Login"
   - Create username: `timetrack_user`
   - Select "SQL Server authentication"
   - Set a strong password
   - Uncheck "Enforce password policy" (optional, for testing)
   - Click OK

### Step 3: Create Database

1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Click "New Query"
4. Navigate to the TimeTrack folder and open `database/schema.sql`
5. Click "Execute" (or press F5)
6. Verify the database was created:
   - Refresh "Databases" in Object Explorer
   - You should see "TimeTrackDB"

7. Execute the reports stored procedures:
   - Open and execute `database/reports.sql`

8. (Optional) Load sample data:
   - Open and execute `database/sample_data.sql`

9. Grant permissions to your SQL user:
   ```sql
   USE TimeTrackDB;
   GO
   
   CREATE USER [timetrack_user] FOR LOGIN [timetrack_user];
   GO
   
   ALTER ROLE db_datareader ADD MEMBER [timetrack_user];
   ALTER ROLE db_datawriter ADD MEMBER [timetrack_user];
   GRANT EXECUTE TO [timetrack_user];
   GO
   ```

### Step 4: Configure the Application

1. Extract the TimeTrack files to a permanent location, for example:
   ```
   C:\TimeTrack\
   ```

2. Open Command Prompt as Administrator

3. Navigate to the TimeTrack directory:
   ```
   cd C:\TimeTrack
   ```

4. Install Node.js dependencies:
   ```
   npm install
   ```

5. Create the `.env` file:
   - Copy the `.env.example` file to `.env`
   - Windows Command:
     ```
     copy .env.example .env
     ```

6. Edit the `.env` file with Notepad:
   ```
   notepad .env
   ```

7. Update the configuration:
   ```env
   # For local SQL Server Express
   DB_SERVER=localhost\SQLEXPRESS
   DB_DATABASE=TimeTrackDB
   DB_USER=timetrack_user
   DB_PASSWORD=your_password_here
   DB_PORT=1433
   DB_ENCRYPT=true
   DB_TRUST_SERVER_CERTIFICATE=true
   
   # Web server configuration
   PORT=3000
   NODE_ENV=production
   ```

   **Note**: If using Windows Authentication instead:
   ```env
   DB_SERVER=localhost\SQLEXPRESS
   DB_DATABASE=TimeTrackDB
   # Leave DB_USER and DB_PASSWORD empty for Windows Auth
   DB_USER=
   DB_PASSWORD=
   ```

### Step 5: Test the Application

1. Start the application:
   ```
   npm start
   ```

2. You should see:
   ```
   Connected to SQL Server database
   TimeTrack server running on http://localhost:3000
   ```

3. Open a web browser and go to:
   - http://localhost:3000

4. If you loaded sample data, you should see staff members in the dropdown

5. Test the system:
   - Select a staff member
   - Select a client
   - Select an office location
   - Click "Punch In"
   - Verify the punch was successful
   - Click "Punch Out"

### Step 6: Make it Run Automatically (Windows Service)

To keep TimeTrack running even after you log out:

#### Option A: Using PM2 (Recommended)

1. Install PM2 globally:
   ```
   npm install -g pm2
   ```

2. Start TimeTrack with PM2:
   ```
   cd C:\TimeTrack
   pm2 start server.js --name timetrack
   ```

3. Configure PM2 to start on boot:
   ```
   pm2 save
   pm2 startup
   ```

4. Run the command that PM2 outputs

#### Option B: Using Windows Task Scheduler

1. Open Task Scheduler
2. Click "Create Basic Task"
3. Name: "TimeTrack Server"
4. Trigger: "When the computer starts"
5. Action: "Start a program"
6. Program: `C:\Program Files\nodejs\node.exe`
7. Arguments: `C:\TimeTrack\server.js`
8. Start in: `C:\TimeTrack`
9. Finish and test by restarting the computer

#### Option C: Using NSSM (Non-Sucking Service Manager)

1. Download NSSM from: https://nssm.cc/download
2. Extract nssm.exe to a folder
3. Open Command Prompt as Administrator
4. Run:
   ```
   nssm install TimeTrack
   ```
5. In the GUI:
   - Path: `C:\Program Files\nodejs\node.exe`
   - Startup directory: `C:\TimeTrack`
   - Arguments: `server.js`
6. Click "Install service"
7. Start the service:
   ```
   nssm start TimeTrack
   ```

### Step 7: Configure Network Access

To allow other computers on your network to access TimeTrack:

1. **Find your server's IP address**:
   ```
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

2. **Configure Windows Firewall**:
   - Open Windows Firewall
   - Click "Advanced settings"
   - Click "Inbound Rules" → "New Rule"
   - Select "Port"
   - TCP port 3000
   - Allow the connection
   - Apply to all profiles
   - Name: "TimeTrack Web Server"

3. **Update server.js** (optional - to listen on all interfaces):
   Edit `server.js` and change the listen line to:
   ```javascript
   app.listen(PORT, '0.0.0.0', () => {
       console.log(`TimeTrack server running on http://0.0.0.0:${PORT}`);
   });
   ```

4. **Access from other computers**:
   - From other PCs: http://192.168.1.100:3000
   - (Replace with your server's IP)

### Step 8: Set Up a Friendly URL (Optional)

#### Option A: Using IIS as Reverse Proxy

1. Install IIS URL Rewrite module
2. Install IIS Application Request Routing (ARR)
3. Create a new site in IIS pointing to your server
4. Configure reverse proxy to forward to localhost:3000

#### Option B: Using a Local DNS Entry

1. On client computers, edit `C:\Windows\System32\drivers\etc\hosts`
2. Add line:
   ```
   192.168.1.100  timetrack.company.local
   ```
3. Users can now access: http://timetrack.company.local:3000

## Default Data Setup

After installation, add your actual data:

### 1. Add Office Locations
1. Go to http://localhost:3000/admin
2. Click "➕ Add Office"
3. Enter location name and address
4. Click Save

### 2. Add Clients
1. Click "➕ Add Client"
2. Enter client information
3. **Important**: Set the billing rate ($/hour) - this is how much you charge the client
4. Click Save

### 3. Add Staff Members
1. Click "➕ Add Staff"
2. Enter staff name and email
3. Select their office location
4. **Important**: Set the cost rate ($/hour) - this is how much the staff member costs you
5. Click Save

## Troubleshooting Common Issues

### Issue: "Login failed for user"
**Solution**: Check your SQL credentials in `.env` file. Try Windows Authentication by leaving DB_USER and DB_PASSWORD empty.

### Issue: "Cannot connect to SQL Server"
**Solution**: 
- Verify SQL Server is running (services.msc)
- Check server name in `.env` (might need `\SQLEXPRESS`)
- Enable TCP/IP in SQL Server Configuration Manager

### Issue: "Port 3000 is already in use"
**Solution**: Change PORT in `.env` file to a different number (e.g., 3001)

### Issue: Can't access from other computers
**Solution**: 
- Check Windows Firewall settings
- Verify server IP address
- Make sure server.js is listening on 0.0.0.0

### Issue: Reports show no data
**Solution**: 
- Ensure time entries are completed (punched out)
- Check date range covers period with data
- Verify stored procedures were created successfully

### Issue: "npm: command not found"
**Solution**: Reinstall Node.js and make sure to check "Add to PATH" during installation

## Maintenance Tasks

### Daily
- Monitor punch in/out activity via admin dashboard
- Check for any stuck "punched in" entries

### Weekly
- Review reports for accuracy
- Back up database

### Monthly
- Archive old data if database grows too large
- Review user accounts and remove inactive ones

### Database Backup Script

Save this as `backup_timetrack.sql` and schedule it:

```sql
DECLARE @BackupPath NVARCHAR(500)
DECLARE @FileName NVARCHAR(500)

SET @BackupPath = 'C:\SQLBackups\'
SET @FileName = @BackupPath + 'TimeTrackDB_' 
    + CONVERT(NVARCHAR, GETDATE(), 112) + '_'
    + REPLACE(CONVERT(NVARCHAR, GETDATE(), 108), ':', '') + '.bak'

BACKUP DATABASE TimeTrackDB
TO DISK = @FileName
WITH FORMAT, COMPRESSION, INIT;

PRINT 'Backup completed: ' + @FileName;
```

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the `README.md` file for detailed documentation
3. Check the browser console (F12) for JavaScript errors
4. Check Node.js console output for backend errors
5. Review SQL Server logs for database errors

## Next Steps

After successful installation:

1. Customize the system for your business needs
2. Train staff on using the punch clock
3. Set up regular report reviews
4. Consider adding authentication for production use
5. Set up automated database backups
6. Monitor system performance and storage usage

## Security Checklist

- [ ] Strong SQL Server password set
- [ ] Firewall configured to only allow internal network access
- [ ] Regular database backups scheduled
- [ ] Default sample data removed (if not needed)
- [ ] Windows server updates enabled
- [ ] Consider implementing user authentication
- [ ] Consider HTTPS for encrypted communication

## Contact Information

For technical support or customization requests, maintain a list of:
- Database administrator contact
- Network administrator contact
- Application maintainer contact

