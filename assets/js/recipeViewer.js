document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

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

        // Display basic recipe info
        document.getElementById('recipe-title').innerText = recipe.name || 'Untitled Recipe';
        document.getElementById('recipe-yield').innerText = recipe.yield ? `Makes: ${recipe.yield}` : '';
        document.getElementById('recipe-yield').style.display = recipe.yield ? 'block' : 'none'; // hide if empty
        document.getElementById('recipe-source').innerText = recipe.source ? `From: ${recipe.source}` : '';
        document.getElementById('recipe-source').style.display = recipe.source ? 'block' : 'none'; // hide if empty
        document.getElementById('recipe-metadata').style.display = (!recipe.source && !recipe.yield) ? 'none' : 'flex';

        // Display Description
        const descriptionDiv = document.getElementById('recipe-description');
        descriptionDiv.innerHTML = ''; // Clear existing content
        // recipe.description is already parsed by get_recipe.php, so it's an array of objects
        const parsedDescription = recipe.description;

        if (parsedDescription && parsedDescription[0] !== "") {
            parsedDescription.forEach(paragraphText => {
            const p = document.createElement('p');
            p.classList.add('recipe-paragraph');
            p.innerText = paragraphText;
            descriptionDiv.appendChild(p);
            });
        } else {
            document.getElementById('recipe-description').style.display = 'none';
        }


        // Display Ingredients List (still as a simple list)
        const ingredientList = document.getElementById('ingredient-list');
        ingredientList.innerHTML = ''; // Clear existing content

        if (recipe.ingredients && recipe.ingredients.length > 0) {
            recipe.ingredients.forEach(ingredient => {
                const li = document.createElement('li');
                // Use the stored displayText for the list item
                li.innerText = ingredient.displayText;
                ingredientList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.innerText = "No ingredients listed.";
            ingredientList.appendChild(li);
        }

        // Display Process
        const processDiv = document.getElementById('recipe-process');
        processDiv.innerHTML = ''; // Clear existing content
        // recipe.process is already parsed by get_recipe.php, so it's an array of objects
        const parsedProcess = recipe.process;

        if (parsedProcess && parsedProcess.length > 0) {
            parsedProcess.forEach(block => {
                if (block.type === 'header') {
                    const header = document.createElement('p');
                    header.classList.add('section-header');
                    header.classList.add('recipe-paragraph');
                    header.innerText = block.text;
                    processDiv.appendChild(header);
                } else if (block.type === 'paragraph') {
                    const p = document.createElement('p');
                    p.classList.add('recipe-paragraph');
                    block.content.forEach(segment => {
                        if (segment.type === 'text') {
                            p.appendChild(document.createTextNode(segment.text));
                        } else if (segment.type === 'ingredient') {
                            const span = document.createElement('span');
                            span.classList.add('ingredient-text');
                            span.id = segment.id; // Frontend ID
                            span.innerText = segment.displayText;
                            if (block.content.length === 1) {
                                span.classList.add('orphan');
                            }
                            p.appendChild(span);
                        }
                    });
                    processDiv.appendChild(p);
                }
            });
        } else {
            const p = document.createElement('p');
            p.classList.add('recipe-paragraph');
            p.innerText = "No instructions available.";
            processDiv.appendChild(p);
        }
    } catch (error) {
        console.error("Error fetching or displaying recipe:", error);
        document.getElementById('recipe-title').innerText = "Error loading recipe.";
        document.getElementById('recipe-description').innerText = `Details: ${error.message}`;
        // Clear other fields on error
        document.getElementById('ingredient-list').innerHTML = '';
        document.getElementById('recipe-process').innerHTML = '';
        document.getElementById('recipe-yield').innerText = '';
        document.getElementById('recipe-source').innerText = '';
    }
}