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
        console.log('========================================');
        console.log('   Fixing User Roles');
        console.log('========================================\n');
        
        const pool = await getConnection();
        
        // Get all users
        const users = await pool.request().query('SELECT UserID, Username, Role FROM Users');
        
        console.log('Current users:');
        users.recordset.forEach(u => {
            console.log(`  ${u.Username} - Role: "${u.Role}"`);
        });
        console.log('');
        
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
                
                console.log(`✓ Updated ${user.Username}: "${user.Role}" -> "${newRole}"`);
                updatedCount++;
            }
        }
        
        if (updatedCount === 0) {
            console.log('✓ All roles are already correct!');
        } else {
            console.log(`\n✓ Updated ${updatedCount} user role(s)`);
        }
        
        // Show final state
        const finalUsers = await pool.request().query('SELECT Username, Role FROM Users');
        console.log('\nFinal user roles:');
        finalUsers.recordset.forEach(u => {
            console.log(`  ${u.Username} - Role: "${u.Role}"`);
        });
        
        console.log('\n========================================');
        console.log('✓ User roles standardized!');
        console.log('========================================\n');
        console.log('Valid roles are now:');
        console.log('  - admin: Full access to Admin and Reports');
        console.log('  - user: Access to Users page (read-only)\n');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
    } finally {
        const { closeConnection } = require('../config/database');
        await closeConnection();
        process.exit(0);
    }
}

fixUserRoles();

