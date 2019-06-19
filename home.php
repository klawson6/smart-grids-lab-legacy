<?php
/**
 * Created by IntelliJ IDEA.
 * User: kylelawson
 * Date: 6/18/19
 * Time: 10:15 AM
 */
// We need to use sessions, so you should always start sessions using the below code.
session_start();
// If the user is not logged in redirect to the login page...
if (!isset($_SESSION['loggedin'])) {
    header('Location: index.php');
    exit();
}
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Home Page</title>
    <link rel="icon" href="images/icon.png"/>
    <link href="home.css" rel="stylesheet" type="text/css">
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
          integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">

    <script src="js/Chart.js"></script>
    <link href="css/Chart.css" rel="stylesheet" type="text/css">

    <script src="Home.js"></script>
</head>
<body>
<!--<nav class="navtop">-->
<!--    <div>-->
<!--        <h1>Website Title</h1>-->
<!--        <a href="profile.php"><i class="fas fa-user-circle"></i>Profile</a>-->
<!--        <a href="logout.php"><i class="fas fa-sign-out-alt"></i>Logout</a>-->
<!--    </div>-->
<!--</nav>-->
<!--<div id="mappane">-->
<!--    <img src="images/map.png" id="tempmap">-->
<!--</div>-->
<!--<div id="controlpane">-->
<!--    <p id="filler">Filler</p>-->
<!--</div>-->
<div id="toppane">
    <!--    Logo    Admin Dashboard     Log off-->
    <div id="logodiv">
        <img class="titleicon" id="sglicon" src="images/sgl.png"/>
    </div>
    ADMIN DASHBOARD
    <div id="officondiv">
        <img class="titleicon" id="officon" src="images/officon.png"/>
    </div>
</div>
<div id="mainpane">
    <div id="menu">
        <div class="menutags" id="head">
            <p>CONTROL PANEL</p>
            <hr class="menubar">
        </div>
        <div class="menutags" id="browsetag">
            <p class="menutext">Browse</p>
        </div>
        <div class="menutags">
            <p class="menutext">Add New SGL Monitor</p>
        </div>
        <div class="menutags" id="menuoff">
            <hr class="menubar">
            <p class="menutext">Logout</p>
        </div>
    </div>
    <div id="infopane">
        <div id="graphpane">
            <!--                        Voltage graph-->
            <!--                        Power graph-->
            <div class="graph" id="volgraph">
                <canvas id="volgraphcanvas" width="auto" height="auto"></canvas>
                <script>
                    new Chart(document.getElementById("volgraphcanvas"), {
                        type: 'line',
                        data: {
                            // labels: [new Date(2019, 6, 19, 11, 6, 1).toTimeString(), new Date(2019, 6, 19, 12, 6, 1).toTimeString(), new Date(2019, 6, 19, 13, 6, 1).toTimeString(), new Date(2019, 6, 19, 14, 6, 1).toTimeString(), new Date(2019, 6, 19, 15, 1, 1).toTimeString()],
                            labels: ["11:06:01", "12:06:01", "13:06:01", "14:06:01", "15:01:01"],
                            datasets: [{
                                data: [{
                                    x: new Date(2019, 6, 19, 11, 6, 1),
                                    y: 1812
                                }, {x: new Date(2019, 6, 19, 12, 6, 1), y: 1304}, {
                                    x: new Date(2019, 6, 19, 13, 6, 1),
                                    y: 1293
                                }, {x: new Date(2019, 6, 19, 14, 6, 1), y: 1277}, {
                                    x: new Date(2019, 6, 19, 15, 1, 1),
                                    y: 1270
                                }],
                                label: "Battery Voltage",
                                borderColor: "#3e95cd",
                                fill: false
                            }
                            ]
                        },
                        options: {
                            title: {
                                display: true,
                                text: 'SHS Voltage Data'
                            }
                        }
                    });
                </script>
            </div>
            <div class="graph" id="powgraph">
                <canvas id="powgraphcanvas" width="auto" height="auto"></canvas>
            </div>
        </div>
        <div id="lowerinfo">
            <div id="deviceinfo">
                <div class="deviceinfotags" id="head">
                    <p>DEVICE INFO</p>
                    <hr class="devicebar">
                </div>
                <div class="deviceinfotags" id="imei">
                    <p class="devicetext">IMEI: 123456789</p>
                </div>
                <div class="deviceinfotags" id="di">
                    <p class="devicetext">Lat: 1234 Lng: 6789</p>
                </div>
                <div class="deviceinfotags" id="latlng">
                    <p class="devicetext">Pending Command: Shutdown</p>
                </div>
                <div class="deviceinfotags" id="pendingcmd">
                    <p class="devicetext">Time Until Command: 3hr 5min</p>
                </div>
                <div class="deviceinfotags" id="commandtext">
                    <label for="commands" class="devicetext" id="commandt">Issue: </label>
                    <select id="commands">
                        <option value="" disabled selected>Command</option>
                        <option value="Shutdown">Shutdown</option>
                    </select>
                    <button id="issue">Send</button>
                </div>
            </div>
            <div id="mappane">
                <img id="map" src="images/map.png"/>
            </div>
        </div>
    </div>
</div>
</body>
</html>
