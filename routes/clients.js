const express = require('express');
const router = express.Router();
const { getConnection, sql } = require('../config/database');

// Get all active clients
router.get('/', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .query(`
                SELECT 
                    ClientID,
                    ClientName,
                    ContactEmail,
                    ContactPhone,
                    Address,
                    IsActive
                FROM Clients
                WHERE IsActive = 1
                ORDER BY ClientName
            `);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching clients:', err);
        res.status(500).json({ error: 'Failed to fetch clients', message: err.message });
    }
});

// Get specific client (with hidden fields for admin)
router.get('/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('clientId', sql.Int, req.params.id)
            .query(`
                SELECT 
                    ClientID,
                    ClientName,
                    HourlyBillingRate,
                    ContactEmail,
                    ContactPhone,
                    Address,
                    IsActive,
                    CreatedDate
                FROM Clients
                WHERE ClientID = @clientId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching client:', err);
        res.status(500).json({ error: 'Failed to fetch client', message: err.message });
    }
});

// Create new client
router.post('/', async (req, res) => {
    try {
        const { clientName, billingRate, contactEmail, contactPhone, address } = req.body;
        
        if (!clientName || !billingRate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        const pool = await getConnection();
        const result = await pool.request()
            .input('clientName', sql.NVarChar, clientName)
            .input('billingRate', sql.Decimal(10, 2), billingRate)
            .input('contactEmail', sql.NVarChar, contactEmail || null)
            .input('contactPhone', sql.NVarChar, contactPhone || null)
            .input('address', sql.NVarChar, address || null)
            .query(`
                INSERT INTO Clients (ClientName, HourlyBillingRate, ContactEmail, ContactPhone, Address)
                OUTPUT INSERTED.ClientID
                VALUES (@clientName, @billingRate, @contactEmail, @contactPhone, @address)
            `);
        
        res.status(201).json({ 
            message: 'Client created successfully',
            clientId: result.recordset[0].ClientID
        });
    } catch (err) {
        console.error('Error creating client:', err);
        res.status(500).json({ error: 'Failed to create client', message: err.message });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    try {
        const { clientName, billingRate, contactEmail, contactPhone, address, isActive } = req.body;
        
        const pool = await getConnection();
        await pool.request()
            .input('clientId', sql.Int, req.params.id)
            .input('clientName', sql.NVarChar, clientName)
            .input('billingRate', sql.Decimal(10, 2), billingRate)
            .input('contactEmail', sql.NVarChar, contactEmail || null)
            .input('contactPhone', sql.NVarChar, contactPhone || null)
            .input('address', sql.NVarChar, address || null)
            .input('isActive', sql.Bit, isActive !== undefined ? isActive : 1)
            .query(`
                UPDATE Clients
                SET ClientName = @clientName,
                    HourlyBillingRate = @billingRate,
                    ContactEmail = @contactEmail,
                    ContactPhone = @contactPhone,
                    Address = @address,
                    IsActive = @isActive
                WHERE ClientID = @clientId
            `);
        
        res.json({ message: 'Client updated successfully' });
    } catch (err) {
        console.error('Error updating client:', err);
        res.status(500).json({ error: 'Failed to update client', message: err.message });
    }
});

module.exports = router;

