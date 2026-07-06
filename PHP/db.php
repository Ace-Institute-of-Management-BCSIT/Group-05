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

$conn->query("\n    CREATE TABLE IF NOT EXISTS users (\n        id INT AUTO_INCREMENT PRIMARY KEY,\n        username VARCHAR(100) NOT NULL UNIQUE,\n        full_name VARCHAR(150) NOT NULL,\n        email VARCHAR(190) NOT NULL UNIQUE,\n        password VARCHAR(255) NOT NULL,\n        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4\n");

$conn->query("\n    CREATE TABLE IF NOT EXISTS places (\n        id INT AUTO_INCREMENT PRIMARY KEY,\n        name VARCHAR(190) NOT NULL,\n        local_name VARCHAR(190) DEFAULT '',\n        tagline VARCHAR(255) DEFAULT '',\n        province VARCHAR(100) DEFAULT '',\n        district VARCHAR(100) DEFAULT '',\n        municipality VARCHAR(150) DEFAULT '',\n        category VARCHAR(100) DEFAULT 'Other',\n        short_desc TEXT,\n        best_time VARCHAR(190) DEFAULT '',\n        duration VARCHAR(190) DEFAULT '',\n        things TEXT,\n        tips TEXT,\n        difficulty VARCHAR(80) DEFAULT 'Easy',\n        budget DECIMAL(10,2) DEFAULT 0,\n        transport DECIMAL(10,2) DEFAULT 0,\n        stay DECIMAL(10,2) DEFAULT 0,\n        food DECIMAL(10,2) DEFAULT 0,\n        fee DECIMAL(10,2) DEFAULT 0,\n        accom_desc TEXT,\n        hotels VARCHAR(255) DEFAULT '',\n        restaurants VARCHAR(255) DEFAULT '',\n        homestay TINYINT(1) DEFAULT 0,\n        parking TINYINT(1) DEFAULT 0,\n        toilets TINYINT(1) DEFAULT 0,\n        cover_image VARCHAR(255) DEFAULT '',\n        start_point VARCHAR(190) DEFAULT '',\n        route_desc TEXT,\n        destination VARCHAR(190) DEFAULT '',\n        submitted_by INT NULL,\n        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',\n        approved_by INT NULL,\n        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        approved_at DATETIME NULL,\n        rejected_at DATETIME NULL,\n        INDEX idx_places_status (status),\n        CONSTRAINT fk_places_submitted_by FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,\n        CONSTRAINT fk_places_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL\n    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4\n");

$conn->query("\n    CREATE TABLE IF NOT EXISTS saved_places (\n        user_id INT NOT NULL,\n        place_id INT NOT NULL,\n        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        PRIMARY KEY (user_id, place_id),\n        CONSTRAINT fk_saved_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4\n");

$conn->query("\n    CREATE TABLE IF NOT EXISTS planned_trips (\n        user_id INT NOT NULL,\n        place_id INT NOT NULL,\n        planned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        PRIMARY KEY (user_id, place_id),\n        CONSTRAINT fk_trips_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4\n");

$conn->query("\n    CREATE TABLE IF NOT EXISTS trip_notes (\n        id INT AUTO_INCREMENT PRIMARY KEY,\n        user_id INT NOT NULL,\n        place_id INT NOT NULL,\n        note_text TEXT NOT NULL,\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        CONSTRAINT fk_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4\n");

$conn->query("\n    CREATE TABLE IF NOT EXISTS place_reviews (\n        id INT AUTO_INCREMENT PRIMARY KEY,\n        place_id INT NOT NULL,\n        user_id INT NOT NULL,\n        rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),\n        comment TEXT NOT NULL,\n        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n        CONSTRAINT fk_place_reviews_place FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE,\n        CONSTRAINT fk_place_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE\n    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4\n");

$reviewIndexCheck = $conn->query("\n    SELECT COUNT(1) AS index_exists\n    FROM information_schema.statistics\n    WHERE table_schema = DATABASE()\n      AND table_name = 'place_reviews'\n      AND index_name = 'uniq_place_user'\n");

if ($reviewIndexCheck) {
    $reviewIndexRow = $reviewIndexCheck->fetch_assoc();
    if ((int) ($reviewIndexRow['index_exists'] ?? 0) > 0) {
        $conn->query("ALTER TABLE place_reviews DROP INDEX uniq_place_user");
    }
}

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
