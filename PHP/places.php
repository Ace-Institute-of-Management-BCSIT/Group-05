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

function current_user_payload() {
    if (!isset($_SESSION['id'])) {
        respond(['success' => false, 'message' => 'Please login first.'], 401);
    }

    return [
        'id' => (int) $_SESSION['id'],
        'name' => $_SESSION['name'] ?? '',
        'email' => $_SESSION['email'] ?? '',
        'role' => $_SESSION['role'] ?? 'user'
    ];
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
        'mapLatitude' => $row['map_latitude'] !== null ? (string) $row['map_latitude'] : '',
        'mapLongitude' => $row['map_longitude'] !== null ? (string) $row['map_longitude'] : '',
        'mapUrl' => $row['map_url'] ?: '',
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
        'rating' => (float) ($row['avg_rating'] ?? 0.0),
        'reviews' => (int) ($row['review_count'] ?? 0)
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

function existing_upload_path($path) {
    $path = trim((string) $path);
    if ($path === '' || $path === 'Submitted destination') {
        return '';
    }

    $path = ltrim($path, '/\\');
    $path = preg_replace('#^public/#i', '', $path);
    $path = str_replace(['..', "\0"], '', $path);

    if (!str_starts_with($path, 'uploads/')) {
        return '';
    }

    $uploadsDir = realpath(dirname(__DIR__) . '/public/uploads');
    $resolvedPath = realpath(dirname(__DIR__) . '/public/' . $path);

    if ($uploadsDir === false || $resolvedPath === false || strpos($resolvedPath, $uploadsDir) !== 0 || !is_file($resolvedPath)) {
        return '';
    }

    return $path;
}

$action = $_POST['action'] ?? $_GET['action'] ?? 'approved';

if ($action === 'session') {
    respond([
        'success' => true,
        'user' => current_user_payload()
    ]);
}

if ($action === 'approved') {
    $sql = "
        SELECT places.*, users.full_name AS submitted_by_name,
               COALESCE(AVG(pr.rating), 0.0) AS avg_rating,
               COUNT(pr.id) AS review_count
        FROM places
        LEFT JOIN users ON users.id = places.submitted_by
        LEFT JOIN place_reviews pr ON pr.place_id = places.id
        WHERE places.status = 'approved'
        GROUP BY places.id
        ORDER BY avg_rating DESC, places.approved_at DESC, places.submitted_at DESC
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
        SELECT places.*, users.full_name AS submitted_by_name,
               0.0 AS avg_rating,
               0 AS review_count
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
        SELECT places.*, users.full_name AS submitted_by_name,
               COALESCE(AVG(pr.rating), 0.0) AS avg_rating,
               COUNT(pr.id) AS review_count
        FROM places
        LEFT JOIN users ON users.id = places.submitted_by
        LEFT JOIN place_reviews pr ON pr.place_id = places.id
        WHERE places.status != 'rejected'
        GROUP BY places.id
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
    $mapLatitude = text_field('mapLatitude');
    $mapLongitude = text_field('mapLongitude');
    $mapUrl = text_field('mapUrl');

    if ($name === '' || $category === '' || $shortDesc === '' || $startPoint === '' || $routeDesc === '' || $destination === '') {
        respond(['success' => false, 'message' => 'Please complete all required fields.'], 400);
    }

    // Handle cover image upload
    $coverImage = '';
    if (isset($_FILES['coverImage']) && $_FILES['coverImage']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['coverImage'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $maxSize = 5 * 1024 * 1024; // 5 MB

        if (!in_array($file['type'], $allowedTypes)) {
            respond(['success' => false, 'message' => 'Invalid image type. Use JPG, PNG, GIF or WebP.'], 400);
        }
        if ($file['size'] > $maxSize) {
            respond(['success' => false, 'message' => 'Image must be smaller than 5 MB.'], 400);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $uploadDir = dirname(__DIR__) . '/public/uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $fileName = uniqid('place_', true) . '.' . strtolower($ext);
        $destPath = $uploadDir . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            respond(['success' => false, 'message' => 'Failed to save the uploaded image.'], 500);
        }
        $coverImage = 'uploads/' . $fileName;
    } else {
        $coverImage = existing_upload_path($_POST['coverImage'] ?? '');
    }

    $stmt = $conn->prepare("
        INSERT INTO places (
            name, local_name, tagline, province, district, municipality, map_latitude, map_longitude, map_url, category,
            short_desc, best_time, duration, things, tips, difficulty,
            budget, transport, stay, food, fee, accom_desc, hotels, restaurants,
            homestay, parking, toilets, cover_image, start_point, route_desc,
            destination, submitted_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, NULLIF(?, ''), NULLIF(?, ''), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    ");

    $localName = text_field('localName');
    $tagline = text_field('tagline');
    $province = text_field('province');
    $district = text_field('district');
    $municipality = text_field('municipality');
    $mapLatitude = text_field('mapLatitude');
    $mapLongitude = text_field('mapLongitude');
    $mapUrl = text_field('mapUrl');
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
    $userId = (int) $_SESSION['id'];

    $stmt->bind_param(
        'ssssssssssssssssdddddsssiiissssi',
        $name,
        $localName,
        $tagline,
        $province,
        $district,
        $municipality,
        $mapLatitude,
        $mapLongitude,
        $mapUrl,
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

    respond([
        'success' => true,
        'message' => 'Place submitted for approval.',
        'id' => $stmt->insert_id,
        'coverImage' => $coverImage
    ]);
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

if ($action === 'get_reviews' || $action === 'reviews') {
    $placeId = (int) ($_POST['place_id'] ?? $_GET['place_id'] ?? 0);
    if ($placeId <= 0) {
        respond(['success' => false, 'message' => 'Invalid place.'], 400);
    }
    
    $stmt = $conn->prepare("
        SELECT r.*, u.username, u.full_name 
        FROM place_reviews r
        JOIN users u ON u.id = r.user_id
        WHERE r.place_id = ?
        ORDER BY r.created_at DESC
    ");
    $stmt->bind_param('i', $placeId);
    $stmt->execute();
    $result = $stmt->get_result();
    $reviews = [];
    while ($row = $result->fetch_assoc()) {
        $reviews[] = [
            'id' => (int) $row['id'],
            'username' => $row['username'],
            'author' => $row['full_name'],
            'rating' => (int) $row['rating'],
            'comment' => $row['comment'],
            'date' => $row['created_at'],
            'createdAt' => $row['created_at'],
            'helpful' => 0
        ];
    }
    respond(['success' => true, 'reviews' => $reviews]);
}

if ($action === 'submit_review' || $action === 'add_review') {
    require_login();
    $placeId = (int) ($_POST['place_id'] ?? 0);
    $rating = (int) ($_POST['rating'] ?? 0);
    $comment = trim($_POST['comment'] ?? '');
    $userId = (int) $_SESSION['id'];

    if ($placeId <= 0 || $rating < 1 || $rating > 5 || $comment === '') {
        respond(['success' => false, 'message' => 'Invalid rating or comment.'], 400);
    }

    $stmt = $conn->prepare("
        INSERT INTO place_reviews (place_id, user_id, rating, comment) 
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)
    ");
    $stmt->bind_param('iiis', $placeId, $userId, $rating, $comment);
    
    if ($stmt->execute()) {
        respond(['success' => true, 'message' => 'Review submitted successfully.']);
    } else {
        respond(['success' => false, 'message' => 'Unable to save review.'], 500);
    }
}

if ($action === 'all_reviews') {
    require_admin();
    $result = $conn->query("
        SELECT r.*, u.username, u.full_name, p.name AS place_name
        FROM place_reviews r
        JOIN users u ON u.id = r.user_id
        JOIN places p ON p.id = r.place_id
        ORDER BY r.created_at DESC
    ");
    $reviews = [];
    while ($row = $result->fetch_assoc()) {
        $reviews[] = [
            'id' => (int) $row['id'],
            'placeId' => (int) $row['place_id'],
            'placeName' => $row['place_name'],
            'username' => $row['username'],
            'fullName' => $row['full_name'],
            'rating' => (int) $row['rating'],
            'comment' => $row['comment'],
            'createdAt' => $row['created_at']
        ];
    }
    respond(['success' => true, 'reviews' => $reviews]);
}

if ($action === 'delete_review') {
    require_admin();
    $reviewId = (int) ($_POST['review_id'] ?? 0);
    if ($reviewId <= 0) {
        respond(['success' => false, 'message' => 'Invalid review.'], 400);
    }
    
    $stmt = $conn->prepare("DELETE FROM place_reviews WHERE id = ?");
    $stmt->bind_param('i', $reviewId);
    if ($stmt->execute()) {
        respond(['success' => true, 'message' => 'Review deleted successfully.']);
    } else {
        respond(['success' => false, 'message' => 'Unable to delete review.'], 500);
    }
}

respond(['success' => false, 'message' => 'Invalid action.'], 400);
?>
