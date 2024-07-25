<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Recipe Creator</title>
</head>
<body>
	<form action="POST">
		<input type="text" name="title" id="title" placeholder="Recipe Name"><br>
		<textarea name="description" id="description" placeholder="Optionally add a description or notes here"></textarea><br>
		<textarea name="process" id="process" placeholder="Write the recipe here"></textarea><br>
		<button id="new-ingred-button" onclick="newIngredientToggle()">Click me!</button>
	</form>
</body>
</html>