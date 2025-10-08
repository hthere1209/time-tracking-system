const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getConnection, sql } = require('../config/database');

router.post('/signup', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        const pool = await getConnection();
        
        const checkUser = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .query(`
                SELECT UserID FROM Users 
                WHERE Username = @username OR Email = @email
            `);

        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('email', sql.NVarChar, email)
            .input('passwordHash', sql.NVarChar, passwordHash)
            .query(`
                INSERT INTO Users (Username, Email, PasswordHash, Role)
                OUTPUT INSERTED.UserID, INSERTED.Username, INSERTED.Email, INSERTED.Role
                VALUES (@username, @email, @passwordHash, 'user')
            `);

        const user = result.recordset[0];

        req.session.user = {
            userId: user.UserID,
            username: user.Username,
            email: user.Email,
            role: user.Role
        };

        res.status(201).json({ 
            message: 'Account created successfully',
            user: {
                userId: user.UserID,
                username: user.Username,
                email: user.Email,
                role: user.Role
            }
        });
    } catch (err) {
        console.error('Error signing up:', err);
        res.status(500).json({ error: 'Failed to create account', message: err.message });
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const pool = await getConnection();
        
        const result = await pool.request()
            .input('usernameOrEmail', sql.NVarChar, username)
            .query(`
                SELECT UserID, Username, Email, PasswordHash, Role, IsActive
                FROM Users 
                WHERE Username = @usernameOrEmail OR Email = @usernameOrEmail
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = result.recordset[0];

        if (!user.IsActive) {
            return res.status(401).json({ error: 'Account is disabled' });
        }

        const passwordMatch = await bcrypt.compare(password, user.PasswordHash);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        await pool.request()
            .input('userId', sql.Int, user.UserID)
            .query(`
                UPDATE Users 
                SET LastLoginDate = GETDATE() 
                WHERE UserID = @userId
            `);

        req.session.user = {
            userId: user.UserID,
            username: user.Username,
            email: user.Email,
            role: user.Role
        };

        res.json({ 
            message: 'Login successful',
            user: {
                userId: user.UserID,
                username: user.Username,
                email: user.Email,
                role: user.Role
            }
        });
    } catch (err) {
        console.error('Error signing in:', err);
        res.status(500).json({ error: 'Failed to sign in', message: err.message });
    }
});

router.post('/signout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to sign out' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Signed out successfully' });
    });
});

router.get('/me', (req, res) => {
    if (req.session.user) {
        res.json({ 
            authenticated: true,
            user: req.session.user 
        });
    } else {
        res.json({ authenticated: false });
    }
});

router.get('/check', (req, res) => {
    res.json({ 
        authenticated: !!req.session.user,
        user: req.session.user || null
    });
});

module.exports = router;

