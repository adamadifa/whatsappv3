const rateLimit = require('express-rate-limit');
const logger = require('./logger');

// CPU usage monitoring
const os = require('os');
let lastCpuUsage = process.cpuUsage();
let lastHrTime = process.hrtime();

function getCpuUsagePercent() {
    const currentCpuUsage = process.cpuUsage();
    const currentHrTime = process.hrtime();

    const elapsedUser = currentCpuUsage.user - lastCpuUsage.user;
    const elapsedSystem = currentCpuUsage.system - lastCpuUsage.system;
    const elapsedTime = process.hrtime(lastHrTime);
    const elapsedTimeMs = elapsedTime[0] * 1000 + elapsedTime[1] / 1e6;

    const cpuPercent = (elapsedUser + elapsedSystem) / (elapsedTimeMs * 1000) * 100;

    lastCpuUsage = currentCpuUsage;
    lastHrTime = currentHrTime;

    return cpuPercent;
}

// Rate limit configuration
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per minute
    handler: function (req, res) {
        const cpuUsage = getCpuUsagePercent();
        if (cpuUsage > 180) { // If CPU usage is above 180% (90% of 200% limit)
            logger.warn(`High CPU usage detected: ${cpuUsage}%`);
            return res.status(503).json({
                error: 'Server is currently experiencing high load. Please try again later.'
            });
        }
        return res.status(429).json({
            error: 'Too many requests. Please try again later.'
        });
    },
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
