async function getTableRows(table) {
    let valid_tables = ['ingredient', 'ingredientCategory', 'cuisine', 'meal', 'recipe', 'season',
                        'season', 'source', 'type', 'unit']; // List of allowed tables

    if (valid_tables.includes(table)) { // user entered valid table name
        let request = `/backend/DB/db_requests.php?table=${table}`;

        try {
            let response = await fetch(request);
            let data = await response.json();
            return data.map(item => item.name);  // Return the array of names
        }
        catch (error) {
            console.error("Error fetching data:", error);
        }
    }
    else {
        console.log('Invalid table');
        return; // Return nothing for invalid table
    }
}

function addNewIngredientEntry(name, category) {
    let path = '/backend/DB/new_ingredient.php';

    fetch(path, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'  // Tell the server we're sending JSON
        },
        body: JSON.stringify({
            'new-ingred-name': name,
            'new-ingred-category' : category})
    })
    .then(response => response.json()) // Convert response to JSON
    .then(response_json => console.log(response_json))
    .catch(error => console.error('Error adding new ingredient:', error));
}
