<?php
session_start();
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$uploadDir = __DIR__ . '/../public/uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No image file provided']);
    exit;
}

$file = $_FILES['image'];

// Validate file
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
$maxSize = 5 * 1024 * 1024; // 5MB

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Only JPEG, PNG, and GIF images are allowed']);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File size must not exceed 5MB']);
    exit;
}

if ($file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Upload failed: ' . $file['error']]);
    exit;
}

// Generate unique filename with timestamp
$fileExtension = pathinfo($file['name'], PATHINFO_EXTENSION);
$uniqueFileName = 'img_' . time() . '_' . uniqid() . '.' . strtolower($fileExtension);
$uploadPath = $uploadDir . $uniqueFileName;

// Validate it's actually an image
$imageInfo = getimagesize($file['tmp_name']);
if ($imageInfo === false) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File is not a valid image']);
    exit;
}

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
    // Return relative path for web access
    $relativePath = 'public/uploads/' . $uniqueFileName;
    
    echo json_encode([
        'success' => true,
        'message' => 'Image uploaded successfully',
        'image_path' => $relativePath,
        'filename' => $uniqueFileName
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to move uploaded file']);
}
?>
