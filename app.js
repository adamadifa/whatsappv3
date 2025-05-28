require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const logger = require('./src/config/logger');
const limiter = require('./src/config/rate-limit');
const whatsappService = require('./src/services/whatsapp');
const whatsappRoutes = require('./src/routes/whatsapp.routes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware untuk parsing JSON
// Buat direktori logs jika belum ada
if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs');
}

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));
app.use(limiter);

// Middleware untuk CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Routes
app.use('/api', whatsappRoutes);

// Root endpoint - redirect to the QR code page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    logger.error('Error:', err);
    res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

// Inisialisasi WhatsApp
const initializeWhatsApp = async () => {
    try {
        await whatsappService.initialize();
        logger.info('WhatsApp Gateway berhasil diinisialisasi');

        // Contoh penggunaan event listener untuk pesan masuk
        whatsappService.onMessage((message) => {
            logger.info('Pesan masuk:', {
                from: message.key.remoteJid,
                message: message.message?.conversation || message.message?.extendedTextMessage?.text || ''
            });
        });
    } catch (error) {
        logger.error('Gagal menginisialisasi WhatsApp:', error);
        process.exit(1);
    }
};

// Jalankan server
app.listen(port, () => {
    logger.info(`Server berjalan di http://localhost:${port}`);
    initializeWhatsApp();
});
