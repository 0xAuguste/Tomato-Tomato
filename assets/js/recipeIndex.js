let allRecipes = []; // Every recipe, sorted by name (filled by loadRecipeList)

document.addEventListener('DOMContentLoaded', async () => {
    await loadRecipeList();
});

// Function to fetch all recipes, sort them, and display them
async function loadRecipeList() {
    const recipes = await getTableRows('recipe');

    // getTableRows returns an object (not an array) when the table is empty or the query fails
    if (!Array.isArray(recipes) || recipes.length === 0) {
        renderRecipeList([], "No recipes yet.");
        return;
    }

    recipes.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
    allRecipes = recipes;
    renderRecipeList(allRecipes);
}

// Function to display recipes as links to the recipe viewer (and, when logged in, the editor)
function renderRecipeList(recipes, emptyMessage) {
    const recipeList = document.getElementById('recipe-list');
    const loggedIn = 'loggedIn' in recipeList.dataset; // Set by index.php
    recipeList.innerHTML = ''; // Clear existing content

    if (recipes.length === 0) {
        const li = document.createElement('li');
        li.innerText = emptyMessage;
        recipeList.appendChild(li);
        return;
    }

    recipes.forEach(recipe => {
        const li = document.createElement('li');
        const link = document.createElement('a');
        link.href = `/recipe/?id=${encodeURIComponent(recipe.id)}`;
        link.innerText = recipe.name;
        li.appendChild(link);
        if (loggedIn) {
            const editLink = document.createElement('a');
            editLink.href = `/createrecipe/?id=${encodeURIComponent(recipe.id)}`;
            editLink.classList.add('edit-recipe');
            editLink.innerText = '✎'; // Pencil
            editLink.title = 'Edit';
            editLink.setAttribute('aria-label', `Edit ${recipe.name}`);
            li.appendChild(editLink);
        }
        recipeList.appendChild(li);
    });
}
