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
	<link href="/assets/css/recipe-creator-v1.0.css" type="text/css" rel="stylesheet">
</head>
<body>
	<?php
	define('__ROOT__', dirname(dirname(__FILE__)));

	require_once(__ROOT__.'/backend/utils/printers.php');
	printHeader();
	?>
	
	<div id="recipe-body">
		<input name="recipe-title" id="recipe-title" placeholder="Recipe Name" autocomplete="off">

		<h4 class="section-label">Description</h4>
		<div name="recipe-description" id="recipe-description" class="user-input text-entry" onclick="textBoxClick(event, this)">
			<p class="recipe-paragraph" contenteditable="true" onkeydown="textHandler(event, this)"></p>
		</div>
		
		<h4 class="section-label">Process</h4>
		<div name="recipe-process" id="recipe-process" class="user-input text-entry" onclick="textBoxClick(event, this)">
			<p class="recipe-paragraph" contenteditable="true" onkeydown="textHandler(event, this)"></p>
		</div>
		<p id="shift-note"><b>Shift + Return</b> to add an ingredient</p>

		<h4 class="section-label">Other Optional Info</h4>
		<div id="recipe-metadata-bottom">
            <div class="metadata-field user-input">
                <div class="section-label">Yield</div>
                <input type="text" id="recipe-yield-input" class="user-input">
            </div>
            <div class="metadata-field user-input">
                <div class="section-label">Source</div>
                <div class="dropdown-container">
                    <input type="text" id="recipe-source-input" class="dropdown-input" onkeyup="optionFilter(this, 'source')" onblur="hideDropdown(this)">
                    <input type="hidden" id="recipe-source-id">
                    <div class="dropdown-list-container"><ul class="dropdown-list"></ul></div>
                </div>
            </div>
			<div class="metadata-field user-input">
                <div class="section-label">Cuisine</div>
                <div class="dropdown-container">
                    <input type="text" id="recipe-cuisine-input" class="dropdown-input" onkeyup="optionFilter(this, 'cuisine')" onblur="hideDropdown(this)">
                    <input type="hidden" id="recipe-cuisine-id">
                    <div class="dropdown-list-container"><ul class="dropdown-list"></ul></div>
                </div>
            </div>
            <div class="metadata-field user-input">
                <div class="section-label" onclick="document.getElementById('recipe-season-input').focus()">Season</div>
                <div class="dropdown-container">
                    <input type="text" id="recipe-season-input" class="dropdown-input" readonly
                        onfocus="showDropdown(this, 'season', true)"
                        onblur="hideDropdown(this)">
                    <input type="hidden" id="recipe-season-id">
                    <div class="dropdown-list-container"><ul class="dropdown-list"></ul></div>
                </div>
            </div>
            <div class="metadata-field user-input">
                <div class="section-label" onclick="document.getElementById('recipe-type-input').focus()">Type</div>
                <div class="dropdown-container">
                    <input type="text" id="recipe-type-input" class="dropdown-input" readonly
                        onfocus="showDropdown(this, 'type', true)"
                        onblur="hideDropdown(this)">
                    <input type="hidden" id="recipe-type-id">
                    <div class="dropdown-list-container"><ul class="dropdown-list"></ul></div>
                </div>
            </div>
            <div class="metadata-field user-input">
                <div class="section-label" onclick="document.getElementById('recipe-meal-input').focus()">Meal</div>
                <div class="dropdown-container">
                    <input type="text" id="recipe-meal-input" class="dropdown-input" readonly
                        onfocus="showDropdown(this, 'meal', true)"
                        onblur="hideDropdown(this)">
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
			<button type="submit" onclick="saveAddIngredient()">Add Ingredient to Recipe</button>

			<div id="create-ingredient-panel" class="ingredient-panel">
				<div class="add-ingred-field dropdown-container">
					<label for="create-ingred-name-input">Name</label>
					<input type="text" id="create-ingred-name-input" class="dropdown-input" autocomplete="off"
						onkeyup="optionFilter(this, 'ingredient')"
						onfocus="showDropdown(this, 'ingredient', false)"
						onblur="hideDropdown(this)">
					<input type="hidden" id="create-ingred-name-id">
					<div class="dropdown-list-container">
						<ul id="create-ingred-name-list" class="dropdown-list"></ul>
					</div>
				</div>
				<div class="add-ingred-field dropdown-container">
					<label for="create-ingred-class-input">Class</label>
					<input type="text" id="create-ingred-class-input" class="dropdown-input" autocomplete="off"
						onkeyup="optionFilter(this, 'ingredientCategory')"
						onfocus="showDropdown(this, 'ingredientCategory', true)"
						onblur="hideDropdown(this)">
					<input type="hidden" id="create-ingred-class-id">
					<div class="dropdown-list-container">
						<ul id="create-ingred-class-list" class="dropdown-list"></ul>
					</div>
				</div>
				<button type="submit" id="save-new-ingredient-button" onclick="saveNewIngredientToDB()">Save Ingredient To Database</button>
			</div>
		</div>
	</div>

	<script src="/assets/js/db-handler.js"></script>
	<script src="/assets/js/recipeData.js"></script>
	<script src="/assets/js/createRecipe.js"></script>
</body>
</html>