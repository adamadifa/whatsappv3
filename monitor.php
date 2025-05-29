<?php
class NodeAppMonitor {
    private $port;
    private $appPath;
    private $logFile;
    private $pidFile;

    public function __construct($port = 3000, $appPath = 'app.js') {
        $this->port = $port;
        $this->appPath = $appPath;
        $this->logFile = dirname(__FILE__) . '/logs/node_monitor.log';
        $this->pidFile = dirname(__FILE__) . '/node_app.pid';
    }

    public function checkAndRestart() {
        $this->log("Checking Node.js application status...");
        
        // Check resource usage
        $memoryUsage = $this->getMemoryUsage();
        $cpuUsage = $this->getCpuUsage();
        
        $this->log("Memory Usage: {$memoryUsage}MB, CPU Usage: {$cpuUsage}%");
        
        // If memory usage is too high (>900MB), restart the app
        if ($memoryUsage > 900) {
            $this->log("High memory usage detected ({$memoryUsage}MB). Restarting application...");
            $this->startApp(true); // Force restart
            return;
        }
        
        // If CPU usage is too high (>180%), wait before checking port
        if ($cpuUsage > 180) {
            $this->log("High CPU usage detected ({$cpuUsage}%). Waiting before check...");
            sleep(30); // Wait 30 seconds before checking
        }
        
        if (!$this->isPortInUse()) {
            $this->log("Application is not running on port {$this->port}");
            $this->startApp();
        } else {
            $this->log("Application is running normally on port {$this->port}");
        }
    }

    private function isPortInUse() {
        try {
            $connection = @fsockopen('127.0.0.1', $this->port, $errno, $errstr, 5);
            if (is_resource($connection)) {
                fclose($connection);
                return true;
            }
            return false;
        } catch (Exception $e) {
            return false;
        }
    }

    private function getMemoryUsage() {
        if (file_exists($this->pidFile)) {
            $pid = trim(file_get_contents($this->pidFile));
            $cmd = "ps -o rss= -p " . escapeshellarg($pid);
            $output = shell_exec($cmd);
            if ($output) {
                // Convert KB to MB
                return round(trim($output) / 1024);
            }
        }
        return 0;
    }

    private function getCpuUsage() {
        if (file_exists($this->pidFile)) {
            $pid = trim(file_get_contents($this->pidFile));
            $cmd = "ps -o %cpu= -p " . escapeshellarg($pid);
            $output = shell_exec($cmd);
            if ($output) {
                return round(trim($output), 2);
            }
        }
        return 0;
    }

    private function startApp($forceRestart = false) {
        $this->log("Attempting to start Node.js application...");
        
        // Kill any existing process if PID file exists
        if (file_exists($this->pidFile)) {
            $oldPid = file_get_contents($this->pidFile);
            if ($oldPid) {
                exec("kill -9 {$oldPid} 2>/dev/null");
            }
            unlink($this->pidFile);
        }

        // Start the application
        $command = sprintf(
            'NODE_ENV=production nohup node %s > %s/node_app.log 2>&1 & echo $! > %s',
            $this->appPath,
            dirname(__FILE__) . '/logs',
            $this->pidFile
        );

        exec($command, $output, $returnVar);

        if ($returnVar === 0) {
            $this->log("Application started successfully");
            return true;
        } else {
            $this->log("Failed to start application");
            return false;
        }
    }

    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message\n";
        
        if (!file_exists(dirname($this->logFile))) {
            mkdir(dirname($this->logFile), 0755, true);
        }
        
        file_put_contents($this->logFile, $logMessage, FILE_APPEND);
    }
}

// Penggunaan
$monitor = new NodeAppMonitor();
$monitor->checkAndRestart();
