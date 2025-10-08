// Simple script to add InvoiceNumber field to TimeEntries table
const { getConnection, closeConnection } = require('./config/database');

async function addInvoiceField() {
    console.log('🚀 Adding InvoiceNumber field to TimeEntries table...\n');
    
    try {
        const pool = await getConnection();
        console.log('✅ Connected to database\n');
        
        // Check if column exists
        console.log('🔍 Checking if InvoiceNumber column exists...');
        const checkColumn = await pool.request().query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'TimeEntries' 
            AND COLUMN_NAME = 'InvoiceNumber'
        `);
        
        if (checkColumn.recordset.length > 0) {
            console.log('✅ InvoiceNumber column already exists!\n');
        } else {
            console.log('➕ Adding InvoiceNumber column...');
            
            // Add the column
            await pool.request().query(`
                ALTER TABLE TimeEntries 
                ADD InvoiceNumber NVARCHAR(50) NULL
            `);
            
            console.log('✅ InvoiceNumber column added successfully!\n');
            
            // Add index
            console.log('📑 Creating index...');
            await pool.request().query(`
                CREATE INDEX IX_TimeEntries_InvoiceNumber 
                ON TimeEntries(InvoiceNumber)
                WHERE InvoiceNumber IS NOT NULL
            `);
            
            console.log('✅ Index created successfully!\n');
        }
        
        // Verify
        const verify = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'TimeEntries' 
            AND COLUMN_NAME = 'InvoiceNumber'
        `);
        
        if (verify.recordset.length > 0) {
            console.log('✨ Success! Column details:');
            console.log(`   Name: ${verify.recordset[0].COLUMN_NAME}`);
            console.log(`   Type: ${verify.recordset[0].DATA_TYPE}(${verify.recordset[0].CHARACTER_MAXIMUM_LENGTH})`);
            console.log('\n🎉 Invoice tracking is now ready to use!');
            console.log('   Refresh your browser to see the invoice fields.\n');
        }
        
        await closeConnection();
        process.exit(0);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        await closeConnection();
        process.exit(1);
    }
}

addInvoiceField();

