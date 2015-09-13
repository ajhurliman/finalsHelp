angular.module( 'olci.services.DeserializeService', [
    'ngStorage',
    'ApplicationConfiguration',
    'olci.services.TransformUtilsService',
    'olci.services.SharedDataService',
    'vendor.steelToe',
    'angular-momentjs'
])

.factory( 'DeserializeService', function( $sessionStorage, Configuration, TransformUtilsService, SharedDataService, $q, steelToe, MomentJS ) {
    // var countries = SharedDataService.getCountries();

    deserializeService = {
        deserializePolar: function( inputPolar, target ) {
            var deferred = $q.defer();
            var input = angular.copy( inputPolar );
            console.dir( inputPolar );
            target.guest = target.guest || [];

            var rootPaths = [
                {write: 'bookingNumber', read: 'bookingNumber'},
                {write: 'bookingStatus', read: 'bookingStatus'},
                {write: 'fromPortName', read: 'fromPortName'},
                {write: 'fromPortCode', read: 'fromPortCode'},
                {write: 'sailingId', read: 'sailingId'},
                {write: 'synchronizationID', read: 'synchronizationID'},
                {write: 'shipName', read: 'shipName'},
                {write: 'shipCode', read: 'shipCode'},
                {write: 'stateroomCategory', read: 'stateroomCategory'},
                {write: 'stateroomType', read: 'stateroomType'},
                {write: 'stateroomNumber', read: 'stateroomNumber'},
                {write: 'toPortName', read: 'toPortName'},
                {write: 'toPortCode', read: 'toPortCode'},
                {write: 'tripDays', read: 'tripDays'},
                {write: 'itineraryName', read: 'itineraryName'},
                {write: 'currencyCode', read: 'currencyCode'},
                {write: 'currencyName', read: 'currencyName'},
                {write: 'currencySymbol', read: 'currencySymbol'},
                {write: 'rateCode', read: 'rateCode'},
                {write: 'rateName', read: 'rateName'},
                {write: 'depositPaid', read: 'depositPaid'},
                {write: 'fullPaymentPaid', read: 'fullPaymentPaid'},
                {write: 'webItineraryId', read: 'webItineraryId'},
                {write: 'allowEU', read: 'allowEU'},
                {write: 'travelInitiativeType', read: 'travelInitiativeType'},
                {write: 'destinationCode', read: 'destinationCode'},
                {write: 'destinationName', read: 'destinationName'},
                {write: 'bookingDate', read: 'bookingDate'},
                {write: 'sailDate', read: 'sailDate'},
                {write: 'disembarkDate', read: 'disembarkDate'},
                {write: 'totalCruiseFareAmt', read: 'totalCruiseFareAmt'},
                {write: 'deckCode', read: 'cabinInfo.deckCode'},
                {write: 'cabinNumber', read: 'cabinInfo.cabinNumber'},
                {write: 'cabinType', read: 'cabinInfo.cabinType'},
                {write: 'hasPRC', read: 'hasPRC'}, //TODO: find out where this is in POLAR, THIS ISN'T CORRECTLY MAPPED
            ];
            TransformUtilsService.transformObject( input, target, rootPaths );

            //TODO: no clue what's going on with cabin locations. the data is completely inconsistent.
            //recreate errors with CLCMCQ, LOKI
            if ( steelToe.do( input ).get( 'cabinInfo.cabinLocations' )) {
                // target.cabinLocationName    = steelToe.do(input).get( 'cabinInfo.cabinLocations' ).filter(function(obj){return obj.code === target.cabinType;})[0].description;
                target.cabinLocationName = target.cabinType;
            }
            
            input.checkinGuests.map(function( singleGuest ) {
                var seqNum = singleGuest.seqNumber - 1;
                target.guest[ seqNum ] = target.guest[ seqNum ] || {};
                var guestObj = target.guest[ seqNum ];
                guestObj.guestFlightDetails = {};
                guestObj.transportationAssignments = {
                    origin: false,
                    terminal: false
                };

                var basicPaths = [
                    {write: 'title', read: 'title.code'},
                    {write: 'firstName', read: 'firstName'},
                    {write: 'middleName', read: 'middleName'},
                    {write: 'lastName', read: 'lastName'},
                    {write: 'pastGuestNumber', read: 'pastGuestNumber'},
                    {write: 'rateCode', read: 'rateCode'},
                    {write: 'age', read: 'age.amount'},
                    {write: 'gender', read: 'gender.description'},
                    {write: 'seqNumber', read: 'seqNumber'},
                    {write: 'eRef', read: 'eRef'},
                    {write: 'statusDescription', read: 'statusDescription'},
                    {write: 'nationality', read: 'nationality.code'},
                    {write: 'residencyInd', read: 'residencyInd'},
                    {write: 'countryOfResidence', read: 'countryOfResidence.code'},
                    {write: 'contactPhone', read: 'contactPhone.number'},
                    {write: 'birthDate', read: 'birthDate.value'},
                    {write: 'homeCity', read: 'homeCity.code'}
                ];
                TransformUtilsService.transformObject( singleGuest, guestObj, basicPaths );

                // the dropdowns use country name, not code; this transforms code to name
                guestObj.nationality = deserializeService.deserializeCountry( guestObj.nationality );
                guestObj.countryOfResidence = deserializeService.deserializeCountry( guestObj.countryOfResidence );

                // parse birthday
                if (guestObj.birthDate) {
                    guestObj.birthDate = deserializeService.deserializeDate( guestObj.birthDate );
                }

                var pastGuestLoyalty = angular.copy( singleGuest.pastGuestLoyalty ) || '';
                guestObj.pastGuestLoyalty = _wordToNum( pastGuestLoyalty.split( ' ' )[0] );


                //addresses are in an array; they don't come in a consistent order so we need to 
                //iterate through the array and find if it's home or destination address
                singleGuest.address.map( function( address ) {
                    var homePaths = [
                        {write: 'street1', read: 'street1'},
                        {write: 'street2', read: 'street2'},
                        {write: 'street3', read: 'street3'},
                        {write: 'houseName', read: 'houseName'},
                        {write: 'city', read: 'city.value'},
                        {write: 'state', read: 'stateName'},
                        {write: 'country', read: 'countryCode'},
                        {write: 'zipCode', read: 'zipCode'},
                        {write: 'phone', read: 'phone.number'}
                    ];
                    if ( address.addressType === 'H' ) {
                        guestObj.homeAddress = {};
                        TransformUtilsService.transformObject( address, guestObj.homeAddress, homePaths );
                        guestObj.homeAddress.country = deserializeService.deserializeCountry( guestObj.homeAddress.country );
                        // guestObj.homeAddress.state = assignState(guestObj.homeAddress.state).then(function(result){guestObj.homeAddress.state = result;});
                    } 
                    if ( address.addressType === 'D' ) {
                        guestObj.destAddress = {};
                        TransformUtilsService.transformObject( address, guestObj.destAddress, homePaths );
                        guestObj.destAddress.country = deserializeService.deserializeCountry( guestObj.destAddress.country );
                        // guestObj.destAddress.state = assignState(guestObj.destAddress.state).then(function(result){guestObj.destAddress.state = result;});
                    }
                });

                if ( steelToe.do( singleGuest ).get( 'guestFlightDetails' ) ) {
                    //flights are in an array; they don't come in a consistent order so we need to
                    //iterate through the array and find if it's home or destination address
                    singleGuest.guestFlightDetails.map( function( flight ) {
                        var oldFlight;
                        var newFlight;

                        var flightPaths = [
                            {write: 'departCityCode', read: 'departCityCode'},
                            {write: 'arriveCityCode', read: 'arriveCityCode'},
                            {write: 'carrierName', read: 'carrierName'},
                            {write: 'flightNumber', read: 'flightNumber'},
                            {write: 'departureDate', read: 'departureDate'},
                            {write: 'arrivalDate', read: 'arrivalDate'},
                            {write: 'departureTime', read: 'departureTime'},
                            {write: 'arrivalTime', read: 'arrivalTime'}  
                        ];

                        if ( flight.directionCode === 'O' ) {
                            guestObj.guestFlightDetails.originFlight = {};
                            newFlight = guestObj.guestFlightDetails.originFlight;
                            oldFlight = flight.flightSegmentDetail;

                            TransformUtilsService.transformObject( oldFlight, newFlight, flightPaths );

                            newFlight.departureDate = deserializeService.deserializeDate( newFlight.departureDate );
                            newFlight.arrivalDate = deserializeService.deserializeDate( newFlight.arrivalDate );
                            newFlight.departureTime = _deserializeTime( newFlight.departureTime );
                            newFlight.arrivalTime = _deserializeTime( newFlight.arrivalTime );

                            // guestObj.guestFlightDetails.originFlight = {
                            //     departCityCode: flight.flightSegmentDetail.departCityCode,
                            //     arriveCityCode: flight.flightSegmentDetail.arriveCityCode,
                            //     carrierName: flight.flightSegmentDetail.carrierName,
                            //     flightNumber: flight.flightSegmentDetail.flightNumber,
                            // };
                            // guestObj.guestFlightDetails.originFlight.departureDate = deserializeService.deserializeDate( flight.flightSegmentDetail.departureDate );
                            // guestObj.guestFlightDetails.originFlight.arrivalDate = deserializeService.deserializeDate( flight.flightSegmentDetail.arrivalDate );
                            // guestObj.guestFlightDetails.originFlight.departureTime = _deserializeTime( flight.flightSegmentDetail.departureTime );
                            // guestObj.guestFlightDetails.originFlight.arrivalTime = _deserializeTime( flight.flightSegmentDetail.arrivalTime );
                        }
                        else if ( flight.directionCode === 'T' ) {
                            guestObj.guestFlightDetails.terminalFlight = {};
                            newFlight = guestObj.guestFlightDetails.terminalFlight;
                            oldFlight = flight.flightSegmentDetail;

                            TransformUtilsService.transformObject( oldFlight, newFlight, flightPaths );

                            newFlight.departureDate = deserializeService.deserializeDate( newFlight.departureDate );
                            newFlight.arrivalDate = deserializeService.deserializeDate( newFlight.arrivalDate );
                            newFlight.departureTime = _deserializeTime( newFlight.departureTime );
                            newFlight.arrivalTime = _deserializeTime( newFlight.arrivalTime );
                        }
                    });
                }

                //we only need to determine if they have EZ-Air flights or not, we don't need any details about it
                if ( steelToe.do( singleGuest ).get( 'transportationAssignments' ) ) {
                    singleGuest.transportationAssignments.map(function(flight) {
                        if (flight.directionCode === "O") {
                            guestObj.transportationAssignments.origin = true;
                        } else if (flight.directionCode === "T") {
                            guestObj.transportationAssignments.terminal = true;
                        }
                    });
                }

                // Immigration data - passport, etc.
                if ( steelToe.do( singleGuest ).get( 'immigrationDocInfo' ) ) {
                    guestObj.immigrationDocInfo = {
                        // documentType          : docTypes.deserialize( steelToe.do( singleGuest ).get( 'immigrationDocInfo.documentType' ) ),
                        documentNumberConfirm : steelToe.do( singleGuest ).get( 'immigrationDocInfo.documentNumber' )
                    };
                    guestObj.immigrationDocInfo.documentType = docTypes.deserialize( steelToe.do( singleGuest ).get( 'immigrationDocInfo.documentType' ) ).then( function (result) { guestObj.immigrationDocInfo.documentType = result; });

                    var immigrationPaths = [
                        { write : 'issueCountryCode', read : 'issueCountryCode' },
                        // { write : 'issueCountryName', read : 'issueCountryName' },
                        { write : 'issueCityName',    read : 'issueCityName' },

                        { write : 'birthCountryCode', read : 'birthCountryCode' },
                        { write : 'birthCountryName', read : 'birthCountryName' },

                        // { write : 'documentType',     read : 'documentType' },
                        { write : 'documentNumber',   read : 'documentNumber' },
                        { write : 'expirationDate',   read : 'expirationDate' },
                        { write : 'issueDate',        read : 'issueDate' }
                        // TODO: placeOfBirth            - "checkinWebDb": { "checkinPassengers": [ { "placeOfBirth": null
                        // emergencyAir            - "checkinWebDb": { "checkinPassengers": [ { "emergencyAir": "PHX"
                        // termsConditionsVisaFlag - "checkinWebDb": { "checkinPassengers": [ { "immigrationCompleteFlag": 1435441465000
                        // langPrefCode            - "checkinWebDb": { "checkinPassengers": [ { "langPrefCode": "en"
                        // TODO: usingBirthCertificate   - "checkinWebDb": { "checkinPassengers": [ { "usingBirthCertificate": "N"
                        
                        // TODO: Visa place of issuance
                        // TODO: Visa control number
                        // TODO: Visa issue date
                        // TODO: Visa expire date

                        // TODO: permResident
                        // TODO: permResidentCardNumber
                    ];
                    TransformUtilsService.transformObject( singleGuest.immigrationDocInfo, guestObj.immigrationDocInfo, immigrationPaths );
                    guestObj.immigrationDocInfo.issueCountryCode = deserializeService.deserializeCountry( guestObj.immigrationDocInfo.issueCountryCode );
                }
                

                // Not sure if every guest is going to have a notification.
                if ( singleGuest.notifications ) {
                    guestObj.notifications = [];
                    singleGuest.notifications.map(function(notification) {
                        guestObj.notifications.push(notification);
                    });
                }
                else {
                    guestObj.notifications = [{"notification": ""}];
                }

                //add page states to each guest
                guestObj.pageStates = {
                    details: {},
                    passport: {},
                    flights: {
                        transferProps: {} //these are the state properties that get copied when you click "Same as main passenger"
                    },
                    emergency: {},
                    account: {
                        cc: {}
                    },
                    contract: {},
                    preferences: {
                        diet: {},
                        medical: {},
                        celebrations: {},
                        benefits: {}
                    },
                    summary: {}
                };
            });

            //emergency contacts for each passenger are stored in a separate array
            if ( input.emergencyContacts ) {
                input.emergencyContacts.map(function( contact ) {
                    //indexing here is consistent with the approach used above while creating each user
                    var guest = target.guest[ contact.sequenceNumber - 1 ]; 
                    guest.emergencyContact = {
                        phone : steelToe.do( contact ).get( 'contactPhones' ) ? steelToe.do( contact.contactPhones[ 0 ] ).get( 'number' ) : ''
                    };
                    guest.emergencyContact.relationship = relationships.deserialize( steelToe.do(contact).get( 'relationship' ) ).then( function (result) { guest.emergencyContact.relationship = result; });

                    var contactPaths = [
                        { write : 'lastName', read : 'lastName' },
                        { write : 'street1',  read : 'guestAddress.street1' },
                        { write : 'street2',  read : 'guestAddress.street2' },
                        { write : 'street3',  read : 'guestAddress.street3' },
                        { write : 'city',     read : 'guestAddress.city' },
                        { write : 'state',    read : 'guestAddress.state' },
                        { write : 'country',  read : 'guestAddress.country' },
                        { write : 'zip',      read : 'guestAddress.zip' },
                        { write : 'email',    read : 'guestAddress.email' }
                    ];

                    TransformUtilsService.transformObject( contact, guest.emergencyContact, contactPaths );
                    guest.emergencyContact.country = deserializeService.deserializeCountry( guest.emergencyContact.country );
                });
            }

            deferred.resolve( target );
            return deferred.promise;
        },

        //webDb: Serialized data from webDb to be deserialized
        //target: Repository for deserialized info. Most of the time it's $sessionStorage.bookingInfo,
        //  but AccountsController uses it too to deal with covering guests on other bookings
        deserializeWebDb: function( webDb, target ) {
            var deferred = $q.defer();
            getAirportCities = airportCities();

            //backend is injecting trailing whitespace into this entry
            if ( webDb.coveredPassengers ) {
                webDb.coveredPassengers.map(function( covering ) {
                    covering.guestId = covering.guestId.trim();
                });
            }

            target.checkInPayer = angular.copy(webDb.checkinPayers) || [];
            target.checkInCovered = angular.copy(webDb.coveredPassengers) || [];

            // delete vestigial cards and coverings
            target.guest.map(function( guest ) {
                guest.checkInCovered = null;
                guest.checkInPayer = null;
            });

            //copy each CheckInPassenger and assign them to their respective guest
            webDb.checkinPassengers.map(function( passenger ) {
                var seqNum = passenger.paxSequence - 1;
                target.guest[ seqNum ] = target.guest[ seqNum ] || {};
                target.guest[ seqNum ].CheckInPassenger = angular.copy( passenger ); //TODO: break these out into elements and transform dates

                //assign cards to passengers (shallow copy of checkInPayer)
                if (target.checkInPayer) {
                    target.checkInPayer.map(function( card ) {
                        if ( card.idCheckin === passenger.idCheckin ) {
                            passenger.checkInPayer = card;
                        }
                    });
                }

                if ( target.guest[ seqNum ].CheckInPassenger.langPrefCode ) {
                    target.guest[ seqNum ].CheckInPassenger.langPrefCode = languages.deserialize( target.guest[ seqNum ].CheckInPassenger.langPrefCode ).then( function( result ){ target.guest[seqNum].CheckInPassenger.langPrefCode = result; });
                }
                    
                if ( target.guest[seqNum].CheckInPassenger.emergencyAir ) {
                    target.guest[ seqNum ].CheckInPassenger.emergencyAir = getAirportCities.deserialize( target.guest[seqNum].CheckInPassenger.emergencyAir ).then( function( result ){ target.guest[seqNum].CheckInPassenger.emergencyAir = result;});
                }
                
            });

            //attach coverings to their respective guests, if they match then tag them as being accounted for on this booking
            if (target.checkInCovered.length > 0) {
                target.checkInCovered.map(function( covering ) {
                    //attach cc info to covering
                    covering.cardDetails = getCardDetails( covering, target.checkInPayer );

                    //attach covering to passenger. if successful, guest.onThisBooking = true
                    matchCoveringWithPassenger( target.guest, covering, target.bookingNumber, target.sailingId );
                });
            }

            
            if (target.checkInPayer.length > 0) {
                target.checkInPayer.map(function( payer ) {
                    //transform credit card codes into names
                    payer.creditCardType = getCardTypeName( payer.creditCardType );
                    //add credit cards to their owners if they're on this booking
                    matchPayerWithPassenger( $sessionStorage.bookingInfo.guest, payer );
                });
            }
            
            deferred.resolve(target);
            return deferred.promise;

        },

        deserializeCountry: function( countryCode ) {
            var countryName;
            var countryList = SharedDataService.getCountries();
            countryList.forEach( function( element, index ){
                if ( element.code === countryCode ) {
                    countryName = element.name;
                }
            });
            return countryName;
        },

        deserializeDate: function( dateString ) {
            if (!dateString) return;
            var month = dateString.slice(0, 2);
            var date = dateString.slice(2, 4);
            var year = dateString.slice(4, 8);
            return MomentJS(dateString, ['MMDDYYYY', 'MM-DD-YYYY', MomentJS.ISO_8601]).toDate();
        }

    };

    //convert number-words into strings
    var numberWords = [ 'zero','one','two','three','four','five' ];
    function _wordToNum( word ) {
        word = word.toLowerCase();
        return numberWords.indexOf( word );
    }

    function _deserializeTime( timeString ) {
        if (!timeString) return '';
        var timeObj = {};
        timeObj.hour = timeString.slice(0, 2);
        timeObj.minute = timeString.slice(2, 4);
        return timeObj;
    }

    function deserializeValue( promise ) {
        if ( !promise ) { return ''; }

        return function ( code ) {
            if ( !code ) { return ''; } // TODO: Revisit this when a guest doesn't have an emergency contact.

            var returnPromise = promise.then( function ( result ) {
                var returnObj = false;

                result.forEach( function ( obj, index, arr ) {
                    if ( code.toUpperCase() === obj.code.toUpperCase() ) {
                        returnObj = obj.label;
                    }
                });

                if ( returnObj ) {
                    return returnObj;
                }
                else {
                    return '';
                }
                
            }).catch( function () {
                console.error( 'deserializePromise failed' );
            });
    
            return returnPromise;
        };
    }

    function getCardTypeName( code ) {
        var cardTypes = {
            'VI': 'VISA',
            'MC': 'MASTERCARD',
            'DC': 'DISCOVER',
            'AX': 'AMERICANEXPRESS'
        };
        code = code.toUpperCase();
        return cardTypes[ code ];
    }

    function matchCoveringWithPassenger( guests, covering, bookingNumber, prodCode ) {
        if ( guests.length < 1 || !covering ) return;
        // var seqNum = covering.guestId.slice( 7, 8 );

        for ( var i = 0; i < guests.length; i++ ) {
            var guestId = bookingNumber + 
                TransformUtilsService.zeroPad( guests[i].seqNumber ) + 
                prodCode.slice( 0, 4 );

            if ( guestId === covering.guestId ) {
                covering.onThisBooking = true;
                guests[i].checkInCovered = covering;
            }
        }
    }

    function getCardDetails( covering, cards, otherCards ) {
        if ( covering.length < 1 || cards.length < 1 ) return;
        var cardDetails = {};
        for ( var i = 0; i < cards.length; i++ ) {
            if ( cards[ i ].idCheckinPayer === covering.idCheckinPayer ) {
                cardDetails.cardOwnerName = cards[ i ].firstName + ' ' + cards[ i ].lastName;
                cardDetails.lastFour = cards[ i ].creditCardLastFour;
                cardDetails.cardType = getCardTypeName( cards[ i ].creditCardType );
                return cardDetails;
            } else if ( otherCards[ i ].idCheckinPayer === covering.idCheckinPayer ) {
                cardDetails.cardOwnerName = otherCards[ i ].firstName + ' ' + otherCards[ i ].lastName;
                cardDetails.lastFour = otherCards[ i ].creditCardLastFour;
                cardDetails.cardType = getCardTypeName( otherCards[ i ].creditCardType );
            }
        }
    }

    function matchPayerWithPassenger( guests, payer ) {
        if ( guests.length < 1 || !payer ) return;
        var seqNum = payer.guestId.slice( 7, 8 );

        for ( var i = 0; i < guests.length; i++ ) {
            if ( guests[i].seqNumber === seqNum) {
                guests[i].checkInPayer = payer;
                return;
            }
        }
    }

    var relationships = ( function () {
        var values = SharedDataService.getRelationships()
            .then( function( result ) {
                return result;
            })
            .catch( function () {
                console.error( 'SharedDataService.getRelationships request failed' );
            });

        return {
            getRelationships: function () {
                return values;
            },

            deserialize: deserializeValue( values )
        };
    })();

    var docTypes = ( function () {
        var values = SharedDataService.getDocTypes()
            .then( function( result ) {
                return result;
            })
            .catch( function () {
                console.error( 'SharedDataService.getDocTypes request failed' );
            });

        return {
            deserialize: deserializeValue( values )
        };
    })();

    var languages = ( function () {
        var values = SharedDataService.getSafetyLanguages()
            .then( function( result ) {
                return result;
            })
            .catch( function () {
                console.error( 'SharedDataService.getSafetyLanguages request failed' );
            });

        return {
            getLanguages: function () {
                return values;
            },

            deserialize: deserializeValue( values )
        };
    })();

    var airportCities = function () {
        var values = SharedDataService.getAirportCities()
            .then( function(result) {
                var returnValues = result.map( function ( city ) {
                    return { "label": city.value, "code": city.key };  
                });
                return returnValues;
            })
            .catch( function () {
                console.error( 'SharedDataService.getAirportCities request failed' );
            });
        
        return {
            getAirportCities: function () {
                return values;
            },

            deserialize: deserializeValue( values ) 
        };
    };    

    return deserializeService;
}); 