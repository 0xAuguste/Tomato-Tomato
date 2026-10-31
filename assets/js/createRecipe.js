// SETUP
let recipeData = new RecipeData(); // create object to store recipe data to send to backend

// Cache of database table options for the dropdowns, keyed by table name
let dropdownOptions = {
    ingredient: [],
    unit: [],
    cuisine: [],
    season: [],
    type: [],
    meal: [],
    source: [],
    ingredientCategory: [],
};
// Tables whose options are shown alphabetically (the rest keep database order, e.g. seasons)
const alphabeticalTables = ['ingredient', 'unit', 'cuisine', 'source'];
// Frontend ID of the ingredient being edited in the add-ingredient panel, or null when adding a new one
let editingIngredientId = null;

// Create an event listener on DOMContentLoaded to ensure elements are available
document.addEventListener('DOMContentLoaded', async () => {
    await loadDropdownOptions(); // Load all caches

    // Add event listeners for Enter key on Cuisine and Source inputs
    const cuisineInput = document.getElementById('recipe-cuisine-input');
    const sourceInput = document.getElementById('recipe-source-input');

    if (cuisineInput) {
        cuisineInput.addEventListener('keydown', (event) => handleMetadataOptionAddition(event, cuisineInput, 'cuisine'));
    }
    if (sourceInput) {
        sourceInput.addEventListener('keydown', (event) => handleMetadataOptionAddition(event, sourceInput, 'source'));
    }

    // Add event listener for Enter key on the ingredient name input in the add-ingredient panel
    const addIngredNameInput = document.getElementById('add-ingred-name-input');
    if (addIngredNameInput) {
        addIngredNameInput.addEventListener('keydown', handleIngredientInputKeydown);
    }
});

// FUNCTION DEFINITIONS

// Toggles display of #add-ingredient-panel
function openAddIngredient() {
    var panel = document.getElementById("add-ingredient-panel");
    panel.style.display = "flex";
}

// Toggles display of #add-ingredient-panel
function closeAddIngredient() {
    closeCreateIngredient();
    var panel = document.getElementById("add-ingredient-panel");
    panel.style.display = "none";
    document.getElementById('add-ingred-quantity').value = '';
    document.getElementById('add-ingred-unit-input').value = '';
    document.getElementById('add-ingred-unit-id').value = '';
    document.getElementById('add-ingred-name-input').value = '';
    document.getElementById('add-ingred-name-id').value = '';
    document.getElementById('add-ingred-display').value = '';
    editingIngredientId = null; // Next open of the panel adds a new ingredient
    document.getElementById('save-ingredient-button').innerText = 'Add Ingredient to Recipe';
    processEditor.commands.focus(); // Return to where the cursor was in the process
}

// Toggles display of #create-ingredient-panel
function openCreateIngredient() {
    var panel = document.getElementById("create-ingredient-panel");
    panel.style.display = "flex"; // Make it visible (but still collapsed by CSS max-height: 0)
    // Use a small timeout to allow the display property to apply before starting the transition
    setTimeout(() => {
        panel.style.maxHeight = panel.scrollHeight + "px"; // Expand to full height
    }, 10); // A very small delay
    setTimeout(() => {
        panel.style.overflow = "visible";
    }, 1000);

    // Pre-fill the new ingredient name from the add ingredient input
    const addIngredNameInput = document.getElementById('add-ingred-name-input');
    const newIngredNameInput = document.getElementById('create-ingred-name-input');
    if (addIngredNameInput && newIngredNameInput) {
        newIngredNameInput.value = addIngredNameInput.value;
    }
}

// Toggles display of #create-ingredient-panel
function closeCreateIngredient() {
    var panel = document.getElementById("create-ingredient-panel");
    panel.style.maxHeight = "0"; // Collapse panel
    panel.style.display = "none"; // Hide panel
    panel.style.overflow = "hidden";

    // Clear the new ingredient form fields
    document.getElementById('create-ingred-name-input').value = '';
    document.getElementById('create-ingred-class-input').value = '';
    document.getElementById('create-ingred-class-id').value = '';
}

// Fills a dropdown list with the given option rows
function renderDropdownOptions(inputElem, rows) {
    let listContainer = inputElem.nextElementSibling.nextElementSibling; // Get the div.dropdown-list-container
    let list = listContainer.querySelector('.dropdown-list'); // Get the ul.dropdown-list
    let hiddenInput = inputElem.nextElementSibling; // Get the hidden input

    list.innerHTML = ""; // Clear old options
    rows.forEach(row => {
        let listItem = document.createElement("li");
        listItem.textContent = row.name; // Display the name (as text, never HTML)
        listItem.dataset.id = row.id; // Store the ID in a data attribute
        listItem.classList.add("dropdown-option");
        // Use mousedown to prevent input from losing focus before click
        listItem.onmousedown = (e) => {
            e.preventDefault();
            selectOption(inputElem, hiddenInput, listItem);
        };
        list.append(listItem);
    });
    listContainer.style.display = rows.length > 0 ? 'block' : 'none'; // Hide if no options
}

// Function to filter options for searchable dropdowns
function optionFilter(inputElem, tableName) {
    let queryString = inputElem.value.toUpperCase();

    let filteredOptions = dropdownOptions[tableName].filter(row =>
        row.name.toUpperCase().includes(queryString)
    );
    renderDropdownOptions(inputElem, filteredOptions);

    // If the input is cleared, also clear the hidden ID
    if (queryString === "") {
        inputElem.nextElementSibling.value = "";
    }
}

// Handles selection of an option from the searchable dropdown list
function selectOption(inputElem, hiddenInput, listItem) {
    inputElem.value = listItem.innerText;
    hiddenInput.value = listItem.dataset.id;
    inputElem.nextElementSibling.nextElementSibling.style.display = 'none'; // Hide the dropdown list
}

// Shows the dropdown list when input is focused, conditionally
function showDropdown(inputElem, tableName, showAllOnFocus) {
    // Populate with all options if showAllOnFocus is true; otherwise start hidden and empty
    renderDropdownOptions(inputElem, showAllOnFocus ? dropdownOptions[tableName] : []);
}

// Hides the dropdown list when input loses focus
function hideDropdown(inputElem) {
    // A small delay allows the click event on the list item to register
    setTimeout(() => {
        inputElem.nextElementSibling.nextElementSibling.style.display = 'none';
    }, 150);
}

// Helper function to convert an all lowercase word to a capitalized first letter
function capitalize(word) {
    return word.charAt(0).toUpperCase()+ word.slice(1);
}

// Adds ingredient to the recipe at the cursor position in the process editor
function saveAddIngredient() {
    let id = Date.now(); // Frontend unique ID

    // Get values from the new input fields and hidden IDs
    let ingredientInput = document.getElementById("add-ingred-name-input");
    let ingredientHiddenId = document.getElementById("add-ingred-name-id");
    let unitInput = document.getElementById("add-ingred-unit-input");
    let unitHiddenId = document.getElementById("add-ingred-unit-id");
    let quantityInput = document.getElementById("add-ingred-quantity");
    let displayTextInput = document.getElementById("add-ingred-display");
    let name = ingredientInput.value; // Display name from the input
    let ingredientDbId = ingredientHiddenId.value; // Actual DB ID from hidden input
    let quantity = quantityInput.value;
    let unit = unitInput.value; // Display unit from the input
    let unitDbId = unitHiddenId.value; // Actual DB ID from hidden input
    let displayText = displayTextInput.value;

    // Basic validation for selected ingredient/unit
    if (!ingredientDbId) {
        displayMessage("Please select an ingredient from the dropdown.", 'error');
        ingredientInput.focus();
        return;
    }
    if (!unitDbId) {
        displayMessage("Please select a unit from the dropdown.", 'error');
        unitInput.focus();
        return;
    }
    if (!quantity) {
        displayMessage("Please enter a quantity for the ingredient.", 'error');
        document.getElementById("add-ingred-quantity").focus();
        return;
    }
    if (!displayText.trim()) {
        displayMessage("Please enter display text for the ingredient.", 'error');
        document.getElementById("add-ingred-display").focus();
        return;
    }


    // Initialize ingredient object; its data lives on the ingredient node in the editor
    const isEdit = editingIngredientId !== null;
    let ingredient = new Ingredient(isEdit ? editingIngredientId : id, name, ingredientDbId, quantity, unit, unitDbId, displayText);

    closeAddIngredient(); // Clears the fields and refocuses the process editor at the saved cursor
    if (isEdit) {
        updateIngredient(ingredient);
    } else {
        insertIngredient(ingredient);
    }
}

// Opens the add-ingredient panel pre-filled with the clicked ingredient; saving updates it in place
function editIngredient(ingred) {
    const data = ingred.dataset; // Attributes rendered by the ingredient node in recipeEditor.js
    editingIngredientId = data.id;

    document.getElementById('add-ingred-quantity').value = data.quantity ?? '';
    document.getElementById('add-ingred-unit-input').value = data.unit ?? '';
    document.getElementById('add-ingred-unit-id').value = data.unitDbId ?? '';
    document.getElementById('add-ingred-name-input').value = data.name ?? '';
    document.getElementById('add-ingred-name-id').value = data.ingredientDbId ?? '';
    document.getElementById('add-ingred-display').value = data.displayText ?? '';
    document.getElementById('save-ingredient-button').innerText = 'Update Ingredient';

    openAddIngredient();
}

// Saves the entire recipe to the database
async function saveRecipe() {
    if (!validRecipe()) {
        return;
    }

    // Get Recipe Title
    recipeData.name = document.getElementById('recipe-title').value;

    // Parse Description, Process and Ingredients from the editors into recipeData object
    recipeData.parseDescription(descriptionEditor); // Populates recipeData.description
    recipeData.parseProcess(processEditor);         // Populates recipeData.process
    recipeData.parseIngredients(processEditor);     // Populates recipeData.ingredients
    
    // Get metadata
    recipeData.source = document.getElementById('recipe-source-id').value;
    recipeData.sourceLink = normalizeLink(document.getElementById('recipe-source-link-input').value);
    recipeData.yield = document.getElementById('recipe-yield-input').value;
    recipeData.cuisine = document.getElementById('recipe-cuisine-id').value;
    recipeData.season = document.getElementById('recipe-season-id').value;
    recipeData.type = document.getElementById('recipe-type-id').value;
    recipeData.meal = document.getElementById('recipe-meal-id').value;

    // Prepare data for backend. Stringify arrays as PHP expects JSON strings.
    const recipePayload = {
        name: recipeData.name,
        description: JSON.stringify(recipeData.description),
        process: JSON.stringify(recipeData.process),
        ingredients: JSON.stringify(recipeData.ingredients), // This will contain frontend IDs and DB IDs
        ...(recipeData.source.length > 0 ? { sourceID: recipeData.source} : {}),
        ...(recipeData.sourceLink.length > 0 ? { sourceLink: recipeData.sourceLink} : {}),
        ...(recipeData.yield.length > 0 ? { yield: recipeData.yield} : {}),
        ...(recipeData.cuisine.length > 0 ? { cuisineID: recipeData.cuisine} : {}),
        ...(recipeData.season.length > 0 ? { seasonID: recipeData.season} : {}),
        ...(recipeData.meal.length > 0 ? { mealID: recipeData.meal} : {}),
        ...(recipeData.type.length > 0 ? { typeID: recipeData.type} : {}),
    };

    // Send data to PHP backend using the helper function from db-handler.js
    try {
        console.log(recipePayload);
        const response = await saveRecipeEntry(recipePayload); // send data to backend
        console.log(response);
        displayMessage(response.message, 'success');
    } catch (error) {
        console.error("Failed to save recipe:", error);
        displayMessage("Error saving recipe. Check console for details.", 'error');
    }
}

function validRecipe() {
    const recipeTitle = document.getElementById('recipe-title').value.trim();
    const isProcessPopulated = processEditor.getText().trim() !== ""; // Includes ingredient display text
    const sourceLinkInput = document.getElementById('recipe-source-link-input');

    if (recipeTitle === "") {
        displayMessage("Please enter a recipe title before saving.", 'error');
        document.getElementById('recipe-title').focus();
        return false;
    } else if (!isProcessPopulated) {
        displayMessage("Please add at least one step to the recipe process before saving.", 'error');
        processEditor.commands.focus('end');
        return false;
    } else if (sourceLinkInput.value.trim() !== "" && normalizeLink(sourceLinkInput.value) === "") {
        displayMessage("Please enter a valid source link.", 'error');
        sourceLinkInput.focus();
        return false;
    } else if (sourceLinkInput.value.trim() !== "" && !document.getElementById('recipe-source-id').value) {
        displayMessage("Please choose an author for the source link.", 'error'); // Links are stored with the author
        document.getElementById('recipe-source-input').focus();
        return false;
    }
    else {
        return true;
    }
}

// Returns the link as a full http(s) URL, adding https:// if missing, or "" if it isn't a valid web link
function normalizeLink(link) {
    link = link.trim();
    if (link === "") {
        return "";
    }
    if (!/^[a-z][a-z0-9+.-]*:/i.test(link)) {
        link = "https://" + link;
    }
    try {
        const url = new URL(link);
        return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.') ? url.href : "";
    } catch {
        return "";
    }
}

// Function to display messages
function displayMessage(message, type = 'info') {
    const messageBox = document.createElement('div');
    messageBox.classList.add('app-message-box', type); // Add base class and type class
    messageBox.innerText = message;

    document.body.appendChild(messageBox);

    // Fade in
    setTimeout(() => {
        messageBox.style.opacity = '1';
    }, 100);

    // Fade out and remove after 3 seconds
    setTimeout(() => {
        messageBox.style.opacity = '0';
        messageBox.addEventListener('transitionend', () => messageBox.remove());
    }, 3000);
}

// Function to load all dropdown options into caches (in parallel) and alphabetize on page load
async function loadDropdownOptions() {
    const tableNames = Object.keys(dropdownOptions);
    const results = await Promise.all(tableNames.map(tableName => getTableRows(tableName)));

    tableNames.forEach((tableName, i) => {
        let rows = Array.isArray(results[i]) ? results[i] : []; // Empty tables return a message object
        if (alphabeticalTables.includes(tableName)) {
            rows.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
        }
        dropdownOptions[tableName] = rows;
    });
}

// Event handler for adding new metadata options
async function handleMetadataOptionAddition(event, inputElem, tableName) {
    if (event.key === 'Enter') {
        event.preventDefault();

        const inputValue = inputElem.value.trim();
        const hiddenInput = inputElem.nextElementSibling; // The hidden ID input

        if (inputValue === "") {
            displayMessage("Please enter a value.", 'error');
            return;
        }

        let currentOptions = dropdownOptions[tableName];
        let optionExists = false;
        let existingOptionId = null;

        // Check if the option already exists in the local cache (case-insensitive)
        const foundOption = currentOptions.find(option => option.name.toLowerCase() === inputValue.toLowerCase());

        if (foundOption) {
            optionExists = true;
            existingOptionId = foundOption.id;
        }

        if (optionExists) {
            // If it exists locally, ensure the hidden ID is set correctly
            inputElem.value = foundOption.name; // Use the exact name from the cache
            hiddenInput.value = existingOptionId;
            displayMessage(`"${inputValue}" already exists.`, 'info');
            // Hide the dropdown list as an option has been selected/confirmed
            inputElem.nextElementSibling.nextElementSibling.style.display = 'none';
        } else {
            // Option does not exist, add it to the database
            try {
                const response = await addNewMetadataOptionEntry(inputValue, tableName);
                if (response.id) {
                    // Update the local cache with the new/existing ID
                    // This handles cases where the backend found an existing one and returned its ID
                    const newOption = { id: response.id, name: inputValue };

                    // Check if the item is truly new to the array before pushing
                    const isTrulyNew = !currentOptions.some(option => option.id === newOption.id);
                    if (isTrulyNew) {
                        currentOptions.push(newOption);
                    }

                    inputElem.value = newOption.name; // Set the input value to the exact name sent/confirmed
                    hiddenInput.value = newOption.id; // Set the hidden ID

                    displayMessage(response.message, 'success');
                    // Re-render the dropdown list to include the newly added item
                    showDropdown(inputElem, tableName, true); // Pass true to show all options, effectively re-rendering
                    inputElem.nextElementSibling.nextElementSibling.style.display = 'none'; // Hide the dropdown after selection
                } else {
                    displayMessage(response.error || `Failed to add new ${tableName} option.`, 'error');
                }
            } catch (error) {
                console.error(`Error adding new ${tableName} option:`, error);
                displayMessage(`Error adding new ${tableName} option.`, 'error');
            }
        }
    }
}

// Function to handle keydown events on the ingredient name input in the add-ingredient panel
async function handleIngredientInputKeydown(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission

        const inputElem = event.target;
        const inputValue = inputElem.value.trim();

        // Check if the ingredient exists in the current options
        const ingredientExists = dropdownOptions.ingredient.some(option => option.name.toLowerCase() === inputValue.toLowerCase());

        if (inputValue && !ingredientExists) {
            // If the ingredient doesn't exist, open the create ingredient panel
            openCreateIngredient();
        } else if (inputValue && ingredientExists) {
            // If it exists, select it and close the dropdown
            const selectedOption = dropdownOptions.ingredient.find(option => option.name.toLowerCase() === inputValue.toLowerCase());
            if (selectedOption) {
                inputElem.value = selectedOption.name;
                document.getElementById('add-ingred-name-id').value = selectedOption.id;
                hideDropdown(inputElem); // Hide the dropdown
            }
        } else {
            // Optionally, handle empty input or other cases
            displayMessage('Please enter an ingredient name.', 'info');
        }
    }
}

// Function to save a new ingredient to the database from the create-ingredient panel
async function saveNewIngredientToDB() {
    const newIngredNameInput = document.getElementById('create-ingred-name-input');
    const newIngredCategoryInput = document.getElementById('create-ingred-class-input');
    const newIngredCategoryHiddenInput = document.getElementById('create-ingred-class-id');

    const newIngredName = newIngredNameInput.value.trim();
    const newIngredCategoryName = newIngredCategoryInput.value.trim();
    const newIngredCategoryId = newIngredCategoryHiddenInput.value; // This will be the ID from the dropdown selection

    if (!newIngredName) {
        displayMessage('Please enter a name for the new ingredient.', 'error');
        return;
    }
    if (!newIngredCategoryName || !newIngredCategoryId) {
        displayMessage('Please select a valid category for the new ingredient.', 'error');
        return;
    }

    try {
        const response = await addNewIngredientEntry(newIngredName, newIngredCategoryName);

        if (response && response.id) {
            displayMessage(`Ingredient "${response.name}" added successfully!`, 'success');
            // Update the main ingredient input with the newly created ingredient
            document.getElementById('add-ingred-name-input').value = response.name;
            document.getElementById('add-ingred-name-id').value = response.id;

            closeCreateIngredient(); // Close the create ingredient panel
            await loadDropdownOptions(); // Reload all options, including the new ingredient
            // The add-ingred-name-input is already set, so no need to re-filter/re-select.
        } else {
            displayMessage(response.error || 'Failed to add new ingredient.', 'error');
        }
    } catch (error) {
        console.error('Error saving new ingredient to DB:', error);
        displayMessage(`Error saving new ingredient: ${error.message}`, 'error');
    }
}