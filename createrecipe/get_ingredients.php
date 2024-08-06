<?php
define('__ROOT__', dirname(dirname(__FILE__)));
require_once(__ROOT__.'/databaseKeys.php');

$dbh = new PDO(DB_DSN, DB_USER, DB_PASSWORD);

$sth = $dbh->prepare("SELECT ingred_name FROM ingredient");
$sth->execute();
$ingredients = $sth->fetchAll();

echo json_encode($ingredients);