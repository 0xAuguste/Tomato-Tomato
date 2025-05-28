<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Origin: *"); // Allow all origins for development. Restrict in production.

// Require the UUID helper function
require_once(__DIR__ . '/../utils/uuid.php');

$input = json_decode(file_get_contents('php://input'), true);

if(isset($input['name']) && isset($input['table'])) {
    $option_name = $input['name'];
    $table_name = $input['table'];
} else {
    echo json_encode(["error" => "Missing 'name' or 'table' in request."]);
    exit;
}

// Whitelist of allowed tables for insertion
$validTables = ['cuisine', 'source'];

if (!in_array($table_name, $validTables)) {
    echo json_encode(["error" => "Invalid table specified."]);
    exit;
}

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

// Perform DB interactions:
try {
    // Check if the option already exists (case-insensitive search)
    $sql_check_exists = "SELECT id FROM " . $table_name . " WHERE name = :option_name COLLATE utf8mb4_unicode_ci LIMIT 1";
    $sth = $pdo->prepare($sql_check_exists);
    $sth->bindParam(':option_name', $option_name);
    $sth->execute();
    $existing_record = $sth->fetch();

    if ($existing_record) {
        // Option already exists, return its ID
        echo json_encode([
            "message" => "\"" . $option_name . "\" already exists in " . $table_name . ".",
            "id" => $existing_record['id']
        ]);
    } else {
        // Option does not exist, insert it with a new UUID
        $newId = generate_uuid_v4(); // Generate a new UUID

        // Ensure the 'id' column is included in the insert statement
        $sql_insert = "INSERT INTO " . $table_name . " (id, name) VALUES (:id, :option_name)";
        $sth = $pdo->prepare($sql_insert);
        $sth->bindParam(':id', $newId);
        $sth->bindParam(':option_name', $option_name);
        $sth->execute();

        echo json_encode([
            "message" => "New " . $table_name . " \"" . $option_name . "\" successfully added.",
            "id" => $newId // Return the newly generated UUID
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    echo json_encode(["error" => "Database operation failed: " . $e->getMessage()]);
}

?>