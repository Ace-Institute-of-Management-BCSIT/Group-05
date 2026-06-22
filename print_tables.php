<?php
$conn = mysqli_connect('127.0.0.1', 'root', '');
$conn->select_db('nepal_travel');

$res = $conn->query("SHOW TABLES");
while ($row = $res->fetch_row()) {
    $table = $row[0];
    echo "TABLE: $table\n";
    $create = $conn->query("SHOW CREATE TABLE `$table`")->fetch_assoc();
    echo $create['Create Table'] . "\n\n";
}
?>
