-- Simple Report Queries for TimeTrack System
-- These can be run directly in SQL Server Management Studio or any SQL client

USE TimeTrackDB;
GO

-- =================================================================
-- QUERY 1: Date Range Hours by Employee and Customer
-- Simple report to pull hours per employee per customer for a date range
-- =================================================================

-- Replace @StartDate and @EndDate with your desired date range
DECLARE @StartDate DATE = '2024-01-01';  -- CHANGE THIS DATE
DECLARE @EndDate DATE = '2024-12-31';    -- CHANGE THIS DATE

SELECT 
    s.StaffName AS Employee,
    c.ClientName AS Customer,
    COUNT(te.EntryID) AS NumberOfEntries,
    SUM(CASE 
        WHEN te.TimeFinished IS NULL THEN 0
        ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
    END) AS TotalHours
FROM TimeEntries te
INNER JOIN Staff s ON te.StaffID = s.StaffID
INNER JOIN Clients c ON te.ClientID = c.ClientID
WHERE te.WorkDate BETWEEN @StartDate AND @EndDate
    AND te.TimeFinished IS NOT NULL  -- Only completed entries
GROUP BY 
    s.StaffName,
    c.ClientName
ORDER BY 
    s.StaffName,
    c.ClientName;

-- =================================================================
-- QUERY 2: Summary by Employee Only
-- Total hours per employee across all customers
-- =================================================================

SELECT 
    s.StaffName AS Employee,
    COUNT(te.EntryID) AS TotalEntries,
    SUM(CASE 
        WHEN te.TimeFinished IS NULL THEN 0
        ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
    END) AS TotalHours
FROM TimeEntries te
INNER JOIN Staff s ON te.StaffID = s.StaffID
WHERE te.WorkDate BETWEEN @StartDate AND @EndDate
    AND te.TimeFinished IS NOT NULL
GROUP BY 
    s.StaffName
ORDER BY 
    TotalHours DESC;

-- =================================================================
-- QUERY 3: Summary by Customer Only
-- Total hours per customer across all employees
-- =================================================================

SELECT 
    c.ClientName AS Customer,
    COUNT(te.EntryID) AS TotalEntries,
    SUM(CASE 
        WHEN te.TimeFinished IS NULL THEN 0
        ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
    END) AS TotalHours
FROM TimeEntries te
INNER JOIN Clients c ON te.ClientID = c.ClientID
WHERE te.WorkDate BETWEEN @StartDate AND @EndDate
    AND te.TimeFinished IS NOT NULL
GROUP BY 
    c.ClientName
ORDER BY 
    TotalHours DESC;

-- =================================================================
-- QUERY 4: Detailed Report with Dates
-- Shows date-by-date breakdown by employee and customer
-- =================================================================

SELECT 
    te.WorkDate,
    s.StaffName AS Employee,
    c.ClientName AS Customer,
    ol.LocationName AS Office,
    te.WorkDescription,
    te.TimeStarted,
    te.TimeFinished,
    CASE 
        WHEN te.TimeFinished IS NULL THEN 0
        ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
    END AS Hours
FROM TimeEntries te
INNER JOIN Staff s ON te.StaffID = s.StaffID
INNER JOIN Clients c ON te.ClientID = c.ClientID
INNER JOIN OfficeLocations ol ON te.LocationID = ol.LocationID
WHERE te.WorkDate BETWEEN @StartDate AND @EndDate
    AND te.TimeFinished IS NOT NULL
ORDER BY 
    te.WorkDate DESC,
    s.StaffName,
    c.ClientName;

-- =================================================================
-- QUERY 5: This Month's Hours (Quick Summary)
-- Automatically uses current month
-- =================================================================

SELECT 
    s.StaffName AS Employee,
    c.ClientName AS Customer,
    COUNT(te.EntryID) AS Entries,
    SUM(DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) AS TotalHours
FROM TimeEntries te
INNER JOIN Staff s ON te.StaffID = s.StaffID
INNER JOIN Clients c ON te.ClientID = c.ClientID
WHERE MONTH(te.WorkDate) = MONTH(GETDATE())
    AND YEAR(te.WorkDate) = YEAR(GETDATE())
    AND te.TimeFinished IS NOT NULL
GROUP BY 
    s.StaffName,
    c.ClientName
ORDER BY 
    s.StaffName,
    c.ClientName;

-- =================================================================
-- QUERY 6: Currently Punched In Employees
-- Shows who is currently working
-- =================================================================

SELECT 
    s.StaffName AS Employee,
    c.ClientName AS Customer,
    ol.LocationName AS Office,
    te.TimeStarted,
    DATEDIFF(MINUTE, te.TimeStarted, GETDATE()) / 60.0 AS CurrentHours
FROM TimeEntries te
INNER JOIN Staff s ON te.StaffID = s.StaffID
INNER JOIN Clients c ON te.ClientID = c.ClientID
INNER JOIN OfficeLocations ol ON te.LocationID = ol.LocationID
WHERE te.IsPunchedIn = 1
ORDER BY 
    te.TimeStarted;

GO

