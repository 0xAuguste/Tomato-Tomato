printOptions(document.getElementById("add-ingred-unit"), 'unit', 'name');
printOptions(document.getElementById("add-ingred-name"), 'ingredient', 'name');
let recipeData = new RecipeData();

// FUNCTION DEFINITIONS

// Toggles display of #add-ingredient-panel
function openAddIngredient() {
    var panel = document.getElementById("add-ingredient-panel");
    panel.style.display = "block";
}
// Toggles display of #add-ingredient-panel
function closeAddIngredient() {
    var panel = document.getElementById("add-ingredient-panel");
    panel.style.display = "none";
}
// Toggles display of #create-ingredient-panel
function openCreateIngredient() {
    var panel = document.getElementById("create-ingredient-panel");
    panel.style.display = "block";
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
            elem.previousElementSibling.focus();
            elem.remove();
        }
        else if (elem.children.length && elem.children[0].innerText === elem.innerText) {
            recipeData.removeIngredientByID(elem.children[0].id); // remove ingredient from data
            elem.children[0].remove(); // remove ingredient text span
        }
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
        let optionText = row.toUpperCase();
        if (optionText.indexOf(queryString) > -1) {
            let listItem = document.createElement("li");
            listItem.innerHTML = row;
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
        }
    }
}
// Adds ingredient to the recipe
function saveAddIngredient() {
    let newIngredient = document.createElement("p");
    newIngredient.classList.add("recipe-paragraph");
    newIngredient.setAttribute('contenteditable', 'true');
    newIngredient.setAttribute('onkeydown', 'textHandler(event, this)');
    let ingredientText = document.createElement("span");
    ingredientText.setAttribute('contenteditable', 'false');
    ingredientText.classList.add("ingredient-text");
    ingredientText.setAttribute('onclick', 'editIngredient(this)');
    let id = Date.now();
    ingredientText.id = id;

    let name = document.getElementById("add-ingred-name").value;
    let quantity = document.getElementById("add-ingred-quantity").value;
    let unit = document.getElementById("add-ingred-unit").value;

    let ingredient = new Ingredient(id, name, quantity, unit);
    recipeData.addIngredient(ingredient);

    ingredientText.innerText = document.getElementById("add-ingred-display").value;
    newIngredient.append(ingredientText);
    let previousPara = document.getElementById("add-ingredient-panel").previousElementSibling
    previousPara.after(newIngredient);
    if (previousPara.innerText === "") {
        previousPara.remove();
    }

    closeAddIngredient();
    newIngredient.focus();
    console.log(recipeData);
}
// Opens ingredient editor for clicked ingredient
function editIngredient(ingred) {
    
}
// Pulls a column from the database and adds each row as an option to a given <select> element
async function printOptions(parent, tableName, colName) {
    let options = await getTableRows(tableName);

    for (row of options) {
        let option = document.createElement("option");
        option.classList.add("select-option");
        option.innerText = row;
        parent.add(option);
    }
}
