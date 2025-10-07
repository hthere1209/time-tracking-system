const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

// Import routes
const staffRoutes = require('./routes/staff');
const clientRoutes = require('./routes/clients');
const officeRoutes = require('./routes/offices');
const timeEntryRoutes = require('./routes/timeEntries');
const reportRoutes = require('./routes/reports');

// Import seed function
const { seedDatabase } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/staff', staffRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'TimeTrack API is running' });
});

// Serve the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

// Handle 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, async () => {
    console.log(`TimeTrack server running on http://localhost:${PORT}`);
    console.log(`Main interface: http://localhost:${PORT}`);
    console.log(`Admin interface: http://localhost:${PORT}/admin`);
    console.log(`Reports interface: http://localhost:${PORT}/reports`);
    console.log('');
    
    // Automatically seed database with sample data if empty
    try {
        await seedDatabase();
    } catch (err) {
        console.error('⚠ Failed to seed database:', err.message);
        console.error('Server will continue running, but you may need to add data manually.');
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    const { closeConnection } = require('./config/database');
    await closeConnection();
    process.exit(0);
});

