const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Staff Work Report
router.get('/staff-work', async (req, res) => {
    try {
        const { startDate, endDate, staffId } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        const pool = await getConnection();
        const result = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('staffId', sql.Int, staffId || null)
            .execute('sp_StaffWorkReport');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error generating staff work report:', err);
        res.status(500).json({ error: 'Failed to generate staff work report', message: err.message });
    }
});

// Client Billing Report
router.get('/client-billing', async (req, res) => {
    try {
        const { startDate, endDate, clientId } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }
        
        const pool = await getConnection();
        const result = await pool.request()
            .input('startDate', sql.Date, startDate)
            .input('endDate', sql.Date, endDate)
            .input('clientId', sql.Int, clientId || null)
            .execute('sp_ClientBillingReport');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error generating client billing report:', err);
        res.status(500).json({ error: 'Failed to generate client billing report', message: err.message });
    }
});

// Client Billing Summary Report
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
            .execute('sp_ClientBillingSummary');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error generating client billing summary:', err);
        res.status(500).json({ error: 'Failed to generate client billing summary', message: err.message });
    }
});

// Date Range Hours Report
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
            .execute('sp_DateRangeHours');
        
        res.json(result.recordset);
    } catch (err) {
        console.error('Error generating date range hours report:', err);
        res.status(500).json({ error: 'Failed to generate date range hours report', message: err.message });
    }
});

// Dashboard Summary Statistics
router.get('/dashboard-stats', async (req, res) => {
    try {
        const pool = await getConnection();
        
        // Get multiple statistics in parallel
        const [todayHours, currentlyPunchedIn, thisWeekStats, thisMonthStats] = await Promise.all([
            // Today's total hours
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
            
            // Currently punched in count
            pool.request().query(`
                SELECT COUNT(*) AS Count
                FROM TimeEntries
                WHERE IsPunchedIn = 1
            `),
            
            // This week stats
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
            
            // This month stats
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

