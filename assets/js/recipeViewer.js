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

// Shows "By {authors}" (e.g. "A, B and C"), linking the authors' names to the source link if there is one
function displayAuthors(authors, link) {
    const sourceElem = document.getElementById('recipe-source');
    sourceElem.innerHTML = ''; // Clear existing content
    sourceElem.style.display = authors.length ? 'block' : 'none'; // hide if empty
    if (!authors.length) {
        return;
    }
    const author = authors.length > 1
        ? `${authors.slice(0, -1).join(', ')} and ${authors[authors.length - 1]}`
        : authors[0];

    sourceElem.appendChild(document.createTextNode('By '));
    if (link && /^https?:\/\//i.test(link)) { // Only web links
        const a = document.createElement('a');
        a.href = link;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.innerText = author;
        sourceElem.appendChild(a);
    } else {
        sourceElem.appendChild(document.createTextNode(author));
    }
}

// Returns a link to the recipe used as an ingredient, or a span if the ingredient isn't a recipe
function ingredientElement(text, linkedRecipeID) {
    if (!linkedRecipeID) {
        const span = document.createElement('span');
        span.innerText = text;
        return span;
    }
    const a = document.createElement('a');
    a.href = `/recipe/?id=${encodeURIComponent(linkedRecipeID)}`;
    a.classList.add('linked-recipe');
    a.innerText = text;
    return a;
}

// Returns a process paragraph built from its text and ingredient segments. linkedRecipes maps
// ingredient frontend IDs to the recipes they link to
function processParagraph(segments, linkedRecipes) {
    const p = document.createElement('p');
    p.classList.add('recipe-paragraph');
    segments.forEach(segment => {
        if (segment.type === 'text') {
            p.appendChild(document.createTextNode(segment.text));
        } else if (segment.type === 'ingredient') {
            const span = ingredientElement(segment.displayText, linkedRecipes.get(String(segment.id)));
            span.classList.add('ingredient-text');
            span.id = segment.id; // Frontend ID
            p.appendChild(span);
        }
    });
    return p;
}

// Function to load and display recipe data using the db-handler.js helper
async function loadAndDisplayRecipe(recipeId) {
    try {
        // Use the new helper function from db-handler.js
        const recipe = await getRecipeById(recipeId);

        // Display basic recipe info
        document.getElementById('recipe-title').innerText = recipe.name || 'Untitled Recipe';
        document.getElementById('recipe-yield').innerText = recipe.yield ? `Makes ${recipe.yield}` : '';
        document.getElementById('recipe-yield').style.display = recipe.yield ? 'block' : 'none'; // hide if empty
        displayAuthors(recipe.sources, recipe.sourceLink);
        document.getElementById('recipe-metadata').style.display = (!recipe.sources.length && !recipe.yield) ? 'none' : 'flex';

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

        // Recipes used as ingredients, keyed by frontend ID, so the process can link them too
        const linkedRecipes = new Map();

        if (recipe.ingredients && recipe.ingredients.length > 0) {
            recipe.ingredients.forEach(ingredient => {
                const li = document.createElement('li');
                // Use the stored displayText for the list item
                li.appendChild(ingredientElement(ingredient.displayText, ingredient.linkedRecipeID));
                ingredientList.appendChild(li);
                if (ingredient.linkedRecipeID) {
                    linkedRecipes.set(ingredient.frontendIngredID, ingredient.linkedRecipeID);
                }
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
                    const p = processParagraph(block.content, linkedRecipes);
                    if (block.content.length === 1 && block.content[0].type === 'ingredient') {
                        p.firstChild.classList.add('orphan');
                    }
                    processDiv.appendChild(p);
                } else if (block.type === 'list') {
                    // Flat list of paragraphs, as written in the editor (recipeEditor.js)
                    const list = document.createElement(block.ordered ? 'ol' : 'ul');
                    list.classList.add('recipe-list');
                    if (block.ordered && block.start) {
                        list.start = block.start;
                    }
                    block.items.forEach(item => {
                        const li = document.createElement('li');
                        li.appendChild(processParagraph(item, linkedRecipes));
                        list.appendChild(li);
                    });
                    processDiv.appendChild(list);
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