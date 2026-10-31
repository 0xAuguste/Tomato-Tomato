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

    // Reads paragraphs from the description editor (see recipeEditor.js) as an array of strings
    parseDescription(editor) {
        const structuredDescription = [];

        editor.state.doc.forEach(block => {
            structuredDescription.push(block.textContent);
        });
        this.description = structuredDescription;
    }

    // Reads headers and paragraphs (text + inline ingredients) from the process editor
    parseProcess(editor) {
        const structuredProcess = [];

        editor.state.doc.forEach(block => {
            if (block.type.name === 'heading') {
                structuredProcess.push({ type: 'header', text: block.textContent });
            } else if (block.type.name === 'paragraph') {
                const paragraphContent = [];
                block.forEach(node => {
                    if (node.isText) {
                        if (node.text.trim()) { // Only add non-empty text
                            paragraphContent.push({ type: 'text', text: node.text });
                        }
                    } else if (node.type.name === 'ingredient') {
                        paragraphContent.push({
                            type: 'ingredient',
                            id: node.attrs.id, // Frontend ID
                            displayText: node.attrs.displayText
                        });
                    }
                });
                if (paragraphContent.length > 0) {
                    structuredProcess.push({ type: 'paragraph', content: paragraphContent });
                }
            }
        });
        this.process = structuredProcess;
    }

    // Collects the ingredients present in the process editor, so deleted ingredients are never saved
    parseIngredients(editor) {
        const ingredientsByID = new Map(); // Keyed by frontend ID, so a copy-pasted ingredient is saved once

        editor.state.doc.descendants(node => {
            if (node.type.name === 'ingredient' && !ingredientsByID.has(node.attrs.id)) {
                const a = node.attrs;
                ingredientsByID.set(a.id, new Ingredient(a.id, a.name, a.ingredientDbId, a.quantity, a.unit, a.unitDbId, a.displayText));
            }
        });
        this.ingredients = [...ingredientsByID.values()];
    }
}

class Ingredient {
    constructor(id, name, ingredientDbId, quantity, unit, unitDbId, displayText) {
        this.id = id; // Frontend unique ID (Date.now()), links process segments to recipe_ingredients rows
        this.name = name; // Display name
        this.quantity = quantity;
        this.unit = unit; // Display unit
        this.ingredientDbId = ingredientDbId; // Actual database ID for the ingredient
        this.unitDbId = unitDbId;           // Actual database ID for the unit
        this.displayText = displayText;
    }
}