<?php
define('__ROOT__', dirname(__FILE__));

require_once(__ROOT__.'/backend/auth/session.php');
$loggedIn = isLoggedIn(); // Starts the session before any output, so the header can show Log Out
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
	<link href="/assets/css/recipe-index-v0.4.css" type="text/css" rel="stylesheet">
</head>
<body>
	<?php
	require_once(__ROOT__.'/backend/utils/printers.php');
	printHeader();
	?>

	<div id="recipe-body">
		<!-- Filters the list as you type or pick tags (recipeIndex.js) -->
		<div id="recipe-filters">
			<div id="search-bar">
				<label for="recipe-search" id="search-icon" aria-hidden="true">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="15.5" y1="15.5" x2="21" y2="21"/></svg>
				</label>
				<input type="search" id="recipe-search" aria-label="Search recipes" autocomplete="off">
				<button type="button" id="filter-toggle" aria-expanded="false" aria-controls="filter-panel">Add filters</button>
			</div>
			<div id="filter-panel" hidden>
				<div id="tag-filters"></div> <!-- One dropdown per category (tagFilter.js) -->
			</div>
			<div id="filter-pills"></div> <!-- Picked tags from every dropdown, shown even while the filters are hidden -->
		</div>
		<!-- Logged-in users get an edit link next to each recipe (recipeIndex.js) -->
		<ul id="recipe-list"<?php if ($loggedIn) echo ' data-logged-in'; ?>></ul>
	</div>

	<script src="/assets/js/db-handler.js?v=1"></script>
	<script src="/assets/js/tagFilter.js?v=1"></script>
	<script src="/assets/js/recipeIndex.js?v=2"></script>
</body>
</html>
