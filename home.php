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
        <img class="titleicon" src="images/sgl.png"/>
    </div>
    <div id="title">
        <span id="titletext">
            ADMIN DASHBOARD
        </span>
    </div>
    <div id="officondiv">
        <img class="titleicon" id="officon" src="images/officon.png"/>
    </div>
</div>
<div id="mainpane">
<!--    <img class="titleicon" src="images/map.png"/>-->
</div>

</body>
</html>
