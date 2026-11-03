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
    error_log("Connection failed: " . $e->getMessage()); // Details stay in the server log
    echo json_encode(["error" => "Connection failed."]);
    exit;
}

$recipeID = isset($_GET['id']) ? $_GET['id'] : null;

if (!$recipeID) {
    http_response_code(400);
    echo json_encode(["message" => "Recipe ID is missing."]);
    exit();
}

try {
    // Fetch main recipe data
    $sql_recipe = "SELECT id, name, description, process, notes, yield, listAsIngredient FROM recipe WHERE id = :id";
    $stmt_recipe = $pdo->prepare($sql_recipe);
    $stmt_recipe->bindParam(':id', $recipeID);
    $stmt_recipe->execute();
    $recipe = $stmt_recipe->fetch();

    if (!$recipe) {
        http_response_code(404);
        echo json_encode(["message" => "Recipe not found."]);
        exit();
    }

    // Fetch ingredients for the recipe. An ingredient is either an ingredient or another recipe;
    // linkedRecipeID is only returned while that recipe still exists, so the viewer never links to a missing page.
    $sql_ingredients = "
        SELECT
            COALESCE(i.name, lr.name) AS ingredientName,
            ri.ingredientID,
            lr.id AS linkedRecipeID,
            ri.quantity,
            ri.unitID,
            u.name AS unitName,
            ri.displayText,
            ri.frontendIngredID
        FROM recipe_ingredients ri
        LEFT JOIN ingredient i ON ri.ingredientID = i.id
        LEFT JOIN recipe lr ON ri.linkedRecipeID = lr.id
        LEFT JOIN unit u ON ri.unitID = u.id
        WHERE ri.recipeID = :recipeID";
    $stmt_ingredients = $pdo->prepare($sql_ingredients);
    $stmt_ingredients->bindParam(':recipeID', $recipeID);
    $stmt_ingredients->execute();
    $ingredients = $stmt_ingredients->fetchAll();

    // Authors, alphabetically (recipe_sources has no order column)
    $sql_source = "SELECT s.id, s.name, rs.link FROM recipe_sources rs JOIN source s ON rs.sourceID = s.id WHERE rs.recipeID = :recipeID ORDER BY s.name";
    $stmt_source = $pdo->prepare($sql_source);
    $stmt_source->bindParam(':recipeID', $recipeID);
    $stmt_source->execute();
    $sources = $stmt_source->fetchAll();
    $sourceLink = null; // The same link is stored with every author
    foreach ($sources as $source) {
        if ($source['link']) {
            $sourceLink = $source['link'];
            break;
        }
    }

    $sql_cuisine = "SELECT c.id, c.name FROM recipe_cuisines rc JOIN cuisine c ON rc.cuisineID = c.id WHERE rc.recipeID = :recipeID";
    $stmt_cuisine = $pdo->prepare($sql_cuisine);
    $stmt_cuisine->bindParam(':recipeID', $recipeID);
    $stmt_cuisine->execute();
    $cuisine = $stmt_cuisine->fetch();

    $sql_meal = "SELECT m.id, m.name FROM recipe_meals rm JOIN meal m ON rm.mealID = m.id WHERE rm.recipeID = :recipeID";
    $stmt_meal = $pdo->prepare($sql_meal);
    $stmt_meal->bindParam(':recipeID', $recipeID);
    $stmt_meal->execute();
    $meal = $stmt_meal->fetch();

    $sql_season = "SELECT s.id, s.name FROM recipe_seasons rse JOIN season s ON rse.seasonID = s.id WHERE rse.recipeID = :recipeID";
    $stmt_season = $pdo->prepare($sql_season);
    $stmt_season->bindParam(':recipeID', $recipeID);
    $stmt_season->execute();
    $season = $stmt_season->fetch();

    $sql_type = "SELECT t.id, t.name FROM recipe_types rt JOIN type t ON rt.typeID = t.id WHERE rt.recipeID = :recipeID";
    $stmt_type = $pdo->prepare($sql_type);
    $stmt_type->bindParam(':recipeID', $recipeID);
    $stmt_type->execute();
    $type = $stmt_type->fetch();


    // Combine all data
    $fullRecipe = [
        'id' => $recipe['id'],
        'name' => $recipe['name'],
        'description' => json_decode($recipe['description'], true),
        'process' => json_decode($recipe['process'], true),
        'notes' => json_decode($recipe['notes'], true) ?? [],
        'yield' => $recipe['yield'],
        'ingredients' => $ingredients,
        'sources' => array_column($sources, 'name'), // Author names
        'sourceIDs' => array_column($sources, 'id'), // Same order as sources
        'sourceLink' => $sourceLink,
        'cuisine' => $cuisine ? $cuisine['name'] : false,
        'cuisineID' => $cuisine ? $cuisine['id'] : null,
        'meal' => $meal ? $meal['name'] : false,
        'mealID' => $meal ? $meal['id'] : null,
        'season' => $season ? $season['name'] : false,
        'seasonID' => $season ? $season['id'] : null,
        'type' => $type ? $type['name'] : false,
        'typeID' => $type ? $type['id'] : null,
        'listAsIngredient' => (bool) $recipe['listAsIngredient'],
    ];

    echo json_encode($fullRecipe);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    error_log("Error fetching recipe: " . $e->getMessage()); // Details stay in the server log
    echo json_encode(["message" => "Error fetching recipe."]);
    exit();
}
?>