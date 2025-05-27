printOptions(document.getElementById("add-ingred-unit"), 'unit');
printOptions(document.getElementById("add-ingred-name"), 'ingredient');
let recipeData = new RecipeData();

// FUNCTION DEFINITIONS

// Toggles display of #add-ingredient-panel
function openAddIngredient() {
    var panel = document.getElementById("add-ingredient-panel");
    panel.style.display = "flex";
}

// Toggles display of #add-ingredient-panel
function closeAddIngredient() {
    var panel = document.getElementById("add-ingredient-panel");
    panel.style.display = "none";
}

// Toggles display of #create-ingredient-panel
function openCreateIngredient() {
    var panel = document.getElementById("create-ingredient-panel");
    panel.style.display = "flex";
}

// Toggles display of #create-ingredient-panel
function closeCreateIngredient() {
    var panel = document.getElementById("create-ingredient-panel");
    panel.style.display = "none";
}

// Main function to handle text entry into recipe body divs
// Handles "Enter", "Shift + Enter", & "Delete" functionality
function textHandler(e, elem) {
    if (e.key === "Enter") {
        e.preventDefault();

        if (e.shiftKey && elem.parentElement.id === "recipe-process") {
            openAddIngredient();
        }
        else {
            var newParagraph = document.createElement("p");
            newParagraph.classList.add("recipe-paragraph");
            newParagraph.setAttribute('contenteditable', 'true');
            newParagraph.setAttribute('onkeydown', 'textHandler(event, this)');
            elem.after(newParagraph);
            newParagraph.focus();
        }
    }
    else if (e.key === "Backspace" || e.key === "Delete") {
        if (elem.textContent == "" && elem.previousElementSibling !== null) {
            e.preventDefault();
            moveCursorToEnd(elem.previousElementSibling);
            elem.remove();
        }
        else if (elem.children.length && elem.children[0].innerText === elem.innerText) {
            recipeData.removeIngredientByID(elem.children[0].id); // remove ingredient from data
            elem.children[0].remove(); // remove ingredient text span
        }
    }
    else if (e.key === "#") {
        e.preventDefault();
        elem.classList.toggle("section-header");
    }
}

function moveCursorToEnd(element) {
    if (element && element.lastChild) { // Ensure element exists and has content/children
        const range = document.createRange();
        const selection = window.getSelection();

        if (element.lastChild.nodeType === Node.TEXT_NODE) {
            range.setStart(element.lastChild, element.lastChild.length);
            range.collapse(true); // Collapse to the end
        } else {
            // For elements with HTML content or ingredients, select the element's contents
            // and collapse to the end. This is a more robust approach.
            range.selectNodeContents(element);
            range.collapse(false); // 'false' collapses the range to its end point
        }

        selection.removeAllRanges(); // Clear any existing selections
        selection.addRange(range);   // Add the new range, placing the cursor
        element.focus();
    } else if (element) {
        // If the element exists but is empty, just focus it
        element.focus();
    }
}

// Handles user clicks in recipe body text divs to allow user to select appropriate <p> tags
function textBoxClick(e, elem) {
    if (e.target === elem) {
        paragraphs = [];
        for (child of elem.children) {
            if (child.tagName == "P") {
                paragraphs.push(child);
            }
        }

        paragraphs.pop().focus();
    }
}

async function optionFilter(elem, tableName) {
    let queryString = elem.value.toUpperCase();
    let list = elem.parentElement.getElementsByTagName('ul')[0];
    list.innerHTML = ""; // clear old options

    let options = await getTableRows(tableName);
    console.log(options);
    for (row of options) {
        let optionText = row.name.toUpperCase();
        if (optionText.indexOf(queryString) > -1) {
            let listItem = document.createElement("li");
            listItem.innerHTML = row.name; // Display the name
            listItem.dataset.id = row.id; // Store the ID in a data attribute
            listItem.classList.add("dropdown-option");
            list.append(listItem);
        }
    }
}

// Helper function to convert an all lowercase word to a capitalized first letter
function capitalize(word) {
    return word.charAt(0).toUpperCase()+ word.slice(1);
}

// Pushes new ingredient info entered by the user to the database
function saveNewIngredient() {
    let form_element = document.getElementsByClassName('new-ingred-form');
    let form_data = new FormData();

    for (let i = 0; i < form_element.length; i++) {
        form_data.append(form_element[i].name, form_element[i].value);
    }

    let ajax_request = new XMLHttpRequest();
    ajax_request.open('POST', '/backend/DB/new_ingredient.php');
    ajax_request.send(form_data);
    ajax_request.onreadystatechange = function() {
        if (ajax_request.readyState == 4 && ajax_request.status == 200) {
            document.getElementById('new-ingredient-form').reset();
            closeCreateIngredient();
            alert(ajax_request.responseText);
            // Re-populate ingredient/unit dropdowns after new ingredient is added
            printOptions(document.getElementById("add-ingred-name"), 'ingredient');
        }
    }
}

// Adds ingredient to the recipe
function saveAddIngredient() {
    let newParagraph = document.createElement("p");
    newParagraph.classList.add("recipe-paragraph");
    newParagraph.setAttribute('contenteditable', 'true');
    newParagraph.setAttribute('onkeydown', 'textHandler(event, this)');
    let ingredientText = document.createElement("span");
    ingredientText.setAttribute('contenteditable', 'false');
    ingredientText.classList.add("ingredient-text");
    ingredientText.setAttribute('onclick', 'editIngredient(this)');
    let id = Date.now(); // Frontend unique ID
    ingredientText.id = id;

    let ingredientSelect = document.getElementById("add-ingred-name");
    let unitSelect = document.getElementById("add-ingred-unit");

    let name = ingredientSelect.options[ingredientSelect.selectedIndex].text; // Get display text
    let ingredientDbId = ingredientSelect.value; // Get the actual DB ID
    let quantity = document.getElementById("add-ingred-quantity").value;
    let unit = unitSelect.options[unitSelect.selectedIndex].text; // Get display text
    let unitDbId = unitSelect.value; // Get the actual DB ID

    // Initialize ingredient object
    let ingredient = new Ingredient(id, name, quantity, unit, ingredientDbId, unitDbId);
    recipeData.addIngredient(ingredient);

    ingredientText.innerText = document.getElementById("add-ingred-display").value;
    newParagraph.append(ingredientText);
    let previousPara = document.getElementById("recipe-process").lastElementChild;
    previousPara.after(newParagraph);
    if (previousPara.innerText === "") {
        previousPara.remove();
    }

    closeAddIngredient();
    moveCursorToEnd(newParagraph);
    console.log(recipeData);
}

// Opens ingredient editor for clicked ingredient
function editIngredient(ingred) {

}

// Pulls options from the database and adds each row as an option to a given <select> element
async function printOptions(parent, tableName) {
    let options = await getTableRows(tableName);

    // Clear existing options
    parent.innerHTML = '';
    // Add a default blank option
    let defaultOption = document.createElement("option");
    defaultOption.classList.add("select-option");
    defaultOption.innerText = `-- Select ${capitalize(tableName)} --`;
    defaultOption.value = ""; // No value for default option
    parent.add(defaultOption);

    for (let row of options) {
        let option = document.createElement("option");
        option.classList.add("select-option");
        option.innerText = row.name; // Display the name
        option.value = row.id;       // Store the actual DB ID in the value
        parent.add(option);
    }
}

// Saves the entire recipe to the database
async function saveRecipe() {
    // Get Recipe Title
    recipeData.name = document.getElementById('recipe-title').value;

    // Parse Description and Process from the DOM into recipeData object
    recipeData.parseDescription(); // Populates recipeData.description
    recipeData.parseProcess();     // Populates recipeData.process

    // Prepare data for backend. Stringify arrays as PHP expects JSON strings.
    const recipePayload = {
        name: recipeData.name,
        description: JSON.stringify(recipeData.description),
        process: JSON.stringify(recipeData.process),
        ingredients: JSON.stringify(recipeData.ingredients) // This will contain frontend IDs and DB IDs
    };

    // console.log("Recipe Payload to Send:", recipePayload);

    // Send data to PHP backend using the helper function from db-handler.js
    try {
        const response = await saveRecipeEntry(recipePayload); // send data to backend
        console.log(response);
        alert(response.message);
    } catch (error) {
        console.error("Failed to save recipe:", error);
        alert("Error saving recipe. Check console for details.");
    }
}