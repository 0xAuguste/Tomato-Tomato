// Function to return all rows of given table,  with 'id' and 'name'
async function getTableRows(table) {
    let valid_tables = ['ingredient', 'ingredientCategory', 'cuisine', 'meal', 'recipe', 'season',
                        'source', 'type', 'unit']; // List of allowed tables

    if (valid_tables.includes(table)) { // user entered valid table name
        let request = `/backend/DB/db_requests.php?table=${table}`;

        try {
            let response = await fetch(request);
            let data = await response.json();
            return data;
        }
        catch (error) {
            console.error("Error fetching data:", error);
            return []; // Return empty array on error for consistency
        }
    }
    else {
        console.log('Invalid table:', table);
        return []; // Return empty array for invalid table
    }
}

/// Function to add a new ingredient to the database of given name and category
async function addNewIngredientEntry(name, category) {
    let path = '/backend/DB/new_ingredient.php';

    try {
        const response = await fetch(path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'new-ingred-name': name,
                'new-ingred-category' : category
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const responseJson = await response.json(); // Convert response to JSON
        return responseJson; // Return the response from the server
    } catch (error) {
        console.error('Error adding new ingredient:', error);
        throw error; // Re-throw the error for handling in createRecipe.js
    }
}

// Function to add a new metadata option (e.g., Cuisine, Source) to the database
async function addNewMetadataOptionEntry(name, tableName) {
    let path = '/backend/DB/new_metadata_option.php';

    try {
        const response = await fetch(path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'name': name,
                'table': tableName
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const responseJson = await response.json();
        return responseJson; // This will contain message and the new ID
    } catch (error) {
        console.error(`Error adding new ${tableName} option:`, error);
        throw error;
    }
}

// Function to save a new recipe to the database
async function saveRecipeEntry(recipeDataPayload) {
    const path = '/backend/DB/save_recipe.php';

    try {
        const response = await fetch(path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recipeDataPayload) // Send the entire recipe object as JSON
        });

        if (!response.ok) {
            // If the response is not OK (e.g., 404, 500), throw an error
            const errorText = await response.text(); // Get response body for more details
            throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`);
        }

        const responseJson = await response.json(); // Assuming your PHP will return JSON
        return responseJson; // Return the response from the server
    } catch (error) {
        console.error('Error saving recipe:', error);
        throw error;
    }
}