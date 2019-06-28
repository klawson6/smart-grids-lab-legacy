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

    <!--    <script src="js/Chart.js"></script>-->
    <!--    <link href="css/Chart.css" rel="stylesheet" type="text/css">-->
    <!--    <script src="js/moment.js"></script>-->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.7.3/Chart.min.js"></script>
    <script src="js/jquery-3.4.1.js"></script>
    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBlQsPmRWWEbCLqHpdoseu58mWjODqeIaQ" async
            defer></script>
    <script src="Home.js"></script>

</head>
<body>
<div id="toppane">
    <!--    Logo    Admin Dashboard     Log off-->
    <div id="logodiv">
        <a href="home.php">
            <img class="titleicon" id="sglicon" src="images/sgl.png"/>
        </a>
    </div>
    ADMIN DASHBOARD
    <div id="officondiv">
        <a href="logout.php">
            <img class="titleicon" id="officon" src="images/officon.png"/>
        </a>
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
        <div class="menutags" id="reporttag">
            <p class="menutext">Individual Reports</p>
        </div>
        <div class="menutags" id="addtag">
            <p class="menutext">Add New SGL Monitor</p>
        </div>
        <div class="menutags" id="menuoff">
            <hr class="menubar">
            <a href="logout.php" style="color: rgb(255,255,255)">
                <p class="menutext">Logout</p>
            </a>
        </div>
    </div>
    <div class="infoPane" id="browseDiv">
        <div id="graphpane">
            <div class="graph" id="volgraph">
                <canvas id="volgraphcanvas"></canvas>
            </div>
            <div class="graph" id="powgraph">
                <canvas id="powgraphcanvas"></canvas>
            </div>
        </div>
        <div id="lowerinfo">
            <div id="deviceinfo">
                <div class="deviceinfotags" id="head">
                    <p>DEVICE INFO</p>
                    <hr class="devicebar">
                </div>
                <div class="deviceinfotags">
                    <p class="devicetext" id="imei"></p>
                </div>
                <div class="deviceinfotags">
                    <p class="devicetext" id="latlng">Select an installed monitor on the map.</p>
                </div>
                <div class="deviceinfotags">
                    <p class="devicetext" id="pendingcmd"></p>
                </div>
                <div class="deviceinfotags">
                    <p class="devicetext" id="tuc"></p>
                </div>
                <div class="deviceinfotags hiddenInfo" id="commandtext" hidden>
                    <label for="commands" class="devicetext" id="commandt">Issue: </label>
                    <select id="commands">
                        <option value="" disabled selected>Command</option>
                        <!--                        TODO fill with all commands-->
                        <option value="Disconnect">Disconnect From Network</option>
                        <option value="BlockImport">Disable Power Import</option>
                    </select>
                    <button class="infoButton" id="issue">Send</button>
                </div>
                <div class="hiddenInfo" hidden>
                    <button class="infoButton" id="viewReport">View Full Report</button>
                </div>
            </div>
            <div id="mappane">
            </div>
        </div>
    </div>
    <div class="infoPane" id="reportDiv" style="display:none">
        <div class="reportTile" id="deviceList">
            <div id="formDiv">
                <input type="text" name="imei" placeholder="IMEI" id="imeiField">
                <div id="imeiSearch">
                    <input type="image" src="images/search.png" alt=" " id="searchIcon">
                </div>
            </div>
            <div id="listDiv">
                <div id="listHead">
                    <p>DEVICE IMEI NUMBERS</p>
                    <hr class="devicebar">
                </div>
            </div>
        </div>
        <div class="reportTile" id="reportGraphs">
            <div id="filterDiv">
                <label for="time" id="filterText">Show recordings from the last: </label>
                <input type="text" name="time" placeholder="" id="timeField">
                <select id="units">
                    <option value="" disabled selected>Unit</option>
                    <option value="Days">Days</option>
                    <option value="Hours">Hours</option>
                    <option value="Minutes">Minutes</option>
                    <option value="Seconds">Seconds</option>
                </select>
                <div id="filterSearch">
                    <input type="image" src="images/time.png" alt=" " id="searchIcon">
                </div>
            </div>
            <div class="reportGraph" id="bvGraph">
                <canvas class="reportGraphCanvas" id="bvGraphCanvas"></canvas>
            </div>
            <div class="reportGraph" id="piGraph">
                <canvas class="reportGraphCanvas" id="piGraphCanvas"></canvas>
            </div>
            <div class="reportGraph" id="pxGraph">
                <canvas class="reportGraphCanvas" id="pxGraphCanvas"></canvas>
            </div>
            <div class="reportGraph" id="dvGraph">
                <canvas class="reportGraphCanvas" id="dvGraphCanvas"></canvas>
            </div>
            <div class="reportGraph" id="lbGraph">
                <canvas class="reportGraphCanvas" id="lbGraphCanvas"></canvas>
            </div>
            <div id="filterDivEnergy">
                <label for="time" id="filterTextEnergy">Show energy exchange for the last: </label>
                <input type="text" name="time" placeholder="" id="timeFieldEnergy">
                <select id="unitsEnergy">
                    <option value="" disabled selected>Unit</option>
                    <option value="Days">Days</option>
                    <option value="Hours">Hours</option>
                    <option value="Minutes">Minutes</option>
                    <option value="Seconds">Seconds</option>
                </select>
                <div id="filterSearchEnergy">
                    <input type="image" src="images/time.png" alt=" " id="searchIconEnergy">
                </div>
            </div>
            <div class="reportGraph" id="powerGraph">
                <canvas class="reportGraphCanvas" id="powerGraphCanvas"></canvas>
            </div>
        </div>
    </div>
</div>
</div>
</body>
</html>
