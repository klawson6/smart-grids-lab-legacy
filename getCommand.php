<?php
// In the variables section below, replace user and password with your own MySQL credentials as created on your server
$servername = "localhost";
$username = "kylel";
$password = "Sgl99Rwanda*";
$dbname = "smartgridslab";

// Create MySQL connection
$conn = mysqli_connect($servername, $username, $password, $dbname);

// Check connection - if it fails, output will include the error message
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

$imei = $_GET['imei']; // The parameter of the GET request, the unique identifier, IMEI number

$stmt = $conn->prepare("SELECT Command FROM DeviceInfo WHERE IMEI = ?"); // Bind parameters ot avoid data injection
$stmt->bind_param("i", $imei);
$stmt->execute();
$result = $stmt->get_result();

// If a command is pending in the table for this device, send it to the device.
if ($result->num_rows > 0) {
    // output data of each row
    while($row = $result->fetch_assoc()) {
        echo $row["Command"];
    }
} else {
    echo "0 results";
}

$conn->close();
?>
