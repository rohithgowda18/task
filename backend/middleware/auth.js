const jwt = require('jsonwebtoken');

const AUTH_REQUIRED = process.env.AUTH_REQUIRED !== 'false'; // default true
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function authRequired(req, res, next) {
    if (!AUTH_REQUIRED) return next();

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Missing Authorization token' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { id, username }
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { authRequired, JWT_SECRET };