document.addEventListener('DOMContentLoaded', async () => {
    await loadRecipeList();
});

// Function to fetch all recipes and display them as links to the recipe viewer (and, when logged in, the editor)
async function loadRecipeList() {
    const recipeList = document.getElementById('recipe-list');
    const loggedIn = 'loggedIn' in recipeList.dataset; // Set by index.php
    recipeList.innerHTML = ''; // Clear existing content

    const recipes = await getTableRows('recipe');

    // getTableRows returns an object (not an array) when the table is empty or the query fails
    if (!Array.isArray(recipes) || recipes.length === 0) {
        const li = document.createElement('li');
        li.innerText = "No recipes yet.";
        recipeList.appendChild(li);
        return;
    }

    recipes.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

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
            editLink.innerText = '\u270E'; // Pencil
            editLink.title = 'Edit';
            editLink.setAttribute('aria-label', `Edit ${recipe.name}`);
            li.appendChild(editLink);
        }
        recipeList.appendChild(li);
    });
}
