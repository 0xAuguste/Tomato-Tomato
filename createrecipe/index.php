<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Recipe Creator</title>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap');
	</style>
	<link href="recipeCreatorStyle.css" type="text/css" rel="stylesheet">
	<script src="recipeData.js"></script>
</head>
<body>
	<?php
	define('__ROOT__', dirname(dirname(__FILE__)));
	require_once(__ROOT__.'/databaseKeys.php');
	require_once(__ROOT__.'/printers.php');

	$dbh = new PDO(DB_DSN, DB_USER, DB_PASSWORD);

	$sth = $dbh->prepare("SELECT ingred_name FROM ingredient");
	$sth->execute();
	$ingredients = $sth->fetchAll();

	printHeader();
	?>
	
	<div id="recipe-body">
		<input name="recipe-title" class="text-entry" id="recipe-title" placeholder="Recipe Name" onkeypress="this.style.width = ((this.value.length)) + 'rem';">
		
		<label for="recipe-description">Recipe Description</label>
		<div name="recipe-description" id="recipe-description" class="user-input text-entry">
			<p class="recipe-paragraph" contenteditable="true" onkeydown="textHandler(event, this)"></p>
		</div>
		
		<label for="recipe-process">Recipe Process</label>
		<div name="recipe-process" id="recipe-process" class="user-input text-entry" onclick="textBoxClick(event, this)">
			<p class="recipe-paragraph" contenteditable="true" onkeydown="textHandler(event, this)"></p>
			<div id="add-ingredient-panel" class="ingredient-panel">
				<div class="x-page" onclick="closeAddIngredient()">✕</div>
				<div class="add-ingred-field">
					<label for="add-ingred-quantity">Quantity</label>
					<input type="text" name="add-ingred-quantity" id="add-ingred-quantity">
				</div>
				<div class="add-ingred-field">
					<label for="add-ingred-unit">Unit</label>
					<input type="text" name="add-ingred-unit" id="add-ingred-unit">
				</div>
				<div class="add-ingred-field">
					<label for="add-ingred-name">Ingredient</label>
					<select name="add-ingred-name" id="add-ingred-name"></select>
				</div>
				<div class="add-ingred-field">
					<label for="add-ingred-display">Display Text</label>
					<input type="text" name="add-ingred-display" id="add-ingred-display">
				</div>
				<button type="submit" name="save" onclick="saveAddIngredient()">Add Ingredient to Recipe</button>
			</div>
		</div>
		<p id="shift-note"><b>Shift + Return</b> to add an ingredient</p>
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
	ingredDropdown = document.getElementById("add-ingred-name");
	printIngredients(ingredDropdown);
	let recipeData = new RecipeData();

	// FUNCTION DEFINITIONS

	// Toggles display of #add-ingredient-panel
	function openAddIngredient() {
		var panel = document.getElementById("add-ingredient-panel");
		panel.style.display = "block";
	}
	// Toggles display of #add-ingredient-panel
	function closeAddIngredient() {
		var panel = document.getElementById("add-ingredient-panel");
		panel.style.display = "none";
	}
	// Toggles display of #create-ingredient-panel
	function openCreateIngredient() {
		var panel = document.getElementById("create-ingredient-panel");
		panel.style.display = "block";
	}
	// Toggles display of #create-ingredient-panel
	function closeCreateIngredient() {
		var panel = document.getElementById("create-ingredient-panel");
		panel.style.display = "none";
	}
	// Main function to handle text entry into recipe body divs
	// Handles "Enter", "Shift + Enter", & "Delete" functionality
	function textHandler(e, elem) {
		if (e.key === "Enter") {
			e.preventDefault();

			if (e.shiftKey && elem.parentElement.id === "recipe-process") {
				openAddIngredient();
			}
			else {
				var newParagraph = document.createElement("p");
				newParagraph.classList.add("recipe-paragraph");
				newParagraph.setAttribute('contenteditable', 'true');
				newParagraph.setAttribute('onkeydown', 'textHandler(event, this)');
				elem.after(newParagraph);
				newParagraph.focus();
			}
		}
		else if (e.key === "Backspace" || e.key === "Delete") {
			if (elem.textContent == "" && elem.previousElementSibling !== null) {
				elem.previousElementSibling.focus();
				elem.remove();
			}
			else if (elem.children.length && elem.children[0].innerText === elem.innerText) {
				recipeData.removeIngredientByID(elem.children[0].id); // remove ingredient from data
				elem.children[0].remove(); // remove ingredient text span
			}
		}
	}
	// Handles user clicks in recipe body text divs to allow user to select appropriate <p> tags
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
	}
	// Helper function to convert an all lowercase work to a capitalized first letter
	function capitalize(word) {
		return word.charAt(0).toUpperCase()+ word.slice(1);
	}
	// Pushes new ingredient info entered by the user to the database
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
	// Adds ingredient to the recipe
	function saveAddIngredient() {
		let newIngredient = document.createElement("p");
		newIngredient.classList.add("recipe-paragraph");
		newIngredient.setAttribute('contenteditable', 'true');
		newIngredient.setAttribute('onkeydown', 'textHandler(event, this)');
		let ingredientText = document.createElement("span");
		ingredientText.setAttribute('contenteditable', 'false');
		ingredientText.classList.add("ingredient-text");
		ingredientText.setAttribute('onclick', 'editIngredient(this)');
		let id = Date.now();
		ingredientText.id = id;

		let name = document.getElementById("add-ingred-name").value;
		let quantity = document.getElementById("add-ingred-quantity").value;
		let unit = document.getElementById("add-ingred-unit").value;

		let ingredient = new Ingredient(id, name, quantity, unit);
		recipeData.addIngredient(ingredient);

		ingredientText.innerText = document.getElementById("add-ingred-display").value;
		newIngredient.append(ingredientText);
		let previousPara = document.getElementById("add-ingredient-panel").previousElementSibling
		previousPara.after(newIngredient);
		if (previousPara.innerText === "") {
			previousPara.remove();
		}

		closeAddIngredient();
		newIngredient.focus();
		console.log(recipeData);
	}
	// Opens ingredient editor for clicked ingredient
	function editIngredient(ingred) {
		
	}
	// Adds dropdown options of all ingredients in the database to a given <select> element
	function printIngredients(elem) {
		let ajax_request = new XMLHttpRequest();
		ajax_request.open('POST', 'get_ingredients.php');
		ajax_request.send();
		ajax_request.onreadystatechange = function() {
			if (ajax_request.readyState == 4 && ajax_request.status == 200) {
				
				for (ingredient of JSON.parse(ajax_request.responseText)) {
					let option = document.createElement("option");
					option.classList.add("ingred-option");
					option.innerText = ingredient.ingred_name;
					elem.add(option);
				}
			}
		}
	}
</script>
</body>
</html>