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
		<input name="recipe-title" id="recipe-title" placeholder="Recipe Name" onkeypress="this.style.width = ((this.value.length)) + 'rem';" autocomplete="off">

		<h4 class="section-label">Recipe Description</h4>
		<div name="recipe-description" id="recipe-description" class="user-input text-entry" onclick="textBoxClick(event, this)">
			<p class="recipe-paragraph" contenteditable="true" onkeydown="textHandler(event, this)"></p>
		</div>
		
		<h4 class="section-label">Recipe Process</h4>
		<div name="recipe-process" id="recipe-process" class="user-input text-entry" onclick="textBoxClick(event, this)">
			<p class="recipe-paragraph" contenteditable="true" onkeydown="textHandler(event, this)"></p>
		</div>
		<p id="shift-note"><b>Shift + Return</b> to add an ingredient</p>

		<div id="recipe-metadata-bottom">
            <div class="metadata-field user-input">
                <div class="section-label">Yield</div>
                <input type="text" id="recipe-yield-input" class="user-input" placeholder="e.g., 4 servings">
            </div>
            <div class="metadata-field user-input">
                <div class="section-label">Source</div>
                <div class="dropdown-container">
                    <input type="text" id="recipe-source-input" class="dropdown-input" onkeyup="optionFilter(this, 'source')" onfocus="showDropdown(this, 'source', false)" onblur="hideDropdown(this)">
                    <input type="hidden" id="recipe-source-id">
                    <div class="dropdown-list-container"><ul class="dropdown-list"></ul></div>
                </div>
            </div>
			<div class="metadata-field user-input">
                <div class="section-label">Cuisine</div>
                <div class="dropdown-container">
                    <input type="text" id="recipe-cuisine-input" class="dropdown-input" onkeyup="optionFilter(this, 'cuisine')" onfocus="showDropdown(this, 'cuisine', false)" onblur="hideDropdown(this)" placeholder="e.g., Italian">
                    <input type="hidden" id="recipe-cuisine-id">
                    <div class="dropdown-list-container"><ul class="dropdown-list"></ul></div>
                </div>
            </div>
            <div class="metadata-field user-input">
                <div class="section-label" onclick="document.getElementById('recipe-season-input').focus()">Season</div>
                <div class="dropdown-container">
                    <input type="text" id="recipe-season-input" class="dropdown-input" readonly
                        onfocus="showDropdown(this, 'season', true)"
                        onblur="hideDropdown(this)" placeholder="Select Season">
                    <input type="hidden" id="recipe-season-id">
                    <div class="dropdown-list-container"><ul class="dropdown-list"></ul></div>
                </div>
            </div>
            <div class="metadata-field user-input">
                <div class="section-label" onclick="document.getElementById('recipe-type-input').focus()">Type</div>
                <div class="dropdown-container">
                    <input type="text" id="recipe-type-input" class="dropdown-input" readonly
                        onfocus="showDropdown(this, 'type', true)"
                        onblur="hideDropdown(this)" placeholder="Select Type">
                    <input type="hidden" id="recipe-type-id">
                    <div class="dropdown-list-container"><ul class="dropdown-list"></ul></div>
                </div>
            </div>
            <div class="metadata-field user-input">
                <div class="section-label" onclick="document.getElementById('recipe-meal-input').focus()">Meal</div>
                <div class="dropdown-container">
                    <input type="text" id="recipe-meal-input" class="dropdown-input" readonly
                        onfocus="showDropdown(this, 'meal', true)"
                        onblur="hideDropdown(this)" placeholder="Select Meal">
                    <input type="hidden" id="recipe-meal-id">
                    <div class="dropdown-list-container"><ul class="dropdown-list"></ul></div>
                </div>
            </div>
        </div>
	</div>
	<button type="button" id="save-recipe-button" onclick="saveRecipe()">Save Recipe</button>

	<div id="add-ingredient-panel" style="display: none">
		<div class="ingredient-panel-content">
			<span class="close-button" onclick="closeAddIngredient()">&times;</span>

			<div class="ingredient-panel">
				<div class="add-ingred-field">
					<label for="add-ingred-quantity">Quantity</label>
					<input type="text" name="add-ingred-quantity" id="add-ingred-quantity" autocomplete="off">
				</div>
				
				<div class="add-ingred-field dropdown-container">
					<label for="add-ingred-unit-input">Unit</label>
					<input type="text" id="add-ingred-unit-input" class="dropdown-input" autocomplete="off"
						onkeyup="optionFilter(this, 'unit')"
						onfocus="showDropdown(this, 'unit', true)"
						onblur="hideDropdown(this)">
					<input type="hidden" id="add-ingred-unit-id">
					<div class="dropdown-list-container">
						<ul id="add-ingred-unit-list" class="dropdown-list"></ul>
					</div>
				</div>

				<div class="add-ingred-field dropdown-container">
					<label for="add-ingred-name-input">Ingredient</label>
					<input type="text" id="add-ingred-name-input" class="dropdown-input" autocomplete="off"
						onkeyup="optionFilter(this, 'ingredient')"
						onfocus="showDropdown(this, 'ingredient', false)"
						onblur="hideDropdown(this)">
					<input type="hidden" id="add-ingred-name-id">
					<div class="dropdown-list-container">
						<ul id="add-ingred-name-list" class="dropdown-list"></ul>
					</div>
				</div>

				<div class="add-ingred-field">
					<label for="add-ingred-display">Display Text</label>
					<input type="text" name="add-ingred-display" id="add-ingred-display" autocomplete="off">
				</div>
			</div>
			<button type="submit" name="save" onclick="saveAddIngredient()">Add Ingredient to Recipe</button>
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

	<script src="/assets/js/db-handler.js"></script>
	<script src="/assets/js/recipeData.js"></script>
	<script src="/assets/js/createRecipe.js"></script>
</body>
</html>