/**
 * Fix Users Table - Add Missing Columns
 * 
 * This script ensures the Users table has all required columns
 * for the authentication system.
 */

const { getConnection } = require('../config/database');

async function fixUsersTable() {
    try {
        console.log('========================================');
        console.log('   Fixing Users Table');
        console.log('========================================\n');
        
        const pool = await getConnection();
        
        // Check and add LastLoginDate column
        console.log('Checking for LastLoginDate column...');
        const checkLastLogin = await pool.request().query(`
            SELECT COUNT(*) AS ColumnExists
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'LastLoginDate'
        `);

        if (checkLastLogin.recordset[0].ColumnExists === 0) {
            console.log('  → Adding LastLoginDate column...');
            await pool.request().query(`
                ALTER TABLE Users
                ADD LastLoginDate DATETIME NULL
            `);
            console.log('  ✓ LastLoginDate column added!');
        } else {
            console.log('  ✓ LastLoginDate column already exists');
        }

        // Verify all required columns exist
        console.log('\nVerifying Users table structure...');
        const columns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users'
            ORDER BY ORDINAL_POSITION
        `);

        console.log('\nUsers table columns:');
        columns.recordset.forEach(col => {
            console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });

        console.log('\n========================================');
        console.log('✓ Users table is now up to date!');
        console.log('========================================\n');
        console.log('You can now try logging in again.\n');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        console.error('\nMake sure:');
        console.error('1. SQL Server is running');
        console.error('2. TimeTrackDB database exists');
        console.error('3. Users table exists');
    } finally {
        const { closeConnection } = require('../config/database');
        await closeConnection();
        process.exit(0);
    }
}

fixUsersTable();

