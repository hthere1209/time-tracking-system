const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const staffRoutes = require('./routes/staff');
const clientRoutes = require('./routes/clients');
const officeRoutes = require('./routes/offices');
const timeEntryRoutes = require('./routes/timeEntries');
const reportRoutes = require('./routes/reports');

// Import middleware
const { checkAuth, checkAdmin } = require('./middleware/auth');

// Import seed function
const { seedDatabase } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'timetrack-secret-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Authentication routes (no auth required)
app.use('/api/auth', authRoutes);

// API Routes (all require authentication)
app.use('/api/staff', staffRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'TimeTrack API is running' });
});

// Serve the main application pages
// Punch clock - accessible to all authenticated users
app.get('/', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin and Reports pages - admin only
app.get('/admin', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/reports', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

// Users page - authenticated users only
app.get('/users', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'users.html'));
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
    console.log('');
    console.log('========================================');
    console.log('   ⏱️  TimeTrack Server Started');
    console.log('========================================');
    console.log(`🌐 Server: http://localhost:${PORT}`);
    console.log('');
    console.log('📍 Pages:');
    console.log(`   Punch Clock: http://localhost:${PORT}`);
    console.log(`   Login:       http://localhost:${PORT}/login.html`);
    console.log(`   Sign Up:     http://localhost:${PORT}/signup.html`);
    console.log(`   Admin:       http://localhost:${PORT}/admin (admin only)`);
    console.log(`   Reports:     http://localhost:${PORT}/reports (admin only)`);
    console.log(`   Users:       http://localhost:${PORT}/users (regular users)`);
    console.log('');
    console.log('👤 Default Admin Account:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   ⚠️  Please change this password after first login!');
    console.log('========================================');
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

