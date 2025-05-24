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

}
catch (PDOException $e) {
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
    exit;
}

$table = isset($_GET['table']) ? $_GET['table'] : null;
$validTables = ['ingredient', 'ingredientCategory', 'cuisine', 'meal', 'recipe', 'season',
                'source', 'type', 'unit'];

// Query database if table is valid:
if (in_array($table, $validTables)) {
    try {
        // Always select both 'id' and 'name'
        $sql = "SELECT id, name FROM $table"; // Updated to select both columns
        $sth = $pdo->prepare($sql);
        $sth->execute();
        $rows = $sth->fetchAll(); // PDO::FETCH_ASSOC is default now

        if ($rows) { // Table has rows
            echo json_encode($rows);
        } else {
            echo json_encode(["message" => "No records found."]);
        }
    }
    catch (PDOException $e) {
        echo json_encode(["error" => "Error executing query: " . $e->getMessage()]);
    }
}
else {
    echo json_encode(["error" => "Invalid table name"]);
}

?>