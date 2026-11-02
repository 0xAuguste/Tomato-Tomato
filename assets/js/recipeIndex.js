let allRecipes = []; // Every recipe, sorted by name (filled by loadRecipeList)

document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('recipe-search');
    searchInput.value = new URLSearchParams(window.location.search).get('q') || ''; // Restore a search from the URL
    searchInput.addEventListener('input', applySearch);
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            searchInput.value = '';
            applySearch();
        }
    });

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
    applySearch();
}

// Lowercases and strips accents, so "creme" matches "Crème"
function normalizeText(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Function to show only the recipes matching the search box, and keep the search in the URL (?q=)
function applySearch() {
    const query = document.getElementById('recipe-search').value.trim();

    const url = new URL(window.location.href);
    if (query) {
        url.searchParams.set('q', query);
    } else {
        url.searchParams.delete('q');
    }
    history.replaceState(null, '', url);

    if (allRecipes.length === 0) return; // Still loading, or there are no recipes ("No recipes yet." is already shown)

    // Every word must appear somewhere in the name, in any order
    const words = normalizeText(query).split(/\s+/).filter(Boolean);
    const matches = allRecipes.filter(recipe => {
        const name = normalizeText(recipe.name);
        return words.every(word => name.includes(word));
    });
    renderRecipeList(matches, "No recipes match.");
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
