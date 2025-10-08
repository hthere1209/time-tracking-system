/**
 * Fix Users Table - Add Missing Columns
 * 
 * This script ensures the Users table has all required columns
 * for the authentication system.
 */

const { getConnection } = require('../config/database');

async function fixUsersTable() {
    try {
        
        const pool = await getConnection();
        
        // Check and add LastLoginDate column
        const checkLastLogin = await pool.request().query(`
            SELECT COUNT(*) AS ColumnExists
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'LastLoginDate'
        `);

        if (checkLastLogin.recordset[0].ColumnExists === 0) {
            await pool.request().query(`
                ALTER TABLE Users
                ADD LastLoginDate DATETIME NULL
            `);
        } else {
        }

        // Verify all required columns exist
        const columns = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users'
            ORDER BY ORDINAL_POSITION
        `);

        columns.recordset.forEach(col => {
        });


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

