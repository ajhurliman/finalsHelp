angular.module('olci.directives.checkinProgress', [
    'ngCookies',
    'ngStorage',
    'ApplicationConfiguration',
    'vendor.steelToe'
    ])

    .directive('checkinProgress', function factory(Configuration) {
        return {
            restrict: 'A',
            replace: false,
            transclude: false,
            templateUrl: 'directives/checkinProgress/checkinProgress.tpl.html',

            controller: function ($scope, $parse, $rootScope, $cookies, $sessionStorage, steelToe) {
                $scope.tabData = (Configuration.companyCode === 'HAL') ?
                [
                    {
                        heading: 'Guest Info',
                        route: 'details'
                    },
                    {
                        heading: 'Passport',
                        route: 'passport'
                    },
                    {
                        heading: 'Flights',
                        route: 'flights'
                    },
                    {
                        heading: 'Contacts',
                        route: 'emergency'
                    },
                    {
                        heading: 'Account',
                        route: 'account'
                    },
                    {
                        heading: 'Contract',
                        route: 'contract'
                    },
                    {
                        heading: 'Docs',
                        route: 'summary'
                    }
                ] : [
                    {
                        heading: 'Guest Info',
                        route: 'details'
                    },
                    {
                        heading: 'Passport',
                        route: 'passport'
                    },
                    {
                        heading: 'Flights',
                        route: 'flights'
                    },
                    {
                        heading: 'Contacts',
                        route: 'emergency'
                    },
                    {
                        heading: 'Account',
                        route: 'account'
                    },
                    {
                        heading: 'Contract',
                        route: 'contract'
                    },
                    {
                        heading: 'Preferences',
                        route: 'preferences'
                    },
                    {
                        heading: 'Docs',
                        route: 'summary'
                    }
                ];

                // TODO: Delete after presentation.  Uncomment and refresh to 'reset' the cookies so that all pages have not been visited.  The comment back out and start testing.
                // $cookies['detailsVisited'] = 'false';
                // $cookies['passportVisited'] = 'false';
                // $cookies['flightsVisited'] = 'false';
                // $cookies['emergencyVisited'] = 'false';
                // $cookies['accountVisited'] = 'false';
                // $cookies['contractVisited'] = 'false';

                function getIndex( seqNumber ) {
                    var returnIndex = null;
                    $sessionStorage.bookingInfo.guest.forEach( function (guest, index, arr) {
                        if ( +guest.seqNumber === +seqNumber ) {
                            returnIndex = index;
                        }
                    });
                    return returnIndex;
                }

                function checkProperty( property ) {
                    return property !== undefined && property !== null && property !== '';
                }

                $scope.allVisited = function ( pageName ) {
                    var visited = false;
                    $sessionStorage.bookingInfo.guest.forEach( function (guest, index, arr) {
                        if ( $rootScope.selectGuestFilter( guest.seqNumber ) ) {
                            visited = visited || $scope.visitedPage( pageName, guest.seqNumber );
                        }
                    });
                    return visited;
                };
                $scope.visitedPage = function ( pageName, seqNumber ) {
                    var bookingNumber = $sessionStorage.bookingInfo.bookingNumber;
                    return $cookies[ bookingNumber + seqNumber + pageName + 'Visited' ] === 'true';
                };


                $scope.completedPageAllGuests = function ( pageName ) {
                    var completed = true;

                    $sessionStorage.bookingInfo.guest.forEach( function (guest, index, arr) {
                        if ( $rootScope.selectGuestFilter(guest.seqNumber) ) {
                            completed = completed && $scope.completedPage( pageName, guest.seqNumber);
                        }
                    });

                    return completed;
                };
                $scope.completedPage = function ( pageName, seqNumber ) {
                    return $scope[pageName + "IsComplete"]( seqNumber );
                };
                

                $scope.detailsIsComplete = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    if ( index === null ) {
                        return false;
                    }

                    return  $sessionStorage.bookingInfo.guest[ index ].homeAddress &&
                            // passenger.pastGuestNumber
                            // passenger.gender

                            // birthday.month
                            // birthday.day
                            // birthday.year
                            // passenger.middleName
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].homeAddress.country ) &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].homeAddress.street1 ) &&
                            // $sessionStorage.bookingInfo.guest[ index ].homeAddress.street2     && $sessionStorage.bookingInfo.guest[ index ].homeAddress.street2 !== '' &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].homeAddress.city ) &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].homeAddress.state ) &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].homeAddress.zipCode ) &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].homeAddress.phone ) &&
                            // // okToTextPhone1
                            // // phone2
                            // // okToTextPhone2
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].eRef );

                            // // marital status
                            // // employment status
                            // // have you taken a cruise before
                            // // which cruise lines; 
                };

                $scope.passportIsComplete = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    if ( index === null ) {
                        return false;
                    }

                    var passportDone = true;

                    // $sessionStorage.bookingInfo.guest[ index ].docType;

                    // Don't need to validate these, but they are needed.
                    // $sessionStorage.bookingInfo.travelInitiativeType
                    // passenger.nationality
                    // getAge( $scope.passengers[i].birthdate, $sessionStorage.bookingInfo.sailDate )
                    // $sessionStorage.bookingInfo.allowEU
                    // using birthcertificate property?


                    // var docTypes = [];
                    // // 1. For all cruise itineraries:  a current/valid passport issued by any country recognized by the U.S.
                    // docTypes.push('Passport');
                    // //   -OR-
                    // // 3. For itineraries that disembark at a U.S. port (a “WHTI cruise”):
                    // if ( $sessionStorage.bookingInfo.travelInitiativeType.toUpperCase() === "O" || $sessionStorage.bookingInfo.travelInitiativeType.toUpperCase() === "L" ) {
                    //     //   3.2  For Canadian citizens 16+ years old:  Trusted Traveler card (NEXUS, FAST, SENTRI) 
                    //     if ( $sessionStorage.bookingInfo.guest[ index ].nationality.toUpperCase() === 'CA' ) {
                    //         docTypes.push('NEXUS Card', 'SENTRI Card', 'Fast Card');
                    //     }
                    //     //   3.3  For U.S. citizens 16+ years old:  any WHTI-compliant document (incl. passport card, NEXUS, SENTRI, Global Entry or FAST card, Enhanced Driver’s License, or Enhanced Non-Driver ID)
                    //     else if ( $sessionStorage.bookingInfo.guest[ index ].nationality.toUpperCase() === 'US' ) {
                    //         docTypes.push('Passport Card', "Enhanced Driver's License", "Enhanced Non-Driver ID", 'NEXUS Card', 'SENTRI Card', 'Fast Card');
                    //     }
                    //     //   3.4  For all others:   valid passport, plus:  a valid visa (unless exempt) or if traveling on the Visa Waiver Program, an approved Electronic System for Travel Authorization (ESTA).
                    //     else {
                    //         // Visa place of issuance
                    //         // Visa control number
                    //         // Visa issue date
                    //         // Visa expire date
                    //     }
                    // }
                    // //   -OR-
                    // // 2. For itineraries that embark & disembark only within the EU:  An EU-issued ID card
                    // if ( $sessionStorage.bookingInfo.guest[ index ].allowEU ) {
                    //     docTypes.push('European ID Card');
                    // }
                    // //   3.1 For U.S. and Canadian citizens < 16 years old:  Birth certificate or Naturalization certificate
                    // if ( ($sessionStorage.bookingInfo.guest[ index ].nationality.toUpperCase() === 'US' || $sessionStorage.bookingInfo.guest[ index ].nationality.toUpperCase() === 'CA') && getAge( $sessionStorage.bookingInfo.guest[ index ].birthdate, $sessionStorage.bookingInfo.sailDate ) < 16 ) {
                    //     docTypes.push('Birth Certificate (With a government-issued picture ID)');
                    // }


                    //   3.2  For Canadian citizens 16+ years old:  Trusted Traveler card (NEXUS, FAST, SENTRI) 
                    //   3.3  For U.S. citizens 16+ years old:  any WHTI-compliant document (incl. passport card, NEXUS, SENTRI, Global Entry or FAST card, Enhanced Driver’s License, or Enhanced Non-Driver ID)
                    //   3.4  For all others:   valid passport, plus:  a valid visa (unless exempt) or if traveling on the Visa Waiver Program, an approved Electronic System for Travel Authorization (ESTA).
                    if ( !$sessionStorage.bookingInfo.travelInitiativeType || !$sessionStorage.bookingInfo.guest[ index ].nationality ) {
                        return false;
                    }
                    if ( $sessionStorage.bookingInfo.travelInitiativeType &&
                        ( $sessionStorage.bookingInfo.travelInitiativeType.toUpperCase() === "O" || $sessionStorage.bookingInfo.travelInitiativeType.toUpperCase() === "L" ) && 
                        $sessionStorage.bookingInfo.guest[ index ].nationality.toUpperCase() !== 'CA' &&
                        $sessionStorage.bookingInfo.guest[ index ].nationality.toUpperCase() !== 'US') {
                            // TODO: Visa place of issuance
                            // TODO: Visa control number
                            // TODO: Visa issue date
                            // TODO: Visa expire date
                    }


                    passportDone = passportDone &&
                        checkProperty( $sessionStorage.bookingInfo.guest[ index ].CheckInPassenger.emergencyAir) &&            // emergencyAir - "checkinWebDb": { "checkinPassengers": [ { "emergencyAir": "PHX"
                        checkProperty( $sessionStorage.bookingInfo.guest[ index ].CheckInPassenger.termsConditionsVisaFlag) && // termsConditionsVisaFlag - "checkinWebDb": { "checkinPassengers": [ { "termsConditionsVisaFlag": 1435441465000
                        checkProperty( $sessionStorage.bookingInfo.guest[ index ].CheckInPassenger.langPrefCode );             // langPrefCode - "checkinWebDb": { "checkinPassengers": [ { "langPrefCode": "en"


                    var docInfo = steelToe.do($sessionStorage.bookingInfo.guest[ index ]).get('immigrationDocInfo') || {},
                        checkInPassenger = steelToe.do($sessionStorage.bookingInfo.guest[ index ]).get('CheckInPassenger') || {};

                    if ( docInfo.documentType === "Enhanced Driver's License" ) {  // "D"
                        passportDone = passportDone && 
                            checkProperty( docInfo.issueCountryName ) && 
                            // TODO: permResident
                            // TODO: permResidentCardNum
                            checkProperty( docInfo.issueCityName ) && 
                            checkProperty( docInfo.birthCountryName ) && 
                            checkProperty( checkInPassenger.placeOfBirth ) && 
                            checkProperty( docInfo.documentNumber ) && 
                            checkProperty( docInfo.documentNumberConfirm ) &&  // Need to check that this matches documentNumber above
                            checkProperty( docInfo.issueDate ) &&
                            checkProperty( docInfo.expirationDate );
                    }

                    else if ( docInfo.documentType === "Enhanced Non-Driver ID" ) {  // "E"
                        passportDone = passportDone && 
                            checkProperty( docInfo.issueCountryName ) && 
                            // TODO: permResident
                            // TODO: permResidentCardNum
                            checkProperty( docInfo.issueCityName ) && 
                            checkProperty( docInfo.birthCountryName ) && 
                            checkProperty( checkInPassenger.placeOfBirth ) && 
                            checkProperty( docInfo.documentNumber ) && 
                            checkProperty( docInfo.documentNumberConfirm ) &&
                            checkProperty( docInfo.issueDate ) &&
                            checkProperty( docInfo.expirationDate );
                    }

                    else if ( docInfo.documentType === "European ID Card" ) {  // "U"
                        passportDone = passportDone && 
                            checkProperty( docInfo.issueCountryName ) && 
                            // TODO: permResident
                            checkProperty( docInfo.birthCountryName ) && 
                            checkProperty( checkInPassenger.placeOfBirth ) && 
                            checkProperty( docInfo.documentNumber ) && 
                            checkProperty( docInfo.documentNumberConfirm ) &&
                            checkProperty( docInfo.issueDate ) &&
                            checkProperty( docInfo.expirationDate );
                    }

                    else if ( docInfo.documentType === "Fast Card"  ||    // "F"
                         docInfo.documentType === "NEXUS Card" ||    // "N"
                         docInfo.documentType === "SENTRI Card" ) {  // "S"
                            passportDone = passportDone && 
                                checkProperty( docInfo.issueCountryName ) && 
                                // TODO: permResident
                                // TODO: permResidentCardNum
                                checkProperty( docInfo.birthCountryName ) && 
                            checkProperty( checkInPassenger.placeOfBirth ) && 
                                checkProperty( docInfo.expirationDate );
                    }

                    else if ( docInfo.documentType === "Passport Card" ) {  // "C"
                        passportDone = passportDone && 
                            checkProperty( docInfo.issueCountryName ) && 
                            // TODO: permResident
                            // TODO: permResidentCardNum
                            checkProperty( docInfo.birthCountryName ) && 
                            checkProperty( checkInPassenger.placeOfBirth ) && 
                            checkProperty( docInfo.documentNumber ) && 
                            checkProperty( docInfo.documentNumberConfirm ) &&  // Need to check that this matches documentNumber above 
                            checkProperty( docInfo.issueDate ) &&
                            checkProperty( docInfo.expirationDate );
                    }

                    else if ( docInfo.documentType === "Passport" ) {  // "P"
                        passportDone = passportDone && 
                            checkProperty( docInfo.issueCountryName ) && 
                            // TODO: permResident
                            // TODO: permResidentCardNum
                            checkProperty( docInfo.birthCountryName ) && 
                            checkProperty( checkInPassenger.placeOfBirth ) && 
                            checkProperty( docInfo.documentNumber ) && 
                            checkProperty( docInfo.documentNumberConfirm ) &&  // Need to check that this matches documentNumber above 
                            checkProperty( docInfo.issueDate ) &&
                            checkProperty( docInfo.expirationDate );
                    }

                    else if ( docInfo.documentType === "Birth Certificate (With a government-issued picture ID)" ) {  // "B"
                        // passportDone = passportDone && 
                        // TODO: usingBirthCertificate   - "checkinWebDb": { "checkinPassengers": [ { "usingBirthCertificate": "N"
                    }

                    else {
                        passportDone = false;
                    }


                    return passportDone;
                };

                $scope.flightsIsComplete = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    if ( index === null ) {
                        return false;
                    }

                    
                    var flightsDone = true;

                    if ( $scope.isPreCruiseTransportationAssignment( seqNumber ) ) {
                        flightsDone = flightsDone && true;
                    }     
                    else {

                        // Pre-Cruise Flight Status
                        flightsDone = flightsDone && checkProperty( $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.preCruise );

                        // begin pre-cruise collapse section 
                        if ( $scope.isPreCruiseOpen( seqNumber ) ) {

                            flightsDone = flightsDone && 

                            // Post Cruise - This is a private jet 
                            // TODO: This is a private jet 

                            // Pre Cruise - Airline 
                            checkProperty( steelToe.do( $sessionStorage.bookingInfo.guest[ index ] ).get( "guestFlightDetails.originFlight.carrierName" ) ) &&

                            // Pre Cruise - Departure City 
                            // checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.originFlight.departCityCode ) &&

                            // Pre Cruise - Departure Date 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.originFlight.departureDate ) &&

                            // Pre Cruise - Departure Time - Hour 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.originFlight.departureTime.hour ) &&

                            // Pre Cruise - Departure Time - Minute 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.originFlight.departureTime.minute ) &&

                            // Pre Cruise - Arrival City 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.originFlight.arriveCityCode ) &&

                            // Pre Cruise - Arrival Date 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.originFlight.arrivalDate ) &&

                            // Pre Cruise - Arrival Time - Hour 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.originFlight.arrivalTime.hour ) &&

                            // Pre Cruise - Arrival Time - Minute 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.originFlight.arrivalTime.minute );

                            // Pre Cruise - Tail Number 
                            // TODO: Tail Number 

                        }  // end pre-cruise collapse section 


                    }  // end hide passenger.transportationAssignments.origin 


                      
                    if ( $scope.isPostCruiseTransportationAssignment( seqNumber ) ) {
                        flightsDone = flightsDone && true;
                    }
                    else if ( $scope.isPostCruiseNotTransportationAssignment( seqNumber ) ) {  // non-foreign post-cruise section 


                        // Post-Cruise Flight Status (non-foreign) 
                        if ( !$sessionStorage.bookingInfo.guest[ index ].pageStates.flights.foreign ) {
                            flightsDone = flightsDone && checkProperty( $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise );
                        }


                        // Post-Cruise Flight Connection Status 
                        if ( $scope.isPostCruiseOpen( seqNumber ) ) {

                            flightsDone = flightsDone && 

                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruiseConnection ) && 

                            // Post Cruise - This is a private jet 
                            // TODO: This is a private jet 

                            // Post Cruise - Airline 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.terminalFlight.carrierName ) && 

                            // Post Cruise - Flight Number 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.terminalFlight.flightNumber ) && 

                            // Post Cruise - Departure City 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.terminalFlight.departCityCode ) && 

                            // Post Cruise - Departure Date 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.terminalFlight.departureDate ) && 

                            // Post Cruise - Departure Time - Hour 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.terminalFlight.departureTime.hour ) && 

                            // Post Cruise - Departure Time - Minute 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.terminalFlight.departureTime.minute ) && 

                            // Post Cruise - Arrival City 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].guestFlightDetails.terminalFlight.arriveCityCode );

                            // Pre Cruise - Tail Number 
                            // TODO: Tail Number 

                        }// end collapse postCruise section 

                    } // end collapse 'same as main passenger' section 


                    // begin foreign section 
                    if ( $scope.isForeignSectionOpen( seqNumber ) ) {

                        // Leaving by plane?  
                        flightsDone = flightsDone && checkProperty( $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise );

                        // Flying within 12 Hours? 
                        if ( $scope.isFlyingWithinTwelveHoursOpen( seqNumber ) ) {
                            flightsDone = flightsDone && checkProperty( $sessionStorage.bookingInfo.guest[ index ].CheckInPassenger.departAfter12Hours );
                        }

                        // Staying Overnight? 
                        if ( $scope.isStayingOvernightOpen( seqNumber ) ) {
                            flightsDone = flightsDone && checkProperty( $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.stayingOvernight );
                        }
                                

                        // Where are you staying? 
                        if ( $scope.isWhereAreYouStayingOpen( seqNumber ) ) {

                            flightsDone = flightsDone && 

                            // Post Cruise - Where are you staying? - Country 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].destAddress.country ) && 

                            // Post Cruise - Where are you staying? - Postal Code 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].destAddress.zipCode ) && 

                            // Post Cruise - Where are you staying? - Hotel Name or Address 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].destAddress.street1 ) && 

                            // Post Cruise - Where are you staying? - City 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].destAddress.city ) && 

                            // Post Cruise - Where are you staying? - State 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].destAddress.state );

                        }  // end overnight address 


                        // How are you leaving? 
                        if ( $scope.isHowAreYouLeavingOpen( seqNumber ) ) {

                            flightsDone = flightsDone && 

                            // Post Cruise - How are you leaving the US? - Mode of Transportation 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].destAddress.street1 ) && 

                            // Post Cruise - How are you leaving the US? - City Traveling To 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].destAddress.city ) && 

                            // Post Cruise - How are you leaving the US? - State/Province Traveling To 
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].destAddress.state );

                        }  // end how are you leaving section 


                    }  // end foreign section 


                    return flightsDone;
                };

                // Pre Cruise Flights
                $scope.isPreCruiseOpen = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    return $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.preCruise === true || $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.preCruise === 'true';
                };

                $scope.isPreCruiseTransportationAssignment = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    return steelToe.do($sessionStorage.bookingInfo.guest[ index ]).get("transportationAssignments.origin");
                };


                // Post Cruise Flights
                $scope.isPostCruiseOpen = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    return $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise === true || $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise === 'true';
                };

                $scope.isPostCruiseTransportationAssignment = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    return steelToe.do($sessionStorage.bookingInfo.guest[ index ]).get('transportationAssignments.terminal');
                };

                $scope.isPostCruiseNotTransportationAssignment = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    return !($sessionStorage.bookingInfo.guest[ index ].pageStates.flights.sameFlights === 'yes' || $sessionStorage.bookingInfo.guest[ index ].transportationAssignments.terminal);
                };

                $scope.isForeignSectionOpen = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    return !(!$sessionStorage.bookingInfo.guest[ index ].pageStates.flights.foreign || !$sessionStorage.bookingInfo.guest[ index ].pageStates.flights.endsInUS);
                };

                $scope.isFlyingWithinTwelveHoursOpen = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    return ( $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise === false || $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise === 'notYet' );
                };

                $scope.isStayingOvernightOpen = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    return ( !( $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise !== false || ($sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise === true && $sessionStorage.bookingInfo.guest[ index ].CheckInPassenger.departAfter12Hours === true) ) );
                };

                $scope.isWhereAreYouStayingOpen = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    return ( $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise === true && $sessionStorage.bookingInfo.guest[ index ].CheckInPassenger.departAfter12Hours === true ) || 
                             ( $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise === false && $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.stayingOvernight === true ) ;
                };

                $scope.isHowAreYouLeavingOpen = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    return !($sessionStorage.bookingInfo.guest[ index ].pageStates.flights.transferProps.postCruise === true || $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.stayingOvernight === true || $sessionStorage.bookingInfo.guest[ index ].pageStates.flights.stayingOvernight === undefined);
                };


                $scope.emergencyIsComplete = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    if ( index === null ) {
                        return false;
                    }
                    
                    return  $sessionStorage.bookingInfo.guest[ index ].emergencyContact &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].emergencyContact.lastName )     &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].emergencyContact.relationship ) &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].emergencyContact.country )      &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].emergencyContact.zip )          &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].emergencyContact.street1 )      &&
                            // checkProperty( $sessionStorage.bookingInfo.guest[ index ].emergencyContact.street2 )      &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].emergencyContact.city )         &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].emergencyContact.state )        &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].emergencyContact.phone )        &&
                            checkProperty( $sessionStorage.bookingInfo.guest[ index ].emergencyContact.email );
                };

                $scope.accountIsComplete = function ( seqNumber ) {
                    var index = getIndex( seqNumber );
                    if ( index === null ) {
                        return false;
                    }

                    var accountDone = true;

                    accountDone = accountDone && checkProperty( $sessionStorage.bookingInfo.guest[ index ].pageStates.account.payCash );

                    if ( !$sessionStorage.bookingInfo.guest[ index ].pageStates.account.payCash ) {
                        accountDone = accountDone && checkProperty( $sessionStorage.bookingInfo.guest[ index ].pageStates.account.copyCard );
                    }

                    return accountDone;
                };

                $scope.contractIsComplete = function ( seqNumber ) {
                    return true && $sessionStorage.bookingInfo.guest[ 0 ].CheckInPassenger.termsConditionsEdocsFlag;
                    // return $sessionStorage.bookingInfo.guest[ 0 ].pageStates.contract.acceptTerms;
                };
                $scope.preferencesIsComplete = function ( seqNumber ) {
                    return true;
                };

                // TODO: Look at wireframe - https://halpjira01:8443/browse/OLCI-29 - 4 - Upon printing, Summary & Boarding Pass recieves checkmark.
                $scope.summaryIsComplete = function ( seqNumber ) {
                    return  $scope.detailsIsComplete( seqNumber )   &&
                            $scope.passportIsComplete( seqNumber )  &&
                            $scope.flightsIsComplete( seqNumber )   &&
                            $scope.emergencyIsComplete( seqNumber ) &&
                            $scope.accountIsComplete( seqNumber )   &&
                            $scope.contractIsComplete( seqNumber );
                    // return true;
                };

                $scope.summaryIsComplete2 = function ( passenger ) {
                    var isComplete = true;

                    if (passenger.seqNumber === "1" ) {
                        isComplete = false;
                    }

                    return isComplete;
                };
            }
        };
    });
