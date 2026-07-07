<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../public/HTML/login.html');
    exit();
}

include 'db.php';

$full_name = trim($_POST['full_name'] ?? '');
$email     = trim($_POST['email']     ?? '');
$password  = trim($_POST['password']  ?? '');

if ($full_name === '' || $email === '' || $password === '') {
    $_SESSION['register_error'] = 'Please fill in all fields.';
    header('Location: ../public/HTML/login.html');
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $_SESSION['register_error'] = 'Please enter a valid email address.';
    header('Location: ../public/HTML/login.html');
    exit();
}

if (strlen($password) < 6) {
    $_SESSION['register_error'] = 'Password must be at least 6 characters.';
    header('Location: ../public/HTML/login.html');
    exit();
}

// Check if email already exists
$emailCheck = $conn->prepare('SELECT id, full_name, is_verified FROM users WHERE email = ?');
$emailCheck->bind_param('s', $email);
$emailCheck->execute();
$emailResult = $emailCheck->get_result();

if ($emailResult->num_rows > 0) {
    $existingUser = $emailResult->fetch_assoc();
    if (!$existingUser['is_verified']) {
        // Email exists but not verified - resend OTP
        $_SESSION['otp_user_id'] = $existingUser['id'];
        $otp     = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expires = date('Y-m-d H:i:s', time() + 600);
        $existingUserId = (int) $existingUser['id'];
        $delOtpStmt = $conn->prepare('DELETE FROM otp_verifications WHERE user_id = ?');
        $delOtpStmt->bind_param('i', $existingUserId);
        $delOtpStmt->execute();
        $otpStmt = $conn->prepare('INSERT INTO otp_verifications (user_id, otp_code, expires_at) VALUES (?, ?, ?)');
        $otpStmt->bind_param('iss', $existingUserId, $otp, $expires);
        $otpStmt->execute();
        send_otp_email($email, $existingUser['full_name'], $otp);
        $_SESSION['otp_dev'] = $otp;
        header('Location: ../public/HTML/verify_otp.html');
        exit();
    }
    $_SESSION['register_error'] = 'An account with this email already exists. Please sign in.';
    header('Location: ../public/HTML/login.html');
    exit();
}

// Generate unique username
$username     = strtolower(preg_replace('/[^a-z0-9]/i', '_', $full_name));
$username     = $username ?: 'user';
$baseUsername = $username;
$counter      = 1;
while (true) {
    $checkStmt = $conn->prepare('SELECT id FROM users WHERE username = ?');
    $checkStmt->bind_param('s', $username);
    $checkStmt->execute();
    if ($checkStmt->get_result()->num_rows === 0) break;
    $username = $baseUsername . $counter++;
}

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare('INSERT INTO users (username, full_name, email, password, role, is_verified) VALUES (?, ?, ?, ?, "user", 0)');
$stmt->bind_param('ssss', $username, $full_name, $email, $hashedPassword);

if (!$stmt->execute()) {
    $_SESSION['register_error'] = 'Registration failed. Please try again.';
    header('Location: ../public/HTML/login.html');
    exit();
}

$userId = $conn->insert_id;

// Generate 6-digit OTP
$otp     = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$expires = date('Y-m-d H:i:s', time() + 600); // 10 minutes

$otpStmt = $conn->prepare('INSERT INTO otp_verifications (user_id, otp_code, expires_at) VALUES (?, ?, ?)');
$otpStmt->bind_param('iss', $userId, $otp, $expires);
$otpStmt->execute();

// Send OTP email
send_otp_email($email, $full_name, $otp);

// Store for verification step
$_SESSION['otp_user_id'] = $userId;
$_SESSION['otp_dev']     = $otp; // shown on-screen as dev fallback

header('Location: ../public/HTML/verify_otp.html');
exit();

// ─── Helper ────────────────────────────────────────────────────────────────
function send_otp_email(string $to, string $name, string $otp): bool {
    $subject = 'Nepal Discovery - Email Verification Code';
    $body    = "Hello $name,\n\nYour email verification code is:\n\n  $otp\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\n— Nepal Discovery Team";
    $headers = "From: noreply@nepaldiscovery.com\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    return @mail($to, $subject, $body, $headers);
}
?>
