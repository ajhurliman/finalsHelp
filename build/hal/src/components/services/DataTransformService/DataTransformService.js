/**
 * @ngdoc service
 * @name olci.services.DataTransformService
 * @description Service that serializes and deserializes POLAR (and other) data for display on each page
 */

angular.module('olci.services.DataTransformService', [
    'vendor.steelToe',
    'olci.services.SharedDataService',
    'olci.services.TransformUtilsService',
    'angular-momentjs',
    'ngStorage'
])

.service('DataTransformService', function( steelToe, SharedDataService, $q, MomentJS, TransformUtilsService, $sessionStorage ) {

    //TODO: figure out how to resolve this list from sharedDataService before starting this service
    var countries = [ 
        {"code": "AD", "name": "Andorra"},
        {"code": "AE", "name": "United Arab Emirates"},
        {"code": "AG", "name": "ANTIGUA AND BARBUDA"},
        {"code": "AI", "name": "ANGUILLA"},
        {"code": "AM", "name": "ARMENIA"},
        {"code": "AN", "name": "NETHERLANDS ANTILLES"},
        {"code": "AO", "name": "ANGOLA"},
        {"code": "AR", "name": "Argentina"},
        {"code": "AS", "name": "AMERICAN SAMOA"},
        {"code": "AT", "name": "Austria"},
        {"code": "AU", "name": "Australia"},
        {"code": "AW", "name": "Aruba"},
        {"code": "AZ", "name": "AZERBAIJAN"},
        {"code": "BA", "name": "BOSNIA HERZEGOVINA"},
        {"code": "BB", "name": "Barbados"},
        {"code": "BD", "name": "BANGLADESH"},
        {"code": "BE", "name": "Belgium"},
        {"code": "BF", "name": "BURKINA FASO"},
        {"code": "BG", "name": "Bulgaria"},
        {"code": "BH", "name": "Bahrain"},
        {"code": "BI", "name": "BURUNDI"},
        {"code": "BJ", "name": "BENIN"},
        {"code": "BM", "name": "Bermuda"},
        {"code": "BN", "name": "BRUNEI DARUSSALAM"},
        {"code": "BO", "name": "Bolivia"},
        {"code": "BR", "name": "Brazil"},
        {"code": "BS", "name": "Bahamas"},
        {"code": "BT", "name": "BHUTAN"},
        {"code": "BW", "name": "BOTSWANA"},
        {"code": "BY", "name": "BELARUS"},
        {"code": "BZ", "name": "Belize"},
        {"code": "CA", "name": "Canada"},
        {"code": "CC", "name": "COCOS (KEELING) ISLANDS"},
        {"code": "CD", "name": "DEMOCRATIC REPUBLIC OF CONGO"},
        {"code": "CF", "name": "CENTRAL AFRICA REP"},
        {"code": "CG", "name": "CONGO"},
        {"code": "CH", "name": "Switzerland"},
        {"code": "CI", "name": "COTE D IVOIRE"},
        {"code": "CK", "name": "COOK ISLANDS"},
        {"code": "CL", "name": "Chile"},
        {"code": "CM", "name": "CAMEROON"},
        {"code": "CN", "name": "China"},
        {"code": "CO", "name": "Colombia"},
        {"code": "CR", "name": "COSTA RICA"},
        {"code": "CU", "name": "CUBA"},
        {"code": "CV", "name": "CAPE VERDE"},
        {"code": "CX", "name": "CHRISTMAS IS"},
        {"code": "CY", "name": "Cyprus"},
        {"code": "CZ", "name": "Czech Republic"},
        {"code": "DE", "name": "Germany"},
        {"code": "DJ", "name": "DJIBOUTI"},
        {"code": "DK", "name": "Denmark"},
        {"code": "DM", "name": "DOMINICA"},
        {"code": "DO", "name": "Dominican Republic"},
        {"code": "DZ", "name": "ALGERIA"},
        {"code": "EC", "name": "Ecuador"},
        {"code": "EE", "name": "Estonia"},
        {"code": "EG", "name": "Egypt"},
        {"code": "EH", "name": "WESTERN SAHARA"},
        {"code": "ER", "name": "ERITREA"},
        {"code": "ES", "name": "Spain"},
        {"code": "ET", "name": "ETHIOPIA"},
        {"code": "FI", "name": "Finland"},
        {"code": "FJ", "name": "FIJI"},
        {"code": "FK", "name": "FALKLAND ISLANDS"},
        {"code": "FM", "name": "MICRONESIA"},
        {"code": "FO", "name": "FAROE ISLANDS"},
        {"code": "FR", "name": "France"},
        {"code": "FX", "name": "France"},
        {"code": "GA", "name": "GABON"},
        {"code": "GB", "name": "United kingdom"},
        {"code": "GD", "name": "Grenada"},
        {"code": "GE", "name": "Georgia"},
        {"code": "GF", "name": "FRENCH GUIANA"},
        {"code": "GG", "name": "GUERNSEY"},
        {"code": "GH", "name": "GHANA"},
        {"code": "GI", "name": "Gibraltar"},
        {"code": "GL", "name": "GREENLAND"},
        {"code": "GM", "name": "GAMBIA"},
        {"code": "GN", "name": "GUINEA"},
        {"code": "GP", "name": "GUADELOUPE/ST BARTH/ST MARTIN"},
        {"code": "GQ", "name": "EQUATORIAL GUINEA"},
        {"code": "GR", "name": "Greece"},
        {"code": "GT", "name": "Guatemala"},
        {"code": "GU", "name": "GUAM"},
        {"code": "GW", "name": "GUINEA BISSAU"},
        {"code": "GY", "name": "GUYANA"},
        {"code": "HK", "name": "Hong Kong"},
        {"code": "HN", "name": "Honduras"},
        {"code": "HR", "name": "Croatia"},
        {"code": "HT", "name": "HAITI"},
        {"code": "HU", "name": "Hungary"},
        {"code": "ID", "name": "Indonesia"},
        {"code": "IE", "name": "Ireland"},
        {"code": "IL", "name": "Israel"},
        {"code": "IM", "name": "ISLE OF MAN"},
        {"code": "IN", "name": "India/Andaman IS."},
        {"code": "IO", "name": "BRITISH INDIAN OCEAN TERRITORY"},
        {"code": "IQ", "name": "Iraq"},
        {"code": "IR", "name": "Iran"},
        {"code": "IS", "name": "Iceland"},
        {"code": "IT", "name": "Italy"},
        {"code": "JE", "name": "JERSEY"},
        {"code": "JM", "name": "Jamaica"},
        {"code": "JO", "name": "JORDAN"},
        {"code": "JP", "name": "Japan"},
        {"code": "KE", "name": "KENYA"},
        {"code": "KG", "name": "KRYGYSTAN"},
        {"code": "KH", "name": "CAMBODIA"},
        {"code": "KI", "name": "KIRIBATI"},
        {"code": "KM", "name": "COMOROS"},
        {"code": "KN", "name": "St Kitts/Nevis"},
        {"code": "KP", "name": "KOREA (NORTH)"},
        {"code": "KR", "name": "Korea(South)"},
        {"code": "KW", "name": "Kuwait"},
        {"code": "KY", "name": "Cayman Islands"},
        {"code": "KZ", "name": "KAZAKHSTAN"},
        {"code": "LA", "name": "LAOS"},
        {"code": "LB", "name": "LEBANON"},
        {"code": "LC", "name": "Saint Lucia"},
        {"code": "LI", "name": "Lichtenstein"},
        {"code": "LT", "name": "Lithuania"},
        {"code": "LK", "name": "SRI LANKA"},
        {"code": "LR", "name": "LIBERIA"},
        {"code": "LS", "name": "LESOTHO"},
        {"code": "LU", "name": "Luxembourg"},
        {"code": "LV", "name": "Latvia"},
        {"code": "LY", "name": "LIBYA"},
        {"code": "MA", "name": "Morocco"},
        {"code": "MC", "name": "Monaco"},
        {"code": "MD", "name": "MOLDOVA"},
        {"code": "ME", "name": "MONTENEGRO"},
        {"code": "MG", "name": "MADAGASCAR"},
        {"code": "MH", "name": "MARSHALL ISLANDS"},
        {"code": "MK", "name": "Macedonia"},
        {"code": "ML", "name": "MALI"},
        {"code": "MM", "name": "MYANMAR/BURMA"},
        {"code": "MN", "name": "MONGOLIA"},
        {"code": "MO", "name": "MACAU"},
        {"code": "MP", "name": "NORTHERN MARIANA ISLANDS"},
        {"code": "MQ", "name": "Martinique"},
        {"code": "MR", "name": "MAURITANIA"},
        {"code": "MS", "name": "MONTSERRAT"},
        {"code": "MT", "name": "Malta"},
        {"code": "MU", "name": "MAURITIUS"},
        {"code": "MV", "name": "MALDIVES"},
        {"code": "MW", "name": "MALAWI"},
        {"code": "MX", "name": "Mexico"},
        {"code": "MY", "name": "Malaysia"},
        {"code": "MZ", "name": "MOZAMBIQUE"},
        {"code": "NA", "name": "NAMIBIA"},
        {"code": "NC", "name": "NEW CALEDONIA"},
        {"code": "NE", "name": "NIGER"},
        {"code": "NF", "name": "NORFOLK ISLAND"},
        {"code": "NG", "name": "Nigeria"},
        {"code": "NI", "name": "NICARAGUA"},
        {"code": "NL", "name": "Netherlands"},
        {"code": "NO", "name": "Norway"},
        {"code": "NP", "name": "Nepal"},
        {"code": "NR", "name": "NAURU"},
        {"code": "NU", "name": "NIUE"},
        {"code": "NZ", "name": "New Zealand"},
        {"code": "OM", "name": "Oman"},
        {"code": "PA", "name": "Panama"},
        {"code": "PE", "name": "Peru"},
        {"code": "PF", "name": "FR. POLYNESIA"},
        {"code": "PG", "name": "PAPUA NEW GUINEA"},
        {"code": "PH", "name": "Philippines"},
        {"code": "PK", "name": "PAKISTAN"},
        {"code": "PL", "name": "Poland"},
        {"code": "PM", "name": "ST. PIERRE/MIQUELON"},
        {"code": "PR", "name": "Puerto Rico"},
        {"code": "PS", "name": "PALESTINIAN TERRITORY"},
        {"code": "PT", "name": "Portugal"},
        {"code": "PW", "name": "PALAU"},
        {"code": "PY", "name": "Paraguay"},
        {"code": "QA", "name": "Qatar"},
        {"code": "RE", "name": "REUNION"},
        {"code": "RO", "name": "Romania"},
        {"code": "RS", "name": "SERBIA"},
        {"code": "RU", "name": "Russian Federation"},
        {"code": "RW", "name": "RWANDA"},
        {"code": "SA", "name": "Saudi Arabia"},
        {"code": "SB", "name": "SOLOMON ISLANDS"},
        {"code": "SC", "name": "SEYCHELLES"},
        {"code": "SD", "name": "SUDAN"},
        {"code": "SE", "name": "Sweden"},
        {"code": "SG", "name": "Singapore"},
        {"code": "SH", "name": "ST.HELENA"},
        {"code": "SI", "name": "Slovenia"},
        {"code": "SJ", "name": "SVALBARD AND JAN MAYEN ISLANDS"},
        {"code": "SK", "name": "Slovak Republic"},
        {"code": "SL", "name": "SIERRA LEONE"},
        {"code": "SM", "name": "SAN MARINO"},
        {"code": "SN", "name": "Senegal"},
        {"code": "SO", "name": "SOMALIA"},
        {"code": "SR", "name": "SURINAME "},
        {"code": "ST", "name": "SAO TOME AND PRINCIPE"},
        {"code": "SV", "name": "El Salvador"},
        {"code": "SY", "name": "SYRIA"},
        {"code": "SZ", "name": "SWAZILAND"},
        {"code": "TC", "name": "Turks/Caicos Islands"},
        {"code": "TD", "name": "CHAD"},
        {"code": "TG", "name": "TOGO"},
        {"code": "TH", "name": "Thailand"},
        {"code": "TJ", "name": "TAJIKISTAN"},
        {"code": "TL", "name": "TIMOR-LESTE"},
        {"code": "TN", "name": "TUNISIA"},
        {"code": "TO", "name": "TONGA"},
        {"code": "TR", "name": "Turkey"},
        {"code": "TT", "name": "Trinidad/Tobago"},
        {"code": "TV", "name": "Tuvalu"},
        {"code": "TW", "name": "TAIWAN"},
        {"code": "TZ", "name": "TANZANIA"},
        {"code": "UA", "name": "Ukraine"},
        {"code": "UG", "name": "UGANDA"},
        {"code": "UM", "name": "U.S. MINOR OUTLYING ISLANDS"},
        {"code": "US", "name": "United States"},
        {"code": "UY", "name": "Uruguay"},
        {"code": "UZ", "name": "UZBEKISTAN"},
        {"code": "VC", "name": "St Vincent/Grenadines"},
        {"code": "VE", "name": "Venezuela"},
        {"code": "VG", "name": "Virgin IS/British"},
        {"code": "VI", "name": "Virgin Islands}, U.S."},
        {"code": "VN", "name": "Vietnam"},
        {"code": "VU", "name": "VANUATU"},
        {"code": "WF", "name": "WALLIS/FUNTUNA IS."},
        {"code": "WS", "name": "SAMOA"},
        {"code": "YE", "name": "YEMEN"},
        {"code": "YT", "name": "MAYOTTE"},
        {"code": "ZA", "name": "South Africa"},
        {"code": "ZM", "name": "ZAMBIA"},
        {"code": "ZW", "name": "ZIMBABWE"}
    ];

    function deserializeValue( promise ) {
        if ( !promise ) { return ''; }

        return function ( code ) {
            if ( !code ) { return ''; } // TODO: Revisit this when a guest doesn't have an emergency contact.

            var returnPromise = promise.then( function (result) {
                var returnObj = false;

                result.forEach( function ( obj, index, arr) {
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
                console.error('deserializePromise failed');
            });
    
            return returnPromise;
        };
    }

    var relationships = ( function () {
        var values = SharedDataService.getRelationships()
            .then( function( result ) {
                return result;
            })
            .catch( function () {
                console.error('SharedDataService.getRelationships request failed');
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
                console.error('SharedDataService.getDocTypes request failed');
            });

        return {
            getDocTypes: function () {
                return values;
            },

            deserialize: deserializeValue( values )
        };
    })();


    var languages = ( function () {
        var values = SharedDataService.getSafetyLanguages()
            .then( function( result ) {
                return result;
            })
            .catch( function () {
                console.error('SharedDataService.getSafetyLanguages request failed');
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
                console.error('SharedDataService.getAirportCities request failed');
            });
        
        return {
            getAirportCities: function () {
                return values;
            },

            deserialize: deserializeValue( values ) 
        };
    };

    //copies properies from one object to another
    function transformObject( readObj, writeObj, paths ) {
        paths.forEach(function( el, index, array ) {
            var readItem = steelToe.do( readObj ).get( el.read );
            steelToe.do( writeObj ).set( el.write, readItem );
        });
    }

    // function serializeObject(readObj, writeObj, paths) {
    //     paths.forEach(function(el, index, array) {

    //     })
    // }

    //blazes a path into a nested object if it doesn't exist already
    // function createNestedObject( base, path ) {
    //     base[ path[0] ] = base[ path[0] ] || {};

    //     var newBase = base[ path[0] ];
    //     var newPath = path.slice(1);
    //     // path.shift();
    //     if (path.length <= 1) return;
    //     createNestedObject( newBase, path );
    // }

    function assignCountry( countryCode ) {
        return SharedDataService.getCountriesFormatted()
            .then( function( countryList ) {
                var country;
                countryList.countries.forEach( function( element, index ){
                    if ( element.hasOwnProperty( countryCode ) ) {
                        country = element[countryCode];
                    }
                });
                return country;
            });
    }

    function assignState(stateCode) {
        var returnValue = SharedDataService.states()
            .then( function( stateList ) {
                var state;
                stateList.US.forEach( function( element, index ){
                    if ( element.hasOwnProperty( stateCode ) ) {
                        state = element[stateCode];
                    }
                });
                return state;
            });
        return returnValue;
    }

    function makeAcceptTermsString(mainPassenger, secondPassenger) {
        var rightNow = new Date();
        var strAccepted = '<!-- mp_trans_disable_start -->' + 
            mainPassenger.firstName.toUpperCase() + ' ' +
            mainPassenger.lastName.toUpperCase() + 
            '<!-- mp_trans_disable_end --> accepted Terms & Conditions on behalf of <!-- mp_trans_disable_start -->' +
            secondPassenger.title + ' ' +
            secondPassenger.firstName + ' ' +
            secondPassenger.lastName +
            '<!-- mp_trans_disable_end -->' + ' on ' +
            rightNow.toISOString();
        return strAccepted;
    }

    return {
        serializeSiebel: function(inputSiebel) {
            //TODO
        },

        deserializePolar: function(inputPolar, target) {
            var deferred = $q.defer();
            var input = angular.copy(inputPolar);
            console.dir(inputPolar);

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
                {write: 'taxesAndFeesCombined', read: 'taxesAndFeesCombined'},
                {write: 'webItineraryId', read: 'webItineraryId'},
                {write: 'allowEU', read: 'allowEU'},
                {write: 'travelInitiativeType', read: 'travelInitiativeType'},
                {write: 'destinationCode', read: 'destinationCode'},
                {write: 'destinationName', read: 'destinationName'},
                {write: 'bookingDate', read: 'bookingDate'},
                {write: 'sailDate', read: 'sailDate'},
                {write: 'disembarkDate', read: 'disembarkDate'},
                {write: 'amountReceived', read: 'amountReceived'},
                {write: 'totalCruiseFareAmt', read: 'totalCruiseFareAmt'},
                {write: 'creditCardFees', read: 'creditCardFees'},
                {write: 'deckCode', read: 'cabinInfo.deckCode'},
                {write: 'cabinNumber', read: 'cabinInfo.cabinNumber'},
                {write: 'cabinType', read: 'cabinInfo.cabinType'},
                {write: 'diningSitting', read: 'diningSitting'},
                {write: 'hasPRC', read: 'hasPRC'}, //TODO: find out where this is in POLAR, THIS ISN'T CORRECTLY MAPPED
            ];
            transformObject(input, target, rootPaths);

            //TODO: no clue what's going on with cabin locations. the data is completely inconsistent.
            //recreate errors with CLCMCQ, LOKI
            if (steelToe.do(input).get('cabinInfo.cabinLocations')) {
                // target.cabinLocationName    = steelToe.do(input).get('cabinInfo.cabinLocations').filter(function(obj){return obj.code === target.cabinType;})[0].description;
                target.cabinLocationName = target.cabinType;
            }
            
            input.checkinGuests.map(function(singleGuest) {
                var seqNum = singleGuest.seqNumber -1;
                target.guest[seqNum] = target.guest[seqNum] || {};
                var guestObj = target.guest[seqNum];
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
                transformObject( singleGuest, guestObj, basicPaths );

                // the dropdowns use country name, not code; this transforms code to name
                guestObj.nationality = TransformUtilsService.deserializeCountry( guestObj.nationality );
                guestObj.countryOfResidence = TransformUtilsService.deserializeCountry( guestObj.countryOfResidence );

                // parse birthday
                if (guestObj.birthDate) {
                    guestObj.birthDate = deserializeDate( guestObj.birthDate );
                }

                var pastGuestLoyalty = angular.copy( singleGuest.pastGuestLoyalty ) || '';
                guestObj.pastGuestLoyalty        = wordToNum( pastGuestLoyalty.split(' ')[0] );


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
                        transformObject( address, guestObj.homeAddress, homePaths );
                        guestObj.homeAddress.country = TransformUtilsService.deserializeCountry( guestObj.homeAddress.country );
                        // guestObj.homeAddress.state = assignState(guestObj.homeAddress.state).then(function(result){guestObj.homeAddress.state = result;});
                    } 
                    if ( address.addressType === 'D' ) {
                        guestObj.destAddress = {};
                        transformObject( address, guestObj.destAddress, homePaths );
                        guestObj.destAddress.country = TransformUtilsService.deserializeCountry( guestObj.destAddress.country );
                        // guestObj.destAddress.state = assignState(guestObj.destAddress.state).then(function(result){guestObj.destAddress.state = result;});
                    }
                });

                if ( steelToe.do(singleGuest).get('guestFlightDetails') ) {
                    //flights are in an array; they don't come in a consistent order so we need to
                    //iterate through the array and find if it's home or destination address
                    singleGuest.guestFlightDetails.map( function( flight ) {
                        // guestObj.guestFlightDetails = guestObj.guestFlightDetails || {};
                        if ( flight.directionCode === 'O' ) {
                            guestObj.guestFlightDetails.originFlight = {
                                departCityCode: flight.flightSegmentDetail.departCityCode,
                                arriveCityCode: flight.flightSegmentDetail.arriveCityCode,
                                carrierName: flight.flightSegmentDetail.carrierName,
                                flightNumber: flight.flightSegmentDetail.flightNumber,
                            };
                            guestObj.guestFlightDetails.originFlight.departureDate = deserializeDate( flight.flightSegmentDetail.departureDate );
                            guestObj.guestFlightDetails.originFlight.arrivalDate = deserializeDate( flight.flightSegmentDetail.arrivalDate );
                            guestObj.guestFlightDetails.originFlight.departureTime = serializeTime(flight.flightSegmentDetail.departureTime);
                            guestObj.guestFlightDetails.originFlight.arrivalTime = serializeTime(flight.flightSegmentDetail.arrivalTime);
                        }
                        else if ( flight.directionCode === 'T' ) {
                            guestObj.guestFlightDetails.terminalFlight = {};
                            var t = guestObj.guestFlightDetails.terminalFlight;
                            var s = flight.flightSegmentDetail;
                            t.departCityCode = steelToe.do(s).get('departCityCode');
                            t.arriveCityCode = steelToe.do(s).get('arriveCityCode');
                            t.carrierName = steelToe.do(s).get('carrierName');
                            t.flightNumber = steelToe.do(s).get('flightNumber');
                            t.departureDate = deserializeDate( steelToe.do(s).get('departureDate') );
                            t.arrivalDate = deserializeDate( steelToe.do(s).get('arrivalDate') );
                            t.departureTime = serializeTime(steelToe.do(s).get('departureTime'));
                            t.arrivalTime = serializeTime(steelToe.do(s).get('arrivalTime'));
                        }
                    });
                }

                if ( steelToe.do(singleGuest).get('transportationAssignments') ) {
                    singleGuest.transportationAssignments.map(function(flight) {
                        if (flight.directionCode === "O") {
                            guestObj.transportationAssignments.origin = true;
                        } else if (flight.directionCode === "T") {
                            guestObj.transportationAssignments.terminal = true;
                        }
                    });
                }

                // Immigration data - passport, etc.
                if ( steelToe.do(singleGuest).get('immigrationDocInfo') ) {
                    guestObj.immigrationDocInfo = {
                        // documentType          : docTypes.deserialize( steelToe.do(singleGuest).get('immigrationDocInfo.documentType') ),
                        documentNumberConfirm : steelToe.do(singleGuest).get('immigrationDocInfo.documentNumber')
                    };
                    guestObj.immigrationDocInfo.documentType = docTypes.deserialize( steelToe.do(singleGuest).get('immigrationDocInfo.documentType') ).then( function (result) { guestObj.immigrationDocInfo.documentType = result; });

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
                    transformObject( singleGuest.immigrationDocInfo, guestObj.immigrationDocInfo, immigrationPaths );
                    guestObj.immigrationDocInfo.issueCountryCode = TransformUtilsService.deserializeCountry( guestObj.immigrationDocInfo.issueCountryCode );
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
            if (input.emergencyContacts) {
                input.emergencyContacts.map(function(contact) {
                    //indexing here is consistent with the approach used above while creating each user
                    var guest = target.guest[contact.sequenceNumber - 1]; 
                    guest.emergencyContact = {
                        // relationship : relationships.deserialize( steelToe.do(contact).get('relationship') ).then( function (result) { console.log('relationship:',result); return result; }),
                        phone        : steelToe.do(contact).get('contactPhones') ? steelToe.do(contact.contactPhones[0]).get('number') : ''
                    };
                    guest.emergencyContact.relationship = relationships.deserialize( steelToe.do(contact).get('relationship') ).then( function (result) { guest.emergencyContact.relationship = result; });

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

                    transformObject( contact, guest.emergencyContact, contactPaths );
                    guest.emergencyContact.country = TransformUtilsService.deserializeCountry( guest.emergencyContact.country );
                });
            }

            deferred.resolve(target);
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
                    target.guest[ seqNum ].CheckInPassenger.langPrefCode = languages.deserialize( target.guest[ seqNum ].CheckInPassenger.langPrefCode ).then( 
                        function( result ){ 
                            target.guest[seqNum].CheckInPassenger.langPrefCode = result; 
                        });
                }

                // airportCitiesPromise.then( function () {
                if ( target.guest[seqNum].CheckInPassenger.emergencyAir ) {
                    target.guest[ seqNum ].CheckInPassenger.emergencyAir = getAirportCities.deserialize( target.guest[seqNum].CheckInPassenger.emergencyAir ).then( function( result ){ target.guest[seqNum].CheckInPassenger.emergencyAir = result;});    
                }
                
                // });
            });
            
            deferred.resolve(target);
            return deferred.promise;

        },

        serializePolar: function(inputPolar) {
            var serializedPolar = {
              // "checkin": {
                "checkinGuests": [],
                "emergencyContacts": [
                  // {
                  //   "guestAddress": {
                  //     "city": {},
                  //     "phone": {}
                  //   }
                  // }
                ]
              // }
            };

            var rootPaths = [
                {write: 'bookingNumber', read: 'bookingNumber'},
                {write: 'synchronizationID', read: 'synchronizationID'},
            ];
            transformObject(inputPolar, serializedPolar, rootPaths);

            inputPolar.guest.map(function(singleGuest) {
                var seqNum = singleGuest.seqNumber - 1;
                serializedPolar.checkinGuests[seqNum] = {
                    // "nationality": {},
                    // "countryOfResidence": {},
                    // "contactPhone": {},
                    "birthDate": {},
                    "homeCity": {},
                    // "address": [
                    //   {
                    //     "city": {},
                    //     "phone": {}
                    //   }
                    // ],
                    // "immigrationDocInfo": {}
                };

                var guestObj = serializedPolar.checkinGuests[seqNum];
                // guestObj.guestFlightDetails = [];

                var basicPaths = [
                    {write: 'middleName', read: 'middleName'},
                    {write: 'seqNumber', read: 'seqNumber'},
                    {write: 'eRef', read: 'eRef'},
                    {write: 'nationality.code', read: 'nationality'},
                    {write: 'countryOfResidence.code', read: 'countryOfResidence'},
                    {write: 'birthDate.value', read: 'birthDate'}
                ];
                transformObject(singleGuest, guestObj, basicPaths);

                guestObj.countryOfResidence.code = TransformUtilsService.serializeCountry( guestObj.countryOfResidence.code );
                guestObj.nationality.code = TransformUtilsService.serializeCountry( guestObj.nationality.code );

                //transform birthday into format e.g. 07181987 for july 18 1987
                if ( singleGuest.birthDate ) {
                    guestObj.birthDate.value = serializeISODate(singleGuest.birthDate);
                    guestObj.birthDate.required = '';
                }
                    
                //assign address to guest object
                // singleGuest.address = [];
                // var homePaths = [
                //     {write: 'street1', read: 'street1'},
                //     {write: 'street2', read: 'street2'},
                //     {write: 'street3', read: 'street3'},
                //     {write: 'houseName', read: 'houseName'},
                //     {write: 'city.value', read: 'city'},
                //     {write: 'state', read: 'stateName'},
                //     {write: 'countryCode', read: 'country'},
                //     {write: 'zipCode', read: 'zipCode'}
                //     {write: 'phone.number', read: 'phone'}
                // ];

                // if (singleGuest.homeAddress.primaryPhone) {
                //     var primaryPhone = {
                //         typeCode: 'C',
                //         number: singleGuest.homeAddress.primaryPhone
                //     };
                //     guestObj.address.map(function(address) {
                //         if (addressType === 'C') {
                //             address.push(primaryPhone);
                //         }
                //     });
                // }

                // if (singleGuest.homeAddress.secondaryPhone) {
                //     var secondaryPhone = {
                //         typeCode: 'H',
                //         number: singleGuest.homeAddress.secondaryPhone
                //     };
                //     guestObj.address.map(function(address) {
                //         if (addressType === 'H') {
                //             address.push(secondaryPhone);
                //         }
                //     });
                // }

                // if (singleGuest.homeAddress) {
                //     var home = {
                //         addressType: "H",
                //         addressDescription: "Home"
                //     };
                //     transformObject(singleGuest.homeAddress, home, homePaths);
                //     home.countryCode = TransformUtilsService.serializeCountry( home.countryCode );
                //     singleGuest.address.push(home);
                // }
                // if (singleGuest.destAddress) {
                //     var dest = {
                //         addressType: "D",
                //         addressDescription: "Destination"
                //     };
                //     transformObject(singleGuest.destAddress, dest, homePaths);
                //     dest.countryCode = TransformUtilsService.serializeCountry( dest.countryCode );
                //     singleGuest.address.push(dest);
                // }

                // add guest's guestFlightDetails
                // var flightsPaths = [
                //     {write: 'flightSegmentDetail.departCityCode', read: 'departCityCode'},
                //     {write: 'flightSegmentDetail.arriveCityCode', read: 'arriveCityCode'},
                //     {write: 'flightSegmentDetail.carrierCode', read: 'carrierCode'},
                //     {write: 'flightSegmentDetail.carrierName', read: 'carrierName'},
                //     {write: 'flightSegmentDetail.flightNumber', read: 'flightNumber'},
                //     {write: 'flightSegmentDetail.flightClass', read: 'flightClass'},
                //     {write: 'flightSegmentDetail.departureTime', read: 'departureTime'},
                //     {write: 'flightSegmentDetail.arrivalTime', read: 'arrivalTime'},
                //     {write: 'flightSegmentDetail.departureDate', read: 'departureDate'},
                //     {write: 'flightSegmentDetail.arrivalDate', read: 'arrivalDate'}
                // ];
                // if (singleGuest.guestFlightDetails.terminalFlight) {
                //     var newTerminalFlight = {directionCode: "T"};
                //     transformObject(singleGuest.guestFlightDetails.terminalFlight, newTerminalFlight, flightsPaths);
                //     //parse times?
                //     guestObj.guestFlightDetails.push(newTerminalFlight);
                // }
                // if (singleGuest.guestFlightDetails.originFlight) {
                //     var newOriginFlight = {directionCode: "O"};
                //     transformObject(singleGuest.guestFlightDetails.originFlight, newOriginFlight, flightsPaths);
                //     //parse times?
                //     guestObj.guestFlightDetails.push(newOriginFlight);
                // }

                // immigrationDocInfo
                // if (singleGuest.immigrationDocInfo) {
                //     if (Object.keys(singleGuest.immigrationDocInfo).length > 0) {
                //         //add immigration info
                //         var immigrationPaths = [
                //             {write: 'occupationCode', read: 'occupationCode'},
                //             {write: 'issueCountryCode', read: 'issueCountryCode'},
                //             {write: 'birthCountryCode', read: 'birthCountryCode'},
                //             {write: 'documentNumber', read: 'documentNumber'},
                //             {write: 'documentType', read: 'documentType'},
                //             {write: 'issueCityName', read: 'issueCityName'},
                //             {write: 'expirationDate', read: 'expirationDate'},
                //             {write: 'issueDate', read: 'issueDate'}
                //         ];
                //     }
                // }

                // emergencyContacts is a sibling array in POLAR, but a child of 
                // each passenger in the olci app
                // var newEmergencyContact = {
                //     sequenceNumber: singleGuest.seqNumber
                // };
                // var emergencyPaths = [
                //     {write: 'lastName', read: 'lastName'},
                //     {write: 'relationship', read: 'relationship'},
                //     {write: 'guestAddress.street1', read: 'street1'},
                //     {write: 'guestAddress.street2', read: 'street2'},
                //     {write: 'guestAddress.street3', read: 'street3'},
                //     {write: 'guestAddress.city.value', read: 'city'},
                //     {write: 'guestAddress.stateCode', read: 'state'},
                //     {write: 'guestAddress.countryCode', read: 'country'},
                //     {write: 'guestAddress.zipCode', read: 'zip'},
                //     {write: 'guestAddress.phone.value', read: 'zip'},
                //     {write: 'email', read: 'email'}
                // ];
                // transformObject(singleGuest.emergencyContact, newEmergencyContact, emergencyPaths);
                // //only add an emergency contact if the user has submitted information about them
                // if ( Object.keys(newEmergencyContact).length > 1 ) {
                //     serializedPolar.emergencyContacts.push(newEmergencyContact);
                // }
            });
            cutEmptyBranches(serializedPolar);
            return serializedPolar; 
        },

        serializeWebDb: function(inputWebDb, passengers) {
            var serializedWebDb = {CheckInPassenger: []};

            //add checkinPassengers
            var passengerPaths = [
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''}
            ];

            var departByPlaneStatus = {};
            passengers.forEach(function(passenger, index) {
                var newCheckInPassenger = {};
                transformObject(passenger.CheckInPassenger, newCheckInPassenger.CheckInPassenger, rootPaths);
                serializedWebDb.CheckInPassenger.push(newCheckInPassenger);

                //check if passenger has indicated whether they're departing by plane
                switch (passenger.pageStates.flights.transferProps.preCruise) {
                    case 'true':
                        //write Y to CheckInPassenger
                        departByPlaneStatus[passenger.seqNumber] = 'Y';
                        break;
                    case 'false':
                        //write N to CheckInPassenger.departByPlane
                        departByPlaneStatus[passenger.seqNumber] = 'N';
                        break;
                    case 'notYet':
                        //write M to CheckInPassenger.departByPlane
                        departByPlaneStatus[passenger.seqNumber] = 'M';
                        break;
                    default:
                        //write '' to CheckInPassenger.departByPlane
                }
            });
            serializedWebDb.CheckInPassenger.forEach(function(val) {
                val.departByPlane = departByPlaneStatus[val.paxSequence];
            });
            
            //If the data brought down from webDb didn't have eDocsFlag and they accepted the eDocs (contract page)
            //then add contract info for this passenger.
            if (!passengers[0].CheckInPassenger.termsConditionsEdocsFlag && passengers[0].pageStates.contract.acceptTerms) {
                serializeWebDb.CheckInPassenger.forEach(function(val, ind) {
                    passengers.forEach(function(passenger, index, arr) {
                        if (passenger.seqNumber === val.paxSequence) {
                            val.termsConditionsEdocsFlag = new Date().toISOString();
                            val.termsEdocsWhoAccepted = makeAcceptTermsString(passengers[0], passenger);
                        }
                    });
                });
            }

            //add checkinPayers
            var payerPaths = [
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''}
            ];
            transformObject(inputWebDb.CheckInPayer, serializedWebDb, rootPaths);

            //add checkinCovered
            var coveredPaths = [
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''},
                {write: '', read: ''}
            ];
            transformObject(inputWebDb.CheckInCovered, serializedWebDb, rootPaths);
        },

        getRelationships: relationships.getRelationships,

        getDocTypes: docTypes.getDocTypes,

        getLanguages: languages.getLanguages,

        getAirportCities: airportCities.getAirportCities,

        transformRequestObject: function( obj ) {
            var str = [];
            for (var p in obj) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            var results = str.join("&");
            console.log(results);
            return str.join("&");
        }
    };

    function matchCoveringWithPassenger( guests, covering, bookingNumber, prodCode ) {
        if ( guests.length < 1 || !covering ) return;
        // var seqNum = covering.guestId.slice( 7, 8 );

        for ( var i = 0; i < guests.length; i++ ) {
            var guestId = bookingNumber + 
                zeroPad( guests[i].seqNumber ) + 
                prodCode;

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

    //pads with zeroes, e.g. input: 2 -> output: '02'
    //n is the input value to pad
    //z is the padding character (defaults to '0')
    //width is total width of the string after padding (defaults to 2)
    function zeroPad( n, width, z ) {
        z = z || '0';
        width = width || 2;
        n = n + '';
        return n.length >= width ? n : new Array( width - n.length + 1 ).join( z ) + n;
    }

    function deserializeTime( timeString ) {
        if (!timeString) return '';
        var timeObj = {};
        timeObj.hour = timeString.slice(0, 2);
        timeObj.minute = timeString.slice(2, 4);
        return timeObj;
    }

    function serializeTime(timeObj) {
        var hour = zeroPad(timeObj.hour);
        var minute = zeroPad(timeObj.minute);
        var timeString = hour + minute;
        return timeString;
    }

    function serializeArray(possibleObject) {
        var returnArray = [];
        if (!Array.isArray(possibleObject)) {
            returnArray.push(possibleObject);
            return returnArray;
        }
    }

    function deserializeDate(dateString) {
        if (!dateString) return;
        var month = dateString.slice(0, 2);
        var date = dateString.slice(2, 4);
        var year = dateString.slice(4, 8);
        return MomentJS(dateString, ['MMDDYYYY', 'MM-DD-YYYY', MomentJS.ISO_8601]).toDate();
    }

    function serializeISODate(dateObj) {
        if (!dateObj) return;
        return dateObj.toISOString();
    }

    //todo: i haven't tested if this works or not
    function serializeNoDelimiterDate(dateObj) {
        if (!dateObj) return;
        var year = dateObj.getFullYear() + '';
        var month = zeroPad(dateObj.getMonth() + 1);
        var day = zeroPad(dateObj.getDate());
        var dateString = month + day + year;
        return dateString;
    }

    function serializeDashedDate(dateObj) {
        if (!dateObj) return;
        var year = dateObj.getFullYear() + '';
        var month = zeroPad(dateObj.getMonth() + 1);
        var day = zeroPad(dateObj.getDate());
        var dateString = month + '-' + day +  '-' + year;
        return dateString;
    }

    //cuts empty branches off serialized objects
    function cutEmptyBranches( node ) {
        var isArray = node instanceof Array;
        for (var k in node) {
            if ( node[k] instanceof Array ) {
                if ( node[k].length === 0 ) {
                    delete node[k];
                } else {
                    cutEmptyBranches( node[k] );
                }
            } else if ( node[k] instanceof Object ) {
                if ( Object.keys( node[k] ).length === 0 ) {
                    delete node[k];
                } else {
                    cutEmptyBranches( node[k] );
                }
            }
        }
    }

    // function TransformUtilsService.serializeCountry( countryLabel ) {
    //     var countryCode;
    //     countries.forEach( function( element, index ){
    //         if ( element.name === countryLabel ) {
    //             countryCode = element.code;
    //         }
    //     });
    //     return countryCode;
    // }

    // function TransformUtilsService.deserializeCountry( countryCode ) {
    //     var countryName;
    //     countries.forEach( function( element, index ){
    //         if ( element.code === countryCode ) {
    //             countryName = element.name;
    //         }
    //     });
    //     return countryName;
    // }

});
