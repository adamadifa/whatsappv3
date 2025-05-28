const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.sessionDir = process.env.SESSION_DIR || './sessions';
        this.qr = null;
        this.isConnected = false;
        this.messageHandlers = [];

        if (!fs.existsSync(this.sessionDir)) {
            fs.mkdirSync(this.sessionDir, { recursive: true });
        }
    }

    getQR() {
        return this.qr;
    }

    isAuthenticated() {
        return this.isConnected;
    }

    async initialize() {
        try {
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionDir);

            this.isConnected = false;
            this.qr = null;

            // Create a custom logger for Baileys that doesn't use child loggers
            const baileyLogger = {
                info: (...args) => logger.info(...args),
                error: (...args) => logger.error(...args),
                warn: (...args) => logger.warn(...args),
                debug: (...args) => logger.debug(...args),
                trace: (...args) => logger.debug(...args),
                child: () => baileyLogger // Return the same logger for child requests
            };

            this.sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: baileyLogger,
                browser: ['WhatsApp Gateway', 'Chrome', '1.0.0']
            });

            this.sock.ev.on('connection.update', this.handleConnectionUpdate.bind(this));
            this.sock.ev.on('creds.update', saveCreds);
            this.sock.ev.on('messages.upsert', this.handleIncomingMessages.bind(this));

        } catch (error) {
            logger.error('Error in initialize:', error);
            throw error;
        }
    }

    async handleConnectionUpdate(update) {
        const { connection, lastDisconnect, qr } = update;
        logger.info('Connection update:', update);

        if (qr) {
            logger.info('QR Code received');
            this.qr = qr;
            this.isConnected = false;
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                : true;

            logger.error('Connection lost:', lastDisconnect?.error?.message);

            if (shouldReconnect) {
                logger.info('Attempting to reconnect...');
                await this.initialize();
            } else {
                logger.info('Connection permanently closed. Please scan QR code again.');
                this.isConnected = false;
                if (fs.existsSync(this.sessionDir)) {
                    fs.rmSync(this.sessionDir, { recursive: true, force: true });
                }
            }
        } else if (connection === 'open') {
            logger.info('WhatsApp connection successful!');
            this.isConnected = true;
            this.qr = null;
        }
    }

    async handleIncomingMessages({ messages }) {
        for (const message of messages) {
            if (!message.key.fromMe) {
                this.messageHandlers.forEach(handler => handler(message));
            }
        }
    }

    async sendMessage(to, message, options = {}) {
        if (!this.isConnected) {
            throw new Error('WhatsApp is not connected!');
        }

        try {
            const formattedNumber = this.formatPhoneNumber(to);
            let messageContent;

            if (options.media) {
                if (options.mediaType === 'image') {
                    messageContent = {
                        image: options.media,
                        caption: message
                    };
                } else if (options.mediaType === 'document') {
                    messageContent = {
                        document: options.media,
                        mimetype: options.mimeType || 'application/octet-stream',
                        fileName: options.fileName || 'file'
                    };
                } else if (options.mediaType === 'video') {
                    messageContent = {
                        video: options.media,
                        caption: message
                    };
                }
            } else {
                messageContent = {
                    text: message
                };
            }

            const result = await this.sock.sendMessage(formattedNumber, messageContent);
            return {
                success: true,
                messageId: result.key.id,
                timestamp: result.messageTimestamp
            };
        } catch (error) {
            logger.error('Error sending message:', error);
            throw error;
        }
    }

    formatPhoneNumber(phone) {
        let formatted = phone.toString().replace(/[^\d]/g, '');
        if (!formatted.startsWith('62')) {
            formatted = '62' + formatted.replace(/^0+/, '');
        }
        if (!formatted.endsWith('@s.whatsapp.net')) {
            formatted += '@s.whatsapp.net';
        }
        return formatted;
    }

    onMessage(handler) {
        this.messageHandlers.push(handler);
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            qr: this.qr
        };
    }
}

module.exports = new WhatsAppService();
