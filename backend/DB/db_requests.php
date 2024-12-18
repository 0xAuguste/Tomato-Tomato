<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Methods: POST, GET");

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

if (in_array($table, $validTables)) {
    
    $sql = "SELECT name FROM $table";
    try {
        $sth = $pdo->prepare($sql);
        $sth->execute();
        $rows = $sth->fetchAll(PDO::FETCH_ASSOC);

        if ($rows) {
            echo json_encode($rows);
        } else {
            echo json_encode(["message" => "No records found."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["error" => "Error executing query: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["error" => "Invalid table specified."]);
}

