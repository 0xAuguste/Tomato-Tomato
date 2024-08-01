<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Recipe Creator</title>
	<link href='https://fonts.googleapis.com/css?family=EB Garamond' rel='stylesheet'>
	<link href="recipeCreatorStyle.css" type="text/css" rel="stylesheet">
</head>
<body>
	<?php
	define('__ROOT__', dirname(dirname(__FILE__)));
	require_once(__ROOT__.'/databaseKeys.php');

	$dbh = new PDO(DB_DSN, DB_USER, DB_PASSWORD);

	$sth = $dbh->prepare("SELECT ingred_name FROM ingredient");
	$sth->execute();
	$ingredients = $sth->fetchAll();
	?>
	
	<div id="recipe-body">
		<input type="text" name="recipe-title" id="recipe-title" placeholder="Recipe Name">
		
		<label for="recipe-description">Recipe Description</label>
		<div name="recipe-description" id="recipe-description" class="user-input" contenteditable="true"></div>
		
		<label for="recipe-process">Recipe Process</label>
		<div name="recipe-process" id="recipe-process" class="user-input" onclick="textBoxClick(event, this)">
			<p class="recipe-paragraph" contenteditable="true" onkeydown="textHandler(event, this)"></p>
			<div id="add-ingredient-panel" style="display: none" contenteditable="false">
				<form id="add-ingredient-form">
					<div style="display: inline-block">
						<label for="add-ingred-quantity" style="display:block">Quantity</label>
						<input type="text" name="add-ingred-quantity" id="add-ingred-quantity">
					</div>
					<div style="display: inline-block">
						<label for="add-ingred-unit" style="display:block">Unit</label>
						<input type="text" name="add-ingred-unit" id="add-ingred-unit">
					</div>
					<div style="display: inline-block">
						<label for="add-ingred-name" style="display:block">Ingredient</label>
						<select name="add-ingred-name" id="add-ingred-name">
						<?php
						foreach ($ingredients as $ingredient) {
							echo "<option class=\'ingred-option\'>{$ingredient['ingred_name']}</option>";
						}
						?>
						</select>
					</div>
					<input type="submit" value="Add">
				</form>
				<span onclick="openCreateIngredient()">Create new ingredient</span>
			</div>
			<button id="new-ingred-button" onclick="openAddIngredient()" contenteditable="false">Add new ingredient</button>
		</div>
	</div>
	<div id="create-ingredient-panel" style="display: none">
		<form id="new-ingredient-form">
			<label for="new-ingred-name">Name</label>
			<input type="text" name="new-ingred-name" id="new-ingred-name" autocomplete="off" class="new-ingred-form" placeholder="e.g. 'Yellow Onion'">
			<label for="new-ingred-class">Group</label>
			<input type="text" name="new-ingred-class" id="new-ingred-class" autocomplete="off" class="new-ingred-form" placeholder="e.g. Onion">
			<button type="submit" name="save" class="new-ingred-form" onclick="saveNewIngredient(); return false;">Save</button>
		</form>
	</div>
<script>
	function openAddIngredient() {
		var panel = document.getElementById("add-ingredient-panel");
		panel.style.display = "block";
	}
	function closeAddIngredient() {
		var panel = document.getElementById("add-ingredient-panel");
		panel.style.display = "none";
	}
	function openCreateIngredient() {
		var panel = document.getElementById("create-ingredient-panel");
		panel.style.display = "block";
	}
	function closeCreateIngredient() {
		var panel = document.getElementById("create-ingredient-panel");
		panel.style.display = "none";
	}
	function textHandler(e, elem) {
		if (e.key === "Enter") {
			e.preventDefault();
			var newParagraph = document.createElement("p");
			newParagraph.classList.add("recipe-paragraph");
			newParagraph.setAttribute('contenteditable', 'true');
			newParagraph.setAttribute('onkeydown', 'textHandler(event, this)');
			elem.after(newParagraph);
			newParagraph.focus();
			console.log("Pressed enter!");
			return;
		}
		else if (e.key === "Backspace" || e.key === "Delete") {
			if (elem.textContent == "" && elem.previousElementSibling !== null) {
				elem.previousElementSibling.focus();
				elem.remove();
			}
			console.log("Pressed delete!");
			return;
		}
	}
	function textBoxClick(e, elem) {
		if (e.target === elem) {
			paragraphs = [];
			for (child of elem.children) {
				if (child.tagName == "P") {
					paragraphs.push(child);
				}
			}

			paragraphs.pop().focus();
		}

		return;
	}
	function saveNewIngredient() {
		let form_element = document.getElementsByClassName('new-ingred-form');
		let form_data = new FormData();

		for (let i = 0; i < form_element.length; i++) {
			form_data.append(form_element[i].name, form_element[i].value);
		}

		let ajax_request = new XMLHttpRequest();
		ajax_request.open('POST', 'new_ingredient.php');
		ajax_request.send(form_data);
		ajax_request.onreadystatechange = function() {
			if (ajax_request.readyState == 4 && ajax_request.status == 200) {
				document.getElementById('new-ingredient-form').reset();
				closeCreateIngredient();
				alert(ajax_request.responseText);
			}
		}
	}
</script>
</body>
</html>