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
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
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
    $sql_recipe = "SELECT id, name, description, process, yield FROM recipe WHERE id = :id";
    $stmt_recipe = $pdo->prepare($sql_recipe);
    $stmt_recipe->bindParam(':id', $recipeID);
    $stmt_recipe->execute();
    $recipe = $stmt_recipe->fetch();

    if (!$recipe) {
        http_response_code(404);
        echo json_encode(["message" => "Recipe not found."]);
        exit();
    }

    // Fetch ingredients for the recipe
    $sql_ingredients = "
        SELECT 
            ri.quantity, 
            ri.displayText,
            ri.frontendIngredID,
            i.name AS ingredientName,
            u.name AS unitName
        FROM recipe_ingredients ri
        JOIN ingredient i ON ri.ingredientID = i.id
        LEFT JOIN unit u ON ri.unitID = u.id
        WHERE ri.recipeID = :recipeID";
    $stmt_ingredients = $pdo->prepare($sql_ingredients);
    $stmt_ingredients->bindParam(':recipeID', $recipeID);
    $stmt_ingredients->execute();
    $ingredients = $stmt_ingredients->fetchAll();

    $sql_source = "SELECT s.name FROM recipe_sources rs JOIN source s ON rs.sourceID = s.id WHERE rs.recipeID = :recipeID";
    $stmt_source = $pdo->prepare($sql_source);
    $stmt_source->bindParam(':recipeID', $recipeID);
    $stmt_source->execute();
    $source = $stmt_source->fetchColumn();

    $sql_cuisine = "SELECT c.name FROM recipe_cuisines rc JOIN cuisine c ON rc.cuisineID = c.id WHERE rc.recipeID = :recipeID";
    $stmt_cuisine = $pdo->prepare($sql_cuisine);
    $stmt_cuisine->bindParam(':recipeID', $recipeID);
    $stmt_cuisine->execute();
    $cuisine = $stmt_cuisine->fetchColumn();

    $sql_meal = "SELECT m.name FROM recipe_meals rm JOIN meal m ON rm.mealID = m.id WHERE rm.recipeID = :recipeID";
    $stmt_meal = $pdo->prepare($sql_meal);
    $stmt_meal->bindParam(':recipeID', $recipeID);
    $stmt_meal->execute();
    $meal = $stmt_meal->fetchColumn();

    $sql_season = "SELECT s.name FROM recipe_seasons rse JOIN season s ON rse.seasonID = s.id WHERE rse.recipeID = :recipeID";
    $stmt_season = $pdo->prepare($sql_season);
    $stmt_season->bindParam(':recipeID', $recipeID);
    $stmt_season->execute();
    $season = $stmt_season->fetchColumn();

    $sql_type = "SELECT t.name FROM recipe_types rt JOIN type t ON rt.typeID = t.id WHERE rt.recipeID = :recipeID";
    $stmt_type = $pdo->prepare($sql_type);
    $stmt_type->bindParam(':recipeID', $recipeID);
    $stmt_type->execute();
    $type = $stmt_type->fetchColumn();


    // Combine all data
    $fullRecipe = [
        'id' => $recipe['id'],
        'name' => $recipe['name'],
        'description' => json_decode($recipe['description'], true),
        'process' => json_decode($recipe['process'], true),
        'yield' => $recipe['yield'],
        'ingredients' => $ingredients,
        'source' => $source,
        'cuisine' => $cuisine,
        'meal' => $meal,
        'season' => $season,
        'type' => $type,
    ];

    echo json_encode($fullRecipe);
    exit();

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["message" => "Error fetching recipe: " . $e->getMessage()]);
    exit();
}
?>