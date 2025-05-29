class MessageQueue {
    constructor() {
        this.queue = new Map(); // Menyimpan pesan dalam format: messageId -> { message, timestamp }
    }

    // Menambahkan pesan ke antrian
    addToQueue(messageId, to, message, mediaType = null, media = null) {
        this.queue.set(messageId, {
            to,
            message,
            mediaType,
            media,
            timestamp: Date.now(),
            retries: 0
        });
    }

    // Mendapatkan semua pesan dalam antrian
    getAllMessages() {
        return Array.from(this.queue.entries());
    }

    // Menghapus pesan dari antrian
    removeFromQueue(messageId) {
        this.queue.delete(messageId);
    }

    // Membersihkan pesan yang lebih dari 1 menit
    cleanOldMessages() {
        const now = Date.now();
        const oneMinute = 60 * 1000; // 1 menit dalam milidetik

        for (const [messageId, data] of this.queue.entries()) {
            if (now - data.timestamp > oneMinute) {
                this.queue.delete(messageId);
            }
        }
    }
}

module.exports = new MessageQueue();
