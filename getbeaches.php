<?php

include 'config.php';
include 'opendb.php';

//select database records
$sql = "SELECT * FROM SYS_BEACHES";
$result = mysqli_query($dbConnection, $sql);

$encode = array();
while($row = mysqli_fetch_assoc($result)) {
	if ($row["WEB_ENABLED"]) {
		$encode[] = $row;
	}
}

echo json_encode($encode);

mysqli_close($dbConnection);
?> 