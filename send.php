<?php
// Nomor tujuan (ganti dengan nomor yang valid)
$nomor = "628xxxxxxxxxx";
$pesan = "Test Pesan WhatsApp Gateway";

// URL API (sesuaikan dengan URL server Anda)
$url = "http://localhost:3001/send";

// Data yang akan dikirim
$data = array(
    'to' => $nomor,
    'message' => $pesan
);

// Inisialisasi cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));

// Eksekusi cURL
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Tutup koneksi cURL
curl_close($ch);

// Tampilkan hasil
echo "Status Code: " . $httpCode . "\n";
echo "Response: " . $response . "\n";
?>
