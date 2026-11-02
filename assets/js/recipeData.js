class RecipeData {
    constructor() {
        this.name = "";
        this.description = [];
        this.process = [];
        this.ingredients = [];
        this.yield = "";
        this.sources = []; // Author (source table) IDs
        this.sourceLink = "";
        this.cuisine = "";
        this.meal = "";
        this.season = "";
        this.type = "";
        this.listAsIngredient = false; // Show this recipe in the ingredient dropdown
    }

    // Reads paragraphs from the description editor (see recipeEditor.js) as an array of strings
    parseDescription(editor) {
        const structuredDescription = [];

        editor.state.doc.forEach(block => {
            structuredDescription.push(block.textContent);
        });
        this.description = structuredDescription;
    }

    // Reads headers, paragraphs and lists (text + inline ingredients) from the process editor
    parseProcess(editor) {
        const structuredProcess = [];

        editor.state.doc.forEach(block => {
            if (block.type.name === 'heading') {
                structuredProcess.push({ type: 'header', text: block.textContent });
            } else if (block.type.name === 'paragraph') {
                const paragraphContent = this.parseParagraph(block);
                if (paragraphContent.length > 0) {
                    structuredProcess.push({ type: 'paragraph', content: paragraphContent });
                }
            } else if (block.type.name === 'bulletList' || block.type.name === 'orderedList') {
                // Each list item holds one paragraph (lists are flat, see recipeEditor.js); empty items are dropped
                const items = [];
                block.forEach(item => {
                    const itemContent = this.parseParagraph(item.firstChild);
                    if (itemContent.length > 0) {
                        items.push(itemContent);
                    }
                });
                if (items.length > 0) {
                    const list = { type: 'list', ordered: block.type.name === 'orderedList', items };
                    if (list.ordered) {
                        list.start = block.attrs.start;
                    }
                    structuredProcess.push(list);
                }
            }
        });
        this.process = structuredProcess;
    }

    // Reads a paragraph node as an array of text and ingredient segments
    parseParagraph(paragraph) {
        const paragraphContent = [];
        paragraph.forEach((node, offset, index) => {
            if (node.isText) {
                // Skip whitespace-only text, except between two ingredients so they don't run together
                const betweenIngredients = index > 0 && index < paragraph.childCount - 1;
                if (node.text.trim() || betweenIngredients) {
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
        return paragraphContent;
    }

    // Collects the ingredients present in the process editor, so deleted ingredients are never saved
    parseIngredients(editor) {
        const ingredientsByID = new Map(); // Keyed by frontend ID, so a copy-pasted ingredient is saved once

        editor.state.doc.descendants(node => {
            if (node.type.name === 'ingredient' && !ingredientsByID.has(node.attrs.id)) {
                const a = node.attrs;
                ingredientsByID.set(a.id, new Ingredient(a.id, a.name, a.ingredientDbId, a.quantity, a.unit, a.unitDbId, a.displayText, a.linkedRecipeId));
            }
        });
        this.ingredients = [...ingredientsByID.values()];
    }
}

class Ingredient {
    constructor(id, name, ingredientDbId, quantity, unit, unitDbId, displayText, linkedRecipeId = "") {
        this.id = id; // Frontend unique ID (Date.now()), links process segments to recipe_ingredients rows
        this.name = name; // Display name
        this.quantity = quantity;
        this.unit = unit; // Display unit
        this.ingredientDbId = ingredientDbId; // Actual database ID for the ingredient
        this.unitDbId = unitDbId;           // Actual database ID for the unit
        this.displayText = displayText;
        this.linkedRecipeId = linkedRecipeId; // Recipe used as this ingredient (then ingredientDbId is empty)
    }
}