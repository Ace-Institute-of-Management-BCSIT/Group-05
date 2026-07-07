<?php
session_start();
header('Content-Type: application/json');

$data = [
    'login_error'    => $_SESSION['login_error']    ?? '',
    'register_error' => $_SESSION['register_error'] ?? '',
];

unset($_SESSION['login_error'], $_SESSION['register_error']);
echo json_encode($data);
?>
