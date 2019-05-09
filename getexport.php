<?php
//include config

include 'config.php';
include 'opendb.php';

function IsDate($date, $format = 'Y-m-d')
{
    $d = DateTime::createFromFormat($format, $date);
    return $d && $d->format($format) == $date;
}

$queryDate = htmlspecialchars($_GET['queryDate']);
$USGSID = htmlspecialchars($_GET['USGSID']);
//echo $queryDate;

if (IsDate($queryDate) && is_numeric($USGSID)) {
   //select database records
   $sql = "SELECT * FROM PB_EXPORT WHERE DATE = '" . $queryDate . "' AND USGS_ID = '" . $USGSID . "'";
   $result = mysqli_query($dbConnection, $sql);

   $encode = array();
   while($row = mysqli_fetch_assoc($result)) {
       $encode[] = $row;
   }

   echo json_encode($encode);
 
   mysqli_close($dbConnection);
}
?> 