<?php
session_start();
header('Content-Type: application/json');

$host = $_SERVER['HTTP_HOST'] ?? '';
$isLocal = $host === ''
    || str_starts_with($host, 'localhost')
    || str_starts_with($host, '127.0.0.1')
    || str_starts_with($host, '[::1]');

echo json_encode([
    'dev_otp' => $isLocal ? ($_SESSION['otp_dev'] ?? '') : '',
]);
?>
