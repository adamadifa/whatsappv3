const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');
const logger = require('../config/logger');
const messageQueue = require('./queue');

class WhatsAppService {
    constructor() {
        this.sock = null;
        this.sessionDir = process.env.SESSION_DIR || './sessions';
        this.qr = null;
        this.isConnected = false;
        this.messageHandlers = [];
        this.queueInterval = null;
        this.lastMemoryCheck = Date.now();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;

        // Buat direktori sesi jika belum ada
        if (!fs.existsSync(this.sessionDir)) {
            fs.mkdirSync(this.sessionDir, { recursive: true });
        }

        // Monitor penggunaan memori
        this.startMemoryMonitor();
        
        // Mulai interval untuk memproses antrian dengan interval yang lebih lama
        this.startQueueProcessor();
    }

    checkMemoryUsage() {
        const used = process.memoryUsage();
        const heapUsed = Math.round(used.heapUsed / 1024 / 1024);
        const heapTotal = Math.round(used.heapTotal / 1024 / 1024);
        
        // Jika penggunaan memori di atas 80% dari total
        if (heapUsed > (heapTotal * 0.8)) {
            logger.warn(`Penggunaan memori tinggi: ${heapUsed}MB/${heapTotal}MB`);
            global.gc && global.gc(); // Panggil garbage collector jika tersedia
        }
        
        return heapUsed;
    }

    startMemoryMonitor() {
        // Cek memori setiap 5 menit
        setInterval(() => {
            this.checkMemoryUsage();
        }, 5 * 60 * 1000);
    }

    getQR() {
        return this.qr;
    }

    isAuthenticated() {
        return this.isConnected;
    }

    async cleanSessions() {
        try {
            if (fs.existsSync(this.sessionDir)) {
                fs.rmSync(this.sessionDir, { recursive: true, force: true });
                fs.mkdirSync(this.sessionDir, { recursive: true });
                logger.info('Sesi lama dibersihkan');
            }
        } catch (error) {
            logger.error('Error membersihkan sesi:', error);
        }
    }

    async initialize(cleanSession = false) {
        // Reset reconnect attempts jika ini adalah inisialisasi baru
        if (!cleanSession) {
            this.reconnectAttempts = 0;
        }

        // Jika sudah melebihi batas percobaan reconnect
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Melebihi batas maksimum percobaan reconnect');
            this.stopQueueProcessor(); // Hentikan processor antrian
            await this.cleanSessions(); // Bersihkan sesi
            this.isConnected = false;
            return;
        }

        this.reconnectAttempts++;
        try {
            if (cleanSession) {
                await this.cleanSessions();
            }

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
                browser: ['WhatsApp Gateway', 'Chrome', '1.0.0'],
                connectTimeoutMs: 60000,
                keepAliveIntervalMs: 15000,
                retryRequestDelayMs: 5000,
                maxRetries: 5,
                defaultQueryTimeoutMs: 60000,
                emitOwnEvents: true
            });

            // Handle connection updates
            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                logger.info('Connection update:', { connection, qr: !!qr });

                if (qr) {
                    this.qr = qr;
                    this.isConnected = false;
                }

                if (connection === 'close') {
                    const statusCode = lastDisconnect?.error?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                    
                    // Handle specific error cases
                    if (statusCode === 515 || statusCode === 401) {
                        logger.warn('Mendeteksi konflik sesi atau unauthorized, membersihkan sesi...');
                        await this.cleanSessions();
                        setTimeout(async () => {
                            logger.info('Mencoba menginisialisasi ulang setelah pembersihan sesi...');
                            await this.initialize(false);
                        }, 5000);
                    } else if (shouldReconnect) {
                        logger.info('Koneksi terputus, mencoba reconnect dalam 5 detik...');
                        setTimeout(async () => {
                            await this.initialize(false);
                        }, 5000);
                    } else {
                        logger.info('Koneksi ditutup secara permanen, silakan scan QR code kembali');
                        this.isConnected = false;
                        await this.cleanSessions();
                    }
                } else if (connection === 'connecting') {
                    logger.info('Sedang mencoba terhubung ke WhatsApp...');
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.qr = null;
                    logger.info('Berhasil terhubung ke WhatsApp!');
                }
            });

            // Handle credentials update
            this.sock.ev.on('creds.update', saveCreds);

            // Handle messages upsert
            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type === 'notify') {
                    try {
                        for (const msg of m.messages) {
                            if (!msg.key.fromMe) {
                                const messageContent = msg.message?.conversation || 
                                    msg.message?.imageMessage?.caption || 
                                    msg.message?.videoMessage?.caption || 
                                    msg.message?.extendedTextMessage?.text || '';
                                
                                logger.info(`Pesan masuk: ${messageContent}`, {
                                    from: msg.key.remoteJid
                                });
                            }
                        }
                    } catch (error) {
                        logger.error('Error handling incoming message:', error);
                    }
                }
            });

        } catch (error) {
            logger.error('Error in initialize:', error);
            throw error;
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
        const messageId = Date.now().toString();
        const formattedNumber = to + '@s.whatsapp.net';

        if (!this.isConnected) {
            logger.info(`WhatsApp tidak terhubung. Menambahkan pesan ke antrian: ${messageId}`);
            messageQueue.addToQueue(messageId, to, message, options.mediaType, options.media);
            return { status: 'queued', messageId };
        }

        try {
            const { mediaType, media } = options;
            let messageContent;

            if (mediaType && media) {
                if (mediaType === 'image') {
                    messageContent = {
                        image: { url: media },
                        caption: message
                    };
                } else if (mediaType === 'document') {
                    messageContent = {
                        document: { url: media },
                        mimetype: options.mimetype || 'application/octet-stream',
                        fileName: options.fileName || 'file'
                    };
                } else if (mediaType === 'video') {
                    messageContent = {
                        video: { url: media },
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
                status: 'sent',
                messageId: result.key.id,
                timestamp: result.messageTimestamp
            };
        } catch (error) {
            logger.error('Error sending message:', error);
            messageQueue.addToQueue(messageId, to, message, options.mediaType, options.media);
            return { status: 'queued', messageId, error: error.message };
        }
    }

    async processQueue() {
        if (!this.isConnected) {
            return;
        }

        // Bersihkan pesan yang lebih dari 1 menit
        messageQueue.cleanOldMessages();

        const messages = messageQueue.getAllMessages();
        for (const [messageId, data] of messages) {
            try {
                await this.sendMessage(data.to, data.message, {
                    mediaType: data.mediaType,
                    media: data.media
                });
                messageQueue.removeFromQueue(messageId);
                logger.info(`Berhasil mengirim pesan dari antrian: ${messageId}`);
            } catch (error) {
                logger.error(`Gagal mengirim pesan dari antrian: ${messageId}`, error);
            }
        }
    }

    startQueueProcessor() {
        // Jalankan processor setiap 30 detik untuk mengurangi beban
        this.queueInterval = setInterval(() => {
            // Cek penggunaan memori sebelum memproses antrian
            const heapUsed = this.checkMemoryUsage();
            if (heapUsed < 150) { // Hanya proses jika memori di bawah 150MB
                this.processQueue();
            } else {
                logger.warn('Melewati proses antrian karena penggunaan memori tinggi');
            }
        }, 30000);
    }

    stopQueueProcessor() {
        if (this.queueInterval) {
            clearInterval(this.queueInterval);
            this.queueInterval = null;
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
