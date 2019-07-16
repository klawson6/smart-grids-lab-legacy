<?php
// In the variables section below, replace user and password with your own MySQL credentials as created on your server
$servername = "localhost";
$username = "kylel";
$password = "Sgl99Rwanda*";
$dbname = "smartgridslab";

session_start(); // Start a session storage. Variables stored on the clients machine, can be used to check log in details

// Check if the user is logged in, if not, redirect to the log in page
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

if (!isset($_GET["imei"]) || !isset($_GET["cmd"]) || !isset($_GET["lat"]) || !isset($_GET["lng"])) failed(); // Check if the parameters are set before continuing
$imei = $_GET["imei"]; // The parameter of the GET request, the unique identifier, IMEI number
$cmd = $_GET["cmd"];
$lat = $_GET["lat"];
$lng = $_GET["lng"];

if (strlen($imei) != 15 || !ctype_digit($imei) || !is_numeric($lat) || !is_numeric($lng) || ($cmd != "0" && $cmd != "1" && $cmd != "2" && $cmd != "3")) failed(); // Check if the parameters are correct format

if ($stmt = $conn->prepare("INSERT INTO DeviceInfo (IMEI, Latitude, Longitude, Command) VALUES (?,?,?,?)")) {
    // Bind parameters to avoid data injection
    $stmt->bind_param("sddi", $imei, $lat, $lng, $cmd);
    if(!$stmt->execute()) exists();
}
$stmt->close();

echo 1;
$conn->close();

function failed(){ // Failed add
    echo 0;
    exit(0);
}

function exists(){ // Device exists with same info
    echo 2;
    exit(0);
}
?>
