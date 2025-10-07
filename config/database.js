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

async function getConnection() {
    try {
        if (!pool) {
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

