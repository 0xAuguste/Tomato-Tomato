// SETUP
let recipeData = new RecipeData(); // create object to store recipe data to send to backend

// Globals to cache database table options
let ingredientOptions = [];
let unitOptions = [];
let cuisineOptions = [];
let seasonOptions = [];
let typeOptions = [];
let mealOptions = [];
let sourceOptions = [];
let ingredientCategoryOptions = [];

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

// Main function to handle text entry into recipe body divs
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

// Function to filter options for searchable dropdowns
async function optionFilter(inputElem, tableName) {
    let queryString = inputElem.value.toUpperCase();
    let listContainer = inputElem.nextElementSibling.nextElementSibling; // Get the div.dropdown-list-container
    let list = listContainer.querySelector('.dropdown-list'); // Get the ul.dropdown-list
    let hiddenInput = inputElem.nextElementSibling; // Get the hidden input

    list.innerHTML = ""; // Clear old options

    let optionsToFilter = [];
    switch (tableName) {
        case 'ingredient': optionsToFilter = ingredientOptions; break;
        case 'unit': optionsToFilter = unitOptions; break;
        case 'cuisine': optionsToFilter = cuisineOptions; break;
        case 'season': optionsToFilter = seasonOptions; break;
        case 'type': optionsToFilter = typeOptions; break;
        case 'meal': optionsToFilter = mealOptions; break;
        case 'source': optionsToFilter = sourceOptions; break;
        case 'ingredientCategory': optionsToFilter = ingredientCategoryOptions; break;
    }

    let filteredOptions = optionsToFilter.filter(row =>
        row.name.toUpperCase().includes(queryString)
    );

    if (filteredOptions.length > 0) {
        filteredOptions.forEach(row => {
            let listItem = document.createElement("li");
            listItem.innerHTML = row.name; // Display the name
            listItem.dataset.id = row.id; // Store the ID in a data attribute
            listItem.classList.add("dropdown-option");
            // Use mousedown to prevent input from losing focus before click
            listItem.onmousedown = (e) => {
                e.preventDefault();
                selectOption(inputElem, hiddenInput, listItem);
            };
            list.append(listItem);
        });
        listContainer.style.display = 'block'; // Show the dropdown list
    } else {
        listContainer.style.display = 'none'; // Hide if no matches
    }

    // If the input is cleared, also clear the hidden ID
    if (queryString === "") {
        hiddenInput.value = "";
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
    let listContainer = inputElem.nextElementSibling.nextElementSibling;
    let list = listContainer.querySelector('.dropdown-list');
    let hiddenInput = inputElem.nextElementSibling;

    if (!showAllOnFocus) {
        list.innerHTML = ""; // Clear any options from previous interactions
        listContainer.style.display = 'none'; // Ensure it's hidden
        return; // Do not populate or show on focus if not allowed
    }

    // Populate with all options if showAllOnFocus is true
    let optionsToDisplay = [];
    switch (tableName) {
        case 'ingredient': optionsToDisplay = ingredientOptions; break;
        case 'unit': optionsToDisplay = unitOptions; break;
        case 'cuisine': optionsToDisplay = cuisineOptions; break;
        case 'season': optionsToDisplay = seasonOptions; break;
        case 'type': optionsToDisplay = typeOptions; break;
        case 'meal': optionsToDisplay = mealOptions; break;
        case 'source': optionsToDisplay = sourceOptions; break;
        case 'ingredientCategory': optionsToDisplay = ingredientCategoryOptions; break;
    }

    console.log(optionsToDisplay);

    list.innerHTML = '';
    optionsToDisplay.forEach(row => {
        let listItem = document.createElement("li");
        listItem.innerHTML = row.name;
        listItem.dataset.id = row.id;
        listItem.classList.add("dropdown-option");
        listItem.onmousedown = (e) => {
            e.preventDefault();
            selectOption(inputElem, hiddenInput, listItem);
        };
        list.append(listItem);
    });

    listContainer.style.display = 'block'; // Show the dropdown list
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

    // Get values from the new input fields and hidden IDs
    let ingredientInput = document.getElementById("add-ingred-name-input");
    let ingredientHiddenId = document.getElementById("add-ingred-name-id");
    let unitInput = document.getElementById("add-ingred-unit-input");
    let unitHiddenId = document.getElementById("add-ingred-unit-id");

    let name = ingredientInput.value; // Display name from the input
    let ingredientDbId = ingredientHiddenId.value; // Actual DB ID from hidden input
    let quantity = document.getElementById("add-ingred-quantity").value;
    let unit = unitInput.value; // Display unit from the input
    let unitDbId = unitHiddenId.value; // Actual DB ID from hidden input
    let displayText = document.getElementById("add-ingred-display").value;

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


    // Initialize ingredient object
    let ingredient = new Ingredient(id, name, ingredientDbId, quantity, unit, unitDbId, displayText);
    recipeData.addIngredient(ingredient);

    ingredientText.id = id; // Set the ID on the span after validation
    ingredientText.innerText = displayText;
    newParagraph.append(ingredientText);
    let previousPara = document.getElementById("recipe-process").lastElementChild;
    // Ensure previousPara exists and is a paragraph, otherwise append to process directly
    if (previousPara && previousPara.classList.contains('recipe-paragraph')) {
        previousPara.after(newParagraph);
        if (previousPara.innerText.trim() === "") { // Only remove if it's an empty paragraph
            previousPara.remove();
        }
    } else {
        document.getElementById("recipe-process").append(newParagraph);
    }


    closeAddIngredient();
    moveCursorToEnd(newParagraph);
    console.log(recipeData);

    // Clear the input fields after adding ingredient
    ingredientInput.value = "";
    ingredientHiddenId.value = "";
    unitInput.value = "";
    unitHiddenId.value = "";
    document.getElementById("add-ingred-quantity").value = "";
    document.getElementById("add-ingred-display").value = "";
}

// Opens ingredient editor for clicked ingredient
function editIngredient(ingred) {
    // Future functionality to edit an ingredient
}

// Saves the entire recipe to the database
async function saveRecipe() {
    if (!validRecipe()) {
        return;
    }

    // Get Recipe Title
    recipeData.name = document.getElementById('recipe-title').value;

    // Parse Description and Process from the DOM into recipeData object
    recipeData.parseDescription(); // Populates recipeData.description
    recipeData.parseProcess();     // Populates recipeData.process
    
    // Get metadata
    recipeData.source = document.getElementById('recipe-source-id').value;
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
    const recipeProcessContainer = document.getElementById('recipe-process');
    const recipeProcessParagraphs = recipeProcessContainer.querySelectorAll('.recipe-paragraph');

    let isProcessPopulated = false;
    if (recipeProcessParagraphs.length > 0) {
        // Check if at least one non-empty paragraph exists in the process
        for (const paragraph of recipeProcessParagraphs) {
            // Check for actual text content, ignoring empty paragraphs created by initial setup
            if (paragraph.textContent.trim() !== "" || paragraph.querySelector('.ingredient-text')) {
                isProcessPopulated = true;
            }
        }
    }

    if (recipeTitle === "") {
        displayMessage("Please enter a recipe title before saving.", 'error');
        document.getElementById('recipe-title').focus();
        return false;
    } else if (!isProcessPopulated) {
        displayMessage("Please add at least one step to the recipe process before saving.", 'error');
        // Try to focus on the last paragraph in process if it exists, or the process container
        const lastProcessParagraph = recipeProcessContainer.querySelector('.recipe-paragraph:last-child');
        if (lastProcessParagraph) {
            moveCursorToEnd(lastProcessParagraph);
        } else {
            recipeProcessContainer.focus();
        }
        return false;
    }
    else {
        return true;
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

// Function to load all dropdown options into caches and alphabetize on page load
async function loadDropdownOptions() {
    ingredientOptions = await getTableRows('ingredient');
    ingredientOptions.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    unitOptions = await getTableRows('unit');
    unitOptions.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    cuisineOptions = await getTableRows('cuisine');
    cuisineOptions.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    seasonOptions = await getTableRows('season');

    typeOptions = await getTableRows('type');

    mealOptions = await getTableRows('meal');

    sourceOptions = await getTableRows('source');
    sourceOptions.sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically

    ingredientCategoryOptions = await getTableRows('ingredientCategory');
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

        let currentOptions = [];
        let optionExists = false;
        let existingOptionId = null;

        switch (tableName) {
            case 'cuisine': currentOptions = cuisineOptions; break;
            case 'source': currentOptions = sourceOptions; break;
        }

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
                         // Add to the correct array in JavaScript based on tableName
                        switch (tableName) {
                            case 'cuisine': cuisineOptions.push(newOption); break;
                            case 'source': sourceOptions.push(newOption); break;
                        }
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
        const ingredientExists = ingredientOptions.some(option => option.name.toLowerCase() === inputValue.toLowerCase());

        if (inputValue && !ingredientExists) {
            // If the ingredient doesn't exist, open the create ingredient panel
            openCreateIngredient();
        } else if (inputValue && ingredientExists) {
            // If it exists, select it and close the dropdown
            const selectedOption = ingredientOptions.find(option => option.name.toLowerCase() === inputValue.toLowerCase());
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