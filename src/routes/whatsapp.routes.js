const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsapp');
const resourceMonitor = require('../utils/resource-monitor');

// Route untuk mendapatkan status dan QR code
router.get('/status', (req, res) => {
    const isAuthenticated = whatsappService.isAuthenticated();
    const qr = whatsappService.getQR();

    res.json({
        status: 'success',
        data: {
            isAuthenticated,
            qr: isAuthenticated ? null : qr
        }
    });
});

// Route untuk mengirim pesan
router.post('/send', async (req, res) => {
    try {
        if (!whatsappService.isAuthenticated()) {
            return res.status(401).json({
                status: 'error',
                message: 'WhatsApp belum terhubung'
            });
        }

        const { to, message, mediaType, media } = req.body;
        const result = await whatsappService.sendMessage(to, message, { mediaType, media });
        
        res.json({
            status: 'success',
            message: 'Pesan berhasil dikirim',
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Endpoint untuk monitoring resource
router.get('/health', (req, res) => {
    const status = resourceMonitor.getResourceStatus();
    res.json({
        status: 'success',
        data: {
            ...status,
            whatsapp: {
                connected: whatsappService.isAuthenticated(),
                hasQR: !!whatsappService.getQR()
            }
        }
    });
});

module.exports = router;
