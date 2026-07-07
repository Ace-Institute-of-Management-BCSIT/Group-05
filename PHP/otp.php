<?php
require 'db.php';

header('Content-Type: application/json');

// Generate and send OTP
function sendOTP($email, $conn) {
    // Check if email already exists in users table
    $emailCheck = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $emailCheck->bind_param('s', $email);
    $emailCheck->execute();
    $emailResult = $emailCheck->get_result();
    
    if ($emailResult->num_rows > 0) {
        return [
            'success' => false,
            'message' => 'Email is already registered. Please log in.'
        ];
    }
    
    // Generate 6-digit OTP
    $otp = str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
    
    // Clear any existing OTP for this email
    $deleteOld = $conn->prepare("DELETE FROM otp_verifications WHERE email = ?");
    $deleteOld->bind_param('s', $email);
    $deleteOld->execute();
    
    // Insert new OTP with 10-minute expiry
    $expiryTime = date('Y-m-d H:i:s', time() + 600);
    $insertOTP = $conn->prepare("INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)");
    $insertOTP->bind_param('sss', $email, $otp, $expiryTime);
    
    if (!$insertOTP->execute()) {
        return [
            'success' => false,
            'message' => 'Failed to generate OTP'
        ];
    }
    
    // Send OTP via email
    $subject = 'Nepal Travel - Email Verification Code';
    $message = "Your verification code is: " . $otp . "\n\nThis code will expire in 10 minutes.\n\nDo not share this code with anyone.";
    $headers = "From: noreply@nepaltravel.com\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    
    // Using mail() function - make sure XAMPP has mail configured
    if (mail($email, $subject, $message, $headers)) {
        return [
            'success' => true,
            'message' => 'OTP sent to your email'
        ];
    } else {
        // For development: if mail() doesn't work, still return success and log OTP
        // In production, use SendGrid, Mailgun, or configure mail properly
        error_log("OTP for $email: $otp");
        return [
            'success' => true,
            'message' => 'OTP sent to your email (Dev mode: check logs)',
            'dev_otp' => $otp // Remove in production
        ];
    }
}

// Verify OTP
function verifyOTP($email, $otp, $conn) {
    $stmt = $conn->prepare("
        SELECT id, otp_code, attempts, max_attempts, expires_at, verified_at 
        FROM otp_verifications 
        WHERE email = ?
    ");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return [
            'success' => false,
            'message' => 'No OTP request found for this email'
        ];
    }
    
    $row = $result->fetch_assoc();
    
    // Check if already verified
    if ($row['verified_at'] !== null) {
        return [
            'success' => false,
            'message' => 'Email already verified'
        ];
    }
    
    // Check expiry
    if (strtotime($row['expires_at']) < time()) {
        return [
            'success' => false,
            'message' => 'OTP has expired. Please request a new one.'
        ];
    }
    
    // Check attempts
    if ($row['attempts'] >= $row['max_attempts']) {
        return [
            'success' => false,
            'message' => 'Maximum attempts exceeded. Please request a new OTP.'
        ];
    }
    
    // Verify OTP
    if ($row['otp_code'] !== $otp) {
        $newAttempts = $row['attempts'] + 1;
        $updateAttempts = $conn->prepare("UPDATE otp_verifications SET attempts = ? WHERE email = ?");
        $updateAttempts->bind_param('is', $newAttempts, $email);
        $updateAttempts->execute();
        
        return [
            'success' => false,
            'message' => 'Invalid OTP. Attempts remaining: ' . ($row['max_attempts'] - $newAttempts)
        ];
    }
    
    // Mark as verified
    $verifyTime = date('Y-m-d H:i:s');
    $markVerified = $conn->prepare("UPDATE otp_verifications SET verified_at = ? WHERE email = ?");
    $markVerified->bind_param('ss', $verifyTime, $email);
    $markVerified->execute();
    
    return [
        'success' => true,
        'message' => 'Email verified successfully'
    ];
}

// Route requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? $_GET['action'] ?? null;
    
    if ($action === 'send_otp') {
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        
        if (!$email) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid email address']);
            exit;
        }
        
        $response = sendOTP($email, $conn);
        echo json_encode($response);
    } 
    elseif ($action === 'verify_otp') {
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $otp = trim($_POST['otp'] ?? '');
        
        if (!$email || !$otp || strlen($otp) !== 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid email or OTP']);
            exit;
        }
        
        $response = verifyOTP($email, $otp, $conn);
        echo json_encode($response);
    }
    else {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
