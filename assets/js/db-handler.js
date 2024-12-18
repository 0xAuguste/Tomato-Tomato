async function getTableRows(table) {
    let valid_tables = ['ingredient', 'ingredientCategory', 'cuisine', 'meal', 'recipe', 'season',
                        'season', 'source', 'type', 'unit']; // List of allowed tables

    if (valid_tables.includes(table)) {
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
