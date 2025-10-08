// Run this script to add the InvoiceNumber field to your database
// Usage: node run-invoice-migration.js

const { getConnection, sql, closeConnection } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🚀 Starting Invoice Number Migration...\n');
    
    try {
        // Read the SQL migration file
        const sqlFile = path.join(__dirname, 'database', 'add-invoice-number.sql');
        const sqlScript = fs.readFileSync(sqlFile, 'utf8');
        
        // Get database connection
        const pool = await getConnection();
        console.log('✅ Connected to database\n');
        
        // Split by GO statements and execute each batch
        const batches = sqlScript
            .split(/\nGO\n|\nGO\r\n/gi)
            .map(batch => batch.trim())
            .filter(batch => batch.length > 0 && !batch.startsWith('--'));
        
        console.log(`📝 Running ${batches.length} SQL batches...\n`);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            if (batch && batch.trim()) {
                try {
                    const result = await pool.request().query(batch);
                    if (result.recordset) {
                        console.log(`Batch ${i + 1}: ✅`);
                    }
                } catch (err) {
                    // Some batches might fail if column already exists, that's ok
                    if (err.message.includes('already exists')) {
                        console.log(`Batch ${i + 1}: ⚠️  Already exists (skipped)`);
                    } else {
                        console.log(`Batch ${i + 1}: ❌ ${err.message}`);
                    }
                }
            }
        }
        
        // Verify the column was added
        console.log('\n🔍 Verifying InvoiceNumber column...');
        const checkResult = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'TimeEntries' 
            AND COLUMN_NAME = 'InvoiceNumber'
        `);
        
        if (checkResult.recordset.length > 0) {
            console.log('✅ InvoiceNumber column verified!');
            console.log(`   Type: ${checkResult.recordset[0].DATA_TYPE}(${checkResult.recordset[0].CHARACTER_MAXIMUM_LENGTH})`);
        } else {
            console.log('❌ InvoiceNumber column not found!');
        }
        
        console.log('\n✨ Migration completed successfully!');
        console.log('🎉 You can now use invoice tracking features in the admin dashboard.\n');
        
        await closeConnection();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nPlease check:');
        console.error('1. Database is running');
        console.error('2. .env file has correct credentials');
        console.error('3. TimeEntries table exists\n');
        
        await closeConnection();
        process.exit(1);
    }
}

// Run the migration
runMigration();

