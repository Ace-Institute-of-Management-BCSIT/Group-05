<?php
$conn = mysqli_connect('127.0.0.1', 'root', '');
$conn->select_db('nepal_travel');

$res = $conn->query("SELECT id, name, status FROM places");
while ($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | NAME: " . $row['name'] . " | STATUS: " . $row['status'] . "\n";
}
?>
