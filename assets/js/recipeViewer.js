document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    console.log(recipeId);

    if (recipeId) {
        await loadAndDisplayRecipe(recipeId);
    } else {
        document.getElementById('recipe-title').innerText = "Recipe ID Missing";
        document.getElementById('recipe-description').innerText = "Please provide a recipe ID in the URL (e.g., ?id=YOUR_RECIPE_ID).";
    }
});

// Function to load and display recipe data using the db-handler.js helper
async function loadAndDisplayRecipe(recipeId) {
    try {
        // Use the new helper function from db-handler.js
        const recipe = await getRecipeById(recipeId);

        // Check if the recipe object itself contains an error message (e.g., recipe not found)
        if (recipe.message) {
            document.getElementById('recipe-title').innerText = recipe.message;
            // Clear other fields if recipe not found
            document.getElementById('recipe-description').innerHTML = '';
            document.getElementById('ingredient-list').innerHTML = '';
            document.getElementById('recipe-process').innerHTML = '';
            document.getElementById('recipe-yield').innerText = '';
            document.getElementById('recipe-source').innerText = '';
            document.getElementById('recipe-cuisine').innerText = '';
            document.getElementById('recipe-meal').innerText = '';
            document.getElementById('recipe-season').innerText = '';
            document.getElementById('recipe-type').innerText = '';
            return;
        }

        displayRecipe(recipe);

    } catch (error) {
        document.getElementById('recipe-title').innerText = "Error loading recipe.";
        document.getElementById('recipe-description').innerText = "Please try again later.";
        // Clear other fields on error
        document.getElementById('ingredient-list').innerHTML = '';
        document.getElementById('recipe-process').innerHTML = '';
        document.getElementById('recipe-yield').innerText = '';
        document.getElementById('recipe-source').innerText = '';
        document.getElementById('recipe-cuisine').innerText = '';
        document.getElementById('recipe-meal').innerText = '';
        document.getElementById('recipe-season').innerText = '';
        document.getElementById('recipe-type').innerText = '';
    }
}

function displayRecipe(recipe) {
    document.getElementById('recipe-title').innerText = recipe.name;

    // Display Meta Data
    document.getElementById('recipe-yield').innerText = recipe.yield ? `Yield: ${recipe.yield}` : '';
    document.getElementById('recipe-source').innerText = recipe.source ? `Source: ${recipe.source}` : '';
    document.getElementById('recipe-cuisine').innerText = recipe.cuisine ? `Cuisine: ${recipe.cuisine}` : '';
    document.getElementById('recipe-meal').innerText = recipe.meal ? `Meal: ${recipe.meal}` : '';
    document.getElementById('recipe-season').innerText = recipe.season ? `Season: ${recipe.season}` : '';
    document.getElementById('recipe-type').innerText = recipe.type ? `Type: ${recipe.type}` : '';


    // Display Description
    const descriptionDiv = document.getElementById('recipe-description');
    if (recipe.description && recipe.description.length > 0) {
        recipe.description.forEach(paragraphText => {
            const p = document.createElement('p');
            p.classList.add('recipe-paragraph');
            p.innerText = paragraphText;
            descriptionDiv.appendChild(p);
        });
    } else {
        const p = document.createElement('p');
        p.classList.add('recipe-paragraph');
        p.innerText = "No description available.";
        descriptionDiv.appendChild(p);
    }

    // Display Ingredients
    const ingredientList = document.getElementById('ingredient-list');
    ingredientList.innerHTML = ''; // Clear previous ingredients
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        recipe.ingredients.forEach(ingredient => {
            const li = document.createElement('li');
            li.innerText = ingredient.displayText || `${ingredient.quantity || ''} ${ingredient.unitName || ''} ${ingredient.ingredientName}`;
            ingredientList.appendChild(li);
        });
    } else {
        const li = document.createElement('li');
        li.innerText = "No ingredients listed.";
        ingredientList.appendChild(li);
    }

    // Display Process
    const processDiv = document.getElementById('recipe-process');

    if (recipe.process && recipe.process.length > 0) {
        recipe.process.forEach(step => {
            const p = document.createElement('p');
            p.classList.add('recipe-paragraph');
            if (step.type === 'header') {
                const h3 = document.createElement('h3');
                h3.classList.add('section-header');
                h3.innerText = step.text;
                processDiv.appendChild(h3);
            } else if (step.type === 'ingredient') {
                const span = document.createElement('span');
                span.classList.add('ingredient-text');
                span.innerText = step.display; // Use the stored display text for ingredients
                p.appendChild(span);
                processDiv.appendChild(p);
            } else { // 'paragraph' type
                p.innerText = step.text;
                processDiv.appendChild(p);
            }
        });
    } else {
        const p = document.createElement('p');
        p.classList.add('recipe-paragraph');
        p.innerText = "No instructions available.";
        processDiv.appendChild(p);
    }
}