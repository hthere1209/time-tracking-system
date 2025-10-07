const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Get all active staff members
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT 
                    s.StaffID,
                    s.StaffName,
                    s.DefaultLocationID,
                    ol.LocationName,
                    s.Email,
                    s.IsActive
                FROM Staff s
                INNER JOIN OfficeLocations ol ON s.DefaultLocationID = ol.LocationID
                WHERE s.IsActive = 1
                ORDER BY s.StaffName
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching staff:', err);
        res.status(500).json({ error: 'Failed to fetch staff members', message: err.message });
    }
});

// Get specific staff member (with hidden fields for admin)
router.get('/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('staffId', sql.Int, req.params.id)
            .query(`
                SELECT 
                    s.StaffID,
                    s.StaffName,
                    s.DefaultLocationID,
                    ol.LocationName,
                    s.HourlyCostRate,
                    s.Email,
                    s.IsActive,
                    s.CreatedDate
                FROM Staff s
                INNER JOIN OfficeLocations ol ON s.DefaultLocationID = ol.LocationID
                WHERE s.StaffID = @staffId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Staff member not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching staff member:', err);
        res.status(500).json({ error: 'Failed to fetch staff member', message: err.message });
    }
});

// Create new staff member
router.post('/', async (req, res) => {
    try {
        const { staffName, officeLocationId, costRate, email } = req.body;
        
        if (!staffName || !officeLocationId || !costRate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const pool = await getConnection();
        const result = await pool.request()
            .input('staffName', sql.NVarChar, staffName)
            .input('officeLocationId', sql.Int, officeLocationId)
            .input('costRate', sql.Decimal(10, 2), costRate)
            .input('email', sql.NVarChar, email || null)
            .query(`
                INSERT INTO Staff (StaffName, DefaultLocationID, HourlyCostRate, Email)
                OUTPUT INSERTED.StaffID
                VALUES (@staffName, @officeLocationId, @costRate, @email)
            `);
        
        res.status(201).json({ 
            message: 'Staff member created successfully',
            staffId: result.recordset[0].StaffID
        });
    } catch (err) {
        console.error('Error creating staff member:', err);
        res.status(500).json({ error: 'Failed to create staff member', message: err.message });
    }
});

// Update staff member
router.put('/:id', async (req, res) => {
    try {
        const { staffName, officeLocationId, costRate, email, isActive } = req.body;
        
        const pool = await getConnection();
        await pool.request()
            .input('staffId', sql.Int, req.params.id)
            .input('staffName', sql.NVarChar, staffName)
            .input('officeLocationId', sql.Int, officeLocationId)
            .input('costRate', sql.Decimal(10, 2), costRate)
            .input('email', sql.NVarChar, email || null)
            .input('isActive', sql.Bit, isActive !== undefined ? isActive : 1)
            .query(`
                UPDATE Staff
                SET StaffName = @staffName,
                    DefaultLocationID = @officeLocationId,
                    HourlyCostRate = @costRate,
                    Email = @email,
                    IsActive = @isActive
                WHERE StaffID = @staffId
            `);
        
        res.json({ message: 'Staff member updated successfully' });
    } catch (err) {
        console.error('Error updating staff member:', err);
        res.status(500).json({ error: 'Failed to update staff member', message: err.message });
    }
});

// Check if staff is currently punched in
router.get('/:id/punch-status', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('staffId', sql.Int, req.params.id)
            .query(`
                SELECT TOP 1
                    EntryID,
                    ClientID,
                    TimeStarted,
                    WorkDescription,
                    DATEDIFF(MINUTE, TimeStarted, GETDATE()) / 60.0 AS CurrentHours
                FROM TimeEntries
                WHERE StaffID = @staffId AND IsPunchedIn = 1
                ORDER BY TimeStarted DESC
            `);
        
        if (result.recordset.length > 0) {
            res.json({ 
                isPunchedIn: true,
                currentEntry: result.recordset[0]
            });
        } else {
            res.json({ isPunchedIn: false });
        }
    } catch (err) {
        console.error('Error checking punch status:', err);
        res.status(500).json({ error: 'Failed to check punch status', message: err.message });
    }
});

// Delete staff member (soft delete - set IsActive = 0)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        await pool.request()
            .input('staffId', sql.Int, req.params.id)
            .query(`
                UPDATE Staff
                SET IsActive = 0
                WHERE StaffID = @staffId
            `);
        
        res.json({ message: 'Staff member deleted successfully' });
    } catch (err) {
        console.error('Error deleting staff member:', err);
        res.status(500).json({ error: 'Failed to delete staff member', message: err.message });
    }
});

module.exports = router;

