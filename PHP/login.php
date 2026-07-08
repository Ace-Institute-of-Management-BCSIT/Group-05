<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../public/HTML/login.html');
    exit();
}

include 'db.php';

$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if ($email === '' || $password === '') {
    $_SESSION['login_error'] = 'Email and password are required.';
    header('Location: ../public/HTML/login.html');
    exit();
}

$stmt = $conn->prepare("
    SELECT id, full_name, email, password, role, is_verified, last_login_ip
    FROM users
    WHERE email = ?
");

if (!$stmt) {
    die("Prepare failed: " . $conn->error);
}
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $storedPassword = $user['password'];

    // Check if email is verified
    if (!$user['is_verified']) {
        $_SESSION['login_error'] = 'Please verify your email before logging in. Check your email for the verification link.';
        header('Location: ../public/HTML/login.html');
        exit();
    }

    if (password_verify($password, $storedPassword)) {
        // Get current IP
        $clientIP = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? 
                   $_SERVER['HTTP_X_FORWARDED_FOR'] ?? 
                   $_SERVER['REMOTE_ADDR'] ?? 
                   '0.0.0.0';
        
        // Extract first IP if comma-separated
        if (strpos($clientIP, ',') !== false) {
            $clientIP = trim(explode(',', $clientIP)[0]);
        }

        // Check for duplicate login from different IP
        if ($user['last_login_ip'] !== null && $user['last_login_ip'] !== $clientIP) {
            // Different IP - force previous session logout
            // In production, could send notification email
            $logoutPreviousIP = $conn->prepare("
                UPDATE users SET last_login_ip = NULL WHERE id = ?
            ");
            $logoutPreviousIP->bind_param('i', $user['id']);
            $logoutPreviousIP->execute();
        }

        // Update last login info
        $now = date('Y-m-d H:i:s');
        $updateLogin = $conn->prepare("
            UPDATE users SET last_login = ?, last_login_ip = ? WHERE id = ?
        ");
        $updateLogin->bind_param('ssi', $now, $clientIP, $user['id']);
        $updateLogin->execute();

        session_regenerate_id(true);
        $_SESSION['id'] = $user['id'];
        $_SESSION['name'] = $user['full_name'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['session_token'] = bin2hex(random_bytes(32));

        $sessionCleanup = $conn->prepare('DELETE FROM user_sessions WHERE user_id = ?');
        if ($sessionCleanup) {
            $sessionCleanup->bind_param('i', $user['id']);
            $sessionCleanup->execute();
        }

        $sessionInsert = $conn->prepare('INSERT INTO user_sessions (user_id, session_token) VALUES (?, ?)');
        if ($sessionInsert) {
            $sessionInsert->bind_param('is', $user['id'], $_SESSION['session_token']);
            $sessionInsert->execute();
        }

        $cookieOptions = [
            'expires' => time() + 3600,
            'path' => '/',
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => false,
            'samesite' => 'Lax'
        ];

        setcookie('userRole', $user['role'], $cookieOptions);
        setcookie('userName', $user['full_name'], $cookieOptions);

        if ($user['role'] === 'admin') {
            header('Location: ../public/HTML/admin.html');
        } else {
            header('Location: ../public/HTML/index.html');
        }
        exit();
    }
}

$_SESSION['login_error'] = 'Invalid email or password.';
header('Location: ../public/HTML/login.html');
exit();
?>
