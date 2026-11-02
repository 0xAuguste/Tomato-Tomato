let allRecipes = []; // Every recipe with its filterable IDs, sorted by name (filled by loadRecipeList)

// Filters, in display order: the recipe_index.php field, dropdown label, and URL parameter.
// A recipe needs any one of a category's picks, or all of them with matchAll.
const filterCategories = [
    { field: 'sources', label: 'Author', param: 'author' },
    { field: 'cuisines', label: 'Cuisine', param: 'cuisine' },
    { field: 'meals', label: 'Meal', param: 'meal' },
    { field: 'seasons', label: 'Season', param: 'season' },
    { field: 'types', label: 'Type', param: 'type' },
    { field: 'ingredients', label: 'Contains', param: 'contains', matchAll: true }, // Garlic + onion means both
];
let tagFilters = {}; // createTagFilter results (tagFilter.js), keyed by field (filled by loadRecipeList)

document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('recipe-search');
    searchInput.value = new URLSearchParams(window.location.search).get('q') || ''; // Restore a search from the URL
    searchInput.addEventListener('input', applyFilters);
    searchInput.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            searchInput.value = '';
            applyFilters();
        }
    });

    await loadRecipeList();
});

// Function to fetch all recipes, sort them, set up the filters, and display them
async function loadRecipeList() {
    let recipeIndex;
    try {
        recipeIndex = await getRecipeIndex();
    } catch (error) {
        renderRecipeList([], "Couldn't load recipes. Try refreshing the page.");
        return;
    }

    if (recipeIndex.recipes.length === 0) {
        renderRecipeList([], "No recipes yet.");
        return;
    }

    // What the search box matches against: the name, description, and process
    recipeIndex.recipes.forEach(recipe => {
        recipe.searchText = normalizeText([recipe.name, recipe.description, recipe.process].join(' '));
    });

    // One dropdown per category that any recipe uses, with filters from the URL restored (e.g. ?cuisine=id,id)
    const urlParams = new URLSearchParams(window.location.search);
    filterCategories.forEach(category => {
        const options = recipeIndex.options[category.field];
        if (options.length === 0) return;
        tagFilters[category.field] = createTagFilter({
            container: document.getElementById('tag-filters'),
            pillContainer: document.getElementById('filter-pills'),
            label: category.label,
            options: options,
            onChange: applyFilters
        });
        const ids = urlParams.get(category.param);
        if (ids) tagFilters[category.field].setSelected(ids.split(','));
    });

    allRecipes = recipeIndex.recipes.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
    applyFilters();
}

// Lowercases and strips accents, so "creme" matches "Crème"
function normalizeText(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Function to show only the recipes matching the search box and filters, and keep them in the URL (?q=&cuisine=)
function applyFilters() {
    if (allRecipes.length === 0) return; // Still loading (the URL keeps its filters), or there are no recipes

    const query = document.getElementById('recipe-search').value.trim();
    const picked = filterCategories
        .filter(category => tagFilters[category.field])
        .map(category => ({ ...category, ids: tagFilters[category.field].getSelected() }));

    const url = new URL(window.location.href);
    if (query) {
        url.searchParams.set('q', query);
    } else {
        url.searchParams.delete('q');
    }
    picked.forEach(category => {
        if (category.ids.length > 0) {
            url.searchParams.set(category.param, category.ids.join(','));
        } else {
            url.searchParams.delete(category.param);
        }
    });
    history.replaceState(null, '', url);

    // Every word must appear somewhere in the recipe's search text, in any order,
    // and the recipe must have the picked options of every category (any one of them, or all with matchAll)
    const words = normalizeText(query).split(/\s+/).filter(Boolean);
    const matches = allRecipes.filter(recipe =>
        words.every(word => recipe.searchText.includes(word)) &&
        picked.every(category => {
            const hasOption = id => recipe[category.field].includes(id);
            return category.ids.length === 0 || (category.matchAll ? category.ids.every(hasOption) : category.ids.some(hasOption));
        })
    );
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
