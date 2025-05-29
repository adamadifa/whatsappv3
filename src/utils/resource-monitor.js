const logger = require('../config/logger');

class ResourceMonitor {
    constructor() {
        this.maxMemoryMB = parseInt(process.env.MAX_MEMORY_MB || '150');
        this.lastCheck = Date.now();
        this.checkInterval = parseInt(process.env.MEMORY_CHECK_INTERVAL || '300000');
        this.warningThreshold = 0.8; // 80% dari max memory
    }

    getMemoryUsage() {
        const used = process.memoryUsage();
        return {
            heapUsed: Math.round(used.heapUsed / 1024 / 1024),
            heapTotal: Math.round(used.heapTotal / 1024 / 1024),
            rss: Math.round(used.rss / 1024 / 1024)
        };
    }

    isMemoryOK() {
        const { heapUsed } = this.getMemoryUsage();
        return heapUsed < this.maxMemoryMB;
    }

    checkResources() {
        const now = Date.now();
        if (now - this.lastCheck < this.checkInterval) {
            return true; // Skip jika belum waktunya cek
        }

        this.lastCheck = now;
        const { heapUsed, heapTotal, rss } = this.getMemoryUsage();

        // Jika penggunaan memori mendekati batas
        if (heapUsed > (this.maxMemoryMB * this.warningThreshold)) {
            logger.warn(`Memory usage high: ${heapUsed}MB/${this.maxMemoryMB}MB (${Math.round(heapUsed/this.maxMemoryMB*100)}%)`);
            
            // Coba garbage collection jika tersedia
            if (global.gc) {
                logger.info('Running garbage collection...');
                global.gc();
            }

            // Jika sudah melebihi batas
            if (heapUsed >= this.maxMemoryMB) {
                logger.error(`Memory limit exceeded: ${heapUsed}MB/${this.maxMemoryMB}MB`);
                return false;
            }
        }

        return true;
    }

    getResourceStatus() {
        const { heapUsed, heapTotal, rss } = this.getMemoryUsage();
        return {
            memory: {
                used: heapUsed,
                total: heapTotal,
                rss: rss,
                percentage: Math.round((heapUsed / this.maxMemoryMB) * 100)
            },
            status: this.isMemoryOK() ? 'OK' : 'WARNING'
        };
    }
}

module.exports = new ResourceMonitor();
