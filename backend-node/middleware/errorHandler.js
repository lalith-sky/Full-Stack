const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error('API Error:', err.stack || err.message || err);

    const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

    res.status(statusCode).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
