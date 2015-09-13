angular.module('olci.services.SerializeService', [
    'ngStorage',
    'ApplicationConfiguration',
    'olci.services.SharedDataService'
])

.factory('SerializeService', function( $sessionStorage, Configuration, SharedDataService ) {
    var countries = SharedDataService.getCountries();
    return {

        serializeCountry: function( countryLabel ) {
            var countryCode;
            countries.forEach( function( element, index ){
                if ( element.name === countryLabel ) {
                    countryCode = element.code;
                }
            });
            return countryCode;
        }
    };
});