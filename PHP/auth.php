<?php

function app_session_start(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }
}

function has_active_login(mysqli $conn): bool {
    $userId = (int) ($_SESSION['id'] ?? 0);
    $token = (string) ($_SESSION['session_token'] ?? '');
    if ($userId <= 0 || $token === '') {
        return false;
    }

    $stmt = $conn->prepare('SELECT 1 FROM user_sessions WHERE user_id = ? AND session_token = ? LIMIT 1');
    if (!$stmt) {
        return false;
    }
    $stmt->bind_param('is', $userId, $token);
    $stmt->execute();
    return $stmt->get_result()->num_rows === 1;
}

function clear_login_session(mysqli $conn): void {
    $userId = (int) ($_SESSION['id'] ?? 0);
    $token = (string) ($_SESSION['session_token'] ?? '');
    if ($userId > 0 && $token !== '') {
        $stmt = $conn->prepare('DELETE FROM user_sessions WHERE user_id = ? AND session_token = ?');
        if ($stmt) {
            $stmt->bind_param('is', $userId, $token);
            $stmt->execute();
        }
    }

    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}
