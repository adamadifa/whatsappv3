<?php
// Include file fungsi WhatsApp
require_once 'send_message.php';

// Contoh kirim pesan teks
$nomor = '081234567890';  // Ganti dengan nomor tujuan
$pesan = 'Halo, ini pesan test dari WhatsApp Gateway';

try {
    $hasil = sendWhatsAppMessage($nomor, $pesan);
    if ($hasil['status'] === 'success') {
        echo "Pesan berhasil dikirim!\n";
    } else {
        echo "Gagal kirim pesan: " . $hasil['message'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// Contoh kirim gambar
$nomor = '081234567890';  // Ganti dengan nomor tujuan
$caption = 'Ini gambar dari WhatsApp Gateway';
$file_gambar = __DIR__ . '/gambar.jpg';  // Pastikan file gambar ada di folder yang sama

try {
    if (file_exists($file_gambar)) {
        $hasil = sendWhatsAppMedia($nomor, $caption, $file_gambar, 'image');
        if ($hasil['status'] === 'success') {
            echo "Gambar berhasil dikirim!\n";
        } else {
            echo "Gagal kirim gambar: " . $hasil['message'] . "\n";
        }
    } else {
        echo "File gambar tidak ditemukan: " . $file_gambar . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
