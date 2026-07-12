<?php
session_start();
require_once 'db.php';

header('Content-Type: application/json');

function adminDataResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

if (($_SESSION['role'] ?? '') !== 'admin') {
    adminDataResponse(['success' => false, 'message' => 'Admin access required.'], 403);
}

function countRows($conn, $sql) {
    $result = $conn->query($sql);
    return $result ? (int) $result->fetch_assoc()['total'] : 0;
}

$stats = [
    'approvedPlaces' => countRows($conn, "SELECT COUNT(*) AS total FROM places WHERE status = 'approved'"),
    'pendingPlaces' => countRows($conn, "SELECT COUNT(*) AS total FROM places WHERE status = 'pending'"),
    'users' => countRows($conn, "SELECT COUNT(*) AS total FROM users WHERE role = 'user'"),
    'reviews' => countRows($conn, 'SELECT COUNT(*) AS total FROM place_reviews'),
    'today' => [
        'places' => countRows($conn, 'SELECT COUNT(*) AS total FROM places WHERE DATE(submitted_at) = CURDATE()'),
        'reviews' => countRows($conn, 'SELECT COUNT(*) AS total FROM place_reviews WHERE DATE(created_at) = CURDATE()'),
        'users' => countRows($conn, "SELECT COUNT(*) AS total FROM users WHERE role = 'user' AND DATE(created_at) = CURDATE()"),
        'pendingPlaces' => countRows($conn, "SELECT COUNT(*) AS total FROM places WHERE status = 'pending'"),
    ],
    'week' => [
        'places' => countRows($conn, 'SELECT COUNT(*) AS total FROM places WHERE submitted_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)'),
        'reviews' => countRows($conn, 'SELECT COUNT(*) AS total FROM place_reviews WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)'),
        'users' => countRows($conn, "SELECT COUNT(*) AS total FROM users WHERE role = 'user' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)"),
        'pendingPlaces' => countRows($conn, "SELECT COUNT(*) AS total FROM places WHERE status = 'pending' AND submitted_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)"),
    ],
];

$users = [];
$usersResult = $conn->query("SELECT id, username, full_name, email, role, is_verified, created_at, last_login FROM users ORDER BY created_at DESC");
while ($row = $usersResult->fetch_assoc()) {
    $users[] = [
        'id' => (int) $row['id'],
        'username' => $row['username'],
        'fullName' => $row['full_name'],
        'email' => $row['email'],
        'role' => $row['role'],
        'verified' => (bool) $row['is_verified'],
        'createdAt' => $row['created_at'],
        'lastLogin' => $row['last_login'],
    ];
}

$activities = [];
$activityResult = $conn->query("SELECT * FROM (
    SELECT 'place' AS type, p.name AS title, COALESCE(u.full_name, 'Traveler') AS actor, p.submitted_at AS occurred_at
    FROM places p LEFT JOIN users u ON u.id = p.submitted_by
    UNION ALL
    SELECT 'user' AS type, u.full_name AS title, u.username AS actor, u.created_at AS occurred_at
    FROM users u WHERE u.role = 'user'
    UNION ALL
    SELECT 'review' AS type, p.name AS title, COALESCE(u.full_name, 'Traveler') AS actor, r.created_at AS occurred_at
    FROM place_reviews r JOIN places p ON p.id = r.place_id LEFT JOIN users u ON u.id = r.user_id
) AS activity ORDER BY occurred_at DESC LIMIT 8");
while ($row = $activityResult->fetch_assoc()) {
    $activities[] = [
        'type' => $row['type'],
        'title' => $row['title'],
        'actor' => $row['actor'],
        'occurredAt' => $row['occurred_at'],
    ];
}

adminDataResponse(['success' => true, 'stats' => $stats, 'users' => $users, 'activities' => $activities]);
