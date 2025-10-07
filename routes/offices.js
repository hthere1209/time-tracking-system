const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Get all active office locations
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT 
                    LocationID,
                    LocationName,
                    Address,
                    IsActive
                FROM OfficeLocations
                WHERE IsActive = 1
                ORDER BY LocationName
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching office locations:', err);
        res.status(500).json({ error: 'Failed to fetch office locations', message: err.message });
    }
});

// Get specific office location
router.get('/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('officeId', sql.Int, req.params.id)
            .query(`
                SELECT 
                    LocationID,
                    LocationName,
                    Address,
                    IsActive,
                    CreatedDate
                FROM OfficeLocations
                WHERE LocationID = @officeId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Office location not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching office location:', err);
        res.status(500).json({ error: 'Failed to fetch office location', message: err.message });
    }
});

// Create new office location
router.post('/', async (req, res) => {
    try {
        const { locationName, address } = req.body;
        
        if (!locationName) {
            return res.status(400).json({ error: 'Location name is required' });
        }
        
        const pool = await getConnection();
        const result = await pool.request()
            .input('locationName', sql.NVarChar, locationName)
            .input('address', sql.NVarChar, address || null)
            .query(`
                INSERT INTO OfficeLocations (LocationName, Address)
                OUTPUT INSERTED.LocationID
                VALUES (@locationName, @address)
            `);
        
        res.status(201).json({ 
            message: 'Office location created successfully',
            officeLocationId: result.recordset[0].LocationID
        });
    } catch (err) {
        console.error('Error creating office location:', err);
        res.status(500).json({ error: 'Failed to create office location', message: err.message });
    }
});

// Update office location
router.put('/:id', async (req, res) => {
    try {
        const { locationName, address, isActive } = req.body;
        
        const pool = await getConnection();
        await pool.request()
            .input('officeId', sql.Int, req.params.id)
            .input('locationName', sql.NVarChar, locationName)
            .input('address', sql.NVarChar, address || null)
            .input('isActive', sql.Bit, isActive !== undefined ? isActive : 1)
            .query(`
                UPDATE OfficeLocations
                SET LocationName = @locationName,
                    Address = @address,
                    IsActive = @isActive
                WHERE LocationID = @officeId
            `);
        
        res.json({ message: 'Office location updated successfully' });
    } catch (err) {
        console.error('Error updating office location:', err);
        res.status(500).json({ error: 'Failed to update office location', message: err.message });
    }
});

// Delete office location (soft delete - set IsActive = 0)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        await pool.request()
            .input('officeId', sql.Int, req.params.id)
            .query(`
                UPDATE OfficeLocations
                SET IsActive = 0
                WHERE LocationID = @officeId
            `);
        
        res.json({ message: 'Office location deleted successfully' });
    } catch (err) {
        console.error('Error deleting office location:', err);
        res.status(500).json({ error: 'Failed to delete office location', message: err.message });
    }
});

module.exports = router;

