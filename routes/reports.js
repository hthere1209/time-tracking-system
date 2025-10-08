const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

router.get('/staff-work', async (req, res) => {
    try {
        const { startDate, endDate, staffId } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        const pool = await getConnection();
        let query = `
            SELECT 
                s.StaffID,
                s.StaffName,
                ol.LocationName AS OfficeLocation,
                c.ClientID,
                c.ClientName,
                COUNT(te.EntryID) AS NumberOfEntries,
                SUM(CASE 
                    WHEN te.TimeFinished IS NULL THEN 0
                    ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
                END) AS TotalHours,
                s.HourlyCostRate AS StaffCostRate,
                c.HourlyBillingRate AS ClientBillingRate,
                SUM(CASE 
                    WHEN te.TimeFinished IS NULL THEN 0
                    ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * s.HourlyCostRate
                END) AS TotalCost,
                SUM(CASE 
                    WHEN te.TimeFinished IS NULL THEN 0
                    ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * c.HourlyBillingRate
                END) AS TotalRevenue,
                SUM(CASE 
                    WHEN te.TimeFinished IS NULL THEN 0
                    ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * (c.HourlyBillingRate - s.HourlyCostRate)
                END) AS TotalProfit
            FROM TimeEntries te
            INNER JOIN Staff s ON te.StaffID = s.StaffID
            INNER JOIN Clients c ON te.ClientID = c.ClientID
            INNER JOIN OfficeLocations ol ON te.LocationID = ol.LocationID
            WHERE te.WorkDate BETWEEN @startDate AND @endDate
                AND te.TimeFinished IS NOT NULL
        `;
        
        const request = pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate);
            
        if (staffId) {
            query += ' AND s.StaffID = @staffId';
            request.input('staffId', sql.Int, staffId);
        }
        
        query += `
            GROUP BY 
                s.StaffID, 
                s.StaffName, 
                ol.LocationName,
                c.ClientID,
                c.ClientName,
                s.HourlyCostRate,
                c.HourlyBillingRate
            ORDER BY 
                s.StaffName, 
                c.ClientName
        `;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error generating staff work report:', err);
        res.status(500).json({ error: 'Failed to generate staff work report', message: err.message });
    }
});

router.get('/client-billing', async (req, res) => {
    try {
        const { startDate, endDate, clientId } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        const pool = await getConnection();
        let query = `
            SELECT 
                c.ClientID,
                c.ClientName,
                te.EntryID,
                te.WorkDate,
                s.StaffName,
                ol.LocationName AS OfficeLocation,
                te.WorkDescription AS ServiceDescription,
                te.InvoiceNumber,
                CASE 
                    WHEN te.TimeFinished IS NULL THEN 0
                    ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
                END AS Hours,
                s.HourlyCostRate AS StaffCostRate,
                c.HourlyBillingRate AS ClientBillingRate,
                CASE 
                    WHEN te.TimeFinished IS NULL THEN 0
                    ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * s.HourlyCostRate
                END AS ServiceCost,
                CASE 
                    WHEN te.TimeFinished IS NULL THEN 0
                    ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * c.HourlyBillingRate
                END AS BillableAmount,
                CASE 
                    WHEN te.TimeFinished IS NULL THEN 0
                    ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * (c.HourlyBillingRate - s.HourlyCostRate)
                END AS Profit
            FROM TimeEntries te
            INNER JOIN Staff s ON te.StaffID = s.StaffID
            INNER JOIN Clients c ON te.ClientID = c.ClientID
            INNER JOIN OfficeLocations ol ON te.LocationID = ol.LocationID
            WHERE te.WorkDate BETWEEN @startDate AND @endDate
                AND te.TimeFinished IS NOT NULL
        `;
        
        const request = pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate);
            
        if (clientId) {
            query += ' AND c.ClientID = @clientId';
            request.input('clientId', sql.Int, clientId);
        }
        
        query += `
            ORDER BY 
                c.ClientName,
                te.WorkDate,
                s.StaffName
        `;
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error generating client billing report:', err);
        res.status(500).json({ error: 'Failed to generate client billing report', message: err.message });
    }
});

router.get('/client-billing-summary', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        const pool = await getConnection();
        const result = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`
                SELECT 
                    c.ClientID,
                    c.ClientName,
                    c.HourlyBillingRate AS BillingRate,
                    COUNT(te.EntryID) AS TotalEntries,
                    SUM(CASE 
                        WHEN te.TimeFinished IS NULL THEN 0
                        ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
                    END) AS TotalHours,
                    SUM(CASE 
                        WHEN te.TimeFinished IS NULL THEN 0
                        ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * s.HourlyCostRate
                    END) AS TotalCost,
                    SUM(CASE 
                        WHEN te.TimeFinished IS NULL THEN 0
                        ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * c.HourlyBillingRate
                    END) AS TotalBillableAmount,
                    SUM(CASE 
                        WHEN te.TimeFinished IS NULL THEN 0
                        ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * (c.HourlyBillingRate - s.HourlyCostRate)
                    END) AS TotalProfit
                FROM TimeEntries te
                INNER JOIN Staff s ON te.StaffID = s.StaffID
                INNER JOIN Clients c ON te.ClientID = c.ClientID
                WHERE te.WorkDate BETWEEN @startDate AND @endDate
                    AND te.TimeFinished IS NOT NULL
                GROUP BY 
                    c.ClientID,
                    c.ClientName,
                    c.HourlyBillingRate
                ORDER BY 
                    TotalBillableAmount DESC
            `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error generating client billing summary:', err);
        res.status(500).json({ error: 'Failed to generate client billing summary', message: err.message });
    }
});

router.get('/date-range-hours', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        const pool = await getConnection();
        const result = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .query(`
                SELECT 
                    s.StaffID,
                    s.StaffName,
                    c.ClientID,
                    c.ClientName,
                    COUNT(te.EntryID) AS Entries,
                    SUM(CASE 
                        WHEN te.TimeFinished IS NULL THEN 0
                        ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
                    END) AS TotalHours
                FROM TimeEntries te
                INNER JOIN Staff s ON te.StaffID = s.StaffID
                INNER JOIN Clients c ON te.ClientID = c.ClientID
                WHERE te.WorkDate BETWEEN @startDate AND @endDate
                    AND te.TimeFinished IS NOT NULL
                GROUP BY 
                    s.StaffID,
                    s.StaffName,
                    c.ClientID,
                    c.ClientName
                ORDER BY 
                    s.StaffName,
                    c.ClientName
            `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error generating date range hours report:', err);
        res.status(500).json({ error: 'Failed to generate date range hours report', message: err.message });
    }
});

router.get('/dashboard-stats', async (req, res) => {
    try {
        const pool = await getConnection();
        
        const [todayHours, currentlyPunchedIn, thisWeekStats, thisMonthStats] = await Promise.all([
            pool.request().query(`
                SELECT 
                    COUNT(DISTINCT StaffID) AS StaffCount,
                    SUM(CASE 
                        WHEN TimeFinished IS NULL THEN DATEDIFF(MINUTE, TimeStarted, GETDATE()) / 60.0
                        ELSE DATEDIFF(MINUTE, TimeStarted, TimeFinished) / 60.0
                    END) AS TotalHours
                FROM TimeEntries
                WHERE WorkDate = CAST(GETDATE() AS DATE)
            `),
            
            pool.request().query(`
                SELECT COUNT(*) AS Count
                FROM TimeEntries
                WHERE IsPunchedIn = 1
            `),
            
            pool.request().query(`
                SELECT 
                    COUNT(DISTINCT StaffID) AS StaffCount,
                    COUNT(DISTINCT ClientID) AS ClientCount,
                    SUM(CASE 
                        WHEN TimeFinished IS NULL THEN 0
                        ELSE DATEDIFF(MINUTE, TimeStarted, TimeFinished) / 60.0
                    END) AS TotalHours
                FROM TimeEntries
                WHERE WorkDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
                AND TimeFinished IS NOT NULL
            `),
            
            pool.request().query(`
                SELECT 
                    SUM(CASE 
                        WHEN TimeFinished IS NULL THEN 0
                        ELSE DATEDIFF(MINUTE, TimeStarted, TimeFinished) / 60.0
                    END) AS TotalHours,
                    SUM(CASE 
                        WHEN te.TimeFinished IS NULL THEN 0
                        ELSE (DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0) * c.HourlyBillingRate
                    END) AS TotalRevenue
                FROM TimeEntries te
                INNER JOIN Clients c ON te.ClientID = c.ClientID
                WHERE MONTH(WorkDate) = MONTH(GETDATE())
                AND YEAR(WorkDate) = YEAR(GETDATE())
                AND TimeFinished IS NOT NULL
            `)
        ]);
        
        res.json({
            today: todayHours.recordset[0],
            currentlyPunchedIn: currentlyPunchedIn.recordset[0].Count,
            thisWeek: thisWeekStats.recordset[0],
            thisMonth: thisMonthStats.recordset[0]
        });
    } catch (err) {
        console.error('Error generating dashboard stats:', err);
        res.status(500).json({ error: 'Failed to generate dashboard stats', message: err.message });
    }
});

module.exports = router;

