class RecipeData {
    constructor() {
        this.name = "";
        this.description = "";
        this.process = "";
        this.ingredients = [];
    }

    addIngredient(ingredient) {
        this.ingredients.push(ingredient);
    }
    removeIngredientByID(id) {
        for (ingredient of this.ingredients) {
            if (ingredient.id == id) {
                console.log("Removing " + ingredient.name);
                this.ingredients.pop(ingredient);
            }
        }
    }
}

class Ingredient {
    constructor(id, name, quantity, unit) {
        this.id = id;
        this.name = name;
        this.quantity = quantity;
        this.unit = unit;
    }
}