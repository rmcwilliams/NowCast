var map
var markers;
var markerArray;
var zoomFlag = false;

//main document ready function
$( document ).ready(function() {

	//initialize basemap
	var ESRIgrayBasemap = L.tileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
			attribution : 'Copyright: &copy; 2013 Esri, DeLorme, NAVTEQ'
		});

	//initialize map
	map = new L.Map('map', {
		center : new L.LatLng(42.75, -75.5),
		zoom : 7,
		layers : [ESRIgrayBasemap],
		attributionControl : false,
		zoomControl : false

	});

	markers = new L.FeatureGroup();
	map.addLayer(markers);

	//call initial function to get site list
	getSites();

	//listener for date query
	$('#dateQueryButton').on('click',function() {
		var $btn = $(this).button('loading')
		var query = $('.datepicker').attr('value');
		querySites(query, $btn);
	});

	//setup datepicker dates
	var startDate = new Date("2014-01-01T00:00:00");
	var today =  new Date();
	var yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);;

	//instantiate
	$('.datepicker').datepicker({
		format: 'yyyy-mm-dd',
		autoclose: true,
		todayHighlight: true,
		startDate:  startDate,
		endDate: today
	})

	//set datepicker date to yesterday so it has a value
	$(".datepicker").datepicker("update", yesterday);

	$("#legendButton").click(function() {
	  $("#legend").toggle();
	  map.invalidateSize();
	  return false;
	});

	//marker click override listener
	markers.on('click', onMarkerClick);


//end document ready function
});

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
	map.panTo(e.latlng);
	
	console.log("Marker clicked", e.layer.options.siteData.currentConditions.BEACH_CONDITIONS, setPopupColor(e.layer.options.siteData.currentConditions.BEACH_CONDITIONS), e.layer.options.siteData);

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

	//show lake temp
	$('#lakeTemp').html(e.layer.options.siteData.currentConditions.LAKE_TEMP_F);
	
	//show map and directions
	displayMapAt(e.layer.options.siteData.LATITUDE, e.layer.options.siteData.LONGITUDE , 12)
	$('#directions').attr('href', 'https://maps.google.com/maps?q=' + e.layer.options.siteData.LATITUDE + ',' + e.layer.options.siteData.LONGITUDE);

	//update recent conditions table with a fresh header row
	$('#recentConditionsTable').html('<tr><th>Date</th><th>E.coli (CFU/100mL)</th><th>Estimated E.coli (CFU/100mL)&nbsp;&nbsp;<i data-toggle="popover" data-content="The model estimated value provides a quantitative prediction of E.coli concentration." class="fa fa-info-circle fa-lg"></i> </th><th>Probability of Exceeding&nbsp;&nbsp;<i data-toggle="popover" data-content="The probability of exceeding provides apercentage that the state standard of 235 colony forming units will be surpassed." class="fa fa-info-circle fa-lg"></i></th><th>Error Type</th><th>Predicted Water Quality</th></tr>');

	//if there are recent conditions, append them to recent conditions table
	if (!$.isEmptyObject(e.layer.options.siteData.recentConditions)) {
		$.each(e.layer.options.siteData.recentConditions, function() {
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
	$('html').on('mouseup', function(e) {
		if(!$(e.target).closest('.popover').length) {
			$('.popover').each(function(){
				$(this.previousSibling).popover('hide');
			});
		}
	});
}

function idify(str) { return str.replace(/\s+/g, '-').toLowerCase(); }

function getSites() {

	console.log('in getsites');

	//get list of beaches
	$.ajax({
		type:"GET",
		url:"getbeaches.php",
		success: function(data){

			//write sites to global object
			var siteArray = $.parseJSON(data);

			//call drawsites
			drawSites(siteArray);
		},
		complete: function(){
			//run initial query
			var currentDay = moment().format('YYYY-MM-DD');

			//commented out for debugging
			querySites(currentDay);
			//querySites("2014-07-28");
		}
	});
}

function drawSites(siteArray) {

	console.log('in drawsites');

	//create layerGroup for sites and add to map
	markerArray = [];

	//loop over list of beaches
	$.each(siteArray, function(i, curSite) {

		var customMarker = L.Marker.extend({
			options: {
				siteData: ''
			}
		});

		//add sites
		var curMarker = new customMarker( [parseFloat(curSite.LATITUDE),parseFloat(curSite.LONGITUDE)], {siteData:curSite});

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

	});

	//check if we've already zoomed
	if (!zoomFlag) {
		//zoom to points
		var bounds = L.latLngBounds(markerArray);
		map.fitBounds(bounds, {padding: [100,100]});//works!
		// Calculate the offset
		var offset = map.getSize().x*-0.1;
		// Then move the map
		setTimeout(function(){ map.panBy(new L.Point(-offset, 0), {animate: true}); }, 500);
	}
	zoomFlag = true;
}

function querySites(queryValue, $btn) {

	console.log('in querysites',markers.getLayers().length);

	//update text
	$('#currentDate').html(queryValue);

	//get beach status for last 7 days
	$.ajax({
		type:"GET",
		url:"getconditions.php",
		data: "queryDate=" + queryValue,
		success: function(data){

			//parse out conditions to json
			var conditionsArray = $.parseJSON(data);

			//sort the array by date, descending
			conditionsArray.sort(function(a, b) {
				a = new Date(a.DATE);
				b = new Date(b.DATE);
				//return a>b ? -1 : a<b ? 1 : 0;
				return b-a;
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
                        prefix : 'fa',
                        icon : '',
                        markerColor : 'lightgray'
                    });
                }
                else {
                    var curMarkerSymbol = L.AwesomeMarkers.icon({
                        prefix : 'fa',
                        icon : '',
                        markerColor : 'blue'
                    });
                }

				//set icon
				curMarker.setIcon(curMarkerSymbol);

				//get beach temp with separate ajax call to exports table
				$.ajax({
					type:"GET",
					url:"getexport.php",
					data: "queryDate=" + queryValue + "&USGSID=" + curMarker.options.siteData.ENDDAT_CODE,
					success: function(data){

						//parse out export table data to json
						var exportTableData = $.parseJSON(data);

						//make sure there is a temperature value
						if (exportTableData[0] && exportTableData[0].LAKE_TEMP_C) {

							//convert lake temp to F and round
							var lakeTempF = (exportTableData[0].LAKE_TEMP_C * (9/5) + 32).toFixed(1);
						}

						//get conditions for current beach in loop
						$.each(conditionsArray , function(i, curCondition) {

							//draw beach with color for condition
							if (curMarker.options.siteData.BEACH_NAME == curCondition.BEACH_NAME) {

								//if we are at the queried date, set the symbol
								if (curCondition.DATE == queryValue ) {

									var curMarkerSymbol = L.AwesomeMarkers.icon({
											prefix : 'fa',
											icon : '',
											markerColor : setMarkerColor(curCondition.BEACH_CONDITIONS)
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
					complete: function(){
						//reset button
						$btn? $btn.button('reset'): '';
					}
				});
			});


		}
	});
}

function toPascalCase(str) {
	return $.map(str.split(/\s|_/), function(word) {
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
