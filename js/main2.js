var map;
var markers;
var markerArray;
var zoomFlag = false;
var theChosenState;
var panToPoint = true;
var PASelected = false;
var URLparams = {};
var timeFrame = "7days";
var currentOpenSite;
var changedTimePeriod = false;
var queryDateGlobal;
var siteArray;
var secondClickButton = false;
var beforeChangeTimePeriod = true;
var firstTimeClickButton = true;

//main document ready function
$(document).ready(function () {
	//$('#popupModal').modal('show');
	$("#changingTabs").html("<div class='alert alert-warning'>Please select a state first.</div>");
	//initialize basemap
	var ESRIOceanBasemap = L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}", {
		attribution: 'Copyright: &copy; 2013 Esri, DeLorme, NAVTEQ'
	});
	var ESRIOceanReference = L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}", {
		attribution: 'Copyright: &copy; 2013 Esri, DeLorme, NAVTEQ'
	});

	//initialize map
	map = new L.Map('map', {
		center: new L.LatLng(42.75, -75.5),
		zoom: 7,
		layers: [ESRIOceanBasemap, ESRIOceanReference],
		attributionControl: false,
		zoomControl: false

	});

	markers = new L.FeatureGroup();
	map.addLayer(markers);
	var params = {};
	URLparams = getAllUrlParams();
	processURLparams();
	//call initial function to get site list
	//getSites();

	//listener for date query
	$('#dateQueryButton').on('click', function () {
		dateQueryButtonFunction();
	});

	$('#showPieChart').on('click', function () {
		showPieChartFunction();
	});

	//setup datepicker dates
	var startDate = new Date("2014-01-01T00:00:00");
	var today = new Date();
	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);;

	//instantiate
	$('.datepicker').datepicker({
		format: 'yyyy-mm-dd',
		autoclose: true,
		todayHighlight: true,
		startDate: startDate,
		endDate: today
	})

	//set datepicker date to yesterday so it has a value
	$(".datepicker").datepicker("update", yesterday);

	$("#legendButton").click(function () {
		legendButtonFunction();
	});

	$('#stateDropdownSelect').on('changed.bs.select', function (e) {
		stateDropdownSelectFunction(e);
	});

	$('#chooseTimeFrame').on('changed.bs.select', function (e) {
		chooseTimeFrameFunction(e);
	});
	//marker click override listener
	markers.on('click', onMarkerClick);

	/*map.on('click', function(e) {
		alert("Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng)
	});*/

	//end document ready function
});

function chooseTimeFrameFunction(e) {
	$("#showPieChart").hide();
	beforeChangeTimePeriod = false;
	changedTimePeriod = true;
	timeFrame = $(e.target).find('option:selected').attr('value');

	//Put in own function (ajax stuff)
	$.ajax({
		type: "GET",
		url: "getconditions2.php",
		//data: "queryDate=" + queryValue,
		data: { 'State': theChosenState, 'queryDate': queryDateGlobal, 'timeFrame': timeFrame },
		success: function (data) {
			var curConditionWithEcoliArray = [];
			//parse out conditions to json
			var conditionsArray = $.parseJSON(data);
			if (!$.isEmptyObject(conditionsArray)) {
				//sort the array by date, descending
				conditionsArray.sort(function (a, b) {
					a = new Date(a.DATE);
					b = new Date(b.DATE);
					//return a>b ? -1 : a<b ? 1 : 0;
					return b - a;
				});
				$("#recentConditionsTable").find("tr:gt(0)").remove();

				var totalCount = 0;
				var CorrectExceed = 0;
				var CorrectNonExceed = 0;
				var FalseExceed = 0;
				var FalseNonExceed = 0;

				var prevDayCorrectExceed = 0;
				var prevDayCorrectNonExceed = 0;
				var prevDayFalseExceed = 0;
				var prevDayFalseNonExceed = 0;

				$.each(conditionsArray, function (i, curCondition) {
					if (curCondition.BEACH_NAME == currentOpenSite) {
						totalCount++;
						if (curCondition.ERROR_TYPE == "Correct Exceed") {
							CorrectExceed++;
						}
						if (curCondition.ERROR_TYPE == "Correct Non-Exceed") {
							CorrectNonExceed++;
						}
						if (curCondition.ERROR_TYPE == "False Exceed") {
							FalseExceed++;
						}
						if (curCondition.ERROR_TYPE == "False Non-Exceed") {
							FalseNonExceed++;
						}



						$('#recentConditionsTable').append('<tr><td>' + curCondition.DATE + '</td><td>' + curCondition.LAB_ECOLI + '</td><td>' + curCondition.NOWCAST_ECOLI + '</td><td>' + curCondition.NOWCAST_PROBABILITY + '</td><td>' + curCondition.ERROR_TYPE + '</td><td>' + curCondition.BEACH_CONDITIONS + '</td></tr>');
						if (curCondition.LAB_ECOLI) {
							curConditionWithEcoliArray.push(curCondition);
						}
					}
				});



				if (!$.isEmptyObject(curConditionWithEcoliArray)) {
					$.each(curConditionWithEcoliArray, function (i, curConditionWithEcoliCalculations) {
						if (i < curConditionWithEcoliArray.length - 1) {

							//curCondition.YESTERDAYCHECK = curCondition.LAB_ECOLI - currentSiteConditionsArray[i+1].LAB_ECOLI
							if (curConditionWithEcoliCalculations.LAB_ECOLI >= 235 && curConditionWithEcoliArray[i + 1].LAB_ECOLI >= 235) {
								prevDayCorrectExceed++;
							}
							if (curConditionWithEcoliCalculations.LAB_ECOLI < 235 && curConditionWithEcoliArray[i + 1].LAB_ECOLI < 235) {
								prevDayCorrectNonExceed++;
							}
							if (curConditionWithEcoliCalculations.LAB_ECOLI < 235 && curConditionWithEcoliArray[i + 1].LAB_ECOLI >= 235) {
								prevDayFalseExceed++;
							}
							if (curConditionWithEcoliCalculations.LAB_ECOLI >= 235 && curConditionWithEcoliArray[i + 1].LAB_ECOLI < 235) {
								prevDayFalseNonExceed++;
							}
						}
					});
				}

				var addedErrorTypes = CorrectExceed + CorrectNonExceed + FalseExceed + FalseNonExceed;
				var addedPrevDayErrorTypes = prevDayCorrectExceed + prevDayCorrectNonExceed + prevDayFalseExceed + prevDayFalseNonExceed;
				if (timeFrame !== "7days") {
					if (addedErrorTypes / totalCount >= 0.5 && addedPrevDayErrorTypes / totalCount >= 0.5) {

						//first pie chart (Nowcast's accuracy)
						google.charts.load('current', { 'packages': ['corechart'] });
						google.charts.setOnLoadCallback(drawChartNowcastAccuracy);
						function drawChartNowcastAccuracy() {

							var data = google.visualization.arrayToDataTable([
								['', ''],
								['Correct Exceed', CorrectExceed],
								['Correct Non-Exceed', CorrectNonExceed],
								['False Exceed', FalseExceed],
								['False Non-Exceed', FalseNonExceed],
								['', 0]
							]);

							var options = {
								'title': 'Nowcast Error Types ' + currentOpenSite + ' (Click for stats)',
								'width': '100%',
								'height': '100%',
								'chartArea': { 'width': '100%', 'height': '80%' },
								'legend': { 'position': 'none' }
							};

							var chart = new google.visualization.PieChart(document.getElementById('piechart'));

							chart.draw(data, options);


						}
						//second pie chart (persistence model)
						google.charts.load('current', { 'packages': ['corechart'] });
						google.charts.setOnLoadCallback(drawChartPersistenceModel);
						function drawChartPersistenceModel() {

							var data = google.visualization.arrayToDataTable([
								['', ''],
								['Correct Exceed', prevDayCorrectExceed],
								['Correct Non-Exceed', prevDayCorrectNonExceed],
								['False Exceed', prevDayFalseExceed],
								['False Non-Exceed', prevDayFalseNonExceed],
								['', 0]
							]);

							var options = {
								'title': 'Persistence Model Error Types ' + currentOpenSite + ' (Click for stats)',
								'width': '100%',
								'height': '100%',
								'chartArea': { 'width': '100%', 'height': '80%' },
								'legend': { 'position': 'none' }
							};

							var chart = new google.visualization.PieChart(document.getElementById('piechart2'));

							chart.draw(data, options);
						}
					} else {
						//$('#piechart, #piechart2selector').hide(); //see if need
						$('#piechart').html("<div class='alert alert-warning'><strong>Error:</strong> This site does not have enough data entered to generate pie charts.</div>");
						$('#piechart2').html("");
					}
				} else {
					//$('#piechart, #piechart2selector').hide(); //see if need
					$('#piechart').html('<div class="alert alert-warning"><strong>Error:</strong> You must select "Whole season" from dropdown to see pie charts.</div>');
					$('#piechart2').html("");
				}


			}
			$("#showPieChart").show();
		}

	});
	changedTimePeriod = false;
}

function stateDropdownSelectFunction(e) {
	theChosenState = $(e.target).find('option:selected').attr('value');
	if (theChosenState == "OH") {
		$("#changingTabs").load(encodeURI('ohiotabs.html'));
	} else {
		$("#changingTabs").load(encodeURI('NY&PAtabs.html'));
	}

	if (theChosenState == "PA") {
		PASelected = true;
		theChosenState = "OH";
	} else {
		PASelected = false;
	}
	markers.clearLayers();
	zoomFlag = false;
	getSites();
}

function legendButtonFunction() {
	$("#legend").toggle();
	map.invalidateSize();
	return false;
}

function showPieChartFunction() {
	if (!beforeChangeTimePeriod || !firstTimeClickButton) {
		if (!secondClickButton) {
			$('#showPieChart').html("Back to recent conditions");
			$('#recentConditionsTable, #timeFrameDropDownHide').hide();
			$('#piechart, #piechart2').show();
			secondClickButton = true;
		} else {
			$('#showPieChart').html("Nowcast's Accuracy");
			$('#recentConditionsTable, #timeFrameDropDownHide').show();
			$('#piechart, #piechart2').hide();
			secondClickButton = false;
		}
	} else {
		$('#piechart').html('<div class="alert alert-warning"><strong>Error:</strong> You must select "Whole season" from dropdown to see pie charts.</div>');
		$('#showPieChart').html("Back to recent conditions");
		$('#recentConditionsTable, #timeFrameDropDownHide').hide();
		$('#piechart, #piechart2').show();
		firstTimeClickButton = false;
		secondClickButton = true;
	}
}

function dateQueryButtonFunction() {
	var $btn = $('#dateQueryButton').button('loading');
	var query = $('.datepicker').attr('value');
	querySites(query, $btn);
}

function processURLparams() {
	if (URLparams.state && URLparams.lat && URLparams.lng && URLparams.zoom) {
		theChosenState = URLparams.state.toUpperCase();
		if (theChosenState == "PA") {
			PASelected = true;
			theChosenState = "OH";
		} else {
			PASelected = false;
		}
		map.setView([URLparams.lat, URLparams.lng], URLparams.zoom)
		zoomFlag = true;
		map.dragging.disable();
		map.touchZoom.disable();
		map.doubleClickZoom.disable();
		map.scrollWheelZoom.disable();
		map.boxZoom.disable();
		map.keyboard.disable();
		if (map.tap) map.tap.disable();
		document.getElementById('map').style.cursor = 'default';
		panToPoint = false;

		$("#sitelink").html("<a href='https://ny.water.usgs.gov/maps/nowcast/' style='text-decoration: none;color:red;'>Powered by <font color='black'>Nowcast Beach Status</font>. Click here to see the full map of beaches.</a>");
		$("#usgsfooter, #aboutModal, #legend, #topnav").remove();
		$("#body").css("padding-top", "0px");
		$("html, body, #map").css({ "height": "-webkit-calc(100% - 8px)", "height": "-moz-calc(100% - 8px)", "height": "calc(100% - 8px)" });

		getSites();
	} else if (URLparams.state) {
		theChosenState = URLparams.state.toUpperCase();
		$('#stateDropdownSelect').prop('title', '<font color="#333">' + theChosenState + '</font>');
		if (theChosenState == "OH") {
			$("#changingTabs").load(encodeURI('ohiotabs.html'));
		} else {
			$("#changingTabs").load(encodeURI('NY&PAtabs.html'));
		}
		if (theChosenState == "PA") {
			PASelected = true;
			theChosenState = "OH";
		} else {
			PASelected = false;
		}
		getSites();
	} else {
		$('#selectStatetoBegin').modal('show');
	}
}

function getAllUrlParams() {
	// get query string from url (optional) or window
	var queryString = window.location.search.slice(1);

	// we'll store the parameters here
	var obj = {};

	// if query string exists
	if (queryString) {

		// stuff after # is not part of query string, so get rid of it
		queryString = queryString.split('#')[0];

		// split our query string into its component parts
		var arr = queryString.split('&');

		for (var i = 0; i < arr.length; i++) {
			// separate the keys and the values
			var a = arr[i].split('=');

			// in case params look like: list[]=thing1&list[]=thing2
			var paramNum = undefined;
			var paramName = a[0].replace(/\[\d*\]/, function (v) {
				paramNum = v.slice(1, -1);
				return '';
			});

			// set parameter value (use 'true' if empty)
			var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];

			// (optional) keep case consistent
			paramName = paramName.toLowerCase();
			paramValue = paramValue.toLowerCase();

			// if parameter name already exists
			if (obj[paramName]) {
				// convert value to array (if still string)
				if (typeof obj[paramName] === 'string') {
					obj[paramName] = [obj[paramName]];
				}
				// if no array index number specified...
				if (typeof paramNum === 'undefined') {
					// put the value on the end of the array
					obj[paramName].push(paramValue);
				}
				// if array index number specified...
				else {
					// put the value at that index number
					obj[paramName][paramNum] = paramValue;
				}
			}
			// if param name doesn't exist yet, set it
			else {
				obj[paramName] = paramValue;
			}
		}
	}
	return obj;
	// return obj;
}

function on() {
	document.getElementById("overlay").style.display = "block";
}

function off() {
	document.getElementById("overlay").style.display = "none";
}

function displayMapAt(lat, lon, zoom) {
	$("#gmap").html(
		"<iframe id=\"map_frame\" "
		+ "width=\"100%\" height=\"200px\" frameborder=\"0\" scrolling=\"no\" marginheight=\"0\" marginwidth=\"0\" "
		+ "src=\"https://www.google.com/maps?f=q&amp;output=embed&amp;source=s_q&amp;hl=en&amp;geocode=&amp;q="
		+ lat + "," + lon
		+ "&amp;aq=&amp;sll=48.669026,19.699024&amp;sspn=4.418559,10.821533&amp;ie=UTF8&amp;ll="
		+ lat + "," + lon
		+ "&amp;spn=0.199154,0.399727&amp;t=m&amp;z="
		+ zoom + "\"" + "></iframe>");
}

function onMarkerClick(e) {
	$('#chooseTimeFrame>option:eq(1)').prop('selected', true);
	//$('li[data-original-index="1"]').addClass( "selected" );
	$('#chooseTimeFrame').selectpicker('refresh');
	$("#chooseTimeFrame").change();
	firstTimeClickButton = true;
	beforeChangeTimePeriod = true;
	secondClickButton = false;
	$('#showPieChart').html("Nowcast's Accuracy");
	$('#timeFrameDropDownHide').show();
	//$('#recentConditionsTable').empty(); //don't need pretty sure
	$('#recentConditionsTable').show();
	$('#piechart, #piechart2').hide(); //why does this work and not .html("") thing below?
	//$('#piechart, #piechart2').html("");
	currentOpenSite = e.layer.options.siteData.BEACH_NAME;

	if (panToPoint) {
		map.panTo(e.latlng);
	}
	console.log("Marker clicked", e.layer.options.siteData.currentConditions.BEACH_CONDITIONS, setPopupColor(e.layer.options.siteData.currentConditions.BEACH_CONDITIONS), e.layer.options.siteData);


	if (e.layer.options.siteData.STATE == "OH" || e.layer.options.siteData.STATE == "PA") {
		$('#3rdTab').html('<a href="#tab3" data-toggle="tab"><i class="fa fa-info-circle"></i>&nbsp;&nbsp;<span class="beachName"></span> Details</a>');
		//$('#3rdTab').html('<li role="presentation"><a href="#tab3" data-toggle="tab"><i class="fa fa-info-circle"></i>&nbsp;&nbsp;<span class="beachName"></span> Details</a></li>');
		$('#beachDetails').load(encodeURI('details/' + e.layer.options.siteData.BEACH_NAME + '.html'));
	} else {
		$('#3rdTab').empty();
		$('#beachDetails').empty();
	}

	//update modal template with actual site data
	$('.beachName').html(e.layer.options.siteData.BEACH_NAME);




	//check if we have today's date
	if (e.layer.options.siteData.currentConditions.DATE == moment().format('YYYY-MM-DD')) {
		//show badge indicating current day
		$('#conditionsDate').html(e.layer.options.siteData.currentConditions.DATE + '&nbsp;&nbsp;<span class="badge">Today</span>');
	}
	else {
		//otherwise just show date
		$('#conditionsDate').html(e.layer.options.siteData.currentConditions.DATE);
	}

	//set out of season beach conditions in marker popup
	if (e.layer.options.siteData.WEB_ENABLED == 2) {
		$('#beachConditionBar').attr('style', 'padding:3px;color:white;background-color:#d3d3d3');
		$('#beachCondition').html('Off-Season&nbsp;&nbsp;<i data-toggle="popover" data-content="Generally, the recreational season is Memorial Day to Labor Day" class="fa fa-info-circle fa-lg"></i>');
	}
	else {
		//set beach conditions in marker popup
		$('#beachConditionBar').attr('style', 'padding:3px;color:white;background-color:' + setPopupColor(e.layer.options.siteData.currentConditions.BEACH_CONDITIONS));
		$('#beachCondition').html(e.layer.options.siteData.currentConditions.BEACH_CONDITIONS + '&nbsp;&nbsp;<i  data-toggle="popover" data-content="' + setConditionPopup(e.layer.options.siteData.currentConditions.BEACH_CONDITIONS) + '" class="fa fa-info-circle fa-lg"></i>&nbsp;&nbsp;' + e.layer.options.siteData.currentConditions.BEACH_REASON);
	}
	if (e.layer.options.siteData.STATE == "OH") {
		$('#beachguard').html("<p>&nbsp;&nbsp;Additional water-quality information may be available at <a href='https://publicapps.odh.ohio.gov/BeachGuardPublic/Default.aspx' target='_blank'>BeachGuard</a> operated by Ohio Department of Health.</p>");
	} else {
		$('#beachguard').empty()
	}

	//show lake temp
	$('#lakeTemp').html(e.layer.options.siteData.currentConditions.LAKE_TEMP_F);

	//show map and directions
	displayMapAt(e.layer.options.siteData.LATITUDE, e.layer.options.siteData.LONGITUDE, 12)
	$('#directions').attr('href', 'https://maps.google.com/maps?q=' + e.layer.options.siteData.LATITUDE + ',' + e.layer.options.siteData.LONGITUDE);

	//update recent conditions table with a fresh header row
	$('#recentConditionsTable').html('<tr><th>Date</th><th>E.coli (CFU/100mL)</th><th>Estimated E.coli (CFU/100mL)&nbsp;&nbsp;<i data-toggle="popover" data-content="The model estimated value provides a quantitative prediction of E.coli concentration." class="fa fa-info-circle fa-lg"></i> </th><th>Probability of Exceeding&nbsp;&nbsp;<i data-toggle="popover" data-content="The probability of exceeding provides a percentage that the state standard of 235 colony forming units will be surpassed." class="fa fa-info-circle fa-lg"></i></th><th>Error Type</th><th>Predicted Water Quality</th></tr>');

	if (!$.isEmptyObject(e.layer.options.siteData.recentConditions)) {
		$.each(e.layer.options.siteData.recentConditions, function () {
			$('#recentConditionsTable').append('<tr><td>' + this.DATE + '</td><td>' + this.LAB_ECOLI + '</td><td>' + this.NOWCAST_ECOLI + '</td><td>' + this.NOWCAST_PROBABILITY + '</td><td>' + this.ERROR_TYPE + '</td><td>' + this.BEACH_CONDITIONS + '</td></tr>');
		});
	}



	/*
	//loop over extra beach data lookup file
	$.each(beachData , function() {
		}
	});
	*/

	//make sure first tab is default
	$('#markerModal a:first').tab('show');

	//show modal
	$('#markerModal').modal('show');

	//turn on popover click
	$('[data-toggle="popover"]').popover({
		placement: 'bottom'
	});

	//close popovers when anywhere else is clicked
	$('html').on('mouseup', function (e) {
		if (!$(e.target).closest('.popover').length) {
			$('.popover').each(function () {
				$(this.previousSibling).popover('hide');
			});
		}
	});
}

function idify(str) { return str.replace(/\s+/g, '-').toLowerCase(); }

function getSites() {
	on();

	//get list of beaches
	$.ajax({
		type: "GET",
		url: "getbeaches.php",
		data: { 'State': theChosenState },
		success: function (data) {

			//write sites to global object
			siteArray = $.parseJSON(data);

			//call drawsites
			drawSites(siteArray);
		},
		complete: function () {
			//run initial query
			var currentDay = moment().format('YYYY-MM-DD');

			//commented out for debugging
			querySites(currentDay);
			//querySites("2014-07-28");
		}
	});


}

function drawSites(siteArray) {


	//create layerGroup for sites and add to map
	markerArray = [];

	//loop over list of beaches
	$.each(siteArray, function (i, curSite) {

		var customMarker = L.Marker.extend({
			options: {
				siteData: ''
			}
		});

		/*var randomNumber = Math.floor((Math.random() * 10) + 1);
		if (randomNumber < 5) {
			curSite.STATE = 'NY';
		}
		if (randomNumber >= 5) {
			curSite.STATE = 'OH';
		}*/

		//add sites
		var curMarker = new customMarker([parseFloat(curSite.LATITUDE), parseFloat(curSite.LONGITUDE)], { siteData: curSite });

		/*	if (curMarker.options.siteData.STATE && curMarker.options.siteData.STATE !== 'na' && $('#stateDropdownSelect option[value="' + curMarker.options.siteData.STATE + '"]').length == 0) {
				//add it
				$('#stateDropdownSelect').append($('<option></option>').attr('value',curMarker.options.siteData.STATE).text(curMarker.options.siteData.STATE));
			 } */

		//if (PASelected) {
		/*if (curMarker.options.siteData.STATE == "PA") {
		//finally, create the default marker
		var curMarkerSymbol = L.AwesomeMarkers.icon({
				prefix : 'fa',
				icon : '',
				markerColor : 'lightgray'
			});
		//set icon
		curMarker.setIcon(curMarkerSymbol);
		//add to map
		markers.addLayer(curMarker);
		//push to array for zooming
		markerArray.push([parseFloat(curSite.LATITUDE),parseFloat(curSite.LONGITUDE)]);
	}*/

		//} else {

		if (theChosenState == "OH" && PASelected) {
			if (curMarker.options.siteData.STATE == "PA") {
				//finally, create the default marker
				var curMarkerSymbol = L.AwesomeMarkers.icon({
					prefix: 'fa',
					icon: '',
					markerColor: 'lightgray'
				});

				//set icon
				curMarker.setIcon(curMarkerSymbol);

				//add to map
				markers.addLayer(curMarker);

				//push to array for zooming
				markerArray.push([parseFloat(curSite.LATITUDE), parseFloat(curSite.LONGITUDE)]);
			}
		} else {


			if (curMarker.options.siteData.STATE == theChosenState) {
				//finally, create the default marker
				var curMarkerSymbol = L.AwesomeMarkers.icon({
					prefix: 'fa',
					icon: '',
					markerColor: 'lightgray'
				});

				//set icon
				curMarker.setIcon(curMarkerSymbol);

				//add to map
				markers.addLayer(curMarker);

				//push to array for zooming
				markerArray.push([parseFloat(curSite.LATITUDE), parseFloat(curSite.LONGITUDE)]);
			}
		}
		//}
	});


	$('.selectpicker').selectpicker('refresh');

	//check if we've already zoomed
	if (!zoomFlag) {
		//zoom to points
		var bounds = L.latLngBounds(markerArray);
		map.fitBounds(bounds, { padding: [100, 100] });//works!
		// Calculate the offset
		//var offset = map.getSize().x*-0.1;
		// Then move the map
		//setTimeout(function(){ map.panBy(new L.Point(-offset, 0), {animate: true}); }, 500);
	}
	zoomFlag = true;
	off();
}

function querySites(queryValue, $btn) {
	queryDateGlobal = queryValue;

	//update text
	$('#currentDate').html(queryValue);

	//get beach status for last 7 days
	$.ajax({
		type: "GET",
		url: "getconditions2.php",
		//data: "queryDate=" + queryValue,
		data: { 'State': theChosenState, 'queryDate': queryValue, 'timeFrame': timeFrame },
		success: function (data) {

			//parse out conditions to json
			var conditionsArray = $.parseJSON(data);

			//sort the array by date, descending
			conditionsArray.sort(function (a, b) {
				a = new Date(a.DATE);
				b = new Date(b.DATE);
				//return a>b ? -1 : a<b ? 1 : 0;
				return b - a;
			});

			//loop over list of beach marker graphics
			markers.eachLayer(function (curMarker) {

				//initialize conditions objects
				curMarker.options.siteData.recentConditions = {};
				curMarker.options.siteData.currentConditions = {};

				//set default conditions
				curMarker.options.siteData.currentConditions.LAKE_TEMP_F = 'n/a';
				curMarker.options.siteData.currentConditions.BEACH_CONDITIONS = 'No Condition Reported';
				curMarker.options.siteData.currentConditions.BEACH_REASON = '';
				curMarker.options.siteData.currentConditions.DATE = queryValue;

				//finally, create the marker with awesomeMarkers
				if (curMarker.options.siteData.WEB_ENABLED == '2') {
					var curMarkerSymbol = L.AwesomeMarkers.icon({
						prefix: 'fa',
						icon: '',
						markerColor: 'lightgray'
					});
				}
				else {
					var curMarkerSymbol = L.AwesomeMarkers.icon({
						prefix: 'fa',
						icon: '',
						markerColor: 'blue'
					});
				}

				//set icon
				curMarker.setIcon(curMarkerSymbol);

				//get beach temp with separate ajax call to exports table
				$.ajax({
					type: "GET",
					url: "getexport.php",
					//data: "queryDate=" + queryValue + "&USGSID=" + curMarker.options.siteData.ENDDAT_CODE,
					data: { 'State': theChosenState, 'queryDate': queryValue, 'USGSID': curMarker.options.siteData.ENDDAT_CODE },
					success: function (data) {

						//parse out export table data to json
						var exportTableData = $.parseJSON(data);

						//make sure there is a temperature value
						if (exportTableData[0] && exportTableData[0].LAKE_TEMP_C) {

							//convert lake temp to F and round
							var lakeTempF = (exportTableData[0].LAKE_TEMP_C * (9 / 5) + 32).toFixed(1);
						}

						//get conditions for current beach in loop
						$.each(conditionsArray, function (i, curCondition) {

							//draw beach with color for condition
							if (curMarker.options.siteData.BEACH_NAME == curCondition.BEACH_NAME) {

								//if we are at the queried date, set the symbol
								if (curCondition.DATE == queryValue) {

									var curMarkerSymbol = L.AwesomeMarkers.icon({
										prefix: 'fa',
										icon: '',
										markerColor: setMarkerColor(curCondition.BEACH_CONDITIONS)
									});

									//set icon
									curMarker.setIcon(curMarkerSymbol);

									//add condition to siteData object
									curMarker.options.siteData.currentConditions = curCondition;

									//add lake temp to current conditions object
									curMarker.options.siteData.currentConditions.LAKE_TEMP_F = lakeTempF;

									console.log(curCondition.BEACH_NAME, '.  Condition: ', curCondition.BEACH_CONDITIONS, '. Date: ' + curCondition.DATE, '. Lake Temp (c): ' + curMarker.options.siteData.currentConditions.LAKE_TEMP_F);

								}

								//write to recent conditions object of marker
								curMarker.options.siteData.recentConditions[curCondition.DATE] = curCondition;

							}
						});
					},
					complete: function () {
						//reset button
						$btn ? $btn.button('reset') : '';
					}
				});
			});


		}
	});
}

function toPascalCase(str) {
	return $.map(str.split(/\s|_/), function (word) {
		return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
	}).join(" ")
}

//icon color lookup function
function setPopupColor(condition) {
	if (condition == 'No Condition Reported') { return '#41abdd' }
	if (condition == '') { return '#41abdd' }
	if (condition == 'Good') { return '#75b230' }
	if (condition == 'Advisory') { return '#d54733' }
	if (condition == 'Closed') { return '#3a3a3a' }
}

function setMarkerColor(condition) {
	if (condition == 'No Condition Reported') { return 'blue' }
	if (condition == '') { return 'blue' }
	if (condition == 'Good') { return 'green' }
	if (condition == 'Advisory') { return 'red' }
	if (condition == 'Closed') { return 'black' }
}

function setConditionPopup(condition) {
	if (condition == 'No Condition Reported') { return 'No data has been received for this beach' }
	if (condition == '') { return 'No data has been received for this beach' }
	if (condition == 'Good') { return 'E.coli bacterial levels are estimated to be within the water quality standard and acceptable for swimming.' }
	if (condition == 'Advisory') { return 'E.coli bacterial levels are estimated to exceed the water quality standard and be unacceptable for swimming.' }
	if (condition == 'Closed') { return 'Beach is closed for the day.' }
}