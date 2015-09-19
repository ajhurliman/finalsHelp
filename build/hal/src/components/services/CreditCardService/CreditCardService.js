
/**
 * @ngdoc service
 * @name olci.services.CreditCardService
 * @description Service that finds and returns a promise for a booking JSON object.
 */
angular.module('olci.services.CreditCardService', [
    'restangular',
    'olci.services.TransformUtilsService',
    'olci.services.SerializeService',
    'ngStorage',
    'ApplicationConfiguration'
])

.config(function( $httpProvider ) {
    $httpProvider.defaults.withCredentials = true;
    $httpProvider.defaults.cache = true;
    $httpProvider.defaults.headers.post = {
        'Accept': 'application/json',
        'client-id': 'secondaryFlow',
        'Content-Type': 'application/x-www-form-urlencoded'
    };
})

.factory('CreditCardService', function( $sessionStorage, Restangular, TransformUtilsService, SerializeService, Configuration, $q ) {
    //TODO: swap country code for current user's country Code
    var creditCardService = {
        creditCardBaseUrl: Restangular.one( 'checkin/v1.0.0' )
            .one( 'companyCode', Configuration.companyCode )
            // .one( 'countryCode', $sessionStorage.currentUser.countryCode )
            .one( 'countryCode', 'US' )
            // .one( 'booking', $sessionStorage.bookingInfo.bookingNumber )
            .one( 'booking', 'accounts'),
            // .all( 'accounts'),

        eComBaseUrl: Restangular.one( 'creditcard/v1.0.0', Configuration.companyCode ),

        removeCard: function( card ) {
            var deferred = $q.defer();
            var cardToRemove = card.toString();

            creditCardService.creditCardBaseUrl.customDELETE( 'payers/' + cardToRemove ).then(
                function( res ) {
                    console.log( 'card deleted: ', res );
                    deferred.resolve( res );
                }, function( err ) {
                    console.log( err );
                    deferred.reject( err );
                    //TODO: broadcast some error
                });
            return deferred.promise;
        },

        getEncryptedCard: function( ccNumber ) {
            var self = this;
            return self.eComBaseUrl.post('encryptCreditCard', { "ccNumber": ccNumber}, null, {'Content-Type': 'application/json'});
        },

        addCard: function( card, ccType, passenger ) {
            var deferred = $q.defer();

            var type = getCardTypeCode( ccType );
            var self = this;

            creditCardService.getEncryptedCard( card.ccNumber ).then(function( res ) {
                var newCard = {
                    "checkinPayer": {
                        "idCheckin": passenger.CheckInPassenger.idCheckin.toString(),
                        "guestId": $sessionStorage.bookingInfo.bookingNumber + zeroPad( passenger.seqNumber ) + passenger.CheckInPassenger.product,
                        "firstName": passenger.firstName,
                        "lastName": passenger.lastName,
                        "creditCardLastFour": card.ccNumber.slice(-4),
                        "creditCardType": type,
                        "creditCardExpireMonth": card.expDate.substr(0,2),
                        "creditCardExpireYear": card.expDate.slice(-4),
                        "creditCardNumber": res.encryptedCC,
                        "creditCardName": card.ccName,
                        "address1": card.address.street1,
                        "address2": card.address.street2,
                        "nameCity": card.address.city,
                        "codeState": card.address.state,
                        "codeZip": card.address.zip,
                        "codeCountry": SerializeService.serializeCountry( card.address.country ),
                        "codeCo": Configuration.companyCode
                    },
                    "bookingNumber": $sessionStorage.bookingInfo.bookingNumber,
                    "paxSequence": passenger.seqNumber,
                    "sailingId": $sessionStorage.bookingInfo.sailingId
                };

                self.creditCardBaseUrl.customPOST( newCard, 'payers', null, { 'Content-Type': 'application/json' } ).then(
                    function( card ) {
                        deferred.resolve( card );
                    },
                    function( error )  {
                        console.error( error );
                        deferred.reject( error );
                    });
            });

            
            return deferred.promise;
        },

        addCoveredGuest: function( coveredGuest, card, bookingNumber, sailingId ) {
            var deferred = $q.defer();

            var newCovered = {
                "checkinCovered": {
                    "idCheckinPayer": card.idCheckinPayer,
                    "firstName": coveredGuest.firstName,
                    "lastName": coveredGuest.lastName,
                    "codeCo": Configuration.companyCode
                },
                "bookingNumber": bookingNumber,
                "paxSequence": coveredGuest.seqNumber,
                "sailingId": sailingId
            };

            creditCardService.creditCardBaseUrl.customPOST( newCovered, 'coveredPassengers', null, {'Content-Type': 'application/json'} )
                .then(function( covering ) {
                    deferred.resolve( covering );
                }, function( err ) {
                    console.log( err );
                    deferred.reject( err );
                });

            return deferred.promise;
        },

        removeCoveredGuest: function( idCheckinCovered ) {
            return creditCardService.creditCardBaseUrl.customDELETE( 'coveredPassengers/' + idCheckinCovered )
                .then(function ( res ) {
                    return res;
                }, function ( err ) {
                    return err;
                });
        },

        refreshCheckinCovered: function() {
            return creditCardService.creditCardBaseUrl.customGET('payers/coveredPassengers').then(function( checkInPassengers ) {
                return checkInPassengers;
            });
        },

        refreshAccounts: function() {
            return creditCardService.creditCardBaseUrl.get().then(function( accounts ) {
                return accounts;
            });
        }
    };

    function getCardTypeCode( type ) {
        var cardTypes = {
            'VISA': 'VI',
            'MASTERCARD': 'MC',
            'DISCOVER': 'DC',
            'AMERICANEXPRESS': 'AX',
            'DINERSCLUB': 'DC'
        };
        type = type.toUpperCase();
        return cardTypes[type];
    }

    function zeroPad( n, width, z ) {
        z = z || '0';
        width = width || 2;
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }

    return creditCardService;


});
