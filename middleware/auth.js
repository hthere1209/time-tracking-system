// Authentication middleware

// Check if user is authenticated
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Check if user is an admin
function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role && req.session.user.role.toLowerCase() === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

// Check if user is authenticated (for serving HTML pages)
function checkAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
}

// Check if user is admin (for serving HTML pages)
function checkAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role && req.session.user.role.toLowerCase() === 'admin') {
        next();
    } else {
        res.redirect('/users');
    }
}

module.exports = {
    requireAuth,
    requireAdmin,
    checkAuth,
    checkAdmin
};

