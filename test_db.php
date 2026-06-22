<?php
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
try {
    include 'PHP/db.php';
    echo "DB check done.\n";
} catch (Exception $e) {
    echo "DB EXCEPTION: " . $e->getMessage() . "\n";
}
?>
