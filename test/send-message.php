<?php

// Konfigurasi API
$apiUrl = 'http://localhost:3001'; // Sesuaikan dengan URL server Anda

// Function untuk mengirim pesan WhatsApp
function sendWhatsAppMessage($phoneNumber, $message) {
    global $apiUrl;
    
    // Data yang akan dikirim
    $postData = array(
        'to' => $phoneNumber,  // Format: 628xxxxxxxxxx
        'message' => $message
    );
    
    // Inisialisasi cURL
    $ch = curl_init($apiUrl . '/send');
    
    // Set opsi cURL
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json'
    ));
    
    // Eksekusi cURL
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // Cek error
    if (curl_errno($ch)) {
        echo 'Error cURL: ' . curl_error($ch) . "\n";
        curl_close($ch);
        return false;
    }
    
    // Tutup koneksi cURL
    curl_close($ch);
    
    // Parse response
    $result = json_decode($response, true);
    
    // Tampilkan hasil
    echo "HTTP Status Code: " . $httpCode . "\n";
    echo "Response: " . print_r($result, true) . "\n";
    
    return $result;
}

// Contoh penggunaan
$phoneNumber = '6281234567890'; // Ganti dengan nomor WhatsApp yang valid
$message = 'Ini adalah pesan test dari PHP cURL';

// Kirim pesan
$result = sendWhatsAppMessage($phoneNumber, $message);

// Cek status pengiriman
if ($result && isset($result['status']) && $result['status'] === 'success') {
    echo "Pesan berhasil dikirim!\n";
} else {
    echo "Gagal mengirim pesan!\n";
}

?>
