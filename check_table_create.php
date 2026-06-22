<?php
$host = '127.0.0.1';
$user = 'root';
$password = '';
$database = 'nepal_travel';

$conn = mysqli_connect($host, $user, $password);
$conn->select_db($database);

$q = "
    CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        place_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT NOT NULL,
        review_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_reviews_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
        CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_place_review (user_id, place_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
";

$res = $conn->query($q);
if (!$res) {
    echo "ERROR: " . $conn->error . "\n";
} else {
    echo "SUCCESS\n";
}
?>
