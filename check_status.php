<?php
// Basic authentication
$valid_username = 'admin'; // Ganti dengan username yang diinginkan
$valid_password = 'admin'; // Ganti dengan password yang diinginkan

if (!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW']) ||
    $_SERVER['PHP_AUTH_USER'] !== $valid_username || 
    $_SERVER['PHP_AUTH_PW'] !== $valid_password) {
    header('WWW-Authenticate: Basic realm="Node.js Monitor"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'Authentication required';
    exit;
}

// Set header untuk JSON response
header('Content-Type: application/json');

try {
    // Check if monitor.php exists
    if (!file_exists(__DIR__ . '/monitor.php')) {
        throw new Exception('Monitor script not found');
    }

    // Get the last log entries
    $logFile = __DIR__ . '/logs/node_monitor.log';
    $lastLogs = [];
    if (file_exists($logFile)) {
        $logs = file($logFile);
        $lastLogs = array_slice($logs, -5); // Get last 5 log entries
    }

    // Run the monitor script
    require_once __DIR__ . '/monitor.php';
    $monitor = new NodeAppMonitor();
    $monitor->checkAndRestart();

    // Check if app is running
    $port = 3000; // Sesuaikan dengan port aplikasi
    $connection = @fsockopen('127.0.0.1', $port, $errno, $errstr, 5);
    $isRunning = false;
    
    if (is_resource($connection)) {
        fclose($connection);
        $isRunning = true;
    }

    // Return status
    echo json_encode([
        'status' => 'success',
        'app_running' => $isRunning,
        'last_logs' => $lastLogs,
        'timestamp' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
