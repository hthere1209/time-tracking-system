const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Get all time entries with optional filters
router.get('/', async (req, res) => {
    try {
        const { startDate, endDate, staffId, clientId } = req.query;
        
        const pool = await getConnection();
        let query = `
            SELECT 
                te.EntryID,
                te.StaffID,
                s.StaffName,
                te.ClientID,
                c.ClientName,
                te.LocationID,
                ol.LocationName,
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
            INNER JOIN OfficeLocations ol ON te.LocationID = ol.LocationID
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        if (startDate) {
            query += ' AND te.WorkDate >= @startDate';
            request.input('startDate', sql.Date, startDate);
        }
        
        if (endDate) {
            query += ' AND te.WorkDate <= @endDate';
            request.input('endDate', sql.Date, endDate);
        }
        
        if (staffId) {
            query += ' AND te.StaffID = @staffId';
            request.input('staffId', sql.Int, staffId);
        }
        
        if (clientId) {
            query += ' AND te.ClientID = @clientId';
            request.input('clientId', sql.Int, clientId);
        }
        
        query += ' ORDER BY te.WorkDate DESC, te.TimeStarted DESC';
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching time entries:', err);
        res.status(500).json({ error: 'Failed to fetch time entries', message: err.message });
    }
});

// Get today's time entries (for admin dashboard)
router.get('/today', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT 
                    te.EntryID,
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
                INNER JOIN OfficeLocations ol ON te.LocationID = ol.LocationID
                WHERE te.WorkDate = CAST(GETDATE() AS DATE)
                ORDER BY TimeStarted DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching today\'s entries:', err);
        res.status(500).json({ error: 'Failed to fetch today\'s entries', message: err.message });
    }
});

// Get currently punched in staff
router.get('/punched-in', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT 
                    te.EntryID,
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
                INNER JOIN OfficeLocations ol ON te.LocationID = ol.LocationID
                WHERE te.IsPunchedIn = 1
                ORDER BY TimeStarted
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching punched in staff:', err);
        res.status(500).json({ error: 'Failed to fetch punched in staff', message: err.message });
    }
});

// Punch In - Create new time entry
router.post('/punch-in', async (req, res) => {
    try {
        const { staffId, clientId, officeLocationId, workDescription } = req.body;
        console.log(req.body);
        if (!staffId || !clientId || !officeLocationId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Check if user is logged in
        if (!req.session.user || !req.session.user.email) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Please log in to punch in'
            });
        }
        
        const pool = await getConnection();
        
        // Verify that logged-in user's email matches staff member's email
        const staffCheck = await pool.request()
            .input('staffId', sql.Int, staffId)
            .query(`
                SELECT Email
                FROM Staff
                WHERE StaffID = @staffId AND IsActive = 1
            `);
        
        if (staffCheck.recordset.length === 0) {
            return res.status(404).json({ 
                error: 'Staff member not found or inactive'
            });
        }
        
        const staffEmail = staffCheck.recordset[0].Email;
        const userEmail = req.session.user.email;
        const userRole = req.session.user.role;
        
        // Admin users can punch in for anyone, regular users only for matching email
        const isAdmin = userRole && userRole.toLowerCase() === 'admin';
        
        if (!isAdmin) {
            // Compare emails (case-insensitive) for non-admin users
            if (!staffEmail || staffEmail.toLowerCase() !== userEmail.toLowerCase()) {
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'Your email does not match the selected staff member. You can only punch in for yourself.'
                });
            }
        }
        
        // Check if staff is already punched in
        const checkResult = await pool.request()
            .input('staffId', sql.Int, staffId)
            .query(`
                SELECT COUNT(*) AS Count
                FROM TimeEntries
                WHERE StaffID = @staffId AND IsPunchedIn = 1
            `);
        
        if (checkResult.recordset[0].Count > 0) {
            return res.status(400).json({ 
                error: 'Staff member is already punched in',
                message: 'Please punch out before starting a new entry'
            });
        }
        
        // Create new time entry
        const result = await pool.request()
            .input('staffId', sql.Int, staffId)
            .input('clientId', sql.Int, clientId)
            .input('officeLocationId', sql.Int, officeLocationId)
            .input('workDescription', sql.NVarChar, workDescription || null)
            .query(`
                INSERT INTO TimeEntries (StaffID, ClientID, LocationID, WorkDate, TimeStarted, WorkDescription, IsPunchedIn)
                OUTPUT INSERTED.EntryID
                VALUES (@staffId, @clientId, @officeLocationId, CAST(GETDATE() AS DATE), GETDATE(), @workDescription, 1)
            `);
        
        res.status(201).json({ 
            message: 'Punched in successfully',
            timeEntryId: result.recordset[0].EntryID
        });
    } catch (err) {
        console.error('Error punching in:', err);
        res.status(500).json({ error: 'Failed to punch in', message: err.message });
    }
});

// Punch Out - Complete time entry
router.post('/punch-out', async (req, res) => {
    try {
        const { staffId, workDescription } = req.body;
        
        if (!staffId) {
            return res.status(400).json({ error: 'Staff ID is required' });
        }
        
        // Check if user is logged in
        if (!req.session.user || !req.session.user.email) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Please log in to punch out'
            });
        }
        
        const pool = await getConnection();
        
        // Verify that logged-in user's email matches staff member's email
        const staffCheck = await pool.request()
            .input('staffId', sql.Int, staffId)
            .query(`
                SELECT Email
                FROM Staff
                WHERE StaffID = @staffId AND IsActive = 1
            `);
        
        if (staffCheck.recordset.length === 0) {
            return res.status(404).json({ 
                error: 'Staff member not found or inactive'
            });
        }
        
        const staffEmail = staffCheck.recordset[0].Email;
        const userEmail = req.session.user.email;
        const userRole = req.session.user.role;
        
        // Admin users can punch out for anyone, regular users only for matching email
        const isAdmin = userRole && userRole.toLowerCase() === 'admin';
        
        if (!isAdmin) {
            // Compare emails (case-insensitive) for non-admin users
            if (!staffEmail || staffEmail.toLowerCase() !== userEmail.toLowerCase()) {
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'Your email does not match the selected staff member. You can only punch out for yourself.'
                });
            }
        }
        
        // Find active punch-in entry
        const checkResult = await pool.request()
            .input('staffId', sql.Int, staffId)
            .query(`
                SELECT EntryID
                FROM TimeEntries
                WHERE StaffID = @staffId AND IsPunchedIn = 1
            `);
        
        if (checkResult.recordset.length === 0) {
            return res.status(400).json({ 
                error: 'No active punch-in found',
                message: 'Staff member is not currently punched in'
            });
        }
        
        // Update time entry
        const timeEntryId = checkResult.recordset[0].EntryID;
        await pool.request()
            .input('timeEntryId', sql.Int, timeEntryId)
            .input('workDescription', sql.NVarChar, workDescription || null)
            .query(`
                UPDATE TimeEntries
                SET TimeFinished = GETDATE(),
                    IsPunchedIn = 0,
                    ModifiedDate = GETDATE()
                    ${workDescription ? ', WorkDescription = @workDescription' : ''}
                WHERE EntryID = @timeEntryId
            `);
        
        res.json({ 
            message: 'Punched out successfully',
            timeEntryId: timeEntryId
        });
    } catch (err) {
        console.error('Error punching out:', err);
        res.status(500).json({ error: 'Failed to punch out', message: err.message });
    }
});

// Get specific time entry
router.get('/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('timeEntryId', sql.Int, req.params.id)
            .query(`
                SELECT 
                    te.EntryID,
                    te.StaffID,
                    s.StaffName,
                    te.ClientID,
                    c.ClientName,
                    te.LocationID,
                    ol.LocationName,
                    te.WorkDate,
                    te.TimeStarted,
                    te.TimeFinished,
                    te.WorkDescription,
                    CASE 
                        WHEN te.TimeFinished IS NULL THEN DATEDIFF(MINUTE, te.TimeStarted, GETDATE()) / 60.0
                        ELSE DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0
                    END AS Hours,
                    te.IsPunchedIn,
                    te.CreatedDate,
                    te.ModifiedDate
                FROM TimeEntries te
                INNER JOIN Staff s ON te.StaffID = s.StaffID
                INNER JOIN Clients c ON te.ClientID = c.ClientID
                INNER JOIN OfficeLocations ol ON te.LocationID = ol.LocationID
                WHERE te.EntryID = @timeEntryId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Time entry not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching time entry:', err);
        res.status(500).json({ error: 'Failed to fetch time entry', message: err.message });
    }
});

// Update time entry (admin function)
router.put('/:id', async (req, res) => {
    try {
        const { staffId, clientId, officeLocationId, workDate, timeStarted, timeFinished, workDescription } = req.body;
        
        const pool = await getConnection();
        await pool.request()
            .input('timeEntryId', sql.Int, req.params.id)
            .input('staffId', sql.Int, staffId)
            .input('clientId', sql.Int, clientId)
            .input('officeLocationId', sql.Int, officeLocationId)
            .input('workDate', sql.Date, workDate)
            .input('timeStarted', sql.DateTime, timeStarted)
            .input('timeFinished', sql.DateTime, timeFinished || null)
            .input('workDescription', sql.NVarChar, workDescription || null)
            .input('isPunchedIn', sql.Bit, timeFinished ? 0 : 1)
            .query(`
                UPDATE TimeEntries
                SET StaffID = @staffId,
                    ClientID = @clientId,
                    LocationID = @officeLocationId,
                    WorkDate = @workDate,
                    TimeStarted = @timeStarted,
                    TimeFinished = @timeFinished,
                    WorkDescription = @workDescription,
                    IsPunchedIn = @isPunchedIn,
                    ModifiedDate = GETDATE()
                WHERE EntryID = @timeEntryId
            `);
        
        res.json({ message: 'Time entry updated successfully' });
    } catch (err) {
        console.error('Error updating time entry:', err);
        res.status(500).json({ error: 'Failed to update time entry', message: err.message });
    }
});

// Delete time entry (admin function)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        await pool.request()
            .input('timeEntryId', sql.Int, req.params.id)
            .query(`
                DELETE FROM TimeEntries
                WHERE EntryID = @timeEntryId
            `);
        
        res.json({ message: 'Time entry deleted successfully' });
    } catch (err) {
        console.error('Error deleting time entry:', err);
        res.status(500).json({ error: 'Failed to delete time entry', message: err.message });
    }
});

module.exports = router;

