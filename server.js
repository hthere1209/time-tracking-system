const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const staffRoutes = require('./routes/staff');
const clientRoutes = require('./routes/clients');
const officeRoutes = require('./routes/offices');
const timeEntryRoutes = require('./routes/timeEntries');
const reportRoutes = require('./routes/reports');

const { checkAuth, checkAdmin } = require('./middleware/auth');

const { seedDatabase } = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'timetrack-secret-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
    }
}));

app.use('/api/auth', authRoutes);

app.use('/api/staff', staffRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/offices', officeRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'TimeTrack API is running' });
});

app.get('/', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/reports', checkAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

app.get('/users', checkAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'users.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: err.message
    });
});

app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, async () => {

    console.log('TimeTrack Server Started');
    console.log(`Server: http://localhost:${PORT}`);

    // try {
    //     await seedDatabase();
    // } catch (err) {
    //     console.error('⚠ Failed to seed database:', err.message);
    //     console.error('Server will continue running, but you may need to add data manually.');
    // }
});

process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    // const { closeConnection } = require('./config/database');
    // await closeConnection();
    process.exit(0);
});

