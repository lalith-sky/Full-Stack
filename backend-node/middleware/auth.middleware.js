const jwt = require('jsonwebtoken');
const db = require('../config/database');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Not authorized to access this route'
        });
    }

    try {
        const secret = process.env.JWT_SECRET || 'biterush-secret-key-for-jwt-token-generation-2026';
        const decoded = jwt.verify(token, secret);

        // Fetch user from DB if available
        try {
            const [rows] = await db.query('SELECT user_id, name, email, role FROM users WHERE user_id = ?', [decoded.id || decoded.userId]);
            if (rows && rows.length > 0) {
                req.user = rows[0];
            } else {
                req.user = { id: decoded.id || decoded.userId, email: decoded.email, role: decoded.role || 'user' };
            }
        } catch (dbErr) {
            // DB query fallback if DB is offline or mock token
            req.user = { id: decoded.id || decoded.userId, email: decoded.email, role: decoded.role || 'user' };
        }

        next();
    } catch (error) {
        logger.error('JWT Verification Error:', error.message);
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or expired token'
        });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

module.exports = { protect, restrictTo };
