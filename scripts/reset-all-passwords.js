/**
 * Reset All User Passwords
 * 
 * This script resets all user passwords to match their username
 * (e.g., username "test" gets password "test123")
 * 
 * Useful for development/testing when you have users from before the auth system.
 */

const { getConnection, sql } = require('../config/database');
const bcrypt = require('bcrypt');

async function resetAllPasswords() {
    try {
        console.log('========================================');
        console.log('   Reset All User Passwords');
        console.log('========================================\n');
        
        const pool = await getConnection();
        
        // Get all users
        const users = await pool.request().query('SELECT UserID, Username, Role FROM Users');
        
        console.log(`Found ${users.recordset.length} users\n`);
        
        for (const user of users.recordset) {
            let newPassword;
            
            // Set password based on username
            if (user.Username === 'admin') {
                newPassword = 'admin123';
            } else {
                newPassword = user.Username + '123'; // e.g., test -> test123
            }
            
            // Hash password
            const passwordHash = await bcrypt.hash(newPassword, 10);
            
            // Update user
            await pool.request()
                .input('userId', sql.Int, user.UserID)
                .input('passwordHash', sql.NVarChar, passwordHash)
                .query('UPDATE Users SET PasswordHash = @passwordHash WHERE UserID = @userId');
            
            console.log(`✓ ${user.Username} - Password set to: ${newPassword}`);
        }
        
        console.log('\n========================================');
        console.log('✅ All passwords reset!');
        console.log('========================================\n');
        console.log('User Credentials:');
        
        users.recordset.forEach(user => {
            const password = user.Username === 'admin' ? 'admin123' : user.Username + '123';
            console.log(`  ${user.Username} / ${password} (${user.Role})`);
        });
        
        console.log('\n⚠️  Remember to change these passwords after logging in!\n');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    } finally {
        const { closeConnection } = require('../config/database');
        await closeConnection();
        process.exit(0);
    }
}

resetAllPasswords();

