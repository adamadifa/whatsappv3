const whatsapp = require('../services/whatsapp');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');

class WhatsAppController {
    // Mengirim pesan WhatsApp
    async sendMessage(req, res) {
        const startTime = Date.now();
        logger.info('Memulai pengiriman pesan');
        try {
            const { phone, message, mediaType, mediaUrl, fileName } = req.body;

            if (!phone || (!message && !mediaUrl)) {
                return res.status(400).json({
                    success: false,
                    message: 'Nomor telepon dan pesan harus diisi'
                });
            }

            let mediaBuffer;
            let options = {};

            // Handle media jika ada
            if (mediaUrl) {
                try {
                    if (mediaUrl.startsWith('data:')) {
                        // Handle base64
                        const base64Data = mediaUrl.split(',')[1];
                        mediaBuffer = Buffer.from(base64Data, 'base64');
                    } else if (mediaUrl.startsWith('http')) {
                        // Handle URL
                        const response = await fetch(mediaUrl);
                        mediaBuffer = await response.buffer();
                    } else if (fs.existsSync(mediaUrl)) {
                        // Handle local file
                        mediaBuffer = fs.readFileSync(mediaUrl);
                    }

                    options = {
                        media: mediaBuffer,
                        mediaType: mediaType || 'document',
                        fileName: fileName || 'file' + path.extname(mediaUrl)
                    };
                } catch (error) {
                    logger.error('Gagal memproses media:', error);
                    return res.status(400).json({
                        success: false,
                        message: 'Gagal memproses media: ' + error.message
                    });
                }
            }

            const result = await whatsapp.sendMessage(phone, message, options);
            const duration = Date.now() - startTime;
            logger.info(`Pesan berhasil dikirim dalam ${duration}ms`);
            res.json(result);
        } catch (error) {
            logger.error('Error dalam controller sendMessage:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Mendapatkan status koneksi WhatsApp
    getStatus(req, res) {
        try {
            const status = whatsapp.getConnectionStatus();
            res.json(status);
        } catch (error) {
            console.error('Error dalam controller getStatus:', error);
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new WhatsAppController();
