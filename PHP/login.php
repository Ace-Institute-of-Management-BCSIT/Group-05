<?php
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

$stmt = $conn->prepare('SELECT id, full_name, email, password, role FROM users WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $storedPassword = $user['password'];

    if (password_verify($password, $storedPassword) || $password === $storedPassword) {
        $_SESSION['id'] = $user['id'];
        $_SESSION['name'] = $user['full_name'];
        $_SESSION['role'] = $user['role'];

        setcookie('userRole', $user['role'], time() + 3600, '/');
        setcookie('userName', $user['full_name'], time() + 3600, '/');

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
