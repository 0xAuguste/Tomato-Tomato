<?php

// Function to generate a UUID v4 (RFC 4122)
if (!function_exists('generate_uuid_v4')) {
    function generate_uuid_v4() {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            // 32 bits for "time_low"
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),

            // 16 bits for "time_mid"
            mt_rand(0, 0xffff),

            // 16 bits for "time_hi_and_version",
            // four most significant bits holds version number 4
            mt_rand(0, 0x0fff) | 0x4000,

            // 16 bits for "clk_seq_hi_res",
            // 8 bits for "clk_seq_low",
            // two most significant bits holds zero and one for RFC 4122
            mt_rand(0, 0x3fff) | 0x8000,

            // 48 bits for "node"
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }
}

// Set CORS headers and Content-Type header for JSON response
header("Access-Control-Allow-Origin: *"); // Adjust in production for specific domains
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS"); // Allow POST and OPTIONS methods
header("Access-Control-Max-Age: 3600"); // Cache preflight response for 1 hour
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight requests (OPTIONS method)
// This is required for complex CORS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if the request method is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true); // Decode the JSON into a PHP associative array

    // Generate a new UUID for the recipe
    $newRecipeID = generate_uuid_v4(); // Generate the UUID here!

    // Extract data based on your recipe table columns (provided by user)
    $recipeName = $data['name'] ?? '';
    // These will be JSON strings from the frontend, store them directly as TEXT/JSON in DB
    $recipeDescriptionJson = $data['description'] ?? '[]';
    $recipeProcessJson = $data['process'] ?? '[]';

    // Placeholder for other recipe fields not yet explicitly in frontend payload
    // You'll need to add input fields for these in index.php and populate them in createRecipe.js
    $recipeSource = $data['source'] ?? null;
    $recipeTime = $data['time'] ?? null;
    $recipeTimeUnit = $data['timeUnit'] ?? null;
    $recipeMakes = $data['makes'] ?? null;
    $recipeMakesUnit = $data['makesUnit'] ?? null;

    // The 'ingredients' array sent from JS, decoded for processing
    $frontendIngredients = json_decode($data['ingredients'] ?? '[]', true);

    // Basic validation: check if recipe name is not empty
    if (empty($recipeName)) {
        http_response_code(400); // Bad Request
        echo json_encode(["message" => "Recipe name cannot be empty."]);
        exit();
    }

    // Database Connection (using your existing databaseKeys.php setup)
    try {
        require_once('databaseKeys.php'); // Path to your databaseKeys.php
        $pdo = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Set error mode to exception
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Fetch as associative array
    } catch (\PDOException $e) {
        http_response_code(500); // Internal Server Error
        echo json_encode(["message" => "Database connection failed: " . $e->getMessage()]);
        exit();
    }

    try {
        // Start a transaction for atomicity, as we're inserting into multiple tables
        $pdo->beginTransaction();

        // 1. Insert into the 'recipe' table
        // Explicitly include recipeID and bind the generated UUID
        $sql_insert_recipe = "INSERT INTO recipe (recipeID, name, description, process, source, time, timeUnit, makes, makesUnit)
                              VALUES (:recipeID, :name, :description, :process, :source, :time, :timeUnit, :makes, :makesUnit)";

        $stmt_recipe = $pdo->prepare($sql_insert_recipe);

        $stmt_recipe->bindParam(':recipeID', $newRecipeID); // Bind the generated UUID
        $stmt_recipe->bindParam(':name', $recipeName);
        $stmt_recipe->bindParam(':description', $recipeDescriptionJson); // Store as JSON string
        $stmt_recipe->bindParam(':process', $recipeProcessJson);       // Store as JSON string
        $stmt_recipe->bindParam(':source', $recipeSource);
        $stmt_recipe->bindParam(':time', $recipeTime);
        $stmt_recipe->bindParam(':timeUnit', $recipeTimeUnit);
        $stmt_recipe->bindParam(':makes', $recipeMakes);
        $stmt_recipe->bindParam(':makesUnit', $recipeMakesUnit);

        $stmt_recipe->execute();

        // $newRecipeID is already set from the generated UUID, no need for lastInsertId() here

        // 2. Handle ingredients for recipe_ingredients table (Many-to-Many Relationship)
        // This part inserts each ingredient linked to the new recipe, using the actual DB IDs.
        if (is_array($frontendIngredients) && !empty($frontendIngredients)) {
            $sql_insert_recipe_ingredient = "INSERT INTO recipe_ingredients (recipeID, ingredientID, volume, volUnit, mass, massUnit)
                                             VALUES (:recipeID, :ingredientID, :volume, :volUnit, :mass, :massUnit)";
            $stmt_recipe_ingredient = $pdo->prepare($sql_insert_recipe_ingredient);

            foreach ($frontendIngredients as $ingredient) {
                // Get the actual database ingredientID and unitID directly from the frontend payload
                $ingredDbId = $ingredient['ingredientDbId'] ?? null;
                $volUnitDbId = $ingredient['unitDbId'] ?? null;

                $mass = $ingredient['mass'] ?? null;
                $massUnitDbId = $ingredient['massUnitDbId'] ?? null; // If you send unit ID, otherwise use name

                if ($ingredDbId) { // Only insert if we have a valid database ingredient ID
                    $stmt_recipe_ingredient->bindParam(':recipeID', $newRecipeID); // Use the generated UUID here
                    $stmt_recipe_ingredient->bindParam(':ingredientID', $ingredDbId);
                    $stmt_recipe_ingredient->bindParam(':volume', $ingredient['quantity']); // 'quantity' from frontend maps to 'volume'
                    $stmt_recipe_ingredient->bindParam(':volUnit', $volUnitDbId);         // Store unit ID
                    // Use NULL for mass/massUnit if they are not provided, or provide a default if needed
                    $stmt_recipe_ingredient->bindParam(':mass', $mass);
                    $stmt_recipe_ingredient->bindParam(':massUnit', $massUnitDbId);       // Store unit ID

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