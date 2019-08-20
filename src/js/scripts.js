$(document).ready(function() {

    'use strict';

    $('#header img.active').hide();

    var navImg = $('#header .nav-item');
    $(navImg).hover(function() {
        $(this).find('img.inactive').hide();
        $(this).find('img.active').show();
    }, function() {
        $(this).find('img.inactive').show();
        $(this).find('img.active').hide();
    });

    // Display search bar
    $('.site-search').click(function() {
        $('#siteSearchBox').slideToggle();
        $('#siteSearch').focus();
    });

    /***********************************************
    		Trip Planner
    ***********************************************/
    // location switcher
    var inputs = $('.from-location, .to-location'),
        tmp
    $('.location-toggler').click(function() {
        tmp = inputs[0].value
        inputs[0].value = inputs[1].value
        inputs[1].value = tmp
    })

    // time & date inputs
    $('.time-elements').hide();
    $('#selectTime').on('change', function() {
        if (this.value == 'depart-at' || this.value == 'arrive-by') {
            $('.time-elements').show();
        } else {
            $('.time-elements').hide();
        }
    });

    /***********************************************
			NexTrip
	***********************************************/
    // Select route
    $('.select-route-direction, .select-route-stop').hide();
    $('.select-route').change(function() {
        if ($('select').val() != null) {
            $('.select-route-direction').fadeIn('slow').css('display', 'flex');
        } else {
            $('.select-route-direction, .select-route-stop').hide();
        }
    });

    // Select selectDirection
    $('.select-route-direction').change(function() {
        if ($('select').val() != null) {
            $('.select-route-stop').fadeIn('slow').css('display', 'flex');
        } else {
            $('.select-route-stop').hide();
        }
    });

/* =================================================================
        BEGIN AUTOCOMPLETE
    */
    const LOCATOR =
    "https://arcgistest.metctest.state.mn.us/transit/rest/services/metro_transit/GeocodeServer/";
    //
    //  Get current location
    // 
    var MYLOCATION = null;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                MYLOCATION = { 
                    x : position.coords.longitude,
                    y : position.coords.latitude,
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
    /* ======================================================================
        addressAutoComplete
        Parms:
            inputDiv is a string with ID name of the input element 
            UTMout is a boolean - if true, coordinates for the address are
                returned in UTM projection (needed for Trip Planner), otherwise
                coordinates are geographic Lat/Long
        ========================================================================= */
    var addressAutoComplete = function(/*string*/inputDiv,/*boolean*/UTMout) {
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
                        location: MYLOCATION ? JSON.stringify(MYLOCATION) : null,
                        distance: MYLOCATION ? 4000 : null, // meters ~ 2.5 miles
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
                        outFields: "Addr_type, LongLabel, PlaceName, Place_addr",
                        maxLocations: 6,
                        magicKey: suggest.data,
                        outSR: UTMout ? 26915 : 4326,
                        f: "json"
                    },
                    dataType: "json"
                })
                    .done(function(r) {
                        if (r.error) {
                            console.warn("Call to FindCandidate failed for: " + suggest.value);
                        } else {
                            if (r.candidates.length > 0) {
                                var choice = r.candidates[0];
                                console.log(inputDiv + ": " + JSON.stringify(choice));
                                if (inputDiv === "fromLocation") {
                                    FROMLOCATION = choice;
                                }
                                if (inputDiv === "toLocation") {
                                    TOLOCATION = choice;
                                }
                            }
                        }
                    })
                    .fail(function(e) {
                        console.warn("Call to FindCandidate failed for: " + suggest.value);
                    });
            }
        });
    }
    var FROMLOCATION = null;
    var TOLOCATION = null;
    addressAutoComplete("fromLocation",/*UTMout*/true);
    addressAutoComplete("toLocation",/*UTMout*/true);

    // Get json data

    // var ntRouteOptions;
    // var ntDirectionOptions;
    //
    // $.ajax ({
    //     type: 'get',
    //     //url: 'http://svc.metrotransit.org/NexTrip/Routes?format=json',
    //     url: 'https://svc.metrotransittest.org/nextripv2/routes',
    //     dataType: 'json',
    //     success: function(result) {
    //         $.each(result, function(i,ntRoute) {
    //             //console.log(ntRoute.Description);
    //             //<option value="Route">Route</option>
    //             ntRouteOptions += "<option value='" +  ntRoute.Route + "'>" + ntRoute.Description + "</option>";
    //         });
    //         $('#ntRoute').html(ntRouteOptions);
    //     }
    // });
    // $('#ntRoute').change(function() {
    //     if($(this).val() != null) {
    //         $.ajax ({
    //             type: 'get',
    //             url: 'http://svc.metrotransit.org/NexTrip/Directions/5?format=json',
    //             dataType: 'json',
    //             success: function(result) {
    //                 $.each(result, function(directionText,directionValue) {
    //                     //console.log(ntRoute.Description);
    //                     //<option value="Route">Route</option>
    //                     ntDirectionOptions += "<option value='" +  directionValue.Value + "'>" + directionText.Text + "</option>";
    //                 });
    //                 $('#ntDirection').html(ntDirectionOptions);
    //             }
    //         });
    //     }
    // });
    // =============================================
    // Initalize map depending on their map type
    // =============================================
    if ($('#NexTripMap').attr('maptype') === 'BOM') {
         let parms = {
            stopID: '2611', // optional stop, if route too then show just the one route
            routeID: null, // optional route, if no stop - show all on route, if 0 - show all
            zoomToNearestBus: true, // when drawing buses the first time, zoom out until you find a bus to show
            stopZoomLevel: 16 // Web Mercator level to intially zoom the stop extent, if stopID has a value
        };
        BOM.init('NexTripMap').then(function () {
            BOM.startBusesOnMap(parms);
        });
    }
});
