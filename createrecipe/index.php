<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Recipe Creator</title>
	<style>
		#new-ingredient-panel{
			border: 1px solid black;
		}
	</style>
</head>
<body>
	<?php
	define('__ROOT__', dirname(dirname(__FILE__)));
	require_once(__ROOT__.'/databaseKeys.php');
	?>

	<form method="POST">
		<input type="text" name="title" id="title" placeholder="Recipe Name"><br>
		<textarea name="description" id="description" placeholder="Optionally add a description or notes here"></textarea><br>
		<textarea name="process" id="process" placeholder="Write the recipe here"></textarea>
	</form><br>
	<div id="new-ingredient-panel" style="display: none">
		<form id="new-ingredient-form" method="POST" onsubmit="closeIngredientToggle()">
			<label for="ingred-name">Name</label>
			<input type="text" name="ingred-name" id="ingred-name" placeholder="e.g. 'Yellow Onion'">
			<label for="ingred-class">Group</label>
			<input type="text" name="ingred-class" id="ingred-class" placeholder="e.g. Onion">
			<input type="submit" value="Save">
		</form>
	</div>
	<button id="new-ingred-button" onclick="openIngredientToggle()">Add new ingredient</button>
	<?php
		if(isset($_POST['ingred-name'])) { 
			try {
				$dbh = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
			
				$sth = $dbh->prepare("INSERT INTO ingredient (ingred_name, ingred_class)
					VALUES (:ingred_name, :ingred_class)");
				$sth->bindValue(':ingred_name', $_POST['ingred-name']);
				$sth->bindValue(':ingred_class', $_POST['ingred-class']);
				$sth->execute();
			}
			catch(PDOException $e) {
				echo $e->getMessage();
			}
		} 
	?>
<script>
	function openIngredientToggle() {
		var panel = document.getElementById("new-ingredient-panel");
		panel.style.display = "block";
	}
	function closeIngredientToggle() {
		var panel = document.getElementById("new-ingredient-panel");
		panel.style.display = "none";
	}
</script>
</body>
</html>