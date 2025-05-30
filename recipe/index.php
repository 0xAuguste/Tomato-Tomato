<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Recipe</title>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap');
		@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
	</style>
	<link href="/assets/css/recipeStyle.css" type="text/css" rel="stylesheet">
    <link href="/assets/css/main-v1.0.css" type="text/css" rel="stylesheet">
</head>
<body>
	<?php
	define('__ROOT__', dirname(dirname(__FILE__)));

	require_once(__ROOT__.'/backend/utils/printers.php');
	printHeader();
	?>
	
	<div id="recipe-body">
		<h1 name="recipe-title" id="recipe-title"></h1>
        <div name="recipe-description" id="recipe-description"></div>
        <div name="recipe-process" id="recipe-process"></div>
	</div>
	

	<script src="/assets/js/db-handler.js"></script>
	<script src="/assets/js/recipeData.js"></script>
	<script src="/assets/js/recipeViewer.js"></script>
</body>
</html>