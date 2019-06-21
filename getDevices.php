<?php
/**
 * Created by IntelliJ IDEA.
 * User: kylelawson
 * Date: 6/21/19
 */
session_start();

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

$tz = 'Europe/London'; // Set timezone
$timestamp = time(); // Set a variable to hold time
$dt = new DateTime("now", new DateTimeZone($tz)); // New DateTime variable with today's date
$dt->setTimestamp($timestamp); // Adjust the object to correct timestamp
$dt->modify('-4 hours'); // Go back 4 hours for a desired window of values
$dtSQL = $dt->format('Y-m-d H:i:s'); // Set the format of DateTime
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