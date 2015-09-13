
/**
 * @ngdoc service
 * @name olci.services.GetCopyService
 * @description Service that finds and returns a promise copy strings.
 */
angular.module('olci.services.GetCopyService', [
        'vendor.steelToe'
    ])

.factory('GetCopyService', function($http, $sessionStorage, $q, steelToe) {
    var COPY_ENDPOINT = './assets/copy/copy.json',
        VISA_ENDPOINT = './assets/copy/visanotification_modal_inc-3.json',
        SUMMARY_LINKS_ENDPOINT = './assets/copy/summary_links.json',
        AIRPORT_CITIES_ENDPOINT = './assets/copy/airportCitiesExclusions.json';
    return {
        itineraryCopy: function() {
            var destCode = steelToe.do($sessionStorage).get('bookingInfo.destinationCode');// ? $sessionStorage.bookingInfo.destinationCode.slice(0, 1) : '';
            return $http
                    .get( COPY_ENDPOINT )
                    .then(
                        function (res) {
                            return res.data.itineraryPhotoCopy[destCode];
                        },
                        function () {
                            // TODO: Error handling.
                        }
                    );
            // return assetsData.itineraryPhotoCopy[destCode] ? assetsData.itineraryPhotoCopy[destCode] : {title:'', body:''} ;
        },

        visaNotificationCopy: function() {
            return $http
                    .get( VISA_ENDPOINT )
                    .then(
                        function (res) {
                            return res.data.default;
                        },
                        function () {
                            // TODO: Error handling.
                        }
                    );
        },

        summaryLinksCopy: function( linkNum ) {
            return $http
                    .get( SUMMARY_LINKS_ENDPOINT )
                    .then(
                        function (res) {
                            return res.data.summaryLinkCopy[linkNum];
                        },
                        function () {
                            // TODO: Error handling.
                        }
                    );
        },

        airportCitiesExclusions: function() {
            return $http
                    .get( AIRPORT_CITIES_ENDPOINT )
                    .then(
                        function (res) {
                            return res.data.airportCitiesExclusions;
                        },
                        function () {
                            // TODO: Error handling.
                        }
                    );
        }
    };
});
