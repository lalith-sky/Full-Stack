const express = require('express');
const aiEngine = require('../services/aiEngine.service');
const db = require('../config/database');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// GET AI Mood Recommendations
router.get('/mood', async (req, res, next) => {
    try {
        const { mood = 'comfort' } = req.query;
        let restaurants = [];
        try {
            const [rows] = await db.query('SELECT * FROM restaurants WHERE is_active = TRUE');
            restaurants = rows;
        } catch (dbErr) {
            logger.warn('DB mood recommendation fallback:', dbErr.message);
            restaurants = [
                { restaurant_id: 1, name: "Spicy Hub", cuisine_type: "Indian", rating: 4.8, delivery_time: 25 },
                { restaurant_id: 2, name: "Bella Italia", cuisine_type: "Italian", rating: 4.6, delivery_time: 35 },
                { restaurant_id: 3, name: "Dragon Wok", cuisine_type: "Chinese", rating: 4.5, delivery_time: 30 }
            ];
        }

        const recommendations = aiEngine.getMoodRecommendations(mood, restaurants, null);
        res.status(200).json({
            status: 'success',
            mood,
            count: recommendations.length,
            data: recommendations
        });
    } catch (err) {
        next(err);
    }
});

// GET Smart Suggestions
router.get('/suggestions', async (req, res, next) => {
    try {
        const suggestions = aiEngine.getSmartSuggestions();
        res.status(200).json({
            status: 'success',
            suggestions
        });
    } catch (err) {
        next(err);
    }
});

// POST Carbon Footprint Calculation
router.post('/carbon-footprint', (req, res) => {
    const { distance = 5, itemCount = 3 } = req.body;
    const footprint = aiEngine.calculateCarbonFootprint(distance, itemCount);
    res.status(200).json({
        status: 'success',
        distanceKm: distance,
        itemCount,
        carbonFootprintKg: footprint
    });
});

module.exports = router;
