document.addEventListener('DOMContentLoaded', async () => {
    await loadRecipeList();
});

// Function to fetch all recipes and display them as links to the recipe viewer
async function loadRecipeList() {
    const recipeList = document.getElementById('recipe-list');
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
        recipeList.appendChild(li);
    });
}
