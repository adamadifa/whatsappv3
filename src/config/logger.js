const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Custom format for child loggers
const childFormat = winston.format((info, opts) => {
    if (opts.meta) {
        info = { ...info, ...opts.meta };
    }
    return info;
});

// Base format
const baseFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
);

// Console format
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
);

// Create base logger
class CustomLogger {
    constructor(options = {}) {
        this.defaultMeta = { service: 'whatsapp-gateway', ...options };
        this.logger = winston.createLogger({
            level: 'debug',
            format: winston.format.combine(
                childFormat({ meta: this.defaultMeta }),
                baseFormat
            ),
            transports: [
                new winston.transports.File({
                    filename: path.join('logs', 'error.log'),
                    level: 'error'
                }),
                new winston.transports.File({
                    filename: path.join('logs', 'combined.log')
                }),
                new winston.transports.Console({
                    format: consoleFormat
                })
            ]
        });

        // Proxy all logging methods
        ['error', 'warn', 'info', 'debug', 'trace'].forEach(level => {
            this[level] = (...args) => this.logger[level](...args);
        });
    }

    child(options) {
        return new CustomLogger({ ...this.defaultMeta, ...options });
    }
}

module.exports = new CustomLogger();
