<?php
// Session helpers shared by the pages and the write endpoints.
// Must be called before any output, since sessions send a cookie header.

function startSession() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_set_cookie_params([
        'lifetime' => 0, // Until the browser closes
        'path' => '/',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', // Plain http on the local dev server
        'httponly' => true,
        'samesite' => 'Lax' // Other sites can't send POSTs with the cookie
    ]);
    session_start();
}

function isLoggedIn() {
    // Only visitors who already have a session cookie get a session started
    if (session_status() !== PHP_SESSION_ACTIVE && !isset($_COOKIE[session_name()])) {
        return false;
    }
    startSession();
    return isset($_SESSION['user_id']);
}

// For pages: send logged-out visitors to the login page, then back here afterward
function requireLoginPage() {
    if (!isLoggedIn()) {
        header('Location: /login/?next=' . urlencode($_SERVER['REQUEST_URI']));
        exit;
    }
}

// For JSON endpoints: reject logged-out requests
function requireLoginApi() {
    if (!isLoggedIn()) {
        http_response_code(401);
        echo json_encode(["error" => "Not logged in."]);
        exit;
    }
}

// Only allow redirects to paths on this site
function safeNextPath($next) {
    if (is_string($next) && str_starts_with($next, '/') && !str_starts_with($next, '//') && !str_contains($next, '\\')) {
        return $next;
    }
    return '/createrecipe/';
}

?>
