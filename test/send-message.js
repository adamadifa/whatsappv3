const axios = require('axios');

// Konfigurasi API
const API_URL = 'http://localhost:3001'; // Sesuaikan dengan URL server Anda

// Function untuk mengirim pesan
async function sendMessage(phoneNumber, message) {
    try {
        const response = await axios.post(`${API_URL}/send`, {
            to: phoneNumber,    // Nomor tujuan (format: 628xxxxxxxxxx)
            message: message    // Pesan yang akan dikirim
        });
        
        console.log('Pesan berhasil dikirim:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error mengirim pesan:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Contoh penggunaan
async function test() {
    try {
        // Ganti dengan nomor WhatsApp yang valid (format: 628xxxxxxxxxx)
        const phoneNumber = '6281234567890';
        const message = 'Ini adalah pesan test dari API WhatsApp Gateway';
        
        await sendMessage(phoneNumber, message);
    } catch (error) {
        console.error('Test gagal:', error.message);
    }
}

// Jalankan test
test();
