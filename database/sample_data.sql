-- Sample Data for TimeTrack Database
USE TimeTrackDB;
GO

-- Insert Office Locations
INSERT INTO OfficeLocations (LocationName, Address) VALUES
('Downtown Office', '123 Main St, Suite 100'),
('North Branch', '456 North Ave'),
('South Branch', '789 South Blvd');
GO

-- Insert Staff Members
INSERT INTO Staff (StaffName, StaffRole, HourlyCostRate, Email) VALUES
('John Smith', 'Developer', 35.00, 'john.smith@company.com'),
('Sarah Johnson', 'Senior Developer', 42.00, 'sarah.johnson@company.com'),
('Mike Williams', 'Project Manager', 38.00, 'mike.williams@company.com'),
('Emily Davis', 'Team Lead', 45.00, 'emily.davis@company.com'),
('Robert Brown', 'Consultant', 40.00, 'robert.brown@company.com');
GO

-- Insert Clients
INSERT INTO Clients (ClientName, BillingRate, ContactPerson, Email, Phone) VALUES
('ABC Corporation', 95.00, 'Alice Anderson', 'alice@abccorp.com', '555-0101'),
('XYZ Industries', 110.00, 'Bob Baker', 'bob@xyzind.com', '555-0102'),
('Global Services Ltd', 125.00, 'Carol Carter', 'carol@globalservices.com', '555-0103'),
('Tech Solutions Inc', 100.00, 'David Dixon', 'david@techsol.com', '555-0104'),
('Premier Consulting', 115.00, 'Eve Evans', 'eve@premierconsult.com', '555-0105');
GO

-- Insert some sample time entries (past week)
DECLARE @Today DATE = CAST(GETDATE() AS DATE);

-- Completed entries from previous days
INSERT INTO TimeEntries (StaffID, ClientID, OfficeLocationID, WorkDate, TimeStarted, TimeFinished, WorkDescription, IsPunchedIn)
VALUES
(1, 1, 1, DATEADD(DAY, -5, @Today), DATEADD(DAY, -5, CAST('2025-10-01 09:00:00' AS DATETIME)), DATEADD(DAY, -5, CAST('2025-10-01 12:30:00' AS DATETIME)), 'Initial project planning and requirements gathering', 0),
(1, 2, 1, DATEADD(DAY, -5, @Today), DATEADD(DAY, -5, CAST('2025-10-01 13:30:00' AS DATETIME)), DATEADD(DAY, -5, CAST('2025-10-01 17:00:00' AS DATETIME)), 'Database design and schema review', 0),
(2, 3, 1, DATEADD(DAY, -4, @Today), DATEADD(DAY, -4, CAST('2025-10-02 08:30:00' AS DATETIME)), DATEADD(DAY, -4, CAST('2025-10-02 16:00:00' AS DATETIME)), 'Software development and testing', 0),
(3, 1, 2, DATEADD(DAY, -3, @Today), DATEADD(DAY, -3, CAST('2025-10-03 10:00:00' AS DATETIME)), DATEADD(DAY, -3, CAST('2025-10-03 14:30:00' AS DATETIME)), 'Client consultation and project review', 0),
(4, 4, 2, DATEADD(DAY, -2, @Today), DATEADD(DAY, -2, CAST('2025-10-04 09:00:00' AS DATETIME)), DATEADD(DAY, -2, CAST('2025-10-04 15:30:00' AS DATETIME)), 'Technical support and troubleshooting', 0),
(5, 5, 3, DATEADD(DAY, -1, @Today), DATEADD(DAY, -1, CAST('2025-10-05 08:00:00' AS DATETIME)), DATEADD(DAY, -1, CAST('2025-10-05 12:00:00' AS DATETIME)), 'System implementation and training', 0);
GO

PRINT 'Sample data inserted successfully!';
GO

