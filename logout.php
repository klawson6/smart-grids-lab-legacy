<?php
/**
 * Created by IntelliJ IDEA.
 * User: kylelawson
 * Date: 6/18/19
 * Time: 10:23 AM
 */
session_start();
session_destroy();
// Redirect to the login page:
header('Location: index.php');
?>