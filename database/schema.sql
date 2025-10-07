-- TimeTrack Database Schema
-- Microsoft SQL Server

USE master;
GO

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TimeTrackDB')
BEGIN
    CREATE DATABASE TimeTrackDB;
END
GO

USE TimeTrackDB;
GO

-- Drop tables if they exist (for clean setup)
IF OBJECT_ID('dbo.TimeEntries', 'U') IS NOT NULL DROP TABLE dbo.TimeEntries;
IF OBJECT_ID('dbo.Staff', 'U') IS NOT NULL DROP TABLE dbo.Staff;
IF OBJECT_ID('dbo.Clients', 'U') IS NOT NULL DROP TABLE dbo.Clients;
IF OBJECT_ID('dbo.OfficeLocations', 'U') IS NOT NULL DROP TABLE dbo.OfficeLocations;
GO

-- Office Locations Table
CREATE TABLE OfficeLocations (
    OfficeLocationID INT IDENTITY(1,1) PRIMARY KEY,
    LocationName NVARCHAR(100) NOT NULL,
    Address NVARCHAR(200),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- Staff Table
CREATE TABLE Staff (
    StaffID INT IDENTITY(1,1) PRIMARY KEY,
    StaffName NVARCHAR(100) NOT NULL,
    OfficeLocationID INT NOT NULL,
    CostRate DECIMAL(10,2) NOT NULL, -- Hidden field: cost per hour
    Email NVARCHAR(100),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (OfficeLocationID) REFERENCES OfficeLocations(OfficeLocationID)
);
GO

-- Clients Table
CREATE TABLE Clients (
    ClientID INT IDENTITY(1,1) PRIMARY KEY,
    ClientName NVARCHAR(100) NOT NULL,
    BillingRate DECIMAL(10,2) NOT NULL, -- Hidden field: billing rate per hour
    ContactPerson NVARCHAR(100),
    Email NVARCHAR(100),
    Phone NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    CreatedDate DATETIME DEFAULT GETDATE()
);
GO

-- Time Entries Table (Punch Data)
CREATE TABLE TimeEntries (
    TimeEntryID INT IDENTITY(1,1) PRIMARY KEY,
    StaffID INT NOT NULL,
    ClientID INT NOT NULL,
    OfficeLocationID INT NOT NULL,
    WorkDate DATE NOT NULL,
    TimeStarted DATETIME NOT NULL,
    TimeFinished DATETIME NULL,
    WorkDescription NVARCHAR(500),
    TotalHours AS DATEDIFF(MINUTE, TimeStarted, ISNULL(TimeFinished, GETDATE())) / 60.0, -- Computed column
    IsPunchedIn BIT DEFAULT 1, -- Status flag: 1 = currently punched in, 0 = punched out
    CreatedDate DATETIME DEFAULT GETDATE(),
    ModifiedDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (StaffID) REFERENCES Staff(StaffID),
    FOREIGN KEY (ClientID) REFERENCES Clients(ClientID),
    FOREIGN KEY (OfficeLocationID) REFERENCES OfficeLocations(OfficeLocationID)
);
GO

-- Index for faster queries on common lookups
CREATE INDEX IX_TimeEntries_StaffID ON TimeEntries(StaffID);
CREATE INDEX IX_TimeEntries_ClientID ON TimeEntries(ClientID);
CREATE INDEX IX_TimeEntries_WorkDate ON TimeEntries(WorkDate);
CREATE INDEX IX_TimeEntries_IsPunchedIn ON TimeEntries(IsPunchedIn);
GO

-- View for Staff Currently Punched In
CREATE VIEW vw_CurrentlyPunchedIn AS
SELECT 
    te.TimeEntryID,
    s.StaffID,
    s.StaffName,
    c.ClientName,
    ol.LocationName,
    te.TimeStarted,
    te.WorkDescription,
    DATEDIFF(MINUTE, te.TimeStarted, GETDATE()) / 60.0 AS CurrentHours
FROM TimeEntries te
INNER JOIN Staff s ON te.StaffID = s.StaffID
INNER JOIN Clients c ON te.ClientID = c.ClientID
INNER JOIN OfficeLocations ol ON te.OfficeLocationID = ol.OfficeLocationID
WHERE te.IsPunchedIn = 1;
GO

-- View for Today's Time Entries (Admin Review)
CREATE VIEW vw_TodaysTimeEntries AS
SELECT 
    te.TimeEntryID,
    s.StaffName,
    ol.LocationName,
    c.ClientName,
    te.WorkDate,
    te.TimeStarted,
    te.TimeFinished,
    te.WorkDescription,
    CASE 
        WHEN te.TimeFinished IS NULL THEN DATEDIFF(MINUTE, te.TimeStarted, GETDATE()) / 60.0
        ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
    END AS Hours,
    te.IsPunchedIn,
    CASE WHEN te.IsPunchedIn = 1 THEN 'Punched In' ELSE 'Completed' END AS Status
FROM TimeEntries te
INNER JOIN Staff s ON te.StaffID = s.StaffID
INNER JOIN Clients c ON te.ClientID = c.ClientID
INNER JOIN OfficeLocations ol ON te.OfficeLocationID = ol.OfficeLocationID
WHERE te.WorkDate = CAST(GETDATE() AS DATE);
GO

PRINT 'Database schema created successfully!';
GO

