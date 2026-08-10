<?php
session_start();
require 'db.php';
header('Content-Type: application/json');
function notification_response($data, $status = 200) { http_response_code($status); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
if (!isset($_SESSION['id'])) notification_response(['success' => false, 'message' => 'Please login first.'], 401);
$userId = (int) $_SESSION['id'];
$action = $_POST['action'] ?? $_GET['action'] ?? 'get';
if ($action === 'get') {
    $stmt = $conn->prepare('SELECT id, type, data, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50');
    $stmt->bind_param('i', $userId); $stmt->execute(); $result = $stmt->get_result(); $notifications = [];
    while ($row = $result->fetch_assoc()) { $row['id'] = (int)$row['id']; $row['is_read'] = (bool)$row['is_read']; $row['data'] = json_decode($row['data'] ?: '{}', true) ?: []; $notifications[] = $row; }
    $stmt = $conn->prepare('SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0');
    $stmt->bind_param('i', $userId); $stmt->execute(); $unread = (int)($stmt->get_result()->fetch_assoc()['unread'] ?? 0);
    notification_response(['success' => true, 'notifications' => $notifications, 'unread' => $unread]);
}
if ($action === 'mark_read') { $id = (int)($_POST['id'] ?? 0); $stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'); $stmt->bind_param('ii', $id, $userId); $stmt->execute(); notification_response(['success' => true]); }
if ($action === 'mark_all') { $stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?'); $stmt->bind_param('i', $userId); $stmt->execute(); notification_response(['success' => true]); }
notification_response(['success' => false, 'message' => 'Invalid action.'], 400);
