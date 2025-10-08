/**
 * Fix User Roles
 * 
 * This script standardizes all user roles to lowercase:
 * - "Admin" or "ADMIN" -> "admin"
 * - "User" or "USER" or "Manager" -> "user"
 */

const { getConnection, sql } = require('../config/database');

async function fixUserRoles() {
    try {
        
        const pool = await getConnection();
        
        // Get all users
        const users = await pool.request().query('SELECT UserID, Username, Role FROM Users');
        
        users.recordset.forEach(u => {
        });
        
        let updatedCount = 0;
        
        // Fix each user's role
        for (const user of users.recordset) {
            let newRole = null;
            const currentRole = user.Role.toLowerCase();
            
            if (currentRole === 'admin') {
                newRole = 'admin';
            } else if (currentRole === 'user' || currentRole === 'manager') {
                newRole = 'user';
            } else {
                // Unknown role, default to user
                newRole = 'user';
            }
            
            // Update if role is different (accounting for case)
            if (user.Role !== newRole) {
                await pool.request()
                    .input('userId', sql.Int, user.UserID)
                    .input('role', sql.NVarChar, newRole)
                    .query('UPDATE Users SET Role = @role WHERE UserID = @userId');
                
                updatedCount++;
            }
        }
        
        if (updatedCount === 0) {
        } else {
        }
        
        // Show final state
        const finalUsers = await pool.request().query('SELECT Username, Role FROM Users');
        finalUsers.recordset.forEach(u => {
        });
        

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    } finally {
        const { closeConnection } = require('../config/database');
        await closeConnection();
        process.exit(0);
    }
}

fixUserRoles();

