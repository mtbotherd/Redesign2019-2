$(function() {
	"use strict";

	function getUserLocation() {
		var location = null;
		if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function(position) {
			location = {
				x: position.coords.longitude,
				y: position.coords.latitude,
				spatialReference: { wkid: 4326 }
			};
			},
			function(error) {
			console.warn("getLocation failed: " + error);
			},
			{
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0
			}
		);
		}
		return location;
	}

	/***********************************************
				Begin Autocomplete
		***********************************************/
	//
	//  Get current location
	//
  
	/* ===========================================================================
		   addressAutoComplete
		   Parms:
			   inputDiv is a string with ID name of the input element 
			   UTMout is a boolean - if true, coordinates for the address are
				   returned in UTM projection (needed for Trip Planner), otherwise
				   coordinates are geographic WGS84 Lat/Long
	   ============================================================================*/
	   var addressAutoComplete = function(/*string*/ inputDiv, /*boolean*/ UTMout) {
		const LOCATOR =
		  "https://arcgistest.metctest.state.mn.us/transit/rest/services/metro_transit/GeocodeServer/";
		let myLocation = getUserLocation();
		$("#" + inputDiv).devbridgeAutocomplete({
		  noCache: true,
		  autoSelectFirst: true,
		  minChars: 1,
		  width: "flex",
		  lookup: function(query, returnSuggestions) {
			$.ajax({
			  type: "get",
			  url: LOCATOR + "suggest",
			  data: {
				Text: query.replace(/[.,\/#!$%\^\*;:{}=\_`~()]/g, ""),
				maxSuggestions: 10,
				location: myLocation ? JSON.stringify(myLocation) : null,
				distance: myLocation ? 4000 : null, // meters ~ 2.5 miles
				f: "json"
			  },
			  dataType: "json"
			})
			  .done(function(r) {
				returnSuggestions({
				  suggestions: $.map(r.suggestions, function(c) {
					return { value: c.text, data: c.magicKey };
				  })
				});
			  })
			  .fail(function(e) {
				console.warn("Address locator failed for: " + query);
			  });
		  },
		  onSelect: function(suggest) {
			$.ajax({
			  type: "get",
			  url: LOCATOR + "findAddressCandidates",
			  data: {
				SingleLine: suggest.value,
				outFields: "Addr_type, LongLabel, PlaceName, Place_addr, ATIS_ID",
				maxLocations: 6,
				magicKey: suggest.data,
				outSR: UTMout ? 26915 : 4326,
				f: "json"
			  },
			  dataType: "json"
			})
			  .done(function(r) {
				if (r.error) {
				  console.warn(
					"Call to FindCandidate failed for: " + suggest.value
				  );
				} else {
				  if (r.candidates.length > 0) {
					var choice = r.candidates[0];
					console.log(inputDiv + ": " + JSON.stringify(choice));
					if (inputDiv === "fromLocation") {
					  TRIPFROMLOCATION = choice;
					}
					if (inputDiv === "toLocation") {
					  TRIPTOLOCATION = choice;
					}
					if (inputDiv === "schedulesMaps") {
					  TRIM.centerMarkerAtPoint(
						choice.location.x,
						choice.location.y
					  );
					}
				  }
				}
			  })
			  .fail(function(e) {
				console.warn("Call to FindCandidate failed for: " + suggest.value);
			  });
		  }
		});
	  };
	  // =========================================================
	  // Here are the routines that set the INPUT field to use the
	  // ADDRESS AUTOCOMPLETE function defined above.
	  //
	  // Each routine passes the result of the autocomplete
	  // to a global variable (UPPERCASE).
	  //
	  // For the trip planner, both TO and FROM need be set
	  // for validation.
	  //
	  // This one handles the 'fromLocation' for the Trip Planner
	  var TRIPFROMLOCATION = null;
	  addressAutoComplete("fromLocation", /*UTMout*/ true);
	  // This one handles the 'toLocation' for the Trip Planner
	  var TRIPTOLOCATION = null;
	  addressAutoComplete("toLocation", /*UTMout*/ true);
	  // This one loads the Search field in the schedules-maps page -- the search result
	  // automatically sets the map to zoom to the requested location
	  addressAutoComplete("schedulesMaps", /*UTMout*/ false);
	
	  // This triggers planning a new trip when the
	  // button on the Trip Planner page is clicked
	  // TODO: Test for errors in the result
	  // TODO: Test for FROM address = TO address
	  // TODO: Trigger display of 'No Trips Found' message if error occurs
	  //
	  $('button[name="planMyTrip"]').click(function () {
		if (TRIPFROMLOCATION && TRIPTOLOCATION) {
		  // set default trip plan value here and override from inputs
		  // TODO find all the input source for the parameters and format them correctly for the trip planner
		  let tripProperties = {
			fromLocation: TRIPFROMLOCATION,
			toLocation: TRIPTOLOCATION,
			arrdep: "Depart", // source from
			walkdist: "1.0", //source from
			minimize: "Time", // source from
			accessible: "False", // source from
			datetime: "10/1/2019 07:30:00 AM" // soure from
		  }
		  TripPlan.newTrip(tripProperties)
			  .then(function () {
				let plan = TripPlan.getTrip();
				console.log("Have a Plan");
				console.dir(plan);
			  })
			.fail(function(err) {
				  console.warn("Trip Plan Failed: " + err.Message);
				  console.dir(err);
			  });
		}
	  });
	
	  // This loads the map into the resulting Trip Plan page.
	  // Once the map loads, trips can be displayed.
	  //
	  // TODO: this is currently in DEMO mode.
	  // Need to add routines that trigger when user
	  // clicks the 'trip summary' button to show on the
	  // map just that trip option.
	  //
	  // Format for the call:
	  // TRIM.drawTrip(<trip option>, <entire trip plan>, <zoom to trip>)
	  if ($("#tripPlanMap").attr("maptype") === "trip") {
		TRIM.init("tripPlanMap").then(function() {
		  let tripPlan = TripPlan.getTrip();
		  if (tripPlan) {
			if (tripPlan.PlannerItin) {
			  if (tripPlan.PlannerItin.PlannerOptions.length > 0) {
				console.log("Draw TripPlan 0");
				TRIM.drawTrip(0, tripPlan, /*zoom*/ true);
			  }
			  if (tripPlan.PlannerItin.PlannerOptions.length > 1) {
				setTimeout(function() {
				  console.log("Draw TripPlan 1");
				  TRIM.drawTrip(1, tripPlan, /*zoom*/ true);
				}, 5000);
			  }
			  if (tripPlan.PlannerItin.PlannerOptions.length > 2) {
				setTimeout(function() {
				  console.log("Draw TripPlan 2");
				  TRIM.drawTrip(2, tripPlan, /*zoom*/ true);
				}, 10000);
			  }
			}
		  }
		});
	  }
	
	  // ----------------------------------------------------
	  // schedules-maps
	  // ----------------------------------------------------
	  if ($("#TRIMap").attr("maptype") === "full") {
		TRIM.init("TRIMap").then(function() {
		  TRIM.geoLocate();
		});
	  }
	  $("#stopsStations").click(function() {
		TRIM.toggleLayer("allStops");
	  });
	  $("#parkRide").click(function() {
		TRIM.toggleLayer("parkAndRides");
	  });
	  $("#niceRide").click(function() {
		TRIM.toggleLayer("niceRides");
	  });
	});