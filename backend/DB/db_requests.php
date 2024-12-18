<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Methods: GET");

// Connect to the database with a new PDO:
try {
    require_once('databaseKeys.php');
    $pdo = new PDO(DB_DSN, DB_USER, DB_PASSWORD);

}
catch (PDOException $e) {
    echo json_encode(["error" => "Connection failed: " . $e->getMessage()]);
    exit;
}

$table = isset($_GET['table']) ? $_GET['table'] : null;
$validTables = ['ingredient', 'ingredientCategory', 'cuisine', 'meal', 'recipe', 'season',
                'season', 'source', 'type', 'unit']; // List of allowed tables

// Query database if table is valid:
if (in_array($table, $validTables)) {
    try {
        $sql = "SELECT name FROM $table";
        $sth = $pdo->prepare($sql);
        $sth->execute();
        $rows = $sth->fetchAll(PDO::FETCH_ASSOC);

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
