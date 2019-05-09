<?php
if (isset($_POST['submit'])) {
	if (!isset($_POST['manager']) || empty($_POST['manager']) || !isset($_POST['state'])
	|| empty($_POST['state']) || !isset($_POST['county']) || empty($_POST['county']) ||
	!isset($_POST['siteName']) || empty($_POST['siteName']) || !isset($_POST['siteAddress'])
	|| empty($_POST['siteAddress']) || !isset($_POST['contact']) || empty($_POST['contact'])
	|| !isset($_POST['email']) || empty($_POST['email']) || !isset($_POST['phone']) ||
	empty($_POST['phone'])) {
		echo '<h1>Please fill in all required fields.</h1>'; // add exit(0)?
	} else {
		$to = 'rmcwilliams@usgs.gov, amgbrady@usgs.gov, marsmith@usgs.gov, bhayhurs@usgs.gov, tsiskin@usgs.gov';
		$subject = 'New site request';

		$headers = "From: noreply@ny.water.usgs.gov/maps/nowcast\r\n";
		$headers .= 'MIME-Version: 1.0' . "\r\n";
		$headers .= 'Content-type:text/html;charset=UTF-8';
		// construct message to email
		$message = '<!DOCTYPE html>
					<html>
					<head>
					<style>
					table {
						font-family: arial, sans-serif;
						border-collapse: collapse;
						width: 100%;
					}

					td, th {
						border: 1px solid #dddddd;
						text-align: left;
						padding: 8px;
					}

					tr:nth-child(even) {
						background-color: #dddddd;
					}
					</style>
					</head>
					<body>';
		$message .= '<h4>Contact Information:</h4>';
		$message .= '<hr>';
		$message .= '<table>';
		$message .= '<tr><td><b>Site Manager:</b></td><td>' . htmlspecialchars($_POST['manager']) . '</td></tr>';
		$message .= '<tr><td><b>State:</b></td><td>' . htmlspecialchars($_POST['state']) . '</td></tr>';
		$message .= '<tr><td><b>County:</b></td><td>' . htmlspecialchars($_POST['county']) . '</td></tr>';
		$message .= '<tr><td><b>Site Name:</b></td><td>' . htmlspecialchars($_POST['siteName']) . '</td></tr>';
		$message .= '<tr><td><b>Site Address:</b></td><td>' . htmlspecialchars($_POST['siteAddress']) . '</td></tr>';
		$message .= '<tr><td><b>Contact Name:</b></td><td>' . htmlspecialchars($_POST['contact']) . '</td></tr>';
		$message .= '<tr><td><b>Email:</b></td><td>' . htmlspecialchars($_POST['email']) . '</td></tr>';
		$message .= '<tr><td><b>Phone Number:</b></td><td>' . htmlspecialchars($_POST['phone']) . '</td></tr>';
		$message .= '<tr><td><b>Website:</b></td><td>' . htmlspecialchars($_POST['website']) . '</td></tr>';
		$message .= '</table>';
		$message .= '<h4>Site Information and Data Availability:</h4>';
		$message .= '<hr>';
		$message .= '<table>';
		$message .= '<tr><td><b>Latitude:</b></td><td>' . htmlspecialchars($_POST['latitude']) . '</td></tr>';
		$message .= '<tr><td><b>Longitude:</b></td><td>' . htmlspecialchars($_POST['longitude']) . '</td></tr>';
		$message .= '<tr><td><b>Google KMZ file name:</b></td><td>' . htmlspecialchars($_POST['KMZ']) . '</td></tr>';
		$message .= '<tr><td><b>Body of Water:</b></td><td>' . htmlspecialchars($_POST['bodyOfWater']) . '</td></tr>';
		$message .= '<tr><td><b>Years of Data Available:</b></td><td> ' . htmlspecialchars($_POST['yrsDataAvail']) . '</td></tr>';
		$message .= '<tr><td><b>Types of sampling:</b></td>';
		$sampling = implode(", ", $_POST['sampling']); // make sure this is secure
		$message .= '<td>' . htmlspecialchars($sampling) . '</td></tr>';
		$message .= '<tr><td><b>Other:</b></td><td>' . htmlspecialchars($_POST['otherSampling']) . '</td></tr>';
		$message .= '<tr><td><b>Number of Days Sampled for E. coli and (or) HABs During Recreational Periods:</b></td><td>' . htmlspecialchars($_POST['numDaysSamples']) . '</td></tr>';
		$message .= '<tr><td><b>Data:</b></td>';
		$data = implode(", ", $_POST['data']);
		$message .= '<td>' . htmlspecialchars($data) . '</td></tr>';
		$message .= '<tr><td><b>Other physical parameters:</b></td><td>' . htmlspecialchars($_POST['otherPhysParam']) . '</td></tr>';
		$message .= '<tr><td><b>Tributary Influences:</b></td><td>' . htmlspecialchars($_POST['tribInfluences']) . '</td></tr>';
		$message .= '<tr><td><b>Tributary Data:</b></td>';
		$tribData = implode(", ", $_POST['tribData']);
		$message .= '<td>' . htmlspecialchars($tribData) . '</td></tr>';
		$message .= '<tr><td><b>Other physical parameters:</b></td><td>' . htmlspecialchars($_POST['tribOtherPhysParam']) . '</td></tr>';
		$message .= '<tr><td><b>On-site Weather Station?:</b></td>';
		if (isset($_POST['weatherStation'])) {
			$message .= '<td>' . htmlspecialchars($_POST['weatherStation']) . '</td></tr>';
		} else {
			$message .= '<td>[user did not select yes or no]</td></tr>';
		}
		$message .= '<tr><td><b>On-site Buoy Station?:</b></td>';
		if (isset($_POST['buoyStation'])) {
			$message .= '<td>' . htmlspecialchars($_POST['buoyStation']) . '</td></tr>';
		} else {
			$message .= '<td>[user did not select yes or no]</td></tr>';
		}
		$message .= '<tr><td><b>Nearest NWS Airport:</b></td><td>' . htmlspecialchars($_POST['nearestAirport']) . '</td></tr>';
		$message .= '<tr><td><b>Lake Levels Station Name:</b></td><td>' . htmlspecialchars($_POST['lakeLvlStnName']) . '</td></tr>';
		$message .= '<tr><td><b>Station Number:</b></td><td>' . htmlspecialchars($_POST['stationNumber']) . '</td></tr>';
		$message .= '<tr><td><b>Site Camera URL:</b></td><td>' . htmlspecialchars($_POST['siteCameraURL']) . '</td></tr>';
		$message .= '</table>';
		$message .= '<h4>Site Modeling Information, If Applicable</h4>';
		$message .= '<hr>';
		$message .= '<table>';
		$message .= '<tr><td><b>Site Persistence Percentage(Correct):</b></td><td>' . htmlspecialchars($_POST['sitePersisPerc']) . '</td></tr>';
		$message .= '<tr><td><b>Has a Model been Implemented at this location? (if yes, background info in notes):</b></td>';
		if (isset($_POST['modelImplemented'])) {
			$message .= '<td>' . htmlspecialchars($_POST['modelImplemented']) . '</td></tr>';
		} else {
			$message .= '<td>[user did not select yes or no]</td></tr>';
		}
		$message .= '<tr><td><b>What is the Site Model Percentage(Correct)?:</b></td><td>' . htmlspecialchars($_POST['siteModPerc']) . '</td></tr>';
		$message .= '<tr><td><b>Have you used Virtual Beach Version 3?:</b></td>';
		if (isset($_POST['virtualBeach'])) {
			$message .= '<td>' . htmlspecialchars($_POST['virtualBeach']) . '</td></tr>';
		} else {
			$message .= '<td>[user did not select yes or no]</td></tr>';
		}
		$message .= '<tr><td><b>Virtual Beach Orientation at Site:</b></td><td>' . htmlspecialchars($_POST['virtBeachOrient']) . '</td></tr>';
		$message .= '<tr><td><b>How Many Years has this Site been Using Virtual Beach?:</b></td><td>' . htmlspecialchars($_POST['yrsUsingVirtBeach']) . '</td></tr>';
		$message .= '</table>';
		$message .= '<h4>Site NowCast Assistance</h4>';
		$message .= '<hr>';
		$message .= '<table>';
		$message .= '<tr><td><b>Tier selected:</b></td><td>' . htmlspecialchars($_POST['tier']) . '</td></tr>';
		$message .= '</table>';
		$message .= '<hr>';
		$message .= '<table>';
		$message .= '<tr><td><b>Notes:</b></td><td>' . htmlspecialchars($_POST['notes']) . '</td></tr>';
		$message .= '</table>';
		$message .= '</body></html>';

		$success = mail($to, $subject, $message, $headers);
		if ($success) {
			echo '<h1>Thank you, we will get back to you soon. click <a href="./">here</a> to go back to NowCast.</h1>';
		} else {
			echo "<h1>There was an error, the email couldn't be sent.</h1>";
		}
	}
} else {
	header('location: AddSite.php');
	exit(0);
}
?>