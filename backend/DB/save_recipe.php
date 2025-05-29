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
    $recipeDescription = $input['description'];
    $recipeProcess = $input['process'];
    $recipeIngredients = $input['ingredients'];

    $recipeYield = isset($input['yield']) ? $input['yield'] : null;
    $sourceID = isset($input['sourceID']) ? $input['sourceID'] : null;
    $cuisineID = isset($input['cuisineID']) ? $input['cuisineID'] : null;
    $mealID = isset($input['mealID']) ? $input['mealID'] : null;
    $seasonID = isset($input['seasonID']) ? $input['seasonID'] : null;
    $typeID = isset($input['typeID']) ? $input['typeID'] : null;

    // Connect to the database with a new PDO:
    try {
        require_once('databaseKeys.php');
        $pdo = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Enable exceptions for better error handling
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Fetch as associative array by default
    } catch (PDOException $e) {
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "Connection failed: " . $e->getMessage()]);
        exit();
    }

    // Start a transaction
    $pdo->beginTransaction();

    try {
        // Generate a new UUID for the recipe
        $newRecipeID = generate_uuid_v4();

        // Prepare the INSERT statement for the recipe table
        $sql_recipe = "INSERT INTO recipe (id, name, description, process, sourceID, yield) VALUES (:id, :name, :description, :process, :sourceID, :yield)";
        $stmt_recipe = $pdo->prepare($sql_recipe);

        // Bind parameters for recipe table
        $stmt_recipe->bindParam(':id', $newRecipeID);
        $stmt_recipe->bindParam(':name', $recipeName);
        $stmt_recipe->bindParam(':description', $recipeDescription); // Store as JSON string
        $stmt_recipe->bindParam(':process', $recipeProcess);       // Store as JSON string
        $stmt_recipe->bindParam(':sourceID', $sourceID);
        $stmt_recipe->bindParam(':yield', $recipeYield);
        $stmt_recipe->execute();

        // Prepare the INSERT statement for recipe_ingredients table
        $sql_recipe_ingredient = "INSERT INTO recipe_ingredients (id, recipeID, ingredientID, volume, volUnit, mass, massUnit, displayText) VALUES (:id, :recipeID, :ingredientID, :volume, :volUnit, :mass, :massUnit, :displayText)";
        $stmt_recipe_ingredient = $pdo->prepare($sql_recipe_ingredient);

        // Insert ingredients
        foreach ($recipeIngredients as $ingredient) {
            if (isset($ingredient['ingredientDbId'])) {
                $ingredID = generate_uuid_v4();
                $vol = isset($ingredient['quantity']) ? $ingredient['quantity'] : null; // 'quantity' from frontend maps to 'volume'
                $volUnitDbId = isset($ingredient['unitDbId']) ? $ingredient['unitDbId'] : null; // Store unit ID
                $mass = null; // Assuming mass is not directly provided in this structure
                $massUnitDbId = null; // Assuming massUnit is not directly provided
                $displayText = $ingredient['display']; // Store the display text

                $stmt_recipe_ingredient->bindParam(':id', $ingredID);
                $stmt_recipe_ingredient->bindParam(':recipeID', $newRecipeID);
                $stmt_recipe_ingredient->bindParam(':ingredientID', $ingredient['ingredientDbId']);
                $stmt_recipe_ingredient->bindParam(':volume', $vol);
                $stmt_recipe_ingredient->bindParam(':volUnit', $volUnitDbId);
                $stmt_recipe_ingredient->bindParam(':mass', $mass);
                $stmt_recipe_ingredient->bindParam(':massUnit', $massUnitDbId);
                $stmt_recipe_ingredient->bindParam(':displayText', $displayText);

                $stmt_recipe_ingredient->execute();
            } else {
                error_log("Ingredient missing database ID for recipe ID: {$newRecipeID}. Frontend ID was '{$ingredient['id']}'. Skipping this ingredient for recipe_ingredients table.");
            }
        }

        // Insert into recipe_cuisines
        if ($cuisineID) {
            $sql_recipe_cuisine = "INSERT INTO recipe_cuisines (id, recipeID, cuisineID) VALUES (:id, :recipeID, :cuisineID)";
            $stmt_recipe_cuisine = $pdo->prepare($sql_recipe_cuisine);
            $recipeCuisineID = generate_uuid_v4();
            $stmt_recipe_cuisine->bindParam(':id', $recipeCuisineID);
            $stmt_recipe_cuisine->bindParam(':recipeID', $newRecipeID);
            $stmt_recipe_cuisine->bindParam(':cuisineID', $cuisineID);
            $stmt_recipe_cuisine->execute();
        }

        // Insert into recipe_meals
        if ($mealID) {
            $sql_recipe_meal = "INSERT INTO recipe_meals (id, recipeID, mealID) VALUES (:id, :recipeID, :mealID)";
            $stmt_recipe_meal = $pdo->prepare($sql_recipe_meal);
            $recipeMealID = generate_uuid_v4();
            $stmt_recipe_meal->bindParam(':id', $recipeMealID);
            $stmt_recipe_meal->bindParam(':recipeID', $newRecipeID);
            $stmt_recipe_meal->bindParam(':mealID', $mealID);
            $stmt_recipe_meal->execute();
        }

        // Insert into recipe_seasons
        if ($seasonID) {
            $sql_recipe_season = "INSERT INTO recipe_seasons (id, recipeID, seasonID) VALUES (:id, :recipeID, :seasonID)";
            $stmt_recipe_season = $pdo->prepare($sql_recipe_season);
            $recipeSeasonID = generate_uuid_v4();
            $stmt_recipe_season->bindParam(':id', $recipeSeasonID);
            $stmt_recipe_season->bindParam(':recipeID', $newRecipeID);
            $stmt_recipe_season->bindParam(':seasonID', $seasonID);
            $stmt_recipe_season->execute();
        }

        // Insert into recipe_types
        if ($typeID) {
            $sql_recipe_type = "INSERT INTO recipe_types (id, recipeID, typeID) VALUES (:id, :recipeID, :typeID)";
            $stmt_recipe_type = $pdo->prepare($sql_recipe_type);
            $recipeTypeID = generate_uuid_v4();
            $stmt_recipe_type->bindParam(':id', $recipeTypeID);
            $stmt_recipe_type->bindParam(':recipeID', $newRecipeID);
            $stmt_recipe_type->bindParam(':typeID', $typeID);
            $stmt_recipe_type->execute();
        }

        $pdo->commit(); // Commit the transaction if all insertions are successful

        // Send success response
        http_response_code(201); // Created
        echo json_encode(["message" => "Recipe saved successfully!", "recipe_id" => $newRecipeID]);

    } catch (PDOException $e) {
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