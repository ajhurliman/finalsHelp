
/**
 * @ngdoc service
 * @name olci.services.FindBookingService
 * @description Service that finds and returns a promise for a booking JSON object.
 */
angular.module( 'olci.services.FindBookingService', [
    'restangular',
    'olci.services.DataTransformService',
    'olci.services.DeserializeService',
    'olci.services.LoyaltyService',
    'olci.services.TransformUtilsService',
    'ApplicationConfiguration',
    'ngStorage',
    'vendor.steelToe'
])

.config(function($httpProvider) {
    // $httpProvider.defaults.withCredentials = true;
    // $httpProvider.defaults.cache = true;
    $httpProvider.defaults.headers.post = {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
    };
})

.factory( 'FindBookingService', function( $http, $sessionStorage, Restangular, DataTransformService, DeserializeService, $q, Configuration, TransformUtilsService, steelToe ) {
    var findBookingService = {};
    var travelOptionsBaseUrl = Restangular.one();
    var country = steelToe.do( $sessionStorage ).get( 'currentUser.country' ) || 'US';
    var authenticationBaseUrl = Restangular.one( 'authentication/v1.0.0' ).one( 'companyCode', Configuration.companyCode );
    var onlineCheckinBaseUrl = Restangular.one( 'checkin/v1.0.0' ).one( 'companyCode', Configuration.companyCode ).one( 'countryCode', country );
    var bookingBaseUrl = Restangular.one( 'guest/v1.0.0/booking' ).one( 'companyCode', Configuration.companyCode );

    findBookingService.putPolar = function() {
        var putObject = DataTransformService.serializePolar( $sessionStorage.bookingInfo );

        return onlineCheckinBaseUrl.customPUT(putObject, 'booking' ).then(
            function( res ) {
                console.log( res );
                $sessionStorage.bookingInfo.synchronizationID = res.bookingStatusDescription;
            });
    };

    findBookingService.authenticate = function( bookingNumber, lastName ) {
        var header = {
            "Content-Type": "application/x-www-form-urlencoded"
        };

        var authData = TransformUtilsService.transformRequestObject({
            "key": bookingNumber,
            "secret": lastName
        });

        var deferred = $q.defer();

        authenticationBaseUrl.customPOST( authData, undefined, undefined, header )
            .then(
                function( data ) {
                    console.log( data );
                    deferred.resolve( data );
                }, function ( error ) {
                    deferred.reject( error );
                });

        return deferred.promise;
    };


    function serializeData( data ) { 
        // If this is not an object, defer to native stringification.
        if ( ! angular.isObject( data ) ) { 
            return( ( data === null ) ? "" : data.toString() ); 
        }

        var buffer = [];

        // Serialize each key in the object.
        for ( var name in data ) { 
            if ( ! data.hasOwnProperty( name ) ) continue; 

            var value = data[ name ];

            buffer.push(
                encodeURIComponent( name ) + "=" + encodeURIComponent( ( value === null ) ? "" : value )
            ); 
        }

        // Serialize the buffer and clean it up for transportation.
        var source = buffer.join( "&" ).replace( /%20/g, "+" ); 
        return( source ); 

    }


    findBookingService.lookupPolar = function( bookingNumber ) {
        var deferred = $q.defer();

        onlineCheckinBaseUrl.customGET( 'booking' ).then(
            function( bookingSummary ) {
                deferred.resolve( bookingSummary );
            },
            function( error )  {
                console.error( error );
                deferred.reject( error );
            });

        return deferred.promise;
    };

    findBookingService.lookupWebDb = function( bookingNumber ) {
        //lookup webdb
    };

    findBookingService.lookupWebDbMock = function( credentials ) {
        var deferred = $q.defer();
        deferred.resolve( rotten );
        return deferred.promise;
    };

    findBookingService.lookupSiebelMock = function( credentials ) {
        return siebelUsers[ credentials.lastName ];
    };

    findBookingService.lookupFidelioMock = function( credentials ) {
        // return fidelioUsers[credentials.lastName];
    };

    findBookingService.findPolar = function( credentials, target, bookingNumber ) {
        findBookingService.lookupPolar(credentials).then(function(polar) {
            DeserializeService.deserializePolar(polar, target);
        });
    };

    findBookingService.findWebDb = function( credentials, target, bookingNumber ) {
        findBookingService.lookupWebDbMock( credentials ).then(function( webDb ) {
            DataTransformService.deserializeWebDb( webDb, target );
        });
    };

    findBookingService.findPolarAndWebDb = function( target ) {
        var deferred = $q.defer();
        onlineCheckinBaseUrl.customGET( 'booking/all' ).then(
            function( bookingSummary ) {
              var p = DeserializeService.deserializePolar( bookingSummary.checkin, target );
              var w = DeserializeService.deserializeWebDb( bookingSummary.onboardAccounts, target  );
              var data = { a: p, b: w };
              deferred.resolve( data );
            },
            function( error )  {
                console.error( error );
                deferred.reject( error );
            });
        return deferred.promise;
    };

    findBookingService.findOtherBookingPolarAndWebDb = function( credentials, target ) {
        var deferred = $q.defer();
        onlineCheckinBaseUrl.one( 'booking/sailingId', credentials.sailingId )
            .one( 'otherBooking', credentials.bookingNumber )
            .one( 'lastName', credentials.lastName )
            .get()
            .then(function( bookingSummary ) {
                var p = DeserializeService.deserializePolar( bookingSummary.checkin, target );
                // var w = DataTransformService.deserializeWebDb( bookingSummary.)
                deferred.resolve(p);
            });
        return deferred.promise;
    };

    findBookingService.findSiebel = function( credentials, target ) {
        //find siebel here
    };

    findBookingService.findFidelioMock = function( credentials, target ) {
        //find fidelio here
    };

    return findBookingService;
});

