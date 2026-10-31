<?php
define('__ROOT__', dirname(dirname(__FILE__)));

require_once(__ROOT__.'/backend/auth/session.php');

$next = safeNextPath($_GET['next'] ?? '');

// Already logged in, so skip the form
if (isLoggedIn()) {
	header('Location: ' . $next);
	exit;
}

$errors = [
	'invalid' => 'Invalid username or password.',
	'server' => 'Something went wrong. Please try again.'
];
$error = $errors[$_GET['error'] ?? ''] ?? '';
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Log In</title>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap">
	<link href="/assets/css/main-v1.1.css" type="text/css" rel="stylesheet">
	<link href="/assets/css/login-v0.1.css" type="text/css" rel="stylesheet">
</head>
<body>
	<?php
	require_once(__ROOT__.'/backend/utils/printers.php');
	printHeader();
	?>

	<div id="recipe-body">
		<form id="login-form" method="post" action="/backend/auth/login.php">
			<input type="hidden" name="next" value="<?php echo htmlspecialchars($next); ?>">

			<label class="section-label" for="login-username">Username</label>
			<input type="text" name="username" id="login-username" autocomplete="username" required autofocus>

			<label class="section-label" for="login-password">Password</label>
			<input type="password" name="password" id="login-password" autocomplete="current-password" required>

			<?php if ($error) { ?>
			<p id="login-error"><?php echo htmlspecialchars($error); ?></p>
			<?php } ?>

			<button type="submit" id="login-button">Log In</button>
		</form>
	</div>
</body>
</html>
