const rateLimit = require('express-rate-limit');

// Rate limit configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per IP
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Trust our own proxy
    trustProxy: false,
    // Custom key generator to handle proxies correctly
    keyGenerator: (req) => {
        return req.ip; // Use Express's built-in IP resolution
    }
});

module.exports = limiter;
