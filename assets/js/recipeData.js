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
                const paragraphContent = [];
                // Iterate through all child nodes (text nodes and element nodes)
                for (const node of element.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        // It's a plain text node
                        const text = node.textContent; // Get raw text content
                        if (text.trim()) { // Only add non-empty text (after trimming for storage)
                            paragraphContent.push({ type: 'text', text: text });
                        }
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        // It's an element node (e.g., <span>)
                        if (node.classList.contains('ingredient-text')) {
                            // This is an ingredient span
                                
                            paragraphContent.push({
                                type: 'ingredient',
                                id: node.id, // Frontend ID
                                displayText: node.innerText.trim() // The display text
                            });
                        } else {
                                paragraphContent.push({ type: 'text', text: node.innerText.trim() });
                        }
                    } else {
                        // Handle other unexpected elements within the paragraph, treat as text
                        const text = node.innerText;
                        if (text.trim()) {
                            paragraphContent.push({ type: 'text', text: text });
                        }
                    }
                }
                if (paragraphContent.length > 0) {
                structuredProcess.push({ type: 'paragraph', content: paragraphContent });
                }
            } else if (element.classList.contains('section-header')) {
                // This is a section header
                structuredProcess.push({ type: 'header', text: element.innerText });
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