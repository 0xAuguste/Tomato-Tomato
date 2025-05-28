<?php

// Require the UUID helper function
require_once(__DIR__ . '/../utils/uuid.php');

// Set CORS headers and Content-Type header for JSON response
header("Access-Control-Allow-Origin: *"); // Adjust in production for specific domains
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure it's a POST request
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Decode the JSON input from the request body
    $input = json_decode(file_get_contents('php://input'), true);

    // Basic validation for required fields
    if (!isset($input['name']) || !isset($input['description']) || !isset($input['process']) || !isset($input['ingredients'])) {
        http_response_code(400); // Bad Request
        echo json_encode(["message" => "Missing required recipe data."]);
        exit();
    }

    // Assign variables from input
    $recipeName = $input['name'];
    $recipeDescription = $input['description']; // This is already JSON string from frontend
    $recipeProcess = $input['process'];       // This is already JSON string from frontend
    $recipeIngredients = $input['ingredients']; // This is already JSON string from frontend
    
    // Get Source and Yield from the top metadata section
    // These should be the IDs from the database, or null if not selected/entered.
    // If the input is a text value for a new source, the frontend should have already
    // handled adding it to the database and providing the ID.
    $sourceId = isset($input['source']) && $input['source'] !== '' ? $input['source'] : null;
    $recipeYield = isset($input['yield']) ? $input['yield'] : null;
    $cuisineId = isset($input['cuisine']) && $input['cuisine'] !== '' ? $input['cuisine'] : null;
    $seasonId = isset($input['season']) && $input['season'] !== '' ? $input['season'] : null;
    $typeId = isset($input['type']) && $input['type'] !== '' ? $input['type'] : null;
    $mealId = isset($input['meal']) && $input['meal'] !== '' ? $input['meal'] : null;

    // Connect to the database
    try {
        require_once('databaseKeys.php'); // Contains DB_DSN, DB_USER, DB_PASSWORD
        $pdo = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["message" => "Database connection failed: " . $e->getMessage()]);
        exit();
    }

    // Start a transaction for atomicity
    $pdo->beginTransaction();

    try {
        // 1. Insert into `recipe` table
        $newRecipeID = generate_uuid_v4(); // Generate UUID for the new recipe

        $sql_recipe = "INSERT INTO recipe (id, name, description, process, sourceID, yield, cuisineID, seasonID, typeID, mealID)
                       VALUES (:id, :name, :description, :process, :sourceID, :yield, :cuisineID, :seasonID, :typeID, :mealID)";
        $stmt_recipe = $pdo->prepare($sql_recipe);

        $stmt_recipe->bindParam(':id', $newRecipeID);
        $stmt_recipe->bindParam(':name', $recipeName);
        $stmt_recipe->bindParam(':description', $recipeDescription);
        $stmt_recipe->bindParam(':process', $recipeProcess);
        $stmt_recipe->bindParam(':sourceID', $sourceId); // Use $sourceId (which is the DB ID)
        $stmt_recipe->bindParam(':yield', $recipeYield);
        $stmt_recipe->bindParam(':cuisineID', $cuisineId);
        $stmt_recipe->bindParam(':seasonID', $seasonId);
        $stmt_recipe->bindParam(':typeID', $typeId);
        $stmt_recipe->bindParam(':mealID', $mealId);
        $stmt_recipe->execute();

        // 2. Insert into `recipe_ingredient` table
        $ingredientsArray = json_decode($recipeIngredients, true); // Decode the JSON string back to an array

        if (!empty($ingredientsArray)) {
            $sql_recipe_ingredient = "INSERT INTO recipe_ingredient (recipeID, ingredientID, volume, volUnit, mass, massUnit, display_text)
                                      VALUES (:recipeID, :ingredientID, :volume, :volUnit, :mass, :massUnit, :displayText)";
            $stmt_recipe_ingredient = $pdo->prepare($sql_recipe_ingredient);

            foreach ($ingredientsArray as $ingredient) {
                // Assuming 'ingredientDbId' is the actual ingredient ID from the database
                // and 'unitDbId' is the actual unit ID from the database
                $ingredientDbId = $ingredient['ingredientDbId'];
                $unitDbId = $ingredient['unitDbId']; // This is the volume unit ID
                $volume = $ingredient['quantity']; // 'quantity' from frontend maps to 'volume'
                $displayText = $ingredient['display'];

                // For simplicity, assuming mass/massUnit are not always provided or are null
                // You might need to adjust this based on your frontend data structure for mass
                $mass = null; // Placeholder, adjust if your frontend sends mass data
                $massUnitDbId = null; // Placeholder, adjust if your frontend sends mass unit data

                if ($ingredientDbId) { // Ensure we have a valid ingredient ID from the database
                    $stmt_recipe_ingredient->bindParam(':recipeID', $newRecipeID);
                    $stmt_recipe_ingredient->bindParam(':ingredientID', $ingredientDbId);
                    $stmt_recipe_ingredient->bindParam(':volume', $volume); // 'quantity' from frontend maps to 'volume'
                    $stmt_recipe_ingredient->bindParam(':volUnit', $unitDbId);         // Store unit ID
                    // Use NULL for mass/massUnit if they are not provided, or provide a default if needed
                    $stmt_recipe_ingredient->bindParam(':mass', $mass);
                    $stmt_recipe_ingredient->bindParam(':massUnit', $massUnitDbId);       // Store unit ID
                    $stmt_recipe_ingredient->bindParam(':displayText', $displayText);

                    $stmt_recipe_ingredient->execute();
                } else {
                    error_log("Ingredient missing database ID for recipe ID: {$newRecipeID}. Frontend ID was '{$ingredient['id']}'. Skipping this ingredient for recipe_ingredients table.");
                }
            }
        }

        $pdo->commit(); // Commit the transaction if all insertions are successful

        // Send success response
        http_response_code(201); // Created
        echo json_encode(["message" => "Recipe saved successfully!", "recipe_id" => $newRecipeID]);

    } catch (\PDOException $e) {
        $pdo->rollBack(); // Rollback on error to ensure data consistency
        // Send error response
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "Error saving recipe: " . $e->getMessage()]);
    }

} else {
    // If not a POST request
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "Only POST requests are allowed for this endpoint."]);
}
?>