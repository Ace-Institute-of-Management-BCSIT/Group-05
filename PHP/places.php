<?php
session_start();
include 'db.php';

header('Content-Type: application/json');

function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function require_login() {
    if (!isset($_SESSION['id'])) {
        respond(['success' => false, 'message' => 'Please login first.'], 401);
    }
}

function require_admin() {
    require_login();
    if (($_SESSION['role'] ?? '') !== 'admin') {
        respond(['success' => false, 'message' => 'Admin access required.'], 403);
    }
}

function row_to_place($row) {
    return [
        'id' => (int) $row['id'],
        'name' => $row['name'],
        'localName' => $row['local_name'],
        'tagline' => $row['tagline'],
        'province' => $row['province'],
        'district' => $row['district'],
        'municipality' => $row['municipality'],
        'location' => trim(implode(', ', array_filter([$row['district'], $row['province']]))),
        'category' => $row['category'],
        'shortDesc' => $row['short_desc'],
        'bestTime' => $row['best_time'],
        'duration' => $row['duration'],
        'things' => $row['things'],
        'tips' => $row['tips'],
        'difficulty' => $row['difficulty'],
        'budget' => (float) $row['budget'],
        'transport' => (float) $row['transport'],
        'stay' => (float) $row['stay'],
        'food' => (float) $row['food'],
        'fee' => (float) $row['fee'],
        'accomDesc' => $row['accom_desc'],
        'hotels' => $row['hotels'],
        'restaurants' => $row['restaurants'],
        'homestay' => (bool) $row['homestay'],
        'parking' => (bool) $row['parking'],
        'toilets' => (bool) $row['toilets'],
        'coverImage' => $row['cover_image'],
        'startPoint' => $row['start_point'],
        'routeDesc' => $row['route_desc'],
        'destination' => $row['destination'],
        'submittedBy' => $row['submitted_by_name'] ?: 'Traveler',
        'status' => $row['status'],
        'submittedAt' => $row['submitted_at'],
        'approvedAt' => $row['approved_at'],
        'rating' => 4.8,
        'reviews' => 0
    ];
}

function text_field($name) {
    return trim($_POST[$name] ?? '');
}

function number_field($name) {
    return (float) ($_POST[$name] ?? 0);
}

function bool_field($name) {
    return isset($_POST[$name]) && in_array($_POST[$name], ['1', 'true', 'on', 'yes'], true);
}

$action = $_POST['action'] ?? $_GET['action'] ?? 'approved';

if ($action === 'approved') {
    $sql = "
        SELECT places.*, users.full_name AS submitted_by_name
        FROM places
        LEFT JOIN users ON users.id = places.submitted_by
        WHERE places.status = 'approved'
        ORDER BY places.approved_at DESC, places.submitted_at DESC
    ";
    $result = $conn->query($sql);
    $places = [];

    while ($row = $result->fetch_assoc()) {
        $places[] = row_to_place($row);
    }

    respond(['success' => true, 'places' => $places]);
}

if ($action === 'pending') {
    require_admin();
    $sql = "
        SELECT places.*, users.full_name AS submitted_by_name
        FROM places
        LEFT JOIN users ON users.id = places.submitted_by
        WHERE places.status = 'pending'
        ORDER BY places.submitted_at DESC
    ";
    $result = $conn->query($sql);
    $places = [];

    while ($row = $result->fetch_assoc()) {
        $places[] = row_to_place($row);
    }

    respond(['success' => true, 'places' => $places]);
}

if ($action === 'all') {
    require_admin();
    $sql = "
        SELECT places.*, users.full_name AS submitted_by_name
        FROM places
        LEFT JOIN users ON users.id = places.submitted_by
        WHERE places.status != 'rejected'
        ORDER BY places.submitted_at DESC
    ";
    $result = $conn->query($sql);
    $places = [];

    while ($row = $result->fetch_assoc()) {
        $places[] = row_to_place($row);
    }

    respond(['success' => true, 'places' => $places]);
}

if ($action === 'submit') {
    require_login();

    $name = text_field('name');
    $category = text_field('category');
    $shortDesc = text_field('shortDesc');
    $startPoint = text_field('start');
    $routeDesc = text_field('routeDesc');
    $destination = text_field('dest');

    if ($name === '' || $category === '' || $shortDesc === '' || $startPoint === '' || $routeDesc === '' || $destination === '') {
        respond(['success' => false, 'message' => 'Please complete all required fields.'], 400);
    }

    $stmt = $conn->prepare("
        INSERT INTO places (
            name, local_name, tagline, province, district, municipality, category,
            short_desc, best_time, duration, things, tips, difficulty,
            budget, transport, stay, food, fee, accom_desc, hotels, restaurants,
            homestay, parking, toilets, cover_image, start_point, route_desc,
            destination, submitted_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ");

    $localName = text_field('localName');
    $tagline = text_field('tagline');
    $province = text_field('province');
    $district = text_field('district');
    $municipality = text_field('municipality');
    $bestTime = text_field('bestTime');
    $duration = text_field('duration');
    $things = text_field('things');
    $tips = text_field('tips');
    $difficulty = text_field('difficulty') ?: 'Easy';
    $budget = number_field('budget');
    $transport = number_field('transport');
    $stay = number_field('stay');
    $food = number_field('food');
    $fee = number_field('fee');
    $accomDesc = text_field('accomDesc');
    $hotels = text_field('hotels');
    $restaurants = text_field('restaurants');
    $homestay = bool_field('homestay') ? 1 : 0;
    $parking = bool_field('parking') ? 1 : 0;
    $toilets = bool_field('toilets') ? 1 : 0;
    $coverImage = text_field('coverImage');
    $userId = (int) $_SESSION['id'];

    $stmt->bind_param(
        'sssssssssssssdddddsssiiissssi',
        $name,
        $localName,
        $tagline,
        $province,
        $district,
        $municipality,
        $category,
        $shortDesc,
        $bestTime,
        $duration,
        $things,
        $tips,
        $difficulty,
        $budget,
        $transport,
        $stay,
        $food,
        $fee,
        $accomDesc,
        $hotels,
        $restaurants,
        $homestay,
        $parking,
        $toilets,
        $coverImage,
        $startPoint,
        $routeDesc,
        $destination,
        $userId
    );

    if (!$stmt->execute()) {
        respond(['success' => false, 'message' => 'Unable to submit place.'], 500);
    }

    respond(['success' => true, 'message' => 'Place submitted for approval.', 'id' => $stmt->insert_id]);
}

if ($action === 'approve' || $action === 'reject' || $action === 'delete') {
    require_admin();
    $placeId = (int) ($_POST['place_id'] ?? 0);

    if ($placeId <= 0) {
        respond(['success' => false, 'message' => 'Invalid place.'], 400);
    }

    if ($action === 'delete') {
        $stmt = $conn->prepare('DELETE FROM places WHERE id = ?');
        $stmt->bind_param('i', $placeId);
        $stmt->execute();
        respond(['success' => true, 'message' => 'Place deleted.']);
    }

    $status = $action === 'approve' ? 'approved' : 'rejected';
    $adminId = (int) $_SESSION['id'];

    if ($status === 'approved') {
        $stmt = $conn->prepare("UPDATE places SET status = 'approved', approved_by = ?, approved_at = NOW(), rejected_at = NULL WHERE id = ?");
        $stmt->bind_param('ii', $adminId, $placeId);
    } else {
        $stmt = $conn->prepare("UPDATE places SET status = 'rejected', approved_by = NULL, rejected_at = NOW() WHERE id = ?");
        $stmt->bind_param('i', $placeId);
    }

    $stmt->execute();

    respond(['success' => true, 'message' => $status === 'approved' ? 'Place approved.' : 'Place rejected.']);
}

respond(['success' => false, 'message' => 'Invalid action.'], 400);
?>
