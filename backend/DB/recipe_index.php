<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Origin: *"); // Ensure CORS is enabled

// Connect to the database with a new PDO:
try {
    require_once('databaseKeys.php');
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Enable exceptions for better error handling
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Fetch as associative array by default
} catch (PDOException $e) {
    http_response_code(500);
    error_log("Connection failed: " . $e->getMessage()); // Details stay in the server log
    echo json_encode(["error" => "Connection failed."]);
    exit;
}

// Returns every recipe with the IDs it can be searched and filtered by, plus the options in use for each filter:
// { "recipes": [{ id, name, description, sources: [ids], cuisines, meals, seasons, types, ingredients }],
//   "options": { "sources": [{ id, name }], "cuisines", "meals", "seasons", "types", "ingredients" } }
try {
    $recipes = [];
    foreach ($pdo->query("SELECT id, name, description FROM recipe ORDER BY name") as $row) {
        $paragraphs = json_decode($row['description'], true); // Stored as a JSON array of paragraphs
        $recipes[$row['id']] = [
            "id" => $row['id'],
            "name" => $row['name'],
            "description" => is_array($paragraphs) ? trim(implode("\n", $paragraphs)) : "",
            "sources" => [], "cuisines" => [], "meals" => [], "seasons" => [], "types" => [], "ingredients" => []
        ];
    }

    // Each query returns (recipeID, id, name) rows. Joining recipe skips rows left behind by deleted recipes.
    $categories = [
        "sources"  => "SELECT rs.recipeID, s.id, s.name FROM recipe_sources rs JOIN source s ON rs.sourceID = s.id JOIN recipe r ON rs.recipeID = r.id",
        "cuisines" => "SELECT rc.recipeID, c.id, c.name FROM recipe_cuisines rc JOIN cuisine c ON rc.cuisineID = c.id JOIN recipe r ON rc.recipeID = r.id",
        "meals"    => "SELECT rm.recipeID, m.id, m.name FROM recipe_meals rm JOIN meal m ON rm.mealID = m.id JOIN recipe r ON rm.recipeID = r.id",
        "seasons"  => "SELECT rs.recipeID, s.id, s.name FROM recipe_seasons rs JOIN season s ON rs.seasonID = s.id JOIN recipe r ON rs.recipeID = r.id",
        "types"    => "SELECT rt.recipeID, t.id, t.name FROM recipe_types rt JOIN type t ON rt.typeID = t.id JOIN recipe r ON rt.recipeID = r.id",
        // Ingredients, plus recipes used as ingredients (their IDs are UUIDs too, so they can't collide)
        "ingredients" => "SELECT ri.recipeID, i.id, i.name FROM recipe_ingredients ri JOIN ingredient i ON ri.ingredientID = i.id JOIN recipe r ON ri.recipeID = r.id
                          UNION
                          SELECT ri.recipeID, lr.id, lr.name FROM recipe_ingredients ri JOIN recipe lr ON ri.linkedRecipeID = lr.id JOIN recipe r ON ri.recipeID = r.id"
    ];

    $options = [];
    foreach ($categories as $category => $sql) {
        $optionsByID = [];
        foreach ($pdo->query($sql) as $row) {
            if (!in_array($row['id'], $recipes[$row['recipeID']][$category])) { // An ingredient can appear more than once in a recipe
                $recipes[$row['recipeID']][$category][] = $row['id'];
            }
            $optionsByID[$row['id']] = ["id" => $row['id'], "name" => $row['name']];
        }
        $categoryOptions = array_values($optionsByID);
        usort($categoryOptions, function ($a, $b) { return strcasecmp($a['name'], $b['name']); });
        $options[$category] = $categoryOptions;
    }

    echo json_encode(["recipes" => array_values($recipes), "options" => $options]);

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error fetching recipe index: " . $e->getMessage()); // Details stay in the server log
    echo json_encode(["error" => "Error fetching recipe index."]);
}
?>
