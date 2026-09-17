const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const db = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const restaurantRoutes = require('./routes/restaurant.routes');
const menuRoutes = require('./routes/menu.routes');
const orderRoutes = require('./routes/order.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const adminRoutes = require('./routes/admin.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 300,
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', { stream: logger.stream }));
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'BiteRush API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

// API Route Mounts (Support both /api and /api/v1 prefix)
const mountRoutes = (prefix) => {
    app.use(`${prefix}/auth`, authRoutes);
    app.use(`${prefix}/users`, userRoutes);
    app.use(`${prefix}/user`, userRoutes);
    app.use(`${prefix}/restaurants`, restaurantRoutes);
    app.use(`${prefix}/restaurant`, restaurantRoutes);
    app.use(`${prefix}/menu`, menuRoutes);
    app.use(`${prefix}/menus`, menuRoutes);
    app.use(`${prefix}/orders`, orderRoutes);
    app.use(`${prefix}/recommendations`, recommendationRoutes);
    app.use(`${prefix}/admin`, adminRoutes);
    app.use(`${prefix}/analytics`, analyticsRoutes);
    app.use(`${prefix}/partner`, restaurantRoutes);
};

mountRoutes('/api');
mountRoutes('/api/v1');

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Route not found'
    });
});

// Global error handler
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
    try {
        // Test database connection
        await db.query('SELECT 1');
        logger.info('✅ Database connected successfully');
    } catch (error) {
        logger.warn('⚠️ Database connection check warning:', error.message);
    }

    // Start server
    app.listen(PORT, HOST, () => {
        logger.info(`🚀 BiteRush API server running on http://${HOST}:${PORT}`);
        logger.info(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
        logger.info(`🔗 API Base URL: http://${HOST}:${PORT}/api`);
    });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥', err);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('👋 SIGTERM received. Shutting down gracefully...');
    if (db.pool && db.pool.end) db.pool.end();
    process.exit(0);
});

startServer();

module.exports = app;
