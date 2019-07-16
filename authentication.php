<?php
/**
 * Created by IntelliJ IDEA.
 * User: kylelawson
 * Date: 6/18/19
 * Time: 9:49 AM
 */
session_start(); // Start a session storage. Variables stored on the clients machine, can be used to check log in details

// Database connection info
$DATABASE_HOST = 'localhost';
$DATABASE_USER = 'kylel';
$DATABASE_PASS = 'Sgl99Rwanda*';
$DATABASE_NAME = 'smartgridslab';

// Try to connect to Database
$con = mysqli_connect($DATABASE_HOST, $DATABASE_USER, $DATABASE_PASS, $DATABASE_NAME);
if (mysqli_connect_errno()) {
    // Could not connect to the Database
    die('Failed to connect to MySQL' . mysqli_connect_error());
}

// Now we check if the data from the login form was submitted, isset() will check if the data exists
if (!isset($_POST['username'], $_POST['pass'])) {
    // Could not get the data that should have been set
    die('Please fill both the username and password field!');
}

// Prepare our SQL, preparing the SQL statement will prevent SQL injection.
if ($stmt = $con->prepare('Select id, password FROM accounts WHERE username = ?')) {
    // Bind parameters. Data types specified by letters
    $stmt->bind_param('s', $_POST['username']);
    $stmt->execute();
    // Store the result so we can check if the account exists in the database.
    $stmt->store_result();
    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id, $password);
        $stmt->fetch();
        // Account exists, now we verify the password
        if (password_verify($_POST['pass'], $password)) {
            // Verification successful, user logged in.
            // Create sessions so we know who is logged in. Basically cookie for server side.
            session_regenerate_id();
            $_SESSION['loggedin'] = TRUE;
            $_SESSION['name'] = $_POST['username'];
            $_SESSION['id'] = $id;
            header('Location: home.php');
        } else {
            echo 'Incorrect password!';
        }
    } else {
        echo 'Incorrect username!';
    }
    $stmt->close();
}