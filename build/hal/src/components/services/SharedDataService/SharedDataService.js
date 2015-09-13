/*
 * SharedDataService.js
 *
 * Created: April, 2015
 * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc overview
 * @name olci.services.SharedDataService
 * @description Single service to hold shared constants and variables
 */
angular.module('olci.services.SharedDataService', [
    'pascalprecht.translate',
    'restangular',
    'ApplicationConfiguration',
    'olci.services.GetCopyService'
])

/**
 * @ngdoc service
 * @name olci.services.SharedDataService
 * @description Single service to hold shared constants and variables.
 */
    .service('SharedDataService', function($translate, $q, $timeout, $http, Restangular, Configuration, GetCopyService) {
        var country = 'US';
        var travelBaseUrl = Restangular.one('travelPlanning/v1.0.0/airHomeCityList').one('companyCode', Configuration.companyCode).one('countryCode', country);


        // taken from secondaryFlow CreditCardService
        var key,
            // countries = [
            // "AD","AE","AG","AI","AM","AN","AO","AR","AS","AT",
            // "AU","AW","AZ","BA","BB","BD","BE","BF","BG","BH",
            // "BI","BJ","BM","BN","BO","BR","BS","BT","BW","BY",
            // "BZ","CA","CC","CD","CF","CG","CH","CI","CK","CL",
            // "CM","CN","CO","CR","CU","CV","CX","CY","CZ","DE",
            // "DJ","DK","DM","DO","DZ","EC","EE","EG","EH","ER",
            // "ES","ET","FI","FJ","FK","FM","FO","FR","FX","GA",
            // "GB","GD","GE","GF","GG","GH","GI","GL","GM","GN",
            // "GP","GQ","GR","GT","GU","GW","GY","HK","HN","HR",
            // "HT","HU","ID","IE","IL","IM","IN","IO","IQ","IR",
            // "IS","IT","JE","JM","JO","JP","KE","KG","KH","KI",
            // "KM","KN","KP","KR","KW","KY","KZ","LA","LB","LC",
            // "LI","LT","LK","LR","LS","LU","LV","LY","MA","MC",
            // "MD","ME","MG","MH","MK","ML","MM","MN","MO","MP",
            // "MQ","MR","MS","MT","MU","MV","MW","MX","MY","MZ",
            // "NA","NC","NE","NF","NG","NI","NL","NO","NP","NR",
            // "NU","NZ","OM","PA","PE","PF","PG","PH","PK","PL",
            // "PM","PR","PS","PT","PW","PY","QA","RE","RO","RS",
            // "RU","RW","SA","SB","SC","SD","SE","SG","SH","SI",
            // "SJ","SK","SL","SM","SN","SO","SR","ST","SV","SY",
            // "SZ","TC","TD","TG","TH","TJ","TL","TN","TO","TR",
            // "TT","TV","TW","TZ","UA","UG","UM","US","UY","UZ",
            // "VC","VE","VG","VI","VN","VU","WF","WS","YE","YT",
            // "ZA","ZM","ZW"
            // ],
            countryList,
            statesMapping = {
                "US": [
                    "AA","AE","AL","AP","AK",
                    "AZ","AR","CA","CO","CT",
                    "DC","DE","FL","GA","HI",
                    "ID","IL","IN","IA","KS",
                    "KY","LA","ME","MD","MA",
                    "MI","MN","MS","MO","MT",
                    "NE","NV","NH","NJ","NM",
                    "NY","NC","ND","OH","OK",
                    "OR","PA","RI","SC","SD",
                    "TN","TX","UT","VT","VA",
                    "WA","WV","WI","WY"
                ],
                "CA": [
                    "AB","BC","MB","NB","NF",
                    "NL","NS","NT","NU","ON",
                    "PE","QC","SK","YT"
                ],
                "AU": [
                    "ACT","NSW","NT","NZ","QLD",
                    "SA","TAS","VIC","WA"
                ]
            },
            statesPromise,
            statesKeys,
            countryKey,
            statesLists;

        // var stringPrefix = 'country.'; // this is the prefix we need to pass to $translate to get the country names properly
        // for (var c=0; c < countries.length; c++) {
        //     countries[c] = stringPrefix + countries[c];
        // }
        // countriesPromise =
        //     $translate(countries)
        //         .then(function(translations) {
        //             var key;
        //             countryList = [];
        //             for (key in translations) {
        //                 countryList.push({
        //                     'abbr': key.substr(key.lastIndexOf('.')+1),
        //                     'label' : translations[key]
        //                 });
        //             }
        //         })
        //         .catch(function(){
        //             console.error('SharedDataService cannot find country strings in locale_en.json');
        //         });
        stringPrefix = 'states.';
        statesKeys = [];
        function createKey(element) {
            statesKeys.push(countryKey + element);
        }
        for (key in statesMapping) {
            countryKey = stringPrefix + key + '.';
            statesMapping[key].forEach(createKey);
        }
        statesPromise = $translate(statesKeys)
            .then(function(translations) {
                var lastDot,
                    countryCode;
                statesLists = [];
                for (key in translations) {
                    lastDot = key.lastIndexOf('.');
                    countryCode = key.substr(lastDot-2, 2);
                    if (!statesLists[countryCode]) {
                        statesLists[countryCode] = [];
                    }
                    statesLists[countryCode].push({
                        abbr: key.substr(lastDot + 1),
                        label: translations[key]
                    });
                }
            });

        var airports = {};

        var sharedDataService = {
            countries: [ 
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
            ],

            // setCountryOfLocale: function( countryCode ) {
            //     for ( var i = 0; i < this.countries.length; i++ ) {
            //         if ( this.countries[ i ].code === countryCode ) {
            //             var countryOfLocale = angular.copy(countries[ i ]);
            //             this.countries = this.countries.splice( i, 1 );
            //             this.countries.unshift( countryOfLocale );
            //         }
            //     }
            // },
            
            setCountryList: function(countries) {
                this.countries = countries;
            },

            getCountries: function() {
                return this.countries;
            },

            // countriesPromise: countriesPromise,

            setAirportCities: function(newAirports) {
                airports = newAirports || airports;
            },
            // Got these from: http://haldevcms01.hq.halw.com:10580/hal-dssf-server/rest/travelPlanning/v1.0.0/airHomeCityList/companyCode/HAL/countryCode/US/
            // http://halpjira01:8090/confluence/pages/viewpage.action?pageId=31360447

            getAirportCities: function() {
                var deferred = $q.defer();
                GetCopyService.airportCitiesExclusions().then( function (excludedCodes) {
                    travelBaseUrl.get().then( function ( airCities ) {
                        var returnArray = airCities.filter( function ( city ) {
                            if ( excludedCodes.indexOf(city.key) > -1 ) {
                                return false;
                            }
                            return true;
                        });

                        deferred.resolve( returnArray );
                    });
                });

                return deferred.promise;
                
            },

            priorCruiseLines : [
                // TODO: value should be replaced by the value required in the database
                [
                    {
                        "label": "Carnival",
                        "value": "1"
                    },
                    {
                        "label": "Celebrity",
                        "value": "2"
                    },
                    {
                        "label": "Costa",
                        "value": "3"
                    },
                    {
                        "label": "Crystal",
                        "value": "4"
                    },
                    {
                        "label": "Cunard",
                        "value": "5"
                    }
                ],
                [
                    {
                        "label": "Norwegian",
                        "value": "6"
                    },
                    {
                        "label": "Princess",
                        "value": "7"
                    },
                    {
                        "label": "Royal Caribbean",
                        "value": "8"
                    },
                    {
                        "label": "Seabourn",
                        "value": "9"
                    },
                    {
                        "label": "Windstar",
                        "value": "10"
                    }
                ]
            ],

            // getCountries: function() {
            //     return $http.get('./assets/countries.json')
            //         .then(function(res) {
            //             return res.data;
            //         })
            //         .catch(function(status) {
            //             console.log(status);
            //         });
            // },
            // getCountriesFormatted: function () {
            //     var defer = $q.defer(),
            //         countries;
            //     this.getCountries()
            //         .then(function(result) {
            //             countries = result.countries.map( function (obj) {
            //                 var code = Object.keys(obj)[0],
            //                     country = obj[code];

            //                 return { code: code, label: country };
            //             });

            //             defer.resolve( countries );
            //         })
            //         .catch(function() {
            //             console.error('SharedDataService.countries request failed');
            //         });
            //     return defer.promise;
            // },
            
            states: function () {
                var dfr = $q.defer();

                if (statesLists) {
                    $timeout(function() {
                        dfr.resolve(statesLists);
                    },0);
                } else {
                    $q.all([statesPromise])
                        .then(function(obj) {
                            dfr.resolve(statesLists);
                        });
                }
                return dfr.promise;
            },
            getRelationships: function () {
                var deferred = $q.defer(),
                    values = [
                        { "label" : "Aunt", "code": "AUNT" },
                        { "label" : "Boyfriend", "code": "BOYFRND" },
                        { "label" : "Brother", "code": "BROTHER" },
                        { "label" : "Brother In-Law", "code": "BROLAW" },
                        { "label" : "Common Law", "code": "COMNLAW" },
                        { "label" : "Cousin", "code": "COUSIN" },
                        { "label" : "Daughter", "code": "DAUGHTER" },
                        { "label" : "Daughter In-Law", "code": "DTRLAW" },
                        { "label" : "Father", "code": "FATHER" },
                        { "label" : "Father In-Law", "code": "FTHRLAW" },
                        { "label" : "Fiance", "code": "FIANCE" },
                        { "label" : "Friend", "code": "FRIEND" },
                        { "label" : "Girlfriend", "code": "GIRLFRND" },
                        { "label" : "Godfather", "code": "GODFTHR" },
                        { "label" : "Godmother", "code": "GODMTHR" },
                        { "label" : "Grandfather", "code": "GRANFTHR" },
                        { "label" : "Grandmother", "code": "GRANMTHR" },
                        { "label" : "Granddaughter", "code": "GRANDTR" },
                        { "label" : "Grandson", "code": "GRANDSON" },
                        { "label" : "Husband", "code": "HUSBAND" },
                        { "label" : "Life Partner", "code": "LIFEPRTR" },
                        { "label" : "Mother", "code": "MOTHER" },
                        { "label" : "Mother In-Law", "code": "MOMLAW" },
                        { "label" : "Nephew", "code": "NEPHEW" },
                        { "label" : "Niece", "code": "NIECE" },
                        { "label" : "Power of Attorney", "code": "PWRATTY" },
                        { "label" : "Sister", "code": "SISTER" },
                        { "label" : "Sister In-Law", "code": "SISLAW" },
                        { "label" : "Son", "code": "SON" },
                        { "label" : "Son In-Law", "code": "SONLAW" },
                        { "label" : "Spouse", "code": "SPOUSE" },
                        { "label" : "Step Relative", "code": "STEPRELA" },
                        { "label" : "Step-Brother", "code": "STEPBRO" },
                        { "label" : "Stepchild", "code": "STEPCHD" },
                        { "label" : "Step-Father", "code": "STEPFTHR" },
                        { "label" : "Step-Grand Father", "code": "STPGRNFR" },
                        { "label" : "Step-Grand Mother", "code": "STPGRNMR" },
                        { "label" : "Step-Mother ", "code": "STEPMOM" },
                        { "label" : "Step-Sister", "code": "STEPSIS" },
                        { "label" : "Uncle", "code": "UNCLE" },
                        { "label" : "Wife", "code": "WIFE" }
                    ];

                deferred.resolve(values);

                return deferred.promise;
            },
            getSafetyLanguages: function () {
                var deferred = $q.defer(),
                    values = [
                        { "label" : 'English',    "code": 'EN' },
                        { "label" : 'Dutch',      "code": 'NL' },
                        { "label" : 'Danish',     "code": 'DA' },
                        { "label" : 'German',     "code": 'DE' },
                        { "label" : 'Spanish',    "code": 'ES' },
                        { "label" : 'French',     "code": 'FR' },
                        { "label" : 'Italian',    "code": 'IT' },
                        { "label" : 'Hebrew',     "code": 'HE' },
                        { "label" : 'Japanese',   "code": 'JA' },
                        { "label" : 'Korean',     "code": 'KO' },
                        { "label" : 'Norwegian',  "code": 'NO' },
                        { "label" : 'Portuguese', "code": 'PT' },
                        { "label" : 'Russian',    "code": 'RU' },
                        { "label" : 'Swedish',    "code": 'SV' },
                        { "label" : 'Chinese',    "code": 'ZH' }
                    ];

                deferred.resolve(values);

                return deferred.promise;
            },
            getDocTypes: function () {
                var deferred = $q.defer(),
                    values = [
                        { "label" : "Passport",                   "code": "P" },
                        { "label" : "Passport Card",              "code": "C" },
                        { "label" : "Enhanced Driver\'s License", "code": "D" },
                        { "label" : "Enhanced Non-Driver ID",     "code": "E" },
                        { "label" : "NEXUS Card",                 "code": "N" },
                        { "label" : "SENTRI Card",                "code": "S" },
                        { "label" : "Fast Card",                  "code": "F" },
                        { "label" : "Birth Certificate (With a government-issued picture ID)", "code": "B" },
                        { "label" : "European ID Card",           "code": "U" }
                    ];

                deferred.resolve(values);

                return deferred.promise;
            }

        };

        // $http.get( './assets/countries.json' )
        //     .then( function( result ) {
        //         countries = result.data.countries.map( function ( obj ) {
        //             var code = Object.keys( obj )[0],
        //                 country = obj[code];

        //             return { code: code, label: country };
        //         });
        //         sharedDataService.setCountryList( countries );
        //     })
        //     .catch( function() {
        //         console.error( 'SharedDataService.countries request failed' );
        //     });

        return sharedDataService;
    });
