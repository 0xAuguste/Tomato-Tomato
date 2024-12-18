<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Methods: POST");

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

    $categoryID = $sth->fetch()[0]; // extract the category ID

    // Insert the ingredient name and categoryID into `ingredients`
    if ($categoryID) {
        $sql_insert = "INSERT INTO ingredient (name, categoryID) VALUES (:ingred_name, :category_ID)";
        $sth = $pdo->prepare($sql_insert);
        $sth->bindValue(':ingred_name', $ingred_name);
        $sth->bindValue(':category_ID', $categoryID);
        $sth->execute();
        echo json_encode(["message" => "New ingredient '$ingred_name' successfully added"]);
    } else {
        echo json_encode(["error" => "Category does not exist."]);
        exit;
    }
}
catch (PDOException $e) {
    echo json_encode(["error" => "Error executing query: " . $e->getMessage()]);
}
