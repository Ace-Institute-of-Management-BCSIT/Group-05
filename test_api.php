<?php
session_start();
$_SESSION['id'] = 1;
$_SESSION['role'] = 'admin';

$_GET['action'] = 'pending';
try {
    include 'PHP/places.php';
} catch (Exception $e) {
    echo "\nEXCEPTION: " . $e->getMessage() . "\n";
}
?>
