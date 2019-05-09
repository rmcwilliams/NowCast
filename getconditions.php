<?php
include 'config.php';
include 'opendb.php';

function IsDate($date, $format = 'Y-m-d')
{
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) == $date;
}

$queryDate = htmlspecialchars($_GET['queryDate']);
//echo $queryDate;
$theTimeFrame = htmlspecialchars($_GET['timeFrame']);
 
 if ($theTimeFrame == "7days") {
	$Time = "1 WEEK";
 } else if ($theTimeFrame == "season") {
	$now = new DateTime($queryDate);
	$currentYear = $now->format('Y');
	$firstDayOfYear = new DateTime($currentYear . '-01-01');
	$diff = $now->diff($firstDayOfYear);
	$daysSinceBeginningOfYear = $diff->format('%a DAY');
	$Time = $daysSinceBeginningOfYear;
 } else {
	$Time = "1 WEEK";
 }
if (IsDate($queryDate)) {
   //select database records
   $sql = "SELECT * FROM PB_CONDITIONS WHERE DATE BETWEEN DATE_SUB('" . $queryDate . "', INTERVAL " . $Time . ") AND '" . $queryDate . "'";
   $result = mysqli_query($dbConnection, $sql);

   $encode = array();
   while($row = mysqli_fetch_assoc($result)) {
       $encode[] = $row;
   }

   echo json_encode($encode);
 
   mysqli_close($dbConnection);
}
?> 