<?php

// Fungsi untuk mengirim pesan teks
function sendWhatsAppMessage($phone, $message) {
    $url = 'http://localhost:3001/api/send';
    
    // Format nomor telepon
    if (substr($phone, 0, 1) === '0') {
        $phone = '62' . substr($phone, 1);
    }
    $phone = $phone . '@s.whatsapp.net';
    
    $data = array(
        'to' => $phone,
        'message' => $message
    );
    
    $options = array(
        'http' => array(
            'header'  => "Content-type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data)
        )
    );
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    return json_decode($result, true);
}

// Fungsi untuk mengirim media (gambar, dokumen, video)
function sendWhatsAppMedia($phone, $message, $mediaPath, $mediaType = 'image') {
    $url = 'http://localhost:3001/api/send';
    
    // Format nomor telepon
    if (substr($phone, 0, 1) === '0') {
        $phone = '62' . substr($phone, 1);
    }
    $phone = $phone . '@s.whatsapp.net';
    
    // Baca file media dan convert ke base64
    $mediaData = base64_encode(file_get_contents($mediaPath));
    
    $data = array(
        'to' => $phone,
        'message' => $message,
        'mediaType' => $mediaType,
        'media' => $mediaData
    );
    
    $options = array(
        'http' => array(
            'header'  => "Content-type: application/json\r\n",
            'method'  => 'POST',
            'content' => json_encode($data)
        )
    );
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    return json_decode($result, true);
}

// Contoh penggunaan untuk mengirim pesan teks
try {
    // Kirim pesan teks
    $result = sendWhatsAppMessage('081234567890', 'Halo, ini pesan dari PHP!');
    echo "Status: " . $result['status'] . "\n";
    echo "Message: " . $result['message'] . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// Contoh penggunaan untuk mengirim gambar
try {
    // Kirim gambar
    $result = sendWhatsAppMedia(
        '081234567890',
        'Ini caption untuk gambar',
        'path/to/image.jpg',
        'image'
    );
    echo "Status: " . $result['status'] . "\n";
    echo "Message: " . $result['message'] . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// Contoh penggunaan untuk mengirim dokumen PDF
try {
    // Kirim dokumen
    $result = sendWhatsAppMedia(
        '081234567890',
        'Ini caption untuk dokumen',
        'path/to/document.pdf',
        'document'
    );
    echo "Status: " . $result['status'] . "\n";
    echo "Message: " . $result['message'] . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
