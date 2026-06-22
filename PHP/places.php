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

function text_field($name, $maxLength = 2000) {
    $value = trim($_POST[$name] ?? '');
    return mb_substr($value, 0, $maxLength);
}

function number_field($name) {
    return (float) ($_POST[$name] ?? 0);
}

function bool_field($name) {
    return isset($_POST[$name]) && in_array($_POST[$name], ['1', 'true', 'on', 'yes'], true);
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
        'rating' => round((float) ($row['avg_rating'] ?? 0), 1),
        'reviews' => (int) ($row['reviews_count'] ?? 0)
    ];
}

function fetch_places($conn, $whereClause, $orderClause) {
    $sql = "
        SELECT
            places.*,
            users.full_name AS submitted_by_name,
            COALESCE(review_stats.avg_rating, 0) AS avg_rating,
            COALESCE(review_stats.reviews_count, 0) AS reviews_count
        FROM places
        LEFT JOIN users ON users.id = places.submitted_by
        LEFT JOIN (
            SELECT place_id, AVG(rating) AS avg_rating, COUNT(*) AS reviews_count
            FROM place_reviews
            GROUP BY place_id
        ) review_stats ON review_stats.place_id = places.id
        WHERE {$whereClause}
        {$orderClause}
    ";
    $result = $conn->query($sql);
    $places = [];

    while ($row = $result->fetch_assoc()) {
        $places[] = row_to_place($row);
    }

    return $places;
}

$action = $_POST['action'] ?? $_GET['action'] ?? 'approved';

if ($action === 'session') {
    require_login();
    respond([
        'success' => true,
        'user' => [
            'id' => (int) $_SESSION['id'],
            'name' => $_SESSION['name'] ?? 'User',
            'role' => $_SESSION['role'] ?? 'user'
        ]
    ]);
}

if ($action === 'approved') {
    $places = fetch_places(
        $conn,
        "places.status = 'approved'",
        'ORDER BY avg_rating DESC, reviews_count DESC, places.approved_at DESC, places.submitted_at DESC'
    );
    respond(['success' => true, 'places' => $places]);
}

if ($action === 'pending') {
    require_admin();
    $places = fetch_places(
        $conn,
        "places.status = 'pending'",
        'ORDER BY places.submitted_at DESC'
    );
    respond(['success' => true, 'places' => $places]);
}

if ($action === 'all') {
    require_admin();
    $places = fetch_places(
        $conn,
        "places.status != 'rejected'",
        'ORDER BY places.submitted_at DESC'
    );
    respond(['success' => true, 'places' => $places]);
}

if ($action === 'reviews') {
    $placeId = (int) ($_GET['place_id'] ?? 0);
    if ($placeId <= 0) {
        respond(['success' => false, 'message' => 'Invalid place.'], 400);
    }

    $checkPlace = $conn->prepare("SELECT id FROM places WHERE id = ? AND status = 'approved' LIMIT 1");
    $checkPlace->bind_param('i', $placeId);
    $checkPlace->execute();
    $placeResult = $checkPlace->get_result();
    if ($placeResult->num_rows === 0) {
        respond(['success' => false, 'message' => 'Place not found.'], 404);
    }

    $stmt = $conn->prepare("
        SELECT
            place_reviews.id,
            place_reviews.rating,
            place_reviews.comment,
            place_reviews.created_at,
            users.full_name AS author
        FROM place_reviews
        JOIN users ON users.id = place_reviews.user_id
        WHERE place_reviews.place_id = ?
        ORDER BY place_reviews.created_at DESC
    ");
    $stmt->bind_param('i', $placeId);
    $stmt->execute();
    $result = $stmt->get_result();
    $reviews = [];

    while ($row = $result->fetch_assoc()) {
        $reviews[] = [
            'id' => (int) $row['id'],
            'author' => $row['author'],
            'rating' => (int) $row['rating'],
            'comment' => $row['comment'],
            'createdAt' => $row['created_at']
        ];
    }

    respond(['success' => true, 'reviews' => $reviews]);
}

if ($action === 'all_reviews') {
    require_admin();
    $result = $conn->query("
        SELECT
            place_reviews.id,
            place_reviews.rating,
            place_reviews.comment,
            place_reviews.created_at,
            users.full_name AS author,
            places.name AS place_name
        FROM place_reviews
        JOIN users ON users.id = place_reviews.user_id
        JOIN places ON places.id = place_reviews.place_id
        ORDER BY place_reviews.created_at DESC
        LIMIT 300
    ");
    $reviews = [];

    while ($row = $result->fetch_assoc()) {
        $reviews[] = [
            'id' => (int) $row['id'],
            'author' => $row['author'],
            'placeName' => $row['place_name'],
            'rating' => (int) $row['rating'],
            'comment' => $row['comment'],
            'createdAt' => $row['created_at']
        ];
    }

    respond(['success' => true, 'reviews' => $reviews]);
}

if ($action === 'add_review') {
    require_login();

    $placeId = (int) ($_POST['place_id'] ?? 0);
    $rating = (int) ($_POST['rating'] ?? 0);
    $comment = text_field('comment', 1000);
    $userId = (int) $_SESSION['id'];

    if ($placeId <= 0 || $rating < 1 || $rating > 5 || $comment === '') {
        respond(['success' => false, 'message' => 'Please provide a valid rating and review.'], 400);
    }

    $placeStmt = $conn->prepare("SELECT id FROM places WHERE id = ? AND status = 'approved' LIMIT 1");
    $placeStmt->bind_param('i', $placeId);
    $placeStmt->execute();
    $placeResult = $placeStmt->get_result();
    if ($placeResult->num_rows === 0) {
        respond(['success' => false, 'message' => 'This place is not available for reviews.'], 404);
    }

    $stmt = $conn->prepare("
        INSERT INTO place_reviews (place_id, user_id, rating, comment)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            rating = VALUES(rating),
            comment = VALUES(comment),
            updated_at = CURRENT_TIMESTAMP
    ");
    $stmt->bind_param('iiis', $placeId, $userId, $rating, $comment);

    if (!$stmt->execute()) {
        respond(['success' => false, 'message' => 'Unable to save review.'], 500);
    }

    respond(['success' => true, 'message' => 'Your review has been saved.']);
}

if ($action === 'delete_review') {
    require_admin();
    $reviewId = (int) ($_POST['review_id'] ?? 0);
    if ($reviewId <= 0) {
        respond(['success' => false, 'message' => 'Invalid review.'], 400);
    }

    $stmt = $conn->prepare('DELETE FROM place_reviews WHERE id = ?');
    $stmt->bind_param('i', $reviewId);
    $stmt->execute();
    respond(['success' => true, 'message' => 'Review deleted.']);
}

if ($action === 'submit') {
    require_login();

    $name = text_field('name', 190);
    $category = text_field('category', 100);
    $shortDesc = text_field('shortDesc', 5000);
    $startPoint = text_field('start', 190);
    $routeDesc = text_field('routeDesc', 5000);
    $destination = text_field('dest', 190);

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

    $localName = text_field('localName', 190);
    $tagline = text_field('tagline', 255);
    $province = text_field('province', 100);
    $district = text_field('district', 100);
    $municipality = text_field('municipality', 150);
    $bestTime = text_field('bestTime', 190);
    $duration = text_field('duration', 190);
    $things = text_field('things', 5000);
    $tips = text_field('tips', 5000);
    $difficulty = text_field('difficulty', 80) ?: 'Easy';
    $budget = number_field('budget');
    $transport = number_field('transport');
    $stay = number_field('stay');
    $food = number_field('food');
    $fee = number_field('fee');
    $accomDesc = text_field('accomDesc', 5000);
    $hotels = text_field('hotels', 255);
    $restaurants = text_field('restaurants', 255);
    $homestay = bool_field('homestay') ? 1 : 0;
    $parking = bool_field('parking') ? 1 : 0;
    $toilets = bool_field('toilets') ? 1 : 0;
    $coverImage = text_field('coverImage', 255);
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
