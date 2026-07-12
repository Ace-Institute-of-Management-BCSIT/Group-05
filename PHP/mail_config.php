<?php
/**
 * Local SMTP settings belong in mail_config.local.php or environment variables.
 * Never commit a Gmail app password to the repository.
 */

$localConfig = __DIR__ . '/mail_config.local.php';
if (is_file($localConfig)) {
    $settings = require $localConfig;
    if (is_array($settings)) {
        return $settings;
    }
}

return [
    'host' => getenv('SMTP_HOST') ?: 'smtp.gmail.com',
    'port' => (int) (getenv('SMTP_PORT') ?: 587),
    'username' => getenv('SMTP_USERNAME') ?: 'nepaltravel.170@gmail.com',
    'password' => getenv('SMTP_PASSWORD') ?: 'pcsd wotv xkmd okci',
    'from_email' => getenv('SMTP_FROM_EMAIL') ?: (getenv('SMTP_USERNAME') ?: 'nepaltravel.170@gmail.com'),
    'from_name' => getenv('SMTP_FROM_NAME') ?: 'Nepal Travel',
];
