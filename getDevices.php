<?php
/**
 * Created by IntelliJ IDEA.
 * User: kylelawson
 * Date: 6/21/19
 */
session_start(); // Start a session storage. Variables stored on the clients machine, can be used to check log in details

// Check if the user is logged in, if not, redirect to the log in page
if (!isset($_SESSION['loggedin'])) {
    header('Location: index.php');
    exit();
}

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

// Prepare our SQL, preparing the SQL statement will prevent SQL injection.
if ($stmt = $con->prepare('Select * FROM DeviceInfo')) {
    $stmt->execute();
    // Store the result so we can json encode the data
    $res = $stmt->get_result();
    if ($res->num_rows > 0) {
        while ($row = $res->fetch_assoc()) {
            $results[] = $row;
        }
        echo json_encode($results);
    } else {
        die('No values returned.');
    }
    $stmt->close();
}