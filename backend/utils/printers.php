<?php
function printHeader() {
	echo "<div id=\"header\"><a href=\"/\" id=\"home-button\"><span id=\"left-tomato\">TOMATO</span><span id=\"right-tomato\"> TOMATO</span></a>";
	echo "<nav id=\"nav-bar\">
		 <a href=\"/createrecipe/\">Create Recipe</a>";
	// The session is started at the top of each page, before any output
	if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['user_id'])) {
		echo "<a href=\"/backend/auth/logout.php\">Log Out</a>";
	}
	echo "</nav></div>";
}