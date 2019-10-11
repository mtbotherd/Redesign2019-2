// StopServices handles formatting the results of an address
// autocomplete search on the stops-stations page.
//
// formatPage deletes an previous page results then:
// -- calls the Finder service to get any stop locations
//    near the requested address/location.
// -- If no results, it displays a message to that effect.
// -- Otherwise, it formats HTML with the information and constructs
//    a link to the interactive map page using the stop number
//    as a parameter
// See autocomplete.js for format of the user address location returned. But is should 
// look like this:
/* {"address":"MOA",
    "location":{"x":481130.99999983935,"y":4966789.000100248},
    "score":100,
    "attributes":{"LongLabel":"MOA, Bloomington","Addr_type":"POI","PlaceName":"MOA","Place_addr":"Bloomington",
    "ATIS_ID":"SHP;28582;BLO;A;A;N"},
    "extent":{"xmin":481051.6572536851,"ymin":4966677.683843512,"xmax":481210.34001681313,"ymax":4966900.317349275}
    }
*/
// =============================================================
var StopServices = (function($,  window, document, undefined) {
    // This service requires map coordinates in UTM 
    function findNearestStops (findLoc) {
        return $.Deferred(function (dfd) {
            let address = 
            findLoc.address 
            + "|"
            + findLoc.location.y
            + "|"
            + findLoc.location.x
            + "|";
            let fromATIS = '0';
			if (findLoc.attributes.ATIS_ID.indexOf(';')>0) {
			    fromATIS += findLoc.attributes.ATIS_ID.split(';')[1];
            }
            address += fromATIS;
            let serviceData = {
                's-location': address
            }
            $.ajax({
				type: 'get',
				url: 'https://www.metrotransittest.org/Services/ServiceFinderSvc.ashx',
				data: serviceData,
				dataType: "json"
            })
            .done(function (result, status, xhr) {
                if (result.error) {
                    dfd.reject({'Message': result.error});
                } else {
                    dfd.resolve(result);
                }
            })
            .fail(function(err) {
                dfd.reject("StopServiceFinder failed - No results " + err);
            });
        }).promise();
    }
    function formatPage (addressChoice) {
        console.log("Formatting page");
        findNearestStops(addressChoice) 
        .then(function(result){
            console.dir(result);
        })
        .fail(function(err) {});
    }

    return {
        formatPage: formatPage
    };
})(jQuery, window, document);
