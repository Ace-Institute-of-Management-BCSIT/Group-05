<?php
session_start();
include 'db.php';

$email = $_POST['email'];
$password = $_POST['password'];

$sql = "SELECT * FROM users WHERE email='$email'";
$result = mysqli_query($conn, $sql);

if (mysqli_num_rows($result) > 0) {

    $user = mysqli_fetch_assoc($result);

    if ($password == $user['password']) {

        $_SESSION['id'] = $user['id'];
        $_SESSION['name'] = $user['full_name'];
        $_SESSION['role'] = $user['role'];

        if ($user['role'] == 'admin') {
            header("Location: ../admin_dashboard.php");
        } else {
            header("Location: ../user_dashboard.php");
        }

        exit();

    } else {
        echo "Incorrect Password!";
    }

} else {
    echo "User Not Found!";
}
?>