<?php
session_start();
header('Content-Type: application/json');

echo json_encode([
    'dev_otp' => $_SESSION['otp_dev'] ?? '',
]);
?>
