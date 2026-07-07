<?php
session_start();
include 'db.php';

header('Content-Type: application/json');

function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'message' => 'Invalid request.'], 405);
}

$action = trim($_POST['action'] ?? 'verify');

// ── Resend OTP ──────────────────────────────────────────────────────────────
if ($action === 'resend') {
    $userId = (int) ($_SESSION['otp_user_id'] ?? 0);
    if ($userId <= 0) {
        respond(['success' => false, 'message' => 'Session expired. Please register again.'], 400);
    }

    $userStmt = $conn->prepare('SELECT full_name, email FROM users WHERE id = ?');
    $userStmt->bind_param('i', $userId);
    $userStmt->execute();
    $userRow = $userStmt->get_result()->fetch_assoc();
    if (!$userRow) {
        respond(['success' => false, 'message' => 'User not found.'], 404);
    }

    $otp     = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    $expires = date('Y-m-d H:i:s', time() + 600);

    $conn->query("DELETE FROM otp_verifications WHERE user_id = $userId");
    $otpStmt = $conn->prepare('INSERT INTO otp_verifications (user_id, otp_code, expires_at) VALUES (?, ?, ?)');
    $otpStmt->bind_param('iss', $userId, $otp, $expires);
    $otpStmt->execute();

    $body = "Hello {$userRow['full_name']},\n\nYour new verification code is:\n\n  $otp\n\nExpires in 10 minutes.\n\n— Nepal Discovery Team";
    @mail($userRow['email'], 'Nepal Discovery - New Verification Code', $body, "From: noreply@nepaldiscovery.com\r\n");

    $_SESSION['otp_dev'] = $otp;
    respond(['success' => true, 'message' => 'New OTP sent.', 'dev_otp' => $otp]);
}

// ── Verify OTP ──────────────────────────────────────────────────────────────
$userId  = (int) ($_SESSION['otp_user_id'] ?? 0);
$entered = trim($_POST['otp'] ?? '');

if ($userId <= 0) {
    respond(['success' => false, 'message' => 'Session expired. Please register again.'], 400);
}

if (strlen($entered) !== 6 || !ctype_digit($entered)) {
    respond(['success' => false, 'message' => 'Please enter a valid 6-digit code.'], 400);
}

// Fetch latest unused, unexpired OTP for this user
$otpStmt = $conn->prepare('
    SELECT id, otp_code, expires_at FROM otp_verifications
    WHERE user_id = ? AND used = 0 AND expires_at > NOW()
    ORDER BY created_at DESC LIMIT 1
');
$otpStmt->bind_param('i', $userId);
$otpStmt->execute();
$otpRow = $otpStmt->get_result()->fetch_assoc();

if (!$otpRow) {
    respond(['success' => false, 'message' => 'OTP has expired. Please request a new one.'], 400);
}

if ($otpRow['otp_code'] !== $entered) {
    respond(['success' => false, 'message' => 'Incorrect OTP. Please try again.'], 400);
}

// Mark OTP as used
$conn->query("UPDATE otp_verifications SET used = 1 WHERE id = {$otpRow['id']}");

// Mark user as verified
$conn->query("UPDATE users SET is_verified = 1 WHERE id = $userId");

// Fetch user details to log in
$userStmt = $conn->prepare('SELECT id, full_name, role FROM users WHERE id = ?');
$userStmt->bind_param('i', $userId);
$userStmt->execute();
$user = $userStmt->get_result()->fetch_assoc();

// Clean up old session records
$conn->query("DELETE FROM user_sessions WHERE user_id = $userId");

// Create session
session_regenerate_id(true);
$_SESSION['id']   = $user['id'];
$_SESSION['name'] = $user['full_name'];
$_SESSION['role'] = $user['role'];
unset($_SESSION['otp_user_id'], $_SESSION['otp_dev']);

// Store session token in DB
$sessionToken = bin2hex(random_bytes(32));
$insStmt = $conn->prepare('INSERT INTO user_sessions (user_id, session_token) VALUES (?, ?)');
$insStmt->bind_param('is', $user['id'], $sessionToken);
$insStmt->execute();
$_SESSION['session_token'] = $sessionToken;

// Set cookies for JS
setcookie('userRole',  $user['role'],      time() + 3600, '/');
setcookie('userName',  $user['full_name'], time() + 3600, '/');
setcookie('isAdmin',   $user['role'] === 'admin' ? 'true' : 'false', time() + 3600, '/');
setcookie('userId',    (string)$user['id'], time() + 3600, '/');

$redirect = $user['role'] === 'admin' ? '../public/HTML/admin.html' : '../public/HTML/index.html';
respond(['success' => true, 'message' => 'Email verified! Logging you in...', 'redirect' => $redirect]);
?>
