<?php
define('__ROOT__', dirname(__FILE__));

require_once(__ROOT__.'/backend/auth/session.php');
isLoggedIn(); // Starts the session before any output, so the header can show Log Out
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Tomato Tomato</title>
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap">
	<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap">
	<link href="/assets/css/main-v1.1.css" type="text/css" rel="stylesheet">
	<link href="/assets/css/recipe-index-v0.1.css" type="text/css" rel="stylesheet">
</head>
<body>
	<?php
	require_once(__ROOT__.'/backend/utils/printers.php');
	printHeader();
	?>

	<div id="recipe-body">
		<h1 id="recipe-title">Recipes</h1>
		<ul id="recipe-list"></ul>
	</div>

	<script src="/assets/js/db-handler.js"></script>
	<script src="/assets/js/recipeIndex.js"></script>
</body>
</html>
