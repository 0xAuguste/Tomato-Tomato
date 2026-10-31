<?php
require_once(__DIR__ . '/session.php');

if (isLoggedIn()) {
    $_SESSION = [];
    $params = session_get_cookie_params();
    setcookie(session_name(), '', [
        'expires' => time() - 3600,
        'path' => $params['path'],
        'secure' => $params['secure'],
        'httponly' => $params['httponly'],
        'samesite' => $params['samesite']
    ]);
    session_destroy();
}

header('Location: /');
exit;

?>
