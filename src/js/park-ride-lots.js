// ParkRideServices handles formatting the results of an address
// autocomplete search on the park-ride-lot page.
//
// formatPage deletes an previous page results then:
// -- calls the Finder service to get any park-ride lot locations
//    near the requested address/location.
// -- If no results, it displays a message to that effect.
// -- Otherwise, it formats HTML with the information and constructs
//    a link to the interactive map page using the x/y coordinates
//    for the park&ride lot.
//
// See autocomplete.js for format of the user address choice returned. But is should
// look like this:
/* {"address":"MOA",
    "location":{"x":481130.99999983935,"y":4966789.000100248},
    "score":100,
    "attributes":{"LongLabel":"MOA, Bloomington","Addr_type":"POI","PlaceName":"MOA","Place_addr":"Bloomington",
    "ATIS_ID":"SHP;28582;BLO;A;A;N"},
    "extent":{"xmin":481051.6572536851,"ymin":4966677.683843512,"xmax":481210.34001681313,"ymax":4966900.317349275}
    }
*/

var ParkRideServices = (function($, window, document, undefined) {
	// This service requires map coordinates in UTM
	function findNearestParkRides(findLoc) {
		return $.Deferred(function(dfd) {
			let address =
				findLoc.address +
				'|' +
				findLoc.location.y +
				'|' +
				findLoc.location.x +
				'|';
			let fromATIS = '0';
			if (findLoc.attributes.ATIS_ID.indexOf(';') > -1) {
				fromATIS += findLoc.attributes.ATIS_ID.split(';')[1];
			}
			address += fromATIS;
			let serviceData = {
				category: 'PR',
				's-location': address,
			};
			$.ajax({
				type: 'get',
				url: 'https://www.metrotransit.org/Services/FinderSvc.ashx',
				data: serviceData,
				dataType: 'json',
			})
				.done(function(result, status, xhr) {
					if (result.error) {
						dfd.reject({ Message: result.error });
					} else {
						dfd.resolve(result);
					}
				})
				.fail(function(err) {
					dfd.reject(
						'ParkRideServiceFinder failed - No results ' + err
					);
				});
		}).promise();
	}
	function formatPage(addressChoice) {
		$('#prFinderResults').empty();
		findNearestParkRides(addressChoice)
			.then(function(results) {
				//console.dir(results);
				$('#prFinderResults').append(
					'<p class="result-msg">Nearest Park & Rides to ' +
						addressChoice.attributes.LongLabel +
						'</p>'
				);

				for (let i = 0, l = results.length; i < l; i++) {
					let stop = results[i];
					// create map link
					let ptlatlon = [];
					CoordinateConversion.UTMXYToLatLon(
						parseFloat(stop.Y),
						parseFloat(stop.X),
						15,
						false,
						ptlatlon
					);
					var longitude = CoordinateConversion.RadToDeg(
						ptlatlon[1]
					).toFixed(4);
					var latitude = CoordinateConversion.RadToDeg(
						ptlatlon[0]
					).toFixed(4);
					let mapLink =
						'/imap/interactivemap.aspx?x=' +
						longitude +
						'&y=' +
						latitude +
						'&t=pr';

					$('#prFinderResults').append(`
                <div class="card">
                    <a href="${mapLink}" class="d-flex btn">
                        <p class="d-flex pr-location">${stop.LocationName}&nbsp;(${stop.Distance}&nbsp;mi.)</p>
                        <div class="d-flex ml-auto">
                            <span class="cyan map">Map</span>
                            <img alt="" class="icon arrow-right-blue mr-0" src="./img/svg/arrow-right-blue.svg"/>
                        </div>
                    </a>
                </div>							
                `);
				}
				if (results.length === 0) {
					$('#prFinderResults').append(
						'<p class="result-msg">No Park & Rides close to ' +
							addressChoice.address +
							'</p>'
					);
				}
				sessionStorage.setItem(
					'prFinderResults',
					$('#prFinderResults').html()
				);
			})
			.fail(function(err) {
				$('#prFinderResults').append(
					'<p class="result-msg">No Park & Rides close to ' +
						addressChoice.address +
						'</p>'
				);
			});
	}

	return {
		formatPage: formatPage,
	};
})(jQuery, window, document);

$(function() {
	// This should execute when /park-ride-lots loads, it sets the autocomplete to trigger
	// the page content when user selects a location to search
	if ($('#parkRides').length) {
		AutocompleteAddress.init(
			'parkRidesSearch',
			/*UTMout*/ true,
			function() {
				var choice = AutocompleteAddress.getChoice('parkRidesSearch');
				ParkRideServices.formatPage(choice);
			}
		);
		if (!(sessionStorage.getItem('prFinderResults') === null)) {
			$('#prFinderResults').html(
				sessionStorage.getItem('prFinderResults')
			);
		}
		$('#prUseCurrentLoc').click(function() {
			AutocompleteAddress.getUserLocation().then(function() {
				// get current location
				$('#parkRidesSearch').val('Current Location');
				let userLoc = AutocompleteAddress.setUserLoc('parkRidesFindMe'); // format the location
				if (userLoc) {
					ParkRideServices.formatPage(userLoc); // pass the location to finder service
				}
			});
		});
	}
});
