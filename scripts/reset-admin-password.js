/**
 * Reset Admin Password Script
 * 
 * This script resets the admin user password to the default 'admin123'
 * Use this if you forget your admin password or need to reset it.
 * 
 * Usage: npm run reset-admin-password
 */

const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
    try {
        
        const pool = await getConnection();
        
        // Hash the default password
        const passwordHash = await bcrypt.hash('admin123', 10);

        // Update admin user
        const result = await pool.request()
            .input('username', sql.NVarChar, 'admin')
            .input('email', sql.NVarChar, 'admin@timetrack.com')
            .input('passwordHash', sql.NVarChar, passwordHash)
            .input('role', sql.NVarChar, 'admin')
            .query(`
                UPDATE Users 
                SET Email = @email,
                    PasswordHash = @passwordHash,
                    Role = @role,
                    IsActive = 1
                WHERE Username = @username
            `);

        if (result.rowsAffected[0] === 0) {
            
            await pool.request()
                .input('username', sql.NVarChar, 'admin')
                .input('email', sql.NVarChar, 'admin@timetrack.com')
                .input('passwordHash', sql.NVarChar, passwordHash)
                .input('role', sql.NVarChar, 'admin')
                .query(`
                    INSERT INTO Users (Username, Email, PasswordHash, Role)
                    VALUES (@username, @email, @passwordHash, @role)
                `);
            
        } else {
        }


    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('\nMake sure:');
        console.error('1. SQL Server is running');
        console.error('2. TimeTrackDB database exists');
        console.error('3. Users table exists (run database/users-schema.sql)');
    } finally {
        const { closeConnection } = require('../config/database');
        await closeConnection();
        process.exit(0);
    }
}

resetAdminPassword();

