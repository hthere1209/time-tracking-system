const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

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
                te.InvoiceNumber,
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
                    te.InvoiceNumber,
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

router.post('/punch-in', async (req, res) => {
    try {
        const { staffId, clientId, officeLocationId, workDescription } = req.body;
        console.log(req.body);
        if (!staffId || !clientId || !officeLocationId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (!req.session.user || !req.session.user.email) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Please log in to punch in'
            });
        }
        
        const pool = await getConnection();
        
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
        
        const isAdmin = userRole && userRole.toLowerCase() === 'admin';
        
        if (!isAdmin) {
            if (!staffEmail || staffEmail.toLowerCase() !== userEmail.toLowerCase()) {
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'Your email does not match the selected staff member. You can only punch in for yourself.'
                });
            }
        }
        
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

router.post('/punch-out', async (req, res) => {
    try {
        const { staffId, workDescription } = req.body;
        
        if (!staffId) {
            return res.status(400).json({ error: 'Staff ID is required' });
        }
        
        if (!req.session.user || !req.session.user.email) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Please log in to punch out'
            });
        }
        
        const pool = await getConnection();
        
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
        
        const isAdmin = userRole && userRole.toLowerCase() === 'admin';
        
        if (!isAdmin) {
            if (!staffEmail || staffEmail.toLowerCase() !== userEmail.toLowerCase()) {
                return res.status(403).json({ 
                    error: 'Access denied',
                    message: 'Your email does not match the selected staff member. You can only punch out for yourself.'
                });
            }
        }
        
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

router.patch('/:id/invoice', async (req, res) => {
    try {
        const { invoiceNumber } = req.body;
        
        const pool = await getConnection();
        await pool.request()
            .input('timeEntryId', sql.Int, req.params.id)
            .input('invoiceNumber', sql.NVarChar, invoiceNumber || null)
            .query(`
                UPDATE TimeEntries
                SET InvoiceNumber = @invoiceNumber,
                    ModifiedDate = GETDATE()
                WHERE EntryID = @timeEntryId
            `);
        
        res.json({ 
            message: 'Invoice number updated successfully',
            invoiceNumber: invoiceNumber 
        });
    } catch (err) {
        console.error('Error updating invoice number:', err);
        res.status(500).json({ error: 'Failed to update invoice number', message: err.message });
    }
});

router.post('/bulk-invoice', async (req, res) => {
    try {
        const { entryIds, invoiceNumber } = req.body;
        
        if (!entryIds || !Array.isArray(entryIds) || entryIds.length === 0) {
            return res.status(400).json({ error: 'Entry IDs array is required' });
        }
        
        if (!invoiceNumber) {
            return res.status(400).json({ error: 'Invoice number is required' });
        }
        
        const pool = await getConnection();
        const request = pool.request()
            .input('invoiceNumber', sql.NVarChar, invoiceNumber);
        
        const idParams = entryIds.map((id, index) => {
            request.input(`id${index}`, sql.Int, id);
            return `@id${index}`;
        }).join(',');
        
        const result = await request.query(`
            UPDATE TimeEntries
            SET InvoiceNumber = @invoiceNumber,
                ModifiedDate = GETDATE()
            WHERE EntryID IN (${idParams})
        `);
        
        res.json({ 
            message: `Invoice number ${invoiceNumber} assigned to ${result.rowsAffected[0]} time entries`,
            updatedCount: result.rowsAffected[0],
            invoiceNumber: invoiceNumber
        });
    } catch (err) {
        console.error('Error bulk updating invoice numbers:', err);
        res.status(500).json({ error: 'Failed to bulk update invoice numbers', message: err.message });
    }
});

router.get('/status/uninvoiced', async (req, res) => {
    try {
        const { clientId, startDate, endDate } = req.query;
        
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
                DATEDIFF(MINUTE, te.TimeStarted, te.TimeFinished) / 60.0 AS Hours
            FROM TimeEntries te
            INNER JOIN Staff s ON te.StaffID = s.StaffID
            INNER JOIN Clients c ON te.ClientID = c.ClientID
            INNER JOIN OfficeLocations ol ON te.LocationID = ol.LocationID
            WHERE te.InvoiceNumber IS NULL
              AND te.IsPunchedIn = 0
              AND te.TimeFinished IS NOT NULL
        `;
        
        const request = pool.request();
        
        if (clientId) {
            query += ' AND te.ClientID = @clientId';
            request.input('clientId', sql.Int, clientId);
        }
        
        if (startDate) {
            query += ' AND te.WorkDate >= @startDate';
            request.input('startDate', sql.Date, startDate);
        }
        
        if (endDate) {
            query += ' AND te.WorkDate <= @endDate';
            request.input('endDate', sql.Date, endDate);
        }
        
        query += ' ORDER BY te.WorkDate DESC, te.TimeStarted DESC';
        
        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching uninvoiced entries:', err);
        res.status(500).json({ error: 'Failed to fetch uninvoiced entries', message: err.message });
    }
});

module.exports = router;

