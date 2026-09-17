const express = require('express');
const db = require('../config/database');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// GET Partner Analytics
router.get('/', protect, async (req, res, next) => {
    try {
        res.status(200).json({
            status: 'success',
            analytics: {
                todayOrders: 14,
                todayRevenue: 4890.00,
                avgOrderValue: 349.28,
                popularItems: [
                    { name: "Spicy Butter Chicken", orders: 42 },
                    { name: "Garlic Naan", orders: 68 }
                ]
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
