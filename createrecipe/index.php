<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Recipe Creator</title>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap');
		@import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
	</style>
	<link href="/assets/css/recipeCreatorStyle.css" type="text/css" rel="stylesheet">
</head>
<body>
	<?php
	define('__ROOT__', dirname(dirname(__FILE__)));

	require_once(__ROOT__.'/backend/utils/printers.php');
	printHeader();
	?>
	
	<div id="recipe-body">
		<input name="recipe-title" class="text-entry" id="recipe-title" placeholder="Recipe Name" onkeypress="this.style.width = ((this.value.length)) + 'rem';">
		
		<h4 class="section-label">Recipe Description</h4>
		<div name="recipe-description" id="recipe-description" class="user-input text-entry" onclick="textBoxClick(event, this)">
			<p class="recipe-paragraph" contenteditable="true" onkeydown="textHandler(event, this)"></p>
		</div>
		
		<h4 class="section-label">Recipe Process</h4>
		<div name="recipe-process" id="recipe-process" class="user-input text-entry" onclick="textBoxClick(event, this)">
			<p class="recipe-paragraph" contenteditable="true" onkeydown="textHandler(event, this)"></p>
			<div id="add-ingredient-panel" class="ingredient-panel">
				<div class="x-page" onclick="closeAddIngredient()">✕</div>
				<div class="add-ingred-field">
					<label for="add-ingred-quantity">Quantity</label>
					<input type="number" name="add-ingred-quantity" id="add-ingred-quantity">
				</div>
				<div class="add-ingred-field">
					<label for="add-ingred-unit">Unit</label>
					<select name="add-ingred-unit" id="add-ingred-unit"></select>
				</div>
				<div class="add-ingred-field">
					<label for="add-ingred-test">Test</label>
					<input type="text" name="add-ingred-test" id="add-ingred-test" onkeyup="optionFilter(this, 'ingredient')">
					<ul class="dropdown-list">

					</ul>
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

	<script src="/assets/js/db-handler.js"></script>
	<script src="/assets/js/recipeData.js"></script>
	<script src="/assets/js/createRecipe.js"></script>
</body>
</html>