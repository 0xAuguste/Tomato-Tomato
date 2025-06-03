<?php

// Require the UUID helper function
require_once(__DIR__ . '/../utils/uuid.php');

header('Content-Type: application/json');
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Origin: *"); // Ensure CORS is enabled for development

// Check that we received an ingredient via POST and assign variables
$input = json_decode(file_get_contents('php://input'), true);

if(isset($input['new-ingred-name']) && isset($input['new-ingred-category'])) {
    $ingred_name = $input['new-ingred-name'];
    $ingred_category = $input['new-ingred-category'];
}
else {
    echo json_encode(["error" => "No ingredient received"]);
    exit;
}

// Connect to the database with a new PDO:
try {
    require_once('databaseKeys.php');
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Enable exceptions for better error handling
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Fetch as associative array by default

}
catch (PDOException $e) {
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
    exit;
}

// Perform DB interactions:
try {
    // Get the category ID that matches the user entered category name:
    $sql_select_category = "SELECT id FROM ingredientCategory WHERE name = :ingred_category LIMIT 1";
    $sth = $pdo->prepare($sql_select_category);
    $sth->bindValue(':ingred_category', $ingred_category);
    $sth->execute();

    $categoryData = $sth->fetch(); // Fetch the associative array
    $categoryID = $categoryData ? $categoryData['id'] : null; // Extract the category ID, or null if not found

    // Insert the ingredient name and categoryID into `ingredients`
    if ($categoryID) {
        $newId = generate_uuid_v4(); // Generate a new UUID in PHP

        $sql_insert = "INSERT INTO ingredient (id, name, categoryID) VALUES (:id, :ingred_name, :category_ID)";
        $sth = $pdo->prepare($sql_insert);
        $sth->bindValue(':id', $newId); // Bind the generated UUID
        $sth->bindValue(':ingred_name', $ingred_name);
        $sth->bindValue(':category_ID', $categoryID);
        $sth->execute();

        echo json_encode([
            "message" => "New ingredient '" . $ingred_name . "' successfully added",
            "id" => $newId, // Return the newly generated UUID
            "name" => $ingred_name // Return the name for convenience
        ]);
    } else {
        http_response_code(404); // Not Found
        echo json_encode(["error" => "Ingredient category '" . $ingred_category . "' not found."]);
    }
}
catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "Error adding new ingredient: " . $e->getMessage()]);
}

?>