<?php
session_start();
include 'db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login first.']);
    exit();
}

$userId = (int) $_SESSION['id'];
$action = $_POST['action'] ?? $_GET['action'] ?? '';

if ($action === 'get') {
    $saved = [];
    $trips = [];
    $notes = [];

    $savedStmt = $conn->prepare('SELECT place_id, saved_at FROM saved_places WHERE user_id = ? ORDER BY saved_at DESC');
    $savedStmt->bind_param('i', $userId);
    $savedStmt->execute();
    $savedResult = $savedStmt->get_result();
    while ($row = $savedResult->fetch_assoc()) {
        $saved[] = $row;
    }

    $tripStmt = $conn->prepare('SELECT place_id, planned_at FROM planned_trips WHERE user_id = ? ORDER BY planned_at DESC');
    $tripStmt->bind_param('i', $userId);
    $tripStmt->execute();
    $tripResult = $tripStmt->get_result();
    while ($row = $tripResult->fetch_assoc()) {
        $trips[] = $row;
    }

    $noteStmt = $conn->prepare('SELECT id, place_id, note_text, created_at FROM trip_notes WHERE user_id = ? ORDER BY created_at DESC');
    $noteStmt->bind_param('i', $userId);
    $noteStmt->execute();
    $noteResult = $noteStmt->get_result();
    while ($row = $noteResult->fetch_assoc()) {
        $notes[] = $row;
    }

    echo json_encode(['success' => true, 'saved' => $saved, 'trips' => $trips, 'notes' => $notes]);
    exit();
}

if ($action === 'save_place') {
    $placeId = (int) ($_POST['place_id'] ?? 0);
    if ($placeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid place.']);
        exit();
    }

    $stmt = $conn->prepare('INSERT IGNORE INTO saved_places (user_id, place_id) VALUES (?, ?)');
    $stmt->bind_param('ii', $userId, $placeId);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Place saved.']);
    exit();
}

if ($action === 'remove_saved') {
    $placeId = (int) ($_POST['place_id'] ?? 0);
    if ($placeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid place.']);
        exit();
    }

    $stmt = $conn->prepare('DELETE FROM saved_places WHERE user_id = ? AND place_id = ?');
    $stmt->bind_param('ii', $userId, $placeId);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Saved place removed.']);
    exit();
}

if ($action === 'plan_trip') {
    $placeId = (int) ($_POST['place_id'] ?? 0);
    if ($placeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid place.']);
        exit();
    }

    $stmt = $conn->prepare('INSERT IGNORE INTO planned_trips (user_id, place_id) VALUES (?, ?)');
    $stmt->bind_param('ii', $userId, $placeId);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Trip planned.']);
    exit();
}

if ($action === 'remove_trip') {
    $placeId = (int) ($_POST['place_id'] ?? 0);
    if ($placeId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid place.']);
        exit();
    }

    $stmt = $conn->prepare('DELETE FROM planned_trips WHERE user_id = ? AND place_id = ?');
    $stmt->bind_param('ii', $userId, $placeId);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Planned trip removed.']);
    exit();
}

if ($action === 'add_note') {
    $placeId = (int) ($_POST['place_id'] ?? 0);
    $noteText = trim($_POST['note_text'] ?? '');

    if ($placeId <= 0 || $noteText === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid note data.']);
        exit();
    }

    $stmt = $conn->prepare('INSERT INTO trip_notes (user_id, place_id, note_text) VALUES (?, ?, ?)');
    $stmt->bind_param('iis', $userId, $placeId, $noteText);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Note saved.']);
    exit();
}

if ($action === 'delete_note') {
    $noteId = (int) ($_POST['note_id'] ?? 0);
    if ($noteId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid note.']);
        exit();
    }

    $stmt = $conn->prepare('DELETE FROM trip_notes WHERE user_id = ? AND id = ?');
    $stmt->bind_param('ii', $userId, $noteId);
    $stmt->execute();

    echo json_encode(['success' => true, 'message' => 'Note deleted.']);
    exit();
}

http_response_code(400);
echo json_encode(['success' => false, 'message' => 'Invalid action.']);
