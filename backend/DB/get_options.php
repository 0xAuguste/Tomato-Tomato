<?php

if(isset($_POST['table'])) { 
    try {
        require_once('databaseKeys.php');

        $dbh = new PDO(DB_DSN, DB_USER, DB_PASSWORD);

        $sth = $dbh->prepare("SELECT {$_POST['column']} FROM {$_POST['table']}");
        $sth->execute();
        $options = $sth->fetchAll();

        echo json_encode($options);
    }
    catch(PDOException $e) {
        echo $e->getMessage();
    }
} else {
    echo "POST problem";
}