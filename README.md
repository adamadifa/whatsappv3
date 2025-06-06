# WhatsApp Gateway dengan Baileys

Gateway WhatsApp sederhana dan handal menggunakan library Baileys dengan dukungan multi-device.

## Persyaratan Sistem
- Node.js versi 14.x atau lebih tinggi
- npm versi 6.x atau lebih tinggi
- Koneksi internet yang stabil
- WhatsApp yang terdaftar di ponsel Anda

## Instalasi

1. Clone repository ini atau buat folder baru:
```bash
mkdir whatsappgateway
cd whatsappgateway
```

2. Inisialisasi project Node.js:
```bash
npm init -y
```

3. Install dependensi yang diperlukan:
```bash
npm install @whiskeysockets/baileys qrcode-terminal express dotenv
```

## Struktur Project
```
whatsappgateway/
├── .env                    # File konfigurasi environment
├── app.js                  # File utama aplikasi
├── src/
│   ├── config/            # Konfigurasi aplikasi
│   ├── controllers/       # Logic untuk handling request
│   ├── routes/           # Definisi route API
│   └── services/         # Service WhatsApp
└── sessions/             # Folder untuk menyimpan sesi WhatsApp
```

## Cara Penggunaan

1. Salin file `.env.example` menjadi `.env` dan sesuaikan konfigurasi:
```bash
cp .env.example .env
```

2. Jalankan aplikasi:
```bash
node app.js
```

3. Scan QR Code yang muncul dengan aplikasi WhatsApp di ponsel Anda

## API Endpoints

### Kirim Pesan
```http
POST /api/send-message
Content-Type: application/json

{
    "phone": "6281234567890",
    "message": "Halo, ini pesan dari WhatsApp Gateway!"
}
```

## Fitur
- ✅ Multi-device support
- ✅ Penyimpanan sesi otomatis
- ✅ Auto-reconnect
- ✅ Error handling yang robust
- ✅ REST API dengan Express.js
- ✅ Dokumentasi lengkap dalam Bahasa Indonesia

## Troubleshooting

### QR Code tidak muncul?
- Pastikan tidak ada sesi WhatsApp Web yang aktif di browser
- Hapus folder `sessions` dan coba kembali

### Koneksi terputus?
- Aplikasi akan mencoba reconnect secara otomatis
- Pastikan koneksi internet stabil

## Lisensi
MIT License
#   w h a t s a p p v 3  
 