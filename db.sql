CREATE DATABASE IF NOT EXISTS nepal_travel;
USE nepal_travel;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    profile_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_places (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    place_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_saved_place (user_id, place_id),
    CONSTRAINT fk_saved_places_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS planned_trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    place_id INT NOT NULL,
    planned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_planned_trip (user_id, place_id),
    CONSTRAINT fk_planned_trips_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS trip_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    place_id INT NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trip_notes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (
    username,
    full_name,
    email,
    password,
    role
)
SELECT 'admin', 'Administrator', 'admin@gmail.com', 'admin123', 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@gmail.com'
);



CREATE TABLE `places` (
  `id` int(11) NOT NULL,
  `name` varchar(190) NOT NULL,
  `local_name` varchar(190) DEFAULT '',
  `tagline` varchar(255) DEFAULT '',
  `province` varchar(100) DEFAULT '',
  `district` varchar(100) DEFAULT '',
  `municipality` varchar(150) DEFAULT '',
  `map_latitude` decimal(10,7) DEFAULT NULL,
  `map_longitude` decimal(10,7) DEFAULT NULL,
  `map_url` varchar(500) DEFAULT '',
  `category` varchar(100) DEFAULT 'Other',
  `short_desc` text DEFAULT NULL,
  `best_time` varchar(190) DEFAULT '',
  `duration` varchar(190) DEFAULT '',
  `things` text DEFAULT NULL,
  `tips` text DEFAULT NULL,
  `difficulty` varchar(80) DEFAULT 'Easy',
  `budget` decimal(10,2) DEFAULT 0.00,
  `transport` decimal(10,2) DEFAULT 0.00,
  `stay` decimal(10,2) DEFAULT 0.00,
  `food` decimal(10,2) DEFAULT 0.00,
  `fee` decimal(10,2) DEFAULT 0.00,
  `accom_desc` text DEFAULT NULL,
  `hotels` varchar(255) DEFAULT '',
  `restaurants` varchar(255) DEFAULT '',
  `homestay` tinyint(1) DEFAULT 0,
  `parking` tinyint(1) DEFAULT 0,
  `toilets` tinyint(1) DEFAULT 0,
  `cover_image` varchar(255) DEFAULT '',
  `start_point` varchar(190) DEFAULT '',
  `route_desc` text DEFAULT NULL,
  `destination` varchar(190) DEFAULT '',
  `submitted_by` int(11) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;




ALTER TABLE `places`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_places_status` (`status`),
  ADD KEY `fk_places_submitted_by` (`submitted_by`),
  ADD KEY `fk_places_approved_by` (`approved_by`);


ALTER TABLE `places`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;


ALTER TABLE `places`
  ADD CONSTRAINT `fk_places_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_places_submitted_by` FOREIGN KEY (`submitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;



CREATE TABLE `place_reviews` (
  `id` int(11) NOT NULL,
  `place_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;


ALTER TABLE `place_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_place_user` (`place_id`,`user_id`),
  ADD KEY `fk_reviews_user` (`user_id`),
  ADD KEY `idx_reviews_place` (`place_id`),
  ADD KEY `idx_reviews_created` (`created_at`);


ALTER TABLE `place_reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `place_reviews`
  ADD CONSTRAINT `fk_reviews_place` FOREIGN KEY (`place_id`) REFERENCES `places` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;



ALTER TABLE places
  ADD COLUMN map_latitude DECIMAL(10,7) NULL AFTER municipality,
  ADD COLUMN map_longitude DECIMAL(10,7) NULL AFTER map_latitude,
  ADD COLUMN map_url VARCHAR(500) NOT NULL DEFAULT '' AFTER map_longitude;