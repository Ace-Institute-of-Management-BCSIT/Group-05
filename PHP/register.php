<?php
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../public/HTML/login.html');
    exit();
}

include 'db.php';

$full_name = trim($_POST['full_name'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = trim($_POST['password'] ?? '');

if ($full_name === '' || $email === '' || $password === '') {
    $_SESSION['register_error'] = 'Please fill in all fields.';
    header('Location: ../public/HTML/login.html');
    exit();
}

$username = strtolower(str_replace(' ', '_', $full_name));
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

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare('INSERT INTO users (username, full_name, email, password, role) VALUES (?, ?, ?, ?, "user")');
$stmt->bind_param('ssss', $username, $full_name, $email, $hashedPassword);

if ($stmt->execute()) {
    header('Location: ../public/HTML/login.html?registered=1');
    exit();
}

$_SESSION['register_error'] = 'Registration failed. Please try again.';
header('Location: ../public/HTML/login.html');
exit();
?>
