<?php
include 'db.php';

$full_name = $_POST['full_name'];
$email = $_POST['email'];
$password = $_POST['password'];

$username = explode('@', $email)[0];

$sql = "INSERT INTO users (username, full_name, email, password)
        VALUES ('$username', '$full_name', '$email', '$password')";

if (mysqli_query($conn, $sql)) {
    echo "Registration Successful!";
    header("Location: ../index.php");
    exit();
} else {
    echo "Error: " . mysqli_error($conn);
}
?>