-- Report Stored Procedures for TimeTrack
USE TimeTrackDB;
GO

-- Report 1: Staff Work Report
-- Shows work done by staff with clients, hours, cost, and revenue
IF OBJECT_ID('dbo.sp_StaffWorkReport', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_StaffWorkReport;
GO

CREATE PROCEDURE sp_StaffWorkReport
    @StartDate DATE,
    @EndDate DATE,
    @StaffID INT = NULL -- Optional: filter by specific staff member
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.StaffID,
        s.StaffName,
        ol.LocationName AS OfficeLocation,
        c.ClientID,
        c.ClientName,
        COUNT(te.TimeEntryID) AS NumberOfEntries,
        SUM(CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
        END) AS TotalHours,
        s.CostRate AS StaffCostRate,
        c.BillingRate AS ClientBillingRate,
        SUM(CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * s.CostRate
        END) AS TotalCost,
        SUM(CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * c.BillingRate
        END) AS TotalRevenue,
        SUM(CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * (c.BillingRate - s.CostRate)
        END) AS TotalProfit
    FROM TimeEntries te
    INNER JOIN Staff s ON te.StaffID = s.StaffID
    INNER JOIN Clients c ON te.ClientID = c.ClientID
    INNER JOIN OfficeLocations ol ON te.OfficeLocationID = ol.OfficeLocationID
    WHERE te.WorkDate BETWEEN @StartDate AND @EndDate
        AND te.TimeFinished IS NOT NULL -- Only completed entries
        AND (@StaffID IS NULL OR s.StaffID = @StaffID)
    GROUP BY 
        s.StaffID, 
        s.StaffName, 
        ol.LocationName,
        c.ClientID,
        c.ClientName,
        s.CostRate,
        c.BillingRate
    ORDER BY 
        s.StaffName, 
        c.ClientName;
END
GO

-- Report 2: Client Billing Report
-- Shows billable services by client with costs and staff information
IF OBJECT_ID('dbo.sp_ClientBillingReport', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ClientBillingReport;
GO

CREATE PROCEDURE sp_ClientBillingReport
    @StartDate DATE,
    @EndDate DATE,
    @ClientID INT = NULL -- Optional: filter by specific client
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.ClientID,
        c.ClientName,
        te.TimeEntryID,
        te.WorkDate,
        s.StaffName,
        ol.LocationName AS OfficeLocation,
        te.WorkDescription AS ServiceDescription,
        CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
        END AS Hours,
        s.CostRate AS StaffCostRate,
        c.BillingRate AS ClientBillingRate,
        CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * s.CostRate
        END AS ServiceCost,
        CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * c.BillingRate
        END AS BillableAmount,
        CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * (c.BillingRate - s.CostRate)
        END AS Profit
    FROM TimeEntries te
    INNER JOIN Staff s ON te.StaffID = s.StaffID
    INNER JOIN Clients c ON te.ClientID = c.ClientID
    INNER JOIN OfficeLocations ol ON te.OfficeLocationID = ol.OfficeLocationID
    WHERE te.WorkDate BETWEEN @StartDate AND @EndDate
        AND te.TimeFinished IS NOT NULL -- Only completed entries
        AND (@ClientID IS NULL OR c.ClientID = @ClientID)
    ORDER BY 
        c.ClientName,
        te.WorkDate,
        s.StaffName;
END
GO

-- Summary Report: Client Totals
IF OBJECT_ID('dbo.sp_ClientBillingSummary', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_ClientBillingSummary;
GO

CREATE PROCEDURE sp_ClientBillingSummary
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.ClientID,
        c.ClientName,
        c.BillingRate,
        COUNT(te.TimeEntryID) AS TotalEntries,
        SUM(CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
        END) AS TotalHours,
        SUM(CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * s.CostRate
        END) AS TotalCost,
        SUM(CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * c.BillingRate
        END) AS TotalBillableAmount,
        SUM(CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * (c.BillingRate - s.CostRate)
        END) AS TotalProfit
    FROM TimeEntries te
    INNER JOIN Staff s ON te.StaffID = s.StaffID
    INNER JOIN Clients c ON te.ClientID = c.ClientID
    WHERE te.WorkDate BETWEEN @StartDate AND @EndDate
        AND te.TimeFinished IS NOT NULL
    GROUP BY 
        c.ClientID,
        c.ClientName,
        c.BillingRate
    ORDER BY 
        TotalBillableAmount DESC;
END
GO

-- Helper Procedure: Date Range Query (as requested)
IF OBJECT_ID('dbo.sp_DateRangeHours', 'P') IS NOT NULL DROP PROCEDURE dbo.sp_DateRangeHours;
GO

CREATE PROCEDURE sp_DateRangeHours
    @StartDate DATE,
    @EndDate DATE
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        s.StaffID,
        s.StaffName,
        c.ClientID,
        c.ClientName,
        COUNT(te.TimeEntryID) AS Entries,
        SUM(CASE 
            WHEN te.TimeFinished IS NULL THEN 0
            ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
        END) AS TotalHours
    FROM TimeEntries te
    INNER JOIN Staff s ON te.StaffID = s.StaffID
    INNER JOIN Clients c ON te.ClientID = c.ClientID
    WHERE te.WorkDate BETWEEN @StartDate AND @EndDate
        AND te.TimeFinished IS NOT NULL
    GROUP BY 
        s.StaffID,
        s.StaffName,
        c.ClientID,
        c.ClientName
    ORDER BY 
        s.StaffName,
        c.ClientName;
END
GO

PRINT 'Report stored procedures created successfully!';
GO

