const { getConnection, sql } = require('./config/database');
const bcrypt = require('bcrypt');
const cors = require('cors');

async function createTablesIfNotExist() {
    try {
        const pool = await getConnection();
        
        // Verify we're connected to the right database
        const dbCheck = await pool.request().query('SELECT DB_NAME() AS CurrentDB');
        console.log(`Checking database tables in: ${dbCheck.recordset[0].CurrentDB}`);

        // Check which tables exist
        const tablesCheck = await pool.request().query(`
            SELECT TABLE_NAME
            FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_SCHEMA = 'dbo'
        `);

        const existingTables = tablesCheck.recordset.map(r => r.TABLE_NAME);
        const requiredTables = ['OfficeLocations', 'Staff', 'Clients', 'TimeEntries', 'Users'];
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));

        if (missingTables.length === 0) {
            console.log('✓ All required tables exist.');
            return true;
        }

        console.log(`⚠️  Missing tables: ${missingTables.join(', ')}`);
        console.log('🔧 Creating missing tables...');

        // Create Office Locations Table
        if (!existingTables.includes('OfficeLocations')) {
            console.log('  → Creating OfficeLocations table...');
            await pool.request().query(`
                CREATE TABLE dbo.OfficeLocations (
                    OfficeLocationID INT IDENTITY(1,1) PRIMARY KEY,
                    LocationName NVARCHAR(100) NOT NULL,
                    Address NVARCHAR(200),
                    IsActive BIT DEFAULT 1,
                    CreatedDate DATETIME DEFAULT GETDATE()
                );
            `);
        }

        // Create Staff Table
        if (!existingTables.includes('Staff')) {
            console.log('  → Creating Staff table...');
            await pool.request().query(`
                CREATE TABLE dbo.Staff (
                    StaffID INT IDENTITY(1,1) PRIMARY KEY,
                    StaffName NVARCHAR(100) NOT NULL,
                    StaffRole NVARCHAR(100) NOT NULL,
                    HourlyCostRate DECIMAL(10,2) NOT NULL,
                    Email NVARCHAR(100),
                    IsActive BIT DEFAULT 1,
                    CreatedDate DATETIME DEFAULT GETDATE()
                );
            `);
        }

        // Create Clients Table
        if (!existingTables.includes('Clients')) {
            console.log('  → Creating Clients table...');
            await pool.request().query(`
                CREATE TABLE dbo.Clients (
                    ClientID INT IDENTITY(1,1) PRIMARY KEY,
                    ClientName NVARCHAR(100) NOT NULL,
                    HourlyBillingRate DECIMAL(10,2) NOT NULL,
                    ContactEmail NVARCHAR(100),
                    ContactPhone NVARCHAR(20),
                    Address NVARCHAR(200),
                    IsActive BIT DEFAULT 1,
                    CreatedDate DATETIME DEFAULT GETDATE()
                );
            `);
        }

        // Create Time Entries Table (only if Staff, Clients, and OfficeLocations exist)
        if (!existingTables.includes('TimeEntries')) {
            console.log('  → Creating TimeEntries table...');
            await pool.request().query(`
                CREATE TABLE dbo.TimeEntries (
                    TimeEntryID INT IDENTITY(1,1) PRIMARY KEY,
                    StaffID INT NOT NULL,
                    ClientID INT NOT NULL,
                    LocationID INT NOT NULL,
                    WorkDate DATE NOT NULL,
                    TimeStarted DATETIME NOT NULL,
                    TimeFinished DATETIME NULL,
                    WorkDescription NVARCHAR(500),
                    TotalHours AS DATEDIFF(MINUTE, TimeStarted, ISNULL(TimeFinished, GETDATE())) / 60.0,
                    IsPunchedIn BIT DEFAULT 1,
                    CreatedDate DATETIME DEFAULT GETDATE(),
                    ModifiedDate DATETIME DEFAULT GETDATE(),
                    FOREIGN KEY (StaffID) REFERENCES dbo.Staff(StaffID),
                    FOREIGN KEY (ClientID) REFERENCES dbo.Clients(ClientID),
                    FOREIGN KEY (LocationID) REFERENCES dbo.OfficeLocations(OfficeLocationID)
                );
            `);

            // Create indexes
            await pool.request().query(`
                CREATE INDEX IX_TimeEntries_StaffID ON dbo.TimeEntries(StaffID);
                CREATE INDEX IX_TimeEntries_ClientID ON dbo.TimeEntries(ClientID);
                CREATE INDEX IX_TimeEntries_WorkDate ON dbo.TimeEntries(WorkDate);
                CREATE INDEX IX_TimeEntries_IsPunchedIn ON dbo.TimeEntries(IsPunchedIn);
            `);
        }

        // Create Users Table
        if (!existingTables.includes('Users')) {
            console.log('  → Creating Users table...');
            await pool.request().query(`
                CREATE TABLE dbo.Users (
                    UserID INT IDENTITY(1,1) PRIMARY KEY,
                    Username NVARCHAR(50) UNIQUE NOT NULL,
                    Email NVARCHAR(100) UNIQUE NOT NULL,
                    PasswordHash NVARCHAR(255) NOT NULL,
                    Role NVARCHAR(20) NOT NULL DEFAULT 'user',
                    IsActive BIT DEFAULT 1,
                    CreatedDate DATETIME DEFAULT GETDATE(),
                    LastLoginDate DATETIME NULL
                );
            `);

            // Create indexes
            await pool.request().query(`
                CREATE INDEX IX_Users_Username ON dbo.Users(Username);
                CREATE INDEX IX_Users_Email ON dbo.Users(Email);
            `);
        }

        console.log('✓ All required tables created successfully!');
        console.log('');
        return true;

    } catch (err) {
        console.error('❌ Error creating tables:', err.message);
        throw err;
    }
}

async function seedAdminUser() {
    try {
        const pool = await getConnection();
        
        // Check if Users table exists
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) AS TableExists
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Users'
        `);

        if (tableCheck.recordset[0].TableExists === 0) {
            console.log('⚠️  Users table does not exist yet.');
            return; // Table will be created by createTablesIfNotExist in seedDatabase
        }

        // Check if any admin user exists
        const adminCheck = await pool.request().query(`
            SELECT COUNT(*) AS AdminCount
            FROM Users
            WHERE Role = 'admin'
        `);

        if (adminCheck.recordset[0].AdminCount > 0) {
            console.log('✓ Admin user already exists.');
            return;
        }

        console.log('Creating default admin user...');
        
        // Hash the default password
        const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

        // Create admin user
        await pool.request()
            .input('username', sql.NVarChar, process.env.ADMIN_USERNAME)
            .input('email', sql.NVarChar, process.env.ADMIN_EMAIL)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .input('role', sql.NVarChar, 'admin')
            .query(`
                INSERT INTO Users (Username, Email, PasswordHash, Role)
                VALUES (@username, @email, @passwordHash, @role)
            `);

        console.log('✓ Default admin user created successfully!');
        console.log('  Username: admin');
        console.log('  Password: admin123');
        console.log('  ⚠️  Please change this password after first login!');
        console.log('');
    } catch (err) {
        if (err.message.includes('Cannot insert duplicate key')) {
            console.log('✓ Admin user already exists.');
        } else {
            console.error('Error seeding admin user:', err.message);
            throw err;
        }
    }
}

async function seedDatabase() {
    try {
        // First, ensure all tables exist
        console.log('');
        console.log('=== Initializing Database ===');
        const tablesCreated = await createTablesIfNotExist();
        
        // Verify Users table exists before seeding admin
        const pool = await getConnection();
        const usersTableCheck = await pool.request().query(`
            SELECT COUNT(*) AS TableExists
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Users' AND TABLE_SCHEMA = 'dbo'
        `);
        
        if (usersTableCheck.recordset[0].TableExists === 0) {
            console.error('❌ Users table was not created successfully. Cannot seed admin user.');
            throw new Error('Users table missing after table creation attempt');
        }
        
        // Then, ensure admin user exists
        await seedAdminUser();
        
        console.log('Checking database for existing data...');
        
        // Check if data already exists
        const checkResult = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM OfficeLocations) AS OfficeCount,
                (SELECT COUNT(*) FROM Staff) AS StaffCount,
                (SELECT COUNT(*) FROM Clients) AS ClientCount
        `);
        
        const counts = checkResult.recordset[0];
        
        if (counts.OfficeCount > 0 || counts.StaffCount > 0 || counts.ClientCount > 0) {
            console.log('✓ Database already has data. Skipping seed.');
            return;
        }
        
        console.log('Database is empty. Seeding sample data...');
        
        // Insert Office Locations
        console.log('  → Adding office locations...');
        await pool.request().query(`
            INSERT INTO OfficeLocations (LocationName, Address) VALUES
            ('Downtown Office', '123 Main St, Suite 100'),
            ('North Branch', '456 North Ave'),
            ('South Branch', '789 South Blvd')
        `);
        
        // Insert Staff Members
        console.log('  → Adding staff members...');
        await pool.request().query(`
            INSERT INTO Staff (StaffName, StaffRole, HourlyCostRate, Email) VALUES
            ('John Smith', 'Developer', 35.00, 'john.smith@company.com'),
            ('Sarah Johnson', 'Senior Developer', 42.00, 'sarah.johnson@company.com'),
            ('Mike Williams', 'Project Manager', 38.00, 'mike.williams@company.com'),
            ('Emily Davis', 'Team Lead', 45.00, 'emily.davis@company.com'),
            ('Robert Brown', 'Consultant', 40.00, 'robert.brown@company.com')
        `);
        
        // Insert Clients
        console.log('  → Adding clients...');
        await pool.request().query(`
            INSERT INTO Clients (ClientName, HourlyBillingRate, ContactEmail, ContactPhone, Address) VALUES
            ('ABC Corporation', 95.00, 'alice@abccorp.com', '555-0101', '100 ABC Plaza'),
            ('XYZ Industries', 110.00, 'bob@xyzind.com', '555-0102', '200 Industry Dr'),
            ('Global Services Ltd', 125.00, 'carol@globalservices.com', '555-0103', '300 Global Center'),
            ('Tech Solutions Inc', 100.00, 'david@techsol.com', '555-0104', '400 Tech Park'),
            ('Premier Consulting', 115.00, 'eve@premierconsult.com', '555-0105', '500 Premier Way')
        `);
        
        // Insert sample time entries from past few days
        console.log('  → Adding sample time entries...');
        
        const today = new Date();
        const daysAgo5 = new Date(today);
        daysAgo5.setDate(daysAgo5.getDate() - 5);
        
        const daysAgo4 = new Date(today);
        daysAgo4.setDate(daysAgo4.getDate() - 4);
        
        const daysAgo3 = new Date(today);
        daysAgo3.setDate(daysAgo3.getDate() - 3);
        
        const daysAgo2 = new Date(today);
        daysAgo2.setDate(daysAgo2.getDate() - 2);
        
        const daysAgo1 = new Date(today);
        daysAgo1.setDate(daysAgo1.getDate() - 1);
        
        // Helper function to create datetime
        function createDateTime(date, hours, minutes) {
            const dt = new Date(date);
            dt.setHours(hours, minutes, 0, 0);
            return dt;
        }
        
        // Day 5 ago
        await pool.request()
            .input('staffId1', sql.Int, 1)
            .input('clientId1', sql.Int, 1)
            .input('officeId1', sql.Int, 1)
            .input('workDate1', sql.Date, daysAgo5)
            .input('timeStarted1', sql.DateTime, createDateTime(daysAgo5, 9, 0))
            .input('timeFinished1', sql.DateTime, createDateTime(daysAgo5, 12, 30))
            .input('description1', sql.NVarChar, 'Initial project planning and requirements gathering')
            .query(`
                INSERT INTO TimeEntries (StaffID, ClientID, LocationID, WorkDate, TimeStarted, TimeFinished, WorkDescription, IsPunchedIn)
                VALUES (@staffId1, @clientId1, @officeId1, @workDate1, @timeStarted1, @timeFinished1, @description1, 0)
            `);
        
        await pool.request()
            .input('staffId', sql.Int, 1)
            .input('clientId', sql.Int, 2)
            .input('officeId', sql.Int, 1)
            .input('workDate', sql.Date, daysAgo5)
            .input('timeStarted', sql.DateTime, createDateTime(daysAgo5, 13, 30))
            .input('timeFinished', sql.DateTime, createDateTime(daysAgo5, 17, 0))
            .input('description', sql.NVarChar, 'Database design and schema review')
            .query(`
                INSERT INTO TimeEntries (StaffID, ClientID, LocationID, WorkDate, TimeStarted, TimeFinished, WorkDescription, IsPunchedIn)
                VALUES (@staffId, @clientId, @officeId, @workDate, @timeStarted, @timeFinished, @description, 0)
            `);
        
        // Day 4 ago
        await pool.request()
            .input('staffId', sql.Int, 2)
            .input('clientId', sql.Int, 3)
            .input('officeId', sql.Int, 1)
            .input('workDate', sql.Date, daysAgo4)
            .input('timeStarted', sql.DateTime, createDateTime(daysAgo4, 8, 30))
            .input('timeFinished', sql.DateTime, createDateTime(daysAgo4, 16, 0))
            .input('description', sql.NVarChar, 'Software development and testing')
            .query(`
                INSERT INTO TimeEntries (StaffID, ClientID, LocationID, WorkDate, TimeStarted, TimeFinished, WorkDescription, IsPunchedIn)
                VALUES (@staffId, @clientId, @officeId, @workDate, @timeStarted, @timeFinished, @description, 0)
            `);
        
        // Day 3 ago
        await pool.request()
            .input('staffId', sql.Int, 3)
            .input('clientId', sql.Int, 1)
            .input('officeId', sql.Int, 2)
            .input('workDate', sql.Date, daysAgo3)
            .input('timeStarted', sql.DateTime, createDateTime(daysAgo3, 10, 0))
            .input('timeFinished', sql.DateTime, createDateTime(daysAgo3, 14, 30))
            .input('description', sql.NVarChar, 'Client consultation and project review')
            .query(`
                INSERT INTO TimeEntries (StaffID, ClientID, LocationID, WorkDate, TimeStarted, TimeFinished, WorkDescription, IsPunchedIn)
                VALUES (@staffId, @clientId, @officeId, @workDate, @timeStarted, @timeFinished, @description, 0)
            `);
        
        // Day 2 ago
        await pool.request()
            .input('staffId', sql.Int, 4)
            .input('clientId', sql.Int, 4)
            .input('officeId', sql.Int, 2)
            .input('workDate', sql.Date, daysAgo2)
            .input('timeStarted', sql.DateTime, createDateTime(daysAgo2, 9, 0))
            .input('timeFinished', sql.DateTime, createDateTime(daysAgo2, 15, 30))
            .input('description', sql.NVarChar, 'Technical support and troubleshooting')
            .query(`
                INSERT INTO TimeEntries (StaffID, ClientID, LocationID, WorkDate, TimeStarted, TimeFinished, WorkDescription, IsPunchedIn)
                VALUES (@staffId, @clientId, @officeId, @workDate, @timeStarted, @timeFinished, @description, 0)
            `);
        
        // Day 1 ago (yesterday)
        await pool.request()
            .input('staffId', sql.Int, 5)
            .input('clientId', sql.Int, 5)
            .input('officeId', sql.Int, 3)
            .input('workDate', sql.Date, daysAgo1)
            .input('timeStarted', sql.DateTime, createDateTime(daysAgo1, 8, 0))
            .input('timeFinished', sql.DateTime, createDateTime(daysAgo1, 12, 0))
            .input('description', sql.NVarChar, 'System implementation and training')
            .query(`
                INSERT INTO TimeEntries (StaffID, ClientID, LocationID, WorkDate, TimeStarted, TimeFinished, WorkDescription, IsPunchedIn)
                VALUES (@staffId, @clientId, @officeId, @workDate, @timeStarted, @timeFinished, @description, 0)
            `);
        
        // Yesterday afternoon
        await pool.request()
            .input('staffId', sql.Int, 1)
            .input('clientId', sql.Int, 3)
            .input('officeId', sql.Int, 1)
            .input('workDate', sql.Date, daysAgo1)
            .input('timeStarted', sql.DateTime, createDateTime(daysAgo1, 13, 0))
            .input('timeFinished', sql.DateTime, createDateTime(daysAgo1, 17, 30))
            .input('description', sql.NVarChar, 'Code review and quality assurance')
            .query(`
                INSERT INTO TimeEntries (StaffID, ClientID, LocationID, WorkDate, TimeStarted, TimeFinished, WorkDescription, IsPunchedIn)
                VALUES (@staffId, @clientId, @officeId, @workDate, @timeStarted, @timeFinished, @description, 0)
            `);
        
        console.log('✓ Sample data seeded successfully!');
        console.log('  • 3 Office Locations');
        console.log('  • 5 Staff Members');
        console.log('  • 5 Clients');
        console.log('  • 7 Sample Time Entries');
        console.log('');
        console.log('You can now:');
        console.log('  1. Login at http://localhost:3000/login.html');
        console.log('  2. View admin dashboard at http://localhost:3000/admin');
        console.log('  3. Punch in/out at http://localhost:3000');
        console.log('  4. Generate reports at http://localhost:3000/reports');
        console.log('');
        
    } catch (err) {
        console.error('Error seeding database:', err.message);
        throw err;
    }
}

module.exports = { seedDatabase, seedAdminUser, createTablesIfNotExist };

