var map;
var markers;
var markerArray;
var zoomFlag = false;
var theChosenState;
var panToPoint = true;
var URLparams = {};
var timeFrame = "season";
var currentOpenSite;
var changedTimePeriod = false;
var queryDateGlobal;
var siteArray;
var secondClickButton = false;
var beforeChangeTimePeriod = true;
var firstTimeClickButton = true;
var loadAllSites = true;
var stateOfClickedMarker;
var precipitation;
var wind;
var clouds;

//main document ready function
$(document).ready(function () {
	//$('#popupModal').modal('show');
	$("#changingTabs").load(encodeURI('aboutDefault.html'));
	//$('#aboutModal').modal('show')
	
	//initialize basemap
	var worldImagery = L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
		attribution: 'Copyright: &copy; 2013 Esri, DeLorme, NAVTEQ'
	});
	var worldBoundAndPlacesRef = L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
		attribution: 'Copyright: &copy; 2013 Esri, DeLorme, NAVTEQ'
	});

	//initialize map
	map = new L.Map('map', {
		center: new L.LatLng(42.75, -75.5),
		zoom: 7,
		layers: [worldImagery, worldBoundAndPlacesRef],
		attributionControl: false,
		zoomControl: false
	});
	
	precipitation = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=d22d9a6a3ff2aa523d5917bbccc89211', {
		maxZoom: 18,
		attribution: '&copy; <a href="https://owm.io">VANE</a>'
	});
	
	wind = L.tileLayer('https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=d22d9a6a3ff2aa523d5917bbccc89211', {
		maxZoom: 18,
		attribution: '&copy; <a href="https://owm.io">VANE</a>'
    });
	
	clouds = L.tileLayer('https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=d22d9a6a3ff2aa523d5917bbccc89211', {
		maxZoom: 18,
		attribution: '&copy; <a href="https://owm.io">VANE</a>'
    });
	
	var overlayMaps = {
		"Precipitation": precipitation,
		"Wind": wind,
		"Clouds": clouds
	};

	var testVar = L.control.layers(null, overlayMaps).addTo(map);

	markers = new L.FeatureGroup();
	map.addLayer(markers);
	var params = {};
	URLparams = getAllUrlParams();
	processURLparams();

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
	yesterday.setDate(yesterday.getDate() - 1);

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
function offSeason() {
	function dateCompare(date1, date2){
		return new Date(date2) > new Date(date1);
	}
	return dateCompare(queryDateGlobal, queryDateGlobal.substring(0, queryDateGlobal.indexOf('-')) + '-05-10') || dateCompare(queryDateGlobal.substring(0, queryDateGlobal.indexOf('-')) + '-09-20', queryDateGlobal);
}

function chooseTimeFrameFunction() {
	$("#showPieChart").hide();
	beforeChangeTimePeriod = false;
	changedTimePeriod = true;
	//timeFrame = $(e.target).find('option:selected').attr('value');
    $.ajax({
        type: "GET",
        url: "getconditions.php",
        data: {
            'queryDate': queryDateGlobal,
            'timeFrame': timeFrame
        },
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
                        } else if (curCondition.ERROR_TYPE == "Correct Non-Exceed") {
                            CorrectNonExceed++;
                        } else if (curCondition.ERROR_TYPE == "False Exceed") {
                            FalseExceed++;
                        } else if (curCondition.ERROR_TYPE == "False Non-Exceed") {
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
                            if (curConditionWithEcoliCalculations.LAB_ECOLI >= 235 && curConditionWithEcoliArray[i + 1].LAB_ECOLI >= 235) {
                                prevDayCorrectExceed++;
                            } else if (curConditionWithEcoliCalculations.LAB_ECOLI < 235 && curConditionWithEcoliArray[i + 1].LAB_ECOLI < 235) {
                                prevDayCorrectNonExceed++;
                            } else if (curConditionWithEcoliCalculations.LAB_ECOLI < 235 && curConditionWithEcoliArray[i + 1].LAB_ECOLI >= 235) {
                                prevDayFalseExceed++;
                            } else if (curConditionWithEcoliCalculations.LAB_ECOLI >= 235 && curConditionWithEcoliArray[i + 1].LAB_ECOLI < 235) {
                                prevDayFalseNonExceed++;
                            }
                        }
                    });
                }

                var addedErrorTypes = CorrectExceed + CorrectNonExceed + FalseExceed + FalseNonExceed;
                var addedPrevDayErrorTypes = prevDayCorrectExceed + prevDayCorrectNonExceed + prevDayFalseExceed + prevDayFalseNonExceed;
                if (timeFrame !== "7days") {
                    //if (addedErrorTypes / totalCount >= 0.5 && addedPrevDayErrorTypes / totalCount >= 0.5) {
                    if (totalCount > 0) {
                        //first pie chart (NowCast's accuracy)
                        google.charts.load('current', {
                            'packages': ['corechart']
                        });
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
                                'title': '',
                                'slices': { 0: { color: '#C0392B' }, 1: { color: '#229954' }, 2: { color: '#A9DFBF', offset: 0.1 }, 3: { color: '#E6B0AA', offset: 0.1 } },
                                'width': '100%',
                                'height': '100%',
                                'chartArea': {
                                    'width': '100%',
                                    'height': '90%'
                                },
                                'legend': {
                                    'position': 'none'
                                }
                            };

                            var chart = new google.visualization.PieChart(document.getElementById('piechart'));
                            chart.draw(data, options);
                            $('#piechart').append("Number of samples used in above chart: " + addedErrorTypes);
                            $('#piechart').prepend('<h5><b>NowCast performance - ' + currentOpenSite + '(Click for stats)</b></h5>');
                        }
                        //second pie chart (persistence model)
                        google.charts.load('current', {
                            'packages': ['corechart']
                        });
                        google.charts.setOnLoadCallback(drawChartPersistenceModel);

                        function drawChartPersistenceModel() {

                            var data = google.visualization.arrayToDataTable([
                                ['', ''],
                                ['Correct Exceed', prevDayCorrectExceed], // 0
                                ['Correct Non-Exceed', prevDayCorrectNonExceed], // 1
                                ['False Exceed', prevDayFalseExceed], // 2
                                ['False Non-Exceed', prevDayFalseNonExceed], // 3
                                ['', 0]
                            ]);

                            var options = {
                                'title': '',
                                //'slices': {0: {color: 'red'}, 1:{color: 'blue'}, 2: {color: 'green'}, 3:{color: 'yellow'}},
                                'slices': { 0: { color: '#C0392B' }, 1: { color: '#229954' }, 2: { color: '#A9DFBF', offset: 0.1 }, 3: { color: '#E6B0AA', offset: 0.1 } },
                                'width': '100%',
                                'height': '100%',
                                'chartArea': {
                                    'width': '100%',
                                    'height': '90%'
                                },
                                'legend': {
                                    'position': 'none'
                                }
                            };

                            var chart = new google.visualization.PieChart(document.getElementById('piechart2'));
                            chart.draw(data, options);
                            $('#piechart2').append("Number of samples used in above chart: " + addedPrevDayErrorTypes);
                            $('#piechart2').prepend('<h5><b>Persistence Model performance - ' + currentOpenSite + ' (Click for stats)</b></h5>');

						}
						var currentYear = queryDateGlobal.substring(0, queryDateGlobal.indexOf('-'));
						$('#infoText').html("<p class='text-info'>Correct and false non-exceedance and exceedance responses for the specified model for <strong>" + currentOpenSite + "</strong> during the recreational season of <strong>" + currentYear + "</strong> starting on Memorial Day for most beaches until today (<strong>" + queryDateGlobal + "</strong>). Non-exceedances and exceedances are determined by comparing E. coli concentrations in samples collected at the site to the state-specific water-quality standard. The NowCast model for this site correctly predicted non-exceedances and exceedances for <strong>" + Math.round(((CorrectExceed + CorrectNonExceed) / addedErrorTypes) * 100) + "%</strong> of samples collected. The persistence model (using the previous sample's bacteria concentration), correctly predicted non-exceedances and exceedances for <strong>" + Math.round(((prevDayCorrectExceed + prevDayCorrectNonExceed) / addedPrevDayErrorTypes) * 100) + "%</strong> of samples collected.</p>");
					/*} else {
						$('#piechart').html("<div class='alert alert-warning'><strong>Error:</strong> This site does not have enough data entered to generate pie charts.</div>");
						$('#piechart2, #infoText').empty();
					}*/
					} else {
						$('#piechart').html('<div class="alert alert-warning"><strong>Error(ctf):</strong> No data available.</div>');
						$('#piechart2, #infoText').empty();
					}
				} else {
					$('#piechart').html('<div class="alert alert-warning"><strong>Error(ctf):</strong> You must select "Whole season" from dropdown to see pie charts.</div>');
					$('#piechart2, #infoText').empty();
				}

			} else {
				$('#piechart').html('<div class="alert alert-warning"><strong>Error(ctf):</strong> No data available.</div>');
				$('#piechart2, #infoText').empty();
			}
			$("#showPieChart").show();
		}
	});
	changedTimePeriod = false;
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
			$('#piechart, #piechart2, #infoText, #chartLegend').show();
			secondClickButton = true;
		} else {
			$('#showPieChart').html("NowCast's Accuracy");
			$('#recentConditionsTable, #timeFrameDropDownHide').show();
			$('#piechart, #piechart2, #infoText, #chartLegend').hide();
			secondClickButton = false;
		}
	} else {
		$('#showPieChart').html("Back to recent conditions");
		$('#recentConditionsTable, #timeFrameDropDownHide').hide();
		$('#piechart, #piechart2, #infoText, #chartLegend').show();
		firstTimeClickButton = false;
		secondClickButton = true;
	}
}

function dateQueryButtonFunction() {
	var $btn = $('#dateQueryButton').button('loading');
	var query = $('.datepicker').attr('value');
	if (query !== moment().format('YYYY-MM-DD')) { //NOTE: see if necessary to make this more effecient
		map.removeLayer(precipitation, wind, clouds);
		$('.leaflet-control-layers').hide();
	} else {
		$('.leaflet-control-layers').show();
	}
	querySites(query, $btn);
}

function processURLparams() {
	if (URLparams.state && URLparams.lat && URLparams.lng && URLparams.zoom) {
		loadAllSites = false;
		theChosenState = URLparams.state.toUpperCase();
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

		$("#sitelink").html("<a href='https://ny.water.usgs.gov/maps/nowcast/' style='text-decoration: none;color:red;'>Powered by <font color='black'>NowCast Status</font>. Click here to see the full map of swimming areas.</a>");
		$("#usgsfooter, #aboutModal, #legend, #topnav").remove();
		$("#body").css("padding-top", "0px");
		$("html, body, #map").css({
			"height": "-webkit-calc(100% - 8px)",
			"height": "-moz-calc(100% - 8px)",
			"height": "calc(100% - 8px)"
		});

		getSites();
	} else if (URLparams.state) {
		loadAllSites = false;
		theChosenState = URLparams.state.toUpperCase();
		// if (theChosenState == "OH") {
		// 	$("#changingTabs").load(encodeURI('aboutOH.html'));
		// } else {
		// 	$("#changingTabs").load(encodeURI('aboutNY_PA.html'));
		// }
		getSites();
	} else {
		getSites();
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
		"<iframe id=\"map_frame\" " +
		"width=\"100%\" height=\"200px\" frameborder=\"0\" scrolling=\"no\" marginheight=\"0\" marginwidth=\"0\" " +
		"src=\"https://www.google.com/maps?f=q&amp;output=embed&amp;source=s_q&amp;hl=en&amp;geocode=&amp;q=" +
		lat + "," + lon +
		"&amp;aq=&amp;sll=48.669026,19.699024&amp;sspn=4.418559,10.821533&amp;ie=UTF8&amp;ll=" +
		lat + "," + lon +
		"&amp;spn=0.199154,0.399727&amp;t=m&amp;z=" +
		zoom + "\"" + "></iframe>");
}

function onMarkerClick(e) {
	if(e.layer.options.siteData.DISABLERC == '1') {
		$('#recentCond').hide();
	} else {
		$('#recentCond').show();
	}
	$('#chooseTimeFrame>option:eq(1)').prop('selected', true);
	$('#chooseTimeFrame').selectpicker('refresh');
	$("#chooseTimeFrame").change();

	chooseTimeFrameFunction();
	firstTimeClickButton = true;
	beforeChangeTimePeriod = true;
	secondClickButton = false;
	$('#showPieChart').html("NowCast's Accuracy");
	$('#timeFrameDropDownHide').show();
	$('#recentConditionsTable').show();
	$('#piechart').empty();
	$('#piechart').hide();
	$('#piechart2').empty();
	$('#piechart2').hide();
	$('#infoText').empty();
    $('#infoText').hide();
    $('#chartLegend').hide();
	currentOpenSite = e.layer.options.siteData.BEACH_NAME;

	if (panToPoint) {
		map.panTo(e.latlng);
	}
	console.log("Marker clicked", e.layer.options.siteData.currentConditions.BEACH_CONDITIONS, setPopupColor(e.layer.options.siteData.currentConditions.BEACH_CONDITIONS), e.layer.options.siteData);
	if (loadAllSites && e.layer.options.siteData.STATE !== stateOfClickedMarker) {
		console.log("changed the tabs!");
		// if (e.layer.options.siteData.STATE == "OH") {
		// 	$("#changingTabs").load(encodeURI('aboutOH.html'));
		// } else {
		// 	$("#changingTabs").load(encodeURI('aboutNY_PA.html')); //maybe make this part only run if changing to ohio or from ohio? see if necessary.
		// }
	}

	stateOfClickedMarker = e.layer.options.siteData.STATE;

	if (e.layer.options.siteData.STATE == "OH" || e.layer.options.siteData.STATE == "PA") {
		$('#3rdTab').html('<a href="#tab3" data-toggle="tab"><i class="fa fa-info-circle"></i>&nbsp;&nbsp;<span class="beachName"></span> Details</a>');
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
	} else {
		//otherwise just show date
		$('#conditionsDate').html(e.layer.options.siteData.currentConditions.DATE);
	}

	//set out of season beach conditions in marker popup
	//if ((e.layer.options.siteData.WEB_ENABLED == 2) && offSeason()) {
	if (e.layer.options.siteData.WEB_ENABLED == 2) {
		$('#beachConditionBar').attr('style', 'padding:3px;color:white;background-color:#d3d3d3');
		$('#beachCondition').html('Off-Season&nbsp;&nbsp;<i data-toggle="popover" data-content="Generally, the recreational season is Memorial Day to Labor Day" class="fa fa-info-circle fa-lg"></i>');
	} else {
		//set beach conditions in marker popup
		$('#beachConditionBar').attr('style', 'padding:3px;color:white;background-color:' + setPopupColor(e.layer.options.siteData.currentConditions.BEACH_CONDITIONS));
		$('#beachCondition').html(e.layer.options.siteData.currentConditions.BEACH_CONDITIONS + '&nbsp;&nbsp;<i  data-toggle="popover" data-content="' + setConditionPopup(e.layer.options.siteData.currentConditions.BEACH_CONDITIONS) + '" class="fa fa-info-circle fa-lg"></i>&nbsp;&nbsp;' + e.layer.options.siteData.currentConditions.BEACH_REASON);
	}
	if (e.layer.options.siteData.STATE == "OH") {
		$('#beachguard').html("<p>&nbsp;&nbsp;Additional water-quality information may be available at <a href='https://publicapps.odh.ohio.gov/BeachGuardPublic/Default.aspx' target='_blank'>BeachGuard</a> operated by Ohio Department of Health.</p>");
	} else {
		$('#beachguard').empty();
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

function idify(str) {
	return str.replace(/\s+/g, '-').toLowerCase();
}

function getSites() {
	on();

	//get list of beaches
	$.ajax({
		type: "GET",
		url: "getbeaches.php",
		data: {
		},
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
		var curMarker = new customMarker([parseFloat(curSite.LATITUDE), parseFloat(curSite.LONGITUDE)], {
			siteData: curSite
		});
		if (!loadAllSites) {
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
		} else {
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
	});

	//$('.selectpicker').selectpicker('refresh'); pretty sure can remove since don't need state drop down any more

	//check if we've already zoomed
	if (!zoomFlag) {
		//zoom to points
		var bounds = L.latLngBounds(markerArray);
		map.fitBounds(bounds, {
			padding: [100, 100]
		});
	}
	//zoomFlag = true; //don't think you need this
	off();
}

function querySites(queryValue, $btn) {
	queryDateGlobal = queryValue;

	//update text
	$('#currentDate').html(queryValue);

	//get beach status for last 7 days
	$.ajax({
		type: "GET",
		url: "getconditions.php",
		data: {
			'queryDate': queryValue,
			'timeFrame': timeFrame
		},
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
				//if ((curMarker.options.siteData.WEB_ENABLED == '2') && offSeason()) {
				if (curMarker.options.siteData.WEB_ENABLED == '2') {
					var curMarkerSymbol = L.AwesomeMarkers.icon({
						prefix: 'fa',
						icon: '',
						markerColor: 'lightgray'
					});
				} else {
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
					data: {
						'queryDate': queryValue,
						'USGSID': curMarker.options.siteData.ENDDAT_CODE
					},
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
	if (condition == 'No Condition Reported') {
		return '#41abdd'
	}
	if (condition == '') {
		return '#41abdd'
	}
	if (condition == 'Good') {
		return '#75b230'
	}
	if (condition == 'Advisory') {
		return '#d54733'
	}
	if (condition == 'Closed') {
		return '#3a3a3a'
	}
}

function setMarkerColor(condition) {
	if (condition == 'No Condition Reported') {
		return 'blue'
	}
	if (condition == '') {
		return 'blue'
	}
	if (condition == 'Good') {
		return 'green'
	}
	if (condition == 'Advisory') {
		return 'red'
	}
	if (condition == 'Closed') {
		return 'black'
	}
}

function setConditionPopup(condition) {
	if (condition == 'No Condition Reported') {
		return 'No data has been received for this site'
	}
	if (condition == '') {
		return 'No data has been received for this site'
	}
	if (condition == 'Good') {
		return 'E.coli bacterial levels are estimated to be within the water quality standard and acceptable for swimming.'
	}
	if (condition == 'Advisory') {
		return 'E.coli bacterial levels are estimated to exceed the water quality standard and be unacceptable for swimming.'
	}
	if (condition == 'Closed') {
		return 'Site is closed for the day.'
	}
}
