const express = require('express');
const db = require('../config/database');
const logger = require('../utils/logger');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

const sampleMenuItems = {
    1: [
        { id: 101, item_id: 101, name: "Spicy Butter Chicken", description: "Rich creamy gravy with tender chicken", price: 349, category: "Main Course", isVeg: false, isSpicy: true, rating: 4.8, image_url: "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&w=800&q=80", is_available: true },
        { id: 102, item_id: 102, name: "Paneer Tikka Masala", description: "Cottage cheese chunks cooked in tandoori spices", price: 299, category: "Main Course", isVeg: true, isSpicy: true, rating: 4.7, image_url: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80", is_available: true },
        { id: 103, item_id: 103, name: "Garlic Naan", description: "Freshly baked Indian bread infused with garlic", price: 49, category: "Breads", isVeg: true, isSpicy: false, rating: 4.9, image_url: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80", is_available: true }
    ],
    2: [
        { id: 201, item_id: 201, name: "Margherita Pizza", description: "Classic mozzarella cheese and fresh basil", price: 399, category: "Pizza", isVeg: true, isSpicy: false, rating: 4.9, image_url: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80", is_available: true },
        { id: 202, item_id: 202, name: "Creamy Alfredo Pasta", description: "Penne in rich white sauce with mushrooms", price: 349, category: "Pasta", isVeg: true, isSpicy: false, rating: 4.6, image_url: "https://images.unsplash.com/photo-1621996346565-e3d5d6281290?auto=format&fit=crop&w=800&q=80", is_available: true }
    ],
    3: [
        { id: 301, item_id: 301, name: "Schezwan Hakka Noodles", description: "Wok-tossed noodles with spicy schezwan sauce", price: 229, category: "Noodles", isVeg: true, isSpicy: true, rating: 4.5, image_url: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80", is_available: true }
    ]
};

// GET menu items by restaurant ID
const getMenuByRestaurant = async (req, res, next) => {
    try {
        const restaurantId = parseInt(req.params.id || req.params.restaurantId || 1);
        try {
            const [rows] = await db.query('SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = TRUE', [restaurantId]);
            if (rows && rows.length > 0) {
                const formatted = rows.map(i => ({
                    ...i,
                    id: i.item_id,
                    imageUrl: i.image_url,
                    isVeg: Boolean(i.is_veg),
                    isSpicy: Boolean(i.is_spicy)
                }));
                return res.status(200).json(formatted);
            }
        } catch (dbErr) {
            logger.warn('DB query menu fallback:', dbErr.message);
        }
        res.status(200).json(sampleMenuItems[restaurantId] || sampleMenuItems[1]);
    } catch (err) {
        next(err);
    }
};

router.get('/restaurant/:id', getMenuByRestaurant);
router.get('/restaurant/:restaurantId', getMenuByRestaurant);
router.get('/:id', getMenuByRestaurant);

module.exports = router;
