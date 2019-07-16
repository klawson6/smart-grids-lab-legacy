<?php
/**
 * Created by IntelliJ IDEA.
 * User: kylelawson
 * Date: 6/18/19
 * Time: 10:23 AM
 */
session_start(); // Start a session storage. Variables stored on the clients machine, can be used to check log in details
session_destroy(); // Reset the session to wipe log in info, to prepare for a new log in
// Redirect to the login page:
header('Location: index.php');
?>