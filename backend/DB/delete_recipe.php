<?php

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

// Only logged-in users can delete recipes
require_once(__DIR__ . '/../auth/session.php');
requireLoginApi();

if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(["message" => "Only POST requests are allowed for this endpoint."]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$recipeID = isset($input['id']) && is_string($input['id']) && $input['id'] !== '' ? $input['id'] : null;

if (!$recipeID) {
    http_response_code(400); // Bad Request
    echo json_encode(["message" => "Recipe ID is missing."]);
    exit();
}

// Connect to the database with a new PDO:
try {
    require_once('databaseKeys.php');
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION); // Enable exceptions for better error handling
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC); // Fetch as associative array by default
} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    error_log("Connection failed: " . $e->getMessage()); // Details stay in the server log
    echo json_encode(["message" => "Connection failed."]);
    exit();
}

$pdo->beginTransaction();

try {
    $stmt_exists = $pdo->prepare("SELECT 1 FROM recipe WHERE id = :id");
    $stmt_exists->bindParam(':id', $recipeID);
    $stmt_exists->execute();
    if (!$stmt_exists->fetchColumn()) {
        $pdo->rollBack();
        http_response_code(404); // Not Found
        echo json_encode(["message" => "Recipe not found."]);
        exit();
    }

    // Recipes using this one as an ingredient would lose that ingredient the next time they're saved,
    // so they have to stop using it first
    $sql_users = "SELECT DISTINCT r.name FROM recipe_ingredients ri JOIN recipe r ON ri.recipeID = r.id
                  WHERE ri.linkedRecipeID = :id AND ri.recipeID != :self";
    $stmt_users = $pdo->prepare($sql_users);
    $stmt_users->bindParam(':id', $recipeID);
    $stmt_users->bindParam(':self', $recipeID);
    $stmt_users->execute();
    $usedBy = $stmt_users->fetchAll(PDO::FETCH_COLUMN);
    if ($usedBy) {
        $pdo->rollBack();
        http_response_code(409); // Conflict
        echo json_encode(["message" => "This recipe is an ingredient in: " . implode(', ', $usedBy) . ". Remove it from those recipes first.", "usedBy" => $usedBy]);
        exit();
    }

    // Child rows first, then the recipe itself (there are no foreign keys to cascade)
    foreach (['recipe_ingredients', 'recipe_sources', 'recipe_cuisines', 'recipe_meals', 'recipe_seasons', 'recipe_types'] as $childTable) {
        $stmt_delete = $pdo->prepare("DELETE FROM $childTable WHERE recipeID = :recipeID");
        $stmt_delete->bindParam(':recipeID', $recipeID);
        $stmt_delete->execute();
    }
    $stmt_recipe = $pdo->prepare("DELETE FROM recipe WHERE id = :id");
    $stmt_recipe->bindParam(':id', $recipeID);
    $stmt_recipe->execute();

    $pdo->commit();

    echo json_encode(["message" => "Recipe deleted.", "recipe_id" => $recipeID]);

} catch (PDOException $e) {
    $pdo->rollBack(); // Rollback on error to ensure data consistency
    http_response_code(500); // Internal Server Error
    error_log("Error deleting recipe: " . $e->getMessage()); // Details stay in the server log
    echo json_encode(["message" => "Error deleting recipe."]);
}
?>
