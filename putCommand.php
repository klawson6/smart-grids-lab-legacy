<?php
// In the variables section below, replace user and password with your own MySQL credentials as created on your server
$servername = "localhost";
$username = "kylel";
$password = "Sgl99Rwanda*";
$dbname = "smartgridslab";

session_start();

if (!isset($_SESSION['loggedin'])) {
    header('Location: index.php');
    exit();
}
// Create MySQL connection
$conn = mysqli_connect($servername, $username, $password, $dbname);

// Check connection - if it fails, output will include the error message
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// Used to tell if script is touched at all, old and unused.

//$dt = date("Y-m-d H:i:s");
//$sql = "UPDATE TEST_GPRS SET Marker = '$dt' WHERE ID = 1";
//if ($conn->query($sql) !== TRUE) {
//    echo "Error: " . $sql . "<br>" . $conn->error;
//}

$imei = $_GET['imei']; // The parameter of the GET request, the unique identifier, IMEI number
$cmd = $_GET['cmd']; // The parameter of the GET request, the new command to be placed on database

$stmt = $conn->prepare("UPDATE DeviceInfo SET Command = ? WHERE IMEI = ?"); // Bind parameters ot avoid data injection
$stmt->bind_param("ii", $cmd, $imei);
$stmt->execute();

$conn->close();
?>
