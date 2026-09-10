<?php
require_once __DIR__ . '/auth.php';
app_session_start();
require_once __DIR__ . '/db.php';

if (!has_active_login($conn) || ($_SESSION['role'] ?? '') !== 'admin') {
    header("Location: ../public/HTML/login.html");
    exit();
}
?>
