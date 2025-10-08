const sql = require('mssql');
require('dotenv').config();

const config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'TimeTrackDB',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 1433,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

async function ensureDatabaseExists() {
    try {
        const masterConfig = { ...config, database: 'master' };
        const masterPool = await sql.connect(masterConfig);
        
        const result = await masterPool.request().query(`
            SELECT name FROM sys.databases WHERE name = '${config.database}'
        `);
        
        if (result.recordset.length === 0) {
            console.log(`⚠️  Database '${config.database}' does not exist.`);
            console.log(`🔧 Creating database '${config.database}'...`);
            
            await masterPool.request().query(`CREATE DATABASE ${config.database}`);
            console.log(`✓ Database '${config.database}' created successfully!`);
        }
        
        await masterPool.close();
        
    } catch (err) {
        console.error('Error checking/creating database:', err.message);
    }
}

async function getConnection() {
    try {
        if (!pool) {
            await ensureDatabaseExists();
            
            pool = await sql.connect(config);
            console.log('Connected to SQL Server database');
        }
        return pool;
    } catch (err) {
        console.error('Database connection error:', err);
        throw err;
    }
}

async function closeConnection() {
    try {
        if (pool) {
            await pool.close();
            pool = null;
            console.log('Database connection closed');
        }
    } catch (err) {
        console.error('Error closing database connection:', err);
    }
}

module.exports = {
    getConnection,
    closeConnection,
    sql
};

