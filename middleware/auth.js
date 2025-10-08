function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}
function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role && req.session.user.role.toLowerCase() === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}
function checkAuth(req, res, next) {
    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login.html');
    }
}
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

