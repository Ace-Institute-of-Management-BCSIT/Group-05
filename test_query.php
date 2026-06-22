<?php
include 'PHP/db.php';
$sql = "
    SELECT places.*, users.full_name AS submitted_by_name,
           COALESCE(AVG(reviews.rating), 0.0) AS avg_rating,
           COUNT(reviews.id) AS review_count
    FROM places
    LEFT JOIN users ON users.id = places.submitted_by
    LEFT JOIN reviews ON reviews.place_id = places.id
    WHERE places.status = 'approved'
    GROUP BY places.id
    ORDER BY avg_rating DESC, places.approved_at DESC, places.submitted_at DESC
";
$result = $conn->query($sql);
if (!$result) {
    echo "ERROR: " . $conn->error . "\n";
} else {
    echo "SUCCESS: " . $result->num_rows . " rows found.\n";
}
?>
