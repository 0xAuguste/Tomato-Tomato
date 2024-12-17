<?php
if(isset($_POST['new-ingred-name'])) { 
    try {
	    require_once('databaseKeys.php');

        $dbh = new PDO(DB_DSN, DB_USER, DB_PASSWORD);
    
        $sth = $dbh->prepare("INSERT INTO ingredient (ingred_name, ingred_class)
            VALUES (:ingred_name, :ingred_class)");
        $sth->bindValue(':ingred_name', $_POST['new-ingred-name']);
        $sth->bindValue(':ingred_class', $_POST['new-ingred-class']);
        $sth->execute();

        echo "Added {$_POST['new-ingred-name']} to ingredient list!";
    }
    catch(PDOException $e) {
        echo $e->getMessage();
    }
} else {
    echo "Create ingredient failed";
}