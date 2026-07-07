<?php
session_start();
require 'db.php';
require 'otp.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$action = $_POST['action'] ?? '';

if ($action === 'send_otp_register') {
    // Step 1: User initiates registration, send OTP
    $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $full_name = trim($_POST['full_name'] ?? '');
    $password = trim($_POST['password'] ?? '');
    
    if (!$email || !$full_name || !$password) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }
    
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
        exit;
    }
    
    // Check if email already registered
    $emailCheck = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $emailCheck->bind_param('s', $email);
    $emailCheck->execute();
    $emailResult = $emailCheck->get_result();
    
    if ($emailResult->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        exit;
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
    
    echo json_encode($response);
}
elseif ($action === 'verify_otp_register') {
    // Step 2: User verifies OTP and completes registration
    $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
    $otp = trim($_POST['otp'] ?? '');
    
    if (!$email || !$otp || strlen($otp) !== 6) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email or OTP']);
        exit;
    }
    
    // Verify OTP
    $verifyResponse = verifyOTP($email, $otp, $conn);
    
    if (!$verifyResponse['success']) {
        echo json_encode($verifyResponse);
        exit;
    }
    
    // Get pending registration data from session
    $pending = $_SESSION['pending_registration'] ?? null;
    
    if (!$pending || $pending['email'] !== $email || (time() - $pending['timestamp']) > 1800) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Registration session expired. Please start over.']);
        exit;
    }
    
    // Create username from full name
    $username = strtolower(str_replace(' ', '_', $pending['full_name']));
    if ($username === '') {
        $username = 'user';
    }
    
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
        
        echo json_encode([
            'success' => true,
            'message' => 'Registration successful! You can now log in.',
            'redirect' => '../public/HTML/login.html'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
    }
}
else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
?>
