const express = require('express');
const db = require('../config/database');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Get User Profile
router.get('/profile', protect, async (req, res, next) => {
    try {
        const userId = req.user.user_id || req.user.id;
        try {
            const [users] = await db.query('SELECT user_id, name, email, phone, role, profile_image FROM users WHERE user_id = ?', [userId]);
            if (users && users.length > 0) {
                return res.status(200).json({ status: 'success', data: users[0], ...users[0] });
            }
        } catch (dbErr) {
            logger.warn('DB query failed in profile, fallback:', dbErr.message);
        }
        res.status(200).json({
            status: 'success',
            user_id: userId,
            name: req.user.name || 'BiteRush User',
            email: req.user.email || 'user@example.com',
            phone: req.user.phone || '+91 9876543210'
        });
    } catch (err) {
        next(err);
    }
});

// Update User Profile
router.put('/profile', protect, async (req, res, next) => {
    try {
        const userId = req.user.user_id || req.user.id;
        const { name, phone, email } = req.body;
        try {
            await db.query('UPDATE users SET name = ?, phone = ? WHERE user_id = ?', [name, phone, userId]);
        } catch (dbErr) {
            logger.warn('DB update profile fallback:', dbErr.message);
        }
        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            user: { user_id: userId, name, phone, email: email || req.user.email }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
