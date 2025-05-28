<?php

// Fungsi untuk mengirim pesan menggunakan cURL
function sendWhatsAppMessage($phone, $message) {
    // Format nomor telepon
    if (substr($phone, 0, 1) === '0') {
        $phone = '62' . substr($phone, 1);
    }
    $phone = $phone . '@s.whatsapp.net';
    
    $url = 'http://localhost:3001/api/send';
    $data = array(
        'to' => $phone,
        'message' => $message
    );
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        throw new Exception("cURL Error: " . $error);
    }
    
    return json_decode($response, true);
}

// Contoh penggunaan
try {
    $result = sendWhatsAppMessage('081234567890', 'Halo, ini pesan dari PHP dengan cURL!');
    echo "Status: " . $result['status'] . "\n";
    echo "Message: " . $result['message'] . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
