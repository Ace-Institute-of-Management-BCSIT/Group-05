<?php
session_start();
require_once 'db.php';
require_once 'otp.php';

header('Content-Type: application/json');

function respond($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function normalized_email($value) {
    $email = filter_var(trim((string) $value), FILTER_VALIDATE_EMAIL);
    return $email ? strtolower($email) : false;
}

function email_exists($conn, $email) {
    $emailCheck = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $emailCheck->bind_param('s', $email);
    $emailCheck->execute();
    return $emailCheck->get_result()->num_rows > 0;
}

function username_from_name($fullName) {
    $username = strtolower(trim($fullName));
    $username = preg_replace('/[^a-z0-9]+/', '_', $username);
    $username = trim($username, '_');

    return $username !== '' ? $username : 'user';
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['success' => false, 'message' => 'Method not allowed'], 405);
}

$action = $_POST['action'] ?? '';

if ($action === 'send_otp_register') {
    // Step 1: User initiates registration, send OTP
    $email = normalized_email($_POST['email'] ?? '');
    $full_name = preg_replace('/\s+/', ' ', trim($_POST['full_name'] ?? ''));
    $password = trim($_POST['password'] ?? '');
    
    if (!$full_name || !$password) {
        respond(['success' => false, 'message' => 'All fields are required'], 400);
    }

    if (!$email) {
        respond(['success' => false, 'message' => 'Please enter a valid email address'], 400);
    }
    
    if (strlen($password) < 6) {
        respond(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
    }
    
    // Check if email already registered
    if (email_exists($conn, $email)) {
        respond(['success' => false, 'message' => 'This email is already registered. Please log in instead.'], 409);
    }
    
    // Send OTP
    $response = sendOTP($email, $conn);
    
    if ($response['success']) {
        // Store registration data in session temporarily
        $_SESSION['pending_registration'] = [
            'email' => $email,
            'full_name' => $full_name,
            'password' => $password,
            'timestamp' => time()
        ];
    }
    
    respond($response, $response['success'] ? 200 : 400);
}
elseif ($action === 'resend_otp_register') {
    $pending = $_SESSION['pending_registration'] ?? null;

    if (!$pending || empty($pending['email']) || (time() - (int) $pending['timestamp']) > 1800) {
        unset($_SESSION['pending_registration']);
        respond(['success' => false, 'message' => 'Registration session expired. Please start again.'], 400);
    }

    $email = normalized_email($pending['email']);
    if (!$email || email_exists($conn, $email)) {
        unset($_SESSION['pending_registration']);
        respond(['success' => false, 'message' => 'This email is already registered. Please log in instead.'], 409);
    }

    $response = sendOTP($email, $conn);
    $_SESSION['pending_registration']['timestamp'] = time();
    respond($response, $response['success'] ? 200 : 400);
}
elseif ($action === 'verify_otp_register') {
    // Step 2: User verifies OTP and completes registration
    $email = normalized_email($_POST['email'] ?? '');
    $otp = trim($_POST['otp'] ?? '');
    
    if (!$email || !preg_match('/^\d{6}$/', $otp)) {
        respond(['success' => false, 'message' => 'Invalid email or OTP'], 400);
    }
    
    // Verify OTP
    $verifyResponse = verifyOTP($email, $otp, $conn);
    
    if (!$verifyResponse['success']) {
        respond($verifyResponse, 400);
    }
    
    // Get pending registration data from session
    $pending = $_SESSION['pending_registration'] ?? null;
    
    if (!$pending || $pending['email'] !== $email || (time() - $pending['timestamp']) > 1800) {
        unset($_SESSION['pending_registration']);
        respond(['success' => false, 'message' => 'Registration session expired. Please start over.'], 400);
    }

    if (email_exists($conn, $email)) {
        unset($_SESSION['pending_registration']);
        respond(['success' => false, 'message' => 'This email is already registered. Please log in instead.'], 409);
    }
    
    // Create username from full name
    $username = username_from_name($pending['full_name']);
    
    $baseUsername = $username;
    $counter = 1;
    
    while (true) {
        $checkStmt = $conn->prepare('SELECT id FROM users WHERE username = ?');
        $checkStmt->bind_param('s', $username);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            break;
        }
        
        $username = $baseUsername . $counter;
        $counter++;
    }
    
    // Create user account with is_verified = 1
    $hashedPassword = password_hash($pending['password'], PASSWORD_DEFAULT);
    $stmt = $conn->prepare('
        INSERT INTO users (username, full_name, email, password, role, is_verified) 
        VALUES (?, ?, ?, ?, "user", 1)
    ');
    $stmt->bind_param('ssss', $username, $pending['full_name'], $email, $hashedPassword);
    
    if ($stmt->execute()) {
        unset($_SESSION['pending_registration']);
        
        respond([
            'success' => true,
            'message' => 'Registration successful! You can now log in.',
            'redirect' => '../public/HTML/login.html'
        ]);
    } else {
        $message = $conn->errno === 1062
            ? 'This email is already registered. Please log in instead.'
            : 'Registration failed. Please try again.';
        respond(['success' => false, 'message' => $message], $conn->errno === 1062 ? 409 : 500);
    }
}
else {
    respond(['success' => false, 'message' => 'Invalid action'], 400);
}
?>
