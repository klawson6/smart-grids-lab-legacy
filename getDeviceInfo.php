<?php
// In the variables section below, replace user and password with your own MySQL credentials as created on your server
$servername = "localhost";
$username = "kylel";
$password = "Sgl99Rwanda*";
$dbname = "smartgridslab";

session_start();

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
$param = $_GET["param"];

switch ($param) {
    case "Command":
        $stmt = $conn->prepare("SELECT Command FROM DeviceInfo WHERE IMEI = ?"); // Bind parameters ot avoid data injection
        break;
    case "LastActivity":
        if (!isset($_SESSION['loggedin'])) {
            header('Location: index.php');
            exit();
        }
        $stmt = $conn->prepare("SELECT LastActivity FROM DeviceInfo WHERE IMEI = ?"); // Bind parameters ot avoid data injection
        break;
    case "*":
        if (!isset($_SESSION['loggedin'])) {
            header('Location: index.php');
            exit();
        }
        $stmt = $conn->prepare("SELECT * FROM DeviceInfo WHERE IMEI = ?"); // Bind parameters ot avoid data injection
        break;
    default:
        die("Request not correct");
}
//echo $imei . " " . $param;
//$stmt = $conn->prepare("SELECT ? FROM DeviceInfo WHERE IMEI = ?"); // Bind parameters ot avoid data injection
$stmt->bind_param("s", $imei);
$stmt->execute();
$result = $stmt->get_result();

// If a command is pending in the table for this device, send it to the device.
if ($result->num_rows > 0) {
    // output data of each row
    while ($row = $result->fetch_assoc()) {
        if ($param == "*")
            echo $row;
        else
            echo $row[$param];
    }
} else {
    echo "";
    die("No Results");
}

$conn->close();
?>
