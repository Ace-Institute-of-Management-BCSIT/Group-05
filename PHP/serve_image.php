<?php
/**
 * serve_image.php — Securely serve uploaded place images from /Public/uploads/
 * Usage: serve_image.php?path=uploads/place_xxx.jpg
 */

$requested = $_GET['path'] ?? '';

// Strip any leading slashes / directory traversal attempts
$requested = ltrim($requested, '/\\');
$requested = str_replace(['..', "\0"], '', $requested);

// Only allow files inside the uploads/ subdirectory or plain filenames under uploads
if (!str_starts_with($requested, 'uploads/')) {
    if (strpos($requested, '/') !== false || strpos($requested, '\\') !== false) {
        http_response_code(403);
        exit('Forbidden');
    }
    $requested = 'uploads/' . $requested;
}

$basePath = dirname(__DIR__) . '/public/';
$filePath = realpath($basePath . $requested);
$allowedBase = realpath($basePath . 'uploads');

// Ensure the resolved path is still inside uploads/
if ($filePath === false || strpos($filePath, $allowedBase) !== 0 || !is_file($filePath)) {
    http_response_code(404);
    exit('Not found');
}

$ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
$mimeTypes = [
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
];

if (!isset($mimeTypes[$ext])) {
    http_response_code(415);
    exit('Unsupported media type');
}

header('Content-Type: ' . $mimeTypes[$ext]);
header('Cache-Control: public, max-age=86400');
readfile($filePath);
