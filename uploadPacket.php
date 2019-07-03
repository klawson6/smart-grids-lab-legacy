<?php
// In the variables section below, replace user and password with your own MySQL credentials as created on your server
$servername = "localhost";
$username = "kylel";
$password = "Sgl99Rwanda*";
$dbname = "smartgridslab";

// Posted JSON
$data = json_decode(file_get_contents('php://input'));

// Create MySQL connection
$conn = mysqli_connect($servername, $username, $password, $dbname);

// Check connection - if it fails, output will include the error message
if (!$conn) {
    die("Connection failed:' . mysqli_connect_error() . '\n");
}
echo "Connected successfully\n";

$tz = 'Europe/London'; // Set timezone
$timestamp = time(); // Init new time obj
$dt = new DateTime("now", new DateTimeZone($tz)); // Set DateTime to now in the set timezone
$dt->setTimestamp($timestamp); // Set DateTime to only a time obj
$dt->modify('-1 hours'); // Move back the time obj by 4 hours to compensate for data sampling over time in the incoming packet
$dtSQL = $dt->format('Y-m-d H:i:s'); // Set time format
//echo $dtSQL;

//$sql = "UPDATE TEST_GPRS SET Marker = '$dtSQL' WHERE ID = 1"; // Indicates if GPRS module touched server, old test code not needed.
//if ($conn->query($sql) === TRUE) {
//    echo "Date-time stamped.";
//} else {
//    echo "Error: " . $sql . "<br>" . $conn->error;
//}

$imei = $data->IMEI;
$table = "data_" . $imei; // Set name for table of data for the GPRS module that sent data

if (mysqli_query('Select 1 from $table LIMIT 1') == FALSE) { // Check if a table of data for this GPRS module already exists on the database
    // Create a new table if it does exist
    $sql = "CREATE TABLE `$table` (DateTime datetime PRIMARY KEY, BatteryVoltage int(11) NOT NULL, PowerImport int(11) NOT NULL, PowerExport int(11) NOT NULL, DistributionVoltage int(11) NOT NULL, LoadBusbar int(11) NOT NULL)";
    if ($conn->query($sql) === TRUE) {
        echo "New table " . $table . " created successfully";
    }
}

// Extract data values from POST packet
$bv = $data->BatteryVoltage;
$pi = $data->PowerImport;
$px = $data->PowerExport;
$dv = $data->DistributionVoltage;
$lb = $data->LoadBusbar;

$income = 0;
$outgoing = 0;
$total = 0;
if (is_array($bv) && is_array($pi) && is_array($px) && is_array($dv) && is_array($lb)) { // Verify data structure
    for ($i = 0; $i < count($bv); $i++) { // For all 48 samples
        $dt->modify('+1 minutes'); // Modify timestamp to be unique and representative to every sample of data taken over the 4 hours
        $dtSQL = $dt->format('Y-m-d H:i:s'); // Set format of time

        switch (true) {
            case (4800 <= $dv[$i]):
                $income += $pi[$i] * 0.00004567;
                $outgoing += $px[$i] * 0.0000004567;
                break;
            case (4600 <= $dv[$i] && $dv[$i] < 4800):
                $income += $pi[$i] * 0.00009133;
                $outgoing += $px[$i] * 0.00009133;
                break;
            case (4400 <= $dv[$i] && $dv[$i] < 4600):
                $income += $pi[$i] * 0.000137;
                $outgoing += $px[$i] * 0.000137;
                break;
            case ($dv[$i] < 4400):
                $income += $pi[$i] * 0.0001826;
                $outgoing += $px[$i] * 0.0001826;
                break;
        }
        echo($income . " " .$outgoing . "\n");
        // Insert sample of data into the unique table
        if ($stmt = $conn->prepare("INSERT INTO $table (DateTime, BatteryVoltage, PowerImport, PowerExport, DistributionVoltage, LoadBusbar) VALUES (?,?,?,?,?,?)")) {
            // Bind parameters to avoid data injection
            $stmt->bind_param("siiiii", $dtSQL, $bv[$i], $pi[$i], $px[$i], $dv[$i], $lb[$i]);
            $stmt->execute();
        }
        $stmt->close();
    }
    $total = $income-$outgoing;
    echo($total."\n");
    if ($stmt = $conn->prepare("SELECT Balance FROM DeviceInfo WHERE IMEI = ?")) { // Mark on database when the device last posted
        // Bind parameters to avoid data injection
        $stmt->bind_param("s",$imei);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows > 0) {
            while ($row = $result->fetch_assoc()) {
                $total = $row["Balance"] + $total;
                echo $total;
            }
        }
    }

    if ($stmt = $conn->prepare("UPDATE DeviceInfo SET LastActivity = ? , Balance = ? WHERE IMEI = ?")) { // Mark on database when the device last posted
        // Bind parameters to avoid data injection
        $stmt->bind_param("sds", $dtSQL, $total, $imei);
        $stmt->execute();
    }
    $stmt->close();
}
$conn->close();
?>
