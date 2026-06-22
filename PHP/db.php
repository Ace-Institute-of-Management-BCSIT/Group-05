<?php
mysqli_report(MYSQLI_REPORT_OFF);

$host = '127.0.0.1';
$user = 'root';
$password = '';
$database = 'nepal_travel';

$conn = mysqli_connect($host, $user, $password);

if (!$conn) {
    die('Connection failed: ' . mysqli_connect_error());
}

mysqli_set_charset($conn, 'utf8');

$conn->query("CREATE DATABASE IF NOT EXISTS `$database` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$conn->select_db($database);
$conn->set_charset('utf8mb4');

$conn->query("
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(190) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

$conn->query("
    CREATE TABLE IF NOT EXISTS places (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(190) NOT NULL,
        local_name VARCHAR(190) DEFAULT '',
        tagline VARCHAR(255) DEFAULT '',
        province VARCHAR(100) DEFAULT '',
        district VARCHAR(100) DEFAULT '',
        municipality VARCHAR(150) DEFAULT '',
        category VARCHAR(100) DEFAULT 'Other',
        short_desc TEXT,
        best_time VARCHAR(190) DEFAULT '',
        duration VARCHAR(190) DEFAULT '',
        things TEXT,
        tips TEXT,
        difficulty VARCHAR(80) DEFAULT 'Easy',
        budget DECIMAL(10,2) DEFAULT 0,
        transport DECIMAL(10,2) DEFAULT 0,
        stay DECIMAL(10,2) DEFAULT 0,
        food DECIMAL(10,2) DEFAULT 0,
        fee DECIMAL(10,2) DEFAULT 0,
        accom_desc TEXT,
        hotels VARCHAR(255) DEFAULT '',
        restaurants VARCHAR(255) DEFAULT '',
        homestay TINYINT(1) DEFAULT 0,
        parking TINYINT(1) DEFAULT 0,
        toilets TINYINT(1) DEFAULT 0,
        cover_image VARCHAR(255) DEFAULT '',
        start_point VARCHAR(190) DEFAULT '',
        route_desc TEXT,
        destination VARCHAR(190) DEFAULT '',
        submitted_by INT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        approved_by INT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at DATETIME NULL,
        rejected_at DATETIME NULL,
        INDEX idx_places_status (status),
        CONSTRAINT fk_places_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT fk_places_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

$conn->query("
    CREATE TABLE IF NOT EXISTS saved_places (
        user_id INT NOT NULL,
        place_id INT NOT NULL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, place_id),
        CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

$conn->query("
    CREATE TABLE IF NOT EXISTS planned_trips (
        user_id INT NOT NULL,
        place_id INT NOT NULL,
        planned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, place_id),
        CONSTRAINT fk_trips_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

$conn->query("
    CREATE TABLE IF NOT EXISTS trip_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        place_id INT NOT NULL,
        note_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

$conn->query("
    CREATE TABLE IF NOT EXISTS place_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        place_id INT NOT NULL,
        user_id INT NOT NULL,
        rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_place_reviews_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,
        CONSTRAINT fk_place_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY uniq_place_user (place_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

$adminEmail = 'admin@example.com';
$adminCheck = $conn->prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
$adminCheck->execute();
$adminResult = $adminCheck->get_result();

if ($adminResult->num_rows === 0) {
    $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $adminStmt = $conn->prepare("INSERT IGNORE INTO users (username, full_name, email, password, role) VALUES ('admin', 'Admin User', ?, ?, 'admin')");
    $adminStmt->bind_param('ss', $adminEmail, $adminPassword);
    $adminStmt->execute();
}
?>
