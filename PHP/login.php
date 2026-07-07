<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../public/HTML/login.html');
    exit();
}

include 'db.php';

$email    = trim($_POST['email']    ?? '');
$password = trim($_POST['password'] ?? '');

if ($email === '' || $password === '') {
    $_SESSION['login_error'] = 'Email and password are required.';
    header('Location: ../public/HTML/login.html');
    exit();
}

$stmt = $conn->prepare('SELECT id, full_name, email, password, role, is_verified FROM users WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows === 1) {
    $user = $result->fetch_assoc();

    if (password_verify($password, $user['password']) || $password === $user['password']) {

        // Block unverified users — send them to OTP page
        if (!$user['is_verified']) {
            // Re-generate OTP so they can complete verification
            $otp     = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $expires = date('Y-m-d H:i:s', time() + 600);
            $conn->query("DELETE FROM otp_verifications WHERE user_id = {$user['id']}");
            $otpStmt = $conn->prepare('INSERT INTO otp_verifications (user_id, otp_code, expires_at) VALUES (?, ?, ?)');
            $otpStmt->bind_param('iss', $user['id'], $otp, $expires);
            $otpStmt->execute();
            $body    = "Hello {$user['full_name']},\n\nYour verification code is:\n\n  $otp\n\nExpires in 10 minutes.\n\n— Nepal Discovery Team";
            @mail($email, 'Nepal Discovery - Verify Your Email', $body, "From: noreply@nepaldiscovery.com\r\n");
            $_SESSION['otp_user_id'] = $user['id'];
            $_SESSION['otp_dev']     = $otp;
            $_SESSION['login_error'] = 'Please verify your email first. A new code has been sent.';
            header('Location: ../public/HTML/verify_otp.html');
            exit();
        }

        // Enforce single active session — destroy any existing session for this user
        $delStmt = $conn->prepare('SELECT session_token FROM user_sessions WHERE user_id = ?');
        $delStmt->bind_param('i', $user['id']);
        $delStmt->execute();
        $existingSessions = $delStmt->get_result();
        while ($row = $existingSessions->fetch_assoc()) {
            // Invalidate old PHP session data by starting and destroying it
            $oldToken = $row['session_token'];
            // We can't easily destroy another session here, so we just remove the DB record.
            // The old session will become orphaned and eventually expire.
        }
        // Remove all DB session records for this user
        $cleanStmt = $conn->prepare('DELETE FROM user_sessions WHERE user_id = ?');
        $cleanStmt->bind_param('i', $user['id']);
        $cleanStmt->execute();

        // Set current session data
        session_regenerate_id(true);
        $_SESSION['id']   = $user['id'];
        $_SESSION['name'] = $user['full_name'];
        $_SESSION['role'] = $user['role'];

        // Generate unique session token and store in DB
        $sessionToken = bin2hex(random_bytes(32));
        $insStmt = $conn->prepare('INSERT INTO user_sessions (user_id, session_token) VALUES (?, ?)');
        $insStmt->bind_param('is', $user['id'], $sessionToken);
        $insStmt->execute();

        // Also store token in session so we can validate it on protected pages
        $_SESSION['session_token'] = $sessionToken;

        setcookie('userRole',  $user['role'],       time() + 3600, '/');
        setcookie('userName',  $user['full_name'],  time() + 3600, '/');
        setcookie('isAdmin',   $user['role'] === 'admin' ? 'true' : 'false', time() + 3600, '/');
        setcookie('userId',    (string)$user['id'], time() + 3600, '/');

        // Also set localStorage-compatible cookies for JS checks
        if ($user['role'] === 'admin') {
            setcookie('adminName', $user['full_name'], time() + 3600, '/');
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
