class RecipeData {
    constructor() {
        this.name = "";
        this.description = [];
        this.process = [];
        this.ingredients = [];
        this.yield = "";
        this.source = "";
        this.cuisine = "";
        this.meal = "";
        this.season = "";
        this.type = "";
    }

    addIngredient(ingredient) {
        this.ingredients.push(ingredient);
    }

    removeIngredientByID(id) {
        this.ingredients = this.ingredients.filter(ingredient => ingredient.id != id);
    }

    parseDescription() {
        const descElements = document.getElementById('recipe-description').children;
        const structuredDescription = [];

        for (const element of descElements) {
            if (element.classList.contains('recipe-paragraph')) {
                structuredDescription.push(element.innerText);
            }
        }
        this.description = structuredDescription;
    }

    parseProcess() {
        const processElements = document.getElementById('recipe-process').children;
        const structuredProcess = [];

        for (const element of processElements) {
            if (element.classList.contains('recipe-paragraph')) {
                if (element.children.length > 0 && element.children[0].classList.contains('ingredient-text')) {
                    // This is an ingredient paragraph
                    const ingredientSpan = element.children[0];
                    const ingredientId = ingredientSpan.id; // Frontend unique ID
                    const ingredientData = this.ingredients.find(ing => ing.id == ingredientId); // Find the full ingredient object

                    // When pushing to the Process, only store frontend id and display text. Rest of data is stored in Ingredients
                    if (ingredientData) {
                        structuredProcess.push({
                            type: 'ingredient',
                            id: ingredientData.id,
                            display: ingredientSpan.innerText
                        });
                    }
                }
                else if (element.classList.contains('section-header')) { // paragraph is a header
                    structuredProcess.push({
                        type: 'header',
                        text: element.innerText 
                    });
                } else {
                    // This is a regular paragraph
                    structuredProcess.push({
                        type: 'paragraph',
                        text: element.innerText 
                    });
                }
            }
        }
        this.process = structuredProcess;
    }
}

class Ingredient {
    constructor(id, name, ingredientDbId, quantity, unit, unitDbId, displayText) {
        this.id = id; // Frontend unique ID (Date.now())
        this.name = name; // Display name
        this.quantity = quantity;
        this.unit = unit; // Display unit
        this.ingredientDbId = ingredientDbId; // Actual database ID for the ingredient
        this.unitDbId = unitDbId;           // Actual database ID for the unit
        this.displayText = displayText;
    }
}