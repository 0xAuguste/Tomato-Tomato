<?php
require_once(__DIR__ . '/session.php');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /login/');
    exit;
}

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';
$next = safeNextPath($_POST['next'] ?? '');

// Sends the visitor back to the login form with an error code
function loginFailed($error, $next) {
    header('Location: /login/?error=' . $error . '&next=' . urlencode($next));
    exit;
}

try {
    require_once(__DIR__ . '/../DB/databaseKeys.php');
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    $sth = $pdo->prepare("SELECT id, password_hash FROM users WHERE username = :username LIMIT 1");
    $sth->bindValue(':username', $username);
    $sth->execute();
    $user = $sth->fetch();
}
catch (PDOException $e) {
    error_log("Login failed: " . $e->getMessage()); // Details stay in the server log
    loginFailed('server', $next);
}

if (!$user || !password_verify($password, $user['password_hash'])) {
    sleep(1); // Slows down password guessing
    loginFailed('invalid', $next);
}

startSession();
session_regenerate_id(true); // New session ID on login
$_SESSION['user_id'] = $user['id'];

header('Location: ' . $next);
exit;

?>
