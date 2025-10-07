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
        console.log('========================================');
        console.log('   Reset Admin Password');
        console.log('========================================\n');
        
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
            console.log('❌ Admin user not found!');
            console.log('\nCreating new admin user...');
            
            await pool.request()
                .input('username', sql.NVarChar, 'admin')
                .input('email', sql.NVarChar, 'admin@timetrack.com')
                .input('passwordHash', sql.NVarChar, passwordHash)
                .input('role', sql.NVarChar, 'admin')
                .query(`
                    INSERT INTO Users (Username, Email, PasswordHash, Role)
                    VALUES (@username, @email, @passwordHash, @role)
                `);
            
            console.log('✓ Admin user created!');
        } else {
            console.log('✓ Admin password reset successfully!');
        }

        console.log('\n========================================');
        console.log('   Default Admin Credentials');
        console.log('========================================');
        console.log('Username: admin');
        console.log('Password: admin123');
        console.log('========================================\n');
        console.log('⚠️  Please change this password after login!\n');
        console.log('Login at: http://localhost:3000/login.html\n');

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

