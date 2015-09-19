(function () {
    'use strict';
})();

angular.module('olci', [
    'ngStorage',
    'cgBusy',
    'ui.router',
    'ui.bootstrap',
    'ui.bootstrap.showErrors',
    'ui.utils',
    'ngCookies',
    'restangular',
    'templates-app',
    'templates-components',
    'ApplicationConfiguration',
    'fh.landing',
    'fh.home',
    'olci.directives.pageTitle',
    'olci.directives.halHeader',
    'olci.directives.checkinProgress',
    'olci.directives.itineraryPhoto',
    'olci.directives.modals',
    'olci.directives.modals.errorModal',
    'olci.directives.modals.login',
    'olci.services.AuthService',
    'olci.services.AnalyticsService',
    'olci.services.RoutingUtilsService',
    'olci.services.RegExpService',
    'olci.services.SharedDataService',
    'olci.services.TimeUtilsService',
    'olci.services.FindImageService',
    'olci.services.GetCopyService',
    'olci.services.FocusService',
    'olci.services.ChangePageService',
    'olci.services.DataTransformService',
    'olci.services.FrontEndLinkService',
    'olci.services.StaleSessionService',
    'olci.services.HttpInterceptorService',
    'olci.services.BrowserService',
    'vendor.steelToe',
    'base64',
    'angular-momentjs'
])

    .config(function($urlRouterProvider, RestangularProvider, Configuration, $uiViewScrollProvider, $httpProvider, $translateProvider, $compileProvider) {

        // TODO: This is needed for the Call/Chat buttons in the header. Just like on homepage:
        // https://halprdgit01.hq.halw.com:8443/projects/WA/repos/marketinghomepage/browse/src/app/app.js
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|javascript):/);

        RestangularProvider.setBaseUrl('/api');
        RestangularProvider.setDefaultHttpFields({
            withCredentials: true,
            timeout: Configuration.timeoutInMillis,
            cache: true
        });
        RestangularProvider.setDefaultHeaders({
            'Client-Id': Configuration.halPorta.clientId
        });

        $urlRouterProvider.when('', '/landing').otherwise('/landing');

        // scrolls to top of page on state change
        $uiViewScrollProvider.useAnchorScroll();

        // // initialize $translateProvider
        // $translateProvider.useStaticFilesLoader({
        //     prefix: "assets/i18n/locale-",
        //     suffix: ".json"
        // });

        // $translateProvider.preferredLanguage('en');
        // $translateProvider.fallbackLanguage('en');

    })
    .run(function($rootScope, 
        Configuration, 
        $state, 
        $sessionStorage, 
        $translate, 
        ChangePageService, 
        DataTransformService, 
        AuthService, 
        $cookies, 
        FindImageService, 
        HttpInterceptorService, 
        StaleSessionService, 
        ModalService, 
        $location, 
        steelToe) {

        $rootScope.appName = Configuration.appName;
        $rootScope.companyCode = Configuration.companyCode;


        // $state.go('findBooking'); //delete before committing

        //auth check every time the state/page changes
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            // $rootScope.stateChangeAuthCheck(event, toState, toParams, fromState, fromParams);
        });


        // $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState) {

        //     $translate(toState.pageTitle)
        //         .then(function( pageTitle ) {
        //             $rootScope.pageTitle = pageTitle;
        //         })
        //         .catch(function( pageTitle ) {
        //             $rootScope.pageTitle = 'Holland America Line';
        //         });

        //         // 'From page' has been visited so set cookie.
        //         // TODO: Add per person in booking.
        //         if ( fromState.name && $sessionStorage.bookingInfo) {
        //             // Need to check that user is not on guestSelect page.
        //             if ( ChangePageService.getPages().slice(1).indexOf( toState.name ) !== -1 ) {
        //                 $sessionStorage.bookingInfo.guest.forEach( function ( guest, index, arr ) {
        //                     if ( $rootScope.selectGuestFilter( guest.seqNumber ) ) {
        //                         $cookies[ $sessionStorage.bookingInfo.bookingNumber + guest.seqNumber + fromState.name + 'Visited' ] = 'true';
        //                     }
        //                 });
        //             }
                    
        //         }
        // });


        //EVENT BANK
        /*$rootScope.$on('auth-login-success', function(event, args) {
            var bookingInfo = DataTransformService.serializePolar($sessionStorage.polar);
            $sessionStorage.bookingInfo = DataTransformService.serializeWebDb($sessionStorage.webDb, bookingInfo);
            $rootScope.setMarinerImg($sessionStorage.bookingInfo.guest[0].pastGuestLoyalty);
            $rootScope.setMainName($sessionStorage.bookingInfo.guest[0]);
            // $sessionStorage.bookingInfo = bookingInfoAndWeb
            $state.go('selectGuest');
        });

        $rootScope.$on('auth-logout-success', function(event, args) {

        });*/

        $rootScope.isHal = function () {
            return Configuration.companyCode === 'HAL';
        };

        $rootScope.isSbn = function () {
            return Configuration.companyCode === 'SBN';
        };



    })

    .constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

angular.module('fh.home', [
  'ui.select',
  'ngStorage',
  'ngFileUpload',
  'pdf'
])

.config(function homeConfig($stateProvider) {
  $stateProvider.state('home', {
    url: '/home',
    views: {
      main: {
        controller: 'HomeController',
        templateUrl: 'home/home.tpl.html'
      }
    },
    pageTitle: 'Home',
    resolve: {
      allClasses: function( $http, $sessionStorage ) {
        return $http({
          method: 'GET',
          url: 'api/classes/all',
          headers: {
            jwt: $sessionStorage.jwt
          }
        }).then(function (res ) {
          return res.data;
        }, function( err ) {
          console.log(err);
        });
      }
    }
  });
})

.controller('HomeController', function( $scope, $state, $http, $sessionStorage, $timeout, Upload, pdfDelegate, allClasses ) {
  var PAPERS_URL = '/api/papers';
  $http.defaults.headers.common['jwt'] = $sessionStorage.jwt;
  $scope.mainPdfData = './assets/fonts/fw4.pdf';
  $scope.allClasses = allClasses;

  $scope.$watch('files', function() {
    $scope.upload( $scope.files );
  });

  $scope.$watch('file', function() {
    if ($scope.file != null) {
      $scope.upload([$scope.file]);
    }
  });

  $scope.log = '';
  $scope.papersToEdit = [];
  $scope.editData = {};

  $scope.newSeason = {};
  $scope.newYear = {};
  $scope.newType = {};

  $scope.seasons = [
    {name: 'Spring', code: "SP"},
    {name: 'Summer', code: "SU"},
    {name: 'Fall', code: "FA"},
    {name: 'Winter', code: "WI"}
  ];
  $scope.years = [
    {name: '09', code: '09'},
    {name: '10', code: '10'},
    {name: '11', code: '11'},
    {name: '12', code: '12'},
    {name: '13', code: '13'},
    {name: '14', code: '14'},
    {name: '15', code: '15'}
  ];
  $scope.types = [
    {name: 'Homework', code: 'H'},
    {name: 'Midterm', code: 'M'},
    {name: 'Notes', code: 'N'},
    {name: 'Quiz', code: 'Q'},
    {name: 'Final', code: 'F'},
    {name: 'Lab', code: 'L'}
  ];

  $scope.upload = function( files ) {
    if (files && files.length) {
      for (var i = 0; i < files.length; i++) {
        var file = files[i];

        Upload.upload({
          url: PAPERS_URL,
          file: file
        })

        .progress(function ( evt ) {
          var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          $scope.log = 'progress: ' + 
            progressPercentage + 
            '%' + 
            evt.config.file.name + 
            '\n' + 
            $scope.log;
        })

        .success(function( data, status, headers, config ) {
          $timeout(function() {

            $scope.log = 'file: ' + 
              config.file.name + 
              ', Response: ' + 
              JSON.stringify( data.title ) + 
              '\n' + 
              $scope.log;

            $scope.papersToEdit.push( data );

          });
        });
      }
    }
  };

  $scope.submitEditedPaper = function( paper, newData ) {
    putObj = {
      title: newData.title,
      period: newData.season + newData.year,
      type: newData.type
    };

    $http({
      method: 'PUT',
      url: 'api/papers/single/' + paper._id,
      data: putObj
    }).then(function( res ) {
      console.log( res );
      $scope.paperToEditBackStore = $scope.papersToEdit.shift();
    }, function( err ) {
      console.error ( err );
    });
  };

  $scope.$watch('papersToEdit[0]', function() {
    var canvas = document.getElementById('main-viewer');
    var context = canvas.getContext('2d');

    if ( $scope.papersToEdit[0] ) {
      PDFJS.getDocument( $scope.papersToEdit[0].img.data ).then(function( pdf ) {
        pdf.getPage(1).then(function(page) {

          var scale = 0.8;
          var viewport = page.getViewport(scale);

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          var renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          page.render(renderContext);
        });
      });
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  });


  $scope.$watch('papersToEdit[1]', function() {
    var canvas = document.getElementById('next-up-pdf-container');
    var context = canvas.getContext('2d');

    if ( $scope.papersToEdit[1] ) {
      PDFJS.getDocument( $scope.papersToEdit[1].img.data ).then(function( pdf ) {
        pdf.getPage(1).then(function(page) {

          var scale = 0.2;
          var viewport = page.getViewport(scale);

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          var renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          page.render(renderContext);
        });
      });
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  });

  $scope.addClass = function( newClass ) {
    var postObj = {title: newClass};

    $http({
      method: 'POST',
      url: 'api/classes',
      data: postObj
    }).then(function( res ) {

      $http({
        method: 'GET',
        url: 'api/classes/all'
      }).then(function (res ) {
        $scope.allClasses = res.data;
      });

    }, function( err ) {
      console.log( err );
    });
  };


});

angular.module('fh.landing',[
  'ngStorage'
])

.config(function ( $stateProvider ) {
  $stateProvider.state('landing', {
    url: '/',
    views: {
      main: {
        controller: 'LandingController',
        templateUrl: 'landing/landing.tpl.html'
      }
    },
    pageTitle: 'landingPage.pageTitle'
  });
})

.controller('LandingController', function ( $scope, $state, $http, $base64, $sessionStorage) {
  var USERS_URL = '/api/users';

  $scope.register = function( credentials ) {
    var newUser = {
      name: credentials.name,
      phone: credentials.phone,
      email: credentials.email,
      password: credentials.password,
      passwordConfirm: credentials.passwordConfirm
    };
    $http({
      method: 'POST',
      url: USERS_URL,
      headers: {
        'Content-Type': 'application/json'
      },
      data: newUser
    })
    .success(function(data) {
      console.dir(data);
      $scope.registerCredentials = {};
    })
    .error(function(err) {
      console.dir(err);
      $scope.registerCredentials.password = '';
      $scope.registerCredentials.passwordConfirm = '';
    });
  };

  $scope.login = function(credentials) {

    $http.defaults.headers.common['Authorization'] = 
      'Basic ' + 
      $base64.encode(credentials.email + 
      ':' + 
      credentials.password);
    
    $http.get(USERS_URL)
      .success(function(data) {
        console.dir(data);
        $sessionStorage.jwt = data.jwt;
        $state.go('home');
      })
      .error(function(err) {
        console.dir(err);
      });
  };

});


/**
 * @ngdoc directive
 * @name olci.directives.buttonGreen
 * @description Directive for green 'continue' button and copy at the bottom of the page.
 */
angular.module('olci.directives.buttonGreen', [])

    .directive('buttonGreen', function factory() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                copy: '@buttonGreenCopy',
                label: '@buttonGreenLabel'
            },
            templateUrl: 'directives/buttonGreen/buttonGreen.tpl.html',
            controller: function($scope, $state) {
                
            }
        };
    });

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



/**
 * @ngdoc directive
 * @name olci.directives.fieldRequiredValidation
 * @description Adds an alert for required field validation.
 */
angular.module('olci.directives.fieldRequiredValidation', [])

    .directive('fieldRequiredValidation', function factory() {
        return {
            restrict: 'A',
            replace: false,
            require: "^form",
            // scope: {
            //     copy: '@buttonGreenCopy',
            //     label: '@buttonGreenLabel'
            // },
            // templateUrl: 'directives/fieldRequiredValidation/fieldRequiredValidation.tpl.html',
            
            link: function( scope, el, attrs, formCtrl ) {
                // find the text box element, which has the 'name' attribute
                var inputEl   = el[0].querySelector("[name]");
                // convert the native text box element to an angular element
                var inputNgEl = angular.element(inputEl);
                // get the name on the text box so we know the property to check
                // on the form controller
                var inputName = inputNgEl.attr('name');

                // only apply the has-error class after the user leaves the text box
                inputNgEl.bind('blur', function() {
                    console.dir(formCtrl);
                    console.dir(formCtrl[inputName].$error);
                  el.toggleClass('has-required-error', formCtrl[inputName].$error.required);
                });
            }
        };
    });



/**
 * @ngdoc directive
 * @name olci.directives.fieldValidation
 * @description Adds some alerts for field validation.
 */
angular.module('olci.directives.fieldValidation', [])

    .directive('fieldValidation', function factory() {
        return {
            restrict: 'E',
            replace: false,
            // scope: {
            //     copy: '@buttonGreenCopy',
            //     label: '@buttonGreenLabel'
            // },
            templateUrl: 'directives/fieldValidation/fieldValidation.tpl.html',
            controller: function( $scope, $state ) {
                
            }
        };
    });

/*
 * halHeader.js
 *
 * Created: Monday, February 03, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @name olci.directives.halHeader
 * @description This module populates the header, which may or may not include the pnav.
 */
angular.module('olci.directives.halHeader', [
    'ngStorage',
    'ngCookies',
    'ApplicationConfiguration'
])

/**
 * @ngdoc directive
 * @name olci.directives.halHeader
 * @restrict A
 * @element ANY
 * @description An empty directive description. Please fill in a high level description of this
 *     directive.
 * @example
 *
 <pre>
    <div id="hal-header" hal-header primary-guest="primaryGuest" logout="logout()"></div>
 </pre>
 <example>
     <file name="halHeader.html">
        Place rendered HTML here.
     </file>
 </example>
 *
 */

.directive('halHeader', function factory() {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'directives/halHeader/halHeader.tpl.html',
        controller: function($scope, $state, $sessionStorage, FindImageService, Configuration, $cookies, $q) {

        }
    };
});
/*
 * infoLinks.js
 *
 * Created: Monday, May 04, 2014
 * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @name olci.directives.infoLinks
 * @description An empty module description. Please fill in a high level description of this module.

 */
angular.module('olci.directives.infoLinks', [
    'pascalprecht.translate',
    'vendor.steelToe',
    'ngStorage',
    'ApplicationConfiguration'
])

    .controller('InfoLinksController', function ( $http, $translate, $scope, steelToe, $sessionStorage, Configuration ) {
        $scope.preTag = 'OCFndInfo';

        $http.get( './assets/infoLinks.json' )
            .then(function( res ) {
                $scope.infoLinks = res.data[ Configuration.companyCode ];
            })
            .catch(function( status ) {
                console.log( status );
            });

        // var linkTexts = [],
        //     linkLinks = [],
        //     linkTags = [],
        //     strDotText = '.text',
        //     strDotLink = '.link',
        //     strDotTag = '.tag',
        //     str;

        // for (var i=1; i <= 15; i++) {
        //     str = 'infoLinks.HAL.item' + ((i<10)?'0':'') + i.toString();
        //     linkTexts.push(str + strDotText);
        //     linkLinks.push(str + strDotLink);
        //     linkTags.push(str + strDotTag);
        // }

        // $scope.infoLinks = [];
        // $translate( linkTexts.concat( linkLinks, linkTags ) )
        //     .then(function(linkStrings) {
        //         var linkKey;
        //         // code assumes that keys are iterated through in alphabetical order!!
        //         for (var key in linkStrings) {
        //             // only work on '.text' keys and skip strings that aren't defined in the locale_en.json
        //             // if the string isn't found in locale_en.json, then value = key
        //             if (key.indexOf(strDotText) !== -1 &&
        //                 key != linkStrings[key]) {
        //                 linkKey = key.replace(strDotText, strDotLink);
        //                 // only create a link if both text and url are found
        //                 if (linkStrings[linkKey]) {
        //                     $scope.infoLinks.push({
        //                         text: linkStrings[key],
        //                         url: linkStrings[linkKey],
        //                         tag: linkStrings[tag]
        //                     });
        //                 }
        //             }
        //         }
        //     });
        // Eliminates the link about Alaska if the cruise isn't going to Alaska
        $scope.isAlaskaFilter = function(link) {
            var includAlaska = steelToe.do($sessionStorage.bookingInfo.guest[0]).get('CheckInPassenger.mktIncludeAlaskaTour');
            if (includAlaska) {
                return (!link.isAlaska);
            } else {
                return true;
            }
        };
    })
/**
 *  @ngdoc directive
 * @name olci.directives.infoLinks
 * @restrict A
 * @element ANY
 * @description An empty directive description. Please fill in a high level description of this directive.
 @example
 <pre>
 <div id="hal-footer" info-links></div>
 </pre>

 <example>

 </example>
 */
    .directive('infoLinks', function factory() {
        return {
            restrict: 'A',
            replace: true,
            controller: 'InfoLinksController',
            templateUrl: 'directives/infoLinks/infoLinks.tpl.html'
        };
    });


/**
 * @ngdoc directive
 * @name olci.directives.itineraryPhoto
 * @description Directive for itinerary photo in the side bar.
 */
angular.module('olci.directives.itineraryPhoto', [])

    .directive('itineraryPhoto', function factory() {
        return {
            restrict: 'A',
            replace: false,
            templateUrl: 'directives/itineraryPhoto/itineraryPhoto.tpl.html',
            controller: function($scope, $state, FindImageService, GetCopyService) {
                // Sets image src.
            	FindImageService.itineraryImage().then( function (src) {
            		$scope.imgSrc = src;
            	});
                // Sets copy.
                GetCopyService.itineraryCopy().then( function (copy) {
                    $scope.copy = copy;
                });
            }
        };
    });

angular.module('olci.directives.modals.errorModal', [
    'ui.bootstrap',
    'olci.services.ModalService'
])

.directive('errorModal', function(ModalService) {
    return {
        restrict: 'A',
        link: function( scope, element, attrs ) {
            scope.$on('server-error', function( event, args ) {
                ModalService.openModal({
                    templateUrl: 'directives/modals/errorModal/errorModal.tpl.html',
                    controller: 'errorModalController',
                    windowClass: 'error-modal',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        errorObj: function() {
                            return args;
                        }
                    }
                });
            });
        }
    };
})

.controller('errorModalController', function($scope, ModalService, errorObj, $window) {
    $scope.status = errorObj.status;
    $scope.statusText = errorObj.statusText;

    $scope.close = function() {
        ModalService.closeModal();
        $window.location.reload();
    };
});


// // Timeout response?
// {
//   "data": null,
//   "status": 0,
//   "config": {
//     "method": "GET",
//     "transformRequest": [
//       null
//     ],
//     "transformResponse": [
//       null
//     ],
//     "headers": {
//       "Accept": "application/json, text/plain, */*"
//     },
//     "withCredentials": true,
//     "timeout": 15000,
//     "cache": true,
//     "url": "/secondary/api/checkin/v1.0.0/companyCode/HAL/countryCode/US/booking"
//   },
//   "statusText": ""
// }

angular.module('olci.directives.modals.expenseAgreement', [
    'ui.bootstrap',
    'olci.services.ModalService'
])

.directive('expenseAgreement', function(ModalService) {
    return {
        restrict: 'AE',
        link: function(scope, element, attrs) {
            element.on('click', function() {
                ModalService.openModal({
                    templateUrl: 'directives/modals/expenseAgreement/expenseAgreement.tpl.html',
                    controller: 'expenseAgreementController',
                    windowClass: 'expense-agreement-modal',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        data: function() {
                            return scope.perDiemCost;
                        }
                    }
                });
            });
        },
    };
})

.controller('expenseAgreementController', function($scope, ModalService, data) {
    $scope.close = function() {
        ModalService.closeModal();
    };
    $scope.perDiemCost = data;
});
/*
 * login.js
 *
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

angular.module( 'olci.directives.modals.login', [
    'ui.bootstrap',
    'olci.services.RoutingUtilsService'
])

/**
 * @ngdoc directive
 * @name olci.directives.login
 * @restrict A
 * @element ANY
 * @description fallback-src directive supplying alternative src for images that fail to load
 */
    .directive('loginModal', function factory(ModalService) { return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            scope.loginData = {};
            element.on('click', function() {
                ModalService.openModal( {
                    templateUrl: 'directives/modals/login/login.tpl.html',
                    controller: 'LoginModalController',
                    backdrop: 'static',
                    resolve: {
                        loginData: function () {
                            return scope.loginData;
                        }
                    }

                });
            });
        }
    };})
/**
 * @ngdoc controller
 * @name LoginModalController
 */
    .controller('LoginModalController', function LoginModalController($scope, ModalService, $state, AuthService, RoutingUtilsService) {
        $scope.preTag = "OCLogMdl";
        // $scope.loginData = loginData;

        $scope.close = function() {
            window.location.href = RoutingUtilsService.frontendBaseUrl(' ');
            ModalService.closeModal();
        };

    });

angular.module('olci.directives.modals', [
    'olci.directives.modals.alerts',
    'olci.directives.modals.login',
    'olci.directives.modals.expenseAgreement'
]);
angular.module('olci.directives.modals.alerts', [
    'ui.bootstrap',
    'ngCookies',
    'ngStorage',
    'olci.services.ModalService',
    'olci.services.GetCopyService',
    'olci.services.DataTransformService'
])

.directive('passportVisaNotification', function( ModalService, $cookies, $sessionStorage) {
    return {
        restrict: 'A',
        scope: { passenger: '=' },
        link: function(scope, element, attrs) {
            element.on('click', function() {
                if ( $cookies[$sessionStorage.bookingInfo.bookingNumber + scope.passenger.seqNumber + 'termsConditionsVisaFlag'] !== 'true' || attrs.pvnInfinite.toLowerCase() === 'true' ) {
                    ModalService.openModal({
                        templateUrl: 'directives/modals/passportVisaNotification/passportVisaNotification.tpl.html',
                        controller: 'passportVisaNotificationController',
                        windowClass: 'passport-visa-notification-modal',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            agreeToTerms: function() {
                                return attrs.agreeToTerms;
                            },
                            passenger: function () {
                                return scope.passenger;
                            }
                        }
                    });
                }
            });
        }
    };
})

.controller('passportVisaNotificationController', function( $scope, $cookies, $sessionStorage, agreeToTerms, passenger, ModalService, GetCopyService) {
    $scope.alerts = {};
    $scope.copy = "";

    // Check for voyage specific notification first.  If none, get default notification.
    if ( passenger.notifications[0].notification !== '' ) {
        passenger.notifications.map( function (notification) {
            $scope.copy += notification.description;
        });
    }
    else {
        GetCopyService.visaNotificationCopy().then( function(copy) {
            $scope.copy = copy;
        });
    }

    $scope.close = function() {
        $cookies[$sessionStorage.bookingInfo.bookingNumber + passenger.seqNumber + 'termsConditionsVisaFlag'] = 'true';

        var currDate = new Date();
        passenger.CheckInPassenger.termsConditionsVisaFlag = currDate.getFullYear() + "-" + currDate.getDay() + "-" + currDate.getMonth();

        ModalService.closeModal();
    };
});

/*
 * staleSessionModal.js
 *
 * Created: Thursday, December 12, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc directive
 * @name olci.directives.modals.staleSessionModal
 * @restrict A
 * @element ANY
 * @description A modal dialog that fetches and displays Terms and Conditions according to the user's country,
 * determined via inspection of the frontend data packet.
 */
angular.module( 'olci.directives.modals.staleSessionModal', [
    'ui.bootstrap',
    // 'olci.services.AssetService',
    'olci.services.AuthService',
    'olci.services.ModalService',
    'olci.services.StaleSessionService'
])

    .directive('staleSessionModal', function(ModalService) { return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.on('click', function() {
                ModalService.openModal({
                    templateUrl: 'directives/modals/staleSessionModal/staleSessionModal.tpl.html',
                    controller: 'staleSessionModalController',
                    windowClass: 'stale-session-modal',
                    backdrop: 'static',
                    keyboard: false
                });
            });
        }
    };})
/**
 * @ngdoc method
 * @name olci.directives.modals.staleSessionModal#staleSessionModalController
 * @methodOf olci.directives.modals.staleSessionModal
 *
 */
    .controller('staleSessionModalController',
    function staleSessionModalController($window, $timeout, $state, $scope, $cookies, ModalService, AuthService, Configuration, StaleSessionService) {

        $scope.sessionExpired = false;
        $scope.frontEndUrl = Configuration.frontend.baseUrl;
        $scope.isLoggedIn = false;

        $scope.redirectLoggedOutUser = function() {
            if ($scope.isLoggedIn) {
                $window.location.href = Configuration.frontend.baseUrl;
            } else {
                $state.go('findBooking');
            }
        };

        $scope.chooseEndSession = function() {
            // get this before logging out
            $scope.isLoggedIn = AuthService.isLoggedIn();
            StaleSessionService.endSession()
                .finally(function() {
                    $scope.userLoggedOut = true;
                    $scope.redirectLoggedOutUser();
                });
        };

        $scope.chooseContinueSession = function() {
            return StaleSessionService.continueSession()
                .then(
                    function() {
                        ModalService.closeModal();
                    })
                .catch(
                    function() {
                        $scope.sessionExpired = true;
                        $timeout($scope.chooseEndSession,6000);
                    }
                );
        };

    });



/**
 * @ngdoc directive
 * @name olci.directives.olciAccordion
 * @description Directive guest accordion.
 */
angular.module('olci.directives.olciAccordion', [
        'olci.services.ChangePageService',
        'olci.services.LoyaltyService',
        'vendor.steelToe'
    ])

    .directive('olciAccordion', function factory() {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: 'directives/olciAccordion/olciAccordion.tpl.html',
            controller: function( $scope, $state, ChangePageService ) {
                $scope.isOpen = [];
                $scope.isOpen[ 0 ] = true;  // TODO: Use function from checkinProgress.js

                $scope.isComplete = function (page, seqNumber) {
                    var result = false;
                    switch(page) {
                        case 'details':
                            result = $scope.detailsIsComplete( seqNumber );
                            break;
                        case 'passport':
                            result = $scope.passportIsComplete( seqNumber );
                            break;
                        case 'flights':
                            result = $scope.flightsIsComplete( seqNumber );
                            break;
                        case 'emergency':
                            result = $scope.emergencyIsComplete( seqNumber );
                            break;
                        case 'account':
                            result = $scope.accountIsComplete( seqNumber );
                            break;
                        case 'preferences':
                            result = $scope.preferencesIsComplete( seqNumber );
                            break;
                    }
                    return result;
                };

                $scope.prevGuest = function ( index ) {
                    $scope.isOpen.forEach( function (obj, index, arr) {
                        arr[index] = false;
                    });
                    $scope.isOpen[parseInt( index ) - 1 ] = true;
                };
                $scope.nextGuest = function ( index ) {
                    $scope.isOpen.forEach( function (obj, index, arr) {
                        arr[index] = false;
                    });
                    $scope.isOpen[parseInt( index ) + 1 ] = true;
                    var top = document.getElementsByClassName('guest-accordion-header')[index].offsetTop; //Getting Y of target element
                    window.scrollTo(0, top);
                };

                $scope.continue = function (callfirst) {
                    callfirst().then(function(res) {
                        console.log(res);
                        ChangePageService.nextPage();
                    }, function(err) {
                        console.log(err);
                    });
                };
            },
            link: function (scope, element, attr, ctrl, transclude) {
                scope.page = attr.olciAccordionPage;

                // http://angular-tips.com/blog/2014/03/transclusion-and-scopes/
                // transclude(scope, function(clone, scope) {
                //     element.append(clone);
                // });
            }
        };
    })

    .directive('passengerTransclude', function() {
        return {
            restrict: "A",
            link: function (scope, elem, attrs, ctrl, $transclude) {
                // Create a new scope that inherits from the parent of the
                // search directive ($parent.$parent) so that result can be used with other
                // items within that scope (e.g. selectResult)
                var newScope = scope.$parent.$new();
                // Put result from isolate to be available to transcluded content
                // newScope.passenger = scope.$eval(attrs.passenger);
                $transclude(newScope, function (clone) {
                    elem.append(clone);
                });
            }
        };
    });

angular.module('olci.directives.pageTitle', [])
    .directive('title', function($translate) {
       return {
           restrict: 'E',
           replace: false,
           link: function (scope, elem, attrs) {
               scope.$watch('pageTitle', function (newval) {
                   $translate('pageTitleTemplate', {pageTitle : newval})
                       .then(function(pageTitle) {
                           elem.html(pageTitle);
                       });
               });
               elem.html(scope.pageTitle);
           }
       };
    });


/**
 * @ngdoc directive
 * @name olci.directives.buttonGreen
 * @description Directive for turning input with typeahead into a dropdown.
 */
angular.module('olci.directives.typeaheadDropdown', ['ui.bootstrap'])

    .directive('typeaheadDropdown', function factory( $parse, $timeout ) {
        return {
            require: 'ngModel',
            scope: true,
            link: function(scope, el, attrs, ngModel) {
                // START Modified from : https://github.com/angular-ui/bootstrap/blob/master/src/typeahead/typeahead.js
                var TYPEAHEAD_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+([\s\S]+?)$/;

                function parse( input ) {
                    var match = input.match(TYPEAHEAD_REGEXP);
                    if (!match) {
                        throw new Error(
                            'Expected typeahead specification in form of "_modelValue_ (as _label_)? for _item_ in _collection_"' +
                            ' but got "' + input + '".');
                    }

                    return {
                        itemName    : match[3],
                        source      : $parse(match[4]),
                        viewMapper  : $parse(match[2] || match[1]),
                        modelMapper : $parse(match[1])
                    };
                }
                // Expressions used by typeahead
                var parserResult = parse(attrs.typeahead);
                var context = this;

                // END Modified from: https://github.com/angular-ui/bootstrap/blob/master/src/typeahead/typeahead.js

                // Modified from: http://plnkr.co/edit/ZtuoTVgPLuMWDT2ejULW?p=preview
                ngModel.$parsers.push( function (inputValue) {
                    if ( !parserResult.source(scope, {$viewValue: inputValue}).length ) {
                        ngModel.$setValidity('typeahead', false);
                    }
                    else {
                        ngModel.$setValidity('typeahead', true);
                    }
                    
                    // Don't put empty space to model
                    if( inputValue === ' ' ){
                        return '';
                    }
                    return inputValue;
                });

                el.bind( 'focus', function (e) {
                    var viewValue = ngModel.$viewValue;

                    // Restore to null value so that the typeahead can detect a change
                    if (viewValue === ' ') {
                        ngModel.$setViewValue('');
                    }

                    // Force trigger the popup
                    ngModel.$setViewValue(' ');

                    // Set the actual value in case there was already a value in the input
                    ngModel.$setViewValue( viewValue || ' ' );
                });


                el.bind( 'blur', function (e) {

                        console.log(ngModel.$viewValue);
                        console.log(parserResult);
                        
                        var matchArray = parserResult.source(scope, {$viewValue: ngModel.$viewValue});
                        var match = false;

                        matchArray.forEach( function ( item ) {
                            if ( item.label === ngModel.$viewValue ) {
                                match = true;
                            }
                        });
                        if ( match ) {
                            ngModel.$setValidity('typeahead', true);
                        }
                        else {
                            if ( !e.relatedTarget ) {
                                ngModel.$setValidity('typeahead', false);
                                ngModel.$modelValue = undefined;
                            }
                        }
                    
                });

                // Maybe in $formatters? - http://stackoverflow.com/questions/17011288/angularjs-initial-form-validation-with-directives
                // el.bind( 'blur', function (e) {
                //     if ( !parserResult.source(scope, {$viewValue: ngModel.$viewValue}).length ) {
                //         ngModel.$setViewValue( '' );
                //     }
                // });


                scope.onSelect = function( item ) {
                    console.log('select');
                    // ngModel.$viewValue = item.label ;
                    // ngModel.$setValidity('typeahead', true);
                    el[0].focus();  // For some reason blur isn't working, but focus gets us the expected behaviour.
                };


                // Filter to return all items if input is blank.
                scope.emptyOrMatch = function( actual, input ) {
                    if (input === ' ') {
                        return true;
                    }
                    // var match = false;
                    // collection.forEach( function ( item ) {
                    //     if ( item.label === ngModel.$viewValue ) {
                    //         match = true;
                    //     }
                    // });
                    // ngModel.$setValidity('typeahead', match);
                    return actual.toLowerCase().indexOf( input.toLowerCase() ) > -1;
                };

                scope.startsWith = function( actual, input ) {
                    return actual.substr(0, input.length).toUpperCase() === input.toUpperCase();
                };
            }
        };
    });

/*
 * AnalyticsService.js
 *
 * Created: Tuesday, February 3, 2015
 * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name olci.services.AnalyticsService
 * @description Performs analytics tasks
 * @requires restangular
 * @requires olci.services.AuthService (opt?)
 * @requires olci.services.RoutingUtilsService (opt?)
 * @requires olci.filters.PortNameFilter (opt?)
 */

angular.module( 'olci.services.AnalyticsService', [])

/**
 * @ngdoc service
 * @name olci.services.AnalyticsService
 * @description Used for Tealeaf and WebTrends events, among others.
 */
.service('AnalyticsService', [ '$window', '$document', '$injector', function($window, $document, $injector) {
        var self = {

            /**
             * @ngdoc getBrowserData
             * @name olci.services.AnalyticsService#getBrowserData
             * @methodOf olci.services.AnalyticsService
             * @returns {object} Useful browser information.
             */
            getBrowserData: function() {
                return {
                    navigator: {
                        platform: $window.navigator.platform,
                        product: $window.navigator.product,
                        productSub: $window.navigator.productSub,
                        vendor: $window.navigator.vendor
                    }
                };
            },

            /**
             * @ngdoc logStateChange
             * @name olci.services.AnalyticsService#logStateChange
             * @methodOf olci.services.AnalyticsService
             * @description Logs a state change event to the analytics providers
             * @param {object} toState The toState from the stateChangeSuccess method
             * @param {object} toParams The toParamms from the stateChangeSuccess method
             * @param {object} fromState The fromState from the stateChangeSuccess method
             * @param {object} fromParams The fromParams from the stateChangeSuccess method
             */
            logStateChange: function(toState, toParams, fromState, fromParams) {
                var data = {
                    referrer: $document.referrer || "",
                    toState: {
                        name: toState.name,
                        url: toState.url,
                        fullUrl: $window.location.href,
                        params: fromParams
                    },
                    fromState: {
                        name: fromState.name,
                        url: fromState.url,
                        params: fromParams
                    }
                };

                self.logCustomEvent('pageView: '+toState.name, data);
            },

            /**
             * @ngdoc logStateChangeError
             * @name olci.services.AnalyticsService#logStateChangeError
             * @methodOf olci.services.AnalyticsService
             * @description Logs a state change error event to the analytics providers
             * @param {object} toState The toState from the stateChangeError method
             * @param {object} toParams The toParamms from the stateChangeError method
             * @param {object} fromState The fromState from the stateChangeError method
             * @param {object} fromParams The fromParams from the stateChangeError method
             * @param {object} error The error from the stateChangeError method
             */
            logStateChangeError: function(toState, toParams, fromState, fromParams, error) {
                var data = {
                    referrer: $document.referrer,
                    toState: {
                        name: toState.name,
                        url: toState.url,
                        fullUrl: $window.location.href,
                        params: fromParams
                    },
                    fromState: {
                        name: fromState.name,
                        url: fromState.url,
                        params: fromParams
                    },
                    error: error
                };

                self.logCustomEvent('pageView Error: '+toState.name, data);
            },

            /**
             * @ngdoc logCustomEvent
             * @name olci.services.AnalyticsService#logCustomEvent
             * @methodOf olci.services.AnalyticsService
             * @description Logs a custom event to the analytics providers
             * @param {string} eventName An event name to identify the event
             * @param {object} data Any JSON serializable data object to be logged by the analytics software
             */
            logCustomEvent: function(eventName, data) {
                if(!data) { data={}; }
                // angular.extend(data, self.getBrowserData());
                
                if($window.TLT && $window.TLT.isInitialized()) {
                    $window.TLT.logCustomEvent(eventName, data);
                }

                data.eventName = eventName;

                if($window.ensDL) {
                    $window.ensDL(data);
                }
            },

            logScreenviewLoad: function(viewName, altInfo) {
                if($window.TLT && $window.TLT.isInitialized()) {
                    $window.TLT.logScreenviewLoad(viewName, altInfo);
                }

                if($window.ensDL) {
                    $window.ensDL({
                        eventName: 'ScreenView',
                        name: viewName,
                        referrer: altInfo
                    });
                }
            },

            /**
             * @ngdoc logCustomPageView
             * @name analytics.services.AnalyticsService#logCustomPageView
             * @methodOf analytics.services.AnalyticsService
             * @description Logs a custom page view to the analytics providers
             * @param {string} pageName The page being viewed.
             * @param {object} data Any JSON serializable data object to be logged by the analytics software
             */
            logCustomPageView: function(pageName, data){
                self.logCustomEvent('PageView: ' + pageName, data);
            },

            /**
             * @ngdoc flush
             * @name olci.services.AnalyticsService#flush
             * @methodOf olci.services.AnalyticsService
             * @description Flushes the queues of the analytics tools, sending the data to the external services.
             */
            flush: function() {
                if($window.TLT) { $window.TLT.flushAll(); }
            },

            /**
             * @ngdoc _cleanLogInfo
             * @name olci.services.AnalyticsService#_cleanLogInfo
             * @methodOf olci.services.AnalyticsService
             * @description Private function that removes certain private variables and data that should not be logged.
             */
            _cleanLogInfo: function(request) {
                var logInfo = angular.copy(request, {});
                var authenticationRequestMatcher = new RegExp(/olci\/api\/authentication/);

                //delete some angular-specific methods
                if(logInfo.transformRequest) { delete logInfo.transformRequest; }
                if(logInfo.transformResponse) { delete logInfo.transformResponse; }

                if(logInfo.data) {
                    //we don't log credit card numbers
                    if(logInfo.data.ccNumber) { delete logInfo.data.ccNumber; }

                    //we don't log passwords
                    if(authenticationRequestMatcher.test(request.url) && typeof logInfo.data == "string") {
                        logInfo.data = logInfo.data.replace(/&secret=.*/, "&secret=xxxx");
                    }
                }
                return logInfo;
            },

            /**
             * @ngdoc logAPIRequest
             * @name olci.services.AnalyticsService#logAPIRequest
             * @methodOf olci.services.AnalyticsService
             * @description Logs API requests.
             */
            logAPIRequest: function(data) {
                var logInfo;
                var apiRequestMatcher = new RegExp(/olci\/api/);

                if (apiRequestMatcher.test(data.url)) {
                    //Makes sure we don't log templates
                    //overwrite logInfo with a cleaned version
                    logInfo = self._cleanLogInfo(data);
                    self.logCustomEvent("APIRequest", logInfo);
                }
            },

            /**
             * @ngdoc logAPIResponse
             * @name olci.services.AnalyticsService#logAPIResponse
             * @methodOf olci.services.AnalyticsService
             * @description Logs API responses.
             */
            logAPIResponse: function(data) {
                var apiRequestMatcher = new RegExp(/olci\/api/);

                if (apiRequestMatcher.test(data.config.url)) {
                    self.logCustomEvent("APIResponse", data);
                }
            },

            /**
             * @ngdoc logModalOpenEvent
             * @name olci.services.AnalyticsService#logModalOpenEvent
             * @methodOf olci.services.AnalyticsService
             * @param {object} data The arguments used to open the modal.
             * @description Logs Modal open events.
             */
            logModalOpenEvent: function(data) {
                var copiedData = {};
                angular.copy(data, copiedData);

                var modalName = data.windowClass || data.controller;
                modalName += ( modalName !== data.controller ? ' ' + data.controller : '' );
                var $state = $injector.get('$state');
                if ($state.current) {
                    copiedData.stateName = $state.current.name;
                }

                self.logCustomEvent("ModalOpen: " + modalName, copiedData);
            },


            /**
             * @ngdoc logModalOpenEvent
             * @name olci.services.AnalyticsService#logModalOpenEvent
             * @methodOf olci.services.AnalyticsService
             * @param {object} data The arguments used to open the modal.
             * @description Logs Modal open events.
             */
            logModalCloseEvent: function(data) {
                var modalName = data.windowClass || data.controller;
                modalName += ( modalName !== data.controller ? ' ' + data.controller : '' );
                var $state = $injector.get('$state');
                if($state.current) {
                    data.stateName = $state.current.name;
                }
                self.logCustomEvent("ModalClose: "+modalName, data);
            }
        };

        return self;
    }
]);
/*
 * AuthService.js
 *
 * Created: Friday, February 21, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name secondaryFlow.services.AuthService
 * @description Reads and sets user's HAL token to/from cookie.
 * Authenticates and verifies user token, and handles role changes.
 * @requires restangular
 * @requires ApplicationConfiguration
 * @requires ui.router
 * @requires ngCookies
 *
 */
angular.module( 'olci.services.AuthService', [
    'restangular',
    'ApplicationConfiguration',
    'ngCookies',
    'olci.services.AnalyticsService',
    'olci.services.SharedDataService',
    'ngStorage'
])

.service( 'AuthService', function (Restangular, Configuration, $q, $cookies, AnalyticsService, SharedDataService, $sessionStorage) {
    var me = {

        ROLES_WITH_BOOKING: {
            GIFTER: [ // gifters cannot see these sections
                'headerWelcomeMessage',
                'headerMyAccount',
                'headerSignOut',
                'headerCheckIn',
                'headerMakePayment',
                'headerPromoCode',
                'heroWelcomeName',
                'pnavTravelPlanning',
                'heroBookFlightsTravel',
                'heroStateroomTile',
                'b4LeaveCheckIn',
                'b4LeaveFinalPayment',
                'b4LeaveCPP',
                'b4LeavePrePostCruise',
                'b4LeaveVisas',
                'b4LeaveDeckPlan',
                'itineraryPurchases',

                // sections by (state) name
                'travelOptions',
                'preCruiseTravel',
                'postCruiseTravel',
                'bookFlights',
                'cpp'
            ],
            TRAVEL_AGENT: [ // travel agents cannot see these sections
                'headerWelcomeMessage',
                'headerMyAccount',
                'headerSignOut',
                'headerCheckIn',
                'headerMakePayment',
                'headerPromoCode',
                'heroWelcomeName',
                'pnavTravelPlanning',
                'heroBookFlightsTravel',
                'b4LeaveCheckIn',
                'b4LeaveFinalPayment',
                'b4LeaveCPP',
                'b4LeavePrePostCruise',
                'b4LeaveVisas',
                'b4LeaveDeckPlan',
                'itineraryPurchases',

                // sections by (state) name
                'travelOptions',
                'preCruiseTravel',
                'postCruiseTravel',
                'bookFlights',
                'cpp'
            ],
            'DIRECT_GUEST_LOGGED_IN': [],
            'DIRECT_GUEST_NOT_LOGGED_IN': [
                'headerMakePayment',
                'headerWelcomeMessage',
                'headerSignOut',
                'heroBookFlightsTravel',
                'heroStateroomTile',
                'heroWelcomeName',
                'itineraryPurchases',
                'pnavPrePostCruise',
                'pnavCPP',
                'pnavMakePayment',
                'b4LeaveFinalPayment',
                'b4LeaveCPP',
                'b4LeavePrePostCruise',

                // sections by (state) name
                'travelOptions',
                'cpp'
            ],
            'TRAVEL_AGENCY_BOOKED_GUEST_LOGGED_IN': [
                'headerMakePayment',
                'pnavPrePostCruise',
                'pnavCPP',
                'pnavMakePayment',
                'heroBookFlightsTravel',
                'b4LeaveFinalPayment',
                'b4LeaveCPP',
                'b4LeavePrePostCruise',

                // sections by (state) name
                'travelOptions',
                'cpp'
            ],
            'TRAVEL_AGENCY_BOOKED_GUEST_NOT_LOGGED_IN': [
                'headerMakePayment',
                'headerWelcomeMessage',
                'headerSignOut',
                'heroWelcomeName',
                'pnavPrePostCruise',
                'pnavCPP',
                'pnavMakePayment',
                'heroBookFlightsTravel',
                'heroStateroomTile',
                'b4LeaveFinalPayment',
                'b4LeaveCPP',
                'b4LeavePrePostCruise',
                'itineraryPurchases',

                // sections by (state) name
                'travelOptions',
                'cpp'
            ]



        },

        authenticationBaseUrl: Restangular.one( 'authentication/v1.0.0' ).one( 'companyCode', Configuration.companyCode),

        init: function () {
            me.currentUser = null;
        },

        currentUserResolver: function () {
            var deferred = $q.defer();

            if (me.currentUser !== null) {
                deferred.resolve(me.currentUser);
            } else {
                deferred.resolve(me.recoverSession());
            }
            return deferred.promise;
        },
        
        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#getCurrentUser
         * @methodOf secondaryFlow.services.AuthService
         * @description gets and returns currentUser from cookie, else null.
         * @returns {object} currentUser else null
         * */
        getCurrentUser: function () {
            return me.currentUser;
        },


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#getCurrentRoles
         * @methodOf secondaryFlow.services.AuthService
         * @description Get an array of the roles the current user belongs to.
         * @returns {array} roles[] of roles.
         * */
        getCurrentRoles: function () {
            var roles = [];
            if (me.currentUser && angular.isArray(me.currentUser.roles)) {
                roles = me.currentUser.roles;
            }
            return roles;
        },

        /**
         * Recover session data, for instance on a reload.
         *
         * HAL_AUTH_TOKEN is used for REST calls, but a page reload can potentially get the cookies out of sync,
         * causing the user to appear logged in but all requests fail.
         * @returns {object} promise
         */
        recoverSession: function() {
            return me.verify($sessionStorage.token);
        },

        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#needsSessionRecovery
         * @methodOf secondaryFlow.services.AuthService
         * @description Checks if the token has timed out.
         * @returns {boolean} true if the token has timed out
         **/
        needsSessionRecovery: function(){
            var currentTime = (new Date()).getTime();
            var timeoutms = Configuration.tokenTimeout;
            var tokenTimestamp = $sessionStorage.tokenTimestamp;
            return (tokenTimestamp !== null && (currentTime - tokenTimestamp) > timeoutms);
        },

        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#authenticate
         * @methodOf secondaryFlow.services.AuthService
         * @description Authenticates user.
         * @param {string} bookingNumber e.g. GPML8P
         * @param {string} lastName e.g. BETTES
         * @returns {object} promise
         * */
        authenticate: function ( bookingNumber, lastName ) {
            var header = {
                "Content-Type": "application/x-www-form-urlencoded;"
            };

            var authData = me._transformRequestObject({
                "key": bookingNumber,
                "secret": lastName
            });

            return me.authenticationBaseUrl.customPOST( authData, undefined, undefined, header ).then(function ( data ) {
                return me._checkAuthentication( data );
            });
        },

        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#requestRoleChange
         * @methodOf secondaryFlow.services.AuthService
         * @description changes roles if authorized.
         * @param {string} newRole string.
         * @returns {object} promise.
         * */
        requestRoleChange: function( newRole ) {
            var request = me.authenticationBaseUrl.one( me.getCurrentUser().token + '/role/' + newRole );

            return request.put().then(function ( data ) {
                return me._checkAuthentication( data );
            });
        },


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#verify
         * @methodOf secondaryFlow.services.AuthService
         * @description not sure
         * @param {string} token e.g. xxxxxxxx
         * @returns {object} promise.
         * */
        verify: function ( token ) {
            var deferred = $q.defer();
            if ( !token ) {
                deferred.reject( 'no token' );
            } else {
                me.authenticationBaseUrl.customGET( token ).then(function ( data ) {
                    me._setTokenTimestamp();
                    deferred.resolve( me._checkAuthentication( data ) );
                }).catch(function(){
                    deferred.resolve(deferred.reject( 'no token' ));
                });
            }
            
            return deferred.promise;
        },


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#isAuthenticated
         * @methodOf secondaryFlow.services.AuthService
         * @description tests for current user.
         * @returns {bool} !!getCurrentUser()
         * */
        isAuthenticated: function () {
            return !!( me.getCurrentUser() );
        },


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#isLoggedIn
         * @methodOf secondaryFlow.services.AuthService
         * @description Tests whether current user is logged in to front-end marketing website.
         * @returns {bool} true if user is logged in.
         * */
        isLoggedIn: function() {
            var loggedIn = false;
            var roles = me.getCurrentRoles();

            loggedIn = !!(_.find( roles, function( role ) {
                return role.match(/LOGGED_IN/) && !role.match(/NOT_LOGGED_IN/);
            }));

            return loggedIn;
        },

        isDirectGuest: function() {
            var directGuest = false;
            var roles = me.getCurrentRoles();

            directGuest = !!(_.find( roles, function( role ) {
                return role.match(/DIRECT_GUEST/) && !role.match(/INDIRECT_GUEST/);
            }));

            return directGuest;
        },
        
        isExplorer: function() {
            var loggedIn = false;
            var roles = me.getCurrentRoles();

            loggedIn = !!(_.find( roles, function( role ) {
                return role.match(/EXPLORER/);
            }));

            return loggedIn;
        },
        
        isTravelAgent: function() {
            var loggedIn = false;
            var roles = me.getCurrentRoles();

            loggedIn = !!(_.find( roles, function( role ) {
                return role.match(/TRAVEL_AGENT/);
            }));

            return loggedIn;
        },


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#authorize
         * @methodOf secondaryFlow.services.AuthService
         * @description Checks authorization permission.
         * @param {string} accessLevels a string array with role names or a string with role name.
         * @returns {boolean} true if the role is authorized.
         */
        authorize: function ( name ) {
            var hasAccess = false;
            var roles = me.getCurrentRoles();

            if ( me.ROLES_WITH_BOOKING[ roles[ 0 ] ] && !_.find( me.ROLES_WITH_BOOKING[ roles[ 0 ] ], function( val ) { return val === name; } ) ) {
                hasAccess = true;
            }

            return hasAccess;
        }, 


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#logout
         * @methodOf secondaryFlow.services.AuthService
         * @description Removes session information
         * */
        logout: function () {
            // delete the user token with auth service endpoint
            var resolve =  me.authenticationBaseUrl.one( $sessionStorage.token ).remove()
                .finally(function() {
                    // Wipe out cookies and user
                    document.cookie = 'HAL_AUTH_TOKEN=;path=/secondary/api'; // REST cookie at /secondary/api
                    $sessionStorage.token = '';
                    $sessionStorage.tokenTimestamp = '';
                    me.init();
                    $state.go( 'findBooking' );
                }
            );

            return resolve;
        },

        /**
         * Glean authentication information out of the data returned from one of the auth calls
         *
         * @param authData
         * @private
         */
        _extractCurrentUser: function ( authData ) {
            var currentUser = authData;

            // TODO: remove this and refactor the references,
            // use currentUser.details.* instead
            if (authData.details) {
                currentUser.bookingNumber = authData.details.bookingNumber;
                currentUser.lastName = authData.details.lastName;
                currentUser.countryCode = authData.details.country;

                // SharedDataService.setCountryOfLocale( authData.details.country );
            }

            return currentUser;
        },

        /**
         * Glean authentication information out of the data returned from one of the auth calls
         *
         * @param authData
         * @private
         * @return promise
         */
        _checkAuthentication: function ( authData ) {
            var userData = me._extractCurrentUser( authData );

            // store auth token for later, but don't let Angular set expiration date
            $sessionStorage.currentUser = userData.token;
            me._setTokenTimestamp();
            me.currentUser = userData;

            // check for invalid role
            var securityCheckRoles = _.intersection(userData.roles, Object.keys(me.ROLES_WITH_BOOKING));
            // It's only an invalid role if the booking number is present,
            // otherwise the user should see the login screen with fields filled in.
            if ( securityCheckRoles.length === 0 && userData.bookingNumber ){
                me.init();
                return $q.reject( 'INVALID_ROLE' );
            }
            return $q.when( userData );
        },

        _transformRequestObject: function ( obj ) {
            var str = [];
            for ( var p in obj ) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            return str.join( "&" );
        },

        _setTokenTimestamp: function(){
            $sessionStorage.tokenTimestamp = new Date().getTime();
        }

    };

    me.init();
    return me;
});

// /*
//  * BookingService.js
//  *
//  * Created: Friday, February 07, 2014
//  * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
//  * This is unpublished proprietary source code of Holland America, Inc.
//  * The copyright notice above does not evidence any actual or intended
//  * publication of such source code.
//  */


// /**
//  * @ngdoc service
//  * @name olci.services.BookingService
//  * @description GETs and sets booking summary data, including authorizations.
//  * @requires restangular
//  * @requires olci.services.AuthService
//  * @requires olci.services.RoutingUtilsService
//  * @requires olci.filters.PortNameFilter
//  */

// angular.module('olci.services.BookingService', [
//     'restangular',
//     'ApplicationConfiguration',
//     'olci.services.AuthService',
// //     'olci.services.RoutingUtilsService',
// //     'olci.services.TimeUtilsService',
// //     'olci.filters.PortNameFilter',
// //     'olci.filters.TitleCaseFilter'
// ])

// /**
//  * @ngdoc service
//  * @name olci.services.BookingService
//  * @description An empty service description. Please fill in a high level description of this
//  *     service.
//  */
//     .service('BookingService', [ 'Restangular', '$q', '$interpolate', '$location', '$filter', 'Configuration', 'RoutingUtilsService', 'TimeUtilsService', 'AuthService',
//         function (Restangular, $q, $interpolate, $location, $filter, Configuration, RoutingUtilsService, TimeUtilsService, AuthService) {
//             var appName = Configuration.appName;

//             return {
//                 bookingBaseUrl: Restangular.one('guest/v1.0.0/booking').one('companyCode', Configuration.companyCode),
//                 bookingSummary: null,

//                 bookingSummaryResolver: function () {
//                     var self = this;
//                     var promise = $q.reject('not logged in');

//                     if (self.bookingSummary !== null) {
//                         promise = $q.when(self.bookingSummary);
//                     } else if (AuthService.isAuthenticated()) {
//                         promise = self.getBookingSummary(AuthService.currentUser.bookingNumber).then(function (bookingSummary) {
//                             self.bookingSummary = bookingSummary;
//                             return bookingSummary;
//                         });
//                     }

//                     return promise;
//                 },

//                 _setItineraryDate: function (itineraryDayList) {
//                     if (itineraryDayList !== undefined) {

//                         for (var i = 0; i < itineraryDayList.length; i++) {
//                             itineraryDayList[i].label = $filter('date')(itineraryDayList[i].date, 'MMMM d') + " - " + itineraryDayList[i].portName;
//                         }
//                     }
//                 },

//                 _setGuestDisplayNames: function (guests) {
//                     if (guests !== undefined) {
//                         for (var g = 0; g < guests.length; g++) {
//                             var guest = guests[g];
//                             var displayName = $interpolate('{{firstName}} {{lastName}}')(guest);

//                             guest.name = $filter('titleCase')(displayName);
//                         }
//                     }
//                 },

//                 /**
//                  * @ngdoc method
//                  * @name olci.services.BookingService#getBookingSummary
//                  * @methodOf olci.services.BookingService
//                  * @description GETs and sets bookingSummary data.
//                  * @returns {object} promise object
//                  * */
//                 getBookingSummary: function (bookingNumber) {
//                     var self = this;
//                     var deferred = $q.defer();

//                     var getBookingSummary = self.bookingBaseUrl
//                         .one('bookingNumber', bookingNumber);

//                     getBookingSummary.get().then(function (bookingSummary) {

//                         self._cleanUpBookingSummary(bookingSummary);

//                         deferred.resolve(bookingSummary);
//                     }, function (error) {
//                         deferred.reject(error);
//                     });

//                     return deferred.promise;
//                 },
//                 _portMetadata: function (itineraryDay) {
//                     if (itineraryDay.portName === null) {
//                         return { };
//                     }

//                     // Fix casing for departure, return ports
//                     var portStrings = itineraryDay.portName.split(',').map(function (entry) {
//                         return entry.trim();
//                     });
//                     var portData = {
//                         country: portStrings.pop(),
//                         city: portStrings.join(', ')
//                     };

//                     portData.name = $interpolate("{{ city }}, {{ country }}")(portData);

//                     return portData;
//                 },
//                 _cleanUpBookingSummary: function (bookingSummary) {
//                     var self = this;

//                     // Stateroom file name is uppercase, ship image is lowercase
//                     bookingSummary.stateroomImage = $interpolate(RoutingUtilsService.frontendBaseUrl("/images/cruise-vacation-onboard/ships/{{ shipCode }}/150XInside.jpg"))(bookingSummary);
//                     bookingSummary.shipImage = $interpolate(RoutingUtilsService.frontendBaseUrl("/assets/deckplans/ships/{{ shipCode | lowercase }}.jpg"))(bookingSummary);
//                     bookingSummary.mapImage = $interpolate(RoutingUtilsService.frontendBaseUrl("/images/itineraryMaps/{{ itineraryCode }}.jpg"))(bookingSummary);

//                     // Fix up Itinerary Data
//                     var itineraryDayList = bookingSummary.itinerary.itineraryDayList;
//                     for (var i = 0; i < itineraryDayList.length; i++) {
//                         var day = itineraryDayList[i];

//                         // TODO: (JDM) the server should be giving us dates in the format it expects to receive
//                         // them
//                         day.serviceDateCode = $interpolate('{{ date | date : "yyyyMMdd" }}')(day);
//                         day.portNameShort = $interpolate('{{ portName | portName }}')(day);
//                     }

//                     bookingSummary.departurePort = self._portMetadata(itineraryDayList[0]);
//                     bookingSummary.returnPort = self._portMetadata(itineraryDayList[itineraryDayList.length - 1]);

//                     bookingSummary.heroImages = self.getHeroImage(bookingSummary.itineraryCode);

//                     bookingSummary.itinerary.beginDate = itineraryDayList[0].arrivalDateTime;
//                     bookingSummary.itinerary.endDate = itineraryDayList[itineraryDayList.length - 1].arrivalDateTime;

//                     // sets days till departure for messaging around the 3 day rule.
//                     var daysTillDeparture = 3;
//                     var daysLeft = TimeUtilsService.daysLeft(bookingSummary.itinerary.beginDate, new Date());
//                     bookingSummary.purchasesAllowed = (daysLeft > daysTillDeparture); // returns true/false -
//                     // true: you can make
//                     // purchases - false: you
//                     // cannot make purchases

//                     self._setGuestDisplayNames(bookingSummary.guests);
//                     self._setItineraryDate(bookingSummary.itinerary.itineraryDayList);

//                     return bookingSummary;
//                 },

//                 /**
//                  * @ngdoc method
//                  * @name olci.services.BookingService#getHeroImage
//                  * @methodOf olci.services.BookingService
//                  * @description map of hero images, e.g. 'hero-itinerary-A.jpg'
//                  * @returns {object} hero image map
//                  * */
//                 getHeroImage: function (itineraryId) {
//                     var self = this;
//                     var itineraryCode = itineraryId.substring(0, 2);
//                     var destCode = itineraryCode.substring(0, 1);

//                     var itineraryImage = self.heroImageMap[itineraryCode];
//                     var destinationImage = self.heroImageMap[destCode];
//                     var images = self.heroImageMap['default'];

//                     if (itineraryImage) {
//                         images = itineraryImage;
//                     } else if (destinationImage) {
//                         images = destinationImage;
//                     }

//                     return {
//                         shorex: '/content/'+appName+'/cruise-experience/shorex/' + images.shorex,
//                         itinerary: '/content/'+appName+'/cruise-experience/itinerary/' + images.itinerary,
//                         home: '/content/'+appName+'/cruise-experience/home/' + images.home,
//                         spa: '/content/'+appName+'/cruise-experience/spa/' + images.spa
//                     };
//                 },

//                 heroImageMap: {
//                     'A': {
//                         itinerary: 'hero-itinerary-A.jpg',
//                         shorex: 'hero-shorex-A.jpg',
//                         home: 'hero-home-A.jpg'
//                     },
//                     'AC': {
//                         itinerary: 'hero-itinerary-AC.jpg',
//                         shorex: 'hero-shorex-AC.jpg',
//                         home: 'hero-home-AC.jpg'
//                     },
//                     'AT': {
//                         itinerary: 'hero-itinerary-AT.jpg',
//                         shorex: 'hero-shorex-AT.jpg',
//                         home: 'hero-home-AT.jpg'
//                     },
//                     'B': {
//                         itinerary: 'hero-itinerary-B.jpg',
//                         shorex: 'hero-shorex-B.jpg',
//                         home: 'hero-home-B.jpg'
//                     },
//                     'C': {
//                         itinerary: 'hero-itinerary-C.jpg',
//                         shorex: 'hero-shorex-C.jpg',
//                         home: 'hero-home-C.jpg'
//                     },
//                     'CE': {
//                         itinerary: 'hero-itinerary-CE.jpg',
//                         shorex: 'hero-shorex-CE.jpg',
//                         home: 'hero-home-CE.jpg'
//                     },
//                     'CF': {
//                         itinerary: 'hero-itinerary-CF.jpg',
//                         shorex: 'hero-shorex-CF.jpg',
//                         home: 'hero-home-CF.jpg'
//                     },
//                     'CS': {
//                         itinerary: 'hero-itinerary-CS.jpg',
//                         shorex: 'hero-shorex-CS.jpg',
//                         home: 'hero-home-CS.jpg'
//                     },
//                     'CW': {
//                         itinerary: 'hero-itinerary-CW.jpg',
//                         shorex: 'hero-shorex-CW.jpg',
//                         home: 'hero-home-CW.jpg'
//                     },
//                     'E': {
//                         itinerary: 'hero-itinerary-E.jpg',
//                         shorex: 'hero-shorex-E.jpg',
//                         home: 'hero-home-E.jpg'
//                     },
//                     'EB': {
//                         itinerary: 'hero-itinerary-EB.jpg',
//                         shorex: 'hero-shorex-EB.jpg',
//                         home: 'hero-home-EB.jpg'
//                     },
//                     'EC': {
//                         itinerary: 'hero-itinerary-EC.jpg',
//                         shorex: 'hero-shorex-EC.jpg',
//                         home: 'hero-home-EC.jpg'
//                     },
//                     'EM': {
//                         itinerary: 'hero-itinerary-EM.jpg',
//                         shorex: 'hero-shorex-EM.jpg',
//                         home: 'hero-home-EM.jpg'
//                     },
//                     'EN': {
//                         itinerary: 'hero-itinerary-EN.jpg',
//                         shorex: 'hero-shorex-EN.jpg',
//                         home: 'hero-home-EN.jpg'
//                     },
//                     'ET': {
//                         itinerary: 'hero-itinerary-ET.jpg',
//                         shorex: 'hero-shorex-ET.jpg',
//                         home: 'hero-home-ET.jpg'
//                     },
//                     'EW': {
//                         itinerary: 'hero-itinerary-EW.jpg',
//                         shorex: 'hero-shorex-EW.jpg',
//                         home: 'hero-home-EW.jpg'
//                     },
//                     'H': {
//                         itinerary: 'hero-itinerary-H.jpg',
//                         shorex: 'hero-shorex-H.jpg',
//                         home: 'hero-home-H.jpg'
//                     },
//                     'I': {
//                         itinerary: 'hero-itinerary-I.jpg',
//                         shorex: 'hero-shorex-I.jpg',
//                         home: 'hero-home-I.jpg'
//                     },
//                     'IA': {
//                         itinerary: 'hero-itinerary-IA.jpg',
//                         shorex: 'hero-shorex-IA.jpg',
//                         home: 'hero-home-IA.jpg'
//                     },
//                     'IF': {
//                         itinerary: 'hero-itinerary-IF.jpg',
//                         shorex: 'hero-shorex-IF.jpg',
//                         home: 'hero-home-IF.jpg'
//                     },
//                     'L': {
//                         itinerary: 'hero-itinerary-L.jpg',
//                         shorex: 'hero-shorex-L.jpg',
//                         home: 'hero-home-L.jpg'
//                     },
//                     'M': {
//                         itinerary: 'hero-itinerary-M.jpg',
//                         shorex: 'hero-shorex-M.jpg',
//                         home: 'hero-home-M.jpg'
//                     },
//                     'N': {
//                         itinerary: 'hero-itinerary-N.jpg',
//                         shorex: 'hero-shorex-N.jpg',
//                         home: 'hero-home-N.jpg'
//                     },
//                     'O': {
//                         itinerary: 'hero-itinerary-O.jpg',
//                         shorex: 'hero-shorex-O.jpg',
//                         home: 'hero-home-O.jpg'
//                     },
//                     'P': {
//                         itinerary: 'hero-itinerary-P.jpg',
//                         shorex: 'hero-shorex-P.jpg',
//                         home: 'hero-home-P.jpg'
//                     },
//                     'S': {
//                         itinerary: 'hero-itinerary-S.jpg',
//                         shorex: 'hero-shorex-S.jpg',
//                         home: 'hero-home-S.jpg'
//                     },
//                     'SN': {
//                         itinerary: 'hero-itinerary-SN.jpg',
//                         shorex: 'hero-shorex-SN.jpg',
//                         home: 'hero-home-SN.jpg'
//                     },
//                     'T': {
//                         itinerary: 'hero-itinerary-T.jpg',
//                         shorex: 'hero-shorex-T.jpg',
//                         home: 'hero-home-T.jpg'
//                     },
//                     'W': {
//                         itinerary: 'hero-itinerary-W.jpg',
//                         shorex: 'hero-shorex-W.jpg',
//                         home: 'hero-home-W.jpg'
//                     },
//                     'WA': {
//                         itinerary: 'hero-itinerary-WA.jpg',
//                         shorex: 'hero-shorex-WA.jpg',
//                         home: 'hero-home-WA.jpg'
//                     },
//                     'WF': {
//                         itinerary: 'hero-itinerary-WF.jpg',
//                         shorex: 'hero-shorex-WF.jpg',
//                         home: 'hero-home-WF.jpg'
//                     },
//                     'WM': {
//                         itinerary: 'hero-itinerary-WM.jpg',
//                         shorex: 'hero-shorex-WM.jpg',
//                         home: 'hero-home-WM.jpg'
//                     },
//                     'WS': {
//                         itinerary: 'hero-itinerary-WS.jpg',
//                         shorex: 'hero-shorex-WS.jpg',
//                         home: 'hero-home-WS.jpg'
//                     },
//                     'WW': {
//                         itinerary: 'hero-itinerary-WW.jpg',
//                         shorex: 'hero-shorex-WW.jpg',
//                         home: 'hero-home-WW.jpg'
//                     },
//                     'X': {
//                         itinerary: 'hero-itinerary-X.jpg',
//                         shorex: 'hero-shorex-X.jpg',
//                         home: 'hero-home-X.jpg'
//                     },
//                     'default': {
//                         itinerary: 'hero-itinerary-default.jpg',
//                         shorex: 'hero-shorex-default.jpg',
//                         home: 'hero-home-default.jpg',
//                         spa: 'hero-spa.jpg'
//                     }
//                 }

//             };
//         }]);

/*
 * BrowserService.js
 *
 * Created: Wednesday, January 7, 2015
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/*
 * return browser type
 * could be extended to give version as well
 */

angular.module('olci.services.BrowserService', [

])

    .service('BrowserService', function ($window) {

        var self = {

            _browserType: undefined,

            getBrowserType: function() {
                if (self._browserType) {
                    return self._browserType;
                } else {
                    self._browserType = "unknown";
                    var userAgent = $window.navigator.userAgent;
                    // order is important, do not change ordering of these strings
                    var browsers = {
                        safari: /safari/i,
                        chrome: /chrome/i,
                        firefox: /firefox/i,
                        opera: /opr/i,
                        ie: /.NET/
                    };
                    for (var key in browsers) {
                        if (userAgent.match(browsers[key])) {
                            self._browserType = key;
                        }
                    }
                    return self._browserType;
                }
            }

        };

        return self;

    });




/**
 * @ngdoc service
 * @name olci.services.ChangePageService
 * @description Service that changes page and all associated logic.
 */
angular.module('olci.services.ChangePageService', [
    'ui.router',
    'ngStorage',
    'ApplicationConfiguration'
])

.factory('ChangePageService', function($state, $sessionStorage, $q, $rootScope, Configuration) {

    var pages = (Configuration.companyCode === 'HAL') ?
    [
        'selectGuest',
        'details',
        'flights',
        'emergency',
        'account',
        'contract',
        'summary'
    ] : [
        'selectGuest',
        'details',
        'flights',
        'emergency',
        'account',
        'contract',
        'preferences',
        'summary'
    ];


    return {
        /**
         * @ngdoc method
         * @name olci.services.ChangePageService#nextPage
         * @methodOf olci.services.ChangePageService
         * @description Changes state to next page in pages array.
         * */
        nextPage: function () {
            var currStateIndex = pages.indexOf( $state.current.name );
            $state.go( pages[currStateIndex + 1] );
        },

        /**
         * @ngdoc method
         * @name olci.services.ChangePageService#getPages
         * @methodOf olci.services.ChangePageService
         * @description Returns array of page names.
         * */
        getPages: function () {
            return pages;
        }

        /**
         * @ngdoc method
         * @name olci.services.ChangePageService#goToPage
         * @methodOf olci.services.ChangePageService
         * @description Changes state to specified page.
         * */
        // goToPage: function( pageName ) {
        //     $state.go( pageName );
        // },

        /**
         * @ngdoc method
         * @name olci.services.ChangePageService#updatePage
         * @methodOf olci.services.ChangePageService
         * @description Updates current page.
         * */
        // updatePage: function( pageName ) {
        //     currPage = pages.indexOf(pageName);
        // }

        // TODO: Logic for Barclay's offer
        // TODO: Logic for when user clicks 'continue' and session has expired?

    };
});

/*
 * ChatCallService.js
 *
 * Created: Tuesday, September 09, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc overview
 * @name homePage.services.ChatCallService
 * @description An empty module description. Please fill in a high level description of this module.
 */
angular.module('olci.services.ChatCallService', [
    'olci.services.FrontEndLinkService'

])

/**
 * @ngdoc service
 * @name homePage.services.ChatCallService
 * @description An empty service description. Please fill in a high level description of this service.
 */
    .service('ChatCallService', function ($q, $http, FrontEndLinkService) {
        
        var loadedChatCallData = null;
        var loadChatCallPromise = false;

        var loadChatCallData = function(mainMenuItem, subMenuItem, requestPage, force){
            var self = this;
            var deferred = $q.defer();
            // var urlRequest = FrontEndLinkService.getChatCallTemplate();
            var urlRequest = '/olci/frontend/main/LoadChatCallData.action';
            
            if(loadChatCallPromise) {
                return loadChatCallPromise;
            }

            $http({
                url: urlRequest,
                method: "POST",
                data: "mainMenuItem=" + encodeURIComponent(mainMenuItem) + "&subMenuItem=" + encodeURIComponent(subMenuItem) + "&requestPage=" + encodeURIComponent(requestPage),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
                }
            }).success(function(data, status, headers, config){
                self.loadedChatCallData = data;
                deferred.resolve(data);
            }).error(function(data, status, headers, config){
                deferred.reject(data);
            });

            loadChatCallPromise = deferred.promise;
            return deferred.promise;
        };
        
        return {

            getChatCallData: function(mainMenuItem, subMenuItem, requestPage) {
                var deferred = $q.defer();
                
                if (loadedChatCallData) {
                    deferred.resolve(loadedChatCallData);
                } else {
                    loadChatCallData(mainMenuItem, subMenuItem, requestPage).then(
                        function(data) {
                            deferred.resolve(data);
                        }
                    );
                }

                return deferred.promise;
            }
        };
    });


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




/**
 * @ngdoc service
 * @name olci.services.FindImageService
 * @description Service that finds and returns a promise for image src strings.
 */
angular.module('olci.services.FindImageService', [
        'ngStorage',
        'vendor.steelToe'
    ])

.factory('FindImageService', function($http, $sessionStorage, $q, steelToe) {
    // Checks if image exists.  Returns default image source if it doesn't.
    // Private helper method.
    function isImage(src, defaultSrc) {

        var deferred = $q.defer();

        var image = new Image();
        image.onerror = function() {
            // console.log('error: ' + src + ' not found');
            deferred.resolve( defaultSrc );
        };
        image.onload = function() {
            deferred.resolve( src );
        };
        image.src = src;

        return deferred.promise;
    }

    return {
        /**
         * @ngdoc method
         * @name olci.services.FindImageService#itineraryImage
         * @methodOf olci.services.FindImageService
         * @description Generate a URL for itinerary image.  If generated URL is not valid, return default image URL.
         * @returns {object} a promise object that returns a relative URL for the resource
         * @example
         <pre>
         'OLCI_dest_A.jpg'
         </pre>
         * */
        itineraryImage: function() {
            var destCode = steelToe.do($sessionStorage).get('bookingInfo.destinationCode') || '';
            return isImage(
                './assets/images/onboard/OLCI_dest_' + destCode.slice(0, 1) + '.jpg',
                './assets/images/onboard/OLCI_dest_default.jpg'
            );
        },

        getHeaderImage: function(companyCode) {
            var imageUrl = (companyCode === 'HAL')?
                './assets/images/header_SVGs/hal-logo.svg':
                './assets/images/header_SVGs/sbn-logo.gif';
            return isImage(imageUrl);

        },


        /**
         * @ngdoc method
         * @name olci.services.FindImageService#bookingSummaryImage
         * @methodOf olci.services.FindImageService
         * @description Generate a URL for booking summary image.  If generated URL is not valid, return default image URL.
         * @returns {object} a promise object that returns a relative URL for the resource
         * @example
         <pre>
         'OLCI_dest_A_2.jpg'
         </pre>
         * */
        bookingSummaryImage: function() {
            var destCode = steelToe.do($sessionStorage).get('bookingInfo.destinationCode') || [];
            return isImage(
                './assets/images/onboard/OLCI_dest_' + destCode.slice(0, 1) + '_2.jpg',
                './assets/images/onboard/OLCI_dest_default_2.jpg'
            );
        },

        marinerImage: function(marinerNum) {
            if (!marinerNum) return '';
            return isImage(
                './assets/star_mariner/' + marinerNum + 'starMariner.gif'
            );
        },


        /**
         * @ngdoc method
         * @name olci.services.FindImageService#stateRoomImage
         * @methodOf olci.services.FindImageService
         * @description Generate a URL stateroom image.  If generated URL is not valid, return default image URL.
         * @returns {object} a promise object that returns a relative URL for the resource
         * @example
         <pre>
         'AM_OLCI_stateroom_neptune.jpg'
         </pre>
         * */
        stateroomImage: function() { 
            var cabinCategories = [ 
                { 
                    category: 'interior', 
                    codes: [ 'I', 'J', 'K', 'L', 'M', 'MM', 'N', 'NN', 'IA', 'IQ', 'R' ] 
                }, 
                {  // TODO: This may not be real.
                    category: 'inside', 
                    codes: [ 'IS' ]  
                }, 
                { 
                    category: 'ocean', 
                    codes: [ 'C', 'CA', 'CQ', 'D', 'DA', 'DD', 'E', 'EE', 'F', 'FA', 'FB', 'FF', 'G', 'H', 'HH', 'GG', 'OO', 'Q' ] 
                }, 
                { 
                    category: 'vista', 
                    codes: [ 'A', 'AA', 'AB', 'AS', 'B', 'BA', 'BB', 'BC', 'BQ' ] 
                }, 
                { 
                    category: 'neptune', 
                    codes: [ 'S', 'SA', 'SB', 'SC', 'SQ' ] 
                }, 
                { 
                    category: 'pinnacle', 
                    codes: [ 'PS' ] 
                }, 
                { 
                    category: 'verandah', 
                    codes: [ 'V', 'VA', 'VB', 'VC', 'VD', 'VE', 'VF', 'VH', 'VQ', 'VS', 'VT' ] 
                }, 
                { 
                    category: 'signature', 
                    codes: [ 'SS', 'SY', 'SZ', 'SU' ] 
                }, 
                { 
                    category: 'lanai', 
                    codes: [ 'CA' ] 
                }, 
            ];
            var shipCode = steelToe.do($sessionStorage).get('bookingInfo.shipCode') || '';
            shipCode.toUpperCase();
            var cabinCategory = steelToe.do($sessionStorage).get('bookingInfo.stateroomCategory') || '';
            cabinCategory.toUpperCase();
            var category = 'default';
            var categoryCount = cabinCategories.length;

            for ( var i = 0; i < categoryCount; i++ ) {
                if ( cabinCategories[i].codes.indexOf( cabinCategory ) !== -1 ) {
                    category = cabinCategories[i].category.toLowerCase();
                    break;
                }
            }

            return isImage(
                './assets/images/onboard/' + shipCode + '_OLCI_stateroom_' + category + '.jpg',
                './assets/images/onboard/OLCI_stateroom_default.jpg'
            );
        }

    };
});



// interior
// I, J, K, L, M, MM, N, NN, IA, IQ, R

// ocean
// C, CA, CQ, D, DA, DD, E, EE, F, FA, FB, FF, G, H, HH, GG, OO, Q

// vista
// A, AA, AB, AS, B, BA, BB, BC, BQ

// neptune
// S, SA, SB, SC, SQ

// pinnacle
// PS

// verandah
// V, VA, VB, VC, VD, VE, VF, VH, VQ, VS, VT

// signature
// SS, SY, SZ, SU

// lanai
// CA


angular.module('olci.services.FocusService', [])

.factory('giveFocus', function($timeout) {
    return function(id) {
        $timeout(function() {
            var element = document.getElementById(id);
            if(element)
                element.focus();
        });
    };
});
/*
 * FrontEndLinkService.js
 *
 * Created: Thursday, February 12, 2015
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name olci.services.FrontEndLinkService
 * @description Stores HAL and SBN variations of common links 
 */
angular.module('olci.services.FrontEndLinkService', [
    'ApplicationConfiguration',
    'olci.services.RoutingUtilsService'
])

.service('FrontEndLinkService', function (Configuration, RoutingUtilsService) {

    return {
        getSignout: function(){
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/myAccount/LogoutUser.action') :
                RoutingUtilsService.frontendBaseUrl('/my-Seabourn/LogoutUser.action');
        },

        getMyAccount: function(){
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/myAccount/Announcements.action') :
                RoutingUtilsService.frontendBaseUrl('/my-Seabourn/Announcements.action');
        },

        getHelp: function() {
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/cruise-vacation-planning/PlanningAndAdvice.action?tabName=New+to+Cruising') :
                RoutingUtilsService.frontendBaseUrl('/luxury-cruise-vacation-planning/Planning-And-Advice.action?tabName=Frequently+Asked+Questions&WT.ac=pnav_AboutFAQ');
        },

        getCheckIn: function() {
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/cruise-vacation-planning/OnlineCheckIn.action') :
                RoutingUtilsService.frontendBaseUrl('/luxury-cruise-vacation-planning/Online-CheckIn.action');
        },

        getMakePayment: function() {
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/cruise-vacation-planning/MakeOnlinePayment.action') :
                RoutingUtilsService.frontendBaseUrl('/luxury-cruise-vacation-planning/MakeOnlinePayment.action');
        },

        getDeckPlan: function() {
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/main/DeckPlansFull.action?WT.ac=pnav_Onboard_Deckplans') :
                RoutingUtilsService.frontendBaseUrl('/main/Deck-Plans-Full.action?WT.ac=pnav_OnbDeckplans');
        },

        getDocumentation: function() {
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/cruise-vacation-planning/PlanningAndAdvice.action?tabName=Cruise+Preparation&contentMenu=Passports,+Visas+%26+Vaccinations') :
                RoutingUtilsService.frontendBaseUrl('/luxury-cruise-vacation-planning/Planning-And-Advice.action?tabName=Frequently+Asked+Questions&contentMenu=Travel+Documents');
        },
        getChatCallTemplate: function(){
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/main/LoadChatCallData.action') :
                RoutingUtilsService.frontendBaseUrl('/main/LoadChatCallData.action');
        }

    };
});



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

/*
 * HttpInterceptorService.js
 *
 * Created: Thursday, December 15, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name olci.services.HttpInterceptorService
 * @description Provide a place to intercept and broadcast http requests
 */
angular.module('olci.services.HttpInterceptorService', [
    'olci.services.BrowserService',
    // 'analytics.services.AnalyticsService'
])

.service('HttpInterceptorService', function (BrowserService, $cacheFactory, $q, $rootScope) {

    var cache = $cacheFactory.get('$http');
    var apiRequestMatcher = new RegExp(/secondary\/api/);

    var self = {
        request: function(request) {
            if (request.method != "GET") {
                cache.removeAll();
            }

            //caching fix for IE
            if (BrowserService.getBrowserType() === 'ie' &&
                request.method == "GET" &&
                request.url.match(apiRequestMatcher)) {
                request.url += ( !request.url.match(/\?/) ? '?' : '&' ) + "_=" + Date.now();
            }

            return request;
        },
        requestError: function(request) {
            return $q.reject(request);
        },
        response: function(response) {
            // only match responses from successful API calls
            if (response.status==200 && response.config.url.match(apiRequestMatcher)) {
                $rootScope.$broadcast('httpSuccess', response);
            }
            return response;
        },
        responseError: function(response) {
            // AnalyticsService.logAPIResponseError(response.data || response.statusText);
            return $q.reject(response);
        }
    };

    return self;
})

.config(function($httpProvider) {
    $httpProvider.interceptors.push('HttpInterceptorService');
});



angular.module('olci.services.LoginService', [])

.service('LoginService', function($state, AuthService) { 
        var me = {

            /**
             * @ngdoc method
             * @name olci.services.LoginService#init
             * @methodOf olci.services.LoginService
             * @description sets params: redirectState, and redirectParams
             * */
            init: function() {
                me.onLogin('home', {});
            },

            /**
             * @ngdoc method
             * @name olci.services.LoginService#onLogin
             * @methodOf olci.services.LoginService
             * @description remember a UI-Router page state to navigate to after login succeeds
             * @param {string} stateName the state to jump to after successful login
             * @param {object} stateParams the state params for the destination state (if applicable)
             */
            onLogin: function(stateName, stateParams) {
                me.redirectState = stateName;
                me.redirectParams = stateParams;
            },

            /**
             * Proceed past login prompt to the originally desired page
             */
            finishLogin: function() {
                $state.go(me.redirectState, me.redirectParams);
            },

            /**
             * @ngdoc method
             * @name olci.services.LoginService#logout
             * @methodOf olci.services.LoginService
             * @description logs out user
             * @param {string} redirectTo name of state to redirect to
             * */
            logout: function (redirectTo) {
                var resolve = AuthService.logout();
                resolve.finally(function() {
                    me.init();
                });

                return resolve;
            }
        };

        me.init();
        return me;
    });

/*
 * LoyaltyService.js
 *
 * Created: Tuesday, Jun 11, 2015
 * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc service
 * @name olci.services.LoyaltyService
 * @description This module is dedicated to services responsible for fetching content from the
 *     backend using prepended paths.
 */

/**  Loyalty Preference Options:
 *
 *   codeItemType = "S", "G", "O", "SS", "P", or "0"
 *       S = Shore Excursions Discount
 *       G = Alcohol Discount
 *       O = Other perks (laundry, internet, telephone, newspaper,
 *       SS= Spa at Seabourn Serene
 *       P = Seabourn Club Signature Massage
 *       0 = null? Complimentary telephone?
 *
 *   discountType = "P", or "O"
 *       P = Percent
 *       O = Other / One Use / Orphan?
 *
 *   discount = 0, 10, 15, 25, (maybe more)
 *       //If discount > 0 &&  discountType === 'P'
 *       //  Discount is n%
 *       //
 *
 *   benefitType = "B", or "S"
 *       S = Shared
 *       B = Benefit (personal)
 *
 */





angular.module( 'olci.services.LoyaltyService', [
  'ApplicationConfiguration',
  'restangular',
  'ngStorage'
  // 'secondaryFlow.services.AuthService',
  // 'secondaryFlow.services.BookingService',
  // 'secondaryFlow.services.ShoppingCartService',
  // 'secondaryFlow.services.SignalTowerService'
] )

  .service('LoyaltyService', function  LoyaltyService( Restangular, $q, $interpolate, $sessionStorage, Configuration) {
    var CN = "LoyaltyService";
    var appName = Configuration.appName;

    var loyaltyService = {
      cleanLoyaltyData : {},
      loyaltySummary : null,
      loyaltyBaseUrl : Restangular
        .one( 'guest/v1.0.0/loyaltyPreference' )
        .one( 'companyCode', Configuration.companyCode ),

      updateLoyaltyPrefsUrl : Restangular
        .one( 'shopping/v1.0.0' )
        .one( 'companyCode', Configuration.companyCode )
        .one('cart'),

      loyaltySummaryResolver : function loyaltySummaryResolver( bookingNumber ) {
        var deferred = $q.defer();

        if( loyaltyService.loyaltySummary !== null ) {
          deferred.resolve( loyaltyService.loyaltySummary );
        } else {
          deferred.resolve( loyaltyService.getLoyaltyPrefs( bookingNumber ) );
        }

        return deferred.promise;
      },

      /**
       * It gets the loyalty preferences and sets loyaltySummary
       * @param bookingSummary
       * @returns {promise}
       */

      getLoyaltyPrefs : function getLoyaltyPrefs( bookingNumber, guests) {
        var deferred = $q.defer();

        loyaltyService.loyaltyBaseUrl
          .one( 'bookingNumber', bookingNumber )
          .get()
          .then(
            function prefsReceived( loyaltyData ) {
              console.dir(loyaltyData);
              loyaltyData.getList();
              loyaltyService.loyaltySummary = loyaltyService.createLoyaltySummary( loyaltyData, guests );
              deferred.resolve( loyaltyService.loyaltySummary );
            },
            function prefsFailed( error ) {
              deferred.reject( error );
            }
          );
        return deferred.promise;
      },

      // For Friday we create the for loop hashmap
      mapBestPrefs : function mapBestPrefs( rawLoyaltyData ) {
        var bestSharedPrefs = [];
        var key;

        _.each( rawLoyaltyData.bookingLoyaltyPreferenceGuests,
          function processLoyaltyGuest( loyaltyGuest ) {
            _.each( loyaltyGuest.loyaltyPreferencesDetail.preferenceListforTier,
              function processPref( pref ) {
                if( pref.benefitType !== 'S' ) {
                  return false;
                }

                key = loyaltyService.getKeyForPref( pref );

                if( !bestSharedPrefs[ key ] ) {
                  bestSharedPrefs[ key ] = pref;
                } else {
                  if( pref.discount > bestSharedPrefs[ key ].discount ) {
                    bestSharedPrefs[ key ] = pref;
                  }
                }
                return true;
              } );
          } );

        rawLoyaltyData.bestSharedPrefs = bestSharedPrefs;
        return rawLoyaltyData; //loyaltySummaryResolver we know it returns as a undefined
      },

      getKeyForPref : function getKeyForPref( pref ) {

        var percentPos = pref.description.indexOf( '%' );
        var key = pref.description.substring( percentPos );

        return key;
      },

      

      createLoyaltySummary : function createLoyaltySummary( rawLoyaltyData, guests ) {
        var loyaltySummary = loyaltyService.mapBestPrefs( rawLoyaltyData );
        loyaltySummary.preferenceCount = 0;
        loyaltySummary.preferenceLimit = 0;

        loyaltySummary.isAnyGuestAllowedToSpendLoyaltyPoints = false;
        loyaltyService.showSBNSpaLink = false;
        _.each( loyaltySummary.bookingLoyaltyPreferenceGuests, function processGuests( loyaltyGuest ) {

          // if (!loyaltyService.showSBNSpaLink) {
          //     // call hasSBNSpaBenefit when undefined or false
          //     loyaltyService.showSBNSpaLink = loyaltyService.hasSBNSpaBenefit(loyaltyGuest);
          // }

          if(loyaltyGuest.loyaltyPreferencesDetail.preferenceAllowLimit > 0) {
            loyaltySummary.isAnyGuestAllowedToSpendLoyaltyPoints = true;
          }

          _.find( guests, function transferGuestInfo( bookingGuest ) {
            var firstName = bookingGuest.firstName;
            var lastName = bookingGuest.lastName;
            var deferred = $q.defer();
            if( Number(bookingGuest.seqNumber) == Number(loyaltyGuest.partyNumber) ) {
              loyaltyGuest.guestInfo = {firstName: firstName, lastName: lastName};

              if(!loyaltyGuest.uniqueId) {
                //this was changed from secondary flow... we're just using sequence number
                loyaltyGuest.uniqueId = BookingService.bookingSummary.bookingNumber + "_" + loyaltyGuest.partyNumber;
              }

              if(!loyaltyGuest.mpUpdated) {
                //Don't know what this actually means - Preeti said it was required to be Y or N and N is default.
                loyaltyGuest.mpUpdated = "N";
              }
              return true;
              // return deferred.resolve(loyaltyGuest.guestInfo.firstName === bookingGuest.firstName).then(function() {
              //   return true;
              // });
            } else {
              return false;
            } 
            // return false;
            // deferred.resolve();
              // return( Number(bookingGuest.seqNumber) === Number(loyaltyGuest.partyNumber) );
          } );

          loyaltySummary.preferenceCount += loyaltyGuest.selectedLoyaltyPreferencesDetails.length;
          loyaltySummary.preferenceLimit += (loyaltyGuest.loyaltyPreferencesDetail.preferenceAllowLimit || 0);

        } );
        return loyaltySummary;
      },

      // hasSBNSpaBenefit: function(loyaltyGuest) {
      //     var match = _.find(loyaltyGuest.selectedLoyaltyPreferencesDetails, function(selected) {
      //         return selected.code === 'TZSER' && selected.prepaidSale === 'N' ||
      //                selected.code === 'TZSPA' && selected.prepaidSale === 'N';
      //     });

      //     return !!match;
      // },

      updateLoyaltyPrefs: function (loyaltySummary) {
        if(!loyaltySummary) {
          return;
        }

        loyaltySummary = loyaltySummary.bookingLoyaltyPreferenceGuests;
        var deferred = $q.defer();
        loyaltyService.updateLoyaltyPrefsUrl
          .post('loyaltyOptions', loyaltySummary)
          .then(
          function (loyaltyData) {
            //TODO Handle responses...

            //Right now LoyaltyData returns undefined and the cached data doesn't refresh the loyalty service selected prefs
            loyaltyService.getLoyaltyPrefs( $sessionStorage.bookingInfo.bookingNumber );

            deferred.resolve(loyaltyData);
          },
          //unsuccessful network call
          function (error) {
            deferred.reject(error);
          }
        );
        return deferred.promise;
      },

      reset: function reset() {
        loyaltyService.loyaltySummary = null;
        loyaltyService.cleanLoyaltyData = {};
      }
    };

    return loyaltyService;
  } );


  // hasPointsFilter : function hasPointsFilter( loyaltyGuest, hasPoints ) {
  //             if ( typeof loyaltyGuest.loyaltyPreferencesDetail.preferenceAllowLimit !== undefined ) return false;
  //             return (hasPoints) ? ( loyaltyGuest.loyaltyPreferencesDetail.preferenceAllowLimit > 0 ) : !( loyaltyGuest.loyaltyPreferencesDetail.preferenceAllowLimit > 0 );
  //         },

/*
 * ModalService.js
 *
 * Created: Thursday, November 3, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc service
 * @name olci.services.ModalService
 * @description These service methods are used with modals to control lifecycle.
 */

angular.module('olci.services.ModalService', [
    'ui.bootstrap.modal',
    'olci.services.AnalyticsService'
])
.service('ModalService', function($rootScope, $modal, AnalyticsService) {
    var me = {
        modal: null,
        modalArgs: null,
        isModalOpen: function() {
            return me.modal !== null;
        },
        openModal: function(args) {
            me.closeModal();
            AnalyticsService.logModalOpenEvent(args);
            me.modalArgs = args;
            me.modal = $modal.open(args);

            return me.modal;
        },
        closeModal: function() {
            if (me.modal === null) {
                return false;
            } else {
                me.modal.dismiss();
                me.modal = null;
                me.modalArgs = null;
                return true;
            }
        }
    };

    //When the user navigates away from a page while a modal is open, close the modal.
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        me.closeModal();
    });

    return me;
});
/*
 * RegExpService.js
 *
 * Created: Tuesday, August 19, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc overview
 * @name olci.services.RegExpService
 * @description An empty module description. Please fill in a high level description of this module.
 */
angular.module( 'olci.services.RegExpService', [


])

/**
 * @ngdoc service
 * @name olci.services.RegExpService
 * @description Regular expressions to be used in field validations.
 */
    .service('RegExpService', function() {
        var regExpService = {

            // Credit Card types
            cardTypeAmex : new RegExp(/^(34)|^(37)/),
            cardTypeDiscover : new RegExp(/^(6011)|^(622(1(2[6-9]|[3-9][0-9])|[2-8][0-9]{2}|9([01][0-9]|2[0-5])))|^(64[4-9])|^65/),
            cardTypeMaster : new RegExp(/^5[1-5]/),
            cardTypeVisa : new RegExp(/^4/),

            // additional cards for seabourne
            // cardTypeDinersClub : new RegExp(/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/),
            // cardTypeJCB : new RegExp(/^(?:2131|1800|35\d{3})\d{11}$/),

            name : new RegExp(/^[a-zA-Z-'\. ]*$/),
            nameLast: new RegExp(/^[a-zA-Z-' ]*$/),
            nameFirst: new RegExp(/^[a-zA-Z- ]*$/),
            address: new RegExp(/^[a-zA-Z0-9\ \,\.~\`!\@\#\$\^\*()\-_\+=\{\}\[\]\|\\;:\"\'\/]{1,30}$/),
            city: new RegExp(/^[a-zA-Z-\' ]{1,30}$/),
            // postal code
            postalCodeUS: new RegExp(/^\d{5}\-\d{4}$|^\d{9}$|^\d{5}$/),
            postalCodeAU: new RegExp(/^\d{4}$/),
            postalCodeIE: new RegExp(/^[a-zA-Z0-9\ \-]{0,10}$/),
            postalCode: new RegExp(/^[a-zA-Z0-9\ \-]{1,10}$/),
            // Phone numbers
            telephoneUS: new RegExp(/^\d{10}$/),
            telephoneCA: new RegExp(/^\d{10}$/),
            telephone: new RegExp(/^[\s\d-.()+]{6,36}$/),

            telephoneClean: new RegExp(/[^\d]/g),

            email: new RegExp(/(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/),
            // general validation
            numbersOnly: new RegExp(/([1-9][0-9]*)|0/),

            /* promocode */
            promocode: new RegExp(/^[\w]{0,25}$/i),

            validatePostalCode: function(code, country) {
                var regexp = regExpService['postalCode' + country];
                if (!regexp) {
                    regexp = regExpService.postalCode;
                }
                return regexp.test(code);
            },

            getPostalCodeRegExp: function(country) {
                var regexp = regExpService['postalCode' + country];
                if (!regexp) {
                    regexp = regExpService.postalCode;
                }
                return regexp;
            },

            validatePhone: function(code) {
                var regexp = regExpService.telephone;
                return regexp.test(code);
            }

        };
        return regExpService;
    });
/*
 * RoutingUtilsService.js
 *
 * Created: Tuesday, February 11, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name olci.services.RoutingUtilsService
 * @description Shim for generating urls. We should look into using StateProvider for this.
 * @requires ui.router
 * @requires ApplicationConfiguration
 */
angular.module( 'olci.services.RoutingUtilsService', [
    'ui.router',
    'ApplicationConfiguration'
])
.service('RoutingUtilsService', [ '$interpolate', '$filter', 'Configuration', function($interpolate, $filter, Configuration) { return {
    /**
     * Generate a URL for frontend actions
     * @returns {string} an absolute URL for the server request
     */

        /**
         * @ngdoc method
         * @name olci.services.RoutingUtilsService#frontendBaseUrl
         * @methodOf olci.services.RoutingUtilsService
         * @description Generate a URL for frontend actions
         * @param {string} action HTTP verb
         * @returns {string} an absolute URL for the server request
         * @example
         <pre>
            Configuration.frontend.baseUrl + action;
         </pre>
         * */
    frontendBaseUrl: function(action) {
        if (!action) {
            return '';
        } else {
            return Configuration.frontend.baseUrl + action;
        }
    },

    /**
     * Generate a URL for frontend booking
     * @returns {string} an absolute URL for the resource
     */

        /**
         * @ngdoc method
         * @name olci.services.RoutingUtilsService#frontendBookingUrl
         * @methodOf olci.services.RoutingUtilsService
         * @description Generate a URL for frontend booking
         * @param {string} action HTTP verb
         * @returns {string} an absolute URL for the resource
         * @example
         <pre>
         Configuration.frontendBooking.baseUrl + action;
         </pre>
         * */
    frontendBookingUrl: function(action) {
        if (!action) {
            return '';
        } else {
            return Configuration.frontendBooking.baseUrl + action;
        }
    }

};}]);

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

/*
 * StaleSessionService.js
 *
 * Created: Wednesday, December 15, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc service
 * @name olci.services.StaleSessionService
 * @description receives an event for http success and resets stale session timer`
 */
angular

    .module( 'olci.services.StaleSessionService', [
        'olci.services.ModalService',
        'olci.directives.modals.staleSessionModal'
    ])

    .service('StaleSessionService', function( $q, $state, $cookies, $interval, $timeout, $window, AuthService, ModalService, Configuration ) {

        var staleSessionService = {

            // convert minutes of timeout to ms:  min * sec/min * ms/sec
            timeoutMs : 18 * 60 * 1000,
            // timeoutMs : 10 * 1000, // 10s for testing.

            staleSessionTimer : null,

            endSession : function () {
                // return LoginService.logout();

                // Following is from LoginService.logout
                var resolve = AuthService.logout();
                resolve.finally(function() {
                    me.init();
                });

                return resolve;
            },

            continueSession : function () {

                var deferred = $q.defer();

                AuthService.recoverSession()
                    .then(
                    function (userData) {
                        staleSessionService.resetStaleSessionTimer();
                        deferred.resolve(userData);
                    },
                    function () {
                        deferred.reject();
                    });

                return deferred.promise;
            },

            callStaleSessionModal : function () {

                if ($state.current.name == 'login') {
                    staleSessionService.resetStaleSessionTimer();
                    return;
                }

                // there may be a modal already open
                ModalService.closeModal();

                staleSessionService.modalInstance = ModalService.openModal({
                    templateUrl: 'directives/modals/staleSessionModal/staleSessionModal.tpl.html',
                    controller: 'staleSessionModalController',
                    windowClass: 'stale-session-modal',
                    backdrop: 'static',
                    keyboard: false
                });

            },

            resetStaleSessionTimer : function () {
                $interval.cancel(staleSessionService.staleSessionTimer);
                staleSessionService.staleSessionTimer = $interval(staleSessionService.callStaleSessionModal, staleSessionService.timeoutMs, 1);
                return true;
            }

        };

        return staleSessionService;
    });



/*
 * StorageService.js
 *
 * Created: Tuesday, March 17, 2015
 * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name common.services.StorageService
 * @description Wrapper on top of localStorage or sessionStorage.
 *
 */
angular.module('olci.services.StorageService', [])
    .service('StorageService', function (){
        var storageService = {
            type: "localStorage",
            setItem: function setItem(key, value){
                if(!window.localStorage || !window.sessionStorage) {
                    throw new Error("REALLY_OLD_BROWSER");
                }
                try {
                    localStorage.setItem( key, value );
                } catch (err) {
                    try { //this should always work
                        storage.type = "sessionStorage";
                        sessionStorage.setItem( key, value );
                    } catch(sessErr){
                        //perhaps use cookies in the future?
                        throw sessErr;
                    }
                }
            },
            getItem: function getItem(key){
                return window[storageService.type].getItem(key);
            },
            removeItem: function removeItem(key){
                return window[storageService.type].removeItem(key);
            }
        };
        return storageService;
    });
/*
 * TimeUtilsService.js
 *
 * Created: Wednesday, February 12, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc service
 * @name olci.services.TimeUtilsService
 * @description Calculates trip time:<br>
 * `daysLeft()`<br>
 * `convertToHoursOrDays()`
 */
 angular.module( 'olci.services.TimeUtilsService', [


])
.service('TimeUtilsService', [ function() {
    return {


        /**
         * @ngdoc method
         * @name olci.services.TimeUtilsService#daysLeft
         * @methodOf olci.services.TimeUtilsService
         * @description calculates days left
         * @param {date} itineraryBeginDate date object
         * @param {date} currentDate date object
         * @returns {number} milliseconds of time left
         * */
        daysLeft: function(itineraryBeginDate, currentDate) {
            if (!itineraryBeginDate) {
                return 0;
            }

            // Setting time to midnight, to calculate full days.
            var departureDate = new Date(itineraryBeginDate).setHours(0, 0, 0, 0);
            var localDate = new Date(currentDate).setHours(0, 0, 0, 0);
            var milliseconds = Math.max(0, departureDate - localDate);

            //DST can cause this to return 2.04 days or 1.96 days if the time spans a changeover -JDM
            return Math.round(milliseconds / (24 * 60 * 60 * 1000));
        },
        /**
         * hours should be formatted to one decimal place
         * when hours are .9 or less the affix of "hours" will be used
         * when hours is 1 the affix "hour" will be used
         * when hours is in the range from 1.1 to 23.9 the affix "hours" will be used
         * hours will be converted into days starting with 24
         * days will always be listed as a whole number with any decimal dropped
         * when days is 1 the affix will be "day"
         * when days is greater than 1 the affix "days" will be used
         *
         * @return {{amount: Number, units: 'hours' | 'days' }}
         */

        /**
         * @ngdoc method
         * @name olci.services.TimeUtilsService#convertToHoursOrDays
         * @methodOf olci.services.TimeUtilsService
         * @description hours should be formatted to one decimal place
         <pre>
             when hours are .9 or less the affix of "hours" will be used
             when hours is 1 the affix "hour" will be used
             when hours is in the range from 1.1 to 23.9 the affix "hours"
                will be used
             hours will be converted into days starting with 24
             days will always be listed as a whole number with any decimal dropped
             when days is 1 the affix will be "day"
             when days is greater than 1 the affix "days" will be used
         </pre>
         * @param {number} hours number of hours
         * @returns {Object} result object
         * @example
         <pre>
            {{amount: Number, units: 'hours' | 'days' }}
         </pre>
         * */
        convertToHoursOrDays: function(hours) {
            var result;

            if (hours === undefined) {
                result = { amount: 0, units: 'hours', translation: 'shorexLanding.hours'};
            } else if (hours < 24) {
                // round hours to one decimal place
                var tenths = Math.round(hours * 10 ) / 10;
                result = { amount: tenths, units: 'hours', translation: tenths === 1 ? 'shorexLanding.hour' : 'shorexLanding.hours'};
            } else {
                result = { amount: Math.floor(hours / 24) + 1, units: 'days', translation: 'shorexLanding.days'};
            }

            return result;
        }
    };
}]);

angular.module('olci.services.TransformUtilsService', [
    'ngStorage',
    'ApplicationConfiguration',
    'vendor.steelToe'
])

.factory('TransformUtilsService', function( $sessionStorage, Configuration, steelToe ) {

    return {
        //copies properies from one object to another
        transformObject: function( readObj, writeObj, paths ) {
            paths.forEach(function( el, index, array ) {
                var readItem = steelToe.do( readObj ).get( el.read );
                steelToe.do( writeObj ).set( el.write, readItem );
            });
        },

        transformRequestObject: function( obj ) {
            var str = [];
            for (var p in obj) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            var results = str.join("&");
            console.log(results);
            return str.join("&");
        },

        zeroPad: function( n, width, z ) {
            z = z || '0';
            width = width || 2;
            n = n + '';
            return n.length >= width ? n : new Array( width - n.length + 1 ).join( z ) + n;
        }

    };
    
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImhvbWUuanMiLCJsYW5kaW5nLmpzIiwiYnV0dG9uR3JlZW4uanMiLCJjaGVja2luUHJvZ3Jlc3MuanMiLCJmaWVsZFJlcXVpcmVkVmFsaWRhdGlvbi5qcyIsImZpZWxkVmFsaWRhdGlvbi5qcyIsImhhbEhlYWRlci5qcyIsImluZm9MaW5rcy5qcyIsIml0aW5lcmFyeVBob3RvLmpzIiwiZXJyb3JNb2RhbC5qcyIsImV4cGVuc2VBZ3JlZW1lbnQuanMiLCJsb2dpbi5qcyIsIm1vZGFscy5qcyIsInBhc3Nwb3J0VmlzYU5vdGlmaWNhdGlvbi5qcyIsInN0YWxlU2Vzc2lvbk1vZGFsLmpzIiwib2xjaUFjY29yZGlvbi5qcyIsInBhZ2VUaXRsZS5qcyIsInR5cGVhaGVhZERyb3Bkb3duLmpzIiwiQW5hbHl0aWNzU2VydmljZS5qcyIsIkF1dGhTZXJ2aWNlLmpzIiwiQm9va2luZ1NlcnZpY2UuanMiLCJCcm93c2VyU2VydmljZS5qcyIsIkNoYW5nZVBhZ2VTZXJ2aWNlLmpzIiwiQ2hhdENhbGxTZXJ2aWNlLmpzIiwiQ3JlZGl0Q2FyZFNlcnZpY2UuanMiLCJEYXRhVHJhbnNmb3JtU2VydmljZS5qcyIsIkRlc2VyaWFsaXplU2VydmljZS5qcyIsIkZpbmRCb29raW5nU2VydmljZS5qcyIsIkZpbmRJbWFnZVNlcnZpY2UuanMiLCJGb2N1c1NlcnZpY2UuanMiLCJGcm9udEVuZExpbmtTZXJ2aWNlLmpzIiwiR2V0Q29weVNlcnZpY2UuanMiLCJIdHRwSW50ZXJjZXB0b3JTZXJ2aWNlLmpzIiwiTG9naW5TZXJ2aWNlLmpzIiwiTG95YWx0eVNlcnZpY2UuanMiLCJNb2RhbFNlcnZpY2UuanMiLCJSZWdFeHBTZXJ2aWNlLmpzIiwiUm91dGluZ1V0aWxzU2VydmljZS5qcyIsIlNlcmlhbGl6ZVNlcnZpY2UuanMiLCJTaGFyZWREYXRhU2VydmljZS5qcyIsIlN0YWxlU2Vzc2lvblNlcnZpY2UuanMiLCJTdG9yYWdlU2VydmljZS5qcyIsIlRpbWVVdGlsc1NlcnZpY2UuanMiLCJUcmFuc2Zvcm1VdGlsc1NlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdm5CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM1FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbGNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ250Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDL2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvbUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im9sY2lBcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0Jztcbn0pKCk7XG5cbmFuZ3VsYXIubW9kdWxlKCdvbGNpJywgW1xuICAgICduZ1N0b3JhZ2UnLFxuICAgICdjZ0J1c3knLFxuICAgICd1aS5yb3V0ZXInLFxuICAgICd1aS5ib290c3RyYXAnLFxuICAgICd1aS5ib290c3RyYXAuc2hvd0Vycm9ycycsXG4gICAgJ3VpLnV0aWxzJyxcbiAgICAnbmdDb29raWVzJyxcbiAgICAncmVzdGFuZ3VsYXInLFxuICAgICd0ZW1wbGF0ZXMtYXBwJyxcbiAgICAndGVtcGxhdGVzLWNvbXBvbmVudHMnLFxuICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nLFxuICAgICdmaC5sYW5kaW5nJyxcbiAgICAnZmguaG9tZScsXG4gICAgJ29sY2kuZGlyZWN0aXZlcy5wYWdlVGl0bGUnLFxuICAgICdvbGNpLmRpcmVjdGl2ZXMuaGFsSGVhZGVyJyxcbiAgICAnb2xjaS5kaXJlY3RpdmVzLmNoZWNraW5Qcm9ncmVzcycsXG4gICAgJ29sY2kuZGlyZWN0aXZlcy5pdGluZXJhcnlQaG90bycsXG4gICAgJ29sY2kuZGlyZWN0aXZlcy5tb2RhbHMnLFxuICAgICdvbGNpLmRpcmVjdGl2ZXMubW9kYWxzLmVycm9yTW9kYWwnLFxuICAgICdvbGNpLmRpcmVjdGl2ZXMubW9kYWxzLmxvZ2luJyxcbiAgICAnb2xjaS5zZXJ2aWNlcy5BdXRoU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuQW5hbHl0aWNzU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuUm91dGluZ1V0aWxzU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuUmVnRXhwU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuU2hhcmVkRGF0YVNlcnZpY2UnLFxuICAgICdvbGNpLnNlcnZpY2VzLlRpbWVVdGlsc1NlcnZpY2UnLFxuICAgICdvbGNpLnNlcnZpY2VzLkZpbmRJbWFnZVNlcnZpY2UnLFxuICAgICdvbGNpLnNlcnZpY2VzLkdldENvcHlTZXJ2aWNlJyxcbiAgICAnb2xjaS5zZXJ2aWNlcy5Gb2N1c1NlcnZpY2UnLFxuICAgICdvbGNpLnNlcnZpY2VzLkNoYW5nZVBhZ2VTZXJ2aWNlJyxcbiAgICAnb2xjaS5zZXJ2aWNlcy5EYXRhVHJhbnNmb3JtU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuRnJvbnRFbmRMaW5rU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuU3RhbGVTZXNzaW9uU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuSHR0cEludGVyY2VwdG9yU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuQnJvd3NlclNlcnZpY2UnLFxuICAgICd2ZW5kb3Iuc3RlZWxUb2UnLFxuICAgICdiYXNlNjQnLFxuICAgICdhbmd1bGFyLW1vbWVudGpzJ1xuXSlcblxuICAgIC5jb25maWcoZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyLCBSZXN0YW5ndWxhclByb3ZpZGVyLCBDb25maWd1cmF0aW9uLCAkdWlWaWV3U2Nyb2xsUHJvdmlkZXIsICRodHRwUHJvdmlkZXIsICR0cmFuc2xhdGVQcm92aWRlciwgJGNvbXBpbGVQcm92aWRlcikge1xuXG4gICAgICAgIC8vIFRPRE86IFRoaXMgaXMgbmVlZGVkIGZvciB0aGUgQ2FsbC9DaGF0IGJ1dHRvbnMgaW4gdGhlIGhlYWRlci4gSnVzdCBsaWtlIG9uIGhvbWVwYWdlOlxuICAgICAgICAvLyBodHRwczovL2hhbHByZGdpdDAxLmhxLmhhbHcuY29tOjg0NDMvcHJvamVjdHMvV0EvcmVwb3MvbWFya2V0aW5naG9tZXBhZ2UvYnJvd3NlL3NyYy9hcHAvYXBwLmpzXG4gICAgICAgICRjb21waWxlUHJvdmlkZXIuYUhyZWZTYW5pdGl6YXRpb25XaGl0ZWxpc3QoL15cXHMqKGh0dHBzP3xqYXZhc2NyaXB0KTovKTtcblxuICAgICAgICBSZXN0YW5ndWxhclByb3ZpZGVyLnNldEJhc2VVcmwoJy9hcGknKTtcbiAgICAgICAgUmVzdGFuZ3VsYXJQcm92aWRlci5zZXREZWZhdWx0SHR0cEZpZWxkcyh7XG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICB0aW1lb3V0OiBDb25maWd1cmF0aW9uLnRpbWVvdXRJbk1pbGxpcyxcbiAgICAgICAgICAgIGNhY2hlOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBSZXN0YW5ndWxhclByb3ZpZGVyLnNldERlZmF1bHRIZWFkZXJzKHtcbiAgICAgICAgICAgICdDbGllbnQtSWQnOiBDb25maWd1cmF0aW9uLmhhbFBvcnRhLmNsaWVudElkXG4gICAgICAgIH0pO1xuXG4gICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcnLCAnL2xhbmRpbmcnKS5vdGhlcndpc2UoJy9sYW5kaW5nJyk7XG5cbiAgICAgICAgLy8gc2Nyb2xscyB0byB0b3Agb2YgcGFnZSBvbiBzdGF0ZSBjaGFuZ2VcbiAgICAgICAgJHVpVmlld1Njcm9sbFByb3ZpZGVyLnVzZUFuY2hvclNjcm9sbCgpO1xuXG4gICAgICAgIC8vIC8vIGluaXRpYWxpemUgJHRyYW5zbGF0ZVByb3ZpZGVyXG4gICAgICAgIC8vICR0cmFuc2xhdGVQcm92aWRlci51c2VTdGF0aWNGaWxlc0xvYWRlcih7XG4gICAgICAgIC8vICAgICBwcmVmaXg6IFwiYXNzZXRzL2kxOG4vbG9jYWxlLVwiLFxuICAgICAgICAvLyAgICAgc3VmZml4OiBcIi5qc29uXCJcbiAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gJHRyYW5zbGF0ZVByb3ZpZGVyLnByZWZlcnJlZExhbmd1YWdlKCdlbicpO1xuICAgICAgICAvLyAkdHJhbnNsYXRlUHJvdmlkZXIuZmFsbGJhY2tMYW5ndWFnZSgnZW4nKTtcblxuICAgIH0pXG4gICAgLnJ1bihmdW5jdGlvbigkcm9vdFNjb3BlLCBcbiAgICAgICAgQ29uZmlndXJhdGlvbiwgXG4gICAgICAgICRzdGF0ZSwgXG4gICAgICAgICRzZXNzaW9uU3RvcmFnZSwgXG4gICAgICAgICR0cmFuc2xhdGUsIFxuICAgICAgICBDaGFuZ2VQYWdlU2VydmljZSwgXG4gICAgICAgIERhdGFUcmFuc2Zvcm1TZXJ2aWNlLCBcbiAgICAgICAgQXV0aFNlcnZpY2UsIFxuICAgICAgICAkY29va2llcywgXG4gICAgICAgIEZpbmRJbWFnZVNlcnZpY2UsIFxuICAgICAgICBIdHRwSW50ZXJjZXB0b3JTZXJ2aWNlLCBcbiAgICAgICAgU3RhbGVTZXNzaW9uU2VydmljZSwgXG4gICAgICAgIE1vZGFsU2VydmljZSwgXG4gICAgICAgICRsb2NhdGlvbiwgXG4gICAgICAgIHN0ZWVsVG9lKSB7XG5cbiAgICAgICAgJHJvb3RTY29wZS5hcHBOYW1lID0gQ29uZmlndXJhdGlvbi5hcHBOYW1lO1xuICAgICAgICAkcm9vdFNjb3BlLmNvbXBhbnlDb2RlID0gQ29uZmlndXJhdGlvbi5jb21wYW55Q29kZTtcblxuXG4gICAgICAgIC8vICRzdGF0ZS5nbygnZmluZEJvb2tpbmcnKTsgLy9kZWxldGUgYmVmb3JlIGNvbW1pdHRpbmdcblxuICAgICAgICAvL2F1dGggY2hlY2sgZXZlcnkgdGltZSB0aGUgc3RhdGUvcGFnZSBjaGFuZ2VzXG4gICAgICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgICAgICAvLyAkcm9vdFNjb3BlLnN0YXRlQ2hhbmdlQXV0aENoZWNrKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvLyAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlKSB7XG5cbiAgICAgICAgLy8gICAgICR0cmFuc2xhdGUodG9TdGF0ZS5wYWdlVGl0bGUpXG4gICAgICAgIC8vICAgICAgICAgLnRoZW4oZnVuY3Rpb24oIHBhZ2VUaXRsZSApIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgJHJvb3RTY29wZS5wYWdlVGl0bGUgPSBwYWdlVGl0bGU7XG4gICAgICAgIC8vICAgICAgICAgfSlcbiAgICAgICAgLy8gICAgICAgICAuY2F0Y2goZnVuY3Rpb24oIHBhZ2VUaXRsZSApIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgJHJvb3RTY29wZS5wYWdlVGl0bGUgPSAnSG9sbGFuZCBBbWVyaWNhIExpbmUnO1xuICAgICAgICAvLyAgICAgICAgIH0pO1xuXG4gICAgICAgIC8vICAgICAgICAgLy8gJ0Zyb20gcGFnZScgaGFzIGJlZW4gdmlzaXRlZCBzbyBzZXQgY29va2llLlxuICAgICAgICAvLyAgICAgICAgIC8vIFRPRE86IEFkZCBwZXIgcGVyc29uIGluIGJvb2tpbmcuXG4gICAgICAgIC8vICAgICAgICAgaWYgKCBmcm9tU3RhdGUubmFtZSAmJiAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8pIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgLy8gTmVlZCB0byBjaGVjayB0aGF0IHVzZXIgaXMgbm90IG9uIGd1ZXN0U2VsZWN0IHBhZ2UuXG4gICAgICAgIC8vICAgICAgICAgICAgIGlmICggQ2hhbmdlUGFnZVNlcnZpY2UuZ2V0UGFnZXMoKS5zbGljZSgxKS5pbmRleE9mKCB0b1N0YXRlLm5hbWUgKSAhPT0gLTEgKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3QuZm9yRWFjaCggZnVuY3Rpb24gKCBndWVzdCwgaW5kZXgsIGFyciApIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICBpZiAoICRyb290U2NvcGUuc2VsZWN0R3Vlc3RGaWx0ZXIoIGd1ZXN0LnNlcU51bWJlciApICkge1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICAkY29va2llc1sgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmJvb2tpbmdOdW1iZXIgKyBndWVzdC5zZXFOdW1iZXIgKyBmcm9tU3RhdGUubmFtZSArICdWaXNpdGVkJyBdID0gJ3RydWUnO1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAvLyAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gfSk7XG5cblxuICAgICAgICAvL0VWRU5UIEJBTktcbiAgICAgICAgLyokcm9vdFNjb3BlLiRvbignYXV0aC1sb2dpbi1zdWNjZXNzJywgZnVuY3Rpb24oZXZlbnQsIGFyZ3MpIHtcbiAgICAgICAgICAgIHZhciBib29raW5nSW5mbyA9IERhdGFUcmFuc2Zvcm1TZXJ2aWNlLnNlcmlhbGl6ZVBvbGFyKCRzZXNzaW9uU3RvcmFnZS5wb2xhcik7XG4gICAgICAgICAgICAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8gPSBEYXRhVHJhbnNmb3JtU2VydmljZS5zZXJpYWxpemVXZWJEYigkc2Vzc2lvblN0b3JhZ2Uud2ViRGIsIGJvb2tpbmdJbmZvKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuc2V0TWFyaW5lckltZygkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbMF0ucGFzdEd1ZXN0TG95YWx0eSk7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLnNldE1haW5OYW1lKCRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFswXSk7XG4gICAgICAgICAgICAvLyAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8gPSBib29raW5nSW5mb0FuZFdlYlxuICAgICAgICAgICAgJHN0YXRlLmdvKCdzZWxlY3RHdWVzdCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbignYXV0aC1sb2dvdXQtc3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCBhcmdzKSB7XG5cbiAgICAgICAgfSk7Ki9cblxuICAgICAgICAkcm9vdFNjb3BlLmlzSGFsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGUgPT09ICdIQUwnO1xuICAgICAgICB9O1xuXG4gICAgICAgICRyb290U2NvcGUuaXNTYm4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gQ29uZmlndXJhdGlvbi5jb21wYW55Q29kZSA9PT0gJ1NCTic7XG4gICAgICAgIH07XG5cblxuXG4gICAgfSlcblxuICAgIC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmhvbWUnLCBbXG4gICd1aS5zZWxlY3QnLFxuICAnbmdTdG9yYWdlJyxcbiAgJ25nRmlsZVVwbG9hZCcsXG4gICdwZGYnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIGhvbWVDb25maWcoJHN0YXRlUHJvdmlkZXIpIHtcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgdXJsOiAnL2hvbWUnLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaG9tZS9ob21lLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnSG9tZScsXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxsQ2xhc3NlczogZnVuY3Rpb24oICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UgKSB7XG4gICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIGp3dDogJHNlc3Npb25TdG9yYWdlLmp3dFxuICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ0hvbWVDb250cm9sbGVyJywgZnVuY3Rpb24oICRzY29wZSwgJHN0YXRlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkdGltZW91dCwgVXBsb2FkLCBwZGZEZWxlZ2F0ZSwgYWxsQ2xhc3NlcyApIHtcbiAgdmFyIFBBUEVSU19VUkwgPSAnL2FwaS9wYXBlcnMnO1xuICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnand0J10gPSAkc2Vzc2lvblN0b3JhZ2Uuand0O1xuICAkc2NvcGUubWFpblBkZkRhdGEgPSAnLi9hc3NldHMvZm9udHMvZnc0LnBkZic7XG4gICRzY29wZS5hbGxDbGFzc2VzID0gYWxsQ2xhc3NlcztcblxuICAkc2NvcGUuJHdhdGNoKCdmaWxlcycsIGZ1bmN0aW9uKCkge1xuICAgICRzY29wZS51cGxvYWQoICRzY29wZS5maWxlcyApO1xuICB9KTtcblxuICAkc2NvcGUuJHdhdGNoKCdmaWxlJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCRzY29wZS5maWxlICE9IG51bGwpIHtcbiAgICAgICRzY29wZS51cGxvYWQoWyRzY29wZS5maWxlXSk7XG4gICAgfVxuICB9KTtcblxuICAkc2NvcGUubG9nID0gJyc7XG4gICRzY29wZS5wYXBlcnNUb0VkaXQgPSBbXTtcbiAgJHNjb3BlLmVkaXREYXRhID0ge307XG5cbiAgJHNjb3BlLm5ld1NlYXNvbiA9IHt9O1xuICAkc2NvcGUubmV3WWVhciA9IHt9O1xuICAkc2NvcGUubmV3VHlwZSA9IHt9O1xuXG4gICRzY29wZS5zZWFzb25zID0gW1xuICAgIHtuYW1lOiAnU3ByaW5nJywgY29kZTogXCJTUFwifSxcbiAgICB7bmFtZTogJ1N1bW1lcicsIGNvZGU6IFwiU1VcIn0sXG4gICAge25hbWU6ICdGYWxsJywgY29kZTogXCJGQVwifSxcbiAgICB7bmFtZTogJ1dpbnRlcicsIGNvZGU6IFwiV0lcIn1cbiAgXTtcbiAgJHNjb3BlLnllYXJzID0gW1xuICAgIHtuYW1lOiAnMDknLCBjb2RlOiAnMDknfSxcbiAgICB7bmFtZTogJzEwJywgY29kZTogJzEwJ30sXG4gICAge25hbWU6ICcxMScsIGNvZGU6ICcxMSd9LFxuICAgIHtuYW1lOiAnMTInLCBjb2RlOiAnMTInfSxcbiAgICB7bmFtZTogJzEzJywgY29kZTogJzEzJ30sXG4gICAge25hbWU6ICcxNCcsIGNvZGU6ICcxNCd9LFxuICAgIHtuYW1lOiAnMTUnLCBjb2RlOiAnMTUnfVxuICBdO1xuICAkc2NvcGUudHlwZXMgPSBbXG4gICAge25hbWU6ICdIb21ld29yaycsIGNvZGU6ICdIJ30sXG4gICAge25hbWU6ICdNaWR0ZXJtJywgY29kZTogJ00nfSxcbiAgICB7bmFtZTogJ05vdGVzJywgY29kZTogJ04nfSxcbiAgICB7bmFtZTogJ1F1aXonLCBjb2RlOiAnUSd9LFxuICAgIHtuYW1lOiAnRmluYWwnLCBjb2RlOiAnRid9LFxuICAgIHtuYW1lOiAnTGFiJywgY29kZTogJ0wnfVxuICBdO1xuXG4gICRzY29wZS51cGxvYWQgPSBmdW5jdGlvbiggZmlsZXMgKSB7XG4gICAgaWYgKGZpbGVzICYmIGZpbGVzLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZmlsZSA9IGZpbGVzW2ldO1xuXG4gICAgICAgIFVwbG9hZC51cGxvYWQoe1xuICAgICAgICAgIHVybDogUEFQRVJTX1VSTCxcbiAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgIH0pXG5cbiAgICAgICAgLnByb2dyZXNzKGZ1bmN0aW9uICggZXZ0ICkge1xuICAgICAgICAgIHZhciBwcm9ncmVzc1BlcmNlbnRhZ2UgPSBwYXJzZUludCgxMDAuMCAqIGV2dC5sb2FkZWQgLyBldnQudG90YWwpO1xuICAgICAgICAgICRzY29wZS5sb2cgPSAncHJvZ3Jlc3M6ICcgKyBcbiAgICAgICAgICAgIHByb2dyZXNzUGVyY2VudGFnZSArIFxuICAgICAgICAgICAgJyUnICsgXG4gICAgICAgICAgICBldnQuY29uZmlnLmZpbGUubmFtZSArIFxuICAgICAgICAgICAgJ1xcbicgKyBcbiAgICAgICAgICAgICRzY29wZS5sb2c7XG4gICAgICAgIH0pXG5cbiAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oIGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnICkge1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAkc2NvcGUubG9nID0gJ2ZpbGU6ICcgKyBcbiAgICAgICAgICAgICAgY29uZmlnLmZpbGUubmFtZSArIFxuICAgICAgICAgICAgICAnLCBSZXNwb25zZTogJyArIFxuICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSggZGF0YS50aXRsZSApICsgXG4gICAgICAgICAgICAgICdcXG4nICsgXG4gICAgICAgICAgICAgICRzY29wZS5sb2c7XG5cbiAgICAgICAgICAgICRzY29wZS5wYXBlcnNUb0VkaXQucHVzaCggZGF0YSApO1xuXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc3VibWl0RWRpdGVkUGFwZXIgPSBmdW5jdGlvbiggcGFwZXIsIG5ld0RhdGEgKSB7XG4gICAgcHV0T2JqID0ge1xuICAgICAgdGl0bGU6IG5ld0RhdGEudGl0bGUsXG4gICAgICBwZXJpb2Q6IG5ld0RhdGEuc2Vhc29uICsgbmV3RGF0YS55ZWFyLFxuICAgICAgdHlwZTogbmV3RGF0YS50eXBlXG4gICAgfTtcblxuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICB1cmw6ICdhcGkvcGFwZXJzL3NpbmdsZS8nICsgcGFwZXIuX2lkLFxuICAgICAgZGF0YTogcHV0T2JqXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgY29uc29sZS5sb2coIHJlcyApO1xuICAgICAgJHNjb3BlLnBhcGVyVG9FZGl0QmFja1N0b3JlID0gJHNjb3BlLnBhcGVyc1RvRWRpdC5zaGlmdCgpO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmVycm9yICggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLiR3YXRjaCgncGFwZXJzVG9FZGl0WzBdJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLXZpZXdlcicpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoICRzY29wZS5wYXBlcnNUb0VkaXRbMF0gKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggJHNjb3BlLnBhcGVyc1RvRWRpdFswXS5pbWcuZGF0YSApLnRoZW4oZnVuY3Rpb24oIHBkZiApIHtcbiAgICAgICAgcGRmLmdldFBhZ2UoMSkudGhlbihmdW5jdGlvbihwYWdlKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAwLjg7XG4gICAgICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgICAgICBjYW52YXNDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICAgICAgfTtcbiAgICAgICAgICBwYWdlLnJlbmRlcihyZW5kZXJDb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgJHNjb3BlLiR3YXRjaCgncGFwZXJzVG9FZGl0WzFdJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXh0LXVwLXBkZi1jb250YWluZXInKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgaWYgKCAkc2NvcGUucGFwZXJzVG9FZGl0WzFdICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoICRzY29wZS5wYXBlcnNUb0VkaXRbMV0uaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24ocGFnZSkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMC4yO1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9KTtcblxuICAkc2NvcGUuYWRkQ2xhc3MgPSBmdW5jdGlvbiggbmV3Q2xhc3MgKSB7XG4gICAgdmFyIHBvc3RPYmogPSB7dGl0bGU6IG5ld0NsYXNzfTtcblxuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgdXJsOiAnYXBpL2NsYXNzZXMnLFxuICAgICAgZGF0YTogcG9zdE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXMgKSB7XG4gICAgICAgICRzY29wZS5hbGxDbGFzc2VzID0gcmVzLmRhdGE7XG4gICAgICB9KTtcblxuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cblxufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnZmgubGFuZGluZycsW1xuICAnbmdTdG9yYWdlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiAoICRzdGF0ZVByb3ZpZGVyICkge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGFuZGluZycsIHtcbiAgICB1cmw6ICcvJyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnTGFuZGluZ0NvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2xhbmRpbmcvbGFuZGluZy50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ2xhbmRpbmdQYWdlLnBhZ2VUaXRsZSdcbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignTGFuZGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoICRzY29wZSwgJHN0YXRlLCAkaHR0cCwgJGJhc2U2NCwgJHNlc3Npb25TdG9yYWdlKSB7XG4gIHZhciBVU0VSU19VUkwgPSAnL2FwaS91c2Vycyc7XG5cbiAgJHNjb3BlLnJlZ2lzdGVyID0gZnVuY3Rpb24oIGNyZWRlbnRpYWxzICkge1xuICAgIHZhciBuZXdVc2VyID0ge1xuICAgICAgbmFtZTogY3JlZGVudGlhbHMubmFtZSxcbiAgICAgIHBob25lOiBjcmVkZW50aWFscy5waG9uZSxcbiAgICAgIGVtYWlsOiBjcmVkZW50aWFscy5lbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBjcmVkZW50aWFscy5wYXNzd29yZCxcbiAgICAgIHBhc3N3b3JkQ29uZmlybTogY3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtXG4gICAgfTtcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogVVNFUlNfVVJMLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9LFxuICAgICAgZGF0YTogbmV3VXNlclxuICAgIH0pXG4gICAgLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgY29uc29sZS5kaXIoZGF0YSk7XG4gICAgICAkc2NvcGUucmVnaXN0ZXJDcmVkZW50aWFscyA9IHt9O1xuICAgIH0pXG4gICAgLmVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgY29uc29sZS5kaXIoZXJyKTtcbiAgICAgICRzY29wZS5yZWdpc3RlckNyZWRlbnRpYWxzLnBhc3N3b3JkID0gJyc7XG4gICAgICAkc2NvcGUucmVnaXN0ZXJDcmVkZW50aWFscy5wYXNzd29yZENvbmZpcm0gPSAnJztcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbihjcmVkZW50aWFscykge1xuXG4gICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGhvcml6YXRpb24nXSA9IFxuICAgICAgJ0Jhc2ljICcgKyBcbiAgICAgICRiYXNlNjQuZW5jb2RlKGNyZWRlbnRpYWxzLmVtYWlsICsgXG4gICAgICAnOicgKyBcbiAgICAgIGNyZWRlbnRpYWxzLnBhc3N3b3JkKTtcbiAgICBcbiAgICAkaHR0cC5nZXQoVVNFUlNfVVJMKVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBjb25zb2xlLmRpcihkYXRhKTtcbiAgICAgICAgJHNlc3Npb25TdG9yYWdlLmp3dCA9IGRhdGEuand0O1xuICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZGlyKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxufSk7IiwiXG5cbi8qKlxuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgb2xjaS5kaXJlY3RpdmVzLmJ1dHRvbkdyZWVuXG4gKiBAZGVzY3JpcHRpb24gRGlyZWN0aXZlIGZvciBncmVlbiAnY29udGludWUnIGJ1dHRvbiBhbmQgY29weSBhdCB0aGUgYm90dG9tIG9mIHRoZSBwYWdlLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb2xjaS5kaXJlY3RpdmVzLmJ1dHRvbkdyZWVuJywgW10pXG5cbiAgICAuZGlyZWN0aXZlKCdidXR0b25HcmVlbicsIGZ1bmN0aW9uIGZhY3RvcnkoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgICAgIHNjb3BlOiB7XG4gICAgICAgICAgICAgICAgY29weTogJ0BidXR0b25HcmVlbkNvcHknLFxuICAgICAgICAgICAgICAgIGxhYmVsOiAnQGJ1dHRvbkdyZWVuTGFiZWwnXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdkaXJlY3RpdmVzL2J1dHRvbkdyZWVuL2J1dHRvbkdyZWVuLnRwbC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlKSB7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnb2xjaS5kaXJlY3RpdmVzLmNoZWNraW5Qcm9ncmVzcycsIFtcbiAgICAnbmdDb29raWVzJyxcbiAgICAnbmdTdG9yYWdlJyxcbiAgICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJyxcbiAgICAndmVuZG9yLnN0ZWVsVG9lJ1xuICAgIF0pXG5cbiAgICAuZGlyZWN0aXZlKCdjaGVja2luUHJvZ3Jlc3MnLCBmdW5jdGlvbiBmYWN0b3J5KENvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgICAgIHRyYW5zY2x1ZGU6IGZhbHNlLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdkaXJlY3RpdmVzL2NoZWNraW5Qcm9ncmVzcy9jaGVja2luUHJvZ3Jlc3MudHBsLmh0bWwnLFxuXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCAkcGFyc2UsICRyb290U2NvcGUsICRjb29raWVzLCAkc2Vzc2lvblN0b3JhZ2UsIHN0ZWVsVG9lKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnRhYkRhdGEgPSAoQ29uZmlndXJhdGlvbi5jb21wYW55Q29kZSA9PT0gJ0hBTCcpID9cbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRpbmc6ICdHdWVzdCBJbmZvJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRlOiAnZGV0YWlscydcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGluZzogJ1Bhc3Nwb3J0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRlOiAncGFzc3BvcnQnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRpbmc6ICdGbGlnaHRzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRlOiAnZmxpZ2h0cydcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGluZzogJ0NvbnRhY3RzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRlOiAnZW1lcmdlbmN5J1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkaW5nOiAnQWNjb3VudCcsXG4gICAgICAgICAgICAgICAgICAgICAgICByb3V0ZTogJ2FjY291bnQnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRpbmc6ICdDb250cmFjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICByb3V0ZTogJ2NvbnRyYWN0J1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkaW5nOiAnRG9jcycsXG4gICAgICAgICAgICAgICAgICAgICAgICByb3V0ZTogJ3N1bW1hcnknXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBdIDogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkaW5nOiAnR3Vlc3QgSW5mbycsXG4gICAgICAgICAgICAgICAgICAgICAgICByb3V0ZTogJ2RldGFpbHMnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRpbmc6ICdQYXNzcG9ydCcsXG4gICAgICAgICAgICAgICAgICAgICAgICByb3V0ZTogJ3Bhc3Nwb3J0J1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkaW5nOiAnRmxpZ2h0cycsXG4gICAgICAgICAgICAgICAgICAgICAgICByb3V0ZTogJ2ZsaWdodHMnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRpbmc6ICdDb250YWN0cycsXG4gICAgICAgICAgICAgICAgICAgICAgICByb3V0ZTogJ2VtZXJnZW5jeSdcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGluZzogJ0FjY291bnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm91dGU6ICdhY2NvdW50J1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWFkaW5nOiAnQ29udHJhY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgcm91dGU6ICdjb250cmFjdCdcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGluZzogJ1ByZWZlcmVuY2VzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRlOiAncHJlZmVyZW5jZXMnXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlYWRpbmc6ICdEb2NzJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvdXRlOiAnc3VtbWFyeSdcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBEZWxldGUgYWZ0ZXIgcHJlc2VudGF0aW9uLiAgVW5jb21tZW50IGFuZCByZWZyZXNoIHRvICdyZXNldCcgdGhlIGNvb2tpZXMgc28gdGhhdCBhbGwgcGFnZXMgaGF2ZSBub3QgYmVlbiB2aXNpdGVkLiAgVGhlIGNvbW1lbnQgYmFjayBvdXQgYW5kIHN0YXJ0IHRlc3RpbmcuXG4gICAgICAgICAgICAgICAgLy8gJGNvb2tpZXNbJ2RldGFpbHNWaXNpdGVkJ10gPSAnZmFsc2UnO1xuICAgICAgICAgICAgICAgIC8vICRjb29raWVzWydwYXNzcG9ydFZpc2l0ZWQnXSA9ICdmYWxzZSc7XG4gICAgICAgICAgICAgICAgLy8gJGNvb2tpZXNbJ2ZsaWdodHNWaXNpdGVkJ10gPSAnZmFsc2UnO1xuICAgICAgICAgICAgICAgIC8vICRjb29raWVzWydlbWVyZ2VuY3lWaXNpdGVkJ10gPSAnZmFsc2UnO1xuICAgICAgICAgICAgICAgIC8vICRjb29raWVzWydhY2NvdW50VmlzaXRlZCddID0gJ2ZhbHNlJztcbiAgICAgICAgICAgICAgICAvLyAkY29va2llc1snY29udHJhY3RWaXNpdGVkJ10gPSAnZmFsc2UnO1xuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gZ2V0SW5kZXgoIHNlcU51bWJlciApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJldHVybkluZGV4ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0LmZvckVhY2goIGZ1bmN0aW9uIChndWVzdCwgaW5kZXgsIGFycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCArZ3Vlc3Quc2VxTnVtYmVyID09PSArc2VxTnVtYmVyICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybkluZGV4ID0gaW5kZXg7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuSW5kZXg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gY2hlY2tQcm9wZXJ0eSggcHJvcGVydHkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9wZXJ0eSAhPT0gdW5kZWZpbmVkICYmIHByb3BlcnR5ICE9PSBudWxsICYmIHByb3BlcnR5ICE9PSAnJztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuYWxsVmlzaXRlZCA9IGZ1bmN0aW9uICggcGFnZU5hbWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2aXNpdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdC5mb3JFYWNoKCBmdW5jdGlvbiAoZ3Vlc3QsIGluZGV4LCBhcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggJHJvb3RTY29wZS5zZWxlY3RHdWVzdEZpbHRlciggZ3Vlc3Quc2VxTnVtYmVyICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlzaXRlZCA9IHZpc2l0ZWQgfHwgJHNjb3BlLnZpc2l0ZWRQYWdlKCBwYWdlTmFtZSwgZ3Vlc3Quc2VxTnVtYmVyICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmlzaXRlZDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICRzY29wZS52aXNpdGVkUGFnZSA9IGZ1bmN0aW9uICggcGFnZU5hbWUsIHNlcU51bWJlciApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJvb2tpbmdOdW1iZXIgPSAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uYm9va2luZ051bWJlcjtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRjb29raWVzWyBib29raW5nTnVtYmVyICsgc2VxTnVtYmVyICsgcGFnZU5hbWUgKyAnVmlzaXRlZCcgXSA9PT0gJ3RydWUnO1xuICAgICAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgICAgICRzY29wZS5jb21wbGV0ZWRQYWdlQWxsR3Vlc3RzID0gZnVuY3Rpb24gKCBwYWdlTmFtZSApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBsZXRlZCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0LmZvckVhY2goIGZ1bmN0aW9uIChndWVzdCwgaW5kZXgsIGFycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAkcm9vdFNjb3BlLnNlbGVjdEd1ZXN0RmlsdGVyKGd1ZXN0LnNlcU51bWJlcikgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29tcGxldGVkID0gY29tcGxldGVkICYmICRzY29wZS5jb21wbGV0ZWRQYWdlKCBwYWdlTmFtZSwgZ3Vlc3Quc2VxTnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGNvbXBsZXRlZDtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICRzY29wZS5jb21wbGV0ZWRQYWdlID0gZnVuY3Rpb24gKCBwYWdlTmFtZSwgc2VxTnVtYmVyICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHNjb3BlW3BhZ2VOYW1lICsgXCJJc0NvbXBsZXRlXCJdKCBzZXFOdW1iZXIgKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmRldGFpbHNJc0NvbXBsZXRlID0gZnVuY3Rpb24gKCBzZXFOdW1iZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KCBzZXFOdW1iZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbmRleCA9PT0gbnVsbCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmhvbWVBZGRyZXNzICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFzc2VuZ2VyLnBhc3RHdWVzdE51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhc3Nlbmdlci5nZW5kZXJcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJpcnRoZGF5Lm1vbnRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmlydGhkYXkuZGF5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmlydGhkYXkueWVhclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhc3Nlbmdlci5taWRkbGVOYW1lXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmhvbWVBZGRyZXNzLmNvdW50cnkgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5ob21lQWRkcmVzcy5zdHJlZXQxICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uaG9tZUFkZHJlc3Muc3RyZWV0MiAgICAgJiYgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmhvbWVBZGRyZXNzLnN0cmVldDIgIT09ICcnICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmhvbWVBZGRyZXNzLmNpdHkgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5ob21lQWRkcmVzcy5zdGF0ZSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmhvbWVBZGRyZXNzLnppcENvZGUgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5ob21lQWRkcmVzcy5waG9uZSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLy8gb2tUb1RleHRQaG9uZTFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAvLyBwaG9uZTJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAvLyBva1RvVGV4dFBob25lMlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5lUmVmICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAvLyBtYXJpdGFsIHN0YXR1c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIC8vIGVtcGxveW1lbnQgc3RhdHVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLy8gaGF2ZSB5b3UgdGFrZW4gYSBjcnVpc2UgYmVmb3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gLy8gd2hpY2ggY3J1aXNlIGxpbmVzOyBcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLnBhc3Nwb3J0SXNDb21wbGV0ZSA9IGZ1bmN0aW9uICggc2VxTnVtYmVyICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBnZXRJbmRleCggc2VxTnVtYmVyICk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5kZXggPT09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgcGFzc3BvcnREb25lID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uZG9jVHlwZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBuZWVkIHRvIHZhbGlkYXRlIHRoZXNlLCBidXQgdGhleSBhcmUgbmVlZGVkLlxuICAgICAgICAgICAgICAgICAgICAvLyAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8udHJhdmVsSW5pdGlhdGl2ZVR5cGVcbiAgICAgICAgICAgICAgICAgICAgLy8gcGFzc2VuZ2VyLm5hdGlvbmFsaXR5XG4gICAgICAgICAgICAgICAgICAgIC8vIGdldEFnZSggJHNjb3BlLnBhc3NlbmdlcnNbaV0uYmlydGhkYXRlLCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uc2FpbERhdGUgKVxuICAgICAgICAgICAgICAgICAgICAvLyAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uYWxsb3dFVVxuICAgICAgICAgICAgICAgICAgICAvLyB1c2luZyBiaXJ0aGNlcnRpZmljYXRlIHByb3BlcnR5P1xuXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdmFyIGRvY1R5cGVzID0gW107XG4gICAgICAgICAgICAgICAgICAgIC8vIC8vIDEuIEZvciBhbGwgY3J1aXNlIGl0aW5lcmFyaWVzOiAgYSBjdXJyZW50L3ZhbGlkIHBhc3Nwb3J0IGlzc3VlZCBieSBhbnkgY291bnRyeSByZWNvZ25pemVkIGJ5IHRoZSBVLlMuXG4gICAgICAgICAgICAgICAgICAgIC8vIGRvY1R5cGVzLnB1c2goJ1Bhc3Nwb3J0Jyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIC8vICAgLU9SLVxuICAgICAgICAgICAgICAgICAgICAvLyAvLyAzLiBGb3IgaXRpbmVyYXJpZXMgdGhhdCBkaXNlbWJhcmsgYXQgYSBVLlMuIHBvcnQgKGEg4oCcV0hUSSBjcnVpc2XigJ0pOlxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby50cmF2ZWxJbml0aWF0aXZlVHlwZS50b1VwcGVyQ2FzZSgpID09PSBcIk9cIiB8fCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8udHJhdmVsSW5pdGlhdGl2ZVR5cGUudG9VcHBlckNhc2UoKSA9PT0gXCJMXCIgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAvLyAgIDMuMiAgRm9yIENhbmFkaWFuIGNpdGl6ZW5zIDE2KyB5ZWFycyBvbGQ6ICBUcnVzdGVkIFRyYXZlbGVyIGNhcmQgKE5FWFVTLCBGQVNULCBTRU5UUkkpIFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0ubmF0aW9uYWxpdHkudG9VcHBlckNhc2UoKSA9PT0gJ0NBJyApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBkb2NUeXBlcy5wdXNoKCdORVhVUyBDYXJkJywgJ1NFTlRSSSBDYXJkJywgJ0Zhc3QgQ2FyZCcpO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgLy8gICAzLjMgIEZvciBVLlMuIGNpdGl6ZW5zIDE2KyB5ZWFycyBvbGQ6ICBhbnkgV0hUSS1jb21wbGlhbnQgZG9jdW1lbnQgKGluY2wuIHBhc3Nwb3J0IGNhcmQsIE5FWFVTLCBTRU5UUkksIEdsb2JhbCBFbnRyeSBvciBGQVNUIGNhcmQsIEVuaGFuY2VkIERyaXZlcuKAmXMgTGljZW5zZSwgb3IgRW5oYW5jZWQgTm9uLURyaXZlciBJRClcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGVsc2UgaWYgKCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0ubmF0aW9uYWxpdHkudG9VcHBlckNhc2UoKSA9PT0gJ1VTJyApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBkb2NUeXBlcy5wdXNoKCdQYXNzcG9ydCBDYXJkJywgXCJFbmhhbmNlZCBEcml2ZXIncyBMaWNlbnNlXCIsIFwiRW5oYW5jZWQgTm9uLURyaXZlciBJRFwiLCAnTkVYVVMgQ2FyZCcsICdTRU5UUkkgQ2FyZCcsICdGYXN0IENhcmQnKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIC8vICAgMy40ICBGb3IgYWxsIG90aGVyczogICB2YWxpZCBwYXNzcG9ydCwgcGx1czogIGEgdmFsaWQgdmlzYSAodW5sZXNzIGV4ZW1wdCkgb3IgaWYgdHJhdmVsaW5nIG9uIHRoZSBWaXNhIFdhaXZlciBQcm9ncmFtLCBhbiBhcHByb3ZlZCBFbGVjdHJvbmljIFN5c3RlbSBmb3IgVHJhdmVsIEF1dGhvcml6YXRpb24gKEVTVEEpLlxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgLy8gVmlzYSBwbGFjZSBvZiBpc3N1YW5jZVxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIC8vIFZpc2EgY29udHJvbCBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAvLyBWaXNhIGlzc3VlIGRhdGVcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICAvLyBWaXNhIGV4cGlyZSBkYXRlXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gLy8gICAtT1ItXG4gICAgICAgICAgICAgICAgICAgIC8vIC8vIDIuIEZvciBpdGluZXJhcmllcyB0aGF0IGVtYmFyayAmIGRpc2VtYmFyayBvbmx5IHdpdGhpbiB0aGUgRVU6ICBBbiBFVS1pc3N1ZWQgSUQgY2FyZFxuICAgICAgICAgICAgICAgICAgICAvLyBpZiAoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5hbGxvd0VVICkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgZG9jVHlwZXMucHVzaCgnRXVyb3BlYW4gSUQgQ2FyZCcpO1xuICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgIC8vIC8vICAgMy4xIEZvciBVLlMuIGFuZCBDYW5hZGlhbiBjaXRpemVucyA8IDE2IHllYXJzIG9sZDogIEJpcnRoIGNlcnRpZmljYXRlIG9yIE5hdHVyYWxpemF0aW9uIGNlcnRpZmljYXRlXG4gICAgICAgICAgICAgICAgICAgIC8vIGlmICggKCRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5uYXRpb25hbGl0eS50b1VwcGVyQ2FzZSgpID09PSAnVVMnIHx8ICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5uYXRpb25hbGl0eS50b1VwcGVyQ2FzZSgpID09PSAnQ0EnKSAmJiBnZXRBZ2UoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5iaXJ0aGRhdGUsICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5zYWlsRGF0ZSApIDwgMTYgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBkb2NUeXBlcy5wdXNoKCdCaXJ0aCBDZXJ0aWZpY2F0ZSAoV2l0aCBhIGdvdmVybm1lbnQtaXNzdWVkIHBpY3R1cmUgSUQpJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIH1cblxuXG4gICAgICAgICAgICAgICAgICAgIC8vICAgMy4yICBGb3IgQ2FuYWRpYW4gY2l0aXplbnMgMTYrIHllYXJzIG9sZDogIFRydXN0ZWQgVHJhdmVsZXIgY2FyZCAoTkVYVVMsIEZBU1QsIFNFTlRSSSkgXG4gICAgICAgICAgICAgICAgICAgIC8vICAgMy4zICBGb3IgVS5TLiBjaXRpemVucyAxNisgeWVhcnMgb2xkOiAgYW55IFdIVEktY29tcGxpYW50IGRvY3VtZW50IChpbmNsLiBwYXNzcG9ydCBjYXJkLCBORVhVUywgU0VOVFJJLCBHbG9iYWwgRW50cnkgb3IgRkFTVCBjYXJkLCBFbmhhbmNlZCBEcml2ZXLigJlzIExpY2Vuc2UsIG9yIEVuaGFuY2VkIE5vbi1Ecml2ZXIgSUQpXG4gICAgICAgICAgICAgICAgICAgIC8vICAgMy40ICBGb3IgYWxsIG90aGVyczogICB2YWxpZCBwYXNzcG9ydCwgcGx1czogIGEgdmFsaWQgdmlzYSAodW5sZXNzIGV4ZW1wdCkgb3IgaWYgdHJhdmVsaW5nIG9uIHRoZSBWaXNhIFdhaXZlciBQcm9ncmFtLCBhbiBhcHByb3ZlZCBFbGVjdHJvbmljIFN5c3RlbSBmb3IgVHJhdmVsIEF1dGhvcml6YXRpb24gKEVTVEEpLlxuICAgICAgICAgICAgICAgICAgICBpZiAoICEkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8udHJhdmVsSW5pdGlhdGl2ZVR5cGUgfHwgISRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5uYXRpb25hbGl0eSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby50cmF2ZWxJbml0aWF0aXZlVHlwZSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8udHJhdmVsSW5pdGlhdGl2ZVR5cGUudG9VcHBlckNhc2UoKSA9PT0gXCJPXCIgfHwgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLnRyYXZlbEluaXRpYXRpdmVUeXBlLnRvVXBwZXJDYXNlKCkgPT09IFwiTFwiICkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0ubmF0aW9uYWxpdHkudG9VcHBlckNhc2UoKSAhPT0gJ0NBJyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLm5hdGlvbmFsaXR5LnRvVXBwZXJDYXNlKCkgIT09ICdVUycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBWaXNhIHBsYWNlIG9mIGlzc3VhbmNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVmlzYSBjb250cm9sIG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFZpc2EgaXNzdWUgZGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFZpc2EgZXhwaXJlIGRhdGVcbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgcGFzc3BvcnREb25lID0gcGFzc3BvcnREb25lICYmXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uQ2hlY2tJblBhc3Nlbmdlci5lbWVyZ2VuY3lBaXIpICYmICAgICAgICAgICAgLy8gZW1lcmdlbmN5QWlyIC0gXCJjaGVja2luV2ViRGJcIjogeyBcImNoZWNraW5QYXNzZW5nZXJzXCI6IFsgeyBcImVtZXJnZW5jeUFpclwiOiBcIlBIWFwiXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uQ2hlY2tJblBhc3Nlbmdlci50ZXJtc0NvbmRpdGlvbnNWaXNhRmxhZykgJiYgLy8gdGVybXNDb25kaXRpb25zVmlzYUZsYWcgLSBcImNoZWNraW5XZWJEYlwiOiB7IFwiY2hlY2tpblBhc3NlbmdlcnNcIjogWyB7IFwidGVybXNDb25kaXRpb25zVmlzYUZsYWdcIjogMTQzNTQ0MTQ2NTAwMFxuICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLkNoZWNrSW5QYXNzZW5nZXIubGFuZ1ByZWZDb2RlICk7ICAgICAgICAgICAgIC8vIGxhbmdQcmVmQ29kZSAtIFwiY2hlY2tpbldlYkRiXCI6IHsgXCJjaGVja2luUGFzc2VuZ2Vyc1wiOiBbIHsgXCJsYW5nUHJlZkNvZGVcIjogXCJlblwiXG5cblxuICAgICAgICAgICAgICAgICAgICB2YXIgZG9jSW5mbyA9IHN0ZWVsVG9lLmRvKCRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXSkuZ2V0KCdpbW1pZ3JhdGlvbkRvY0luZm8nKSB8fCB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrSW5QYXNzZW5nZXIgPSBzdGVlbFRvZS5kbygkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0pLmdldCgnQ2hlY2tJblBhc3NlbmdlcicpIHx8IHt9O1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggZG9jSW5mby5kb2N1bWVudFR5cGUgPT09IFwiRW5oYW5jZWQgRHJpdmVyJ3MgTGljZW5zZVwiICkgeyAgLy8gXCJEXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3Nwb3J0RG9uZSA9IHBhc3Nwb3J0RG9uZSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmlzc3VlQ291bnRyeU5hbWUgKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBwZXJtUmVzaWRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBwZXJtUmVzaWRlbnRDYXJkTnVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggZG9jSW5mby5pc3N1ZUNpdHlOYW1lICkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggZG9jSW5mby5iaXJ0aENvdW50cnlOYW1lICkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggY2hlY2tJblBhc3Nlbmdlci5wbGFjZU9mQmlydGggKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmRvY3VtZW50TnVtYmVyICkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggZG9jSW5mby5kb2N1bWVudE51bWJlckNvbmZpcm0gKSAmJiAgLy8gTmVlZCB0byBjaGVjayB0aGF0IHRoaXMgbWF0Y2hlcyBkb2N1bWVudE51bWJlciBhYm92ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoIGRvY0luZm8uaXNzdWVEYXRlICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmV4cGlyYXRpb25EYXRlICk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggZG9jSW5mby5kb2N1bWVudFR5cGUgPT09IFwiRW5oYW5jZWQgTm9uLURyaXZlciBJRFwiICkgeyAgLy8gXCJFXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3Nwb3J0RG9uZSA9IHBhc3Nwb3J0RG9uZSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmlzc3VlQ291bnRyeU5hbWUgKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBwZXJtUmVzaWRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBwZXJtUmVzaWRlbnRDYXJkTnVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggZG9jSW5mby5pc3N1ZUNpdHlOYW1lICkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggZG9jSW5mby5iaXJ0aENvdW50cnlOYW1lICkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggY2hlY2tJblBhc3Nlbmdlci5wbGFjZU9mQmlydGggKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmRvY3VtZW50TnVtYmVyICkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggZG9jSW5mby5kb2N1bWVudE51bWJlckNvbmZpcm0gKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoIGRvY0luZm8uaXNzdWVEYXRlICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmV4cGlyYXRpb25EYXRlICk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggZG9jSW5mby5kb2N1bWVudFR5cGUgPT09IFwiRXVyb3BlYW4gSUQgQ2FyZFwiICkgeyAgLy8gXCJVXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3Nwb3J0RG9uZSA9IHBhc3Nwb3J0RG9uZSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmlzc3VlQ291bnRyeU5hbWUgKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBwZXJtUmVzaWRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmJpcnRoQ291bnRyeU5hbWUgKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBjaGVja0luUGFzc2VuZ2VyLnBsYWNlT2ZCaXJ0aCApICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoIGRvY0luZm8uZG9jdW1lbnROdW1iZXIgKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmRvY3VtZW50TnVtYmVyQ29uZmlybSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggZG9jSW5mby5pc3N1ZURhdGUgKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoIGRvY0luZm8uZXhwaXJhdGlvbkRhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBkb2NJbmZvLmRvY3VtZW50VHlwZSA9PT0gXCJGYXN0IENhcmRcIiAgfHwgICAgLy8gXCJGXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLmRvY3VtZW50VHlwZSA9PT0gXCJORVhVUyBDYXJkXCIgfHwgICAgLy8gXCJOXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICBkb2NJbmZvLmRvY3VtZW50VHlwZSA9PT0gXCJTRU5UUkkgQ2FyZFwiICkgeyAgLy8gXCJTXCJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzcG9ydERvbmUgPSBwYXNzcG9ydERvbmUgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoIGRvY0luZm8uaXNzdWVDb3VudHJ5TmFtZSApICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBwZXJtUmVzaWRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogcGVybVJlc2lkZW50Q2FyZE51bVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmJpcnRoQ291bnRyeU5hbWUgKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBjaGVja0luUGFzc2VuZ2VyLnBsYWNlT2ZCaXJ0aCApICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmV4cGlyYXRpb25EYXRlICk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggZG9jSW5mby5kb2N1bWVudFR5cGUgPT09IFwiUGFzc3BvcnQgQ2FyZFwiICkgeyAgLy8gXCJDXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3Nwb3J0RG9uZSA9IHBhc3Nwb3J0RG9uZSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmlzc3VlQ291bnRyeU5hbWUgKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBwZXJtUmVzaWRlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBwZXJtUmVzaWRlbnRDYXJkTnVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggZG9jSW5mby5iaXJ0aENvdW50cnlOYW1lICkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggY2hlY2tJblBhc3Nlbmdlci5wbGFjZU9mQmlydGggKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmRvY3VtZW50TnVtYmVyICkgJiYgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggZG9jSW5mby5kb2N1bWVudE51bWJlckNvbmZpcm0gKSAmJiAgLy8gTmVlZCB0byBjaGVjayB0aGF0IHRoaXMgbWF0Y2hlcyBkb2N1bWVudE51bWJlciBhYm92ZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmlzc3VlRGF0ZSApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggZG9jSW5mby5leHBpcmF0aW9uRGF0ZSApO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoIGRvY0luZm8uZG9jdW1lbnRUeXBlID09PSBcIlBhc3Nwb3J0XCIgKSB7ICAvLyBcIlBcIlxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3BvcnREb25lID0gcGFzc3BvcnREb25lICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoIGRvY0luZm8uaXNzdWVDb3VudHJ5TmFtZSApICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHBlcm1SZXNpZGVudFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHBlcm1SZXNpZGVudENhcmROdW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmJpcnRoQ291bnRyeU5hbWUgKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBjaGVja0luUGFzc2VuZ2VyLnBsYWNlT2ZCaXJ0aCApICYmIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoIGRvY0luZm8uZG9jdW1lbnROdW1iZXIgKSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmRvY3VtZW50TnVtYmVyQ29uZmlybSApICYmICAvLyBOZWVkIHRvIGNoZWNrIHRoYXQgdGhpcyBtYXRjaGVzIGRvY3VtZW50TnVtYmVyIGFib3ZlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoIGRvY0luZm8uaXNzdWVEYXRlICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCBkb2NJbmZvLmV4cGlyYXRpb25EYXRlICk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggZG9jSW5mby5kb2N1bWVudFR5cGUgPT09IFwiQmlydGggQ2VydGlmaWNhdGUgKFdpdGggYSBnb3Zlcm5tZW50LWlzc3VlZCBwaWN0dXJlIElEKVwiICkgeyAgLy8gXCJCXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhc3Nwb3J0RG9uZSA9IHBhc3Nwb3J0RG9uZSAmJiBcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHVzaW5nQmlydGhDZXJ0aWZpY2F0ZSAgIC0gXCJjaGVja2luV2ViRGJcIjogeyBcImNoZWNraW5QYXNzZW5nZXJzXCI6IFsgeyBcInVzaW5nQmlydGhDZXJ0aWZpY2F0ZVwiOiBcIk5cIlxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzcG9ydERvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhc3Nwb3J0RG9uZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmZsaWdodHNJc0NvbXBsZXRlID0gZnVuY3Rpb24gKCBzZXFOdW1iZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KCBzZXFOdW1iZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbmRleCA9PT0gbnVsbCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB2YXIgZmxpZ2h0c0RvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggJHNjb3BlLmlzUHJlQ3J1aXNlVHJhbnNwb3J0YXRpb25Bc3NpZ25tZW50KCBzZXFOdW1iZXIgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsaWdodHNEb25lID0gZmxpZ2h0c0RvbmUgJiYgdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSAgICAgXG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmUtQ3J1aXNlIEZsaWdodCBTdGF0dXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsaWdodHNEb25lID0gZmxpZ2h0c0RvbmUgJiYgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLnBhZ2VTdGF0ZXMuZmxpZ2h0cy50cmFuc2ZlclByb3BzLnByZUNydWlzZSApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBiZWdpbiBwcmUtY3J1aXNlIGNvbGxhcHNlIHNlY3Rpb24gXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICRzY29wZS5pc1ByZUNydWlzZU9wZW4oIHNlcU51bWJlciApICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxpZ2h0c0RvbmUgPSBmbGlnaHRzRG9uZSAmJiBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgQ3J1aXNlIC0gVGhpcyBpcyBhIHByaXZhdGUgamV0IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFRoaXMgaXMgYSBwcml2YXRlIGpldCBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZSBDcnVpc2UgLSBBaXJsaW5lIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoIHN0ZWVsVG9lLmRvKCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0gKS5nZXQoIFwiZ3Vlc3RGbGlnaHREZXRhaWxzLm9yaWdpbkZsaWdodC5jYXJyaWVyTmFtZVwiICkgKSAmJlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlIENydWlzZSAtIERlcGFydHVyZSBDaXR5IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5ndWVzdEZsaWdodERldGFpbHMub3JpZ2luRmxpZ2h0LmRlcGFydENpdHlDb2RlICkgJiZcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZSBDcnVpc2UgLSBEZXBhcnR1cmUgRGF0ZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uZ3Vlc3RGbGlnaHREZXRhaWxzLm9yaWdpbkZsaWdodC5kZXBhcnR1cmVEYXRlICkgJiZcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZSBDcnVpc2UgLSBEZXBhcnR1cmUgVGltZSAtIEhvdXIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmd1ZXN0RmxpZ2h0RGV0YWlscy5vcmlnaW5GbGlnaHQuZGVwYXJ0dXJlVGltZS5ob3VyICkgJiZcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZSBDcnVpc2UgLSBEZXBhcnR1cmUgVGltZSAtIE1pbnV0ZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uZ3Vlc3RGbGlnaHREZXRhaWxzLm9yaWdpbkZsaWdodC5kZXBhcnR1cmVUaW1lLm1pbnV0ZSApICYmXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmUgQ3J1aXNlIC0gQXJyaXZhbCBDaXR5IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5ndWVzdEZsaWdodERldGFpbHMub3JpZ2luRmxpZ2h0LmFycml2ZUNpdHlDb2RlICkgJiZcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZSBDcnVpc2UgLSBBcnJpdmFsIERhdGUgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmd1ZXN0RmxpZ2h0RGV0YWlscy5vcmlnaW5GbGlnaHQuYXJyaXZhbERhdGUgKSAmJlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlIENydWlzZSAtIEFycml2YWwgVGltZSAtIEhvdXIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmd1ZXN0RmxpZ2h0RGV0YWlscy5vcmlnaW5GbGlnaHQuYXJyaXZhbFRpbWUuaG91ciApICYmXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmUgQ3J1aXNlIC0gQXJyaXZhbCBUaW1lIC0gTWludXRlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5ndWVzdEZsaWdodERldGFpbHMub3JpZ2luRmxpZ2h0LmFycml2YWxUaW1lLm1pbnV0ZSApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJlIENydWlzZSAtIFRhaWwgTnVtYmVyIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IFRhaWwgTnVtYmVyIFxuXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAvLyBlbmQgcHJlLWNydWlzZSBjb2xsYXBzZSBzZWN0aW9uIFxuXG5cbiAgICAgICAgICAgICAgICAgICAgfSAgLy8gZW5kIGhpZGUgcGFzc2VuZ2VyLnRyYW5zcG9ydGF0aW9uQXNzaWdubWVudHMub3JpZ2luIFxuXG5cbiAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAkc2NvcGUuaXNQb3N0Q3J1aXNlVHJhbnNwb3J0YXRpb25Bc3NpZ25tZW50KCBzZXFOdW1iZXIgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsaWdodHNEb25lID0gZmxpZ2h0c0RvbmUgJiYgdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggJHNjb3BlLmlzUG9zdENydWlzZU5vdFRyYW5zcG9ydGF0aW9uQXNzaWdubWVudCggc2VxTnVtYmVyICkgKSB7ICAvLyBub24tZm9yZWlnbiBwb3N0LWNydWlzZSBzZWN0aW9uIFxuXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvc3QtQ3J1aXNlIEZsaWdodCBTdGF0dXMgKG5vbi1mb3JlaWduKSBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggISRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5wYWdlU3RhdGVzLmZsaWdodHMuZm9yZWlnbiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGlnaHRzRG9uZSA9IGZsaWdodHNEb25lICYmIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5wYWdlU3RhdGVzLmZsaWdodHMudHJhbnNmZXJQcm9wcy5wb3N0Q3J1aXNlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUG9zdC1DcnVpc2UgRmxpZ2h0IENvbm5lY3Rpb24gU3RhdHVzIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAkc2NvcGUuaXNQb3N0Q3J1aXNlT3Blbiggc2VxTnVtYmVyICkgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbGlnaHRzRG9uZSA9IGZsaWdodHNEb25lICYmIFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLnBhZ2VTdGF0ZXMuZmxpZ2h0cy50cmFuc2ZlclByb3BzLnBvc3RDcnVpc2VDb25uZWN0aW9uICkgJiYgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3N0IENydWlzZSAtIFRoaXMgaXMgYSBwcml2YXRlIGpldCBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBUaGlzIGlzIGEgcHJpdmF0ZSBqZXQgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3N0IENydWlzZSAtIEFpcmxpbmUgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmd1ZXN0RmxpZ2h0RGV0YWlscy50ZXJtaW5hbEZsaWdodC5jYXJyaWVyTmFtZSApICYmIFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUG9zdCBDcnVpc2UgLSBGbGlnaHQgTnVtYmVyIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5ndWVzdEZsaWdodERldGFpbHMudGVybWluYWxGbGlnaHQuZmxpZ2h0TnVtYmVyICkgJiYgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3N0IENydWlzZSAtIERlcGFydHVyZSBDaXR5IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5ndWVzdEZsaWdodERldGFpbHMudGVybWluYWxGbGlnaHQuZGVwYXJ0Q2l0eUNvZGUgKSAmJiBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgQ3J1aXNlIC0gRGVwYXJ0dXJlIERhdGUgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmd1ZXN0RmxpZ2h0RGV0YWlscy50ZXJtaW5hbEZsaWdodC5kZXBhcnR1cmVEYXRlICkgJiYgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3N0IENydWlzZSAtIERlcGFydHVyZSBUaW1lIC0gSG91ciBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uZ3Vlc3RGbGlnaHREZXRhaWxzLnRlcm1pbmFsRmxpZ2h0LmRlcGFydHVyZVRpbWUuaG91ciApICYmIFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUG9zdCBDcnVpc2UgLSBEZXBhcnR1cmUgVGltZSAtIE1pbnV0ZSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uZ3Vlc3RGbGlnaHREZXRhaWxzLnRlcm1pbmFsRmxpZ2h0LmRlcGFydHVyZVRpbWUubWludXRlICkgJiYgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3N0IENydWlzZSAtIEFycml2YWwgQ2l0eSBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uZ3Vlc3RGbGlnaHREZXRhaWxzLnRlcm1pbmFsRmxpZ2h0LmFycml2ZUNpdHlDb2RlICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmUgQ3J1aXNlIC0gVGFpbCBOdW1iZXIgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVGFpbCBOdW1iZXIgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIH0vLyBlbmQgY29sbGFwc2UgcG9zdENydWlzZSBzZWN0aW9uIFxuXG4gICAgICAgICAgICAgICAgICAgIH0gLy8gZW5kIGNvbGxhcHNlICdzYW1lIGFzIG1haW4gcGFzc2VuZ2VyJyBzZWN0aW9uIFxuXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gYmVnaW4gZm9yZWlnbiBzZWN0aW9uIFxuICAgICAgICAgICAgICAgICAgICBpZiAoICRzY29wZS5pc0ZvcmVpZ25TZWN0aW9uT3Blbiggc2VxTnVtYmVyICkgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIExlYXZpbmcgYnkgcGxhbmU/ICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsaWdodHNEb25lID0gZmxpZ2h0c0RvbmUgJiYgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLnBhZ2VTdGF0ZXMuZmxpZ2h0cy50cmFuc2ZlclByb3BzLnBvc3RDcnVpc2UgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRmx5aW5nIHdpdGhpbiAxMiBIb3Vycz8gXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICRzY29wZS5pc0ZseWluZ1dpdGhpblR3ZWx2ZUhvdXJzT3Blbiggc2VxTnVtYmVyICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxpZ2h0c0RvbmUgPSBmbGlnaHRzRG9uZSAmJiBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uQ2hlY2tJblBhc3Nlbmdlci5kZXBhcnRBZnRlcjEySG91cnMgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU3RheWluZyBPdmVybmlnaHQ/IFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCAkc2NvcGUuaXNTdGF5aW5nT3Zlcm5pZ2h0T3Blbiggc2VxTnVtYmVyICkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxpZ2h0c0RvbmUgPSBmbGlnaHRzRG9uZSAmJiBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0ucGFnZVN0YXRlcy5mbGlnaHRzLnN0YXlpbmdPdmVybmlnaHQgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFdoZXJlIGFyZSB5b3Ugc3RheWluZz8gXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICRzY29wZS5pc1doZXJlQXJlWW91U3RheWluZ09wZW4oIHNlcU51bWJlciApICkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmxpZ2h0c0RvbmUgPSBmbGlnaHRzRG9uZSAmJiBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgQ3J1aXNlIC0gV2hlcmUgYXJlIHlvdSBzdGF5aW5nPyAtIENvdW50cnkgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmRlc3RBZGRyZXNzLmNvdW50cnkgKSAmJiBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgQ3J1aXNlIC0gV2hlcmUgYXJlIHlvdSBzdGF5aW5nPyAtIFBvc3RhbCBDb2RlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5kZXN0QWRkcmVzcy56aXBDb2RlICkgJiYgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3N0IENydWlzZSAtIFdoZXJlIGFyZSB5b3Ugc3RheWluZz8gLSBIb3RlbCBOYW1lIG9yIEFkZHJlc3MgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmRlc3RBZGRyZXNzLnN0cmVldDEgKSAmJiBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgQ3J1aXNlIC0gV2hlcmUgYXJlIHlvdSBzdGF5aW5nPyAtIENpdHkgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmRlc3RBZGRyZXNzLmNpdHkgKSAmJiBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgQ3J1aXNlIC0gV2hlcmUgYXJlIHlvdSBzdGF5aW5nPyAtIFN0YXRlIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5kZXN0QWRkcmVzcy5zdGF0ZSApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAvLyBlbmQgb3Zlcm5pZ2h0IGFkZHJlc3MgXG5cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG93IGFyZSB5b3UgbGVhdmluZz8gXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoICRzY29wZS5pc0hvd0FyZVlvdUxlYXZpbmdPcGVuKCBzZXFOdW1iZXIgKSApIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsaWdodHNEb25lID0gZmxpZ2h0c0RvbmUgJiYgXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQb3N0IENydWlzZSAtIEhvdyBhcmUgeW91IGxlYXZpbmcgdGhlIFVTPyAtIE1vZGUgb2YgVHJhbnNwb3J0YXRpb24gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmRlc3RBZGRyZXNzLnN0cmVldDEgKSAmJiBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgQ3J1aXNlIC0gSG93IGFyZSB5b3UgbGVhdmluZyB0aGUgVVM/IC0gQ2l0eSBUcmF2ZWxpbmcgVG8gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmRlc3RBZGRyZXNzLmNpdHkgKSAmJiBcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBvc3QgQ3J1aXNlIC0gSG93IGFyZSB5b3UgbGVhdmluZyB0aGUgVVM/IC0gU3RhdGUvUHJvdmluY2UgVHJhdmVsaW5nIFRvIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5kZXN0QWRkcmVzcy5zdGF0ZSApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB9ICAvLyBlbmQgaG93IGFyZSB5b3UgbGVhdmluZyBzZWN0aW9uIFxuXG5cbiAgICAgICAgICAgICAgICAgICAgfSAgLy8gZW5kIGZvcmVpZ24gc2VjdGlvbiBcblxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbGlnaHRzRG9uZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gUHJlIENydWlzZSBGbGlnaHRzXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzUHJlQ3J1aXNlT3BlbiA9IGZ1bmN0aW9uICggc2VxTnVtYmVyICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBnZXRJbmRleCggc2VxTnVtYmVyICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0ucGFnZVN0YXRlcy5mbGlnaHRzLnRyYW5zZmVyUHJvcHMucHJlQ3J1aXNlID09PSB0cnVlIHx8ICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5wYWdlU3RhdGVzLmZsaWdodHMudHJhbnNmZXJQcm9wcy5wcmVDcnVpc2UgPT09ICd0cnVlJztcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzUHJlQ3J1aXNlVHJhbnNwb3J0YXRpb25Bc3NpZ25tZW50ID0gZnVuY3Rpb24gKCBzZXFOdW1iZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KCBzZXFOdW1iZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0ZWVsVG9lLmRvKCRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXSkuZ2V0KFwidHJhbnNwb3J0YXRpb25Bc3NpZ25tZW50cy5vcmlnaW5cIik7XG4gICAgICAgICAgICAgICAgfTtcblxuXG4gICAgICAgICAgICAgICAgLy8gUG9zdCBDcnVpc2UgRmxpZ2h0c1xuICAgICAgICAgICAgICAgICRzY29wZS5pc1Bvc3RDcnVpc2VPcGVuID0gZnVuY3Rpb24gKCBzZXFOdW1iZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KCBzZXFOdW1iZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5wYWdlU3RhdGVzLmZsaWdodHMudHJhbnNmZXJQcm9wcy5wb3N0Q3J1aXNlID09PSB0cnVlIHx8ICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5wYWdlU3RhdGVzLmZsaWdodHMudHJhbnNmZXJQcm9wcy5wb3N0Q3J1aXNlID09PSAndHJ1ZSc7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5pc1Bvc3RDcnVpc2VUcmFuc3BvcnRhdGlvbkFzc2lnbm1lbnQgPSBmdW5jdGlvbiAoIHNlcU51bWJlciApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgoIHNlcU51bWJlciApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RlZWxUb2UuZG8oJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdKS5nZXQoJ3RyYW5zcG9ydGF0aW9uQXNzaWdubWVudHMudGVybWluYWwnKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzUG9zdENydWlzZU5vdFRyYW5zcG9ydGF0aW9uQXNzaWdubWVudCA9IGZ1bmN0aW9uICggc2VxTnVtYmVyICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBnZXRJbmRleCggc2VxTnVtYmVyICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhKCRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5wYWdlU3RhdGVzLmZsaWdodHMuc2FtZUZsaWdodHMgPT09ICd5ZXMnIHx8ICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS50cmFuc3BvcnRhdGlvbkFzc2lnbm1lbnRzLnRlcm1pbmFsKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzRm9yZWlnblNlY3Rpb25PcGVuID0gZnVuY3Rpb24gKCBzZXFOdW1iZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KCBzZXFOdW1iZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICEoISRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5wYWdlU3RhdGVzLmZsaWdodHMuZm9yZWlnbiB8fCAhJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLnBhZ2VTdGF0ZXMuZmxpZ2h0cy5lbmRzSW5VUyk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5pc0ZseWluZ1dpdGhpblR3ZWx2ZUhvdXJzT3BlbiA9IGZ1bmN0aW9uICggc2VxTnVtYmVyICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBnZXRJbmRleCggc2VxTnVtYmVyICk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5wYWdlU3RhdGVzLmZsaWdodHMudHJhbnNmZXJQcm9wcy5wb3N0Q3J1aXNlID09PSBmYWxzZSB8fCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0ucGFnZVN0YXRlcy5mbGlnaHRzLnRyYW5zZmVyUHJvcHMucG9zdENydWlzZSA9PT0gJ25vdFlldCcgKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzU3RheWluZ092ZXJuaWdodE9wZW4gPSBmdW5jdGlvbiAoIHNlcU51bWJlciApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgoIHNlcU51bWJlciApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gKCAhKCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0ucGFnZVN0YXRlcy5mbGlnaHRzLnRyYW5zZmVyUHJvcHMucG9zdENydWlzZSAhPT0gZmFsc2UgfHwgKCRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5wYWdlU3RhdGVzLmZsaWdodHMudHJhbnNmZXJQcm9wcy5wb3N0Q3J1aXNlID09PSB0cnVlICYmICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5DaGVja0luUGFzc2VuZ2VyLmRlcGFydEFmdGVyMTJIb3VycyA9PT0gdHJ1ZSkgKSApO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNXaGVyZUFyZVlvdVN0YXlpbmdPcGVuID0gZnVuY3Rpb24gKCBzZXFOdW1iZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KCBzZXFOdW1iZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLnBhZ2VTdGF0ZXMuZmxpZ2h0cy50cmFuc2ZlclByb3BzLnBvc3RDcnVpc2UgPT09IHRydWUgJiYgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLkNoZWNrSW5QYXNzZW5nZXIuZGVwYXJ0QWZ0ZXIxMkhvdXJzID09PSB0cnVlICkgfHwgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLnBhZ2VTdGF0ZXMuZmxpZ2h0cy50cmFuc2ZlclByb3BzLnBvc3RDcnVpc2UgPT09IGZhbHNlICYmICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5wYWdlU3RhdGVzLmZsaWdodHMuc3RheWluZ092ZXJuaWdodCA9PT0gdHJ1ZSApIDtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzSG93QXJlWW91TGVhdmluZ09wZW4gPSBmdW5jdGlvbiAoIHNlcU51bWJlciApIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gZ2V0SW5kZXgoIHNlcU51bWJlciApO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gISgkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0ucGFnZVN0YXRlcy5mbGlnaHRzLnRyYW5zZmVyUHJvcHMucG9zdENydWlzZSA9PT0gdHJ1ZSB8fCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0ucGFnZVN0YXRlcy5mbGlnaHRzLnN0YXlpbmdPdmVybmlnaHQgPT09IHRydWUgfHwgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLnBhZ2VTdGF0ZXMuZmxpZ2h0cy5zdGF5aW5nT3Zlcm5pZ2h0ID09PSB1bmRlZmluZWQpO1xuICAgICAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgICAgICRzY29wZS5lbWVyZ2VuY3lJc0NvbXBsZXRlID0gZnVuY3Rpb24gKCBzZXFOdW1iZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IGdldEluZGV4KCBzZXFOdW1iZXIgKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBpbmRleCA9PT0gbnVsbCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uZW1lcmdlbmN5Q29udGFjdCAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5lbWVyZ2VuY3lDb250YWN0Lmxhc3ROYW1lICkgICAgICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmVtZXJnZW5jeUNvbnRhY3QucmVsYXRpb25zaGlwICkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uZW1lcmdlbmN5Q29udGFjdC5jb3VudHJ5ICkgICAgICAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5lbWVyZ2VuY3lDb250YWN0LnppcCApICAgICAgICAgICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmVtZXJnZW5jeUNvbnRhY3Quc3RyZWV0MSApICAgICAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uZW1lcmdlbmN5Q29udGFjdC5zdHJlZXQyICkgICAgICAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5lbWVyZ2VuY3lDb250YWN0LmNpdHkgKSAgICAgICAgICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLmVtZXJnZW5jeUNvbnRhY3Quc3RhdGUgKSAgICAgICAgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0uZW1lcmdlbmN5Q29udGFjdC5waG9uZSApICAgICAgICAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrUHJvcGVydHkoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ndWVzdFsgaW5kZXggXS5lbWVyZ2VuY3lDb250YWN0LmVtYWlsICk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5hY2NvdW50SXNDb21wbGV0ZSA9IGZ1bmN0aW9uICggc2VxTnVtYmVyICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBnZXRJbmRleCggc2VxTnVtYmVyICk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggaW5kZXggPT09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgYWNjb3VudERvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIGFjY291bnREb25lID0gYWNjb3VudERvbmUgJiYgY2hlY2tQcm9wZXJ0eSggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLnBhZ2VTdGF0ZXMuYWNjb3VudC5wYXlDYXNoICk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyBpbmRleCBdLnBhZ2VTdGF0ZXMuYWNjb3VudC5wYXlDYXNoICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3VudERvbmUgPSBhY2NvdW50RG9uZSAmJiBjaGVja1Byb3BlcnR5KCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIGluZGV4IF0ucGFnZVN0YXRlcy5hY2NvdW50LmNvcHlDYXJkICk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWNjb3VudERvbmU7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5jb250cmFjdElzQ29tcGxldGUgPSBmdW5jdGlvbiAoIHNlcU51bWJlciApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWUgJiYgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WyAwIF0uQ2hlY2tJblBhc3Nlbmdlci50ZXJtc0NvbmRpdGlvbnNFZG9jc0ZsYWc7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3RbIDAgXS5wYWdlU3RhdGVzLmNvbnRyYWN0LmFjY2VwdFRlcm1zO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgJHNjb3BlLnByZWZlcmVuY2VzSXNDb21wbGV0ZSA9IGZ1bmN0aW9uICggc2VxTnVtYmVyICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgLy8gVE9ETzogTG9vayBhdCB3aXJlZnJhbWUgLSBodHRwczovL2hhbHBqaXJhMDE6ODQ0My9icm93c2UvT0xDSS0yOSAtIDQgLSBVcG9uIHByaW50aW5nLCBTdW1tYXJ5ICYgQm9hcmRpbmcgUGFzcyByZWNpZXZlcyBjaGVja21hcmsuXG4gICAgICAgICAgICAgICAgJHNjb3BlLnN1bW1hcnlJc0NvbXBsZXRlID0gZnVuY3Rpb24gKCBzZXFOdW1iZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAgJHNjb3BlLmRldGFpbHNJc0NvbXBsZXRlKCBzZXFOdW1iZXIgKSAgICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnBhc3Nwb3J0SXNDb21wbGV0ZSggc2VxTnVtYmVyICkgICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmZsaWdodHNJc0NvbXBsZXRlKCBzZXFOdW1iZXIgKSAgICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmVtZXJnZW5jeUlzQ29tcGxldGUoIHNlcU51bWJlciApICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFjY291bnRJc0NvbXBsZXRlKCBzZXFOdW1iZXIgKSAgICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmNvbnRyYWN0SXNDb21wbGV0ZSggc2VxTnVtYmVyICk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAkc2NvcGUuc3VtbWFyeUlzQ29tcGxldGUyID0gZnVuY3Rpb24gKCBwYXNzZW5nZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpc0NvbXBsZXRlID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAocGFzc2VuZ2VyLnNlcU51bWJlciA9PT0gXCIxXCIgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpc0NvbXBsZXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXNDb21wbGV0ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuIiwiXG5cbi8qKlxuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgb2xjaS5kaXJlY3RpdmVzLmZpZWxkUmVxdWlyZWRWYWxpZGF0aW9uXG4gKiBAZGVzY3JpcHRpb24gQWRkcyBhbiBhbGVydCBmb3IgcmVxdWlyZWQgZmllbGQgdmFsaWRhdGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29sY2kuZGlyZWN0aXZlcy5maWVsZFJlcXVpcmVkVmFsaWRhdGlvbicsIFtdKVxuXG4gICAgLmRpcmVjdGl2ZSgnZmllbGRSZXF1aXJlZFZhbGlkYXRpb24nLCBmdW5jdGlvbiBmYWN0b3J5KCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgICAgIHJlcGxhY2U6IGZhbHNlLFxuICAgICAgICAgICAgcmVxdWlyZTogXCJeZm9ybVwiLFxuICAgICAgICAgICAgLy8gc2NvcGU6IHtcbiAgICAgICAgICAgIC8vICAgICBjb3B5OiAnQGJ1dHRvbkdyZWVuQ29weScsXG4gICAgICAgICAgICAvLyAgICAgbGFiZWw6ICdAYnV0dG9uR3JlZW5MYWJlbCdcbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICAvLyB0ZW1wbGF0ZVVybDogJ2RpcmVjdGl2ZXMvZmllbGRSZXF1aXJlZFZhbGlkYXRpb24vZmllbGRSZXF1aXJlZFZhbGlkYXRpb24udHBsLmh0bWwnLFxuICAgICAgICAgICAgXG4gICAgICAgICAgICBsaW5rOiBmdW5jdGlvbiggc2NvcGUsIGVsLCBhdHRycywgZm9ybUN0cmwgKSB7XG4gICAgICAgICAgICAgICAgLy8gZmluZCB0aGUgdGV4dCBib3ggZWxlbWVudCwgd2hpY2ggaGFzIHRoZSAnbmFtZScgYXR0cmlidXRlXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0RWwgICA9IGVsWzBdLnF1ZXJ5U2VsZWN0b3IoXCJbbmFtZV1cIik7XG4gICAgICAgICAgICAgICAgLy8gY29udmVydCB0aGUgbmF0aXZlIHRleHQgYm94IGVsZW1lbnQgdG8gYW4gYW5ndWxhciBlbGVtZW50XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0TmdFbCA9IGFuZ3VsYXIuZWxlbWVudChpbnB1dEVsKTtcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIG5hbWUgb24gdGhlIHRleHQgYm94IHNvIHdlIGtub3cgdGhlIHByb3BlcnR5IHRvIGNoZWNrXG4gICAgICAgICAgICAgICAgLy8gb24gdGhlIGZvcm0gY29udHJvbGxlclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dE5hbWUgPSBpbnB1dE5nRWwuYXR0cignbmFtZScpO1xuXG4gICAgICAgICAgICAgICAgLy8gb25seSBhcHBseSB0aGUgaGFzLWVycm9yIGNsYXNzIGFmdGVyIHRoZSB1c2VyIGxlYXZlcyB0aGUgdGV4dCBib3hcbiAgICAgICAgICAgICAgICBpbnB1dE5nRWwuYmluZCgnYmx1cicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRpcihmb3JtQ3RybCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGlyKGZvcm1DdHJsW2lucHV0TmFtZV0uJGVycm9yKTtcbiAgICAgICAgICAgICAgICAgIGVsLnRvZ2dsZUNsYXNzKCdoYXMtcmVxdWlyZWQtZXJyb3InLCBmb3JtQ3RybFtpbnB1dE5hbWVdLiRlcnJvci5yZXF1aXJlZCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG4iLCJcblxuLyoqXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBvbGNpLmRpcmVjdGl2ZXMuZmllbGRWYWxpZGF0aW9uXG4gKiBAZGVzY3JpcHRpb24gQWRkcyBzb21lIGFsZXJ0cyBmb3IgZmllbGQgdmFsaWRhdGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29sY2kuZGlyZWN0aXZlcy5maWVsZFZhbGlkYXRpb24nLCBbXSlcblxuICAgIC5kaXJlY3RpdmUoJ2ZpZWxkVmFsaWRhdGlvbicsIGZ1bmN0aW9uIGZhY3RvcnkoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgcmVwbGFjZTogZmFsc2UsXG4gICAgICAgICAgICAvLyBzY29wZToge1xuICAgICAgICAgICAgLy8gICAgIGNvcHk6ICdAYnV0dG9uR3JlZW5Db3B5JyxcbiAgICAgICAgICAgIC8vICAgICBsYWJlbDogJ0BidXR0b25HcmVlbkxhYmVsJ1xuICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9maWVsZFZhbGlkYXRpb24vZmllbGRWYWxpZGF0aW9uLnRwbC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCAkc2NvcGUsICRzdGF0ZSApIHtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcbiIsIi8qXG4gKiBoYWxIZWFkZXIuanNcbiAqXG4gKiBDcmVhdGVkOiBNb25kYXksIEZlYnJ1YXJ5IDAzLCAyMDE0XG4gKiAoYykgQ29weXJpZ2h0IDIwMTQgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuLyoqXG4gKiBAbmFtZSBvbGNpLmRpcmVjdGl2ZXMuaGFsSGVhZGVyXG4gKiBAZGVzY3JpcHRpb24gVGhpcyBtb2R1bGUgcG9wdWxhdGVzIHRoZSBoZWFkZXIsIHdoaWNoIG1heSBvciBtYXkgbm90IGluY2x1ZGUgdGhlIHBuYXYuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvbGNpLmRpcmVjdGl2ZXMuaGFsSGVhZGVyJywgW1xuICAgICduZ1N0b3JhZ2UnLFxuICAgICduZ0Nvb2tpZXMnLFxuICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nXG5dKVxuXG4vKipcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIG9sY2kuZGlyZWN0aXZlcy5oYWxIZWFkZXJcbiAqIEByZXN0cmljdCBBXG4gKiBAZWxlbWVudCBBTllcbiAqIEBkZXNjcmlwdGlvbiBBbiBlbXB0eSBkaXJlY3RpdmUgZGVzY3JpcHRpb24uIFBsZWFzZSBmaWxsIGluIGEgaGlnaCBsZXZlbCBkZXNjcmlwdGlvbiBvZiB0aGlzXG4gKiAgICAgZGlyZWN0aXZlLlxuICogQGV4YW1wbGVcbiAqXG4gPHByZT5cbiAgICA8ZGl2IGlkPVwiaGFsLWhlYWRlclwiIGhhbC1oZWFkZXIgcHJpbWFyeS1ndWVzdD1cInByaW1hcnlHdWVzdFwiIGxvZ291dD1cImxvZ291dCgpXCI+PC9kaXY+XG4gPC9wcmU+XG4gPGV4YW1wbGU+XG4gICAgIDxmaWxlIG5hbWU9XCJoYWxIZWFkZXIuaHRtbFwiPlxuICAgICAgICBQbGFjZSByZW5kZXJlZCBIVE1MIGhlcmUuXG4gICAgIDwvZmlsZT5cbiA8L2V4YW1wbGU+XG4gKlxuICovXG5cbi5kaXJlY3RpdmUoJ2hhbEhlYWRlcicsIGZ1bmN0aW9uIGZhY3RvcnkoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdkaXJlY3RpdmVzL2hhbEhlYWRlci9oYWxIZWFkZXIudHBsLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgJHNlc3Npb25TdG9yYWdlLCBGaW5kSW1hZ2VTZXJ2aWNlLCBDb25maWd1cmF0aW9uLCAkY29va2llcywgJHEpIHtcblxuICAgICAgICB9XG4gICAgfTtcbn0pOyIsIi8qXG4gKiBpbmZvTGlua3MuanNcbiAqXG4gKiBDcmVhdGVkOiBNb25kYXksIE1heSAwNCwgMjAxNFxuICogKGMpIENvcHlyaWdodCAyMDE1IEhvbGxhbmQgQW1lcmljYSwgSW5jLiAtIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqIFRoaXMgaXMgdW5wdWJsaXNoZWQgcHJvcHJpZXRhcnkgc291cmNlIGNvZGUgb2YgSG9sbGFuZCBBbWVyaWNhLCBJbmMuXG4gKiBUaGUgY29weXJpZ2h0IG5vdGljZSBhYm92ZSBkb2VzIG5vdCBldmlkZW5jZSBhbnkgYWN0dWFsIG9yIGludGVuZGVkXG4gKiBwdWJsaWNhdGlvbiBvZiBzdWNoIHNvdXJjZSBjb2RlLlxuICovXG5cbi8qKlxuICogQG5hbWUgb2xjaS5kaXJlY3RpdmVzLmluZm9MaW5rc1xuICogQGRlc2NyaXB0aW9uIEFuIGVtcHR5IG1vZHVsZSBkZXNjcmlwdGlvbi4gUGxlYXNlIGZpbGwgaW4gYSBoaWdoIGxldmVsIGRlc2NyaXB0aW9uIG9mIHRoaXMgbW9kdWxlLlxuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvbGNpLmRpcmVjdGl2ZXMuaW5mb0xpbmtzJywgW1xuICAgICdwYXNjYWxwcmVjaHQudHJhbnNsYXRlJyxcbiAgICAndmVuZG9yLnN0ZWVsVG9lJyxcbiAgICAnbmdTdG9yYWdlJyxcbiAgICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJ1xuXSlcblxuICAgIC5jb250cm9sbGVyKCdJbmZvTGlua3NDb250cm9sbGVyJywgZnVuY3Rpb24gKCAkaHR0cCwgJHRyYW5zbGF0ZSwgJHNjb3BlLCBzdGVlbFRvZSwgJHNlc3Npb25TdG9yYWdlLCBDb25maWd1cmF0aW9uICkge1xuICAgICAgICAkc2NvcGUucHJlVGFnID0gJ09DRm5kSW5mbyc7XG5cbiAgICAgICAgJGh0dHAuZ2V0KCAnLi9hc3NldHMvaW5mb0xpbmtzLmpzb24nIClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLmluZm9MaW5rcyA9IHJlcy5kYXRhWyBDb25maWd1cmF0aW9uLmNvbXBhbnlDb2RlIF07XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCBzdGF0dXMgKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coIHN0YXR1cyApO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdmFyIGxpbmtUZXh0cyA9IFtdLFxuICAgICAgICAvLyAgICAgbGlua0xpbmtzID0gW10sXG4gICAgICAgIC8vICAgICBsaW5rVGFncyA9IFtdLFxuICAgICAgICAvLyAgICAgc3RyRG90VGV4dCA9ICcudGV4dCcsXG4gICAgICAgIC8vICAgICBzdHJEb3RMaW5rID0gJy5saW5rJyxcbiAgICAgICAgLy8gICAgIHN0ckRvdFRhZyA9ICcudGFnJyxcbiAgICAgICAgLy8gICAgIHN0cjtcblxuICAgICAgICAvLyBmb3IgKHZhciBpPTE7IGkgPD0gMTU7IGkrKykge1xuICAgICAgICAvLyAgICAgc3RyID0gJ2luZm9MaW5rcy5IQUwuaXRlbScgKyAoKGk8MTApPycwJzonJykgKyBpLnRvU3RyaW5nKCk7XG4gICAgICAgIC8vICAgICBsaW5rVGV4dHMucHVzaChzdHIgKyBzdHJEb3RUZXh0KTtcbiAgICAgICAgLy8gICAgIGxpbmtMaW5rcy5wdXNoKHN0ciArIHN0ckRvdExpbmspO1xuICAgICAgICAvLyAgICAgbGlua1RhZ3MucHVzaChzdHIgKyBzdHJEb3RUYWcpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gJHNjb3BlLmluZm9MaW5rcyA9IFtdO1xuICAgICAgICAvLyAkdHJhbnNsYXRlKCBsaW5rVGV4dHMuY29uY2F0KCBsaW5rTGlua3MsIGxpbmtUYWdzICkgKVxuICAgICAgICAvLyAgICAgLnRoZW4oZnVuY3Rpb24obGlua1N0cmluZ3MpIHtcbiAgICAgICAgLy8gICAgICAgICB2YXIgbGlua0tleTtcbiAgICAgICAgLy8gICAgICAgICAvLyBjb2RlIGFzc3VtZXMgdGhhdCBrZXlzIGFyZSBpdGVyYXRlZCB0aHJvdWdoIGluIGFscGhhYmV0aWNhbCBvcmRlciEhXG4gICAgICAgIC8vICAgICAgICAgZm9yICh2YXIga2V5IGluIGxpbmtTdHJpbmdzKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgIC8vIG9ubHkgd29yayBvbiAnLnRleHQnIGtleXMgYW5kIHNraXAgc3RyaW5ncyB0aGF0IGFyZW4ndCBkZWZpbmVkIGluIHRoZSBsb2NhbGVfZW4uanNvblxuICAgICAgICAvLyAgICAgICAgICAgICAvLyBpZiB0aGUgc3RyaW5nIGlzbid0IGZvdW5kIGluIGxvY2FsZV9lbi5qc29uLCB0aGVuIHZhbHVlID0ga2V5XG4gICAgICAgIC8vICAgICAgICAgICAgIGlmIChrZXkuaW5kZXhPZihzdHJEb3RUZXh0KSAhPT0gLTEgJiZcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIGtleSAhPSBsaW5rU3RyaW5nc1trZXldKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBsaW5rS2V5ID0ga2V5LnJlcGxhY2Uoc3RyRG90VGV4dCwgc3RyRG90TGluayk7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAvLyBvbmx5IGNyZWF0ZSBhIGxpbmsgaWYgYm90aCB0ZXh0IGFuZCB1cmwgYXJlIGZvdW5kXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBpZiAobGlua1N0cmluZ3NbbGlua0tleV0pIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaW5mb0xpbmtzLnB1c2goe1xuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBsaW5rU3RyaW5nc1trZXldLFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IGxpbmtTdHJpbmdzW2xpbmtLZXldLFxuICAgICAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICB0YWc6IGxpbmtTdHJpbmdzW3RhZ11cbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIH1cbiAgICAgICAgLy8gICAgICAgICAgICAgfVxuICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAvLyBFbGltaW5hdGVzIHRoZSBsaW5rIGFib3V0IEFsYXNrYSBpZiB0aGUgY3J1aXNlIGlzbid0IGdvaW5nIHRvIEFsYXNrYVxuICAgICAgICAkc2NvcGUuaXNBbGFza2FGaWx0ZXIgPSBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgICAgICB2YXIgaW5jbHVkQWxhc2thID0gc3RlZWxUb2UuZG8oJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0WzBdKS5nZXQoJ0NoZWNrSW5QYXNzZW5nZXIubWt0SW5jbHVkZUFsYXNrYVRvdXInKTtcbiAgICAgICAgICAgIGlmIChpbmNsdWRBbGFza2EpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCFsaW5rLmlzQWxhc2thKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSlcbi8qKlxuICogIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIG9sY2kuZGlyZWN0aXZlcy5pbmZvTGlua3NcbiAqIEByZXN0cmljdCBBXG4gKiBAZWxlbWVudCBBTllcbiAqIEBkZXNjcmlwdGlvbiBBbiBlbXB0eSBkaXJlY3RpdmUgZGVzY3JpcHRpb24uIFBsZWFzZSBmaWxsIGluIGEgaGlnaCBsZXZlbCBkZXNjcmlwdGlvbiBvZiB0aGlzIGRpcmVjdGl2ZS5cbiBAZXhhbXBsZVxuIDxwcmU+XG4gPGRpdiBpZD1cImhhbC1mb290ZXJcIiBpbmZvLWxpbmtzPjwvZGl2PlxuIDwvcHJlPlxuXG4gPGV4YW1wbGU+XG5cbiA8L2V4YW1wbGU+XG4gKi9cbiAgICAuZGlyZWN0aXZlKCdpbmZvTGlua3MnLCBmdW5jdGlvbiBmYWN0b3J5KCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnSW5mb0xpbmtzQ29udHJvbGxlcicsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2RpcmVjdGl2ZXMvaW5mb0xpbmtzL2luZm9MaW5rcy50cGwuaHRtbCdcbiAgICAgICAgfTtcbiAgICB9KTsiLCJcblxuLyoqXG4gKiBAbmdkb2MgZGlyZWN0aXZlXG4gKiBAbmFtZSBvbGNpLmRpcmVjdGl2ZXMuaXRpbmVyYXJ5UGhvdG9cbiAqIEBkZXNjcmlwdGlvbiBEaXJlY3RpdmUgZm9yIGl0aW5lcmFyeSBwaG90byBpbiB0aGUgc2lkZSBiYXIuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvbGNpLmRpcmVjdGl2ZXMuaXRpbmVyYXJ5UGhvdG8nLCBbXSlcblxuICAgIC5kaXJlY3RpdmUoJ2l0aW5lcmFyeVBob3RvJywgZnVuY3Rpb24gZmFjdG9yeSgpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgICAgICByZXBsYWNlOiBmYWxzZSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9pdGluZXJhcnlQaG90by9pdGluZXJhcnlQaG90by50cGwuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc2NvcGUsICRzdGF0ZSwgRmluZEltYWdlU2VydmljZSwgR2V0Q29weVNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAvLyBTZXRzIGltYWdlIHNyYy5cbiAgICAgICAgICAgIFx0RmluZEltYWdlU2VydmljZS5pdGluZXJhcnlJbWFnZSgpLnRoZW4oIGZ1bmN0aW9uIChzcmMpIHtcbiAgICAgICAgICAgIFx0XHQkc2NvcGUuaW1nU3JjID0gc3JjO1xuICAgICAgICAgICAgXHR9KTtcbiAgICAgICAgICAgICAgICAvLyBTZXRzIGNvcHkuXG4gICAgICAgICAgICAgICAgR2V0Q29weVNlcnZpY2UuaXRpbmVyYXJ5Q29weSgpLnRoZW4oIGZ1bmN0aW9uIChjb3B5KSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5jb3B5ID0gY29weTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdvbGNpLmRpcmVjdGl2ZXMubW9kYWxzLmVycm9yTW9kYWwnLCBbXG4gICAgJ3VpLmJvb3RzdHJhcCcsXG4gICAgJ29sY2kuc2VydmljZXMuTW9kYWxTZXJ2aWNlJ1xuXSlcblxuLmRpcmVjdGl2ZSgnZXJyb3JNb2RhbCcsIGZ1bmN0aW9uKE1vZGFsU2VydmljZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKCBzY29wZSwgZWxlbWVudCwgYXR0cnMgKSB7XG4gICAgICAgICAgICBzY29wZS4kb24oJ3NlcnZlci1lcnJvcicsIGZ1bmN0aW9uKCBldmVudCwgYXJncyApIHtcbiAgICAgICAgICAgICAgICBNb2RhbFNlcnZpY2Uub3Blbk1vZGFsKHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdkaXJlY3RpdmVzL21vZGFscy9lcnJvck1vZGFsL2Vycm9yTW9kYWwudHBsLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnZXJyb3JNb2RhbENvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgICAgICB3aW5kb3dDbGFzczogJ2Vycm9yLW1vZGFsJyxcbiAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgICAgICAgICAgICBrZXlib2FyZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yT2JqOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXJncztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufSlcblxuLmNvbnRyb2xsZXIoJ2Vycm9yTW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCBNb2RhbFNlcnZpY2UsIGVycm9yT2JqLCAkd2luZG93KSB7XG4gICAgJHNjb3BlLnN0YXR1cyA9IGVycm9yT2JqLnN0YXR1cztcbiAgICAkc2NvcGUuc3RhdHVzVGV4dCA9IGVycm9yT2JqLnN0YXR1c1RleHQ7XG5cbiAgICAkc2NvcGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgTW9kYWxTZXJ2aWNlLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICB9O1xufSk7XG5cblxuLy8gLy8gVGltZW91dCByZXNwb25zZT9cbi8vIHtcbi8vICAgXCJkYXRhXCI6IG51bGwsXG4vLyAgIFwic3RhdHVzXCI6IDAsXG4vLyAgIFwiY29uZmlnXCI6IHtcbi8vICAgICBcIm1ldGhvZFwiOiBcIkdFVFwiLFxuLy8gICAgIFwidHJhbnNmb3JtUmVxdWVzdFwiOiBbXG4vLyAgICAgICBudWxsXG4vLyAgICAgXSxcbi8vICAgICBcInRyYW5zZm9ybVJlc3BvbnNlXCI6IFtcbi8vICAgICAgIG51bGxcbi8vICAgICBdLFxuLy8gICAgIFwiaGVhZGVyc1wiOiB7XG4vLyAgICAgICBcIkFjY2VwdFwiOiBcImFwcGxpY2F0aW9uL2pzb24sIHRleHQvcGxhaW4sICovKlwiXG4vLyAgICAgfSxcbi8vICAgICBcIndpdGhDcmVkZW50aWFsc1wiOiB0cnVlLFxuLy8gICAgIFwidGltZW91dFwiOiAxNTAwMCxcbi8vICAgICBcImNhY2hlXCI6IHRydWUsXG4vLyAgICAgXCJ1cmxcIjogXCIvc2Vjb25kYXJ5L2FwaS9jaGVja2luL3YxLjAuMC9jb21wYW55Q29kZS9IQUwvY291bnRyeUNvZGUvVVMvYm9va2luZ1wiXG4vLyAgIH0sXG4vLyAgIFwic3RhdHVzVGV4dFwiOiBcIlwiXG4vLyB9XG4iLCJhbmd1bGFyLm1vZHVsZSgnb2xjaS5kaXJlY3RpdmVzLm1vZGFscy5leHBlbnNlQWdyZWVtZW50JywgW1xuICAgICd1aS5ib290c3RyYXAnLFxuICAgICdvbGNpLnNlcnZpY2VzLk1vZGFsU2VydmljZSdcbl0pXG5cbi5kaXJlY3RpdmUoJ2V4cGVuc2VBZ3JlZW1lbnQnLCBmdW5jdGlvbihNb2RhbFNlcnZpY2UpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0FFJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIE1vZGFsU2VydmljZS5vcGVuTW9kYWwoe1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2RpcmVjdGl2ZXMvbW9kYWxzL2V4cGVuc2VBZ3JlZW1lbnQvZXhwZW5zZUFncmVlbWVudC50cGwuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdleHBlbnNlQWdyZWVtZW50Q29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvd0NsYXNzOiAnZXhwZW5zZS1hZ3JlZW1lbnQtbW9kYWwnLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXG4gICAgICAgICAgICAgICAgICAgIGtleWJvYXJkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlLnBlckRpZW1Db3N0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9O1xufSlcblxuLmNvbnRyb2xsZXIoJ2V4cGVuc2VBZ3JlZW1lbnRDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCBNb2RhbFNlcnZpY2UsIGRhdGEpIHtcbiAgICAkc2NvcGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgTW9kYWxTZXJ2aWNlLmNsb3NlTW9kYWwoKTtcbiAgICB9O1xuICAgICRzY29wZS5wZXJEaWVtQ29zdCA9IGRhdGE7XG59KTsiLCIvKlxuICogbG9naW4uanNcbiAqXG4gKiAoYykgQ29weXJpZ2h0IDIwMTQgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoICdvbGNpLmRpcmVjdGl2ZXMubW9kYWxzLmxvZ2luJywgW1xuICAgICd1aS5ib290c3RyYXAnLFxuICAgICdvbGNpLnNlcnZpY2VzLlJvdXRpbmdVdGlsc1NlcnZpY2UnXG5dKVxuXG4vKipcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIG9sY2kuZGlyZWN0aXZlcy5sb2dpblxuICogQHJlc3RyaWN0IEFcbiAqIEBlbGVtZW50IEFOWVxuICogQGRlc2NyaXB0aW9uIGZhbGxiYWNrLXNyYyBkaXJlY3RpdmUgc3VwcGx5aW5nIGFsdGVybmF0aXZlIHNyYyBmb3IgaW1hZ2VzIHRoYXQgZmFpbCB0byBsb2FkXG4gKi9cbiAgICAuZGlyZWN0aXZlKCdsb2dpbk1vZGFsJywgZnVuY3Rpb24gZmFjdG9yeShNb2RhbFNlcnZpY2UpIHsgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgICAgICBzY29wZS5sb2dpbkRhdGEgPSB7fTtcbiAgICAgICAgICAgIGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgTW9kYWxTZXJ2aWNlLm9wZW5Nb2RhbCgge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2RpcmVjdGl2ZXMvbW9kYWxzL2xvZ2luL2xvZ2luLnRwbC5odG1sJyxcbiAgICAgICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0xvZ2luTW9kYWxDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dpbkRhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2NvcGUubG9naW5EYXRhO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTt9KVxuLyoqXG4gKiBAbmdkb2MgY29udHJvbGxlclxuICogQG5hbWUgTG9naW5Nb2RhbENvbnRyb2xsZXJcbiAqL1xuICAgIC5jb250cm9sbGVyKCdMb2dpbk1vZGFsQ29udHJvbGxlcicsIGZ1bmN0aW9uIExvZ2luTW9kYWxDb250cm9sbGVyKCRzY29wZSwgTW9kYWxTZXJ2aWNlLCAkc3RhdGUsIEF1dGhTZXJ2aWNlLCBSb3V0aW5nVXRpbHNTZXJ2aWNlKSB7XG4gICAgICAgICRzY29wZS5wcmVUYWcgPSBcIk9DTG9nTWRsXCI7XG4gICAgICAgIC8vICRzY29wZS5sb2dpbkRhdGEgPSBsb2dpbkRhdGE7XG5cbiAgICAgICAgJHNjb3BlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IFJvdXRpbmdVdGlsc1NlcnZpY2UuZnJvbnRlbmRCYXNlVXJsKCcgJyk7XG4gICAgICAgICAgICBNb2RhbFNlcnZpY2UuY2xvc2VNb2RhbCgpO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnb2xjaS5kaXJlY3RpdmVzLm1vZGFscycsIFtcbiAgICAnb2xjaS5kaXJlY3RpdmVzLm1vZGFscy5hbGVydHMnLFxuICAgICdvbGNpLmRpcmVjdGl2ZXMubW9kYWxzLmxvZ2luJyxcbiAgICAnb2xjaS5kaXJlY3RpdmVzLm1vZGFscy5leHBlbnNlQWdyZWVtZW50J1xuXSk7IiwiYW5ndWxhci5tb2R1bGUoJ29sY2kuZGlyZWN0aXZlcy5tb2RhbHMuYWxlcnRzJywgW1xuICAgICd1aS5ib290c3RyYXAnLFxuICAgICduZ0Nvb2tpZXMnLFxuICAgICduZ1N0b3JhZ2UnLFxuICAgICdvbGNpLnNlcnZpY2VzLk1vZGFsU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuR2V0Q29weVNlcnZpY2UnLFxuICAgICdvbGNpLnNlcnZpY2VzLkRhdGFUcmFuc2Zvcm1TZXJ2aWNlJ1xuXSlcblxuLmRpcmVjdGl2ZSgncGFzc3BvcnRWaXNhTm90aWZpY2F0aW9uJywgZnVuY3Rpb24oIE1vZGFsU2VydmljZSwgJGNvb2tpZXMsICRzZXNzaW9uU3RvcmFnZSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHNjb3BlOiB7IHBhc3NlbmdlcjogJz0nIH0sXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICAgICAgZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoICRjb29raWVzWyRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ib29raW5nTnVtYmVyICsgc2NvcGUucGFzc2VuZ2VyLnNlcU51bWJlciArICd0ZXJtc0NvbmRpdGlvbnNWaXNhRmxhZyddICE9PSAndHJ1ZScgfHwgYXR0cnMucHZuSW5maW5pdGUudG9Mb3dlckNhc2UoKSA9PT0gJ3RydWUnICkge1xuICAgICAgICAgICAgICAgICAgICBNb2RhbFNlcnZpY2Uub3Blbk1vZGFsKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9tb2RhbHMvcGFzc3BvcnRWaXNhTm90aWZpY2F0aW9uL3Bhc3Nwb3J0VmlzYU5vdGlmaWNhdGlvbi50cGwuaHRtbCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAncGFzc3BvcnRWaXNhTm90aWZpY2F0aW9uQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3dDbGFzczogJ3Bhc3Nwb3J0LXZpc2Etbm90aWZpY2F0aW9uLW1vZGFsJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGtleWJvYXJkOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZ3JlZVRvVGVybXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYXR0cnMuYWdyZWVUb1Rlcm1zO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VuZ2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzY29wZS5wYXNzZW5nZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59KVxuXG4uY29udHJvbGxlcigncGFzc3BvcnRWaXNhTm90aWZpY2F0aW9uQ29udHJvbGxlcicsIGZ1bmN0aW9uKCAkc2NvcGUsICRjb29raWVzLCAkc2Vzc2lvblN0b3JhZ2UsIGFncmVlVG9UZXJtcywgcGFzc2VuZ2VyLCBNb2RhbFNlcnZpY2UsIEdldENvcHlTZXJ2aWNlKSB7XG4gICAgJHNjb3BlLmFsZXJ0cyA9IHt9O1xuICAgICRzY29wZS5jb3B5ID0gXCJcIjtcblxuICAgIC8vIENoZWNrIGZvciB2b3lhZ2Ugc3BlY2lmaWMgbm90aWZpY2F0aW9uIGZpcnN0LiAgSWYgbm9uZSwgZ2V0IGRlZmF1bHQgbm90aWZpY2F0aW9uLlxuICAgIGlmICggcGFzc2VuZ2VyLm5vdGlmaWNhdGlvbnNbMF0ubm90aWZpY2F0aW9uICE9PSAnJyApIHtcbiAgICAgICAgcGFzc2VuZ2VyLm5vdGlmaWNhdGlvbnMubWFwKCBmdW5jdGlvbiAobm90aWZpY2F0aW9uKSB7XG4gICAgICAgICAgICAkc2NvcGUuY29weSArPSBub3RpZmljYXRpb24uZGVzY3JpcHRpb247XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgR2V0Q29weVNlcnZpY2UudmlzYU5vdGlmaWNhdGlvbkNvcHkoKS50aGVuKCBmdW5jdGlvbihjb3B5KSB7XG4gICAgICAgICAgICAkc2NvcGUuY29weSA9IGNvcHk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkY29va2llc1skc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uYm9va2luZ051bWJlciArIHBhc3Nlbmdlci5zZXFOdW1iZXIgKyAndGVybXNDb25kaXRpb25zVmlzYUZsYWcnXSA9ICd0cnVlJztcblxuICAgICAgICB2YXIgY3VyckRhdGUgPSBuZXcgRGF0ZSgpO1xuICAgICAgICBwYXNzZW5nZXIuQ2hlY2tJblBhc3Nlbmdlci50ZXJtc0NvbmRpdGlvbnNWaXNhRmxhZyA9IGN1cnJEYXRlLmdldEZ1bGxZZWFyKCkgKyBcIi1cIiArIGN1cnJEYXRlLmdldERheSgpICsgXCItXCIgKyBjdXJyRGF0ZS5nZXRNb250aCgpO1xuXG4gICAgICAgIE1vZGFsU2VydmljZS5jbG9zZU1vZGFsKCk7XG4gICAgfTtcbn0pO1xuIiwiLypcbiAqIHN0YWxlU2Vzc2lvbk1vZGFsLmpzXG4gKlxuICogQ3JlYXRlZDogVGh1cnNkYXksIERlY2VtYmVyIDEyLCAyMDE0XG4gKiAoYykgQ29weXJpZ2h0IDIwMTQgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuXG4vKipcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIG9sY2kuZGlyZWN0aXZlcy5tb2RhbHMuc3RhbGVTZXNzaW9uTW9kYWxcbiAqIEByZXN0cmljdCBBXG4gKiBAZWxlbWVudCBBTllcbiAqIEBkZXNjcmlwdGlvbiBBIG1vZGFsIGRpYWxvZyB0aGF0IGZldGNoZXMgYW5kIGRpc3BsYXlzIFRlcm1zIGFuZCBDb25kaXRpb25zIGFjY29yZGluZyB0byB0aGUgdXNlcidzIGNvdW50cnksXG4gKiBkZXRlcm1pbmVkIHZpYSBpbnNwZWN0aW9uIG9mIHRoZSBmcm9udGVuZCBkYXRhIHBhY2tldC5cbiAqL1xuYW5ndWxhci5tb2R1bGUoICdvbGNpLmRpcmVjdGl2ZXMubW9kYWxzLnN0YWxlU2Vzc2lvbk1vZGFsJywgW1xuICAgICd1aS5ib290c3RyYXAnLFxuICAgIC8vICdvbGNpLnNlcnZpY2VzLkFzc2V0U2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuQXV0aFNlcnZpY2UnLFxuICAgICdvbGNpLnNlcnZpY2VzLk1vZGFsU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuU3RhbGVTZXNzaW9uU2VydmljZSdcbl0pXG5cbiAgICAuZGlyZWN0aXZlKCdzdGFsZVNlc3Npb25Nb2RhbCcsIGZ1bmN0aW9uKE1vZGFsU2VydmljZSkgeyByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgICAgIGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgTW9kYWxTZXJ2aWNlLm9wZW5Nb2RhbCh7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9tb2RhbHMvc3RhbGVTZXNzaW9uTW9kYWwvc3RhbGVTZXNzaW9uTW9kYWwudHBsLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnc3RhbGVTZXNzaW9uTW9kYWxDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Q2xhc3M6ICdzdGFsZS1zZXNzaW9uLW1vZGFsJyxcbiAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgICAgICAgICAgICBrZXlib2FyZDogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTt9KVxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSBvbGNpLmRpcmVjdGl2ZXMubW9kYWxzLnN0YWxlU2Vzc2lvbk1vZGFsI3N0YWxlU2Vzc2lvbk1vZGFsQ29udHJvbGxlclxuICogQG1ldGhvZE9mIG9sY2kuZGlyZWN0aXZlcy5tb2RhbHMuc3RhbGVTZXNzaW9uTW9kYWxcbiAqXG4gKi9cbiAgICAuY29udHJvbGxlcignc3RhbGVTZXNzaW9uTW9kYWxDb250cm9sbGVyJyxcbiAgICBmdW5jdGlvbiBzdGFsZVNlc3Npb25Nb2RhbENvbnRyb2xsZXIoJHdpbmRvdywgJHRpbWVvdXQsICRzdGF0ZSwgJHNjb3BlLCAkY29va2llcywgTW9kYWxTZXJ2aWNlLCBBdXRoU2VydmljZSwgQ29uZmlndXJhdGlvbiwgU3RhbGVTZXNzaW9uU2VydmljZSkge1xuXG4gICAgICAgICRzY29wZS5zZXNzaW9uRXhwaXJlZCA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUuZnJvbnRFbmRVcmwgPSBDb25maWd1cmF0aW9uLmZyb250ZW5kLmJhc2VVcmw7XG4gICAgICAgICRzY29wZS5pc0xvZ2dlZEluID0gZmFsc2U7XG5cbiAgICAgICAgJHNjb3BlLnJlZGlyZWN0TG9nZ2VkT3V0VXNlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCRzY29wZS5pc0xvZ2dlZEluKSB7XG4gICAgICAgICAgICAgICAgJHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gQ29uZmlndXJhdGlvbi5mcm9udGVuZC5iYXNlVXJsO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2ZpbmRCb29raW5nJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmNob29zZUVuZFNlc3Npb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGdldCB0aGlzIGJlZm9yZSBsb2dnaW5nIG91dFxuICAgICAgICAgICAgJHNjb3BlLmlzTG9nZ2VkSW4gPSBBdXRoU2VydmljZS5pc0xvZ2dlZEluKCk7XG4gICAgICAgICAgICBTdGFsZVNlc3Npb25TZXJ2aWNlLmVuZFNlc3Npb24oKVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUudXNlckxvZ2dlZE91dCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZWRpcmVjdExvZ2dlZE91dFVzZXIoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUuY2hvb3NlQ29udGludWVTZXNzaW9uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gU3RhbGVTZXNzaW9uU2VydmljZS5jb250aW51ZVNlc3Npb24oKVxuICAgICAgICAgICAgICAgIC50aGVuKFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZGFsU2VydmljZS5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5zZXNzaW9uRXhwaXJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dCgkc2NvcGUuY2hvb3NlRW5kU2Vzc2lvbiw2MDAwKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgIH07XG5cbiAgICB9KTtcbiIsIlxuXG4vKipcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIG9sY2kuZGlyZWN0aXZlcy5vbGNpQWNjb3JkaW9uXG4gKiBAZGVzY3JpcHRpb24gRGlyZWN0aXZlIGd1ZXN0IGFjY29yZGlvbi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29sY2kuZGlyZWN0aXZlcy5vbGNpQWNjb3JkaW9uJywgW1xuICAgICAgICAnb2xjaS5zZXJ2aWNlcy5DaGFuZ2VQYWdlU2VydmljZScsXG4gICAgICAgICdvbGNpLnNlcnZpY2VzLkxveWFsdHlTZXJ2aWNlJyxcbiAgICAgICAgJ3ZlbmRvci5zdGVlbFRvZSdcbiAgICBdKVxuXG4gICAgLmRpcmVjdGl2ZSgnb2xjaUFjY29yZGlvbicsIGZ1bmN0aW9uIGZhY3RvcnkoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICAgICAgdHJhbnNjbHVkZTogdHJ1ZSxcbiAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9vbGNpQWNjb3JkaW9uL29sY2lBY2NvcmRpb24udHBsLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oICRzY29wZSwgJHN0YXRlLCBDaGFuZ2VQYWdlU2VydmljZSApIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuID0gW107XG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlblsgMCBdID0gdHJ1ZTsgIC8vIFRPRE86IFVzZSBmdW5jdGlvbiBmcm9tIGNoZWNraW5Qcm9ncmVzcy5qc1xuXG4gICAgICAgICAgICAgICAgJHNjb3BlLmlzQ29tcGxldGUgPSBmdW5jdGlvbiAocGFnZSwgc2VxTnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXN1bHQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoKHBhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2RldGFpbHMnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICRzY29wZS5kZXRhaWxzSXNDb21wbGV0ZSggc2VxTnVtYmVyICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdwYXNzcG9ydCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gJHNjb3BlLnBhc3Nwb3J0SXNDb21wbGV0ZSggc2VxTnVtYmVyICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdmbGlnaHRzJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAkc2NvcGUuZmxpZ2h0c0lzQ29tcGxldGUoIHNlcU51bWJlciApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZW1lcmdlbmN5JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAkc2NvcGUuZW1lcmdlbmN5SXNDb21wbGV0ZSggc2VxTnVtYmVyICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdhY2NvdW50JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAkc2NvcGUuYWNjb3VudElzQ29tcGxldGUoIHNlcU51bWJlciApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncHJlZmVyZW5jZXMnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9ICRzY29wZS5wcmVmZXJlbmNlc0lzQ29tcGxldGUoIHNlcU51bWJlciApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5wcmV2R3Vlc3QgPSBmdW5jdGlvbiAoIGluZGV4ICkge1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuaXNPcGVuLmZvckVhY2goIGZ1bmN0aW9uIChvYmosIGluZGV4LCBhcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFycltpbmRleF0gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW5bcGFyc2VJbnQoIGluZGV4ICkgLSAxIF0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgJHNjb3BlLm5leHRHdWVzdCA9IGZ1bmN0aW9uICggaW5kZXggKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5pc09wZW4uZm9yRWFjaCggZnVuY3Rpb24gKG9iaiwgaW5kZXgsIGFycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJyW2luZGV4XSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmlzT3BlbltwYXJzZUludCggaW5kZXggKSArIDEgXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0b3AgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdndWVzdC1hY2NvcmRpb24taGVhZGVyJylbaW5kZXhdLm9mZnNldFRvcDsgLy9HZXR0aW5nIFkgb2YgdGFyZ2V0IGVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIHRvcCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICRzY29wZS5jb250aW51ZSA9IGZ1bmN0aW9uIChjYWxsZmlyc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGZpcnN0KCkudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBDaGFuZ2VQYWdlU2VydmljZS5uZXh0UGFnZSgpO1xuICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyLCBjdHJsLCB0cmFuc2NsdWRlKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUucGFnZSA9IGF0dHIub2xjaUFjY29yZGlvblBhZ2U7XG5cbiAgICAgICAgICAgICAgICAvLyBodHRwOi8vYW5ndWxhci10aXBzLmNvbS9ibG9nLzIwMTQvMDMvdHJhbnNjbHVzaW9uLWFuZC1zY29wZXMvXG4gICAgICAgICAgICAgICAgLy8gdHJhbnNjbHVkZShzY29wZSwgZnVuY3Rpb24oY2xvbmUsIHNjb3BlKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIGVsZW1lbnQuYXBwZW5kKGNsb25lKTtcbiAgICAgICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KVxuXG4gICAgLmRpcmVjdGl2ZSgncGFzc2VuZ2VyVHJhbnNjbHVkZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmVzdHJpY3Q6IFwiQVwiLFxuICAgICAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtLCBhdHRycywgY3RybCwgJHRyYW5zY2x1ZGUpIHtcbiAgICAgICAgICAgICAgICAvLyBDcmVhdGUgYSBuZXcgc2NvcGUgdGhhdCBpbmhlcml0cyBmcm9tIHRoZSBwYXJlbnQgb2YgdGhlXG4gICAgICAgICAgICAgICAgLy8gc2VhcmNoIGRpcmVjdGl2ZSAoJHBhcmVudC4kcGFyZW50KSBzbyB0aGF0IHJlc3VsdCBjYW4gYmUgdXNlZCB3aXRoIG90aGVyXG4gICAgICAgICAgICAgICAgLy8gaXRlbXMgd2l0aGluIHRoYXQgc2NvcGUgKGUuZy4gc2VsZWN0UmVzdWx0KVxuICAgICAgICAgICAgICAgIHZhciBuZXdTY29wZSA9IHNjb3BlLiRwYXJlbnQuJG5ldygpO1xuICAgICAgICAgICAgICAgIC8vIFB1dCByZXN1bHQgZnJvbSBpc29sYXRlIHRvIGJlIGF2YWlsYWJsZSB0byB0cmFuc2NsdWRlZCBjb250ZW50XG4gICAgICAgICAgICAgICAgLy8gbmV3U2NvcGUucGFzc2VuZ2VyID0gc2NvcGUuJGV2YWwoYXR0cnMucGFzc2VuZ2VyKTtcbiAgICAgICAgICAgICAgICAkdHJhbnNjbHVkZShuZXdTY29wZSwgZnVuY3Rpb24gKGNsb25lKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYXBwZW5kKGNsb25lKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdvbGNpLmRpcmVjdGl2ZXMucGFnZVRpdGxlJywgW10pXG4gICAgLmRpcmVjdGl2ZSgndGl0bGUnLCBmdW5jdGlvbigkdHJhbnNsYXRlKSB7XG4gICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgICAgcmVwbGFjZTogZmFsc2UsXG4gICAgICAgICAgIGxpbms6IGZ1bmN0aW9uIChzY29wZSwgZWxlbSwgYXR0cnMpIHtcbiAgICAgICAgICAgICAgIHNjb3BlLiR3YXRjaCgncGFnZVRpdGxlJywgZnVuY3Rpb24gKG5ld3ZhbCkge1xuICAgICAgICAgICAgICAgICAgICR0cmFuc2xhdGUoJ3BhZ2VUaXRsZVRlbXBsYXRlJywge3BhZ2VUaXRsZSA6IG5ld3ZhbH0pXG4gICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHBhZ2VUaXRsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5odG1sKHBhZ2VUaXRsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICBlbGVtLmh0bWwoc2NvcGUucGFnZVRpdGxlKTtcbiAgICAgICAgICAgfVxuICAgICAgIH07XG4gICAgfSk7IiwiXG5cbi8qKlxuICogQG5nZG9jIGRpcmVjdGl2ZVxuICogQG5hbWUgb2xjaS5kaXJlY3RpdmVzLmJ1dHRvbkdyZWVuXG4gKiBAZGVzY3JpcHRpb24gRGlyZWN0aXZlIGZvciB0dXJuaW5nIGlucHV0IHdpdGggdHlwZWFoZWFkIGludG8gYSBkcm9wZG93bi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29sY2kuZGlyZWN0aXZlcy50eXBlYWhlYWREcm9wZG93bicsIFsndWkuYm9vdHN0cmFwJ10pXG5cbiAgICAuZGlyZWN0aXZlKCd0eXBlYWhlYWREcm9wZG93bicsIGZ1bmN0aW9uIGZhY3RvcnkoICRwYXJzZSwgJHRpbWVvdXQgKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgICAgICAgICBzY29wZTogdHJ1ZSxcbiAgICAgICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbCwgYXR0cnMsIG5nTW9kZWwpIHtcbiAgICAgICAgICAgICAgICAvLyBTVEFSVCBNb2RpZmllZCBmcm9tIDogaHR0cHM6Ly9naXRodWIuY29tL2FuZ3VsYXItdWkvYm9vdHN0cmFwL2Jsb2IvbWFzdGVyL3NyYy90eXBlYWhlYWQvdHlwZWFoZWFkLmpzXG4gICAgICAgICAgICAgICAgdmFyIFRZUEVBSEVBRF9SRUdFWFAgPSAvXlxccyooW1xcc1xcU10rPykoPzpcXHMrYXNcXHMrKFtcXHNcXFNdKz8pKT9cXHMrZm9yXFxzKyg/OihbXFwkXFx3XVtcXCRcXHdcXGRdKikpXFxzK2luXFxzKyhbXFxzXFxTXSs/KSQvO1xuXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gcGFyc2UoIGlucHV0ICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2ggPSBpbnB1dC5tYXRjaChUWVBFQUhFQURfUkVHRVhQKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdFeHBlY3RlZCB0eXBlYWhlYWQgc3BlY2lmaWNhdGlvbiBpbiBmb3JtIG9mIFwiX21vZGVsVmFsdWVfIChhcyBfbGFiZWxfKT8gZm9yIF9pdGVtXyBpbiBfY29sbGVjdGlvbl9cIicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgYnV0IGdvdCBcIicgKyBpbnB1dCArICdcIi4nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtTmFtZSAgICA6IG1hdGNoWzNdLFxuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlICAgICAgOiAkcGFyc2UobWF0Y2hbNF0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmlld01hcHBlciAgOiAkcGFyc2UobWF0Y2hbMl0gfHwgbWF0Y2hbMV0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kZWxNYXBwZXIgOiAkcGFyc2UobWF0Y2hbMV0pXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEV4cHJlc3Npb25zIHVzZWQgYnkgdHlwZWFoZWFkXG4gICAgICAgICAgICAgICAgdmFyIHBhcnNlclJlc3VsdCA9IHBhcnNlKGF0dHJzLnR5cGVhaGVhZCk7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB0aGlzO1xuXG4gICAgICAgICAgICAgICAgLy8gRU5EIE1vZGlmaWVkIGZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyLXVpL2Jvb3RzdHJhcC9ibG9iL21hc3Rlci9zcmMvdHlwZWFoZWFkL3R5cGVhaGVhZC5qc1xuXG4gICAgICAgICAgICAgICAgLy8gTW9kaWZpZWQgZnJvbTogaHR0cDovL3BsbmtyLmNvL2VkaXQvWnR1b1RWZ1BMdU1XRFQyZWpVTFc/cD1wcmV2aWV3XG4gICAgICAgICAgICAgICAgbmdNb2RlbC4kcGFyc2Vycy5wdXNoKCBmdW5jdGlvbiAoaW5wdXRWYWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoICFwYXJzZXJSZXN1bHQuc291cmNlKHNjb3BlLCB7JHZpZXdWYWx1ZTogaW5wdXRWYWx1ZX0pLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5nTW9kZWwuJHNldFZhbGlkaXR5KCd0eXBlYWhlYWQnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuZ01vZGVsLiRzZXRWYWxpZGl0eSgndHlwZWFoZWFkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIC8vIERvbid0IHB1dCBlbXB0eSBzcGFjZSB0byBtb2RlbFxuICAgICAgICAgICAgICAgICAgICBpZiggaW5wdXRWYWx1ZSA9PT0gJyAnICl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlucHV0VmFsdWU7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBlbC5iaW5kKCAnZm9jdXMnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdmlld1ZhbHVlID0gbmdNb2RlbC4kdmlld1ZhbHVlO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc3RvcmUgdG8gbnVsbCB2YWx1ZSBzbyB0aGF0IHRoZSB0eXBlYWhlYWQgY2FuIGRldGVjdCBhIGNoYW5nZVxuICAgICAgICAgICAgICAgICAgICBpZiAodmlld1ZhbHVlID09PSAnICcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZSgnJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBGb3JjZSB0cmlnZ2VyIHRoZSBwb3B1cFxuICAgICAgICAgICAgICAgICAgICBuZ01vZGVsLiRzZXRWaWV3VmFsdWUoJyAnKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIGFjdHVhbCB2YWx1ZSBpbiBjYXNlIHRoZXJlIHdhcyBhbHJlYWR5IGEgdmFsdWUgaW4gdGhlIGlucHV0XG4gICAgICAgICAgICAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZSggdmlld1ZhbHVlIHx8ICcgJyApO1xuICAgICAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgICAgICBlbC5iaW5kKCAnYmx1cicsIGZ1bmN0aW9uIChlKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKG5nTW9kZWwuJHZpZXdWYWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwYXJzZXJSZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbWF0Y2hBcnJheSA9IHBhcnNlclJlc3VsdC5zb3VyY2Uoc2NvcGUsIHskdmlld1ZhbHVlOiBuZ01vZGVsLiR2aWV3VmFsdWV9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYXRjaCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaEFycmF5LmZvckVhY2goIGZ1bmN0aW9uICggaXRlbSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGl0ZW0ubGFiZWwgPT09IG5nTW9kZWwuJHZpZXdWYWx1ZSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBtYXRjaCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZ01vZGVsLiRzZXRWYWxpZGl0eSgndHlwZWFoZWFkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoICFlLnJlbGF0ZWRUYXJnZXQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5nTW9kZWwuJHNldFZhbGlkaXR5KCd0eXBlYWhlYWQnLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5nTW9kZWwuJG1vZGVsVmFsdWUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIC8vIE1heWJlIGluICRmb3JtYXR0ZXJzPyAtIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTcwMTEyODgvYW5ndWxhcmpzLWluaXRpYWwtZm9ybS12YWxpZGF0aW9uLXdpdGgtZGlyZWN0aXZlc1xuICAgICAgICAgICAgICAgIC8vIGVsLmJpbmQoICdibHVyJywgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgaWYgKCAhcGFyc2VyUmVzdWx0LnNvdXJjZShzY29wZSwgeyR2aWV3VmFsdWU6IG5nTW9kZWwuJHZpZXdWYWx1ZX0pLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIG5nTW9kZWwuJHNldFZpZXdWYWx1ZSggJycgKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgIC8vIH0pO1xuXG5cbiAgICAgICAgICAgICAgICBzY29wZS5vblNlbGVjdCA9IGZ1bmN0aW9uKCBpdGVtICkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnc2VsZWN0Jyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIG5nTW9kZWwuJHZpZXdWYWx1ZSA9IGl0ZW0ubGFiZWwgO1xuICAgICAgICAgICAgICAgICAgICAvLyBuZ01vZGVsLiRzZXRWYWxpZGl0eSgndHlwZWFoZWFkJywgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIGVsWzBdLmZvY3VzKCk7ICAvLyBGb3Igc29tZSByZWFzb24gYmx1ciBpc24ndCB3b3JraW5nLCBidXQgZm9jdXMgZ2V0cyB1cyB0aGUgZXhwZWN0ZWQgYmVoYXZpb3VyLlxuICAgICAgICAgICAgICAgIH07XG5cblxuICAgICAgICAgICAgICAgIC8vIEZpbHRlciB0byByZXR1cm4gYWxsIGl0ZW1zIGlmIGlucHV0IGlzIGJsYW5rLlxuICAgICAgICAgICAgICAgIHNjb3BlLmVtcHR5T3JNYXRjaCA9IGZ1bmN0aW9uKCBhY3R1YWwsIGlucHV0ICkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaW5wdXQgPT09ICcgJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gdmFyIG1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbGxlY3Rpb24uZm9yRWFjaCggZnVuY3Rpb24gKCBpdGVtICkge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKCBpdGVtLmxhYmVsID09PSBuZ01vZGVsLiR2aWV3VmFsdWUgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgbWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gbmdNb2RlbC4kc2V0VmFsaWRpdHkoJ3R5cGVhaGVhZCcsIG1hdGNoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFjdHVhbC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoIGlucHV0LnRvTG93ZXJDYXNlKCkgKSA+IC0xO1xuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBzY29wZS5zdGFydHNXaXRoID0gZnVuY3Rpb24oIGFjdHVhbCwgaW5wdXQgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhY3R1YWwuc3Vic3RyKDAsIGlucHV0Lmxlbmd0aCkudG9VcHBlckNhc2UoKSA9PT0gaW5wdXQudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuIiwiLypcbiAqIEFuYWx5dGljc1NlcnZpY2UuanNcbiAqXG4gKiBDcmVhdGVkOiBUdWVzZGF5LCBGZWJydWFyeSAzLCAyMDE1XG4gKiAoYykgQ29weXJpZ2h0IDIwMTUgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBQZXJmb3JtcyBhbmFseXRpY3MgdGFza3NcbiAqIEByZXF1aXJlcyByZXN0YW5ndWxhclxuICogQHJlcXVpcmVzIG9sY2kuc2VydmljZXMuQXV0aFNlcnZpY2UgKG9wdD8pXG4gKiBAcmVxdWlyZXMgb2xjaS5zZXJ2aWNlcy5Sb3V0aW5nVXRpbHNTZXJ2aWNlIChvcHQ/KVxuICogQHJlcXVpcmVzIG9sY2kuZmlsdGVycy5Qb3J0TmFtZUZpbHRlciAob3B0PylcbiAqL1xuXG5hbmd1bGFyLm1vZHVsZSggJ29sY2kuc2VydmljZXMuQW5hbHl0aWNzU2VydmljZScsIFtdKVxuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBVc2VkIGZvciBUZWFsZWFmIGFuZCBXZWJUcmVuZHMgZXZlbnRzLCBhbW9uZyBvdGhlcnMuXG4gKi9cbi5zZXJ2aWNlKCdBbmFseXRpY3NTZXJ2aWNlJywgWyAnJHdpbmRvdycsICckZG9jdW1lbnQnLCAnJGluamVjdG9yJywgZnVuY3Rpb24oJHdpbmRvdywgJGRvY3VtZW50LCAkaW5qZWN0b3IpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG5nZG9jIGdldEJyb3dzZXJEYXRhXG4gICAgICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2UjZ2V0QnJvd3NlckRhdGFcbiAgICAgICAgICAgICAqIEBtZXRob2RPZiBvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2VcbiAgICAgICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IFVzZWZ1bCBicm93c2VyIGluZm9ybWF0aW9uLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBnZXRCcm93c2VyRGF0YTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgbmF2aWdhdG9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwbGF0Zm9ybTogJHdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0sXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9kdWN0OiAkd2luZG93Lm5hdmlnYXRvci5wcm9kdWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZHVjdFN1YjogJHdpbmRvdy5uYXZpZ2F0b3IucHJvZHVjdFN1YixcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlbmRvcjogJHdpbmRvdy5uYXZpZ2F0b3IudmVuZG9yXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbmdkb2MgbG9nU3RhdGVDaGFuZ2VcbiAgICAgICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuQW5hbHl0aWNzU2VydmljZSNsb2dTdGF0ZUNoYW5nZVxuICAgICAgICAgICAgICogQG1ldGhvZE9mIG9sY2kuc2VydmljZXMuQW5hbHl0aWNzU2VydmljZVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIExvZ3MgYSBzdGF0ZSBjaGFuZ2UgZXZlbnQgdG8gdGhlIGFuYWx5dGljcyBwcm92aWRlcnNcbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0b1N0YXRlIFRoZSB0b1N0YXRlIGZyb20gdGhlIHN0YXRlQ2hhbmdlU3VjY2VzcyBtZXRob2RcbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0b1BhcmFtcyBUaGUgdG9QYXJhbW1zIGZyb20gdGhlIHN0YXRlQ2hhbmdlU3VjY2VzcyBtZXRob2RcbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBmcm9tU3RhdGUgVGhlIGZyb21TdGF0ZSBmcm9tIHRoZSBzdGF0ZUNoYW5nZVN1Y2Nlc3MgbWV0aG9kXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZnJvbVBhcmFtcyBUaGUgZnJvbVBhcmFtcyBmcm9tIHRoZSBzdGF0ZUNoYW5nZVN1Y2Nlc3MgbWV0aG9kXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZ1N0YXRlQ2hhbmdlOiBmdW5jdGlvbih0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZmVycmVyOiAkZG9jdW1lbnQucmVmZXJyZXIgfHwgXCJcIixcbiAgICAgICAgICAgICAgICAgICAgdG9TdGF0ZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdG9TdGF0ZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB0b1N0YXRlLnVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bGxVcmw6ICR3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczogZnJvbVBhcmFtc1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBmcm9tU3RhdGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IGZyb21TdGF0ZS5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBmcm9tU3RhdGUudXJsLFxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1zOiBmcm9tUGFyYW1zXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgc2VsZi5sb2dDdXN0b21FdmVudCgncGFnZVZpZXc6ICcrdG9TdGF0ZS5uYW1lLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG5nZG9jIGxvZ1N0YXRlQ2hhbmdlRXJyb3JcbiAgICAgICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuQW5hbHl0aWNzU2VydmljZSNsb2dTdGF0ZUNoYW5nZUVycm9yXG4gICAgICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5BbmFseXRpY3NTZXJ2aWNlXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24gTG9ncyBhIHN0YXRlIGNoYW5nZSBlcnJvciBldmVudCB0byB0aGUgYW5hbHl0aWNzIHByb3ZpZGVyc1xuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IHRvU3RhdGUgVGhlIHRvU3RhdGUgZnJvbSB0aGUgc3RhdGVDaGFuZ2VFcnJvciBtZXRob2RcbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0b1BhcmFtcyBUaGUgdG9QYXJhbW1zIGZyb20gdGhlIHN0YXRlQ2hhbmdlRXJyb3IgbWV0aG9kXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZnJvbVN0YXRlIFRoZSBmcm9tU3RhdGUgZnJvbSB0aGUgc3RhdGVDaGFuZ2VFcnJvciBtZXRob2RcbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBmcm9tUGFyYW1zIFRoZSBmcm9tUGFyYW1zIGZyb20gdGhlIHN0YXRlQ2hhbmdlRXJyb3IgbWV0aG9kXG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZXJyb3IgVGhlIGVycm9yIGZyb20gdGhlIHN0YXRlQ2hhbmdlRXJyb3IgbWV0aG9kXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZ1N0YXRlQ2hhbmdlRXJyb3I6IGZ1bmN0aW9uKHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMsIGVycm9yKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZmVycmVyOiAkZG9jdW1lbnQucmVmZXJyZXIsXG4gICAgICAgICAgICAgICAgICAgIHRvU3RhdGU6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRvU3RhdGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogdG9TdGF0ZS51cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICBmdWxsVXJsOiAkd2luZG93LmxvY2F0aW9uLmhyZWYsXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJhbXM6IGZyb21QYXJhbXNcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZnJvbVN0YXRlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBmcm9tU3RhdGUubmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogZnJvbVN0YXRlLnVybCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmFtczogZnJvbVBhcmFtc1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZXJyb3JcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgc2VsZi5sb2dDdXN0b21FdmVudCgncGFnZVZpZXcgRXJyb3I6ICcrdG9TdGF0ZS5uYW1lLCBkYXRhKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG5nZG9jIGxvZ0N1c3RvbUV2ZW50XG4gICAgICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2UjbG9nQ3VzdG9tRXZlbnRcbiAgICAgICAgICAgICAqIEBtZXRob2RPZiBvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2VcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiBMb2dzIGEgY3VzdG9tIGV2ZW50IHRvIHRoZSBhbmFseXRpY3MgcHJvdmlkZXJzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lIEFuIGV2ZW50IG5hbWUgdG8gaWRlbnRpZnkgdGhlIGV2ZW50XG4gICAgICAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZGF0YSBBbnkgSlNPTiBzZXJpYWxpemFibGUgZGF0YSBvYmplY3QgdG8gYmUgbG9nZ2VkIGJ5IHRoZSBhbmFseXRpY3Mgc29mdHdhcmVcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9nQ3VzdG9tRXZlbnQ6IGZ1bmN0aW9uKGV2ZW50TmFtZSwgZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmKCFkYXRhKSB7IGRhdGE9e307IH1cbiAgICAgICAgICAgICAgICAvLyBhbmd1bGFyLmV4dGVuZChkYXRhLCBzZWxmLmdldEJyb3dzZXJEYXRhKCkpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmKCR3aW5kb3cuVExUICYmICR3aW5kb3cuVExULmlzSW5pdGlhbGl6ZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAkd2luZG93LlRMVC5sb2dDdXN0b21FdmVudChldmVudE5hbWUsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRhdGEuZXZlbnROYW1lID0gZXZlbnROYW1lO1xuXG4gICAgICAgICAgICAgICAgaWYoJHdpbmRvdy5lbnNETCkge1xuICAgICAgICAgICAgICAgICAgICAkd2luZG93LmVuc0RMKGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGxvZ1NjcmVlbnZpZXdMb2FkOiBmdW5jdGlvbih2aWV3TmFtZSwgYWx0SW5mbykge1xuICAgICAgICAgICAgICAgIGlmKCR3aW5kb3cuVExUICYmICR3aW5kb3cuVExULmlzSW5pdGlhbGl6ZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAkd2luZG93LlRMVC5sb2dTY3JlZW52aWV3TG9hZCh2aWV3TmFtZSwgYWx0SW5mbyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYoJHdpbmRvdy5lbnNETCkge1xuICAgICAgICAgICAgICAgICAgICAkd2luZG93LmVuc0RMKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50TmFtZTogJ1NjcmVlblZpZXcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogdmlld05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICByZWZlcnJlcjogYWx0SW5mb1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBuZ2RvYyBsb2dDdXN0b21QYWdlVmlld1xuICAgICAgICAgICAgICogQG5hbWUgYW5hbHl0aWNzLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2UjbG9nQ3VzdG9tUGFnZVZpZXdcbiAgICAgICAgICAgICAqIEBtZXRob2RPZiBhbmFseXRpY3Muc2VydmljZXMuQW5hbHl0aWNzU2VydmljZVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIExvZ3MgYSBjdXN0b20gcGFnZSB2aWV3IHRvIHRoZSBhbmFseXRpY3MgcHJvdmlkZXJzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFnZU5hbWUgVGhlIHBhZ2UgYmVpbmcgdmlld2VkLlxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgQW55IEpTT04gc2VyaWFsaXphYmxlIGRhdGEgb2JqZWN0IHRvIGJlIGxvZ2dlZCBieSB0aGUgYW5hbHl0aWNzIHNvZnR3YXJlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZ0N1c3RvbVBhZ2VWaWV3OiBmdW5jdGlvbihwYWdlTmFtZSwgZGF0YSl7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2dDdXN0b21FdmVudCgnUGFnZVZpZXc6ICcgKyBwYWdlTmFtZSwgZGF0YSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBuZ2RvYyBmbHVzaFxuICAgICAgICAgICAgICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5BbmFseXRpY3NTZXJ2aWNlI2ZsdXNoXG4gICAgICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5BbmFseXRpY3NTZXJ2aWNlXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24gRmx1c2hlcyB0aGUgcXVldWVzIG9mIHRoZSBhbmFseXRpY3MgdG9vbHMsIHNlbmRpbmcgdGhlIGRhdGEgdG8gdGhlIGV4dGVybmFsIHNlcnZpY2VzLlxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBmbHVzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYoJHdpbmRvdy5UTFQpIHsgJHdpbmRvdy5UTFQuZmx1c2hBbGwoKTsgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbmdkb2MgX2NsZWFuTG9nSW5mb1xuICAgICAgICAgICAgICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5BbmFseXRpY3NTZXJ2aWNlI19jbGVhbkxvZ0luZm9cbiAgICAgICAgICAgICAqIEBtZXRob2RPZiBvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2VcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiBQcml2YXRlIGZ1bmN0aW9uIHRoYXQgcmVtb3ZlcyBjZXJ0YWluIHByaXZhdGUgdmFyaWFibGVzIGFuZCBkYXRhIHRoYXQgc2hvdWxkIG5vdCBiZSBsb2dnZWQuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIF9jbGVhbkxvZ0luZm86IGZ1bmN0aW9uKHJlcXVlc3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgbG9nSW5mbyA9IGFuZ3VsYXIuY29weShyZXF1ZXN0LCB7fSk7XG4gICAgICAgICAgICAgICAgdmFyIGF1dGhlbnRpY2F0aW9uUmVxdWVzdE1hdGNoZXIgPSBuZXcgUmVnRXhwKC9vbGNpXFwvYXBpXFwvYXV0aGVudGljYXRpb24vKTtcblxuICAgICAgICAgICAgICAgIC8vZGVsZXRlIHNvbWUgYW5ndWxhci1zcGVjaWZpYyBtZXRob2RzXG4gICAgICAgICAgICAgICAgaWYobG9nSW5mby50cmFuc2Zvcm1SZXF1ZXN0KSB7IGRlbGV0ZSBsb2dJbmZvLnRyYW5zZm9ybVJlcXVlc3Q7IH1cbiAgICAgICAgICAgICAgICBpZihsb2dJbmZvLnRyYW5zZm9ybVJlc3BvbnNlKSB7IGRlbGV0ZSBsb2dJbmZvLnRyYW5zZm9ybVJlc3BvbnNlOyB9XG5cbiAgICAgICAgICAgICAgICBpZihsb2dJbmZvLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy93ZSBkb24ndCBsb2cgY3JlZGl0IGNhcmQgbnVtYmVyc1xuICAgICAgICAgICAgICAgICAgICBpZihsb2dJbmZvLmRhdGEuY2NOdW1iZXIpIHsgZGVsZXRlIGxvZ0luZm8uZGF0YS5jY051bWJlcjsgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vd2UgZG9uJ3QgbG9nIHBhc3N3b3Jkc1xuICAgICAgICAgICAgICAgICAgICBpZihhdXRoZW50aWNhdGlvblJlcXVlc3RNYXRjaGVyLnRlc3QocmVxdWVzdC51cmwpICYmIHR5cGVvZiBsb2dJbmZvLmRhdGEgPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9nSW5mby5kYXRhID0gbG9nSW5mby5kYXRhLnJlcGxhY2UoLyZzZWNyZXQ9LiovLCBcIiZzZWNyZXQ9eHh4eFwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gbG9nSW5mbztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG5nZG9jIGxvZ0FQSVJlcXVlc3RcbiAgICAgICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuQW5hbHl0aWNzU2VydmljZSNsb2dBUElSZXF1ZXN0XG4gICAgICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5BbmFseXRpY3NTZXJ2aWNlXG4gICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24gTG9ncyBBUEkgcmVxdWVzdHMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZ0FQSVJlcXVlc3Q6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgbG9nSW5mbztcbiAgICAgICAgICAgICAgICB2YXIgYXBpUmVxdWVzdE1hdGNoZXIgPSBuZXcgUmVnRXhwKC9vbGNpXFwvYXBpLyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoYXBpUmVxdWVzdE1hdGNoZXIudGVzdChkYXRhLnVybCkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9NYWtlcyBzdXJlIHdlIGRvbid0IGxvZyB0ZW1wbGF0ZXNcbiAgICAgICAgICAgICAgICAgICAgLy9vdmVyd3JpdGUgbG9nSW5mbyB3aXRoIGEgY2xlYW5lZCB2ZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgIGxvZ0luZm8gPSBzZWxmLl9jbGVhbkxvZ0luZm8oZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9nQ3VzdG9tRXZlbnQoXCJBUElSZXF1ZXN0XCIsIGxvZ0luZm8pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQG5nZG9jIGxvZ0FQSVJlc3BvbnNlXG4gICAgICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2UjbG9nQVBJUmVzcG9uc2VcbiAgICAgICAgICAgICAqIEBtZXRob2RPZiBvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2VcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiBMb2dzIEFQSSByZXNwb25zZXMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZ0FQSVJlc3BvbnNlOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFwaVJlcXVlc3RNYXRjaGVyID0gbmV3IFJlZ0V4cCgvb2xjaVxcL2FwaS8pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGFwaVJlcXVlc3RNYXRjaGVyLnRlc3QoZGF0YS5jb25maWcudXJsKSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ0N1c3RvbUV2ZW50KFwiQVBJUmVzcG9uc2VcIiwgZGF0YSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbmdkb2MgbG9nTW9kYWxPcGVuRXZlbnRcbiAgICAgICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuQW5hbHl0aWNzU2VydmljZSNsb2dNb2RhbE9wZW5FdmVudFxuICAgICAgICAgICAgICogQG1ldGhvZE9mIG9sY2kuc2VydmljZXMuQW5hbHl0aWNzU2VydmljZVxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIGFyZ3VtZW50cyB1c2VkIHRvIG9wZW4gdGhlIG1vZGFsLlxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIExvZ3MgTW9kYWwgb3BlbiBldmVudHMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZ01vZGFsT3BlbkV2ZW50OiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvcGllZERhdGEgPSB7fTtcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmNvcHkoZGF0YSwgY29waWVkRGF0YSk7XG5cbiAgICAgICAgICAgICAgICB2YXIgbW9kYWxOYW1lID0gZGF0YS53aW5kb3dDbGFzcyB8fCBkYXRhLmNvbnRyb2xsZXI7XG4gICAgICAgICAgICAgICAgbW9kYWxOYW1lICs9ICggbW9kYWxOYW1lICE9PSBkYXRhLmNvbnRyb2xsZXIgPyAnICcgKyBkYXRhLmNvbnRyb2xsZXIgOiAnJyApO1xuICAgICAgICAgICAgICAgIHZhciAkc3RhdGUgPSAkaW5qZWN0b3IuZ2V0KCckc3RhdGUnKTtcbiAgICAgICAgICAgICAgICBpZiAoJHN0YXRlLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29waWVkRGF0YS5zdGF0ZU5hbWUgPSAkc3RhdGUuY3VycmVudC5uYW1lO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHNlbGYubG9nQ3VzdG9tRXZlbnQoXCJNb2RhbE9wZW46IFwiICsgbW9kYWxOYW1lLCBjb3BpZWREYXRhKTtcbiAgICAgICAgICAgIH0sXG5cblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbmdkb2MgbG9nTW9kYWxPcGVuRXZlbnRcbiAgICAgICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuQW5hbHl0aWNzU2VydmljZSNsb2dNb2RhbE9wZW5FdmVudFxuICAgICAgICAgICAgICogQG1ldGhvZE9mIG9sY2kuc2VydmljZXMuQW5hbHl0aWNzU2VydmljZVxuICAgICAgICAgICAgICogQHBhcmFtIHtvYmplY3R9IGRhdGEgVGhlIGFyZ3VtZW50cyB1c2VkIHRvIG9wZW4gdGhlIG1vZGFsLlxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIExvZ3MgTW9kYWwgb3BlbiBldmVudHMuXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZ01vZGFsQ2xvc2VFdmVudDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBtb2RhbE5hbWUgPSBkYXRhLndpbmRvd0NsYXNzIHx8IGRhdGEuY29udHJvbGxlcjtcbiAgICAgICAgICAgICAgICBtb2RhbE5hbWUgKz0gKCBtb2RhbE5hbWUgIT09IGRhdGEuY29udHJvbGxlciA/ICcgJyArIGRhdGEuY29udHJvbGxlciA6ICcnICk7XG4gICAgICAgICAgICAgICAgdmFyICRzdGF0ZSA9ICRpbmplY3Rvci5nZXQoJyRzdGF0ZScpO1xuICAgICAgICAgICAgICAgIGlmKCRzdGF0ZS5jdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGRhdGEuc3RhdGVOYW1lID0gJHN0YXRlLmN1cnJlbnQubmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5sb2dDdXN0b21FdmVudChcIk1vZGFsQ2xvc2U6IFwiK21vZGFsTmFtZSwgZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgfVxuXSk7IiwiLypcbiAqIEF1dGhTZXJ2aWNlLmpzXG4gKlxuICogQ3JlYXRlZDogRnJpZGF5LCBGZWJydWFyeSAyMSwgMjAxNFxuICogKGMpIENvcHlyaWdodCAyMDE0IEhvbGxhbmQgQW1lcmljYSwgSW5jLiAtIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqIFRoaXMgaXMgdW5wdWJsaXNoZWQgcHJvcHJpZXRhcnkgc291cmNlIGNvZGUgb2YgSG9sbGFuZCBBbWVyaWNhLCBJbmMuXG4gKiBUaGUgY29weXJpZ2h0IG5vdGljZSBhYm92ZSBkb2VzIG5vdCBldmlkZW5jZSBhbnkgYWN0dWFsIG9yIGludGVuZGVkXG4gKiBwdWJsaWNhdGlvbiBvZiBzdWNoIHNvdXJjZSBjb2RlLlxuICovXG5cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5BdXRoU2VydmljZVxuICogQGRlc2NyaXB0aW9uIFJlYWRzIGFuZCBzZXRzIHVzZXIncyBIQUwgdG9rZW4gdG8vZnJvbSBjb29raWUuXG4gKiBBdXRoZW50aWNhdGVzIGFuZCB2ZXJpZmllcyB1c2VyIHRva2VuLCBhbmQgaGFuZGxlcyByb2xlIGNoYW5nZXMuXG4gKiBAcmVxdWlyZXMgcmVzdGFuZ3VsYXJcbiAqIEByZXF1aXJlcyBBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb25cbiAqIEByZXF1aXJlcyB1aS5yb3V0ZXJcbiAqIEByZXF1aXJlcyBuZ0Nvb2tpZXNcbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCAnb2xjaS5zZXJ2aWNlcy5BdXRoU2VydmljZScsIFtcbiAgICAncmVzdGFuZ3VsYXInLFxuICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nLFxuICAgICduZ0Nvb2tpZXMnLFxuICAgICdvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2UnLFxuICAgICdvbGNpLnNlcnZpY2VzLlNoYXJlZERhdGFTZXJ2aWNlJyxcbiAgICAnbmdTdG9yYWdlJ1xuXSlcblxuLnNlcnZpY2UoICdBdXRoU2VydmljZScsIGZ1bmN0aW9uIChSZXN0YW5ndWxhciwgQ29uZmlndXJhdGlvbiwgJHEsICRjb29raWVzLCBBbmFseXRpY3NTZXJ2aWNlLCBTaGFyZWREYXRhU2VydmljZSwgJHNlc3Npb25TdG9yYWdlKSB7XG4gICAgdmFyIG1lID0ge1xuXG4gICAgICAgIFJPTEVTX1dJVEhfQk9PS0lORzoge1xuICAgICAgICAgICAgR0lGVEVSOiBbIC8vIGdpZnRlcnMgY2Fubm90IHNlZSB0aGVzZSBzZWN0aW9uc1xuICAgICAgICAgICAgICAgICdoZWFkZXJXZWxjb21lTWVzc2FnZScsXG4gICAgICAgICAgICAgICAgJ2hlYWRlck15QWNjb3VudCcsXG4gICAgICAgICAgICAgICAgJ2hlYWRlclNpZ25PdXQnLFxuICAgICAgICAgICAgICAgICdoZWFkZXJDaGVja0luJyxcbiAgICAgICAgICAgICAgICAnaGVhZGVyTWFrZVBheW1lbnQnLFxuICAgICAgICAgICAgICAgICdoZWFkZXJQcm9tb0NvZGUnLFxuICAgICAgICAgICAgICAgICdoZXJvV2VsY29tZU5hbWUnLFxuICAgICAgICAgICAgICAgICdwbmF2VHJhdmVsUGxhbm5pbmcnLFxuICAgICAgICAgICAgICAgICdoZXJvQm9va0ZsaWdodHNUcmF2ZWwnLFxuICAgICAgICAgICAgICAgICdoZXJvU3RhdGVyb29tVGlsZScsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVDaGVja0luJyxcbiAgICAgICAgICAgICAgICAnYjRMZWF2ZUZpbmFsUGF5bWVudCcsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVDUFAnLFxuICAgICAgICAgICAgICAgICdiNExlYXZlUHJlUG9zdENydWlzZScsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVWaXNhcycsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVEZWNrUGxhbicsXG4gICAgICAgICAgICAgICAgJ2l0aW5lcmFyeVB1cmNoYXNlcycsXG5cbiAgICAgICAgICAgICAgICAvLyBzZWN0aW9ucyBieSAoc3RhdGUpIG5hbWVcbiAgICAgICAgICAgICAgICAndHJhdmVsT3B0aW9ucycsXG4gICAgICAgICAgICAgICAgJ3ByZUNydWlzZVRyYXZlbCcsXG4gICAgICAgICAgICAgICAgJ3Bvc3RDcnVpc2VUcmF2ZWwnLFxuICAgICAgICAgICAgICAgICdib29rRmxpZ2h0cycsXG4gICAgICAgICAgICAgICAgJ2NwcCdcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBUUkFWRUxfQUdFTlQ6IFsgLy8gdHJhdmVsIGFnZW50cyBjYW5ub3Qgc2VlIHRoZXNlIHNlY3Rpb25zXG4gICAgICAgICAgICAgICAgJ2hlYWRlcldlbGNvbWVNZXNzYWdlJyxcbiAgICAgICAgICAgICAgICAnaGVhZGVyTXlBY2NvdW50JyxcbiAgICAgICAgICAgICAgICAnaGVhZGVyU2lnbk91dCcsXG4gICAgICAgICAgICAgICAgJ2hlYWRlckNoZWNrSW4nLFxuICAgICAgICAgICAgICAgICdoZWFkZXJNYWtlUGF5bWVudCcsXG4gICAgICAgICAgICAgICAgJ2hlYWRlclByb21vQ29kZScsXG4gICAgICAgICAgICAgICAgJ2hlcm9XZWxjb21lTmFtZScsXG4gICAgICAgICAgICAgICAgJ3BuYXZUcmF2ZWxQbGFubmluZycsXG4gICAgICAgICAgICAgICAgJ2hlcm9Cb29rRmxpZ2h0c1RyYXZlbCcsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVDaGVja0luJyxcbiAgICAgICAgICAgICAgICAnYjRMZWF2ZUZpbmFsUGF5bWVudCcsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVDUFAnLFxuICAgICAgICAgICAgICAgICdiNExlYXZlUHJlUG9zdENydWlzZScsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVWaXNhcycsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVEZWNrUGxhbicsXG4gICAgICAgICAgICAgICAgJ2l0aW5lcmFyeVB1cmNoYXNlcycsXG5cbiAgICAgICAgICAgICAgICAvLyBzZWN0aW9ucyBieSAoc3RhdGUpIG5hbWVcbiAgICAgICAgICAgICAgICAndHJhdmVsT3B0aW9ucycsXG4gICAgICAgICAgICAgICAgJ3ByZUNydWlzZVRyYXZlbCcsXG4gICAgICAgICAgICAgICAgJ3Bvc3RDcnVpc2VUcmF2ZWwnLFxuICAgICAgICAgICAgICAgICdib29rRmxpZ2h0cycsXG4gICAgICAgICAgICAgICAgJ2NwcCdcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAnRElSRUNUX0dVRVNUX0xPR0dFRF9JTic6IFtdLFxuICAgICAgICAgICAgJ0RJUkVDVF9HVUVTVF9OT1RfTE9HR0VEX0lOJzogW1xuICAgICAgICAgICAgICAgICdoZWFkZXJNYWtlUGF5bWVudCcsXG4gICAgICAgICAgICAgICAgJ2hlYWRlcldlbGNvbWVNZXNzYWdlJyxcbiAgICAgICAgICAgICAgICAnaGVhZGVyU2lnbk91dCcsXG4gICAgICAgICAgICAgICAgJ2hlcm9Cb29rRmxpZ2h0c1RyYXZlbCcsXG4gICAgICAgICAgICAgICAgJ2hlcm9TdGF0ZXJvb21UaWxlJyxcbiAgICAgICAgICAgICAgICAnaGVyb1dlbGNvbWVOYW1lJyxcbiAgICAgICAgICAgICAgICAnaXRpbmVyYXJ5UHVyY2hhc2VzJyxcbiAgICAgICAgICAgICAgICAncG5hdlByZVBvc3RDcnVpc2UnLFxuICAgICAgICAgICAgICAgICdwbmF2Q1BQJyxcbiAgICAgICAgICAgICAgICAncG5hdk1ha2VQYXltZW50JyxcbiAgICAgICAgICAgICAgICAnYjRMZWF2ZUZpbmFsUGF5bWVudCcsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVDUFAnLFxuICAgICAgICAgICAgICAgICdiNExlYXZlUHJlUG9zdENydWlzZScsXG5cbiAgICAgICAgICAgICAgICAvLyBzZWN0aW9ucyBieSAoc3RhdGUpIG5hbWVcbiAgICAgICAgICAgICAgICAndHJhdmVsT3B0aW9ucycsXG4gICAgICAgICAgICAgICAgJ2NwcCdcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAnVFJBVkVMX0FHRU5DWV9CT09LRURfR1VFU1RfTE9HR0VEX0lOJzogW1xuICAgICAgICAgICAgICAgICdoZWFkZXJNYWtlUGF5bWVudCcsXG4gICAgICAgICAgICAgICAgJ3BuYXZQcmVQb3N0Q3J1aXNlJyxcbiAgICAgICAgICAgICAgICAncG5hdkNQUCcsXG4gICAgICAgICAgICAgICAgJ3BuYXZNYWtlUGF5bWVudCcsXG4gICAgICAgICAgICAgICAgJ2hlcm9Cb29rRmxpZ2h0c1RyYXZlbCcsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVGaW5hbFBheW1lbnQnLFxuICAgICAgICAgICAgICAgICdiNExlYXZlQ1BQJyxcbiAgICAgICAgICAgICAgICAnYjRMZWF2ZVByZVBvc3RDcnVpc2UnLFxuXG4gICAgICAgICAgICAgICAgLy8gc2VjdGlvbnMgYnkgKHN0YXRlKSBuYW1lXG4gICAgICAgICAgICAgICAgJ3RyYXZlbE9wdGlvbnMnLFxuICAgICAgICAgICAgICAgICdjcHAnXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgJ1RSQVZFTF9BR0VOQ1lfQk9PS0VEX0dVRVNUX05PVF9MT0dHRURfSU4nOiBbXG4gICAgICAgICAgICAgICAgJ2hlYWRlck1ha2VQYXltZW50JyxcbiAgICAgICAgICAgICAgICAnaGVhZGVyV2VsY29tZU1lc3NhZ2UnLFxuICAgICAgICAgICAgICAgICdoZWFkZXJTaWduT3V0JyxcbiAgICAgICAgICAgICAgICAnaGVyb1dlbGNvbWVOYW1lJyxcbiAgICAgICAgICAgICAgICAncG5hdlByZVBvc3RDcnVpc2UnLFxuICAgICAgICAgICAgICAgICdwbmF2Q1BQJyxcbiAgICAgICAgICAgICAgICAncG5hdk1ha2VQYXltZW50JyxcbiAgICAgICAgICAgICAgICAnaGVyb0Jvb2tGbGlnaHRzVHJhdmVsJyxcbiAgICAgICAgICAgICAgICAnaGVyb1N0YXRlcm9vbVRpbGUnLFxuICAgICAgICAgICAgICAgICdiNExlYXZlRmluYWxQYXltZW50JyxcbiAgICAgICAgICAgICAgICAnYjRMZWF2ZUNQUCcsXG4gICAgICAgICAgICAgICAgJ2I0TGVhdmVQcmVQb3N0Q3J1aXNlJyxcbiAgICAgICAgICAgICAgICAnaXRpbmVyYXJ5UHVyY2hhc2VzJyxcblxuICAgICAgICAgICAgICAgIC8vIHNlY3Rpb25zIGJ5IChzdGF0ZSkgbmFtZVxuICAgICAgICAgICAgICAgICd0cmF2ZWxPcHRpb25zJyxcbiAgICAgICAgICAgICAgICAnY3BwJ1xuICAgICAgICAgICAgXVxuXG5cblxuICAgICAgICB9LFxuXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uQmFzZVVybDogUmVzdGFuZ3VsYXIub25lKCAnYXV0aGVudGljYXRpb24vdjEuMC4wJyApLm9uZSggJ2NvbXBhbnlDb2RlJywgQ29uZmlndXJhdGlvbi5jb21wYW55Q29kZSksXG5cbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWUuY3VycmVudFVzZXIgPSBudWxsO1xuICAgICAgICB9LFxuXG4gICAgICAgIGN1cnJlbnRVc2VyUmVzb2x2ZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgIGlmIChtZS5jdXJyZW50VXNlciAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUobWUuY3VycmVudFVzZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKG1lLnJlY292ZXJTZXNzaW9uKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBzZWNvbmRhcnlGbG93LnNlcnZpY2VzLkF1dGhTZXJ2aWNlI2dldEN1cnJlbnRVc2VyXG4gICAgICAgICAqIEBtZXRob2RPZiBzZWNvbmRhcnlGbG93LnNlcnZpY2VzLkF1dGhTZXJ2aWNlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBnZXRzIGFuZCByZXR1cm5zIGN1cnJlbnRVc2VyIGZyb20gY29va2llLCBlbHNlIG51bGwuXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IGN1cnJlbnRVc2VyIGVsc2UgbnVsbFxuICAgICAgICAgKiAqL1xuICAgICAgICBnZXRDdXJyZW50VXNlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG1lLmN1cnJlbnRVc2VyO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5BdXRoU2VydmljZSNnZXRDdXJyZW50Um9sZXNcbiAgICAgICAgICogQG1ldGhvZE9mIHNlY29uZGFyeUZsb3cuc2VydmljZXMuQXV0aFNlcnZpY2VcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIEdldCBhbiBhcnJheSBvZiB0aGUgcm9sZXMgdGhlIGN1cnJlbnQgdXNlciBiZWxvbmdzIHRvLlxuICAgICAgICAgKiBAcmV0dXJucyB7YXJyYXl9IHJvbGVzW10gb2Ygcm9sZXMuXG4gICAgICAgICAqICovXG4gICAgICAgIGdldEN1cnJlbnRSb2xlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJvbGVzID0gW107XG4gICAgICAgICAgICBpZiAobWUuY3VycmVudFVzZXIgJiYgYW5ndWxhci5pc0FycmF5KG1lLmN1cnJlbnRVc2VyLnJvbGVzKSkge1xuICAgICAgICAgICAgICAgIHJvbGVzID0gbWUuY3VycmVudFVzZXIucm9sZXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcm9sZXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlY292ZXIgc2Vzc2lvbiBkYXRhLCBmb3IgaW5zdGFuY2Ugb24gYSByZWxvYWQuXG4gICAgICAgICAqXG4gICAgICAgICAqIEhBTF9BVVRIX1RPS0VOIGlzIHVzZWQgZm9yIFJFU1QgY2FsbHMsIGJ1dCBhIHBhZ2UgcmVsb2FkIGNhbiBwb3RlbnRpYWxseSBnZXQgdGhlIGNvb2tpZXMgb3V0IG9mIHN5bmMsXG4gICAgICAgICAqIGNhdXNpbmcgdGhlIHVzZXIgdG8gYXBwZWFyIGxvZ2dlZCBpbiBidXQgYWxsIHJlcXVlc3RzIGZhaWwuXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IHByb21pc2VcbiAgICAgICAgICovXG4gICAgICAgIHJlY292ZXJTZXNzaW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBtZS52ZXJpZnkoJHNlc3Npb25TdG9yYWdlLnRva2VuKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBzZWNvbmRhcnlGbG93LnNlcnZpY2VzLkF1dGhTZXJ2aWNlI25lZWRzU2Vzc2lvblJlY292ZXJ5XG4gICAgICAgICAqIEBtZXRob2RPZiBzZWNvbmRhcnlGbG93LnNlcnZpY2VzLkF1dGhTZXJ2aWNlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBDaGVja3MgaWYgdGhlIHRva2VuIGhhcyB0aW1lZCBvdXQuXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZSB0b2tlbiBoYXMgdGltZWQgb3V0XG4gICAgICAgICAqKi9cbiAgICAgICAgbmVlZHNTZXNzaW9uUmVjb3Zlcnk6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB2YXIgY3VycmVudFRpbWUgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgdmFyIHRpbWVvdXRtcyA9IENvbmZpZ3VyYXRpb24udG9rZW5UaW1lb3V0O1xuICAgICAgICAgICAgdmFyIHRva2VuVGltZXN0YW1wID0gJHNlc3Npb25TdG9yYWdlLnRva2VuVGltZXN0YW1wO1xuICAgICAgICAgICAgcmV0dXJuICh0b2tlblRpbWVzdGFtcCAhPT0gbnVsbCAmJiAoY3VycmVudFRpbWUgLSB0b2tlblRpbWVzdGFtcCkgPiB0aW1lb3V0bXMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIHNlY29uZGFyeUZsb3cuc2VydmljZXMuQXV0aFNlcnZpY2UjYXV0aGVudGljYXRlXG4gICAgICAgICAqIEBtZXRob2RPZiBzZWNvbmRhcnlGbG93LnNlcnZpY2VzLkF1dGhTZXJ2aWNlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBBdXRoZW50aWNhdGVzIHVzZXIuXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBib29raW5nTnVtYmVyIGUuZy4gR1BNTDhQXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBsYXN0TmFtZSBlLmcuIEJFVFRFU1xuICAgICAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBwcm9taXNlXG4gICAgICAgICAqICovXG4gICAgICAgIGF1dGhlbnRpY2F0ZTogZnVuY3Rpb24gKCBib29raW5nTnVtYmVyLCBsYXN0TmFtZSApIHtcbiAgICAgICAgICAgIHZhciBoZWFkZXIgPSB7XG4gICAgICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7XCJcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBhdXRoRGF0YSA9IG1lLl90cmFuc2Zvcm1SZXF1ZXN0T2JqZWN0KHtcbiAgICAgICAgICAgICAgICBcImtleVwiOiBib29raW5nTnVtYmVyLFxuICAgICAgICAgICAgICAgIFwic2VjcmV0XCI6IGxhc3ROYW1lXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIG1lLmF1dGhlbnRpY2F0aW9uQmFzZVVybC5jdXN0b21QT1NUKCBhdXRoRGF0YSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGhlYWRlciApLnRoZW4oZnVuY3Rpb24gKCBkYXRhICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZS5fY2hlY2tBdXRoZW50aWNhdGlvbiggZGF0YSApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5BdXRoU2VydmljZSNyZXF1ZXN0Um9sZUNoYW5nZVxuICAgICAgICAgKiBAbWV0aG9kT2Ygc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5BdXRoU2VydmljZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gY2hhbmdlcyByb2xlcyBpZiBhdXRob3JpemVkLlxuICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3Um9sZSBzdHJpbmcuXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IHByb21pc2UuXG4gICAgICAgICAqICovXG4gICAgICAgIHJlcXVlc3RSb2xlQ2hhbmdlOiBmdW5jdGlvbiggbmV3Um9sZSApIHtcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gbWUuYXV0aGVudGljYXRpb25CYXNlVXJsLm9uZSggbWUuZ2V0Q3VycmVudFVzZXIoKS50b2tlbiArICcvcm9sZS8nICsgbmV3Um9sZSApO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVxdWVzdC5wdXQoKS50aGVuKGZ1bmN0aW9uICggZGF0YSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWUuX2NoZWNrQXV0aGVudGljYXRpb24oIGRhdGEgKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5BdXRoU2VydmljZSN2ZXJpZnlcbiAgICAgICAgICogQG1ldGhvZE9mIHNlY29uZGFyeUZsb3cuc2VydmljZXMuQXV0aFNlcnZpY2VcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIG5vdCBzdXJlXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB0b2tlbiBlLmcuIHh4eHh4eHh4XG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IHByb21pc2UuXG4gICAgICAgICAqICovXG4gICAgICAgIHZlcmlmeTogZnVuY3Rpb24gKCB0b2tlbiApIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZiAoICF0b2tlbiApIHtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoICdubyB0b2tlbicgKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWUuYXV0aGVudGljYXRpb25CYXNlVXJsLmN1c3RvbUdFVCggdG9rZW4gKS50aGVuKGZ1bmN0aW9uICggZGF0YSApIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuX3NldFRva2VuVGltZXN0YW1wKCk7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoIG1lLl9jaGVja0F1dGhlbnRpY2F0aW9uKCBkYXRhICkgKTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRlZmVycmVkLnJlamVjdCggJ25vIHRva2VuJyApKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBzZWNvbmRhcnlGbG93LnNlcnZpY2VzLkF1dGhTZXJ2aWNlI2lzQXV0aGVudGljYXRlZFxuICAgICAgICAgKiBAbWV0aG9kT2Ygc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5BdXRoU2VydmljZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gdGVzdHMgZm9yIGN1cnJlbnQgdXNlci5cbiAgICAgICAgICogQHJldHVybnMge2Jvb2x9ICEhZ2V0Q3VycmVudFVzZXIoKVxuICAgICAgICAgKiAqL1xuICAgICAgICBpc0F1dGhlbnRpY2F0ZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhISggbWUuZ2V0Q3VycmVudFVzZXIoKSApO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5BdXRoU2VydmljZSNpc0xvZ2dlZEluXG4gICAgICAgICAqIEBtZXRob2RPZiBzZWNvbmRhcnlGbG93LnNlcnZpY2VzLkF1dGhTZXJ2aWNlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBUZXN0cyB3aGV0aGVyIGN1cnJlbnQgdXNlciBpcyBsb2dnZWQgaW4gdG8gZnJvbnQtZW5kIG1hcmtldGluZyB3ZWJzaXRlLlxuICAgICAgICAgKiBAcmV0dXJucyB7Ym9vbH0gdHJ1ZSBpZiB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgICAgICogKi9cbiAgICAgICAgaXNMb2dnZWRJbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbG9nZ2VkSW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciByb2xlcyA9IG1lLmdldEN1cnJlbnRSb2xlcygpO1xuXG4gICAgICAgICAgICBsb2dnZWRJbiA9ICEhKF8uZmluZCggcm9sZXMsIGZ1bmN0aW9uKCByb2xlICkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb2xlLm1hdGNoKC9MT0dHRURfSU4vKSAmJiAhcm9sZS5tYXRjaCgvTk9UX0xPR0dFRF9JTi8pO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gbG9nZ2VkSW47XG4gICAgICAgIH0sXG5cbiAgICAgICAgaXNEaXJlY3RHdWVzdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZGlyZWN0R3Vlc3QgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciByb2xlcyA9IG1lLmdldEN1cnJlbnRSb2xlcygpO1xuXG4gICAgICAgICAgICBkaXJlY3RHdWVzdCA9ICEhKF8uZmluZCggcm9sZXMsIGZ1bmN0aW9uKCByb2xlICkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb2xlLm1hdGNoKC9ESVJFQ1RfR1VFU1QvKSAmJiAhcm9sZS5tYXRjaCgvSU5ESVJFQ1RfR1VFU1QvKTtcbiAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgcmV0dXJuIGRpcmVjdEd1ZXN0O1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgaXNFeHBsb3JlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbG9nZ2VkSW4gPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciByb2xlcyA9IG1lLmdldEN1cnJlbnRSb2xlcygpO1xuXG4gICAgICAgICAgICBsb2dnZWRJbiA9ICEhKF8uZmluZCggcm9sZXMsIGZ1bmN0aW9uKCByb2xlICkge1xuICAgICAgICAgICAgICAgIHJldHVybiByb2xlLm1hdGNoKC9FWFBMT1JFUi8pO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gbG9nZ2VkSW47XG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICBpc1RyYXZlbEFnZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBsb2dnZWRJbiA9IGZhbHNlO1xuICAgICAgICAgICAgdmFyIHJvbGVzID0gbWUuZ2V0Q3VycmVudFJvbGVzKCk7XG5cbiAgICAgICAgICAgIGxvZ2dlZEluID0gISEoXy5maW5kKCByb2xlcywgZnVuY3Rpb24oIHJvbGUgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvbGUubWF0Y2goL1RSQVZFTF9BR0VOVC8pO1xuICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gbG9nZ2VkSW47XG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBzZWNvbmRhcnlGbG93LnNlcnZpY2VzLkF1dGhTZXJ2aWNlI2F1dGhvcml6ZVxuICAgICAgICAgKiBAbWV0aG9kT2Ygc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5BdXRoU2VydmljZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gQ2hlY2tzIGF1dGhvcml6YXRpb24gcGVybWlzc2lvbi5cbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGFjY2Vzc0xldmVscyBhIHN0cmluZyBhcnJheSB3aXRoIHJvbGUgbmFtZXMgb3IgYSBzdHJpbmcgd2l0aCByb2xlIG5hbWUuXG4gICAgICAgICAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmIHRoZSByb2xlIGlzIGF1dGhvcml6ZWQuXG4gICAgICAgICAqL1xuICAgICAgICBhdXRob3JpemU6IGZ1bmN0aW9uICggbmFtZSApIHtcbiAgICAgICAgICAgIHZhciBoYXNBY2Nlc3MgPSBmYWxzZTtcbiAgICAgICAgICAgIHZhciByb2xlcyA9IG1lLmdldEN1cnJlbnRSb2xlcygpO1xuXG4gICAgICAgICAgICBpZiAoIG1lLlJPTEVTX1dJVEhfQk9PS0lOR1sgcm9sZXNbIDAgXSBdICYmICFfLmZpbmQoIG1lLlJPTEVTX1dJVEhfQk9PS0lOR1sgcm9sZXNbIDAgXSBdLCBmdW5jdGlvbiggdmFsICkgeyByZXR1cm4gdmFsID09PSBuYW1lOyB9ICkgKSB7XG4gICAgICAgICAgICAgICAgaGFzQWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGhhc0FjY2VzcztcbiAgICAgICAgfSwgXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBzZWNvbmRhcnlGbG93LnNlcnZpY2VzLkF1dGhTZXJ2aWNlI2xvZ291dFxuICAgICAgICAgKiBAbWV0aG9kT2Ygc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5BdXRoU2VydmljZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gUmVtb3ZlcyBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAgICAgICAqICovXG4gICAgICAgIGxvZ291dDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gZGVsZXRlIHRoZSB1c2VyIHRva2VuIHdpdGggYXV0aCBzZXJ2aWNlIGVuZHBvaW50XG4gICAgICAgICAgICB2YXIgcmVzb2x2ZSA9ICBtZS5hdXRoZW50aWNhdGlvbkJhc2VVcmwub25lKCAkc2Vzc2lvblN0b3JhZ2UudG9rZW4gKS5yZW1vdmUoKVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBXaXBlIG91dCBjb29raWVzIGFuZCB1c2VyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmNvb2tpZSA9ICdIQUxfQVVUSF9UT0tFTj07cGF0aD0vc2Vjb25kYXJ5L2FwaSc7IC8vIFJFU1QgY29va2llIGF0IC9zZWNvbmRhcnkvYXBpXG4gICAgICAgICAgICAgICAgICAgICRzZXNzaW9uU3RvcmFnZS50b2tlbiA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAkc2Vzc2lvblN0b3JhZ2UudG9rZW5UaW1lc3RhbXAgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgbWUuaW5pdCgpO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oICdmaW5kQm9va2luZycgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2xlYW4gYXV0aGVudGljYXRpb24gaW5mb3JtYXRpb24gb3V0IG9mIHRoZSBkYXRhIHJldHVybmVkIGZyb20gb25lIG9mIHRoZSBhdXRoIGNhbGxzXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSBhdXRoRGF0YVxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX2V4dHJhY3RDdXJyZW50VXNlcjogZnVuY3Rpb24gKCBhdXRoRGF0YSApIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50VXNlciA9IGF1dGhEYXRhO1xuXG4gICAgICAgICAgICAvLyBUT0RPOiByZW1vdmUgdGhpcyBhbmQgcmVmYWN0b3IgdGhlIHJlZmVyZW5jZXMsXG4gICAgICAgICAgICAvLyB1c2UgY3VycmVudFVzZXIuZGV0YWlscy4qIGluc3RlYWRcbiAgICAgICAgICAgIGlmIChhdXRoRGF0YS5kZXRhaWxzKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFVzZXIuYm9va2luZ051bWJlciA9IGF1dGhEYXRhLmRldGFpbHMuYm9va2luZ051bWJlcjtcbiAgICAgICAgICAgICAgICBjdXJyZW50VXNlci5sYXN0TmFtZSA9IGF1dGhEYXRhLmRldGFpbHMubGFzdE5hbWU7XG4gICAgICAgICAgICAgICAgY3VycmVudFVzZXIuY291bnRyeUNvZGUgPSBhdXRoRGF0YS5kZXRhaWxzLmNvdW50cnk7XG5cbiAgICAgICAgICAgICAgICAvLyBTaGFyZWREYXRhU2VydmljZS5zZXRDb3VudHJ5T2ZMb2NhbGUoIGF1dGhEYXRhLmRldGFpbHMuY291bnRyeSApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gY3VycmVudFVzZXI7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdsZWFuIGF1dGhlbnRpY2F0aW9uIGluZm9ybWF0aW9uIG91dCBvZiB0aGUgZGF0YSByZXR1cm5lZCBmcm9tIG9uZSBvZiB0aGUgYXV0aCBjYWxsc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0gYXV0aERhdGFcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICogQHJldHVybiBwcm9taXNlXG4gICAgICAgICAqL1xuICAgICAgICBfY2hlY2tBdXRoZW50aWNhdGlvbjogZnVuY3Rpb24gKCBhdXRoRGF0YSApIHtcbiAgICAgICAgICAgIHZhciB1c2VyRGF0YSA9IG1lLl9leHRyYWN0Q3VycmVudFVzZXIoIGF1dGhEYXRhICk7XG5cbiAgICAgICAgICAgIC8vIHN0b3JlIGF1dGggdG9rZW4gZm9yIGxhdGVyLCBidXQgZG9uJ3QgbGV0IEFuZ3VsYXIgc2V0IGV4cGlyYXRpb24gZGF0ZVxuICAgICAgICAgICAgJHNlc3Npb25TdG9yYWdlLmN1cnJlbnRVc2VyID0gdXNlckRhdGEudG9rZW47XG4gICAgICAgICAgICBtZS5fc2V0VG9rZW5UaW1lc3RhbXAoKTtcbiAgICAgICAgICAgIG1lLmN1cnJlbnRVc2VyID0gdXNlckRhdGE7XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGZvciBpbnZhbGlkIHJvbGVcbiAgICAgICAgICAgIHZhciBzZWN1cml0eUNoZWNrUm9sZXMgPSBfLmludGVyc2VjdGlvbih1c2VyRGF0YS5yb2xlcywgT2JqZWN0LmtleXMobWUuUk9MRVNfV0lUSF9CT09LSU5HKSk7XG4gICAgICAgICAgICAvLyBJdCdzIG9ubHkgYW4gaW52YWxpZCByb2xlIGlmIHRoZSBib29raW5nIG51bWJlciBpcyBwcmVzZW50LFxuICAgICAgICAgICAgLy8gb3RoZXJ3aXNlIHRoZSB1c2VyIHNob3VsZCBzZWUgdGhlIGxvZ2luIHNjcmVlbiB3aXRoIGZpZWxkcyBmaWxsZWQgaW4uXG4gICAgICAgICAgICBpZiAoIHNlY3VyaXR5Q2hlY2tSb2xlcy5sZW5ndGggPT09IDAgJiYgdXNlckRhdGEuYm9va2luZ051bWJlciApe1xuICAgICAgICAgICAgICAgIG1lLmluaXQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KCAnSU5WQUxJRF9ST0xFJyApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oIHVzZXJEYXRhICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgX3RyYW5zZm9ybVJlcXVlc3RPYmplY3Q6IGZ1bmN0aW9uICggb2JqICkge1xuICAgICAgICAgICAgdmFyIHN0ciA9IFtdO1xuICAgICAgICAgICAgZm9yICggdmFyIHAgaW4gb2JqICkge1xuICAgICAgICAgICAgICAgIHN0ci5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChwKSArIFwiPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KG9ialtwXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHN0ci5qb2luKCBcIiZcIiApO1xuICAgICAgICB9LFxuXG4gICAgICAgIF9zZXRUb2tlblRpbWVzdGFtcDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICRzZXNzaW9uU3RvcmFnZS50b2tlblRpbWVzdGFtcCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgbWUuaW5pdCgpO1xuICAgIHJldHVybiBtZTtcbn0pO1xuIiwiLy8gLypcbi8vICAqIEJvb2tpbmdTZXJ2aWNlLmpzXG4vLyAgKlxuLy8gICogQ3JlYXRlZDogRnJpZGF5LCBGZWJydWFyeSAwNywgMjAxNFxuLy8gICogKGMpIENvcHlyaWdodCAyMDE0IEhvbGxhbmQgQW1lcmljYSwgSW5jLiAtIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbi8vICAqIFRoaXMgaXMgdW5wdWJsaXNoZWQgcHJvcHJpZXRhcnkgc291cmNlIGNvZGUgb2YgSG9sbGFuZCBBbWVyaWNhLCBJbmMuXG4vLyAgKiBUaGUgY29weXJpZ2h0IG5vdGljZSBhYm92ZSBkb2VzIG5vdCBldmlkZW5jZSBhbnkgYWN0dWFsIG9yIGludGVuZGVkXG4vLyAgKiBwdWJsaWNhdGlvbiBvZiBzdWNoIHNvdXJjZSBjb2RlLlxuLy8gICovXG5cblxuLy8gLyoqXG4vLyAgKiBAbmdkb2Mgc2VydmljZVxuLy8gICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5Cb29raW5nU2VydmljZVxuLy8gICogQGRlc2NyaXB0aW9uIEdFVHMgYW5kIHNldHMgYm9va2luZyBzdW1tYXJ5IGRhdGEsIGluY2x1ZGluZyBhdXRob3JpemF0aW9ucy5cbi8vICAqIEByZXF1aXJlcyByZXN0YW5ndWxhclxuLy8gICogQHJlcXVpcmVzIG9sY2kuc2VydmljZXMuQXV0aFNlcnZpY2Vcbi8vICAqIEByZXF1aXJlcyBvbGNpLnNlcnZpY2VzLlJvdXRpbmdVdGlsc1NlcnZpY2Vcbi8vICAqIEByZXF1aXJlcyBvbGNpLmZpbHRlcnMuUG9ydE5hbWVGaWx0ZXJcbi8vICAqL1xuXG4vLyBhbmd1bGFyLm1vZHVsZSgnb2xjaS5zZXJ2aWNlcy5Cb29raW5nU2VydmljZScsIFtcbi8vICAgICAncmVzdGFuZ3VsYXInLFxuLy8gICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nLFxuLy8gICAgICdvbGNpLnNlcnZpY2VzLkF1dGhTZXJ2aWNlJyxcbi8vIC8vICAgICAnb2xjaS5zZXJ2aWNlcy5Sb3V0aW5nVXRpbHNTZXJ2aWNlJyxcbi8vIC8vICAgICAnb2xjaS5zZXJ2aWNlcy5UaW1lVXRpbHNTZXJ2aWNlJyxcbi8vIC8vICAgICAnb2xjaS5maWx0ZXJzLlBvcnROYW1lRmlsdGVyJyxcbi8vIC8vICAgICAnb2xjaS5maWx0ZXJzLlRpdGxlQ2FzZUZpbHRlcidcbi8vIF0pXG5cbi8vIC8qKlxuLy8gICogQG5nZG9jIHNlcnZpY2Vcbi8vICAqIEBuYW1lIG9sY2kuc2VydmljZXMuQm9va2luZ1NlcnZpY2Vcbi8vICAqIEBkZXNjcmlwdGlvbiBBbiBlbXB0eSBzZXJ2aWNlIGRlc2NyaXB0aW9uLiBQbGVhc2UgZmlsbCBpbiBhIGhpZ2ggbGV2ZWwgZGVzY3JpcHRpb24gb2YgdGhpc1xuLy8gICogICAgIHNlcnZpY2UuXG4vLyAgKi9cbi8vICAgICAuc2VydmljZSgnQm9va2luZ1NlcnZpY2UnLCBbICdSZXN0YW5ndWxhcicsICckcScsICckaW50ZXJwb2xhdGUnLCAnJGxvY2F0aW9uJywgJyRmaWx0ZXInLCAnQ29uZmlndXJhdGlvbicsICdSb3V0aW5nVXRpbHNTZXJ2aWNlJywgJ1RpbWVVdGlsc1NlcnZpY2UnLCAnQXV0aFNlcnZpY2UnLFxuLy8gICAgICAgICBmdW5jdGlvbiAoUmVzdGFuZ3VsYXIsICRxLCAkaW50ZXJwb2xhdGUsICRsb2NhdGlvbiwgJGZpbHRlciwgQ29uZmlndXJhdGlvbiwgUm91dGluZ1V0aWxzU2VydmljZSwgVGltZVV0aWxzU2VydmljZSwgQXV0aFNlcnZpY2UpIHtcbi8vICAgICAgICAgICAgIHZhciBhcHBOYW1lID0gQ29uZmlndXJhdGlvbi5hcHBOYW1lO1xuXG4vLyAgICAgICAgICAgICByZXR1cm4ge1xuLy8gICAgICAgICAgICAgICAgIGJvb2tpbmdCYXNlVXJsOiBSZXN0YW5ndWxhci5vbmUoJ2d1ZXN0L3YxLjAuMC9ib29raW5nJykub25lKCdjb21wYW55Q29kZScsIENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGUpLFxuLy8gICAgICAgICAgICAgICAgIGJvb2tpbmdTdW1tYXJ5OiBudWxsLFxuXG4vLyAgICAgICAgICAgICAgICAgYm9va2luZ1N1bW1hcnlSZXNvbHZlcjogZnVuY3Rpb24gKCkge1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBwcm9taXNlID0gJHEucmVqZWN0KCdub3QgbG9nZ2VkIGluJyk7XG5cbi8vICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuYm9va2luZ1N1bW1hcnkgIT09IG51bGwpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHByb21pc2UgPSAkcS53aGVuKHNlbGYuYm9va2luZ1N1bW1hcnkpO1xuLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBwcm9taXNlID0gc2VsZi5nZXRCb29raW5nU3VtbWFyeShBdXRoU2VydmljZS5jdXJyZW50VXNlci5ib29raW5nTnVtYmVyKS50aGVuKGZ1bmN0aW9uIChib29raW5nU3VtbWFyeSkge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuYm9va2luZ1N1bW1hcnkgPSBib29raW5nU3VtbWFyeTtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYm9va2luZ1N1bW1hcnk7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbi8vICAgICAgICAgICAgICAgICAgICAgfVxuXG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwcm9taXNlO1xuLy8gICAgICAgICAgICAgICAgIH0sXG5cbi8vICAgICAgICAgICAgICAgICBfc2V0SXRpbmVyYXJ5RGF0ZTogZnVuY3Rpb24gKGl0aW5lcmFyeURheUxpc3QpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgaWYgKGl0aW5lcmFyeURheUxpc3QgIT09IHVuZGVmaW5lZCkge1xuXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGl0aW5lcmFyeURheUxpc3QubGVuZ3RoOyBpKyspIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnlEYXlMaXN0W2ldLmxhYmVsID0gJGZpbHRlcignZGF0ZScpKGl0aW5lcmFyeURheUxpc3RbaV0uZGF0ZSwgJ01NTU0gZCcpICsgXCIgLSBcIiArIGl0aW5lcmFyeURheUxpc3RbaV0ucG9ydE5hbWU7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICB9LFxuXG4vLyAgICAgICAgICAgICAgICAgX3NldEd1ZXN0RGlzcGxheU5hbWVzOiBmdW5jdGlvbiAoZ3Vlc3RzKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIGlmIChndWVzdHMgIT09IHVuZGVmaW5lZCkge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZyA9IDA7IGcgPCBndWVzdHMubGVuZ3RoOyBnKyspIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgZ3Vlc3QgPSBndWVzdHNbZ107XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRpc3BsYXlOYW1lID0gJGludGVycG9sYXRlKCd7e2ZpcnN0TmFtZX19IHt7bGFzdE5hbWV9fScpKGd1ZXN0KTtcblxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgICAgIGd1ZXN0Lm5hbWUgPSAkZmlsdGVyKCd0aXRsZUNhc2UnKShkaXNwbGF5TmFtZSk7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICB9LFxuXG4vLyAgICAgICAgICAgICAgICAgLyoqXG4vLyAgICAgICAgICAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuLy8gICAgICAgICAgICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuQm9va2luZ1NlcnZpY2UjZ2V0Qm9va2luZ1N1bW1hcnlcbi8vICAgICAgICAgICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5Cb29raW5nU2VydmljZVxuLy8gICAgICAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiBHRVRzIGFuZCBzZXRzIGJvb2tpbmdTdW1tYXJ5IGRhdGEuXG4vLyAgICAgICAgICAgICAgICAgICogQHJldHVybnMge29iamVjdH0gcHJvbWlzZSBvYmplY3Rcbi8vICAgICAgICAgICAgICAgICAgKiAqL1xuLy8gICAgICAgICAgICAgICAgIGdldEJvb2tpbmdTdW1tYXJ5OiBmdW5jdGlvbiAoYm9va2luZ051bWJlcikge1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGdldEJvb2tpbmdTdW1tYXJ5ID0gc2VsZi5ib29raW5nQmFzZVVybFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgLm9uZSgnYm9va2luZ051bWJlcicsIGJvb2tpbmdOdW1iZXIpO1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIGdldEJvb2tpbmdTdW1tYXJ5LmdldCgpLnRoZW4oZnVuY3Rpb24gKGJvb2tpbmdTdW1tYXJ5KSB7XG5cbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuX2NsZWFuVXBCb29raW5nU3VtbWFyeShib29raW5nU3VtbWFyeSk7XG5cbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoYm9va2luZ1N1bW1hcnkpO1xuLy8gICAgICAgICAgICAgICAgICAgICB9LCBmdW5jdGlvbiAoZXJyb3IpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChlcnJvcik7XG4vLyAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuLy8gICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgX3BvcnRNZXRhZGF0YTogZnVuY3Rpb24gKGl0aW5lcmFyeURheSkge1xuLy8gICAgICAgICAgICAgICAgICAgICBpZiAoaXRpbmVyYXJ5RGF5LnBvcnROYW1lID09PSBudWxsKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB9O1xuLy8gICAgICAgICAgICAgICAgICAgICB9XG5cbi8vICAgICAgICAgICAgICAgICAgICAgLy8gRml4IGNhc2luZyBmb3IgZGVwYXJ0dXJlLCByZXR1cm4gcG9ydHNcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHBvcnRTdHJpbmdzID0gaXRpbmVyYXJ5RGF5LnBvcnROYW1lLnNwbGl0KCcsJykubWFwKGZ1bmN0aW9uIChlbnRyeSkge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVudHJ5LnRyaW0oKTtcbi8vICAgICAgICAgICAgICAgICAgICAgfSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBwb3J0RGF0YSA9IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50cnk6IHBvcnRTdHJpbmdzLnBvcCgpLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgY2l0eTogcG9ydFN0cmluZ3Muam9pbignLCAnKVxuLy8gICAgICAgICAgICAgICAgICAgICB9O1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIHBvcnREYXRhLm5hbWUgPSAkaW50ZXJwb2xhdGUoXCJ7eyBjaXR5IH19LCB7eyBjb3VudHJ5IH19XCIpKHBvcnREYXRhKTtcblxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gcG9ydERhdGE7XG4vLyAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICBfY2xlYW5VcEJvb2tpbmdTdW1tYXJ5OiBmdW5jdGlvbiAoYm9va2luZ1N1bW1hcnkpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIC8vIFN0YXRlcm9vbSBmaWxlIG5hbWUgaXMgdXBwZXJjYXNlLCBzaGlwIGltYWdlIGlzIGxvd2VyY2FzZVxuLy8gICAgICAgICAgICAgICAgICAgICBib29raW5nU3VtbWFyeS5zdGF0ZXJvb21JbWFnZSA9ICRpbnRlcnBvbGF0ZShSb3V0aW5nVXRpbHNTZXJ2aWNlLmZyb250ZW5kQmFzZVVybChcIi9pbWFnZXMvY3J1aXNlLXZhY2F0aW9uLW9uYm9hcmQvc2hpcHMve3sgc2hpcENvZGUgfX0vMTUwWEluc2lkZS5qcGdcIikpKGJvb2tpbmdTdW1tYXJ5KTtcbi8vICAgICAgICAgICAgICAgICAgICAgYm9va2luZ1N1bW1hcnkuc2hpcEltYWdlID0gJGludGVycG9sYXRlKFJvdXRpbmdVdGlsc1NlcnZpY2UuZnJvbnRlbmRCYXNlVXJsKFwiL2Fzc2V0cy9kZWNrcGxhbnMvc2hpcHMve3sgc2hpcENvZGUgfCBsb3dlcmNhc2UgfX0uanBnXCIpKShib29raW5nU3VtbWFyeSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIGJvb2tpbmdTdW1tYXJ5Lm1hcEltYWdlID0gJGludGVycG9sYXRlKFJvdXRpbmdVdGlsc1NlcnZpY2UuZnJvbnRlbmRCYXNlVXJsKFwiL2ltYWdlcy9pdGluZXJhcnlNYXBzL3t7IGl0aW5lcmFyeUNvZGUgfX0uanBnXCIpKShib29raW5nU3VtbWFyeSk7XG5cbi8vICAgICAgICAgICAgICAgICAgICAgLy8gRml4IHVwIEl0aW5lcmFyeSBEYXRhXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBpdGluZXJhcnlEYXlMaXN0ID0gYm9va2luZ1N1bW1hcnkuaXRpbmVyYXJ5Lml0aW5lcmFyeURheUxpc3Q7XG4vLyAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaXRpbmVyYXJ5RGF5TGlzdC5sZW5ndGg7IGkrKykge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGRheSA9IGl0aW5lcmFyeURheUxpc3RbaV07XG5cbi8vICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IChKRE0pIHRoZSBzZXJ2ZXIgc2hvdWxkIGJlIGdpdmluZyB1cyBkYXRlcyBpbiB0aGUgZm9ybWF0IGl0IGV4cGVjdHMgdG8gcmVjZWl2ZVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlbVxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgZGF5LnNlcnZpY2VEYXRlQ29kZSA9ICRpbnRlcnBvbGF0ZSgne3sgZGF0ZSB8IGRhdGUgOiBcInl5eXlNTWRkXCIgfX0nKShkYXkpO1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgZGF5LnBvcnROYW1lU2hvcnQgPSAkaW50ZXJwb2xhdGUoJ3t7IHBvcnROYW1lIHwgcG9ydE5hbWUgfX0nKShkYXkpO1xuLy8gICAgICAgICAgICAgICAgICAgICB9XG5cbi8vICAgICAgICAgICAgICAgICAgICAgYm9va2luZ1N1bW1hcnkuZGVwYXJ0dXJlUG9ydCA9IHNlbGYuX3BvcnRNZXRhZGF0YShpdGluZXJhcnlEYXlMaXN0WzBdKTtcbi8vICAgICAgICAgICAgICAgICAgICAgYm9va2luZ1N1bW1hcnkucmV0dXJuUG9ydCA9IHNlbGYuX3BvcnRNZXRhZGF0YShpdGluZXJhcnlEYXlMaXN0W2l0aW5lcmFyeURheUxpc3QubGVuZ3RoIC0gMV0pO1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIGJvb2tpbmdTdW1tYXJ5Lmhlcm9JbWFnZXMgPSBzZWxmLmdldEhlcm9JbWFnZShib29raW5nU3VtbWFyeS5pdGluZXJhcnlDb2RlKTtcblxuLy8gICAgICAgICAgICAgICAgICAgICBib29raW5nU3VtbWFyeS5pdGluZXJhcnkuYmVnaW5EYXRlID0gaXRpbmVyYXJ5RGF5TGlzdFswXS5hcnJpdmFsRGF0ZVRpbWU7XG4vLyAgICAgICAgICAgICAgICAgICAgIGJvb2tpbmdTdW1tYXJ5Lml0aW5lcmFyeS5lbmREYXRlID0gaXRpbmVyYXJ5RGF5TGlzdFtpdGluZXJhcnlEYXlMaXN0Lmxlbmd0aCAtIDFdLmFycml2YWxEYXRlVGltZTtcblxuLy8gICAgICAgICAgICAgICAgICAgICAvLyBzZXRzIGRheXMgdGlsbCBkZXBhcnR1cmUgZm9yIG1lc3NhZ2luZyBhcm91bmQgdGhlIDMgZGF5IHJ1bGUuXG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBkYXlzVGlsbERlcGFydHVyZSA9IDM7XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBkYXlzTGVmdCA9IFRpbWVVdGlsc1NlcnZpY2UuZGF5c0xlZnQoYm9va2luZ1N1bW1hcnkuaXRpbmVyYXJ5LmJlZ2luRGF0ZSwgbmV3IERhdGUoKSk7XG4vLyAgICAgICAgICAgICAgICAgICAgIGJvb2tpbmdTdW1tYXJ5LnB1cmNoYXNlc0FsbG93ZWQgPSAoZGF5c0xlZnQgPiBkYXlzVGlsbERlcGFydHVyZSk7IC8vIHJldHVybnMgdHJ1ZS9mYWxzZSAtXG4vLyAgICAgICAgICAgICAgICAgICAgIC8vIHRydWU6IHlvdSBjYW4gbWFrZVxuLy8gICAgICAgICAgICAgICAgICAgICAvLyBwdXJjaGFzZXMgLSBmYWxzZTogeW91XG4vLyAgICAgICAgICAgICAgICAgICAgIC8vIGNhbm5vdCBtYWtlIHB1cmNoYXNlc1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3NldEd1ZXN0RGlzcGxheU5hbWVzKGJvb2tpbmdTdW1tYXJ5Lmd1ZXN0cyk7XG4vLyAgICAgICAgICAgICAgICAgICAgIHNlbGYuX3NldEl0aW5lcmFyeURhdGUoYm9va2luZ1N1bW1hcnkuaXRpbmVyYXJ5Lml0aW5lcmFyeURheUxpc3QpO1xuXG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiBib29raW5nU3VtbWFyeTtcbi8vICAgICAgICAgICAgICAgICB9LFxuXG4vLyAgICAgICAgICAgICAgICAgLyoqXG4vLyAgICAgICAgICAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuLy8gICAgICAgICAgICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuQm9va2luZ1NlcnZpY2UjZ2V0SGVyb0ltYWdlXG4vLyAgICAgICAgICAgICAgICAgICogQG1ldGhvZE9mIG9sY2kuc2VydmljZXMuQm9va2luZ1NlcnZpY2Vcbi8vICAgICAgICAgICAgICAgICAgKiBAZGVzY3JpcHRpb24gbWFwIG9mIGhlcm8gaW1hZ2VzLCBlLmcuICdoZXJvLWl0aW5lcmFyeS1BLmpwZydcbi8vICAgICAgICAgICAgICAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBoZXJvIGltYWdlIG1hcFxuLy8gICAgICAgICAgICAgICAgICAqICovXG4vLyAgICAgICAgICAgICAgICAgZ2V0SGVyb0ltYWdlOiBmdW5jdGlvbiAoaXRpbmVyYXJ5SWQpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgaXRpbmVyYXJ5Q29kZSA9IGl0aW5lcmFyeUlkLnN1YnN0cmluZygwLCAyKTtcbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGRlc3RDb2RlID0gaXRpbmVyYXJ5Q29kZS5zdWJzdHJpbmcoMCwgMSk7XG5cbi8vICAgICAgICAgICAgICAgICAgICAgdmFyIGl0aW5lcmFyeUltYWdlID0gc2VsZi5oZXJvSW1hZ2VNYXBbaXRpbmVyYXJ5Q29kZV07XG4vLyAgICAgICAgICAgICAgICAgICAgIHZhciBkZXN0aW5hdGlvbkltYWdlID0gc2VsZi5oZXJvSW1hZ2VNYXBbZGVzdENvZGVdO1xuLy8gICAgICAgICAgICAgICAgICAgICB2YXIgaW1hZ2VzID0gc2VsZi5oZXJvSW1hZ2VNYXBbJ2RlZmF1bHQnXTtcblxuLy8gICAgICAgICAgICAgICAgICAgICBpZiAoaXRpbmVyYXJ5SW1hZ2UpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlcyA9IGl0aW5lcmFyeUltYWdlO1xuLy8gICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGRlc3RpbmF0aW9uSW1hZ2UpIHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlcyA9IGRlc3RpbmF0aW9uSW1hZ2U7XG4vLyAgICAgICAgICAgICAgICAgICAgIH1cblxuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnL2NvbnRlbnQvJythcHBOYW1lKycvY3J1aXNlLWV4cGVyaWVuY2Uvc2hvcmV4LycgKyBpbWFnZXMuc2hvcmV4LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnL2NvbnRlbnQvJythcHBOYW1lKycvY3J1aXNlLWV4cGVyaWVuY2UvaXRpbmVyYXJ5LycgKyBpbWFnZXMuaXRpbmVyYXJ5LFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJy9jb250ZW50LycrYXBwTmFtZSsnL2NydWlzZS1leHBlcmllbmNlL2hvbWUvJyArIGltYWdlcy5ob21lLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc3BhOiAnL2NvbnRlbnQvJythcHBOYW1lKycvY3J1aXNlLWV4cGVyaWVuY2Uvc3BhLycgKyBpbWFnZXMuc3BhXG4vLyAgICAgICAgICAgICAgICAgICAgIH07XG4vLyAgICAgICAgICAgICAgICAgfSxcblxuLy8gICAgICAgICAgICAgICAgIGhlcm9JbWFnZU1hcDoge1xuLy8gICAgICAgICAgICAgICAgICAgICAnQSc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUEuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LUEuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtQS5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdBQyc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUFDLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1BQy5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1BQy5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdBVCc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUFULmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1BVC5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1BVC5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdCJzoge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnaGVyby1pdGluZXJhcnktQi5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtQi5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1CLmpwZydcbi8vICAgICAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICAgICAgJ0MnOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1DLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1DLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBob21lOiAnaGVyby1ob21lLUMuanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnQ0UnOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1DRS5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtQ0UuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtQ0UuanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnQ0YnOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1DRi5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtQ0YuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtQ0YuanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnQ1MnOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1DUy5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtQ1MuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtQ1MuanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnQ1cnOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1DVy5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtQ1cuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtQ1cuanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnRSc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUUuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LUUuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtRS5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdFQic6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUVCLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1FQi5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1FQi5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdFQyc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUVDLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1FQy5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1FQy5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdFTSc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUVNLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1FTS5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1FTS5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdFTic6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUVOLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1FTi5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1FTi5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdFVCc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUVULmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1FVC5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1FVC5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdFVyc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUVXLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1FVy5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1FVy5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdIJzoge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnaGVyby1pdGluZXJhcnktSC5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtSC5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1ILmpwZydcbi8vICAgICAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICAgICAgJ0knOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1JLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1JLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBob21lOiAnaGVyby1ob21lLUkuanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnSUEnOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1JQS5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtSUEuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtSUEuanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnSUYnOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1JRi5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtSUYuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtSUYuanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnTCc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LUwuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LUwuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtTC5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdNJzoge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnaGVyby1pdGluZXJhcnktTS5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtTS5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1NLmpwZydcbi8vICAgICAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICAgICAgJ04nOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1OLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1OLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBob21lOiAnaGVyby1ob21lLU4uanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnTyc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LU8uanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LU8uanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtTy5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdQJzoge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnaGVyby1pdGluZXJhcnktUC5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtUC5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1QLmpwZydcbi8vICAgICAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICAgICAgJ1MnOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1TLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1TLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBob21lOiAnaGVyby1ob21lLVMuanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnU04nOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1TTi5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtU04uanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtU04uanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnVCc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LVQuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LVQuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtVC5qcGcnXG4vLyAgICAgICAgICAgICAgICAgICAgIH0sXG4vLyAgICAgICAgICAgICAgICAgICAgICdXJzoge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnaGVyby1pdGluZXJhcnktVy5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc2hvcmV4OiAnaGVyby1zaG9yZXgtVy5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaG9tZTogJ2hlcm8taG9tZS1XLmpwZydcbi8vICAgICAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICAgICAgJ1dBJzoge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnaGVyby1pdGluZXJhcnktV0EuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LVdBLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBob21lOiAnaGVyby1ob21lLVdBLmpwZydcbi8vICAgICAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICAgICAgJ1dGJzoge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnaGVyby1pdGluZXJhcnktV0YuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LVdGLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBob21lOiAnaGVyby1ob21lLVdGLmpwZydcbi8vICAgICAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICAgICAgJ1dNJzoge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnaGVyby1pdGluZXJhcnktV00uanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LVdNLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBob21lOiAnaGVyby1ob21lLVdNLmpwZydcbi8vICAgICAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICAgICAgJ1dTJzoge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnaGVyby1pdGluZXJhcnktV1MuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LVdTLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBob21lOiAnaGVyby1ob21lLVdTLmpwZydcbi8vICAgICAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICAgICAgJ1dXJzoge1xuLy8gICAgICAgICAgICAgICAgICAgICAgICAgaXRpbmVyYXJ5OiAnaGVyby1pdGluZXJhcnktV1cuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LVdXLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBob21lOiAnaGVyby1ob21lLVdXLmpwZydcbi8vICAgICAgICAgICAgICAgICAgICAgfSxcbi8vICAgICAgICAgICAgICAgICAgICAgJ1gnOiB7XG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBpdGluZXJhcnk6ICdoZXJvLWl0aW5lcmFyeS1YLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBzaG9yZXg6ICdoZXJvLXNob3JleC1YLmpwZycsXG4vLyAgICAgICAgICAgICAgICAgICAgICAgICBob21lOiAnaGVyby1ob21lLVguanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9LFxuLy8gICAgICAgICAgICAgICAgICAgICAnZGVmYXVsdCc6IHtcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGl0aW5lcmFyeTogJ2hlcm8taXRpbmVyYXJ5LWRlZmF1bHQuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIHNob3JleDogJ2hlcm8tc2hvcmV4LWRlZmF1bHQuanBnJyxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgIGhvbWU6ICdoZXJvLWhvbWUtZGVmYXVsdC5qcGcnLFxuLy8gICAgICAgICAgICAgICAgICAgICAgICAgc3BhOiAnaGVyby1zcGEuanBnJ1xuLy8gICAgICAgICAgICAgICAgICAgICB9XG4vLyAgICAgICAgICAgICAgICAgfVxuXG4vLyAgICAgICAgICAgICB9O1xuLy8gICAgICAgICB9XSk7XG4iLCIvKlxuICogQnJvd3NlclNlcnZpY2UuanNcbiAqXG4gKiBDcmVhdGVkOiBXZWRuZXNkYXksIEphbnVhcnkgNywgMjAxNVxuICogKGMpIENvcHlyaWdodCAyMDE0IEhvbGxhbmQgQW1lcmljYSwgSW5jLiAtIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqIFRoaXMgaXMgdW5wdWJsaXNoZWQgcHJvcHJpZXRhcnkgc291cmNlIGNvZGUgb2YgSG9sbGFuZCBBbWVyaWNhLCBJbmMuXG4gKiBUaGUgY29weXJpZ2h0IG5vdGljZSBhYm92ZSBkb2VzIG5vdCBldmlkZW5jZSBhbnkgYWN0dWFsIG9yIGludGVuZGVkXG4gKiBwdWJsaWNhdGlvbiBvZiBzdWNoIHNvdXJjZSBjb2RlLlxuICovXG5cblxuLypcbiAqIHJldHVybiBicm93c2VyIHR5cGVcbiAqIGNvdWxkIGJlIGV4dGVuZGVkIHRvIGdpdmUgdmVyc2lvbiBhcyB3ZWxsXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ29sY2kuc2VydmljZXMuQnJvd3NlclNlcnZpY2UnLCBbXG5cbl0pXG5cbiAgICAuc2VydmljZSgnQnJvd3NlclNlcnZpY2UnLCBmdW5jdGlvbiAoJHdpbmRvdykge1xuXG4gICAgICAgIHZhciBzZWxmID0ge1xuXG4gICAgICAgICAgICBfYnJvd3NlclR5cGU6IHVuZGVmaW5lZCxcblxuICAgICAgICAgICAgZ2V0QnJvd3NlclR5cGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLl9icm93c2VyVHlwZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5fYnJvd3NlclR5cGU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5fYnJvd3NlclR5cGUgPSBcInVua25vd25cIjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVzZXJBZ2VudCA9ICR3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgICAgICAgICAgICAgICAgICAgLy8gb3JkZXIgaXMgaW1wb3J0YW50LCBkbyBub3QgY2hhbmdlIG9yZGVyaW5nIG9mIHRoZXNlIHN0cmluZ3NcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJyb3dzZXJzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2FmYXJpOiAvc2FmYXJpL2ksXG4gICAgICAgICAgICAgICAgICAgICAgICBjaHJvbWU6IC9jaHJvbWUvaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpcmVmb3g6IC9maXJlZm94L2ksXG4gICAgICAgICAgICAgICAgICAgICAgICBvcGVyYTogL29wci9pLFxuICAgICAgICAgICAgICAgICAgICAgICAgaWU6IC8uTkVUL1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gYnJvd3NlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1c2VyQWdlbnQubWF0Y2goYnJvd3NlcnNba2V5XSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLl9icm93c2VyVHlwZSA9IGtleTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2VsZi5fYnJvd3NlclR5cGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHNlbGY7XG5cbiAgICB9KTtcblxuIiwiXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG9sY2kuc2VydmljZXMuQ2hhbmdlUGFnZVNlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIHRoYXQgY2hhbmdlcyBwYWdlIGFuZCBhbGwgYXNzb2NpYXRlZCBsb2dpYy5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29sY2kuc2VydmljZXMuQ2hhbmdlUGFnZVNlcnZpY2UnLCBbXG4gICAgJ3VpLnJvdXRlcicsXG4gICAgJ25nU3RvcmFnZScsXG4gICAgJ0FwcGxpY2F0aW9uQ29uZmlndXJhdGlvbidcbl0pXG5cbi5mYWN0b3J5KCdDaGFuZ2VQYWdlU2VydmljZScsIGZ1bmN0aW9uKCRzdGF0ZSwgJHNlc3Npb25TdG9yYWdlLCAkcSwgJHJvb3RTY29wZSwgQ29uZmlndXJhdGlvbikge1xuXG4gICAgdmFyIHBhZ2VzID0gKENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGUgPT09ICdIQUwnKSA/XG4gICAgW1xuICAgICAgICAnc2VsZWN0R3Vlc3QnLFxuICAgICAgICAnZGV0YWlscycsXG4gICAgICAgICdmbGlnaHRzJyxcbiAgICAgICAgJ2VtZXJnZW5jeScsXG4gICAgICAgICdhY2NvdW50JyxcbiAgICAgICAgJ2NvbnRyYWN0JyxcbiAgICAgICAgJ3N1bW1hcnknXG4gICAgXSA6IFtcbiAgICAgICAgJ3NlbGVjdEd1ZXN0JyxcbiAgICAgICAgJ2RldGFpbHMnLFxuICAgICAgICAnZmxpZ2h0cycsXG4gICAgICAgICdlbWVyZ2VuY3knLFxuICAgICAgICAnYWNjb3VudCcsXG4gICAgICAgICdjb250cmFjdCcsXG4gICAgICAgICdwcmVmZXJlbmNlcycsXG4gICAgICAgICdzdW1tYXJ5J1xuICAgIF07XG5cblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuQ2hhbmdlUGFnZVNlcnZpY2UjbmV4dFBhZ2VcbiAgICAgICAgICogQG1ldGhvZE9mIG9sY2kuc2VydmljZXMuQ2hhbmdlUGFnZVNlcnZpY2VcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIENoYW5nZXMgc3RhdGUgdG8gbmV4dCBwYWdlIGluIHBhZ2VzIGFycmF5LlxuICAgICAgICAgKiAqL1xuICAgICAgICBuZXh0UGFnZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGN1cnJTdGF0ZUluZGV4ID0gcGFnZXMuaW5kZXhPZiggJHN0YXRlLmN1cnJlbnQubmFtZSApO1xuICAgICAgICAgICAgJHN0YXRlLmdvKCBwYWdlc1tjdXJyU3RhdGVJbmRleCArIDFdICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5DaGFuZ2VQYWdlU2VydmljZSNnZXRQYWdlc1xuICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5DaGFuZ2VQYWdlU2VydmljZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gUmV0dXJucyBhcnJheSBvZiBwYWdlIG5hbWVzLlxuICAgICAgICAgKiAqL1xuICAgICAgICBnZXRQYWdlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHBhZ2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5DaGFuZ2VQYWdlU2VydmljZSNnb1RvUGFnZVxuICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5DaGFuZ2VQYWdlU2VydmljZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gQ2hhbmdlcyBzdGF0ZSB0byBzcGVjaWZpZWQgcGFnZS5cbiAgICAgICAgICogKi9cbiAgICAgICAgLy8gZ29Ub1BhZ2U6IGZ1bmN0aW9uKCBwYWdlTmFtZSApIHtcbiAgICAgICAgLy8gICAgICRzdGF0ZS5nbyggcGFnZU5hbWUgKTtcbiAgICAgICAgLy8gfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkNoYW5nZVBhZ2VTZXJ2aWNlI3VwZGF0ZVBhZ2VcbiAgICAgICAgICogQG1ldGhvZE9mIG9sY2kuc2VydmljZXMuQ2hhbmdlUGFnZVNlcnZpY2VcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIFVwZGF0ZXMgY3VycmVudCBwYWdlLlxuICAgICAgICAgKiAqL1xuICAgICAgICAvLyB1cGRhdGVQYWdlOiBmdW5jdGlvbiggcGFnZU5hbWUgKSB7XG4gICAgICAgIC8vICAgICBjdXJyUGFnZSA9IHBhZ2VzLmluZGV4T2YocGFnZU5hbWUpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgLy8gVE9ETzogTG9naWMgZm9yIEJhcmNsYXkncyBvZmZlclxuICAgICAgICAvLyBUT0RPOiBMb2dpYyBmb3Igd2hlbiB1c2VyIGNsaWNrcyAnY29udGludWUnIGFuZCBzZXNzaW9uIGhhcyBleHBpcmVkP1xuXG4gICAgfTtcbn0pO1xuIiwiLypcbiAqIENoYXRDYWxsU2VydmljZS5qc1xuICpcbiAqIENyZWF0ZWQ6IFR1ZXNkYXksIFNlcHRlbWJlciAwOSwgMjAxNFxuICogKGMpIENvcHlyaWdodCAyMDE0IEhvbGxhbmQgQW1lcmljYSwgSW5jLiAtIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqIFRoaXMgaXMgdW5wdWJsaXNoZWQgcHJvcHJpZXRhcnkgc291cmNlIGNvZGUgb2YgSG9sbGFuZCBBbWVyaWNhLCBJbmMuXG4gKiBUaGUgY29weXJpZ2h0IG5vdGljZSBhYm92ZSBkb2VzIG5vdCBldmlkZW5jZSBhbnkgYWN0dWFsIG9yIGludGVuZGVkXG4gKiBwdWJsaWNhdGlvbiBvZiBzdWNoIHNvdXJjZSBjb2RlLlxuICovXG5cbi8qKlxuICogQG5nZG9jIG92ZXJ2aWV3XG4gKiBAbmFtZSBob21lUGFnZS5zZXJ2aWNlcy5DaGF0Q2FsbFNlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBBbiBlbXB0eSBtb2R1bGUgZGVzY3JpcHRpb24uIFBsZWFzZSBmaWxsIGluIGEgaGlnaCBsZXZlbCBkZXNjcmlwdGlvbiBvZiB0aGlzIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ29sY2kuc2VydmljZXMuQ2hhdENhbGxTZXJ2aWNlJywgW1xuICAgICdvbGNpLnNlcnZpY2VzLkZyb250RW5kTGlua1NlcnZpY2UnXG5cbl0pXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIGhvbWVQYWdlLnNlcnZpY2VzLkNoYXRDYWxsU2VydmljZVxuICogQGRlc2NyaXB0aW9uIEFuIGVtcHR5IHNlcnZpY2UgZGVzY3JpcHRpb24uIFBsZWFzZSBmaWxsIGluIGEgaGlnaCBsZXZlbCBkZXNjcmlwdGlvbiBvZiB0aGlzIHNlcnZpY2UuXG4gKi9cbiAgICAuc2VydmljZSgnQ2hhdENhbGxTZXJ2aWNlJywgZnVuY3Rpb24gKCRxLCAkaHR0cCwgRnJvbnRFbmRMaW5rU2VydmljZSkge1xuICAgICAgICBcbiAgICAgICAgdmFyIGxvYWRlZENoYXRDYWxsRGF0YSA9IG51bGw7XG4gICAgICAgIHZhciBsb2FkQ2hhdENhbGxQcm9taXNlID0gZmFsc2U7XG5cbiAgICAgICAgdmFyIGxvYWRDaGF0Q2FsbERhdGEgPSBmdW5jdGlvbihtYWluTWVudUl0ZW0sIHN1Yk1lbnVJdGVtLCByZXF1ZXN0UGFnZSwgZm9yY2Upe1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIC8vIHZhciB1cmxSZXF1ZXN0ID0gRnJvbnRFbmRMaW5rU2VydmljZS5nZXRDaGF0Q2FsbFRlbXBsYXRlKCk7XG4gICAgICAgICAgICB2YXIgdXJsUmVxdWVzdCA9ICcvb2xjaS9mcm9udGVuZC9tYWluL0xvYWRDaGF0Q2FsbERhdGEuYWN0aW9uJztcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYobG9hZENoYXRDYWxsUHJvbWlzZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsb2FkQ2hhdENhbGxQcm9taXNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAkaHR0cCh7XG4gICAgICAgICAgICAgICAgdXJsOiB1cmxSZXF1ZXN0LFxuICAgICAgICAgICAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICAgICAgICAgICAgZGF0YTogXCJtYWluTWVudUl0ZW09XCIgKyBlbmNvZGVVUklDb21wb25lbnQobWFpbk1lbnVJdGVtKSArIFwiJnN1Yk1lbnVJdGVtPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHN1Yk1lbnVJdGVtKSArIFwiJnJlcXVlc3RQYWdlPVwiICsgZW5jb2RlVVJJQ29tcG9uZW50KHJlcXVlc3RQYWdlKSxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkOyBjaGFyc2V0PXV0Zi04J1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpe1xuICAgICAgICAgICAgICAgIHNlbGYubG9hZGVkQ2hhdENhbGxEYXRhID0gZGF0YTtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcpe1xuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdChkYXRhKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsb2FkQ2hhdENhbGxQcm9taXNlID0gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9O1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgZ2V0Q2hhdENhbGxEYXRhOiBmdW5jdGlvbihtYWluTWVudUl0ZW0sIHN1Yk1lbnVJdGVtLCByZXF1ZXN0UGFnZSkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZENoYXRDYWxsRGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGxvYWRlZENoYXRDYWxsRGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbG9hZENoYXRDYWxsRGF0YShtYWluTWVudUl0ZW0sIHN1Yk1lbnVJdGVtLCByZXF1ZXN0UGFnZSkudGhlbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuIiwiXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkNyZWRpdENhcmRTZXJ2aWNlXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSB0aGF0IGZpbmRzIGFuZCByZXR1cm5zIGEgcHJvbWlzZSBmb3IgYSBib29raW5nIEpTT04gb2JqZWN0LlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb2xjaS5zZXJ2aWNlcy5DcmVkaXRDYXJkU2VydmljZScsIFtcbiAgICAncmVzdGFuZ3VsYXInLFxuICAgICdvbGNpLnNlcnZpY2VzLlRyYW5zZm9ybVV0aWxzU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuU2VyaWFsaXplU2VydmljZScsXG4gICAgJ25nU3RvcmFnZScsXG4gICAgJ0FwcGxpY2F0aW9uQ29uZmlndXJhdGlvbidcbl0pXG5cbi5jb25maWcoZnVuY3Rpb24oICRodHRwUHJvdmlkZXIgKSB7XG4gICAgJGh0dHBQcm92aWRlci5kZWZhdWx0cy53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuY2FjaGUgPSB0cnVlO1xuICAgICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5wb3N0ID0ge1xuICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnY2xpZW50LWlkJzogJ3NlY29uZGFyeUZsb3cnLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbiAgICB9O1xufSlcblxuLmZhY3RvcnkoJ0NyZWRpdENhcmRTZXJ2aWNlJywgZnVuY3Rpb24oICRzZXNzaW9uU3RvcmFnZSwgUmVzdGFuZ3VsYXIsIFRyYW5zZm9ybVV0aWxzU2VydmljZSwgU2VyaWFsaXplU2VydmljZSwgQ29uZmlndXJhdGlvbiwgJHEgKSB7XG4gICAgLy9UT0RPOiBzd2FwIGNvdW50cnkgY29kZSBmb3IgY3VycmVudCB1c2VyJ3MgY291bnRyeSBDb2RlXG4gICAgdmFyIGNyZWRpdENhcmRTZXJ2aWNlID0ge1xuICAgICAgICBjcmVkaXRDYXJkQmFzZVVybDogUmVzdGFuZ3VsYXIub25lKCAnY2hlY2tpbi92MS4wLjAnIClcbiAgICAgICAgICAgIC5vbmUoICdjb21wYW55Q29kZScsIENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGUgKVxuICAgICAgICAgICAgLy8gLm9uZSggJ2NvdW50cnlDb2RlJywgJHNlc3Npb25TdG9yYWdlLmN1cnJlbnRVc2VyLmNvdW50cnlDb2RlIClcbiAgICAgICAgICAgIC5vbmUoICdjb3VudHJ5Q29kZScsICdVUycgKVxuICAgICAgICAgICAgLy8gLm9uZSggJ2Jvb2tpbmcnLCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uYm9va2luZ051bWJlciApXG4gICAgICAgICAgICAub25lKCAnYm9va2luZycsICdhY2NvdW50cycpLFxuICAgICAgICAgICAgLy8gLmFsbCggJ2FjY291bnRzJyksXG5cbiAgICAgICAgZUNvbUJhc2VVcmw6IFJlc3Rhbmd1bGFyLm9uZSggJ2NyZWRpdGNhcmQvdjEuMC4wJywgQ29uZmlndXJhdGlvbi5jb21wYW55Q29kZSApLFxuXG4gICAgICAgIHJlbW92ZUNhcmQ6IGZ1bmN0aW9uKCBjYXJkICkge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIHZhciBjYXJkVG9SZW1vdmUgPSBjYXJkLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgICAgIGNyZWRpdENhcmRTZXJ2aWNlLmNyZWRpdENhcmRCYXNlVXJsLmN1c3RvbURFTEVURSggJ3BheWVycy8nICsgY2FyZFRvUmVtb3ZlICkudGhlbihcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiggcmVzICkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggJ2NhcmQgZGVsZXRlZDogJywgcmVzICk7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoIHJlcyApO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCBlcnIgKTtcbiAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBicm9hZGNhc3Qgc29tZSBlcnJvclxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RW5jcnlwdGVkQ2FyZDogZnVuY3Rpb24oIGNjTnVtYmVyICkge1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYuZUNvbUJhc2VVcmwucG9zdCgnZW5jcnlwdENyZWRpdENhcmQnLCB7IFwiY2NOdW1iZXJcIjogY2NOdW1iZXJ9LCBudWxsLCB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ30pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZENhcmQ6IGZ1bmN0aW9uKCBjYXJkLCBjY1R5cGUsIHBhc3NlbmdlciApIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgICAgIHZhciB0eXBlID0gZ2V0Q2FyZFR5cGVDb2RlKCBjY1R5cGUgKTtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAgICAgY3JlZGl0Q2FyZFNlcnZpY2UuZ2V0RW5jcnlwdGVkQ2FyZCggY2FyZC5jY051bWJlciApLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgICAgICAgICAgICB2YXIgbmV3Q2FyZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgXCJjaGVja2luUGF5ZXJcIjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJpZENoZWNraW5cIjogcGFzc2VuZ2VyLkNoZWNrSW5QYXNzZW5nZXIuaWRDaGVja2luLnRvU3RyaW5nKCksXG4gICAgICAgICAgICAgICAgICAgICAgICBcImd1ZXN0SWRcIjogJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmJvb2tpbmdOdW1iZXIgKyB6ZXJvUGFkKCBwYXNzZW5nZXIuc2VxTnVtYmVyICkgKyBwYXNzZW5nZXIuQ2hlY2tJblBhc3Nlbmdlci5wcm9kdWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJmaXJzdE5hbWVcIjogcGFzc2VuZ2VyLmZpcnN0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGFzdE5hbWVcIjogcGFzc2VuZ2VyLmxhc3ROYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJjcmVkaXRDYXJkTGFzdEZvdXJcIjogY2FyZC5jY051bWJlci5zbGljZSgtNCksXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNyZWRpdENhcmRUeXBlXCI6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNyZWRpdENhcmRFeHBpcmVNb250aFwiOiBjYXJkLmV4cERhdGUuc3Vic3RyKDAsMiksXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNyZWRpdENhcmRFeHBpcmVZZWFyXCI6IGNhcmQuZXhwRGF0ZS5zbGljZSgtNCksXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNyZWRpdENhcmROdW1iZXJcIjogcmVzLmVuY3J5cHRlZENDLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJjcmVkaXRDYXJkTmFtZVwiOiBjYXJkLmNjTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYWRkcmVzczFcIjogY2FyZC5hZGRyZXNzLnN0cmVldDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBcImFkZHJlc3MyXCI6IGNhcmQuYWRkcmVzcy5zdHJlZXQyLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lQ2l0eVwiOiBjYXJkLmFkZHJlc3MuY2l0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29kZVN0YXRlXCI6IGNhcmQuYWRkcmVzcy5zdGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiY29kZVppcFwiOiBjYXJkLmFkZHJlc3MuemlwLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJjb2RlQ291bnRyeVwiOiBTZXJpYWxpemVTZXJ2aWNlLnNlcmlhbGl6ZUNvdW50cnkoIGNhcmQuYWRkcmVzcy5jb3VudHJ5ICksXG4gICAgICAgICAgICAgICAgICAgICAgICBcImNvZGVDb1wiOiBDb25maWd1cmF0aW9uLmNvbXBhbnlDb2RlXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIFwiYm9va2luZ051bWJlclwiOiAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uYm9va2luZ051bWJlcixcbiAgICAgICAgICAgICAgICAgICAgXCJwYXhTZXF1ZW5jZVwiOiBwYXNzZW5nZXIuc2VxTnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICBcInNhaWxpbmdJZFwiOiAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uc2FpbGluZ0lkXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHNlbGYuY3JlZGl0Q2FyZEJhc2VVcmwuY3VzdG9tUE9TVCggbmV3Q2FyZCwgJ3BheWVycycsIG51bGwsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9ICkudGhlbihcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oIGNhcmQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBjYXJkICk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCBlcnJvciApICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCBlcnJvciApO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCBlcnJvciApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZENvdmVyZWRHdWVzdDogZnVuY3Rpb24oIGNvdmVyZWRHdWVzdCwgY2FyZCwgYm9va2luZ051bWJlciwgc2FpbGluZ0lkICkge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICAgICAgdmFyIG5ld0NvdmVyZWQgPSB7XG4gICAgICAgICAgICAgICAgXCJjaGVja2luQ292ZXJlZFwiOiB7XG4gICAgICAgICAgICAgICAgICAgIFwiaWRDaGVja2luUGF5ZXJcIjogY2FyZC5pZENoZWNraW5QYXllcixcbiAgICAgICAgICAgICAgICAgICAgXCJmaXJzdE5hbWVcIjogY292ZXJlZEd1ZXN0LmZpcnN0TmFtZSxcbiAgICAgICAgICAgICAgICAgICAgXCJsYXN0TmFtZVwiOiBjb3ZlcmVkR3Vlc3QubGFzdE5hbWUsXG4gICAgICAgICAgICAgICAgICAgIFwiY29kZUNvXCI6IENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGVcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIFwiYm9va2luZ051bWJlclwiOiBib29raW5nTnVtYmVyLFxuICAgICAgICAgICAgICAgIFwicGF4U2VxdWVuY2VcIjogY292ZXJlZEd1ZXN0LnNlcU51bWJlcixcbiAgICAgICAgICAgICAgICBcInNhaWxpbmdJZFwiOiBzYWlsaW5nSWRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGNyZWRpdENhcmRTZXJ2aWNlLmNyZWRpdENhcmRCYXNlVXJsLmN1c3RvbVBPU1QoIG5ld0NvdmVyZWQsICdjb3ZlcmVkUGFzc2VuZ2VycycsIG51bGwsIHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nfSApXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oIGNvdmVyaW5nICkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBjb3ZlcmluZyApO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCBlcnIgKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVtb3ZlQ292ZXJlZEd1ZXN0OiBmdW5jdGlvbiggaWRDaGVja2luQ292ZXJlZCApIHtcbiAgICAgICAgICAgIHJldHVybiBjcmVkaXRDYXJkU2VydmljZS5jcmVkaXRDYXJkQmFzZVVybC5jdXN0b21ERUxFVEUoICdjb3ZlcmVkUGFzc2VuZ2Vycy8nICsgaWRDaGVja2luQ292ZXJlZCApXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCByZXMgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24gKCBlcnIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlcnI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVmcmVzaENoZWNraW5Db3ZlcmVkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBjcmVkaXRDYXJkU2VydmljZS5jcmVkaXRDYXJkQmFzZVVybC5jdXN0b21HRVQoJ3BheWVycy9jb3ZlcmVkUGFzc2VuZ2VycycpLnRoZW4oZnVuY3Rpb24oIGNoZWNrSW5QYXNzZW5nZXJzICkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjaGVja0luUGFzc2VuZ2VycztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlZnJlc2hBY2NvdW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gY3JlZGl0Q2FyZFNlcnZpY2UuY3JlZGl0Q2FyZEJhc2VVcmwuZ2V0KCkudGhlbihmdW5jdGlvbiggYWNjb3VudHMgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjY291bnRzO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZ2V0Q2FyZFR5cGVDb2RlKCB0eXBlICkge1xuICAgICAgICB2YXIgY2FyZFR5cGVzID0ge1xuICAgICAgICAgICAgJ1ZJU0EnOiAnVkknLFxuICAgICAgICAgICAgJ01BU1RFUkNBUkQnOiAnTUMnLFxuICAgICAgICAgICAgJ0RJU0NPVkVSJzogJ0RDJyxcbiAgICAgICAgICAgICdBTUVSSUNBTkVYUFJFU1MnOiAnQVgnLFxuICAgICAgICAgICAgJ0RJTkVSU0NMVUInOiAnREMnXG4gICAgICAgIH07XG4gICAgICAgIHR5cGUgPSB0eXBlLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIHJldHVybiBjYXJkVHlwZXNbdHlwZV07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gemVyb1BhZCggbiwgd2lkdGgsIHogKSB7XG4gICAgICAgIHogPSB6IHx8ICcwJztcbiAgICAgICAgd2lkdGggPSB3aWR0aCB8fCAyO1xuICAgICAgICBuID0gbiArICcnO1xuICAgICAgICByZXR1cm4gbi5sZW5ndGggPj0gd2lkdGggPyBuIDogbmV3IEFycmF5KHdpZHRoIC0gbi5sZW5ndGggKyAxKS5qb2luKHopICsgbjtcbiAgICB9XG5cbiAgICByZXR1cm4gY3JlZGl0Q2FyZFNlcnZpY2U7XG5cblxufSk7XG4iLCIvKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkRhdGFUcmFuc2Zvcm1TZXJ2aWNlXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSB0aGF0IHNlcmlhbGl6ZXMgYW5kIGRlc2VyaWFsaXplcyBQT0xBUiAoYW5kIG90aGVyKSBkYXRhIGZvciBkaXNwbGF5IG9uIGVhY2ggcGFnZVxuICovXG5cbmFuZ3VsYXIubW9kdWxlKCdvbGNpLnNlcnZpY2VzLkRhdGFUcmFuc2Zvcm1TZXJ2aWNlJywgW1xuICAgICd2ZW5kb3Iuc3RlZWxUb2UnLFxuICAgICdvbGNpLnNlcnZpY2VzLlNoYXJlZERhdGFTZXJ2aWNlJyxcbiAgICAnb2xjaS5zZXJ2aWNlcy5UcmFuc2Zvcm1VdGlsc1NlcnZpY2UnLFxuICAgICdhbmd1bGFyLW1vbWVudGpzJyxcbiAgICAnbmdTdG9yYWdlJ1xuXSlcblxuLnNlcnZpY2UoJ0RhdGFUcmFuc2Zvcm1TZXJ2aWNlJywgZnVuY3Rpb24oIHN0ZWVsVG9lLCBTaGFyZWREYXRhU2VydmljZSwgJHEsIE1vbWVudEpTLCBUcmFuc2Zvcm1VdGlsc1NlcnZpY2UsICRzZXNzaW9uU3RvcmFnZSApIHtcblxuICAgIC8vVE9ETzogZmlndXJlIG91dCBob3cgdG8gcmVzb2x2ZSB0aGlzIGxpc3QgZnJvbSBzaGFyZWREYXRhU2VydmljZSBiZWZvcmUgc3RhcnRpbmcgdGhpcyBzZXJ2aWNlXG4gICAgdmFyIGNvdW50cmllcyA9IFsgXG4gICAgICAgIHtcImNvZGVcIjogXCJBRFwiLCBcIm5hbWVcIjogXCJBbmRvcnJhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQUVcIiwgXCJuYW1lXCI6IFwiVW5pdGVkIEFyYWIgRW1pcmF0ZXNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJBR1wiLCBcIm5hbWVcIjogXCJBTlRJR1VBIEFORCBCQVJCVURBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQUlcIiwgXCJuYW1lXCI6IFwiQU5HVUlMTEFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJBTVwiLCBcIm5hbWVcIjogXCJBUk1FTklBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQU5cIiwgXCJuYW1lXCI6IFwiTkVUSEVSTEFORFMgQU5USUxMRVNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJBT1wiLCBcIm5hbWVcIjogXCJBTkdPTEFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJBUlwiLCBcIm5hbWVcIjogXCJBcmdlbnRpbmFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJBU1wiLCBcIm5hbWVcIjogXCJBTUVSSUNBTiBTQU1PQVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkFUXCIsIFwibmFtZVwiOiBcIkF1c3RyaWFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJBVVwiLCBcIm5hbWVcIjogXCJBdXN0cmFsaWFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJBV1wiLCBcIm5hbWVcIjogXCJBcnViYVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkFaXCIsIFwibmFtZVwiOiBcIkFaRVJCQUlKQU5cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJCQVwiLCBcIm5hbWVcIjogXCJCT1NOSUEgSEVSWkVHT1ZJTkFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJCQlwiLCBcIm5hbWVcIjogXCJCYXJiYWRvc1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkJEXCIsIFwibmFtZVwiOiBcIkJBTkdMQURFU0hcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJCRVwiLCBcIm5hbWVcIjogXCJCZWxnaXVtXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQkZcIiwgXCJuYW1lXCI6IFwiQlVSS0lOQSBGQVNPXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQkdcIiwgXCJuYW1lXCI6IFwiQnVsZ2FyaWFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJCSFwiLCBcIm5hbWVcIjogXCJCYWhyYWluXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQklcIiwgXCJuYW1lXCI6IFwiQlVSVU5ESVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkJKXCIsIFwibmFtZVwiOiBcIkJFTklOXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQk1cIiwgXCJuYW1lXCI6IFwiQmVybXVkYVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkJOXCIsIFwibmFtZVwiOiBcIkJSVU5FSSBEQVJVU1NBTEFNXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQk9cIiwgXCJuYW1lXCI6IFwiQm9saXZpYVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkJSXCIsIFwibmFtZVwiOiBcIkJyYXppbFwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkJTXCIsIFwibmFtZVwiOiBcIkJhaGFtYXNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJCVFwiLCBcIm5hbWVcIjogXCJCSFVUQU5cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJCV1wiLCBcIm5hbWVcIjogXCJCT1RTV0FOQVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkJZXCIsIFwibmFtZVwiOiBcIkJFTEFSVVNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJCWlwiLCBcIm5hbWVcIjogXCJCZWxpemVcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJDQVwiLCBcIm5hbWVcIjogXCJDYW5hZGFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJDQ1wiLCBcIm5hbWVcIjogXCJDT0NPUyAoS0VFTElORykgSVNMQU5EU1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkNEXCIsIFwibmFtZVwiOiBcIkRFTU9DUkFUSUMgUkVQVUJMSUMgT0YgQ09OR09cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJDRlwiLCBcIm5hbWVcIjogXCJDRU5UUkFMIEFGUklDQSBSRVBcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJDR1wiLCBcIm5hbWVcIjogXCJDT05HT1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkNIXCIsIFwibmFtZVwiOiBcIlN3aXR6ZXJsYW5kXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQ0lcIiwgXCJuYW1lXCI6IFwiQ09URSBEIElWT0lSRVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkNLXCIsIFwibmFtZVwiOiBcIkNPT0sgSVNMQU5EU1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkNMXCIsIFwibmFtZVwiOiBcIkNoaWxlXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQ01cIiwgXCJuYW1lXCI6IFwiQ0FNRVJPT05cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJDTlwiLCBcIm5hbWVcIjogXCJDaGluYVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkNPXCIsIFwibmFtZVwiOiBcIkNvbG9tYmlhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQ1JcIiwgXCJuYW1lXCI6IFwiQ09TVEEgUklDQVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkNVXCIsIFwibmFtZVwiOiBcIkNVQkFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJDVlwiLCBcIm5hbWVcIjogXCJDQVBFIFZFUkRFXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQ1hcIiwgXCJuYW1lXCI6IFwiQ0hSSVNUTUFTIElTXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQ1lcIiwgXCJuYW1lXCI6IFwiQ3lwcnVzXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiQ1pcIiwgXCJuYW1lXCI6IFwiQ3plY2ggUmVwdWJsaWNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJERVwiLCBcIm5hbWVcIjogXCJHZXJtYW55XCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiREpcIiwgXCJuYW1lXCI6IFwiREpJQk9VVElcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJES1wiLCBcIm5hbWVcIjogXCJEZW5tYXJrXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiRE1cIiwgXCJuYW1lXCI6IFwiRE9NSU5JQ0FcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJET1wiLCBcIm5hbWVcIjogXCJEb21pbmljYW4gUmVwdWJsaWNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJEWlwiLCBcIm5hbWVcIjogXCJBTEdFUklBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiRUNcIiwgXCJuYW1lXCI6IFwiRWN1YWRvclwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkVFXCIsIFwibmFtZVwiOiBcIkVzdG9uaWFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJFR1wiLCBcIm5hbWVcIjogXCJFZ3lwdFwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkVIXCIsIFwibmFtZVwiOiBcIldFU1RFUk4gU0FIQVJBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiRVJcIiwgXCJuYW1lXCI6IFwiRVJJVFJFQVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkVTXCIsIFwibmFtZVwiOiBcIlNwYWluXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiRVRcIiwgXCJuYW1lXCI6IFwiRVRISU9QSUFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJGSVwiLCBcIm5hbWVcIjogXCJGaW5sYW5kXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiRkpcIiwgXCJuYW1lXCI6IFwiRklKSVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkZLXCIsIFwibmFtZVwiOiBcIkZBTEtMQU5EIElTTEFORFNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJGTVwiLCBcIm5hbWVcIjogXCJNSUNST05FU0lBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiRk9cIiwgXCJuYW1lXCI6IFwiRkFST0UgSVNMQU5EU1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkZSXCIsIFwibmFtZVwiOiBcIkZyYW5jZVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkZYXCIsIFwibmFtZVwiOiBcIkZyYW5jZVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkdBXCIsIFwibmFtZVwiOiBcIkdBQk9OXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiR0JcIiwgXCJuYW1lXCI6IFwiVW5pdGVkIGtpbmdkb21cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJHRFwiLCBcIm5hbWVcIjogXCJHcmVuYWRhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiR0VcIiwgXCJuYW1lXCI6IFwiR2VvcmdpYVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkdGXCIsIFwibmFtZVwiOiBcIkZSRU5DSCBHVUlBTkFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJHR1wiLCBcIm5hbWVcIjogXCJHVUVSTlNFWVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkdIXCIsIFwibmFtZVwiOiBcIkdIQU5BXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiR0lcIiwgXCJuYW1lXCI6IFwiR2licmFsdGFyXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiR0xcIiwgXCJuYW1lXCI6IFwiR1JFRU5MQU5EXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiR01cIiwgXCJuYW1lXCI6IFwiR0FNQklBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiR05cIiwgXCJuYW1lXCI6IFwiR1VJTkVBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiR1BcIiwgXCJuYW1lXCI6IFwiR1VBREVMT1VQRS9TVCBCQVJUSC9TVCBNQVJUSU5cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJHUVwiLCBcIm5hbWVcIjogXCJFUVVBVE9SSUFMIEdVSU5FQVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkdSXCIsIFwibmFtZVwiOiBcIkdyZWVjZVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkdUXCIsIFwibmFtZVwiOiBcIkd1YXRlbWFsYVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkdVXCIsIFwibmFtZVwiOiBcIkdVQU1cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJHV1wiLCBcIm5hbWVcIjogXCJHVUlORUEgQklTU0FVXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiR1lcIiwgXCJuYW1lXCI6IFwiR1VZQU5BXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiSEtcIiwgXCJuYW1lXCI6IFwiSG9uZyBLb25nXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiSE5cIiwgXCJuYW1lXCI6IFwiSG9uZHVyYXNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJIUlwiLCBcIm5hbWVcIjogXCJDcm9hdGlhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiSFRcIiwgXCJuYW1lXCI6IFwiSEFJVElcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJIVVwiLCBcIm5hbWVcIjogXCJIdW5nYXJ5XCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiSURcIiwgXCJuYW1lXCI6IFwiSW5kb25lc2lhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiSUVcIiwgXCJuYW1lXCI6IFwiSXJlbGFuZFwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIklMXCIsIFwibmFtZVwiOiBcIklzcmFlbFwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIklNXCIsIFwibmFtZVwiOiBcIklTTEUgT0YgTUFOXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiSU5cIiwgXCJuYW1lXCI6IFwiSW5kaWEvQW5kYW1hbiBJUy5cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJJT1wiLCBcIm5hbWVcIjogXCJCUklUSVNIIElORElBTiBPQ0VBTiBURVJSSVRPUllcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJJUVwiLCBcIm5hbWVcIjogXCJJcmFxXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiSVJcIiwgXCJuYW1lXCI6IFwiSXJhblwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIklTXCIsIFwibmFtZVwiOiBcIkljZWxhbmRcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJJVFwiLCBcIm5hbWVcIjogXCJJdGFseVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkpFXCIsIFwibmFtZVwiOiBcIkpFUlNFWVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkpNXCIsIFwibmFtZVwiOiBcIkphbWFpY2FcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJKT1wiLCBcIm5hbWVcIjogXCJKT1JEQU5cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJKUFwiLCBcIm5hbWVcIjogXCJKYXBhblwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIktFXCIsIFwibmFtZVwiOiBcIktFTllBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiS0dcIiwgXCJuYW1lXCI6IFwiS1JZR1lTVEFOXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiS0hcIiwgXCJuYW1lXCI6IFwiQ0FNQk9ESUFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJLSVwiLCBcIm5hbWVcIjogXCJLSVJJQkFUSVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIktNXCIsIFwibmFtZVwiOiBcIkNPTU9ST1NcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJLTlwiLCBcIm5hbWVcIjogXCJTdCBLaXR0cy9OZXZpc1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIktQXCIsIFwibmFtZVwiOiBcIktPUkVBIChOT1JUSClcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJLUlwiLCBcIm5hbWVcIjogXCJLb3JlYShTb3V0aClcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJLV1wiLCBcIm5hbWVcIjogXCJLdXdhaXRcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJLWVwiLCBcIm5hbWVcIjogXCJDYXltYW4gSXNsYW5kc1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIktaXCIsIFwibmFtZVwiOiBcIktBWkFLSFNUQU5cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJMQVwiLCBcIm5hbWVcIjogXCJMQU9TXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTEJcIiwgXCJuYW1lXCI6IFwiTEVCQU5PTlwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkxDXCIsIFwibmFtZVwiOiBcIlNhaW50IEx1Y2lhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTElcIiwgXCJuYW1lXCI6IFwiTGljaHRlbnN0ZWluXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTFRcIiwgXCJuYW1lXCI6IFwiTGl0aHVhbmlhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTEtcIiwgXCJuYW1lXCI6IFwiU1JJIExBTktBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTFJcIiwgXCJuYW1lXCI6IFwiTElCRVJJQVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIkxTXCIsIFwibmFtZVwiOiBcIkxFU09USE9cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJMVVwiLCBcIm5hbWVcIjogXCJMdXhlbWJvdXJnXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTFZcIiwgXCJuYW1lXCI6IFwiTGF0dmlhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTFlcIiwgXCJuYW1lXCI6IFwiTElCWUFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJNQVwiLCBcIm5hbWVcIjogXCJNb3JvY2NvXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTUNcIiwgXCJuYW1lXCI6IFwiTW9uYWNvXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTURcIiwgXCJuYW1lXCI6IFwiTU9MRE9WQVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIk1FXCIsIFwibmFtZVwiOiBcIk1PTlRFTkVHUk9cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJNR1wiLCBcIm5hbWVcIjogXCJNQURBR0FTQ0FSXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTUhcIiwgXCJuYW1lXCI6IFwiTUFSU0hBTEwgSVNMQU5EU1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIk1LXCIsIFwibmFtZVwiOiBcIk1hY2Vkb25pYVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIk1MXCIsIFwibmFtZVwiOiBcIk1BTElcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJNTVwiLCBcIm5hbWVcIjogXCJNWUFOTUFSL0JVUk1BXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTU5cIiwgXCJuYW1lXCI6IFwiTU9OR09MSUFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJNT1wiLCBcIm5hbWVcIjogXCJNQUNBVVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIk1QXCIsIFwibmFtZVwiOiBcIk5PUlRIRVJOIE1BUklBTkEgSVNMQU5EU1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIk1RXCIsIFwibmFtZVwiOiBcIk1hcnRpbmlxdWVcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJNUlwiLCBcIm5hbWVcIjogXCJNQVVSSVRBTklBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTVNcIiwgXCJuYW1lXCI6IFwiTU9OVFNFUlJBVFwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIk1UXCIsIFwibmFtZVwiOiBcIk1hbHRhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTVVcIiwgXCJuYW1lXCI6IFwiTUFVUklUSVVTXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTVZcIiwgXCJuYW1lXCI6IFwiTUFMRElWRVNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJNV1wiLCBcIm5hbWVcIjogXCJNQUxBV0lcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJNWFwiLCBcIm5hbWVcIjogXCJNZXhpY29cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJNWVwiLCBcIm5hbWVcIjogXCJNYWxheXNpYVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIk1aXCIsIFwibmFtZVwiOiBcIk1PWkFNQklRVUVcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJOQVwiLCBcIm5hbWVcIjogXCJOQU1JQklBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTkNcIiwgXCJuYW1lXCI6IFwiTkVXIENBTEVET05JQVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIk5FXCIsIFwibmFtZVwiOiBcIk5JR0VSXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTkZcIiwgXCJuYW1lXCI6IFwiTk9SRk9MSyBJU0xBTkRcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJOR1wiLCBcIm5hbWVcIjogXCJOaWdlcmlhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTklcIiwgXCJuYW1lXCI6IFwiTklDQVJBR1VBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTkxcIiwgXCJuYW1lXCI6IFwiTmV0aGVybGFuZHNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJOT1wiLCBcIm5hbWVcIjogXCJOb3J3YXlcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJOUFwiLCBcIm5hbWVcIjogXCJOZXBhbFwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIk5SXCIsIFwibmFtZVwiOiBcIk5BVVJVXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiTlVcIiwgXCJuYW1lXCI6IFwiTklVRVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIk5aXCIsIFwibmFtZVwiOiBcIk5ldyBaZWFsYW5kXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiT01cIiwgXCJuYW1lXCI6IFwiT21hblwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlBBXCIsIFwibmFtZVwiOiBcIlBhbmFtYVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlBFXCIsIFwibmFtZVwiOiBcIlBlcnVcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJQRlwiLCBcIm5hbWVcIjogXCJGUi4gUE9MWU5FU0lBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiUEdcIiwgXCJuYW1lXCI6IFwiUEFQVUEgTkVXIEdVSU5FQVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlBIXCIsIFwibmFtZVwiOiBcIlBoaWxpcHBpbmVzXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiUEtcIiwgXCJuYW1lXCI6IFwiUEFLSVNUQU5cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJQTFwiLCBcIm5hbWVcIjogXCJQb2xhbmRcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJQTVwiLCBcIm5hbWVcIjogXCJTVC4gUElFUlJFL01JUVVFTE9OXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiUFJcIiwgXCJuYW1lXCI6IFwiUHVlcnRvIFJpY29cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJQU1wiLCBcIm5hbWVcIjogXCJQQUxFU1RJTklBTiBURVJSSVRPUllcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJQVFwiLCBcIm5hbWVcIjogXCJQb3J0dWdhbFwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlBXXCIsIFwibmFtZVwiOiBcIlBBTEFVXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiUFlcIiwgXCJuYW1lXCI6IFwiUGFyYWd1YXlcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJRQVwiLCBcIm5hbWVcIjogXCJRYXRhclwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlJFXCIsIFwibmFtZVwiOiBcIlJFVU5JT05cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJST1wiLCBcIm5hbWVcIjogXCJSb21hbmlhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiUlNcIiwgXCJuYW1lXCI6IFwiU0VSQklBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiUlVcIiwgXCJuYW1lXCI6IFwiUnVzc2lhbiBGZWRlcmF0aW9uXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiUldcIiwgXCJuYW1lXCI6IFwiUldBTkRBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiU0FcIiwgXCJuYW1lXCI6IFwiU2F1ZGkgQXJhYmlhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiU0JcIiwgXCJuYW1lXCI6IFwiU09MT01PTiBJU0xBTkRTXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiU0NcIiwgXCJuYW1lXCI6IFwiU0VZQ0hFTExFU1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlNEXCIsIFwibmFtZVwiOiBcIlNVREFOXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiU0VcIiwgXCJuYW1lXCI6IFwiU3dlZGVuXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiU0dcIiwgXCJuYW1lXCI6IFwiU2luZ2Fwb3JlXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiU0hcIiwgXCJuYW1lXCI6IFwiU1QuSEVMRU5BXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiU0lcIiwgXCJuYW1lXCI6IFwiU2xvdmVuaWFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJTSlwiLCBcIm5hbWVcIjogXCJTVkFMQkFSRCBBTkQgSkFOIE1BWUVOIElTTEFORFNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJTS1wiLCBcIm5hbWVcIjogXCJTbG92YWsgUmVwdWJsaWNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJTTFwiLCBcIm5hbWVcIjogXCJTSUVSUkEgTEVPTkVcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJTTVwiLCBcIm5hbWVcIjogXCJTQU4gTUFSSU5PXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiU05cIiwgXCJuYW1lXCI6IFwiU2VuZWdhbFwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlNPXCIsIFwibmFtZVwiOiBcIlNPTUFMSUFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJTUlwiLCBcIm5hbWVcIjogXCJTVVJJTkFNRSBcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJTVFwiLCBcIm5hbWVcIjogXCJTQU8gVE9NRSBBTkQgUFJJTkNJUEVcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJTVlwiLCBcIm5hbWVcIjogXCJFbCBTYWx2YWRvclwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlNZXCIsIFwibmFtZVwiOiBcIlNZUklBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiU1pcIiwgXCJuYW1lXCI6IFwiU1dBWklMQU5EXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVENcIiwgXCJuYW1lXCI6IFwiVHVya3MvQ2FpY29zIElzbGFuZHNcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJURFwiLCBcIm5hbWVcIjogXCJDSEFEXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVEdcIiwgXCJuYW1lXCI6IFwiVE9HT1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlRIXCIsIFwibmFtZVwiOiBcIlRoYWlsYW5kXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVEpcIiwgXCJuYW1lXCI6IFwiVEFKSUtJU1RBTlwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlRMXCIsIFwibmFtZVwiOiBcIlRJTU9SLUxFU1RFXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVE5cIiwgXCJuYW1lXCI6IFwiVFVOSVNJQVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlRPXCIsIFwibmFtZVwiOiBcIlRPTkdBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVFJcIiwgXCJuYW1lXCI6IFwiVHVya2V5XCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVFRcIiwgXCJuYW1lXCI6IFwiVHJpbmlkYWQvVG9iYWdvXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVFZcIiwgXCJuYW1lXCI6IFwiVHV2YWx1XCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVFdcIiwgXCJuYW1lXCI6IFwiVEFJV0FOXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVFpcIiwgXCJuYW1lXCI6IFwiVEFOWkFOSUFcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJVQVwiLCBcIm5hbWVcIjogXCJVa3JhaW5lXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVUdcIiwgXCJuYW1lXCI6IFwiVUdBTkRBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVU1cIiwgXCJuYW1lXCI6IFwiVS5TLiBNSU5PUiBPVVRMWUlORyBJU0xBTkRTXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVVNcIiwgXCJuYW1lXCI6IFwiVW5pdGVkIFN0YXRlc1wifSxcbiAgICAgICAge1wiY29kZVwiOiBcIlVZXCIsIFwibmFtZVwiOiBcIlVydWd1YXlcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJVWlwiLCBcIm5hbWVcIjogXCJVWkJFS0lTVEFOXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVkNcIiwgXCJuYW1lXCI6IFwiU3QgVmluY2VudC9HcmVuYWRpbmVzXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVkVcIiwgXCJuYW1lXCI6IFwiVmVuZXp1ZWxhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVkdcIiwgXCJuYW1lXCI6IFwiVmlyZ2luIElTL0JyaXRpc2hcIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJWSVwiLCBcIm5hbWVcIjogXCJWaXJnaW4gSXNsYW5kc30sIFUuUy5cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJWTlwiLCBcIm5hbWVcIjogXCJWaWV0bmFtXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiVlVcIiwgXCJuYW1lXCI6IFwiVkFOVUFUVVwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIldGXCIsIFwibmFtZVwiOiBcIldBTExJUy9GVU5UVU5BIElTLlwifSxcbiAgICAgICAge1wiY29kZVwiOiBcIldTXCIsIFwibmFtZVwiOiBcIlNBTU9BXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiWUVcIiwgXCJuYW1lXCI6IFwiWUVNRU5cIn0sXG4gICAgICAgIHtcImNvZGVcIjogXCJZVFwiLCBcIm5hbWVcIjogXCJNQVlPVFRFXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiWkFcIiwgXCJuYW1lXCI6IFwiU291dGggQWZyaWNhXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiWk1cIiwgXCJuYW1lXCI6IFwiWkFNQklBXCJ9LFxuICAgICAgICB7XCJjb2RlXCI6IFwiWldcIiwgXCJuYW1lXCI6IFwiWklNQkFCV0VcIn1cbiAgICBdO1xuXG4gICAgZnVuY3Rpb24gZGVzZXJpYWxpemVWYWx1ZSggcHJvbWlzZSApIHtcbiAgICAgICAgaWYgKCAhcHJvbWlzZSApIHsgcmV0dXJuICcnOyB9XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICggY29kZSApIHtcbiAgICAgICAgICAgIGlmICggIWNvZGUgKSB7IHJldHVybiAnJzsgfSAvLyBUT0RPOiBSZXZpc2l0IHRoaXMgd2hlbiBhIGd1ZXN0IGRvZXNuJ3QgaGF2ZSBhbiBlbWVyZ2VuY3kgY29udGFjdC5cblxuICAgICAgICAgICAgdmFyIHJldHVyblByb21pc2UgPSBwcm9taXNlLnRoZW4oIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmV0dXJuT2JqID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICByZXN1bHQuZm9yRWFjaCggZnVuY3Rpb24gKCBvYmosIGluZGV4LCBhcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBjb2RlLnRvVXBwZXJDYXNlKCkgPT09IG9iai5jb2RlLnRvVXBwZXJDYXNlKCkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5PYmogPSBvYmoubGFiZWw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGlmICggcmV0dXJuT2JqICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuT2JqO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0pLmNhdGNoKCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignZGVzZXJpYWxpemVQcm9taXNlIGZhaWxlZCcpO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuUHJvbWlzZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgcmVsYXRpb25zaGlwcyA9ICggZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdmFsdWVzID0gU2hhcmVkRGF0YVNlcnZpY2UuZ2V0UmVsYXRpb25zaGlwcygpXG4gICAgICAgICAgICAudGhlbiggZnVuY3Rpb24oIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NoYXJlZERhdGFTZXJ2aWNlLmdldFJlbGF0aW9uc2hpcHMgcmVxdWVzdCBmYWlsZWQnKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRSZWxhdGlvbnNoaXBzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGRlc2VyaWFsaXplOiBkZXNlcmlhbGl6ZVZhbHVlKCB2YWx1ZXMgKVxuICAgICAgICB9O1xuICAgIH0pKCk7XG5cbiAgICB2YXIgZG9jVHlwZXMgPSAoIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IFNoYXJlZERhdGFTZXJ2aWNlLmdldERvY1R5cGVzKClcbiAgICAgICAgICAgIC50aGVuKCBmdW5jdGlvbiggcmVzdWx0ICkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignU2hhcmVkRGF0YVNlcnZpY2UuZ2V0RG9jVHlwZXMgcmVxdWVzdCBmYWlsZWQnKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXREb2NUeXBlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBkZXNlcmlhbGl6ZTogZGVzZXJpYWxpemVWYWx1ZSggdmFsdWVzIClcbiAgICAgICAgfTtcbiAgICB9KSgpO1xuXG5cbiAgICB2YXIgbGFuZ3VhZ2VzID0gKCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB2YWx1ZXMgPSBTaGFyZWREYXRhU2VydmljZS5nZXRTYWZldHlMYW5ndWFnZXMoKVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uKCByZXN1bHQgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdTaGFyZWREYXRhU2VydmljZS5nZXRTYWZldHlMYW5ndWFnZXMgcmVxdWVzdCBmYWlsZWQnKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRMYW5ndWFnZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZGVzZXJpYWxpemU6IGRlc2VyaWFsaXplVmFsdWUoIHZhbHVlcyApXG4gICAgICAgIH07XG4gICAgfSkoKTtcblxuXG5cbiAgICB2YXIgYWlycG9ydENpdGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IFNoYXJlZERhdGFTZXJ2aWNlLmdldEFpcnBvcnRDaXRpZXMoKVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHZhciByZXR1cm5WYWx1ZXMgPSByZXN1bHQubWFwKCBmdW5jdGlvbiAoIGNpdHkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IFwibGFiZWxcIjogY2l0eS52YWx1ZSwgXCJjb2RlXCI6IGNpdHkua2V5IH07ICBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWVzO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NoYXJlZERhdGFTZXJ2aWNlLmdldEFpcnBvcnRDaXRpZXMgcmVxdWVzdCBmYWlsZWQnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldEFpcnBvcnRDaXRpZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZGVzZXJpYWxpemU6IGRlc2VyaWFsaXplVmFsdWUoIHZhbHVlcyApIFxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvL2NvcGllcyBwcm9wZXJpZXMgZnJvbSBvbmUgb2JqZWN0IHRvIGFub3RoZXJcbiAgICBmdW5jdGlvbiB0cmFuc2Zvcm1PYmplY3QoIHJlYWRPYmosIHdyaXRlT2JqLCBwYXRocyApIHtcbiAgICAgICAgcGF0aHMuZm9yRWFjaChmdW5jdGlvbiggZWwsIGluZGV4LCBhcnJheSApIHtcbiAgICAgICAgICAgIHZhciByZWFkSXRlbSA9IHN0ZWVsVG9lLmRvKCByZWFkT2JqICkuZ2V0KCBlbC5yZWFkICk7XG4gICAgICAgICAgICBzdGVlbFRvZS5kbyggd3JpdGVPYmogKS5zZXQoIGVsLndyaXRlLCByZWFkSXRlbSApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBmdW5jdGlvbiBzZXJpYWxpemVPYmplY3QocmVhZE9iaiwgd3JpdGVPYmosIHBhdGhzKSB7XG4gICAgLy8gICAgIHBhdGhzLmZvckVhY2goZnVuY3Rpb24oZWwsIGluZGV4LCBhcnJheSkge1xuXG4gICAgLy8gICAgIH0pXG4gICAgLy8gfVxuXG4gICAgLy9ibGF6ZXMgYSBwYXRoIGludG8gYSBuZXN0ZWQgb2JqZWN0IGlmIGl0IGRvZXNuJ3QgZXhpc3QgYWxyZWFkeVxuICAgIC8vIGZ1bmN0aW9uIGNyZWF0ZU5lc3RlZE9iamVjdCggYmFzZSwgcGF0aCApIHtcbiAgICAvLyAgICAgYmFzZVsgcGF0aFswXSBdID0gYmFzZVsgcGF0aFswXSBdIHx8IHt9O1xuXG4gICAgLy8gICAgIHZhciBuZXdCYXNlID0gYmFzZVsgcGF0aFswXSBdO1xuICAgIC8vICAgICB2YXIgbmV3UGF0aCA9IHBhdGguc2xpY2UoMSk7XG4gICAgLy8gICAgIC8vIHBhdGguc2hpZnQoKTtcbiAgICAvLyAgICAgaWYgKHBhdGgubGVuZ3RoIDw9IDEpIHJldHVybjtcbiAgICAvLyAgICAgY3JlYXRlTmVzdGVkT2JqZWN0KCBuZXdCYXNlLCBwYXRoICk7XG4gICAgLy8gfVxuXG4gICAgZnVuY3Rpb24gYXNzaWduQ291bnRyeSggY291bnRyeUNvZGUgKSB7XG4gICAgICAgIHJldHVybiBTaGFyZWREYXRhU2VydmljZS5nZXRDb3VudHJpZXNGb3JtYXR0ZWQoKVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uKCBjb3VudHJ5TGlzdCApIHtcbiAgICAgICAgICAgICAgICB2YXIgY291bnRyeTtcbiAgICAgICAgICAgICAgICBjb3VudHJ5TGlzdC5jb3VudHJpZXMuZm9yRWFjaCggZnVuY3Rpb24oIGVsZW1lbnQsIGluZGV4ICl7XG4gICAgICAgICAgICAgICAgICAgIGlmICggZWxlbWVudC5oYXNPd25Qcm9wZXJ0eSggY291bnRyeUNvZGUgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50cnkgPSBlbGVtZW50W2NvdW50cnlDb2RlXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJldHVybiBjb3VudHJ5O1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYXNzaWduU3RhdGUoc3RhdGVDb2RlKSB7XG4gICAgICAgIHZhciByZXR1cm5WYWx1ZSA9IFNoYXJlZERhdGFTZXJ2aWNlLnN0YXRlcygpXG4gICAgICAgICAgICAudGhlbiggZnVuY3Rpb24oIHN0YXRlTGlzdCApIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdGU7XG4gICAgICAgICAgICAgICAgc3RhdGVMaXN0LlVTLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50LCBpbmRleCApe1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGVsZW1lbnQuaGFzT3duUHJvcGVydHkoIHN0YXRlQ29kZSApICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUgPSBlbGVtZW50W3N0YXRlQ29kZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJldHVyblZhbHVlO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VBY2NlcHRUZXJtc1N0cmluZyhtYWluUGFzc2VuZ2VyLCBzZWNvbmRQYXNzZW5nZXIpIHtcbiAgICAgICAgdmFyIHJpZ2h0Tm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgdmFyIHN0ckFjY2VwdGVkID0gJzwhLS0gbXBfdHJhbnNfZGlzYWJsZV9zdGFydCAtLT4nICsgXG4gICAgICAgICAgICBtYWluUGFzc2VuZ2VyLmZpcnN0TmFtZS50b1VwcGVyQ2FzZSgpICsgJyAnICtcbiAgICAgICAgICAgIG1haW5QYXNzZW5nZXIubGFzdE5hbWUudG9VcHBlckNhc2UoKSArIFxuICAgICAgICAgICAgJzwhLS0gbXBfdHJhbnNfZGlzYWJsZV9lbmQgLS0+IGFjY2VwdGVkIFRlcm1zICYgQ29uZGl0aW9ucyBvbiBiZWhhbGYgb2YgPCEtLSBtcF90cmFuc19kaXNhYmxlX3N0YXJ0IC0tPicgK1xuICAgICAgICAgICAgc2Vjb25kUGFzc2VuZ2VyLnRpdGxlICsgJyAnICtcbiAgICAgICAgICAgIHNlY29uZFBhc3Nlbmdlci5maXJzdE5hbWUgKyAnICcgK1xuICAgICAgICAgICAgc2Vjb25kUGFzc2VuZ2VyLmxhc3ROYW1lICtcbiAgICAgICAgICAgICc8IS0tIG1wX3RyYW5zX2Rpc2FibGVfZW5kIC0tPicgKyAnIG9uICcgK1xuICAgICAgICAgICAgcmlnaHROb3cudG9JU09TdHJpbmcoKTtcbiAgICAgICAgcmV0dXJuIHN0ckFjY2VwdGVkO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIHNlcmlhbGl6ZVNpZWJlbDogZnVuY3Rpb24oaW5wdXRTaWViZWwpIHtcbiAgICAgICAgICAgIC8vVE9ET1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlc2VyaWFsaXplUG9sYXI6IGZ1bmN0aW9uKGlucHV0UG9sYXIsIHRhcmdldCkge1xuICAgICAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgICAgIHZhciBpbnB1dCA9IGFuZ3VsYXIuY29weShpbnB1dFBvbGFyKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKGlucHV0UG9sYXIpO1xuXG4gICAgICAgICAgICB2YXIgcm9vdFBhdGhzID0gW1xuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2Jvb2tpbmdOdW1iZXInLCByZWFkOiAnYm9va2luZ051bWJlcid9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2Jvb2tpbmdTdGF0dXMnLCByZWFkOiAnYm9va2luZ1N0YXR1cyd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2Zyb21Qb3J0TmFtZScsIHJlYWQ6ICdmcm9tUG9ydE5hbWUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdmcm9tUG9ydENvZGUnLCByZWFkOiAnZnJvbVBvcnRDb2RlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnc2FpbGluZ0lkJywgcmVhZDogJ3NhaWxpbmdJZCd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ3N5bmNocm9uaXphdGlvbklEJywgcmVhZDogJ3N5bmNocm9uaXphdGlvbklEJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnc2hpcE5hbWUnLCByZWFkOiAnc2hpcE5hbWUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdzaGlwQ29kZScsIHJlYWQ6ICdzaGlwQ29kZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ3N0YXRlcm9vbUNhdGVnb3J5JywgcmVhZDogJ3N0YXRlcm9vbUNhdGVnb3J5J30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnc3RhdGVyb29tVHlwZScsIHJlYWQ6ICdzdGF0ZXJvb21UeXBlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnc3RhdGVyb29tTnVtYmVyJywgcmVhZDogJ3N0YXRlcm9vbU51bWJlcid9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ3RvUG9ydE5hbWUnLCByZWFkOiAndG9Qb3J0TmFtZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ3RvUG9ydENvZGUnLCByZWFkOiAndG9Qb3J0Q29kZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ3RyaXBEYXlzJywgcmVhZDogJ3RyaXBEYXlzJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnaXRpbmVyYXJ5TmFtZScsIHJlYWQ6ICdpdGluZXJhcnlOYW1lJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnY3VycmVuY3lDb2RlJywgcmVhZDogJ2N1cnJlbmN5Q29kZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2N1cnJlbmN5TmFtZScsIHJlYWQ6ICdjdXJyZW5jeU5hbWUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdjdXJyZW5jeVN5bWJvbCcsIHJlYWQ6ICdjdXJyZW5jeVN5bWJvbCd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ3JhdGVDb2RlJywgcmVhZDogJ3JhdGVDb2RlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAncmF0ZU5hbWUnLCByZWFkOiAncmF0ZU5hbWUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdkZXBvc2l0UGFpZCcsIHJlYWQ6ICdkZXBvc2l0UGFpZCd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2Z1bGxQYXltZW50UGFpZCcsIHJlYWQ6ICdmdWxsUGF5bWVudFBhaWQnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICd0YXhlc0FuZEZlZXNDb21iaW5lZCcsIHJlYWQ6ICd0YXhlc0FuZEZlZXNDb21iaW5lZCd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ3dlYkl0aW5lcmFyeUlkJywgcmVhZDogJ3dlYkl0aW5lcmFyeUlkJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnYWxsb3dFVScsIHJlYWQ6ICdhbGxvd0VVJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAndHJhdmVsSW5pdGlhdGl2ZVR5cGUnLCByZWFkOiAndHJhdmVsSW5pdGlhdGl2ZVR5cGUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdkZXN0aW5hdGlvbkNvZGUnLCByZWFkOiAnZGVzdGluYXRpb25Db2RlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnZGVzdGluYXRpb25OYW1lJywgcmVhZDogJ2Rlc3RpbmF0aW9uTmFtZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2Jvb2tpbmdEYXRlJywgcmVhZDogJ2Jvb2tpbmdEYXRlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnc2FpbERhdGUnLCByZWFkOiAnc2FpbERhdGUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdkaXNlbWJhcmtEYXRlJywgcmVhZDogJ2Rpc2VtYmFya0RhdGUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdhbW91bnRSZWNlaXZlZCcsIHJlYWQ6ICdhbW91bnRSZWNlaXZlZCd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ3RvdGFsQ3J1aXNlRmFyZUFtdCcsIHJlYWQ6ICd0b3RhbENydWlzZUZhcmVBbXQnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdjcmVkaXRDYXJkRmVlcycsIHJlYWQ6ICdjcmVkaXRDYXJkRmVlcyd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2RlY2tDb2RlJywgcmVhZDogJ2NhYmluSW5mby5kZWNrQ29kZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2NhYmluTnVtYmVyJywgcmVhZDogJ2NhYmluSW5mby5jYWJpbk51bWJlcid9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2NhYmluVHlwZScsIHJlYWQ6ICdjYWJpbkluZm8uY2FiaW5UeXBlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnZGluaW5nU2l0dGluZycsIHJlYWQ6ICdkaW5pbmdTaXR0aW5nJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnaGFzUFJDJywgcmVhZDogJ2hhc1BSQyd9LCAvL1RPRE86IGZpbmQgb3V0IHdoZXJlIHRoaXMgaXMgaW4gUE9MQVIsIFRISVMgSVNOJ1QgQ09SUkVDVExZIE1BUFBFRFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHRyYW5zZm9ybU9iamVjdChpbnB1dCwgdGFyZ2V0LCByb290UGF0aHMpO1xuXG4gICAgICAgICAgICAvL1RPRE86IG5vIGNsdWUgd2hhdCdzIGdvaW5nIG9uIHdpdGggY2FiaW4gbG9jYXRpb25zLiB0aGUgZGF0YSBpcyBjb21wbGV0ZWx5IGluY29uc2lzdGVudC5cbiAgICAgICAgICAgIC8vcmVjcmVhdGUgZXJyb3JzIHdpdGggQ0xDTUNRLCBMT0tJXG4gICAgICAgICAgICBpZiAoc3RlZWxUb2UuZG8oaW5wdXQpLmdldCgnY2FiaW5JbmZvLmNhYmluTG9jYXRpb25zJykpIHtcbiAgICAgICAgICAgICAgICAvLyB0YXJnZXQuY2FiaW5Mb2NhdGlvbk5hbWUgICAgPSBzdGVlbFRvZS5kbyhpbnB1dCkuZ2V0KCdjYWJpbkluZm8uY2FiaW5Mb2NhdGlvbnMnKS5maWx0ZXIoZnVuY3Rpb24ob2JqKXtyZXR1cm4gb2JqLmNvZGUgPT09IHRhcmdldC5jYWJpblR5cGU7fSlbMF0uZGVzY3JpcHRpb247XG4gICAgICAgICAgICAgICAgdGFyZ2V0LmNhYmluTG9jYXRpb25OYW1lID0gdGFyZ2V0LmNhYmluVHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5wdXQuY2hlY2tpbkd1ZXN0cy5tYXAoZnVuY3Rpb24oc2luZ2xlR3Vlc3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VxTnVtID0gc2luZ2xlR3Vlc3Quc2VxTnVtYmVyIC0xO1xuICAgICAgICAgICAgICAgIHRhcmdldC5ndWVzdFtzZXFOdW1dID0gdGFyZ2V0Lmd1ZXN0W3NlcU51bV0gfHwge307XG4gICAgICAgICAgICAgICAgdmFyIGd1ZXN0T2JqID0gdGFyZ2V0Lmd1ZXN0W3NlcU51bV07XG4gICAgICAgICAgICAgICAgZ3Vlc3RPYmouZ3Vlc3RGbGlnaHREZXRhaWxzID0ge307XG4gICAgICAgICAgICAgICAgZ3Vlc3RPYmoudHJhbnNwb3J0YXRpb25Bc3NpZ25tZW50cyA9IHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYWw6IGZhbHNlXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHZhciBiYXNpY1BhdGhzID0gW1xuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICd0aXRsZScsIHJlYWQ6ICd0aXRsZS5jb2RlJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2ZpcnN0TmFtZScsIHJlYWQ6ICdmaXJzdE5hbWUnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnbWlkZGxlTmFtZScsIHJlYWQ6ICdtaWRkbGVOYW1lJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2xhc3ROYW1lJywgcmVhZDogJ2xhc3ROYW1lJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ3Bhc3RHdWVzdE51bWJlcicsIHJlYWQ6ICdwYXN0R3Vlc3ROdW1iZXInfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAncmF0ZUNvZGUnLCByZWFkOiAncmF0ZUNvZGUnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnYWdlJywgcmVhZDogJ2FnZS5hbW91bnQnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnZ2VuZGVyJywgcmVhZDogJ2dlbmRlci5kZXNjcmlwdGlvbid9LFxuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdzZXFOdW1iZXInLCByZWFkOiAnc2VxTnVtYmVyJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2VSZWYnLCByZWFkOiAnZVJlZid9LFxuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdzdGF0dXNEZXNjcmlwdGlvbicsIHJlYWQ6ICdzdGF0dXNEZXNjcmlwdGlvbid9LFxuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICduYXRpb25hbGl0eScsIHJlYWQ6ICduYXRpb25hbGl0eS5jb2RlJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ3Jlc2lkZW5jeUluZCcsIHJlYWQ6ICdyZXNpZGVuY3lJbmQnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnY291bnRyeU9mUmVzaWRlbmNlJywgcmVhZDogJ2NvdW50cnlPZlJlc2lkZW5jZS5jb2RlJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2NvbnRhY3RQaG9uZScsIHJlYWQ6ICdjb250YWN0UGhvbmUubnVtYmVyJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2JpcnRoRGF0ZScsIHJlYWQ6ICdiaXJ0aERhdGUudmFsdWUnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnaG9tZUNpdHknLCByZWFkOiAnaG9tZUNpdHkuY29kZSd9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm1PYmplY3QoIHNpbmdsZUd1ZXN0LCBndWVzdE9iaiwgYmFzaWNQYXRocyApO1xuXG4gICAgICAgICAgICAgICAgLy8gdGhlIGRyb3Bkb3ducyB1c2UgY291bnRyeSBuYW1lLCBub3QgY29kZTsgdGhpcyB0cmFuc2Zvcm1zIGNvZGUgdG8gbmFtZVxuICAgICAgICAgICAgICAgIGd1ZXN0T2JqLm5hdGlvbmFsaXR5ID0gVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLmRlc2VyaWFsaXplQ291bnRyeSggZ3Vlc3RPYmoubmF0aW9uYWxpdHkgKTtcbiAgICAgICAgICAgICAgICBndWVzdE9iai5jb3VudHJ5T2ZSZXNpZGVuY2UgPSBUcmFuc2Zvcm1VdGlsc1NlcnZpY2UuZGVzZXJpYWxpemVDb3VudHJ5KCBndWVzdE9iai5jb3VudHJ5T2ZSZXNpZGVuY2UgKTtcblxuICAgICAgICAgICAgICAgIC8vIHBhcnNlIGJpcnRoZGF5XG4gICAgICAgICAgICAgICAgaWYgKGd1ZXN0T2JqLmJpcnRoRGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICBndWVzdE9iai5iaXJ0aERhdGUgPSBkZXNlcmlhbGl6ZURhdGUoIGd1ZXN0T2JqLmJpcnRoRGF0ZSApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBwYXN0R3Vlc3RMb3lhbHR5ID0gYW5ndWxhci5jb3B5KCBzaW5nbGVHdWVzdC5wYXN0R3Vlc3RMb3lhbHR5ICkgfHwgJyc7XG4gICAgICAgICAgICAgICAgZ3Vlc3RPYmoucGFzdEd1ZXN0TG95YWx0eSAgICAgICAgPSB3b3JkVG9OdW0oIHBhc3RHdWVzdExveWFsdHkuc3BsaXQoJyAnKVswXSApO1xuXG5cbiAgICAgICAgICAgICAgICAvL2FkZHJlc3NlcyBhcmUgaW4gYW4gYXJyYXk7IHRoZXkgZG9uJ3QgY29tZSBpbiBhIGNvbnNpc3RlbnQgb3JkZXIgc28gd2UgbmVlZCB0byBcbiAgICAgICAgICAgICAgICAvL2l0ZXJhdGUgdGhyb3VnaCB0aGUgYXJyYXkgYW5kIGZpbmQgaWYgaXQncyBob21lIG9yIGRlc3RpbmF0aW9uIGFkZHJlc3NcbiAgICAgICAgICAgICAgICBzaW5nbGVHdWVzdC5hZGRyZXNzLm1hcCggZnVuY3Rpb24oIGFkZHJlc3MgKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBob21lUGF0aHMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdzdHJlZXQxJywgcmVhZDogJ3N0cmVldDEnfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ3N0cmVldDInLCByZWFkOiAnc3RyZWV0Mid9LFxuICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnc3RyZWV0MycsIHJlYWQ6ICdzdHJlZXQzJ30sXG4gICAgICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdob3VzZU5hbWUnLCByZWFkOiAnaG91c2VOYW1lJ30sXG4gICAgICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdjaXR5JywgcmVhZDogJ2NpdHkudmFsdWUnfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ3N0YXRlJywgcmVhZDogJ3N0YXRlTmFtZSd9LFxuICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnY291bnRyeScsIHJlYWQ6ICdjb3VudHJ5Q29kZSd9LFxuICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnemlwQ29kZScsIHJlYWQ6ICd6aXBDb2RlJ30sXG4gICAgICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdwaG9uZScsIHJlYWQ6ICdwaG9uZS5udW1iZXInfVxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIGFkZHJlc3MuYWRkcmVzc1R5cGUgPT09ICdIJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGd1ZXN0T2JqLmhvbWVBZGRyZXNzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1PYmplY3QoIGFkZHJlc3MsIGd1ZXN0T2JqLmhvbWVBZGRyZXNzLCBob21lUGF0aHMgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGd1ZXN0T2JqLmhvbWVBZGRyZXNzLmNvdW50cnkgPSBUcmFuc2Zvcm1VdGlsc1NlcnZpY2UuZGVzZXJpYWxpemVDb3VudHJ5KCBndWVzdE9iai5ob21lQWRkcmVzcy5jb3VudHJ5ICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBndWVzdE9iai5ob21lQWRkcmVzcy5zdGF0ZSA9IGFzc2lnblN0YXRlKGd1ZXN0T2JqLmhvbWVBZGRyZXNzLnN0YXRlKS50aGVuKGZ1bmN0aW9uKHJlc3VsdCl7Z3Vlc3RPYmouaG9tZUFkZHJlc3Muc3RhdGUgPSByZXN1bHQ7fSk7XG4gICAgICAgICAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAgICAgICAgIGlmICggYWRkcmVzcy5hZGRyZXNzVHlwZSA9PT0gJ0QnICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouZGVzdEFkZHJlc3MgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZm9ybU9iamVjdCggYWRkcmVzcywgZ3Vlc3RPYmouZGVzdEFkZHJlc3MsIGhvbWVQYXRocyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouZGVzdEFkZHJlc3MuY291bnRyeSA9IFRyYW5zZm9ybVV0aWxzU2VydmljZS5kZXNlcmlhbGl6ZUNvdW50cnkoIGd1ZXN0T2JqLmRlc3RBZGRyZXNzLmNvdW50cnkgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGd1ZXN0T2JqLmRlc3RBZGRyZXNzLnN0YXRlID0gYXNzaWduU3RhdGUoZ3Vlc3RPYmouZGVzdEFkZHJlc3Muc3RhdGUpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtndWVzdE9iai5kZXN0QWRkcmVzcy5zdGF0ZSA9IHJlc3VsdDt9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKCBzdGVlbFRvZS5kbyhzaW5nbGVHdWVzdCkuZ2V0KCdndWVzdEZsaWdodERldGFpbHMnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgLy9mbGlnaHRzIGFyZSBpbiBhbiBhcnJheTsgdGhleSBkb24ndCBjb21lIGluIGEgY29uc2lzdGVudCBvcmRlciBzbyB3ZSBuZWVkIHRvXG4gICAgICAgICAgICAgICAgICAgIC8vaXRlcmF0ZSB0aHJvdWdoIHRoZSBhcnJheSBhbmQgZmluZCBpZiBpdCdzIGhvbWUgb3IgZGVzdGluYXRpb24gYWRkcmVzc1xuICAgICAgICAgICAgICAgICAgICBzaW5nbGVHdWVzdC5ndWVzdEZsaWdodERldGFpbHMubWFwKCBmdW5jdGlvbiggZmxpZ2h0ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ3Vlc3RPYmouZ3Vlc3RGbGlnaHREZXRhaWxzID0gZ3Vlc3RPYmouZ3Vlc3RGbGlnaHREZXRhaWxzIHx8IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBmbGlnaHQuZGlyZWN0aW9uQ29kZSA9PT0gJ08nICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGd1ZXN0T2JqLmd1ZXN0RmxpZ2h0RGV0YWlscy5vcmlnaW5GbGlnaHQgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlcGFydENpdHlDb2RlOiBmbGlnaHQuZmxpZ2h0U2VnbWVudERldGFpbC5kZXBhcnRDaXR5Q29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyaXZlQ2l0eUNvZGU6IGZsaWdodC5mbGlnaHRTZWdtZW50RGV0YWlsLmFycml2ZUNpdHlDb2RlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXJyaWVyTmFtZTogZmxpZ2h0LmZsaWdodFNlZ21lbnREZXRhaWwuY2Fycmllck5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZsaWdodE51bWJlcjogZmxpZ2h0LmZsaWdodFNlZ21lbnREZXRhaWwuZmxpZ2h0TnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouZ3Vlc3RGbGlnaHREZXRhaWxzLm9yaWdpbkZsaWdodC5kZXBhcnR1cmVEYXRlID0gZGVzZXJpYWxpemVEYXRlKCBmbGlnaHQuZmxpZ2h0U2VnbWVudERldGFpbC5kZXBhcnR1cmVEYXRlICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouZ3Vlc3RGbGlnaHREZXRhaWxzLm9yaWdpbkZsaWdodC5hcnJpdmFsRGF0ZSA9IGRlc2VyaWFsaXplRGF0ZSggZmxpZ2h0LmZsaWdodFNlZ21lbnREZXRhaWwuYXJyaXZhbERhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBndWVzdE9iai5ndWVzdEZsaWdodERldGFpbHMub3JpZ2luRmxpZ2h0LmRlcGFydHVyZVRpbWUgPSBzZXJpYWxpemVUaW1lKGZsaWdodC5mbGlnaHRTZWdtZW50RGV0YWlsLmRlcGFydHVyZVRpbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGd1ZXN0T2JqLmd1ZXN0RmxpZ2h0RGV0YWlscy5vcmlnaW5GbGlnaHQuYXJyaXZhbFRpbWUgPSBzZXJpYWxpemVUaW1lKGZsaWdodC5mbGlnaHRTZWdtZW50RGV0YWlsLmFycml2YWxUaW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCBmbGlnaHQuZGlyZWN0aW9uQ29kZSA9PT0gJ1QnICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGd1ZXN0T2JqLmd1ZXN0RmxpZ2h0RGV0YWlscy50ZXJtaW5hbEZsaWdodCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0ID0gZ3Vlc3RPYmouZ3Vlc3RGbGlnaHREZXRhaWxzLnRlcm1pbmFsRmxpZ2h0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzID0gZmxpZ2h0LmZsaWdodFNlZ21lbnREZXRhaWw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdC5kZXBhcnRDaXR5Q29kZSA9IHN0ZWVsVG9lLmRvKHMpLmdldCgnZGVwYXJ0Q2l0eUNvZGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmFycml2ZUNpdHlDb2RlID0gc3RlZWxUb2UuZG8ocykuZ2V0KCdhcnJpdmVDaXR5Q29kZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQuY2Fycmllck5hbWUgPSBzdGVlbFRvZS5kbyhzKS5nZXQoJ2NhcnJpZXJOYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdC5mbGlnaHROdW1iZXIgPSBzdGVlbFRvZS5kbyhzKS5nZXQoJ2ZsaWdodE51bWJlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHQuZGVwYXJ0dXJlRGF0ZSA9IGRlc2VyaWFsaXplRGF0ZSggc3RlZWxUb2UuZG8ocykuZ2V0KCdkZXBhcnR1cmVEYXRlJykgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmFycml2YWxEYXRlID0gZGVzZXJpYWxpemVEYXRlKCBzdGVlbFRvZS5kbyhzKS5nZXQoJ2Fycml2YWxEYXRlJykgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmRlcGFydHVyZVRpbWUgPSBzZXJpYWxpemVUaW1lKHN0ZWVsVG9lLmRvKHMpLmdldCgnZGVwYXJ0dXJlVGltZScpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0LmFycml2YWxUaW1lID0gc2VyaWFsaXplVGltZShzdGVlbFRvZS5kbyhzKS5nZXQoJ2Fycml2YWxUaW1lJykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIHN0ZWVsVG9lLmRvKHNpbmdsZUd1ZXN0KS5nZXQoJ3RyYW5zcG9ydGF0aW9uQXNzaWdubWVudHMnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2luZ2xlR3Vlc3QudHJhbnNwb3J0YXRpb25Bc3NpZ25tZW50cy5tYXAoZnVuY3Rpb24oZmxpZ2h0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZmxpZ2h0LmRpcmVjdGlvbkNvZGUgPT09IFwiT1wiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmoudHJhbnNwb3J0YXRpb25Bc3NpZ25tZW50cy5vcmlnaW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChmbGlnaHQuZGlyZWN0aW9uQ29kZSA9PT0gXCJUXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBndWVzdE9iai50cmFuc3BvcnRhdGlvbkFzc2lnbm1lbnRzLnRlcm1pbmFsID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSW1taWdyYXRpb24gZGF0YSAtIHBhc3Nwb3J0LCBldGMuXG4gICAgICAgICAgICAgICAgaWYgKCBzdGVlbFRvZS5kbyhzaW5nbGVHdWVzdCkuZ2V0KCdpbW1pZ3JhdGlvbkRvY0luZm8nKSApIHtcbiAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouaW1taWdyYXRpb25Eb2NJbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG9jdW1lbnRUeXBlICAgICAgICAgIDogZG9jVHlwZXMuZGVzZXJpYWxpemUoIHN0ZWVsVG9lLmRvKHNpbmdsZUd1ZXN0KS5nZXQoJ2ltbWlncmF0aW9uRG9jSW5mby5kb2N1bWVudFR5cGUnKSApLFxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnROdW1iZXJDb25maXJtIDogc3RlZWxUb2UuZG8oc2luZ2xlR3Vlc3QpLmdldCgnaW1taWdyYXRpb25Eb2NJbmZvLmRvY3VtZW50TnVtYmVyJylcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouaW1taWdyYXRpb25Eb2NJbmZvLmRvY3VtZW50VHlwZSA9IGRvY1R5cGVzLmRlc2VyaWFsaXplKCBzdGVlbFRvZS5kbyhzaW5nbGVHdWVzdCkuZ2V0KCdpbW1pZ3JhdGlvbkRvY0luZm8uZG9jdW1lbnRUeXBlJykgKS50aGVuKCBmdW5jdGlvbiAocmVzdWx0KSB7IGd1ZXN0T2JqLmltbWlncmF0aW9uRG9jSW5mby5kb2N1bWVudFR5cGUgPSByZXN1bHQ7IH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbW1pZ3JhdGlvblBhdGhzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdpc3N1ZUNvdW50cnlDb2RlJywgcmVhZCA6ICdpc3N1ZUNvdW50cnlDb2RlJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8geyB3cml0ZSA6ICdpc3N1ZUNvdW50cnlOYW1lJywgcmVhZCA6ICdpc3N1ZUNvdW50cnlOYW1lJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdpc3N1ZUNpdHlOYW1lJywgICAgcmVhZCA6ICdpc3N1ZUNpdHlOYW1lJyB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ2JpcnRoQ291bnRyeUNvZGUnLCByZWFkIDogJ2JpcnRoQ291bnRyeUNvZGUnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ2JpcnRoQ291bnRyeU5hbWUnLCByZWFkIDogJ2JpcnRoQ291bnRyeU5hbWUnIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHsgd3JpdGUgOiAnZG9jdW1lbnRUeXBlJywgICAgIHJlYWQgOiAnZG9jdW1lbnRUeXBlJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdkb2N1bWVudE51bWJlcicsICAgcmVhZCA6ICdkb2N1bWVudE51bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgd3JpdGUgOiAnZXhwaXJhdGlvbkRhdGUnLCAgIHJlYWQgOiAnZXhwaXJhdGlvbkRhdGUnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ2lzc3VlRGF0ZScsICAgICAgICByZWFkIDogJ2lzc3VlRGF0ZScgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogcGxhY2VPZkJpcnRoICAgICAgICAgICAgLSBcImNoZWNraW5XZWJEYlwiOiB7IFwiY2hlY2tpblBhc3NlbmdlcnNcIjogWyB7IFwicGxhY2VPZkJpcnRoXCI6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVtZXJnZW5jeUFpciAgICAgICAgICAgIC0gXCJjaGVja2luV2ViRGJcIjogeyBcImNoZWNraW5QYXNzZW5nZXJzXCI6IFsgeyBcImVtZXJnZW5jeUFpclwiOiBcIlBIWFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZXJtc0NvbmRpdGlvbnNWaXNhRmxhZyAtIFwiY2hlY2tpbldlYkRiXCI6IHsgXCJjaGVja2luUGFzc2VuZ2Vyc1wiOiBbIHsgXCJpbW1pZ3JhdGlvbkNvbXBsZXRlRmxhZ1wiOiAxNDM1NDQxNDY1MDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsYW5nUHJlZkNvZGUgICAgICAgICAgICAtIFwiY2hlY2tpbldlYkRiXCI6IHsgXCJjaGVja2luUGFzc2VuZ2Vyc1wiOiBbIHsgXCJsYW5nUHJlZkNvZGVcIjogXCJlblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiB1c2luZ0JpcnRoQ2VydGlmaWNhdGUgICAtIFwiY2hlY2tpbldlYkRiXCI6IHsgXCJjaGVja2luUGFzc2VuZ2Vyc1wiOiBbIHsgXCJ1c2luZ0JpcnRoQ2VydGlmaWNhdGVcIjogXCJOXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVmlzYSBwbGFjZSBvZiBpc3N1YW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVmlzYSBjb250cm9sIG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVmlzYSBpc3N1ZSBkYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBWaXNhIGV4cGlyZSBkYXRlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHBlcm1SZXNpZGVudFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogcGVybVJlc2lkZW50Q2FyZE51bWJlclxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICB0cmFuc2Zvcm1PYmplY3QoIHNpbmdsZUd1ZXN0LmltbWlncmF0aW9uRG9jSW5mbywgZ3Vlc3RPYmouaW1taWdyYXRpb25Eb2NJbmZvLCBpbW1pZ3JhdGlvblBhdGhzICk7XG4gICAgICAgICAgICAgICAgICAgIGd1ZXN0T2JqLmltbWlncmF0aW9uRG9jSW5mby5pc3N1ZUNvdW50cnlDb2RlID0gVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLmRlc2VyaWFsaXplQ291bnRyeSggZ3Vlc3RPYmouaW1taWdyYXRpb25Eb2NJbmZvLmlzc3VlQ291bnRyeUNvZGUgKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICAvLyBOb3Qgc3VyZSBpZiBldmVyeSBndWVzdCBpcyBnb2luZyB0byBoYXZlIGEgbm90aWZpY2F0aW9uLlxuICAgICAgICAgICAgICAgIGlmICggc2luZ2xlR3Vlc3Qubm90aWZpY2F0aW9ucyApIHtcbiAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmoubm90aWZpY2F0aW9ucyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBzaW5nbGVHdWVzdC5ub3RpZmljYXRpb25zLm1hcChmdW5jdGlvbihub3RpZmljYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGd1ZXN0T2JqLm5vdGlmaWNhdGlvbnMucHVzaChub3RpZmljYXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGd1ZXN0T2JqLm5vdGlmaWNhdGlvbnMgPSBbe1wibm90aWZpY2F0aW9uXCI6IFwiXCJ9XTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvL2FkZCBwYWdlIHN0YXRlcyB0byBlYWNoIGd1ZXN0XG4gICAgICAgICAgICAgICAgZ3Vlc3RPYmoucGFnZVN0YXRlcyA9IHtcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsczoge30sXG4gICAgICAgICAgICAgICAgICAgIHBhc3Nwb3J0OiB7fSxcbiAgICAgICAgICAgICAgICAgICAgZmxpZ2h0czoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJhbnNmZXJQcm9wczoge30gLy90aGVzZSBhcmUgdGhlIHN0YXRlIHByb3BlcnRpZXMgdGhhdCBnZXQgY29waWVkIHdoZW4geW91IGNsaWNrIFwiU2FtZSBhcyBtYWluIHBhc3NlbmdlclwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGVtZXJnZW5jeToge30sXG4gICAgICAgICAgICAgICAgICAgIGFjY291bnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjOiB7fVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBjb250cmFjdDoge30sXG4gICAgICAgICAgICAgICAgICAgIHByZWZlcmVuY2VzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaWV0OiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lZGljYWw6IHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgY2VsZWJyYXRpb25zOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJlbmVmaXRzOiB7fVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiB7fVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy9lbWVyZ2VuY3kgY29udGFjdHMgZm9yIGVhY2ggcGFzc2VuZ2VyIGFyZSBzdG9yZWQgaW4gYSBzZXBhcmF0ZSBhcnJheVxuICAgICAgICAgICAgaWYgKGlucHV0LmVtZXJnZW5jeUNvbnRhY3RzKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQuZW1lcmdlbmN5Q29udGFjdHMubWFwKGZ1bmN0aW9uKGNvbnRhY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9pbmRleGluZyBoZXJlIGlzIGNvbnNpc3RlbnQgd2l0aCB0aGUgYXBwcm9hY2ggdXNlZCBhYm92ZSB3aGlsZSBjcmVhdGluZyBlYWNoIHVzZXJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGd1ZXN0ID0gdGFyZ2V0Lmd1ZXN0W2NvbnRhY3Quc2VxdWVuY2VOdW1iZXIgLSAxXTsgXG4gICAgICAgICAgICAgICAgICAgIGd1ZXN0LmVtZXJnZW5jeUNvbnRhY3QgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyByZWxhdGlvbnNoaXAgOiByZWxhdGlvbnNoaXBzLmRlc2VyaWFsaXplKCBzdGVlbFRvZS5kbyhjb250YWN0KS5nZXQoJ3JlbGF0aW9uc2hpcCcpICkudGhlbiggZnVuY3Rpb24gKHJlc3VsdCkgeyBjb25zb2xlLmxvZygncmVsYXRpb25zaGlwOicscmVzdWx0KTsgcmV0dXJuIHJlc3VsdDsgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICBwaG9uZSAgICAgICAgOiBzdGVlbFRvZS5kbyhjb250YWN0KS5nZXQoJ2NvbnRhY3RQaG9uZXMnKSA/IHN0ZWVsVG9lLmRvKGNvbnRhY3QuY29udGFjdFBob25lc1swXSkuZ2V0KCdudW1iZXInKSA6ICcnXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIGd1ZXN0LmVtZXJnZW5jeUNvbnRhY3QucmVsYXRpb25zaGlwID0gcmVsYXRpb25zaGlwcy5kZXNlcmlhbGl6ZSggc3RlZWxUb2UuZG8oY29udGFjdCkuZ2V0KCdyZWxhdGlvbnNoaXAnKSApLnRoZW4oIGZ1bmN0aW9uIChyZXN1bHQpIHsgZ3Vlc3QuZW1lcmdlbmN5Q29udGFjdC5yZWxhdGlvbnNoaXAgPSByZXN1bHQ7IH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250YWN0UGF0aHMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ2xhc3ROYW1lJywgcmVhZCA6ICdsYXN0TmFtZScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgd3JpdGUgOiAnc3RyZWV0MScsICByZWFkIDogJ2d1ZXN0QWRkcmVzcy5zdHJlZXQxJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdzdHJlZXQyJywgIHJlYWQgOiAnZ3Vlc3RBZGRyZXNzLnN0cmVldDInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ3N0cmVldDMnLCAgcmVhZCA6ICdndWVzdEFkZHJlc3Muc3RyZWV0MycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgd3JpdGUgOiAnY2l0eScsICAgICByZWFkIDogJ2d1ZXN0QWRkcmVzcy5jaXR5JyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdzdGF0ZScsICAgIHJlYWQgOiAnZ3Vlc3RBZGRyZXNzLnN0YXRlJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdjb3VudHJ5JywgIHJlYWQgOiAnZ3Vlc3RBZGRyZXNzLmNvdW50cnknIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ3ppcCcsICAgICAgcmVhZCA6ICdndWVzdEFkZHJlc3MuemlwJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdlbWFpbCcsICAgIHJlYWQgOiAnZ3Vlc3RBZGRyZXNzLmVtYWlsJyB9XG4gICAgICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICAgICAgdHJhbnNmb3JtT2JqZWN0KCBjb250YWN0LCBndWVzdC5lbWVyZ2VuY3lDb250YWN0LCBjb250YWN0UGF0aHMgKTtcbiAgICAgICAgICAgICAgICAgICAgZ3Vlc3QuZW1lcmdlbmN5Q29udGFjdC5jb3VudHJ5ID0gVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLmRlc2VyaWFsaXplQ291bnRyeSggZ3Vlc3QuZW1lcmdlbmN5Q29udGFjdC5jb3VudHJ5ICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodGFyZ2V0KTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vd2ViRGI6IFNlcmlhbGl6ZWQgZGF0YSBmcm9tIHdlYkRiIHRvIGJlIGRlc2VyaWFsaXplZFxuICAgICAgICAvL3RhcmdldDogUmVwb3NpdG9yeSBmb3IgZGVzZXJpYWxpemVkIGluZm8uIE1vc3Qgb2YgdGhlIHRpbWUgaXQncyAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8sXG4gICAgICAgIC8vICBidXQgQWNjb3VudHNDb250cm9sbGVyIHVzZXMgaXQgdG9vIHRvIGRlYWwgd2l0aCBjb3ZlcmluZyBndWVzdHMgb24gb3RoZXIgYm9va2luZ3NcbiAgICAgICAgZGVzZXJpYWxpemVXZWJEYjogZnVuY3Rpb24oIHdlYkRiLCB0YXJnZXQgKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgZ2V0QWlycG9ydENpdGllcyA9IGFpcnBvcnRDaXRpZXMoKTtcblxuICAgICAgICAgICAgLy9iYWNrZW5kIGlzIGluamVjdGluZyB0cmFpbGluZyB3aGl0ZXNwYWNlIGludG8gdGhpcyBlbnRyeVxuICAgICAgICAgICAgaWYgKCB3ZWJEYi5jb3ZlcmVkUGFzc2VuZ2VycyApIHtcbiAgICAgICAgICAgICAgICB3ZWJEYi5jb3ZlcmVkUGFzc2VuZ2Vycy5tYXAoZnVuY3Rpb24oIGNvdmVyaW5nICkge1xuICAgICAgICAgICAgICAgICAgICBjb3ZlcmluZy5ndWVzdElkID0gY292ZXJpbmcuZ3Vlc3RJZC50cmltKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRhcmdldC5jaGVja0luUGF5ZXIgPSBhbmd1bGFyLmNvcHkod2ViRGIuY2hlY2tpblBheWVycykgfHwgW107XG4gICAgICAgICAgICB0YXJnZXQuY2hlY2tJbkNvdmVyZWQgPSBhbmd1bGFyLmNvcHkod2ViRGIuY292ZXJlZFBhc3NlbmdlcnMpIHx8IFtdO1xuXG4gICAgICAgICAgICAvLyBkZWxldGUgdmVzdGlnaWFsIGNhcmRzIGFuZCBjb3ZlcmluZ3NcbiAgICAgICAgICAgIHRhcmdldC5ndWVzdC5tYXAoZnVuY3Rpb24oIGd1ZXN0ICkge1xuICAgICAgICAgICAgICAgIGd1ZXN0LmNoZWNrSW5Db3ZlcmVkID0gbnVsbDtcbiAgICAgICAgICAgICAgICBndWVzdC5jaGVja0luUGF5ZXIgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vYXR0YWNoIGNvdmVyaW5ncyB0byB0aGVpciByZXNwZWN0aXZlIGd1ZXN0cywgaWYgdGhleSBtYXRjaCB0aGVuIHRhZyB0aGVtIGFzIGJlaW5nIGFjY291bnRlZCBmb3Igb24gdGhpcyBib29raW5nXG4gICAgICAgICAgICBpZiAodGFyZ2V0LmNoZWNrSW5Db3ZlcmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0YXJnZXQuY2hlY2tJbkNvdmVyZWQubWFwKGZ1bmN0aW9uKCBjb3ZlcmluZyApIHtcbiAgICAgICAgICAgICAgICAgICAgLy9hdHRhY2ggY2MgaW5mbyB0byBjb3ZlcmluZ1xuICAgICAgICAgICAgICAgICAgICBjb3ZlcmluZy5jYXJkRGV0YWlscyA9IGdldENhcmREZXRhaWxzKCBjb3ZlcmluZywgdGFyZ2V0LmNoZWNrSW5QYXllciApO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vYXR0YWNoIGNvdmVyaW5nIHRvIHBhc3Nlbmdlci4gaWYgc3VjY2Vzc2Z1bCwgZ3Vlc3Qub25UaGlzQm9va2luZyA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hDb3ZlcmluZ1dpdGhQYXNzZW5nZXIoIHRhcmdldC5ndWVzdCwgY292ZXJpbmcsIHRhcmdldC5ib29raW5nTnVtYmVyLCB0YXJnZXQuc2FpbGluZ0lkICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRhcmdldC5jaGVja0luUGF5ZXIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5jaGVja0luUGF5ZXIubWFwKGZ1bmN0aW9uKCBwYXllciApIHtcbiAgICAgICAgICAgICAgICAgICAgLy90cmFuc2Zvcm0gY3JlZGl0IGNhcmQgY29kZXMgaW50byBuYW1lc1xuICAgICAgICAgICAgICAgICAgICBwYXllci5jcmVkaXRDYXJkVHlwZSA9IGdldENhcmRUeXBlTmFtZSggcGF5ZXIuY3JlZGl0Q2FyZFR5cGUgKTtcbiAgICAgICAgICAgICAgICAgICAgLy9hZGQgY3JlZGl0IGNhcmRzIHRvIHRoZWlyIG93bmVycyBpZiB0aGV5J3JlIG9uIHRoaXMgYm9va2luZ1xuICAgICAgICAgICAgICAgICAgICBtYXRjaFBheWVyV2l0aFBhc3NlbmdlciggJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLmd1ZXN0LCBwYXllciApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL2NvcHkgZWFjaCBDaGVja0luUGFzc2VuZ2VyIGFuZCBhc3NpZ24gdGhlbSB0byB0aGVpciByZXNwZWN0aXZlIGd1ZXN0XG4gICAgICAgICAgICB3ZWJEYi5jaGVja2luUGFzc2VuZ2Vycy5tYXAoZnVuY3Rpb24oIHBhc3NlbmdlciApIHtcbiAgICAgICAgICAgICAgICB2YXIgc2VxTnVtID0gcGFzc2VuZ2VyLnBheFNlcXVlbmNlIC0gMTtcbiAgICAgICAgICAgICAgICB0YXJnZXQuZ3Vlc3RbIHNlcU51bSBdID0gdGFyZ2V0Lmd1ZXN0WyBzZXFOdW0gXSB8fCB7fTtcbiAgICAgICAgICAgICAgICB0YXJnZXQuZ3Vlc3RbIHNlcU51bSBdLkNoZWNrSW5QYXNzZW5nZXIgPSBhbmd1bGFyLmNvcHkoIHBhc3NlbmdlciApOyAvL1RPRE86IGJyZWFrIHRoZXNlIG91dCBpbnRvIGVsZW1lbnRzIGFuZCB0cmFuc2Zvcm0gZGF0ZXNcblxuICAgICAgICAgICAgICAgIC8vYXNzaWduIGNhcmRzIHRvIHBhc3NlbmdlcnMgKHNoYWxsb3cgY29weSBvZiBjaGVja0luUGF5ZXIpXG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldC5jaGVja0luUGF5ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LmNoZWNrSW5QYXllci5tYXAoZnVuY3Rpb24oIGNhcmQgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGNhcmQuaWRDaGVja2luID09PSBwYXNzZW5nZXIuaWRDaGVja2luICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3Nlbmdlci5jaGVja0luUGF5ZXIgPSBjYXJkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIHRhcmdldC5ndWVzdFsgc2VxTnVtIF0uQ2hlY2tJblBhc3Nlbmdlci5sYW5nUHJlZkNvZGUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5ndWVzdFsgc2VxTnVtIF0uQ2hlY2tJblBhc3Nlbmdlci5sYW5nUHJlZkNvZGUgPSBsYW5ndWFnZXMuZGVzZXJpYWxpemUoIHRhcmdldC5ndWVzdFsgc2VxTnVtIF0uQ2hlY2tJblBhc3Nlbmdlci5sYW5nUHJlZkNvZGUgKS50aGVuKCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCByZXN1bHQgKXsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Lmd1ZXN0W3NlcU51bV0uQ2hlY2tJblBhc3Nlbmdlci5sYW5nUHJlZkNvZGUgPSByZXN1bHQ7IFxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gYWlycG9ydENpdGllc1Byb21pc2UudGhlbiggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICggdGFyZ2V0Lmd1ZXN0W3NlcU51bV0uQ2hlY2tJblBhc3Nlbmdlci5lbWVyZ2VuY3lBaXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5ndWVzdFsgc2VxTnVtIF0uQ2hlY2tJblBhc3Nlbmdlci5lbWVyZ2VuY3lBaXIgPSBnZXRBaXJwb3J0Q2l0aWVzLmRlc2VyaWFsaXplKCB0YXJnZXQuZ3Vlc3Rbc2VxTnVtXS5DaGVja0luUGFzc2VuZ2VyLmVtZXJnZW5jeUFpciApLnRoZW4oIGZ1bmN0aW9uKCByZXN1bHQgKXsgdGFyZ2V0Lmd1ZXN0W3NlcU51bV0uQ2hlY2tJblBhc3Nlbmdlci5lbWVyZ2VuY3lBaXIgPSByZXN1bHQ7fSk7ICAgIFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHRhcmdldCk7XG4gICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcblxuICAgICAgICB9LFxuXG4gICAgICAgIHNlcmlhbGl6ZVBvbGFyOiBmdW5jdGlvbihpbnB1dFBvbGFyKSB7XG4gICAgICAgICAgICB2YXIgc2VyaWFsaXplZFBvbGFyID0ge1xuICAgICAgICAgICAgICAvLyBcImNoZWNraW5cIjoge1xuICAgICAgICAgICAgICAgIFwiY2hlY2tpbkd1ZXN0c1wiOiBbXSxcbiAgICAgICAgICAgICAgICBcImVtZXJnZW5jeUNvbnRhY3RzXCI6IFtcbiAgICAgICAgICAgICAgICAgIC8vIHtcbiAgICAgICAgICAgICAgICAgIC8vICAgXCJndWVzdEFkZHJlc3NcIjoge1xuICAgICAgICAgICAgICAgICAgLy8gICAgIFwiY2l0eVwiOiB7fSxcbiAgICAgICAgICAgICAgICAgIC8vICAgICBcInBob25lXCI6IHt9XG4gICAgICAgICAgICAgICAgICAvLyAgIH1cbiAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByb290UGF0aHMgPSBbXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnYm9va2luZ051bWJlcicsIHJlYWQ6ICdib29raW5nTnVtYmVyJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnc3luY2hyb25pemF0aW9uSUQnLCByZWFkOiAnc3luY2hyb25pemF0aW9uSUQnfSxcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICB0cmFuc2Zvcm1PYmplY3QoaW5wdXRQb2xhciwgc2VyaWFsaXplZFBvbGFyLCByb290UGF0aHMpO1xuXG4gICAgICAgICAgICBpbnB1dFBvbGFyLmd1ZXN0Lm1hcChmdW5jdGlvbihzaW5nbGVHdWVzdCkge1xuICAgICAgICAgICAgICAgIHZhciBzZXFOdW0gPSBzaW5nbGVHdWVzdC5zZXFOdW1iZXIgLSAxO1xuICAgICAgICAgICAgICAgIHNlcmlhbGl6ZWRQb2xhci5jaGVja2luR3Vlc3RzW3NlcU51bV0gPSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFwibmF0aW9uYWxpdHlcIjoge30sXG4gICAgICAgICAgICAgICAgICAgIC8vIFwiY291bnRyeU9mUmVzaWRlbmNlXCI6IHt9LFxuICAgICAgICAgICAgICAgICAgICAvLyBcImNvbnRhY3RQaG9uZVwiOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgXCJiaXJ0aERhdGVcIjoge30sXG4gICAgICAgICAgICAgICAgICAgIFwiaG9tZUNpdHlcIjoge30sXG4gICAgICAgICAgICAgICAgICAgIC8vIFwiYWRkcmVzc1wiOiBbXG4gICAgICAgICAgICAgICAgICAgIC8vICAge1xuICAgICAgICAgICAgICAgICAgICAvLyAgICAgXCJjaXR5XCI6IHt9LFxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgXCJwaG9uZVwiOiB7fVxuICAgICAgICAgICAgICAgICAgICAvLyAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gXSxcbiAgICAgICAgICAgICAgICAgICAgLy8gXCJpbW1pZ3JhdGlvbkRvY0luZm9cIjoge31cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgdmFyIGd1ZXN0T2JqID0gc2VyaWFsaXplZFBvbGFyLmNoZWNraW5HdWVzdHNbc2VxTnVtXTtcbiAgICAgICAgICAgICAgICAvLyBndWVzdE9iai5ndWVzdEZsaWdodERldGFpbHMgPSBbXTtcblxuICAgICAgICAgICAgICAgIHZhciBiYXNpY1BhdGhzID0gW1xuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdtaWRkbGVOYW1lJywgcmVhZDogJ21pZGRsZU5hbWUnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnc2VxTnVtYmVyJywgcmVhZDogJ3NlcU51bWJlcid9LFxuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdlUmVmJywgcmVhZDogJ2VSZWYnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnbmF0aW9uYWxpdHkuY29kZScsIHJlYWQ6ICduYXRpb25hbGl0eSd9LFxuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdjb3VudHJ5T2ZSZXNpZGVuY2UuY29kZScsIHJlYWQ6ICdjb3VudHJ5T2ZSZXNpZGVuY2UnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnYmlydGhEYXRlLnZhbHVlJywgcmVhZDogJ2JpcnRoRGF0ZSd9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICB0cmFuc2Zvcm1PYmplY3Qoc2luZ2xlR3Vlc3QsIGd1ZXN0T2JqLCBiYXNpY1BhdGhzKTtcblxuICAgICAgICAgICAgICAgIGd1ZXN0T2JqLmNvdW50cnlPZlJlc2lkZW5jZS5jb2RlID0gVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLnNlcmlhbGl6ZUNvdW50cnkoIGd1ZXN0T2JqLmNvdW50cnlPZlJlc2lkZW5jZS5jb2RlICk7XG4gICAgICAgICAgICAgICAgZ3Vlc3RPYmoubmF0aW9uYWxpdHkuY29kZSA9IFRyYW5zZm9ybVV0aWxzU2VydmljZS5zZXJpYWxpemVDb3VudHJ5KCBndWVzdE9iai5uYXRpb25hbGl0eS5jb2RlICk7XG5cbiAgICAgICAgICAgICAgICAvL3RyYW5zZm9ybSBiaXJ0aGRheSBpbnRvIGZvcm1hdCBlLmcuIDA3MTgxOTg3IGZvciBqdWx5IDE4IDE5ODdcbiAgICAgICAgICAgICAgICBpZiAoIHNpbmdsZUd1ZXN0LmJpcnRoRGF0ZSApIHtcbiAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouYmlydGhEYXRlLnZhbHVlID0gc2VyaWFsaXplSVNPRGF0ZShzaW5nbGVHdWVzdC5iaXJ0aERhdGUpO1xuICAgICAgICAgICAgICAgICAgICBndWVzdE9iai5iaXJ0aERhdGUucmVxdWlyZWQgPSAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIC8vYXNzaWduIGFkZHJlc3MgdG8gZ3Vlc3Qgb2JqZWN0XG4gICAgICAgICAgICAgICAgLy8gc2luZ2xlR3Vlc3QuYWRkcmVzcyA9IFtdO1xuICAgICAgICAgICAgICAgIC8vIHZhciBob21lUGF0aHMgPSBbXG4gICAgICAgICAgICAgICAgLy8gICAgIHt3cml0ZTogJ3N0cmVldDEnLCByZWFkOiAnc3RyZWV0MSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdzdHJlZXQyJywgcmVhZDogJ3N0cmVldDInfSxcbiAgICAgICAgICAgICAgICAvLyAgICAge3dyaXRlOiAnc3RyZWV0MycsIHJlYWQ6ICdzdHJlZXQzJ30sXG4gICAgICAgICAgICAgICAgLy8gICAgIHt3cml0ZTogJ2hvdXNlTmFtZScsIHJlYWQ6ICdob3VzZU5hbWUnfSxcbiAgICAgICAgICAgICAgICAvLyAgICAge3dyaXRlOiAnY2l0eS52YWx1ZScsIHJlYWQ6ICdjaXR5J30sXG4gICAgICAgICAgICAgICAgLy8gICAgIHt3cml0ZTogJ3N0YXRlJywgcmVhZDogJ3N0YXRlTmFtZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdjb3VudHJ5Q29kZScsIHJlYWQ6ICdjb3VudHJ5J30sXG4gICAgICAgICAgICAgICAgLy8gICAgIHt3cml0ZTogJ3ppcENvZGUnLCByZWFkOiAnemlwQ29kZSd9XG4gICAgICAgICAgICAgICAgLy8gICAgIHt3cml0ZTogJ3Bob25lLm51bWJlcicsIHJlYWQ6ICdwaG9uZSd9XG4gICAgICAgICAgICAgICAgLy8gXTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIChzaW5nbGVHdWVzdC5ob21lQWRkcmVzcy5wcmltYXJ5UGhvbmUpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgdmFyIHByaW1hcnlQaG9uZSA9IHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHR5cGVDb2RlOiAnQycsXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBudW1iZXI6IHNpbmdsZUd1ZXN0LmhvbWVBZGRyZXNzLnByaW1hcnlQaG9uZVxuICAgICAgICAgICAgICAgIC8vICAgICB9O1xuICAgICAgICAgICAgICAgIC8vICAgICBndWVzdE9iai5hZGRyZXNzLm1hcChmdW5jdGlvbihhZGRyZXNzKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBpZiAoYWRkcmVzc1R5cGUgPT09ICdDJykge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIGFkZHJlc3MucHVzaChwcmltYXJ5UGhvbmUpO1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgICAgICAvLyBpZiAoc2luZ2xlR3Vlc3QuaG9tZUFkZHJlc3Muc2Vjb25kYXJ5UGhvbmUpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgdmFyIHNlY29uZGFyeVBob25lID0ge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgdHlwZUNvZGU6ICdIJyxcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIG51bWJlcjogc2luZ2xlR3Vlc3QuaG9tZUFkZHJlc3Muc2Vjb25kYXJ5UGhvbmVcbiAgICAgICAgICAgICAgICAvLyAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyAgICAgZ3Vlc3RPYmouYWRkcmVzcy5tYXAoZnVuY3Rpb24oYWRkcmVzcykge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgaWYgKGFkZHJlc3NUeXBlID09PSAnSCcpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICBhZGRyZXNzLnB1c2goc2Vjb25kYXJ5UGhvbmUpO1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgICAgICAvLyBpZiAoc2luZ2xlR3Vlc3QuaG9tZUFkZHJlc3MpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgdmFyIGhvbWUgPSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBhZGRyZXNzVHlwZTogXCJIXCIsXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBhZGRyZXNzRGVzY3JpcHRpb246IFwiSG9tZVwiXG4gICAgICAgICAgICAgICAgLy8gICAgIH07XG4gICAgICAgICAgICAgICAgLy8gICAgIHRyYW5zZm9ybU9iamVjdChzaW5nbGVHdWVzdC5ob21lQWRkcmVzcywgaG9tZSwgaG9tZVBhdGhzKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgaG9tZS5jb3VudHJ5Q29kZSA9IFRyYW5zZm9ybVV0aWxzU2VydmljZS5zZXJpYWxpemVDb3VudHJ5KCBob21lLmNvdW50cnlDb2RlICk7XG4gICAgICAgICAgICAgICAgLy8gICAgIHNpbmdsZUd1ZXN0LmFkZHJlc3MucHVzaChob21lKTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgLy8gaWYgKHNpbmdsZUd1ZXN0LmRlc3RBZGRyZXNzKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgIHZhciBkZXN0ID0ge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgYWRkcmVzc1R5cGU6IFwiRFwiLFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgYWRkcmVzc0Rlc2NyaXB0aW9uOiBcIkRlc3RpbmF0aW9uXCJcbiAgICAgICAgICAgICAgICAvLyAgICAgfTtcbiAgICAgICAgICAgICAgICAvLyAgICAgdHJhbnNmb3JtT2JqZWN0KHNpbmdsZUd1ZXN0LmRlc3RBZGRyZXNzLCBkZXN0LCBob21lUGF0aHMpO1xuICAgICAgICAgICAgICAgIC8vICAgICBkZXN0LmNvdW50cnlDb2RlID0gVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLnNlcmlhbGl6ZUNvdW50cnkoIGRlc3QuY291bnRyeUNvZGUgKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgc2luZ2xlR3Vlc3QuYWRkcmVzcy5wdXNoKGRlc3QpO1xuICAgICAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgICAgIC8vIGFkZCBndWVzdCdzIGd1ZXN0RmxpZ2h0RGV0YWlsc1xuICAgICAgICAgICAgICAgIC8vIHZhciBmbGlnaHRzUGF0aHMgPSBbXG4gICAgICAgICAgICAgICAgLy8gICAgIHt3cml0ZTogJ2ZsaWdodFNlZ21lbnREZXRhaWwuZGVwYXJ0Q2l0eUNvZGUnLCByZWFkOiAnZGVwYXJ0Q2l0eUNvZGUnfSxcbiAgICAgICAgICAgICAgICAvLyAgICAge3dyaXRlOiAnZmxpZ2h0U2VnbWVudERldGFpbC5hcnJpdmVDaXR5Q29kZScsIHJlYWQ6ICdhcnJpdmVDaXR5Q29kZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdmbGlnaHRTZWdtZW50RGV0YWlsLmNhcnJpZXJDb2RlJywgcmVhZDogJ2NhcnJpZXJDb2RlJ30sXG4gICAgICAgICAgICAgICAgLy8gICAgIHt3cml0ZTogJ2ZsaWdodFNlZ21lbnREZXRhaWwuY2Fycmllck5hbWUnLCByZWFkOiAnY2Fycmllck5hbWUnfSxcbiAgICAgICAgICAgICAgICAvLyAgICAge3dyaXRlOiAnZmxpZ2h0U2VnbWVudERldGFpbC5mbGlnaHROdW1iZXInLCByZWFkOiAnZmxpZ2h0TnVtYmVyJ30sXG4gICAgICAgICAgICAgICAgLy8gICAgIHt3cml0ZTogJ2ZsaWdodFNlZ21lbnREZXRhaWwuZmxpZ2h0Q2xhc3MnLCByZWFkOiAnZmxpZ2h0Q2xhc3MnfSxcbiAgICAgICAgICAgICAgICAvLyAgICAge3dyaXRlOiAnZmxpZ2h0U2VnbWVudERldGFpbC5kZXBhcnR1cmVUaW1lJywgcmVhZDogJ2RlcGFydHVyZVRpbWUnfSxcbiAgICAgICAgICAgICAgICAvLyAgICAge3dyaXRlOiAnZmxpZ2h0U2VnbWVudERldGFpbC5hcnJpdmFsVGltZScsIHJlYWQ6ICdhcnJpdmFsVGltZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdmbGlnaHRTZWdtZW50RGV0YWlsLmRlcGFydHVyZURhdGUnLCByZWFkOiAnZGVwYXJ0dXJlRGF0ZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdmbGlnaHRTZWdtZW50RGV0YWlsLmFycml2YWxEYXRlJywgcmVhZDogJ2Fycml2YWxEYXRlJ31cbiAgICAgICAgICAgICAgICAvLyBdO1xuICAgICAgICAgICAgICAgIC8vIGlmIChzaW5nbGVHdWVzdC5ndWVzdEZsaWdodERldGFpbHMudGVybWluYWxGbGlnaHQpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgdmFyIG5ld1Rlcm1pbmFsRmxpZ2h0ID0ge2RpcmVjdGlvbkNvZGU6IFwiVFwifTtcbiAgICAgICAgICAgICAgICAvLyAgICAgdHJhbnNmb3JtT2JqZWN0KHNpbmdsZUd1ZXN0Lmd1ZXN0RmxpZ2h0RGV0YWlscy50ZXJtaW5hbEZsaWdodCwgbmV3VGVybWluYWxGbGlnaHQsIGZsaWdodHNQYXRocyk7XG4gICAgICAgICAgICAgICAgLy8gICAgIC8vcGFyc2UgdGltZXM/XG4gICAgICAgICAgICAgICAgLy8gICAgIGd1ZXN0T2JqLmd1ZXN0RmxpZ2h0RGV0YWlscy5wdXNoKG5ld1Rlcm1pbmFsRmxpZ2h0KTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgLy8gaWYgKHNpbmdsZUd1ZXN0Lmd1ZXN0RmxpZ2h0RGV0YWlscy5vcmlnaW5GbGlnaHQpIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgdmFyIG5ld09yaWdpbkZsaWdodCA9IHtkaXJlY3Rpb25Db2RlOiBcIk9cIn07XG4gICAgICAgICAgICAgICAgLy8gICAgIHRyYW5zZm9ybU9iamVjdChzaW5nbGVHdWVzdC5ndWVzdEZsaWdodERldGFpbHMub3JpZ2luRmxpZ2h0LCBuZXdPcmlnaW5GbGlnaHQsIGZsaWdodHNQYXRocyk7XG4gICAgICAgICAgICAgICAgLy8gICAgIC8vcGFyc2UgdGltZXM/XG4gICAgICAgICAgICAgICAgLy8gICAgIGd1ZXN0T2JqLmd1ZXN0RmxpZ2h0RGV0YWlscy5wdXNoKG5ld09yaWdpbkZsaWdodCk7XG4gICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICAgLy8gaW1taWdyYXRpb25Eb2NJbmZvXG4gICAgICAgICAgICAgICAgLy8gaWYgKHNpbmdsZUd1ZXN0LmltbWlncmF0aW9uRG9jSW5mbykge1xuICAgICAgICAgICAgICAgIC8vICAgICBpZiAoT2JqZWN0LmtleXMoc2luZ2xlR3Vlc3QuaW1taWdyYXRpb25Eb2NJbmZvKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAvL2FkZCBpbW1pZ3JhdGlvbiBpbmZvXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICB2YXIgaW1taWdyYXRpb25QYXRocyA9IFtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICB7d3JpdGU6ICdvY2N1cGF0aW9uQ29kZScsIHJlYWQ6ICdvY2N1cGF0aW9uQ29kZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIHt3cml0ZTogJ2lzc3VlQ291bnRyeUNvZGUnLCByZWFkOiAnaXNzdWVDb3VudHJ5Q29kZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIHt3cml0ZTogJ2JpcnRoQ291bnRyeUNvZGUnLCByZWFkOiAnYmlydGhDb3VudHJ5Q29kZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIHt3cml0ZTogJ2RvY3VtZW50TnVtYmVyJywgcmVhZDogJ2RvY3VtZW50TnVtYmVyJ30sXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAge3dyaXRlOiAnZG9jdW1lbnRUeXBlJywgcmVhZDogJ2RvY3VtZW50VHlwZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIHt3cml0ZTogJ2lzc3VlQ2l0eU5hbWUnLCByZWFkOiAnaXNzdWVDaXR5TmFtZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgIHt3cml0ZTogJ2V4cGlyYXRpb25EYXRlJywgcmVhZDogJ2V4cGlyYXRpb25EYXRlJ30sXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAge3dyaXRlOiAnaXNzdWVEYXRlJywgcmVhZDogJ2lzc3VlRGF0ZSd9XG4gICAgICAgICAgICAgICAgLy8gICAgICAgICBdO1xuICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICAgLy8gZW1lcmdlbmN5Q29udGFjdHMgaXMgYSBzaWJsaW5nIGFycmF5IGluIFBPTEFSLCBidXQgYSBjaGlsZCBvZiBcbiAgICAgICAgICAgICAgICAvLyBlYWNoIHBhc3NlbmdlciBpbiB0aGUgb2xjaSBhcHBcbiAgICAgICAgICAgICAgICAvLyB2YXIgbmV3RW1lcmdlbmN5Q29udGFjdCA9IHtcbiAgICAgICAgICAgICAgICAvLyAgICAgc2VxdWVuY2VOdW1iZXI6IHNpbmdsZUd1ZXN0LnNlcU51bWJlclxuICAgICAgICAgICAgICAgIC8vIH07XG4gICAgICAgICAgICAgICAgLy8gdmFyIGVtZXJnZW5jeVBhdGhzID0gW1xuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdsYXN0TmFtZScsIHJlYWQ6ICdsYXN0TmFtZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdyZWxhdGlvbnNoaXAnLCByZWFkOiAncmVsYXRpb25zaGlwJ30sXG4gICAgICAgICAgICAgICAgLy8gICAgIHt3cml0ZTogJ2d1ZXN0QWRkcmVzcy5zdHJlZXQxJywgcmVhZDogJ3N0cmVldDEnfSxcbiAgICAgICAgICAgICAgICAvLyAgICAge3dyaXRlOiAnZ3Vlc3RBZGRyZXNzLnN0cmVldDInLCByZWFkOiAnc3RyZWV0Mid9LFxuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdndWVzdEFkZHJlc3Muc3RyZWV0MycsIHJlYWQ6ICdzdHJlZXQzJ30sXG4gICAgICAgICAgICAgICAgLy8gICAgIHt3cml0ZTogJ2d1ZXN0QWRkcmVzcy5jaXR5LnZhbHVlJywgcmVhZDogJ2NpdHknfSxcbiAgICAgICAgICAgICAgICAvLyAgICAge3dyaXRlOiAnZ3Vlc3RBZGRyZXNzLnN0YXRlQ29kZScsIHJlYWQ6ICdzdGF0ZSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdndWVzdEFkZHJlc3MuY291bnRyeUNvZGUnLCByZWFkOiAnY291bnRyeSd9LFxuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdndWVzdEFkZHJlc3MuemlwQ29kZScsIHJlYWQ6ICd6aXAnfSxcbiAgICAgICAgICAgICAgICAvLyAgICAge3dyaXRlOiAnZ3Vlc3RBZGRyZXNzLnBob25lLnZhbHVlJywgcmVhZDogJ3ppcCd9LFxuICAgICAgICAgICAgICAgIC8vICAgICB7d3JpdGU6ICdlbWFpbCcsIHJlYWQ6ICdlbWFpbCd9XG4gICAgICAgICAgICAgICAgLy8gXTtcbiAgICAgICAgICAgICAgICAvLyB0cmFuc2Zvcm1PYmplY3Qoc2luZ2xlR3Vlc3QuZW1lcmdlbmN5Q29udGFjdCwgbmV3RW1lcmdlbmN5Q29udGFjdCwgZW1lcmdlbmN5UGF0aHMpO1xuICAgICAgICAgICAgICAgIC8vIC8vb25seSBhZGQgYW4gZW1lcmdlbmN5IGNvbnRhY3QgaWYgdGhlIHVzZXIgaGFzIHN1Ym1pdHRlZCBpbmZvcm1hdGlvbiBhYm91dCB0aGVtXG4gICAgICAgICAgICAgICAgLy8gaWYgKCBPYmplY3Qua2V5cyhuZXdFbWVyZ2VuY3lDb250YWN0KS5sZW5ndGggPiAxICkge1xuICAgICAgICAgICAgICAgIC8vICAgICBzZXJpYWxpemVkUG9sYXIuZW1lcmdlbmN5Q29udGFjdHMucHVzaChuZXdFbWVyZ2VuY3lDb250YWN0KTtcbiAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGN1dEVtcHR5QnJhbmNoZXMoc2VyaWFsaXplZFBvbGFyKTtcbiAgICAgICAgICAgIHJldHVybiBzZXJpYWxpemVkUG9sYXI7IFxuICAgICAgICB9LFxuXG4gICAgICAgIHNlcmlhbGl6ZVdlYkRiOiBmdW5jdGlvbihpbnB1dFdlYkRiLCBwYXNzZW5nZXJzKSB7XG4gICAgICAgICAgICB2YXIgc2VyaWFsaXplZFdlYkRiID0ge0NoZWNrSW5QYXNzZW5nZXI6IFtdfTtcblxuICAgICAgICAgICAgLy9hZGQgY2hlY2tpblBhc3NlbmdlcnNcbiAgICAgICAgICAgIHZhciBwYXNzZW5nZXJQYXRocyA9IFtcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICcnLCByZWFkOiAnJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnJywgcmVhZDogJyd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJycsIHJlYWQ6ICcnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICcnLCByZWFkOiAnJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnJywgcmVhZDogJyd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJycsIHJlYWQ6ICcnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICcnLCByZWFkOiAnJ31cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHZhciBkZXBhcnRCeVBsYW5lU3RhdHVzID0ge307XG4gICAgICAgICAgICBwYXNzZW5nZXJzLmZvckVhY2goZnVuY3Rpb24ocGFzc2VuZ2VyLCBpbmRleCkge1xuICAgICAgICAgICAgICAgIHZhciBuZXdDaGVja0luUGFzc2VuZ2VyID0ge307XG4gICAgICAgICAgICAgICAgdHJhbnNmb3JtT2JqZWN0KHBhc3Nlbmdlci5DaGVja0luUGFzc2VuZ2VyLCBuZXdDaGVja0luUGFzc2VuZ2VyLkNoZWNrSW5QYXNzZW5nZXIsIHJvb3RQYXRocyk7XG4gICAgICAgICAgICAgICAgc2VyaWFsaXplZFdlYkRiLkNoZWNrSW5QYXNzZW5nZXIucHVzaChuZXdDaGVja0luUGFzc2VuZ2VyKTtcblxuICAgICAgICAgICAgICAgIC8vY2hlY2sgaWYgcGFzc2VuZ2VyIGhhcyBpbmRpY2F0ZWQgd2hldGhlciB0aGV5J3JlIGRlcGFydGluZyBieSBwbGFuZVxuICAgICAgICAgICAgICAgIHN3aXRjaCAocGFzc2VuZ2VyLnBhZ2VTdGF0ZXMuZmxpZ2h0cy50cmFuc2ZlclByb3BzLnByZUNydWlzZSkge1xuICAgICAgICAgICAgICAgICAgICBjYXNlICd0cnVlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vd3JpdGUgWSB0byBDaGVja0luUGFzc2VuZ2VyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXBhcnRCeVBsYW5lU3RhdHVzW3Bhc3Nlbmdlci5zZXFOdW1iZXJdID0gJ1knO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2ZhbHNlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vd3JpdGUgTiB0byBDaGVja0luUGFzc2VuZ2VyLmRlcGFydEJ5UGxhbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcGFydEJ5UGxhbmVTdGF0dXNbcGFzc2VuZ2VyLnNlcU51bWJlcl0gPSAnTic7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnbm90WWV0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vd3JpdGUgTSB0byBDaGVja0luUGFzc2VuZ2VyLmRlcGFydEJ5UGxhbmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlcGFydEJ5UGxhbmVTdGF0dXNbcGFzc2VuZ2VyLnNlcU51bWJlcl0gPSAnTSc7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vd3JpdGUgJycgdG8gQ2hlY2tJblBhc3Nlbmdlci5kZXBhcnRCeVBsYW5lXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzZXJpYWxpemVkV2ViRGIuQ2hlY2tJblBhc3Nlbmdlci5mb3JFYWNoKGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgICAgICAgIHZhbC5kZXBhcnRCeVBsYW5lID0gZGVwYXJ0QnlQbGFuZVN0YXR1c1t2YWwucGF4U2VxdWVuY2VdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vSWYgdGhlIGRhdGEgYnJvdWdodCBkb3duIGZyb20gd2ViRGIgZGlkbid0IGhhdmUgZURvY3NGbGFnIGFuZCB0aGV5IGFjY2VwdGVkIHRoZSBlRG9jcyAoY29udHJhY3QgcGFnZSlcbiAgICAgICAgICAgIC8vdGhlbiBhZGQgY29udHJhY3QgaW5mbyBmb3IgdGhpcyBwYXNzZW5nZXIuXG4gICAgICAgICAgICBpZiAoIXBhc3NlbmdlcnNbMF0uQ2hlY2tJblBhc3Nlbmdlci50ZXJtc0NvbmRpdGlvbnNFZG9jc0ZsYWcgJiYgcGFzc2VuZ2Vyc1swXS5wYWdlU3RhdGVzLmNvbnRyYWN0LmFjY2VwdFRlcm1zKSB7XG4gICAgICAgICAgICAgICAgc2VyaWFsaXplV2ViRGIuQ2hlY2tJblBhc3Nlbmdlci5mb3JFYWNoKGZ1bmN0aW9uKHZhbCwgaW5kKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhc3NlbmdlcnMuZm9yRWFjaChmdW5jdGlvbihwYXNzZW5nZXIsIGluZGV4LCBhcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXNzZW5nZXIuc2VxTnVtYmVyID09PSB2YWwucGF4U2VxdWVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWwudGVybXNDb25kaXRpb25zRWRvY3NGbGFnID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbC50ZXJtc0Vkb2NzV2hvQWNjZXB0ZWQgPSBtYWtlQWNjZXB0VGVybXNTdHJpbmcocGFzc2VuZ2Vyc1swXSwgcGFzc2VuZ2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vYWRkIGNoZWNraW5QYXllcnNcbiAgICAgICAgICAgIHZhciBwYXllclBhdGhzID0gW1xuICAgICAgICAgICAgICAgIHt3cml0ZTogJycsIHJlYWQ6ICcnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICcnLCByZWFkOiAnJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnJywgcmVhZDogJyd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJycsIHJlYWQ6ICcnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICcnLCByZWFkOiAnJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnJywgcmVhZDogJyd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJycsIHJlYWQ6ICcnfVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHRyYW5zZm9ybU9iamVjdChpbnB1dFdlYkRiLkNoZWNrSW5QYXllciwgc2VyaWFsaXplZFdlYkRiLCByb290UGF0aHMpO1xuXG4gICAgICAgICAgICAvL2FkZCBjaGVja2luQ292ZXJlZFxuICAgICAgICAgICAgdmFyIGNvdmVyZWRQYXRocyA9IFtcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICcnLCByZWFkOiAnJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnJywgcmVhZDogJyd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJycsIHJlYWQ6ICcnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICcnLCByZWFkOiAnJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnJywgcmVhZDogJyd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJycsIHJlYWQ6ICcnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICcnLCByZWFkOiAnJ31cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICB0cmFuc2Zvcm1PYmplY3QoaW5wdXRXZWJEYi5DaGVja0luQ292ZXJlZCwgc2VyaWFsaXplZFdlYkRiLCByb290UGF0aHMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldFJlbGF0aW9uc2hpcHM6IHJlbGF0aW9uc2hpcHMuZ2V0UmVsYXRpb25zaGlwcyxcblxuICAgICAgICBnZXREb2NUeXBlczogZG9jVHlwZXMuZ2V0RG9jVHlwZXMsXG5cbiAgICAgICAgZ2V0TGFuZ3VhZ2VzOiBsYW5ndWFnZXMuZ2V0TGFuZ3VhZ2VzLFxuXG4gICAgICAgIGdldEFpcnBvcnRDaXRpZXM6IGFpcnBvcnRDaXRpZXMuZ2V0QWlycG9ydENpdGllcyxcblxuICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0T2JqZWN0OiBmdW5jdGlvbiggb2JqICkge1xuICAgICAgICAgICAgdmFyIHN0ciA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICBzdHIucHVzaChlbmNvZGVVUklDb21wb25lbnQocCkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudChvYmpbcF0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gc3RyLmpvaW4oXCImXCIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0cyk7XG4gICAgICAgICAgICByZXR1cm4gc3RyLmpvaW4oXCImXCIpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIG1hdGNoQ292ZXJpbmdXaXRoUGFzc2VuZ2VyKCBndWVzdHMsIGNvdmVyaW5nLCBib29raW5nTnVtYmVyLCBwcm9kQ29kZSApIHtcbiAgICAgICAgaWYgKCBndWVzdHMubGVuZ3RoIDwgMSB8fCAhY292ZXJpbmcgKSByZXR1cm47XG4gICAgICAgIC8vIHZhciBzZXFOdW0gPSBjb3ZlcmluZy5ndWVzdElkLnNsaWNlKCA3LCA4ICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZ3Vlc3RzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgdmFyIGd1ZXN0SWQgPSBib29raW5nTnVtYmVyICsgXG4gICAgICAgICAgICAgICAgemVyb1BhZCggZ3Vlc3RzW2ldLnNlcU51bWJlciApICsgXG4gICAgICAgICAgICAgICAgcHJvZENvZGU7XG5cbiAgICAgICAgICAgIGlmICggZ3Vlc3RJZCA9PT0gY292ZXJpbmcuZ3Vlc3RJZCApIHtcbiAgICAgICAgICAgICAgICBjb3ZlcmluZy5vblRoaXNCb29raW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBndWVzdHNbaV0uY2hlY2tJbkNvdmVyZWQgPSBjb3ZlcmluZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldENhcmREZXRhaWxzKCBjb3ZlcmluZywgY2FyZHMsIG90aGVyQ2FyZHMgKSB7XG4gICAgICAgIGlmICggY292ZXJpbmcubGVuZ3RoIDwgMSB8fCBjYXJkcy5sZW5ndGggPCAxICkgcmV0dXJuO1xuICAgICAgICB2YXIgY2FyZERldGFpbHMgPSB7fTtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgY2FyZHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICBpZiAoIGNhcmRzWyBpIF0uaWRDaGVja2luUGF5ZXIgPT09IGNvdmVyaW5nLmlkQ2hlY2tpblBheWVyICkge1xuICAgICAgICAgICAgICAgIGNhcmREZXRhaWxzLmNhcmRPd25lck5hbWUgPSBjYXJkc1sgaSBdLmZpcnN0TmFtZSArICcgJyArIGNhcmRzWyBpIF0ubGFzdE5hbWU7XG4gICAgICAgICAgICAgICAgY2FyZERldGFpbHMubGFzdEZvdXIgPSBjYXJkc1sgaSBdLmNyZWRpdENhcmRMYXN0Rm91cjtcbiAgICAgICAgICAgICAgICBjYXJkRGV0YWlscy5jYXJkVHlwZSA9IGdldENhcmRUeXBlTmFtZSggY2FyZHNbIGkgXS5jcmVkaXRDYXJkVHlwZSApO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXJkRGV0YWlscztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIG90aGVyQ2FyZHNbIGkgXS5pZENoZWNraW5QYXllciA9PT0gY292ZXJpbmcuaWRDaGVja2luUGF5ZXIgKSB7XG4gICAgICAgICAgICAgICAgY2FyZERldGFpbHMuY2FyZE93bmVyTmFtZSA9IG90aGVyQ2FyZHNbIGkgXS5maXJzdE5hbWUgKyAnICcgKyBvdGhlckNhcmRzWyBpIF0ubGFzdE5hbWU7XG4gICAgICAgICAgICAgICAgY2FyZERldGFpbHMubGFzdEZvdXIgPSBvdGhlckNhcmRzWyBpIF0uY3JlZGl0Q2FyZExhc3RGb3VyO1xuICAgICAgICAgICAgICAgIGNhcmREZXRhaWxzLmNhcmRUeXBlID0gZ2V0Q2FyZFR5cGVOYW1lKCBvdGhlckNhcmRzWyBpIF0uY3JlZGl0Q2FyZFR5cGUgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoUGF5ZXJXaXRoUGFzc2VuZ2VyKCBndWVzdHMsIHBheWVyICkge1xuICAgICAgICBpZiAoIGd1ZXN0cy5sZW5ndGggPCAxIHx8ICFwYXllciApIHJldHVybjtcbiAgICAgICAgdmFyIHNlcU51bSA9IHBheWVyLmd1ZXN0SWQuc2xpY2UoIDcsIDggKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBndWVzdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICBpZiAoIGd1ZXN0c1tpXS5zZXFOdW1iZXIgPT09IHNlcU51bSkge1xuICAgICAgICAgICAgICAgIGd1ZXN0c1tpXS5jaGVja0luUGF5ZXIgPSBwYXllcjtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDYXJkVHlwZU5hbWUoIGNvZGUgKSB7XG4gICAgICAgIHZhciBjYXJkVHlwZXMgPSB7XG4gICAgICAgICAgICAnVkknOiAnVklTQScsXG4gICAgICAgICAgICAnTUMnOiAnTUFTVEVSQ0FSRCcsXG4gICAgICAgICAgICAnREMnOiAnRElTQ09WRVInLFxuICAgICAgICAgICAgJ0FYJzogJ0FNRVJJQ0FORVhQUkVTUydcbiAgICAgICAgfTtcbiAgICAgICAgY29kZSA9IGNvZGUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIGNhcmRUeXBlc1sgY29kZSBdO1xuICAgIH1cblxuICAgIC8vcGFkcyB3aXRoIHplcm9lcywgZS5nLiBpbnB1dDogMiAtPiBvdXRwdXQ6ICcwMidcbiAgICAvL24gaXMgdGhlIGlucHV0IHZhbHVlIHRvIHBhZFxuICAgIC8veiBpcyB0aGUgcGFkZGluZyBjaGFyYWN0ZXIgKGRlZmF1bHRzIHRvICcwJylcbiAgICAvL3dpZHRoIGlzIHRvdGFsIHdpZHRoIG9mIHRoZSBzdHJpbmcgYWZ0ZXIgcGFkZGluZyAoZGVmYXVsdHMgdG8gMilcbiAgICBmdW5jdGlvbiB6ZXJvUGFkKCBuLCB3aWR0aCwgeiApIHtcbiAgICAgICAgeiA9IHogfHwgJzAnO1xuICAgICAgICB3aWR0aCA9IHdpZHRoIHx8IDI7XG4gICAgICAgIG4gPSBuICsgJyc7XG4gICAgICAgIHJldHVybiBuLmxlbmd0aCA+PSB3aWR0aCA/IG4gOiBuZXcgQXJyYXkoIHdpZHRoIC0gbi5sZW5ndGggKyAxICkuam9pbiggeiApICsgbjtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkZXNlcmlhbGl6ZVRpbWUoIHRpbWVTdHJpbmcgKSB7XG4gICAgICAgIGlmICghdGltZVN0cmluZykgcmV0dXJuICcnO1xuICAgICAgICB2YXIgdGltZU9iaiA9IHt9O1xuICAgICAgICB0aW1lT2JqLmhvdXIgPSB0aW1lU3RyaW5nLnNsaWNlKDAsIDIpO1xuICAgICAgICB0aW1lT2JqLm1pbnV0ZSA9IHRpbWVTdHJpbmcuc2xpY2UoMiwgNCk7XG4gICAgICAgIHJldHVybiB0aW1lT2JqO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlcmlhbGl6ZVRpbWUodGltZU9iaikge1xuICAgICAgICB2YXIgaG91ciA9IHplcm9QYWQodGltZU9iai5ob3VyKTtcbiAgICAgICAgdmFyIG1pbnV0ZSA9IHplcm9QYWQodGltZU9iai5taW51dGUpO1xuICAgICAgICB2YXIgdGltZVN0cmluZyA9IGhvdXIgKyBtaW51dGU7XG4gICAgICAgIHJldHVybiB0aW1lU3RyaW5nO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNlcmlhbGl6ZUFycmF5KHBvc3NpYmxlT2JqZWN0KSB7XG4gICAgICAgIHZhciByZXR1cm5BcnJheSA9IFtdO1xuICAgICAgICBpZiAoIUFycmF5LmlzQXJyYXkocG9zc2libGVPYmplY3QpKSB7XG4gICAgICAgICAgICByZXR1cm5BcnJheS5wdXNoKHBvc3NpYmxlT2JqZWN0KTtcbiAgICAgICAgICAgIHJldHVybiByZXR1cm5BcnJheTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlc2VyaWFsaXplRGF0ZShkYXRlU3RyaW5nKSB7XG4gICAgICAgIGlmICghZGF0ZVN0cmluZykgcmV0dXJuO1xuICAgICAgICB2YXIgbW9udGggPSBkYXRlU3RyaW5nLnNsaWNlKDAsIDIpO1xuICAgICAgICB2YXIgZGF0ZSA9IGRhdGVTdHJpbmcuc2xpY2UoMiwgNCk7XG4gICAgICAgIHZhciB5ZWFyID0gZGF0ZVN0cmluZy5zbGljZSg0LCA4KTtcbiAgICAgICAgcmV0dXJuIE1vbWVudEpTKGRhdGVTdHJpbmcsIFsnTU1ERFlZWVknLCAnTU0tREQtWVlZWScsIE1vbWVudEpTLklTT184NjAxXSkudG9EYXRlKCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2VyaWFsaXplSVNPRGF0ZShkYXRlT2JqKSB7XG4gICAgICAgIGlmICghZGF0ZU9iaikgcmV0dXJuO1xuICAgICAgICByZXR1cm4gZGF0ZU9iai50b0lTT1N0cmluZygpO1xuICAgIH1cblxuICAgIC8vdG9kbzogaSBoYXZlbid0IHRlc3RlZCBpZiB0aGlzIHdvcmtzIG9yIG5vdFxuICAgIGZ1bmN0aW9uIHNlcmlhbGl6ZU5vRGVsaW1pdGVyRGF0ZShkYXRlT2JqKSB7XG4gICAgICAgIGlmICghZGF0ZU9iaikgcmV0dXJuO1xuICAgICAgICB2YXIgeWVhciA9IGRhdGVPYmouZ2V0RnVsbFllYXIoKSArICcnO1xuICAgICAgICB2YXIgbW9udGggPSB6ZXJvUGFkKGRhdGVPYmouZ2V0TW9udGgoKSArIDEpO1xuICAgICAgICB2YXIgZGF5ID0gemVyb1BhZChkYXRlT2JqLmdldERhdGUoKSk7XG4gICAgICAgIHZhciBkYXRlU3RyaW5nID0gbW9udGggKyBkYXkgKyB5ZWFyO1xuICAgICAgICByZXR1cm4gZGF0ZVN0cmluZztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzZXJpYWxpemVEYXNoZWREYXRlKGRhdGVPYmopIHtcbiAgICAgICAgaWYgKCFkYXRlT2JqKSByZXR1cm47XG4gICAgICAgIHZhciB5ZWFyID0gZGF0ZU9iai5nZXRGdWxsWWVhcigpICsgJyc7XG4gICAgICAgIHZhciBtb250aCA9IHplcm9QYWQoZGF0ZU9iai5nZXRNb250aCgpICsgMSk7XG4gICAgICAgIHZhciBkYXkgPSB6ZXJvUGFkKGRhdGVPYmouZ2V0RGF0ZSgpKTtcbiAgICAgICAgdmFyIGRhdGVTdHJpbmcgPSBtb250aCArICctJyArIGRheSArICAnLScgKyB5ZWFyO1xuICAgICAgICByZXR1cm4gZGF0ZVN0cmluZztcbiAgICB9XG5cbiAgICAvL2N1dHMgZW1wdHkgYnJhbmNoZXMgb2ZmIHNlcmlhbGl6ZWQgb2JqZWN0c1xuICAgIGZ1bmN0aW9uIGN1dEVtcHR5QnJhbmNoZXMoIG5vZGUgKSB7XG4gICAgICAgIHZhciBpc0FycmF5ID0gbm9kZSBpbnN0YW5jZW9mIEFycmF5O1xuICAgICAgICBmb3IgKHZhciBrIGluIG5vZGUpIHtcbiAgICAgICAgICAgIGlmICggbm9kZVtrXSBpbnN0YW5jZW9mIEFycmF5ICkge1xuICAgICAgICAgICAgICAgIGlmICggbm9kZVtrXS5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlW2tdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN1dEVtcHR5QnJhbmNoZXMoIG5vZGVba10gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBub2RlW2tdIGluc3RhbmNlb2YgT2JqZWN0ICkge1xuICAgICAgICAgICAgICAgIGlmICggT2JqZWN0LmtleXMoIG5vZGVba10gKS5sZW5ndGggPT09IDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlW2tdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN1dEVtcHR5QnJhbmNoZXMoIG5vZGVba10gKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBmdW5jdGlvbiBUcmFuc2Zvcm1VdGlsc1NlcnZpY2Uuc2VyaWFsaXplQ291bnRyeSggY291bnRyeUxhYmVsICkge1xuICAgIC8vICAgICB2YXIgY291bnRyeUNvZGU7XG4gICAgLy8gICAgIGNvdW50cmllcy5mb3JFYWNoKCBmdW5jdGlvbiggZWxlbWVudCwgaW5kZXggKXtcbiAgICAvLyAgICAgICAgIGlmICggZWxlbWVudC5uYW1lID09PSBjb3VudHJ5TGFiZWwgKSB7XG4gICAgLy8gICAgICAgICAgICAgY291bnRyeUNvZGUgPSBlbGVtZW50LmNvZGU7XG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgICByZXR1cm4gY291bnRyeUNvZGU7XG4gICAgLy8gfVxuXG4gICAgLy8gZnVuY3Rpb24gVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLmRlc2VyaWFsaXplQ291bnRyeSggY291bnRyeUNvZGUgKSB7XG4gICAgLy8gICAgIHZhciBjb3VudHJ5TmFtZTtcbiAgICAvLyAgICAgY291bnRyaWVzLmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50LCBpbmRleCApe1xuICAgIC8vICAgICAgICAgaWYgKCBlbGVtZW50LmNvZGUgPT09IGNvdW50cnlDb2RlICkge1xuICAgIC8vICAgICAgICAgICAgIGNvdW50cnlOYW1lID0gZWxlbWVudC5uYW1lO1xuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICB9KTtcbiAgICAvLyAgICAgcmV0dXJuIGNvdW50cnlOYW1lO1xuICAgIC8vIH1cblxufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSggJ29sY2kuc2VydmljZXMuRGVzZXJpYWxpemVTZXJ2aWNlJywgW1xuICAgICduZ1N0b3JhZ2UnLFxuICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nLFxuICAgICdvbGNpLnNlcnZpY2VzLlRyYW5zZm9ybVV0aWxzU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuU2hhcmVkRGF0YVNlcnZpY2UnLFxuICAgICd2ZW5kb3Iuc3RlZWxUb2UnLFxuICAgICdhbmd1bGFyLW1vbWVudGpzJ1xuXSlcblxuLmZhY3RvcnkoICdEZXNlcmlhbGl6ZVNlcnZpY2UnLCBmdW5jdGlvbiggJHNlc3Npb25TdG9yYWdlLCBDb25maWd1cmF0aW9uLCBUcmFuc2Zvcm1VdGlsc1NlcnZpY2UsIFNoYXJlZERhdGFTZXJ2aWNlLCAkcSwgc3RlZWxUb2UsIE1vbWVudEpTICkge1xuICAgIC8vIHZhciBjb3VudHJpZXMgPSBTaGFyZWREYXRhU2VydmljZS5nZXRDb3VudHJpZXMoKTtcblxuICAgIGRlc2VyaWFsaXplU2VydmljZSA9IHtcbiAgICAgICAgZGVzZXJpYWxpemVQb2xhcjogZnVuY3Rpb24oIGlucHV0UG9sYXIsIHRhcmdldCApIHtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICB2YXIgaW5wdXQgPSBhbmd1bGFyLmNvcHkoIGlucHV0UG9sYXIgKTtcbiAgICAgICAgICAgIGNvbnNvbGUuZGlyKCBpbnB1dFBvbGFyICk7XG4gICAgICAgICAgICB0YXJnZXQuZ3Vlc3QgPSB0YXJnZXQuZ3Vlc3QgfHwgW107XG5cbiAgICAgICAgICAgIHZhciByb290UGF0aHMgPSBbXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnYm9va2luZ051bWJlcicsIHJlYWQ6ICdib29raW5nTnVtYmVyJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnYm9va2luZ1N0YXR1cycsIHJlYWQ6ICdib29raW5nU3RhdHVzJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnZnJvbVBvcnROYW1lJywgcmVhZDogJ2Zyb21Qb3J0TmFtZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2Zyb21Qb3J0Q29kZScsIHJlYWQ6ICdmcm9tUG9ydENvZGUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdzYWlsaW5nSWQnLCByZWFkOiAnc2FpbGluZ0lkJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnc3luY2hyb25pemF0aW9uSUQnLCByZWFkOiAnc3luY2hyb25pemF0aW9uSUQnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdzaGlwTmFtZScsIHJlYWQ6ICdzaGlwTmFtZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ3NoaXBDb2RlJywgcmVhZDogJ3NoaXBDb2RlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnc3RhdGVyb29tQ2F0ZWdvcnknLCByZWFkOiAnc3RhdGVyb29tQ2F0ZWdvcnknfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdzdGF0ZXJvb21UeXBlJywgcmVhZDogJ3N0YXRlcm9vbVR5cGUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdzdGF0ZXJvb21OdW1iZXInLCByZWFkOiAnc3RhdGVyb29tTnVtYmVyJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAndG9Qb3J0TmFtZScsIHJlYWQ6ICd0b1BvcnROYW1lJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAndG9Qb3J0Q29kZScsIHJlYWQ6ICd0b1BvcnRDb2RlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAndHJpcERheXMnLCByZWFkOiAndHJpcERheXMnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdpdGluZXJhcnlOYW1lJywgcmVhZDogJ2l0aW5lcmFyeU5hbWUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdjdXJyZW5jeUNvZGUnLCByZWFkOiAnY3VycmVuY3lDb2RlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnY3VycmVuY3lOYW1lJywgcmVhZDogJ2N1cnJlbmN5TmFtZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2N1cnJlbmN5U3ltYm9sJywgcmVhZDogJ2N1cnJlbmN5U3ltYm9sJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAncmF0ZUNvZGUnLCByZWFkOiAncmF0ZUNvZGUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdyYXRlTmFtZScsIHJlYWQ6ICdyYXRlTmFtZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2RlcG9zaXRQYWlkJywgcmVhZDogJ2RlcG9zaXRQYWlkJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnZnVsbFBheW1lbnRQYWlkJywgcmVhZDogJ2Z1bGxQYXltZW50UGFpZCd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ3dlYkl0aW5lcmFyeUlkJywgcmVhZDogJ3dlYkl0aW5lcmFyeUlkJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnYWxsb3dFVScsIHJlYWQ6ICdhbGxvd0VVJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAndHJhdmVsSW5pdGlhdGl2ZVR5cGUnLCByZWFkOiAndHJhdmVsSW5pdGlhdGl2ZVR5cGUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdkZXN0aW5hdGlvbkNvZGUnLCByZWFkOiAnZGVzdGluYXRpb25Db2RlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnZGVzdGluYXRpb25OYW1lJywgcmVhZDogJ2Rlc3RpbmF0aW9uTmFtZSd9LFxuICAgICAgICAgICAgICAgIHt3cml0ZTogJ2Jvb2tpbmdEYXRlJywgcmVhZDogJ2Jvb2tpbmdEYXRlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnc2FpbERhdGUnLCByZWFkOiAnc2FpbERhdGUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdkaXNlbWJhcmtEYXRlJywgcmVhZDogJ2Rpc2VtYmFya0RhdGUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICd0b3RhbENydWlzZUZhcmVBbXQnLCByZWFkOiAndG90YWxDcnVpc2VGYXJlQW10J30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnZGVja0NvZGUnLCByZWFkOiAnY2FiaW5JbmZvLmRlY2tDb2RlJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnY2FiaW5OdW1iZXInLCByZWFkOiAnY2FiaW5JbmZvLmNhYmluTnVtYmVyJ30sXG4gICAgICAgICAgICAgICAge3dyaXRlOiAnY2FiaW5UeXBlJywgcmVhZDogJ2NhYmluSW5mby5jYWJpblR5cGUnfSxcbiAgICAgICAgICAgICAgICB7d3JpdGU6ICdoYXNQUkMnLCByZWFkOiAnaGFzUFJDJ30sIC8vVE9ETzogZmluZCBvdXQgd2hlcmUgdGhpcyBpcyBpbiBQT0xBUiwgVEhJUyBJU04nVCBDT1JSRUNUTFkgTUFQUEVEXG4gICAgICAgICAgICBdO1xuICAgICAgICAgICAgVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLnRyYW5zZm9ybU9iamVjdCggaW5wdXQsIHRhcmdldCwgcm9vdFBhdGhzICk7XG5cbiAgICAgICAgICAgIC8vVE9ETzogbm8gY2x1ZSB3aGF0J3MgZ29pbmcgb24gd2l0aCBjYWJpbiBsb2NhdGlvbnMuIHRoZSBkYXRhIGlzIGNvbXBsZXRlbHkgaW5jb25zaXN0ZW50LlxuICAgICAgICAgICAgLy9yZWNyZWF0ZSBlcnJvcnMgd2l0aCBDTENNQ1EsIExPS0lcbiAgICAgICAgICAgIGlmICggc3RlZWxUb2UuZG8oIGlucHV0ICkuZ2V0KCAnY2FiaW5JbmZvLmNhYmluTG9jYXRpb25zJyApKSB7XG4gICAgICAgICAgICAgICAgLy8gdGFyZ2V0LmNhYmluTG9jYXRpb25OYW1lICAgID0gc3RlZWxUb2UuZG8oaW5wdXQpLmdldCggJ2NhYmluSW5mby5jYWJpbkxvY2F0aW9ucycgKS5maWx0ZXIoZnVuY3Rpb24ob2JqKXtyZXR1cm4gb2JqLmNvZGUgPT09IHRhcmdldC5jYWJpblR5cGU7fSlbMF0uZGVzY3JpcHRpb247XG4gICAgICAgICAgICAgICAgdGFyZ2V0LmNhYmluTG9jYXRpb25OYW1lID0gdGFyZ2V0LmNhYmluVHlwZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaW5wdXQuY2hlY2tpbkd1ZXN0cy5tYXAoZnVuY3Rpb24oIHNpbmdsZUd1ZXN0ICkge1xuICAgICAgICAgICAgICAgIHZhciBzZXFOdW0gPSBzaW5nbGVHdWVzdC5zZXFOdW1iZXIgLSAxO1xuICAgICAgICAgICAgICAgIHRhcmdldC5ndWVzdFsgc2VxTnVtIF0gPSB0YXJnZXQuZ3Vlc3RbIHNlcU51bSBdIHx8IHt9O1xuICAgICAgICAgICAgICAgIHZhciBndWVzdE9iaiA9IHRhcmdldC5ndWVzdFsgc2VxTnVtIF07XG4gICAgICAgICAgICAgICAgZ3Vlc3RPYmouZ3Vlc3RGbGlnaHREZXRhaWxzID0ge307XG4gICAgICAgICAgICAgICAgZ3Vlc3RPYmoudHJhbnNwb3J0YXRpb25Bc3NpZ25tZW50cyA9IHtcbiAgICAgICAgICAgICAgICAgICAgb3JpZ2luOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgdGVybWluYWw6IGZhbHNlXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIHZhciBiYXNpY1BhdGhzID0gW1xuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICd0aXRsZScsIHJlYWQ6ICd0aXRsZS5jb2RlJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2ZpcnN0TmFtZScsIHJlYWQ6ICdmaXJzdE5hbWUnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnbWlkZGxlTmFtZScsIHJlYWQ6ICdtaWRkbGVOYW1lJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2xhc3ROYW1lJywgcmVhZDogJ2xhc3ROYW1lJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ3Bhc3RHdWVzdE51bWJlcicsIHJlYWQ6ICdwYXN0R3Vlc3ROdW1iZXInfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAncmF0ZUNvZGUnLCByZWFkOiAncmF0ZUNvZGUnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnYWdlJywgcmVhZDogJ2FnZS5hbW91bnQnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnZ2VuZGVyJywgcmVhZDogJ2dlbmRlci5kZXNjcmlwdGlvbid9LFxuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdzZXFOdW1iZXInLCByZWFkOiAnc2VxTnVtYmVyJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2VSZWYnLCByZWFkOiAnZVJlZid9LFxuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdzdGF0dXNEZXNjcmlwdGlvbicsIHJlYWQ6ICdzdGF0dXNEZXNjcmlwdGlvbid9LFxuICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICduYXRpb25hbGl0eScsIHJlYWQ6ICduYXRpb25hbGl0eS5jb2RlJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ3Jlc2lkZW5jeUluZCcsIHJlYWQ6ICdyZXNpZGVuY3lJbmQnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnY291bnRyeU9mUmVzaWRlbmNlJywgcmVhZDogJ2NvdW50cnlPZlJlc2lkZW5jZS5jb2RlJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2NvbnRhY3RQaG9uZScsIHJlYWQ6ICdjb250YWN0UGhvbmUubnVtYmVyJ30sXG4gICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2JpcnRoRGF0ZScsIHJlYWQ6ICdiaXJ0aERhdGUudmFsdWUnfSxcbiAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnaG9tZUNpdHknLCByZWFkOiAnaG9tZUNpdHkuY29kZSd9XG4gICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICBUcmFuc2Zvcm1VdGlsc1NlcnZpY2UudHJhbnNmb3JtT2JqZWN0KCBzaW5nbGVHdWVzdCwgZ3Vlc3RPYmosIGJhc2ljUGF0aHMgKTtcblxuICAgICAgICAgICAgICAgIC8vIHRoZSBkcm9wZG93bnMgdXNlIGNvdW50cnkgbmFtZSwgbm90IGNvZGU7IHRoaXMgdHJhbnNmb3JtcyBjb2RlIHRvIG5hbWVcbiAgICAgICAgICAgICAgICBndWVzdE9iai5uYXRpb25hbGl0eSA9IGRlc2VyaWFsaXplU2VydmljZS5kZXNlcmlhbGl6ZUNvdW50cnkoIGd1ZXN0T2JqLm5hdGlvbmFsaXR5ICk7XG4gICAgICAgICAgICAgICAgZ3Vlc3RPYmouY291bnRyeU9mUmVzaWRlbmNlID0gZGVzZXJpYWxpemVTZXJ2aWNlLmRlc2VyaWFsaXplQ291bnRyeSggZ3Vlc3RPYmouY291bnRyeU9mUmVzaWRlbmNlICk7XG5cbiAgICAgICAgICAgICAgICAvLyBwYXJzZSBiaXJ0aGRheVxuICAgICAgICAgICAgICAgIGlmIChndWVzdE9iai5iaXJ0aERhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouYmlydGhEYXRlID0gZGVzZXJpYWxpemVTZXJ2aWNlLmRlc2VyaWFsaXplRGF0ZSggZ3Vlc3RPYmouYmlydGhEYXRlICk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHBhc3RHdWVzdExveWFsdHkgPSBhbmd1bGFyLmNvcHkoIHNpbmdsZUd1ZXN0LnBhc3RHdWVzdExveWFsdHkgKSB8fCAnJztcbiAgICAgICAgICAgICAgICBndWVzdE9iai5wYXN0R3Vlc3RMb3lhbHR5ID0gX3dvcmRUb051bSggcGFzdEd1ZXN0TG95YWx0eS5zcGxpdCggJyAnIClbMF0gKTtcblxuXG4gICAgICAgICAgICAgICAgLy9hZGRyZXNzZXMgYXJlIGluIGFuIGFycmF5OyB0aGV5IGRvbid0IGNvbWUgaW4gYSBjb25zaXN0ZW50IG9yZGVyIHNvIHdlIG5lZWQgdG8gXG4gICAgICAgICAgICAgICAgLy9pdGVyYXRlIHRocm91Z2ggdGhlIGFycmF5IGFuZCBmaW5kIGlmIGl0J3MgaG9tZSBvciBkZXN0aW5hdGlvbiBhZGRyZXNzXG4gICAgICAgICAgICAgICAgc2luZ2xlR3Vlc3QuYWRkcmVzcy5tYXAoIGZ1bmN0aW9uKCBhZGRyZXNzICkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaG9tZVBhdGhzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnc3RyZWV0MScsIHJlYWQ6ICdzdHJlZXQxJ30sXG4gICAgICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdzdHJlZXQyJywgcmVhZDogJ3N0cmVldDInfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ3N0cmVldDMnLCByZWFkOiAnc3RyZWV0Myd9LFxuICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnaG91c2VOYW1lJywgcmVhZDogJ2hvdXNlTmFtZSd9LFxuICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnY2l0eScsIHJlYWQ6ICdjaXR5LnZhbHVlJ30sXG4gICAgICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdzdGF0ZScsIHJlYWQ6ICdzdGF0ZU5hbWUnfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2NvdW50cnknLCByZWFkOiAnY291bnRyeUNvZGUnfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ3ppcENvZGUnLCByZWFkOiAnemlwQ29kZSd9LFxuICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAncGhvbmUnLCByZWFkOiAncGhvbmUubnVtYmVyJ31cbiAgICAgICAgICAgICAgICAgICAgXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBhZGRyZXNzLmFkZHJlc3NUeXBlID09PSAnSCcgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBndWVzdE9iai5ob21lQWRkcmVzcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLnRyYW5zZm9ybU9iamVjdCggYWRkcmVzcywgZ3Vlc3RPYmouaG9tZUFkZHJlc3MsIGhvbWVQYXRocyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouaG9tZUFkZHJlc3MuY291bnRyeSA9IGRlc2VyaWFsaXplU2VydmljZS5kZXNlcmlhbGl6ZUNvdW50cnkoIGd1ZXN0T2JqLmhvbWVBZGRyZXNzLmNvdW50cnkgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGd1ZXN0T2JqLmhvbWVBZGRyZXNzLnN0YXRlID0gYXNzaWduU3RhdGUoZ3Vlc3RPYmouaG9tZUFkZHJlc3Muc3RhdGUpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtndWVzdE9iai5ob21lQWRkcmVzcy5zdGF0ZSA9IHJlc3VsdDt9KTtcbiAgICAgICAgICAgICAgICAgICAgfSBcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBhZGRyZXNzLmFkZHJlc3NUeXBlID09PSAnRCcgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBndWVzdE9iai5kZXN0QWRkcmVzcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLnRyYW5zZm9ybU9iamVjdCggYWRkcmVzcywgZ3Vlc3RPYmouZGVzdEFkZHJlc3MsIGhvbWVQYXRocyApO1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouZGVzdEFkZHJlc3MuY291bnRyeSA9IGRlc2VyaWFsaXplU2VydmljZS5kZXNlcmlhbGl6ZUNvdW50cnkoIGd1ZXN0T2JqLmRlc3RBZGRyZXNzLmNvdW50cnkgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGd1ZXN0T2JqLmRlc3RBZGRyZXNzLnN0YXRlID0gYXNzaWduU3RhdGUoZ3Vlc3RPYmouZGVzdEFkZHJlc3Muc3RhdGUpLnRoZW4oZnVuY3Rpb24ocmVzdWx0KXtndWVzdE9iai5kZXN0QWRkcmVzcy5zdGF0ZSA9IHJlc3VsdDt9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKCBzdGVlbFRvZS5kbyggc2luZ2xlR3Vlc3QgKS5nZXQoICdndWVzdEZsaWdodERldGFpbHMnICkgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vZmxpZ2h0cyBhcmUgaW4gYW4gYXJyYXk7IHRoZXkgZG9uJ3QgY29tZSBpbiBhIGNvbnNpc3RlbnQgb3JkZXIgc28gd2UgbmVlZCB0b1xuICAgICAgICAgICAgICAgICAgICAvL2l0ZXJhdGUgdGhyb3VnaCB0aGUgYXJyYXkgYW5kIGZpbmQgaWYgaXQncyBob21lIG9yIGRlc3RpbmF0aW9uIGFkZHJlc3NcbiAgICAgICAgICAgICAgICAgICAgc2luZ2xlR3Vlc3QuZ3Vlc3RGbGlnaHREZXRhaWxzLm1hcCggZnVuY3Rpb24oIGZsaWdodCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvbGRGbGlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgbmV3RmxpZ2h0O1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmxpZ2h0UGF0aHMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnZGVwYXJ0Q2l0eUNvZGUnLCByZWFkOiAnZGVwYXJ0Q2l0eUNvZGUnfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7d3JpdGU6ICdhcnJpdmVDaXR5Q29kZScsIHJlYWQ6ICdhcnJpdmVDaXR5Q29kZSd9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2NhcnJpZXJOYW1lJywgcmVhZDogJ2NhcnJpZXJOYW1lJ30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnZmxpZ2h0TnVtYmVyJywgcmVhZDogJ2ZsaWdodE51bWJlcid9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2RlcGFydHVyZURhdGUnLCByZWFkOiAnZGVwYXJ0dXJlRGF0ZSd9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHt3cml0ZTogJ2Fycml2YWxEYXRlJywgcmVhZDogJ2Fycml2YWxEYXRlJ30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnZGVwYXJ0dXJlVGltZScsIHJlYWQ6ICdkZXBhcnR1cmVUaW1lJ30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3dyaXRlOiAnYXJyaXZhbFRpbWUnLCByZWFkOiAnYXJyaXZhbFRpbWUnfSAgXG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIGZsaWdodC5kaXJlY3Rpb25Db2RlID09PSAnTycgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouZ3Vlc3RGbGlnaHREZXRhaWxzLm9yaWdpbkZsaWdodCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZsaWdodCA9IGd1ZXN0T2JqLmd1ZXN0RmxpZ2h0RGV0YWlscy5vcmlnaW5GbGlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkRmxpZ2h0ID0gZmxpZ2h0LmZsaWdodFNlZ21lbnREZXRhaWw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUcmFuc2Zvcm1VdGlsc1NlcnZpY2UudHJhbnNmb3JtT2JqZWN0KCBvbGRGbGlnaHQsIG5ld0ZsaWdodCwgZmxpZ2h0UGF0aHMgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZsaWdodC5kZXBhcnR1cmVEYXRlID0gZGVzZXJpYWxpemVTZXJ2aWNlLmRlc2VyaWFsaXplRGF0ZSggbmV3RmxpZ2h0LmRlcGFydHVyZURhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdGbGlnaHQuYXJyaXZhbERhdGUgPSBkZXNlcmlhbGl6ZVNlcnZpY2UuZGVzZXJpYWxpemVEYXRlKCBuZXdGbGlnaHQuYXJyaXZhbERhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdGbGlnaHQuZGVwYXJ0dXJlVGltZSA9IF9kZXNlcmlhbGl6ZVRpbWUoIG5ld0ZsaWdodC5kZXBhcnR1cmVUaW1lICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RmxpZ2h0LmFycml2YWxUaW1lID0gX2Rlc2VyaWFsaXplVGltZSggbmV3RmxpZ2h0LmFycml2YWxUaW1lICk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBndWVzdE9iai5ndWVzdEZsaWdodERldGFpbHMub3JpZ2luRmxpZ2h0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBkZXBhcnRDaXR5Q29kZTogZmxpZ2h0LmZsaWdodFNlZ21lbnREZXRhaWwuZGVwYXJ0Q2l0eUNvZGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGFycml2ZUNpdHlDb2RlOiBmbGlnaHQuZmxpZ2h0U2VnbWVudERldGFpbC5hcnJpdmVDaXR5Q29kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgY2Fycmllck5hbWU6IGZsaWdodC5mbGlnaHRTZWdtZW50RGV0YWlsLmNhcnJpZXJOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBmbGlnaHROdW1iZXI6IGZsaWdodC5mbGlnaHRTZWdtZW50RGV0YWlsLmZsaWdodE51bWJlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGd1ZXN0T2JqLmd1ZXN0RmxpZ2h0RGV0YWlscy5vcmlnaW5GbGlnaHQuZGVwYXJ0dXJlRGF0ZSA9IGRlc2VyaWFsaXplU2VydmljZS5kZXNlcmlhbGl6ZURhdGUoIGZsaWdodC5mbGlnaHRTZWdtZW50RGV0YWlsLmRlcGFydHVyZURhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBndWVzdE9iai5ndWVzdEZsaWdodERldGFpbHMub3JpZ2luRmxpZ2h0LmFycml2YWxEYXRlID0gZGVzZXJpYWxpemVTZXJ2aWNlLmRlc2VyaWFsaXplRGF0ZSggZmxpZ2h0LmZsaWdodFNlZ21lbnREZXRhaWwuYXJyaXZhbERhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBndWVzdE9iai5ndWVzdEZsaWdodERldGFpbHMub3JpZ2luRmxpZ2h0LmRlcGFydHVyZVRpbWUgPSBfZGVzZXJpYWxpemVUaW1lKCBmbGlnaHQuZmxpZ2h0U2VnbWVudERldGFpbC5kZXBhcnR1cmVUaW1lICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ3Vlc3RPYmouZ3Vlc3RGbGlnaHREZXRhaWxzLm9yaWdpbkZsaWdodC5hcnJpdmFsVGltZSA9IF9kZXNlcmlhbGl6ZVRpbWUoIGZsaWdodC5mbGlnaHRTZWdtZW50RGV0YWlsLmFycml2YWxUaW1lICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICggZmxpZ2h0LmRpcmVjdGlvbkNvZGUgPT09ICdUJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBndWVzdE9iai5ndWVzdEZsaWdodERldGFpbHMudGVybWluYWxGbGlnaHQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdGbGlnaHQgPSBndWVzdE9iai5ndWVzdEZsaWdodERldGFpbHMudGVybWluYWxGbGlnaHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkRmxpZ2h0ID0gZmxpZ2h0LmZsaWdodFNlZ21lbnREZXRhaWw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBUcmFuc2Zvcm1VdGlsc1NlcnZpY2UudHJhbnNmb3JtT2JqZWN0KCBvbGRGbGlnaHQsIG5ld0ZsaWdodCwgZmxpZ2h0UGF0aHMgKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0ZsaWdodC5kZXBhcnR1cmVEYXRlID0gZGVzZXJpYWxpemVTZXJ2aWNlLmRlc2VyaWFsaXplRGF0ZSggbmV3RmxpZ2h0LmRlcGFydHVyZURhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdGbGlnaHQuYXJyaXZhbERhdGUgPSBkZXNlcmlhbGl6ZVNlcnZpY2UuZGVzZXJpYWxpemVEYXRlKCBuZXdGbGlnaHQuYXJyaXZhbERhdGUgKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdGbGlnaHQuZGVwYXJ0dXJlVGltZSA9IF9kZXNlcmlhbGl6ZVRpbWUoIG5ld0ZsaWdodC5kZXBhcnR1cmVUaW1lICk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3RmxpZ2h0LmFycml2YWxUaW1lID0gX2Rlc2VyaWFsaXplVGltZSggbmV3RmxpZ2h0LmFycml2YWxUaW1lICk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vd2Ugb25seSBuZWVkIHRvIGRldGVybWluZSBpZiB0aGV5IGhhdmUgRVotQWlyIGZsaWdodHMgb3Igbm90LCB3ZSBkb24ndCBuZWVkIGFueSBkZXRhaWxzIGFib3V0IGl0XG4gICAgICAgICAgICAgICAgaWYgKCBzdGVlbFRvZS5kbyggc2luZ2xlR3Vlc3QgKS5nZXQoICd0cmFuc3BvcnRhdGlvbkFzc2lnbm1lbnRzJyApICkge1xuICAgICAgICAgICAgICAgICAgICBzaW5nbGVHdWVzdC50cmFuc3BvcnRhdGlvbkFzc2lnbm1lbnRzLm1hcChmdW5jdGlvbihmbGlnaHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmbGlnaHQuZGlyZWN0aW9uQ29kZSA9PT0gXCJPXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBndWVzdE9iai50cmFuc3BvcnRhdGlvbkFzc2lnbm1lbnRzLm9yaWdpbiA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZsaWdodC5kaXJlY3Rpb25Db2RlID09PSBcIlRcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGd1ZXN0T2JqLnRyYW5zcG9ydGF0aW9uQXNzaWdubWVudHMudGVybWluYWwgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJbW1pZ3JhdGlvbiBkYXRhIC0gcGFzc3BvcnQsIGV0Yy5cbiAgICAgICAgICAgICAgICBpZiAoIHN0ZWVsVG9lLmRvKCBzaW5nbGVHdWVzdCApLmdldCggJ2ltbWlncmF0aW9uRG9jSW5mbycgKSApIHtcbiAgICAgICAgICAgICAgICAgICAgZ3Vlc3RPYmouaW1taWdyYXRpb25Eb2NJbmZvID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZG9jdW1lbnRUeXBlICAgICAgICAgIDogZG9jVHlwZXMuZGVzZXJpYWxpemUoIHN0ZWVsVG9lLmRvKCBzaW5nbGVHdWVzdCApLmdldCggJ2ltbWlncmF0aW9uRG9jSW5mby5kb2N1bWVudFR5cGUnICkgKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50TnVtYmVyQ29uZmlybSA6IHN0ZWVsVG9lLmRvKCBzaW5nbGVHdWVzdCApLmdldCggJ2ltbWlncmF0aW9uRG9jSW5mby5kb2N1bWVudE51bWJlcicgKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBndWVzdE9iai5pbW1pZ3JhdGlvbkRvY0luZm8uZG9jdW1lbnRUeXBlID0gZG9jVHlwZXMuZGVzZXJpYWxpemUoIHN0ZWVsVG9lLmRvKCBzaW5nbGVHdWVzdCApLmdldCggJ2ltbWlncmF0aW9uRG9jSW5mby5kb2N1bWVudFR5cGUnICkgKS50aGVuKCBmdW5jdGlvbiAocmVzdWx0KSB7IGd1ZXN0T2JqLmltbWlncmF0aW9uRG9jSW5mby5kb2N1bWVudFR5cGUgPSByZXN1bHQ7IH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbW1pZ3JhdGlvblBhdGhzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdpc3N1ZUNvdW50cnlDb2RlJywgcmVhZCA6ICdpc3N1ZUNvdW50cnlDb2RlJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8geyB3cml0ZSA6ICdpc3N1ZUNvdW50cnlOYW1lJywgcmVhZCA6ICdpc3N1ZUNvdW50cnlOYW1lJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdpc3N1ZUNpdHlOYW1lJywgICAgcmVhZCA6ICdpc3N1ZUNpdHlOYW1lJyB9LFxuXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ2JpcnRoQ291bnRyeUNvZGUnLCByZWFkIDogJ2JpcnRoQ291bnRyeUNvZGUnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ2JpcnRoQ291bnRyeU5hbWUnLCByZWFkIDogJ2JpcnRoQ291bnRyeU5hbWUnIH0sXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHsgd3JpdGUgOiAnZG9jdW1lbnRUeXBlJywgICAgIHJlYWQgOiAnZG9jdW1lbnRUeXBlJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdkb2N1bWVudE51bWJlcicsICAgcmVhZCA6ICdkb2N1bWVudE51bWJlcicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgd3JpdGUgOiAnZXhwaXJhdGlvbkRhdGUnLCAgIHJlYWQgOiAnZXhwaXJhdGlvbkRhdGUnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ2lzc3VlRGF0ZScsICAgICAgICByZWFkIDogJ2lzc3VlRGF0ZScgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogcGxhY2VPZkJpcnRoICAgICAgICAgICAgLSBcImNoZWNraW5XZWJEYlwiOiB7IFwiY2hlY2tpblBhc3NlbmdlcnNcIjogWyB7IFwicGxhY2VPZkJpcnRoXCI6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVtZXJnZW5jeUFpciAgICAgICAgICAgIC0gXCJjaGVja2luV2ViRGJcIjogeyBcImNoZWNraW5QYXNzZW5nZXJzXCI6IFsgeyBcImVtZXJnZW5jeUFpclwiOiBcIlBIWFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0ZXJtc0NvbmRpdGlvbnNWaXNhRmxhZyAtIFwiY2hlY2tpbldlYkRiXCI6IHsgXCJjaGVja2luUGFzc2VuZ2Vyc1wiOiBbIHsgXCJpbW1pZ3JhdGlvbkNvbXBsZXRlRmxhZ1wiOiAxNDM1NDQxNDY1MDAwXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBsYW5nUHJlZkNvZGUgICAgICAgICAgICAtIFwiY2hlY2tpbldlYkRiXCI6IHsgXCJjaGVja2luUGFzc2VuZ2Vyc1wiOiBbIHsgXCJsYW5nUHJlZkNvZGVcIjogXCJlblwiXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiB1c2luZ0JpcnRoQ2VydGlmaWNhdGUgICAtIFwiY2hlY2tpbldlYkRiXCI6IHsgXCJjaGVja2luUGFzc2VuZ2Vyc1wiOiBbIHsgXCJ1c2luZ0JpcnRoQ2VydGlmaWNhdGVcIjogXCJOXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVmlzYSBwbGFjZSBvZiBpc3N1YW5jZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVmlzYSBjb250cm9sIG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogVmlzYSBpc3N1ZSBkYXRlXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBWaXNhIGV4cGlyZSBkYXRlXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHBlcm1SZXNpZGVudFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogcGVybVJlc2lkZW50Q2FyZE51bWJlclxuICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICBUcmFuc2Zvcm1VdGlsc1NlcnZpY2UudHJhbnNmb3JtT2JqZWN0KCBzaW5nbGVHdWVzdC5pbW1pZ3JhdGlvbkRvY0luZm8sIGd1ZXN0T2JqLmltbWlncmF0aW9uRG9jSW5mbywgaW1taWdyYXRpb25QYXRocyApO1xuICAgICAgICAgICAgICAgICAgICBndWVzdE9iai5pbW1pZ3JhdGlvbkRvY0luZm8uaXNzdWVDb3VudHJ5Q29kZSA9IGRlc2VyaWFsaXplU2VydmljZS5kZXNlcmlhbGl6ZUNvdW50cnkoIGd1ZXN0T2JqLmltbWlncmF0aW9uRG9jSW5mby5pc3N1ZUNvdW50cnlDb2RlICk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgLy8gTm90IHN1cmUgaWYgZXZlcnkgZ3Vlc3QgaXMgZ29pbmcgdG8gaGF2ZSBhIG5vdGlmaWNhdGlvbi5cbiAgICAgICAgICAgICAgICBpZiAoIHNpbmdsZUd1ZXN0Lm5vdGlmaWNhdGlvbnMgKSB7XG4gICAgICAgICAgICAgICAgICAgIGd1ZXN0T2JqLm5vdGlmaWNhdGlvbnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgc2luZ2xlR3Vlc3Qubm90aWZpY2F0aW9ucy5tYXAoZnVuY3Rpb24obm90aWZpY2F0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBndWVzdE9iai5ub3RpZmljYXRpb25zLnB1c2gobm90aWZpY2F0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBndWVzdE9iai5ub3RpZmljYXRpb25zID0gW3tcIm5vdGlmaWNhdGlvblwiOiBcIlwifV07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy9hZGQgcGFnZSBzdGF0ZXMgdG8gZWFjaCBndWVzdFxuICAgICAgICAgICAgICAgIGd1ZXN0T2JqLnBhZ2VTdGF0ZXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGRldGFpbHM6IHt9LFxuICAgICAgICAgICAgICAgICAgICBwYXNzcG9ydDoge30sXG4gICAgICAgICAgICAgICAgICAgIGZsaWdodHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYW5zZmVyUHJvcHM6IHt9IC8vdGhlc2UgYXJlIHRoZSBzdGF0ZSBwcm9wZXJ0aWVzIHRoYXQgZ2V0IGNvcGllZCB3aGVuIHlvdSBjbGljayBcIlNhbWUgYXMgbWFpbiBwYXNzZW5nZXJcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlbWVyZ2VuY3k6IHt9LFxuICAgICAgICAgICAgICAgICAgICBhY2NvdW50OiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYzoge31cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgY29udHJhY3Q6IHt9LFxuICAgICAgICAgICAgICAgICAgICBwcmVmZXJlbmNlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGlldDoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBtZWRpY2FsOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNlbGVicmF0aW9uczoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBiZW5lZml0czoge31cbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgc3VtbWFyeToge31cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vZW1lcmdlbmN5IGNvbnRhY3RzIGZvciBlYWNoIHBhc3NlbmdlciBhcmUgc3RvcmVkIGluIGEgc2VwYXJhdGUgYXJyYXlcbiAgICAgICAgICAgIGlmICggaW5wdXQuZW1lcmdlbmN5Q29udGFjdHMgKSB7XG4gICAgICAgICAgICAgICAgaW5wdXQuZW1lcmdlbmN5Q29udGFjdHMubWFwKGZ1bmN0aW9uKCBjb250YWN0ICkge1xuICAgICAgICAgICAgICAgICAgICAvL2luZGV4aW5nIGhlcmUgaXMgY29uc2lzdGVudCB3aXRoIHRoZSBhcHByb2FjaCB1c2VkIGFib3ZlIHdoaWxlIGNyZWF0aW5nIGVhY2ggdXNlclxuICAgICAgICAgICAgICAgICAgICB2YXIgZ3Vlc3QgPSB0YXJnZXQuZ3Vlc3RbIGNvbnRhY3Quc2VxdWVuY2VOdW1iZXIgLSAxIF07IFxuICAgICAgICAgICAgICAgICAgICBndWVzdC5lbWVyZ2VuY3lDb250YWN0ID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGhvbmUgOiBzdGVlbFRvZS5kbyggY29udGFjdCApLmdldCggJ2NvbnRhY3RQaG9uZXMnICkgPyBzdGVlbFRvZS5kbyggY29udGFjdC5jb250YWN0UGhvbmVzWyAwIF0gKS5nZXQoICdudW1iZXInICkgOiAnJ1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBndWVzdC5lbWVyZ2VuY3lDb250YWN0LnJlbGF0aW9uc2hpcCA9IHJlbGF0aW9uc2hpcHMuZGVzZXJpYWxpemUoIHN0ZWVsVG9lLmRvKGNvbnRhY3QpLmdldCggJ3JlbGF0aW9uc2hpcCcgKSApLnRoZW4oIGZ1bmN0aW9uIChyZXN1bHQpIHsgZ3Vlc3QuZW1lcmdlbmN5Q29udGFjdC5yZWxhdGlvbnNoaXAgPSByZXN1bHQ7IH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb250YWN0UGF0aHMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ2xhc3ROYW1lJywgcmVhZCA6ICdsYXN0TmFtZScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgd3JpdGUgOiAnc3RyZWV0MScsICByZWFkIDogJ2d1ZXN0QWRkcmVzcy5zdHJlZXQxJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdzdHJlZXQyJywgIHJlYWQgOiAnZ3Vlc3RBZGRyZXNzLnN0cmVldDInIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ3N0cmVldDMnLCAgcmVhZCA6ICdndWVzdEFkZHJlc3Muc3RyZWV0MycgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgd3JpdGUgOiAnY2l0eScsICAgICByZWFkIDogJ2d1ZXN0QWRkcmVzcy5jaXR5JyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdzdGF0ZScsICAgIHJlYWQgOiAnZ3Vlc3RBZGRyZXNzLnN0YXRlJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdjb3VudHJ5JywgIHJlYWQgOiAnZ3Vlc3RBZGRyZXNzLmNvdW50cnknIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHdyaXRlIDogJ3ppcCcsICAgICAgcmVhZCA6ICdndWVzdEFkZHJlc3MuemlwJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyB3cml0ZSA6ICdlbWFpbCcsICAgIHJlYWQgOiAnZ3Vlc3RBZGRyZXNzLmVtYWlsJyB9XG4gICAgICAgICAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgICAgICAgICAgVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLnRyYW5zZm9ybU9iamVjdCggY29udGFjdCwgZ3Vlc3QuZW1lcmdlbmN5Q29udGFjdCwgY29udGFjdFBhdGhzICk7XG4gICAgICAgICAgICAgICAgICAgIGd1ZXN0LmVtZXJnZW5jeUNvbnRhY3QuY291bnRyeSA9IGRlc2VyaWFsaXplU2VydmljZS5kZXNlcmlhbGl6ZUNvdW50cnkoIGd1ZXN0LmVtZXJnZW5jeUNvbnRhY3QuY291bnRyeSApO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCB0YXJnZXQgKTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8vd2ViRGI6IFNlcmlhbGl6ZWQgZGF0YSBmcm9tIHdlYkRiIHRvIGJlIGRlc2VyaWFsaXplZFxuICAgICAgICAvL3RhcmdldDogUmVwb3NpdG9yeSBmb3IgZGVzZXJpYWxpemVkIGluZm8uIE1vc3Qgb2YgdGhlIHRpbWUgaXQncyAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8sXG4gICAgICAgIC8vICBidXQgQWNjb3VudHNDb250cm9sbGVyIHVzZXMgaXQgdG9vIHRvIGRlYWwgd2l0aCBjb3ZlcmluZyBndWVzdHMgb24gb3RoZXIgYm9va2luZ3NcbiAgICAgICAgZGVzZXJpYWxpemVXZWJEYjogZnVuY3Rpb24oIHdlYkRiLCB0YXJnZXQgKSB7XG4gICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICAgICAgZ2V0QWlycG9ydENpdGllcyA9IGFpcnBvcnRDaXRpZXMoKTtcblxuICAgICAgICAgICAgLy9iYWNrZW5kIGlzIGluamVjdGluZyB0cmFpbGluZyB3aGl0ZXNwYWNlIGludG8gdGhpcyBlbnRyeVxuICAgICAgICAgICAgaWYgKCB3ZWJEYi5jb3ZlcmVkUGFzc2VuZ2VycyApIHtcbiAgICAgICAgICAgICAgICB3ZWJEYi5jb3ZlcmVkUGFzc2VuZ2Vycy5tYXAoZnVuY3Rpb24oIGNvdmVyaW5nICkge1xuICAgICAgICAgICAgICAgICAgICBjb3ZlcmluZy5ndWVzdElkID0gY292ZXJpbmcuZ3Vlc3RJZC50cmltKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRhcmdldC5jaGVja0luUGF5ZXIgPSBhbmd1bGFyLmNvcHkod2ViRGIuY2hlY2tpblBheWVycykgfHwgW107XG4gICAgICAgICAgICB0YXJnZXQuY2hlY2tJbkNvdmVyZWQgPSBhbmd1bGFyLmNvcHkod2ViRGIuY292ZXJlZFBhc3NlbmdlcnMpIHx8IFtdO1xuXG4gICAgICAgICAgICAvLyBkZWxldGUgdmVzdGlnaWFsIGNhcmRzIGFuZCBjb3ZlcmluZ3NcbiAgICAgICAgICAgIHRhcmdldC5ndWVzdC5tYXAoZnVuY3Rpb24oIGd1ZXN0ICkge1xuICAgICAgICAgICAgICAgIGd1ZXN0LmNoZWNrSW5Db3ZlcmVkID0gbnVsbDtcbiAgICAgICAgICAgICAgICBndWVzdC5jaGVja0luUGF5ZXIgPSBudWxsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIC8vY29weSBlYWNoIENoZWNrSW5QYXNzZW5nZXIgYW5kIGFzc2lnbiB0aGVtIHRvIHRoZWlyIHJlc3BlY3RpdmUgZ3Vlc3RcbiAgICAgICAgICAgIHdlYkRiLmNoZWNraW5QYXNzZW5nZXJzLm1hcChmdW5jdGlvbiggcGFzc2VuZ2VyICkge1xuICAgICAgICAgICAgICAgIHZhciBzZXFOdW0gPSBwYXNzZW5nZXIucGF4U2VxdWVuY2UgLSAxO1xuICAgICAgICAgICAgICAgIHRhcmdldC5ndWVzdFsgc2VxTnVtIF0gPSB0YXJnZXQuZ3Vlc3RbIHNlcU51bSBdIHx8IHt9O1xuICAgICAgICAgICAgICAgIHRhcmdldC5ndWVzdFsgc2VxTnVtIF0uQ2hlY2tJblBhc3NlbmdlciA9IGFuZ3VsYXIuY29weSggcGFzc2VuZ2VyICk7IC8vVE9ETzogYnJlYWsgdGhlc2Ugb3V0IGludG8gZWxlbWVudHMgYW5kIHRyYW5zZm9ybSBkYXRlc1xuXG4gICAgICAgICAgICAgICAgLy9hc3NpZ24gY2FyZHMgdG8gcGFzc2VuZ2VycyAoc2hhbGxvdyBjb3B5IG9mIGNoZWNrSW5QYXllcilcbiAgICAgICAgICAgICAgICBpZiAodGFyZ2V0LmNoZWNrSW5QYXllcikge1xuICAgICAgICAgICAgICAgICAgICB0YXJnZXQuY2hlY2tJblBheWVyLm1hcChmdW5jdGlvbiggY2FyZCApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggY2FyZC5pZENoZWNraW4gPT09IHBhc3Nlbmdlci5pZENoZWNraW4gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VuZ2VyLmNoZWNrSW5QYXllciA9IGNhcmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICggdGFyZ2V0Lmd1ZXN0WyBzZXFOdW0gXS5DaGVja0luUGFzc2VuZ2VyLmxhbmdQcmVmQ29kZSApIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Lmd1ZXN0WyBzZXFOdW0gXS5DaGVja0luUGFzc2VuZ2VyLmxhbmdQcmVmQ29kZSA9IGxhbmd1YWdlcy5kZXNlcmlhbGl6ZSggdGFyZ2V0Lmd1ZXN0WyBzZXFOdW0gXS5DaGVja0luUGFzc2VuZ2VyLmxhbmdQcmVmQ29kZSApLnRoZW4oIGZ1bmN0aW9uKCByZXN1bHQgKXsgdGFyZ2V0Lmd1ZXN0W3NlcU51bV0uQ2hlY2tJblBhc3Nlbmdlci5sYW5nUHJlZkNvZGUgPSByZXN1bHQ7IH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgaWYgKCB0YXJnZXQuZ3Vlc3Rbc2VxTnVtXS5DaGVja0luUGFzc2VuZ2VyLmVtZXJnZW5jeUFpciApIHtcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0Lmd1ZXN0WyBzZXFOdW0gXS5DaGVja0luUGFzc2VuZ2VyLmVtZXJnZW5jeUFpciA9IGdldEFpcnBvcnRDaXRpZXMuZGVzZXJpYWxpemUoIHRhcmdldC5ndWVzdFtzZXFOdW1dLkNoZWNrSW5QYXNzZW5nZXIuZW1lcmdlbmN5QWlyICkudGhlbiggZnVuY3Rpb24oIHJlc3VsdCApeyB0YXJnZXQuZ3Vlc3Rbc2VxTnVtXS5DaGVja0luUGFzc2VuZ2VyLmVtZXJnZW5jeUFpciA9IHJlc3VsdDt9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy9hdHRhY2ggY292ZXJpbmdzIHRvIHRoZWlyIHJlc3BlY3RpdmUgZ3Vlc3RzLCBpZiB0aGV5IG1hdGNoIHRoZW4gdGFnIHRoZW0gYXMgYmVpbmcgYWNjb3VudGVkIGZvciBvbiB0aGlzIGJvb2tpbmdcbiAgICAgICAgICAgIGlmICh0YXJnZXQuY2hlY2tJbkNvdmVyZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHRhcmdldC5jaGVja0luQ292ZXJlZC5tYXAoZnVuY3Rpb24oIGNvdmVyaW5nICkge1xuICAgICAgICAgICAgICAgICAgICAvL2F0dGFjaCBjYyBpbmZvIHRvIGNvdmVyaW5nXG4gICAgICAgICAgICAgICAgICAgIGNvdmVyaW5nLmNhcmREZXRhaWxzID0gZ2V0Q2FyZERldGFpbHMoIGNvdmVyaW5nLCB0YXJnZXQuY2hlY2tJblBheWVyICk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy9hdHRhY2ggY292ZXJpbmcgdG8gcGFzc2VuZ2VyLiBpZiBzdWNjZXNzZnVsLCBndWVzdC5vblRoaXNCb29raW5nID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICBtYXRjaENvdmVyaW5nV2l0aFBhc3NlbmdlciggdGFyZ2V0Lmd1ZXN0LCBjb3ZlcmluZywgdGFyZ2V0LmJvb2tpbmdOdW1iZXIsIHRhcmdldC5zYWlsaW5nSWQgKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAodGFyZ2V0LmNoZWNrSW5QYXllci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0LmNoZWNrSW5QYXllci5tYXAoZnVuY3Rpb24oIHBheWVyICkge1xuICAgICAgICAgICAgICAgICAgICAvL3RyYW5zZm9ybSBjcmVkaXQgY2FyZCBjb2RlcyBpbnRvIG5hbWVzXG4gICAgICAgICAgICAgICAgICAgIHBheWVyLmNyZWRpdENhcmRUeXBlID0gZ2V0Q2FyZFR5cGVOYW1lKCBwYXllci5jcmVkaXRDYXJkVHlwZSApO1xuICAgICAgICAgICAgICAgICAgICAvL2FkZCBjcmVkaXQgY2FyZHMgdG8gdGhlaXIgb3duZXJzIGlmIHRoZXkncmUgb24gdGhpcyBib29raW5nXG4gICAgICAgICAgICAgICAgICAgIG1hdGNoUGF5ZXJXaXRoUGFzc2VuZ2VyKCAkc2Vzc2lvblN0b3JhZ2UuYm9va2luZ0luZm8uZ3Vlc3QsIHBheWVyICk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodGFyZ2V0KTtcbiAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuXG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVzZXJpYWxpemVDb3VudHJ5OiBmdW5jdGlvbiggY291bnRyeUNvZGUgKSB7XG4gICAgICAgICAgICB2YXIgY291bnRyeU5hbWU7XG4gICAgICAgICAgICB2YXIgY291bnRyeUxpc3QgPSBTaGFyZWREYXRhU2VydmljZS5nZXRDb3VudHJpZXMoKTtcbiAgICAgICAgICAgIGNvdW50cnlMaXN0LmZvckVhY2goIGZ1bmN0aW9uKCBlbGVtZW50LCBpbmRleCApe1xuICAgICAgICAgICAgICAgIGlmICggZWxlbWVudC5jb2RlID09PSBjb3VudHJ5Q29kZSApIHtcbiAgICAgICAgICAgICAgICAgICAgY291bnRyeU5hbWUgPSBlbGVtZW50Lm5hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gY291bnRyeU5hbWU7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVzZXJpYWxpemVEYXRlOiBmdW5jdGlvbiggZGF0ZVN0cmluZyApIHtcbiAgICAgICAgICAgIGlmICghZGF0ZVN0cmluZykgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIG1vbnRoID0gZGF0ZVN0cmluZy5zbGljZSgwLCAyKTtcbiAgICAgICAgICAgIHZhciBkYXRlID0gZGF0ZVN0cmluZy5zbGljZSgyLCA0KTtcbiAgICAgICAgICAgIHZhciB5ZWFyID0gZGF0ZVN0cmluZy5zbGljZSg0LCA4KTtcbiAgICAgICAgICAgIHJldHVybiBNb21lbnRKUyhkYXRlU3RyaW5nLCBbJ01NRERZWVlZJywgJ01NLURELVlZWVknLCBNb21lbnRKUy5JU09fODYwMV0pLnRvRGF0ZSgpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgLy9jb252ZXJ0IG51bWJlci13b3JkcyBpbnRvIHN0cmluZ3NcbiAgICB2YXIgbnVtYmVyV29yZHMgPSBbICd6ZXJvJywnb25lJywndHdvJywndGhyZWUnLCdmb3VyJywnZml2ZScgXTtcbiAgICBmdW5jdGlvbiBfd29yZFRvTnVtKCB3b3JkICkge1xuICAgICAgICB3b3JkID0gd29yZC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gbnVtYmVyV29yZHMuaW5kZXhPZiggd29yZCApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF9kZXNlcmlhbGl6ZVRpbWUoIHRpbWVTdHJpbmcgKSB7XG4gICAgICAgIGlmICghdGltZVN0cmluZykgcmV0dXJuICcnO1xuICAgICAgICB2YXIgdGltZU9iaiA9IHt9O1xuICAgICAgICB0aW1lT2JqLmhvdXIgPSB0aW1lU3RyaW5nLnNsaWNlKDAsIDIpO1xuICAgICAgICB0aW1lT2JqLm1pbnV0ZSA9IHRpbWVTdHJpbmcuc2xpY2UoMiwgNCk7XG4gICAgICAgIHJldHVybiB0aW1lT2JqO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRlc2VyaWFsaXplVmFsdWUoIHByb21pc2UgKSB7XG4gICAgICAgIGlmICggIXByb21pc2UgKSB7IHJldHVybiAnJzsgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoIGNvZGUgKSB7XG4gICAgICAgICAgICBpZiAoICFjb2RlICkgeyByZXR1cm4gJyc7IH0gLy8gVE9ETzogUmV2aXNpdCB0aGlzIHdoZW4gYSBndWVzdCBkb2Vzbid0IGhhdmUgYW4gZW1lcmdlbmN5IGNvbnRhY3QuXG5cbiAgICAgICAgICAgIHZhciByZXR1cm5Qcm9taXNlID0gcHJvbWlzZS50aGVuKCBmdW5jdGlvbiAoIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmV0dXJuT2JqID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICByZXN1bHQuZm9yRWFjaCggZnVuY3Rpb24gKCBvYmosIGluZGV4LCBhcnIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICggY29kZS50b1VwcGVyQ2FzZSgpID09PSBvYmouY29kZS50b1VwcGVyQ2FzZSgpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuT2JqID0gb2JqLmxhYmVsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIHJldHVybk9iaiApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJldHVybk9iajtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9KS5jYXRjaCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdkZXNlcmlhbGl6ZVByb21pc2UgZmFpbGVkJyApO1xuICAgICAgICAgICAgfSk7XG4gICAgXG4gICAgICAgICAgICByZXR1cm4gcmV0dXJuUHJvbWlzZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRDYXJkVHlwZU5hbWUoIGNvZGUgKSB7XG4gICAgICAgIHZhciBjYXJkVHlwZXMgPSB7XG4gICAgICAgICAgICAnVkknOiAnVklTQScsXG4gICAgICAgICAgICAnTUMnOiAnTUFTVEVSQ0FSRCcsXG4gICAgICAgICAgICAnREMnOiAnRElTQ09WRVInLFxuICAgICAgICAgICAgJ0FYJzogJ0FNRVJJQ0FORVhQUkVTUydcbiAgICAgICAgfTtcbiAgICAgICAgY29kZSA9IGNvZGUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIGNhcmRUeXBlc1sgY29kZSBdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoQ292ZXJpbmdXaXRoUGFzc2VuZ2VyKCBndWVzdHMsIGNvdmVyaW5nLCBib29raW5nTnVtYmVyLCBwcm9kQ29kZSApIHtcbiAgICAgICAgaWYgKCBndWVzdHMubGVuZ3RoIDwgMSB8fCAhY292ZXJpbmcgKSByZXR1cm47XG4gICAgICAgIC8vIHZhciBzZXFOdW0gPSBjb3ZlcmluZy5ndWVzdElkLnNsaWNlKCA3LCA4ICk7XG5cbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgZ3Vlc3RzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgdmFyIGd1ZXN0SWQgPSBib29raW5nTnVtYmVyICsgXG4gICAgICAgICAgICAgICAgVHJhbnNmb3JtVXRpbHNTZXJ2aWNlLnplcm9QYWQoIGd1ZXN0c1tpXS5zZXFOdW1iZXIgKSArIFxuICAgICAgICAgICAgICAgIHByb2RDb2RlLnNsaWNlKCAwLCA0ICk7XG5cbiAgICAgICAgICAgIGlmICggZ3Vlc3RJZCA9PT0gY292ZXJpbmcuZ3Vlc3RJZCApIHtcbiAgICAgICAgICAgICAgICBjb3ZlcmluZy5vblRoaXNCb29raW5nID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBndWVzdHNbaV0uY2hlY2tJbkNvdmVyZWQgPSBjb3ZlcmluZztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldENhcmREZXRhaWxzKCBjb3ZlcmluZywgY2FyZHMsIG90aGVyQ2FyZHMgKSB7XG4gICAgICAgIGlmICggY292ZXJpbmcubGVuZ3RoIDwgMSB8fCBjYXJkcy5sZW5ndGggPCAxICkgcmV0dXJuO1xuICAgICAgICB2YXIgY2FyZERldGFpbHMgPSB7fTtcbiAgICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgY2FyZHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICBpZiAoIGNhcmRzWyBpIF0uaWRDaGVja2luUGF5ZXIgPT09IGNvdmVyaW5nLmlkQ2hlY2tpblBheWVyICkge1xuICAgICAgICAgICAgICAgIGNhcmREZXRhaWxzLmNhcmRPd25lck5hbWUgPSBjYXJkc1sgaSBdLmZpcnN0TmFtZSArICcgJyArIGNhcmRzWyBpIF0ubGFzdE5hbWU7XG4gICAgICAgICAgICAgICAgY2FyZERldGFpbHMubGFzdEZvdXIgPSBjYXJkc1sgaSBdLmNyZWRpdENhcmRMYXN0Rm91cjtcbiAgICAgICAgICAgICAgICBjYXJkRGV0YWlscy5jYXJkVHlwZSA9IGdldENhcmRUeXBlTmFtZSggY2FyZHNbIGkgXS5jcmVkaXRDYXJkVHlwZSApO1xuICAgICAgICAgICAgICAgIHJldHVybiBjYXJkRGV0YWlscztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIG90aGVyQ2FyZHNbIGkgXS5pZENoZWNraW5QYXllciA9PT0gY292ZXJpbmcuaWRDaGVja2luUGF5ZXIgKSB7XG4gICAgICAgICAgICAgICAgY2FyZERldGFpbHMuY2FyZE93bmVyTmFtZSA9IG90aGVyQ2FyZHNbIGkgXS5maXJzdE5hbWUgKyAnICcgKyBvdGhlckNhcmRzWyBpIF0ubGFzdE5hbWU7XG4gICAgICAgICAgICAgICAgY2FyZERldGFpbHMubGFzdEZvdXIgPSBvdGhlckNhcmRzWyBpIF0uY3JlZGl0Q2FyZExhc3RGb3VyO1xuICAgICAgICAgICAgICAgIGNhcmREZXRhaWxzLmNhcmRUeXBlID0gZ2V0Q2FyZFR5cGVOYW1lKCBvdGhlckNhcmRzWyBpIF0uY3JlZGl0Q2FyZFR5cGUgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1hdGNoUGF5ZXJXaXRoUGFzc2VuZ2VyKCBndWVzdHMsIHBheWVyICkge1xuICAgICAgICBpZiAoIGd1ZXN0cy5sZW5ndGggPCAxIHx8ICFwYXllciApIHJldHVybjtcbiAgICAgICAgdmFyIHNlcU51bSA9IHBheWVyLmd1ZXN0SWQuc2xpY2UoIDcsIDggKTtcblxuICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBndWVzdHMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICBpZiAoIGd1ZXN0c1tpXS5zZXFOdW1iZXIgPT09IHNlcU51bSkge1xuICAgICAgICAgICAgICAgIGd1ZXN0c1tpXS5jaGVja0luUGF5ZXIgPSBwYXllcjtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgcmVsYXRpb25zaGlwcyA9ICggZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdmFsdWVzID0gU2hhcmVkRGF0YVNlcnZpY2UuZ2V0UmVsYXRpb25zaGlwcygpXG4gICAgICAgICAgICAudGhlbiggZnVuY3Rpb24oIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdTaGFyZWREYXRhU2VydmljZS5nZXRSZWxhdGlvbnNoaXBzIHJlcXVlc3QgZmFpbGVkJyApO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGdldFJlbGF0aW9uc2hpcHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZGVzZXJpYWxpemU6IGRlc2VyaWFsaXplVmFsdWUoIHZhbHVlcyApXG4gICAgICAgIH07XG4gICAgfSkoKTtcblxuICAgIHZhciBkb2NUeXBlcyA9ICggZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdmFsdWVzID0gU2hhcmVkRGF0YVNlcnZpY2UuZ2V0RG9jVHlwZXMoKVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uKCByZXN1bHQgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCAnU2hhcmVkRGF0YVNlcnZpY2UuZ2V0RG9jVHlwZXMgcmVxdWVzdCBmYWlsZWQnICk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZGVzZXJpYWxpemU6IGRlc2VyaWFsaXplVmFsdWUoIHZhbHVlcyApXG4gICAgICAgIH07XG4gICAgfSkoKTtcblxuICAgIHZhciBsYW5ndWFnZXMgPSAoIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IFNoYXJlZERhdGFTZXJ2aWNlLmdldFNhZmV0eUxhbmd1YWdlcygpXG4gICAgICAgICAgICAudGhlbiggZnVuY3Rpb24oIHJlc3VsdCApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdTaGFyZWREYXRhU2VydmljZS5nZXRTYWZldHlMYW5ndWFnZXMgcmVxdWVzdCBmYWlsZWQnICk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0TGFuZ3VhZ2VzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGRlc2VyaWFsaXplOiBkZXNlcmlhbGl6ZVZhbHVlKCB2YWx1ZXMgKVxuICAgICAgICB9O1xuICAgIH0pKCk7XG5cbiAgICB2YXIgYWlycG9ydENpdGllcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHZhbHVlcyA9IFNoYXJlZERhdGFTZXJ2aWNlLmdldEFpcnBvcnRDaXRpZXMoKVxuICAgICAgICAgICAgLnRoZW4oIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgIHZhciByZXR1cm5WYWx1ZXMgPSByZXN1bHQubWFwKCBmdW5jdGlvbiAoIGNpdHkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7IFwibGFiZWxcIjogY2l0eS52YWx1ZSwgXCJjb2RlXCI6IGNpdHkua2V5IH07ICBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuVmFsdWVzO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5jYXRjaCggZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoICdTaGFyZWREYXRhU2VydmljZS5nZXRBaXJwb3J0Q2l0aWVzIHJlcXVlc3QgZmFpbGVkJyApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZ2V0QWlycG9ydENpdGllczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBkZXNlcmlhbGl6ZTogZGVzZXJpYWxpemVWYWx1ZSggdmFsdWVzICkgXG4gICAgICAgIH07XG4gICAgfTsgICAgXG5cbiAgICByZXR1cm4gZGVzZXJpYWxpemVTZXJ2aWNlO1xufSk7ICIsIlxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5GaW5kQm9va2luZ1NlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBTZXJ2aWNlIHRoYXQgZmluZHMgYW5kIHJldHVybnMgYSBwcm9taXNlIGZvciBhIGJvb2tpbmcgSlNPTiBvYmplY3QuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCAnb2xjaS5zZXJ2aWNlcy5GaW5kQm9va2luZ1NlcnZpY2UnLCBbXG4gICAgJ3Jlc3Rhbmd1bGFyJyxcbiAgICAnb2xjaS5zZXJ2aWNlcy5EYXRhVHJhbnNmb3JtU2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuRGVzZXJpYWxpemVTZXJ2aWNlJyxcbiAgICAnb2xjaS5zZXJ2aWNlcy5Mb3lhbHR5U2VydmljZScsXG4gICAgJ29sY2kuc2VydmljZXMuVHJhbnNmb3JtVXRpbHNTZXJ2aWNlJyxcbiAgICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJyxcbiAgICAnbmdTdG9yYWdlJyxcbiAgICAndmVuZG9yLnN0ZWVsVG9lJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbigkaHR0cFByb3ZpZGVyKSB7XG4gICAgLy8gJGh0dHBQcm92aWRlci5kZWZhdWx0cy53aXRoQ3JlZGVudGlhbHMgPSB0cnVlO1xuICAgIC8vICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuY2FjaGUgPSB0cnVlO1xuICAgICRodHRwUHJvdmlkZXIuZGVmYXVsdHMuaGVhZGVycy5wb3N0ID0ge1xuICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbiAgICB9O1xufSlcblxuLmZhY3RvcnkoICdGaW5kQm9va2luZ1NlcnZpY2UnLCBmdW5jdGlvbiggJGh0dHAsICRzZXNzaW9uU3RvcmFnZSwgUmVzdGFuZ3VsYXIsIERhdGFUcmFuc2Zvcm1TZXJ2aWNlLCBEZXNlcmlhbGl6ZVNlcnZpY2UsICRxLCBDb25maWd1cmF0aW9uLCBUcmFuc2Zvcm1VdGlsc1NlcnZpY2UsIHN0ZWVsVG9lICkge1xuICAgIHZhciBmaW5kQm9va2luZ1NlcnZpY2UgPSB7fTtcbiAgICB2YXIgdHJhdmVsT3B0aW9uc0Jhc2VVcmwgPSBSZXN0YW5ndWxhci5vbmUoKTtcbiAgICB2YXIgY291bnRyeSA9IHN0ZWVsVG9lLmRvKCAkc2Vzc2lvblN0b3JhZ2UgKS5nZXQoICdjdXJyZW50VXNlci5jb3VudHJ5JyApIHx8ICdVUyc7XG4gICAgdmFyIGF1dGhlbnRpY2F0aW9uQmFzZVVybCA9IFJlc3Rhbmd1bGFyLm9uZSggJ2F1dGhlbnRpY2F0aW9uL3YxLjAuMCcgKS5vbmUoICdjb21wYW55Q29kZScsIENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGUgKTtcbiAgICB2YXIgb25saW5lQ2hlY2tpbkJhc2VVcmwgPSBSZXN0YW5ndWxhci5vbmUoICdjaGVja2luL3YxLjAuMCcgKS5vbmUoICdjb21wYW55Q29kZScsIENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGUgKS5vbmUoICdjb3VudHJ5Q29kZScsIGNvdW50cnkgKTtcbiAgICB2YXIgYm9va2luZ0Jhc2VVcmwgPSBSZXN0YW5ndWxhci5vbmUoICdndWVzdC92MS4wLjAvYm9va2luZycgKS5vbmUoICdjb21wYW55Q29kZScsIENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGUgKTtcblxuICAgIGZpbmRCb29raW5nU2VydmljZS5wdXRQb2xhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcHV0T2JqZWN0ID0gRGF0YVRyYW5zZm9ybVNlcnZpY2Uuc2VyaWFsaXplUG9sYXIoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mbyApO1xuXG4gICAgICAgIHJldHVybiBvbmxpbmVDaGVja2luQmFzZVVybC5jdXN0b21QVVQocHV0T2JqZWN0LCAnYm9va2luZycgKS50aGVuKFxuICAgICAgICAgICAgZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggcmVzICk7XG4gICAgICAgICAgICAgICAgJHNlc3Npb25TdG9yYWdlLmJvb2tpbmdJbmZvLnN5bmNocm9uaXphdGlvbklEID0gcmVzLmJvb2tpbmdTdGF0dXNEZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmaW5kQm9va2luZ1NlcnZpY2UuYXV0aGVudGljYXRlID0gZnVuY3Rpb24oIGJvb2tpbmdOdW1iZXIsIGxhc3ROYW1lICkge1xuICAgICAgICB2YXIgaGVhZGVyID0ge1xuICAgICAgICAgICAgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWRcIlxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBhdXRoRGF0YSA9IFRyYW5zZm9ybVV0aWxzU2VydmljZS50cmFuc2Zvcm1SZXF1ZXN0T2JqZWN0KHtcbiAgICAgICAgICAgIFwia2V5XCI6IGJvb2tpbmdOdW1iZXIsXG4gICAgICAgICAgICBcInNlY3JldFwiOiBsYXN0TmFtZVxuICAgICAgICB9KTtcblxuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgIGF1dGhlbnRpY2F0aW9uQmFzZVVybC5jdXN0b21QT1NUKCBhdXRoRGF0YSwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGhlYWRlciApXG4gICAgICAgICAgICAudGhlbihcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiggZGF0YSApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGRhdGEgKTtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSggZGF0YSApO1xuICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICggZXJyb3IgKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCggZXJyb3IgKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiBzZXJpYWxpemVEYXRhKCBkYXRhICkgeyBcbiAgICAgICAgLy8gSWYgdGhpcyBpcyBub3QgYW4gb2JqZWN0LCBkZWZlciB0byBuYXRpdmUgc3RyaW5naWZpY2F0aW9uLlxuICAgICAgICBpZiAoICEgYW5ndWxhci5pc09iamVjdCggZGF0YSApICkgeyBcbiAgICAgICAgICAgIHJldHVybiggKCBkYXRhID09PSBudWxsICkgPyBcIlwiIDogZGF0YS50b1N0cmluZygpICk7IFxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJ1ZmZlciA9IFtdO1xuXG4gICAgICAgIC8vIFNlcmlhbGl6ZSBlYWNoIGtleSBpbiB0aGUgb2JqZWN0LlxuICAgICAgICBmb3IgKCB2YXIgbmFtZSBpbiBkYXRhICkgeyBcbiAgICAgICAgICAgIGlmICggISBkYXRhLmhhc093blByb3BlcnR5KCBuYW1lICkgKSBjb250aW51ZTsgXG5cbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFbIG5hbWUgXTtcblxuICAgICAgICAgICAgYnVmZmVyLnB1c2goXG4gICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KCBuYW1lICkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudCggKCB2YWx1ZSA9PT0gbnVsbCApID8gXCJcIiA6IHZhbHVlIClcbiAgICAgICAgICAgICk7IFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gU2VyaWFsaXplIHRoZSBidWZmZXIgYW5kIGNsZWFuIGl0IHVwIGZvciB0cmFuc3BvcnRhdGlvbi5cbiAgICAgICAgdmFyIHNvdXJjZSA9IGJ1ZmZlci5qb2luKCBcIiZcIiApLnJlcGxhY2UoIC8lMjAvZywgXCIrXCIgKTsgXG4gICAgICAgIHJldHVybiggc291cmNlICk7IFxuXG4gICAgfVxuXG5cbiAgICBmaW5kQm9va2luZ1NlcnZpY2UubG9va3VwUG9sYXIgPSBmdW5jdGlvbiggYm9va2luZ051bWJlciApIHtcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICBvbmxpbmVDaGVja2luQmFzZVVybC5jdXN0b21HRVQoICdib29raW5nJyApLnRoZW4oXG4gICAgICAgICAgICBmdW5jdGlvbiggYm9va2luZ1N1bW1hcnkgKSB7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSggYm9va2luZ1N1bW1hcnkgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiggZXJyb3IgKSAge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoIGVycm9yICk7XG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCBlcnJvciApO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIGZpbmRCb29raW5nU2VydmljZS5sb29rdXBXZWJEYiA9IGZ1bmN0aW9uKCBib29raW5nTnVtYmVyICkge1xuICAgICAgICAvL2xvb2t1cCB3ZWJkYlxuICAgIH07XG5cbiAgICBmaW5kQm9va2luZ1NlcnZpY2UubG9va3VwV2ViRGJNb2NrID0gZnVuY3Rpb24oIGNyZWRlbnRpYWxzICkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCByb3R0ZW4gKTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIGZpbmRCb29raW5nU2VydmljZS5sb29rdXBTaWViZWxNb2NrID0gZnVuY3Rpb24oIGNyZWRlbnRpYWxzICkge1xuICAgICAgICByZXR1cm4gc2llYmVsVXNlcnNbIGNyZWRlbnRpYWxzLmxhc3ROYW1lIF07XG4gICAgfTtcblxuICAgIGZpbmRCb29raW5nU2VydmljZS5sb29rdXBGaWRlbGlvTW9jayA9IGZ1bmN0aW9uKCBjcmVkZW50aWFscyApIHtcbiAgICAgICAgLy8gcmV0dXJuIGZpZGVsaW9Vc2Vyc1tjcmVkZW50aWFscy5sYXN0TmFtZV07XG4gICAgfTtcblxuICAgIGZpbmRCb29raW5nU2VydmljZS5maW5kUG9sYXIgPSBmdW5jdGlvbiggY3JlZGVudGlhbHMsIHRhcmdldCwgYm9va2luZ051bWJlciApIHtcbiAgICAgICAgZmluZEJvb2tpbmdTZXJ2aWNlLmxvb2t1cFBvbGFyKGNyZWRlbnRpYWxzKS50aGVuKGZ1bmN0aW9uKHBvbGFyKSB7XG4gICAgICAgICAgICBEZXNlcmlhbGl6ZVNlcnZpY2UuZGVzZXJpYWxpemVQb2xhcihwb2xhciwgdGFyZ2V0KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZpbmRCb29raW5nU2VydmljZS5maW5kV2ViRGIgPSBmdW5jdGlvbiggY3JlZGVudGlhbHMsIHRhcmdldCwgYm9va2luZ051bWJlciApIHtcbiAgICAgICAgZmluZEJvb2tpbmdTZXJ2aWNlLmxvb2t1cFdlYkRiTW9jayggY3JlZGVudGlhbHMgKS50aGVuKGZ1bmN0aW9uKCB3ZWJEYiApIHtcbiAgICAgICAgICAgIERhdGFUcmFuc2Zvcm1TZXJ2aWNlLmRlc2VyaWFsaXplV2ViRGIoIHdlYkRiLCB0YXJnZXQgKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZpbmRCb29raW5nU2VydmljZS5maW5kUG9sYXJBbmRXZWJEYiA9IGZ1bmN0aW9uKCB0YXJnZXQgKSB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgIG9ubGluZUNoZWNraW5CYXNlVXJsLmN1c3RvbUdFVCggJ2Jvb2tpbmcvYWxsJyApLnRoZW4oXG4gICAgICAgICAgICBmdW5jdGlvbiggYm9va2luZ1N1bW1hcnkgKSB7XG4gICAgICAgICAgICAgIHZhciBwID0gRGVzZXJpYWxpemVTZXJ2aWNlLmRlc2VyaWFsaXplUG9sYXIoIGJvb2tpbmdTdW1tYXJ5LmNoZWNraW4sIHRhcmdldCApO1xuICAgICAgICAgICAgICB2YXIgdyA9IERlc2VyaWFsaXplU2VydmljZS5kZXNlcmlhbGl6ZVdlYkRiKCBib29raW5nU3VtbWFyeS5vbmJvYXJkQWNjb3VudHMsIHRhcmdldCAgKTtcbiAgICAgICAgICAgICAgdmFyIGRhdGEgPSB7IGE6IHAsIGI6IHcgfTtcbiAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSggZGF0YSApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKCBlcnJvciApICB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvciggZXJyb3IgKTtcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoIGVycm9yICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfTtcblxuICAgIGZpbmRCb29raW5nU2VydmljZS5maW5kT3RoZXJCb29raW5nUG9sYXJBbmRXZWJEYiA9IGZ1bmN0aW9uKCBjcmVkZW50aWFscywgdGFyZ2V0ICkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuICAgICAgICBvbmxpbmVDaGVja2luQmFzZVVybC5vbmUoICdib29raW5nL3NhaWxpbmdJZCcsIGNyZWRlbnRpYWxzLnNhaWxpbmdJZCApXG4gICAgICAgICAgICAub25lKCAnb3RoZXJCb29raW5nJywgY3JlZGVudGlhbHMuYm9va2luZ051bWJlciApXG4gICAgICAgICAgICAub25lKCAnbGFzdE5hbWUnLCBjcmVkZW50aWFscy5sYXN0TmFtZSApXG4gICAgICAgICAgICAuZ2V0KClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKCBib29raW5nU3VtbWFyeSApIHtcbiAgICAgICAgICAgICAgICB2YXIgcCA9IERlc2VyaWFsaXplU2VydmljZS5kZXNlcmlhbGl6ZVBvbGFyKCBib29raW5nU3VtbWFyeS5jaGVja2luLCB0YXJnZXQgKTtcbiAgICAgICAgICAgICAgICAvLyB2YXIgdyA9IERhdGFUcmFuc2Zvcm1TZXJ2aWNlLmRlc2VyaWFsaXplV2ViRGIoIGJvb2tpbmdTdW1tYXJ5LilcbiAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKHApO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH07XG5cbiAgICBmaW5kQm9va2luZ1NlcnZpY2UuZmluZFNpZWJlbCA9IGZ1bmN0aW9uKCBjcmVkZW50aWFscywgdGFyZ2V0ICkge1xuICAgICAgICAvL2ZpbmQgc2llYmVsIGhlcmVcbiAgICB9O1xuXG4gICAgZmluZEJvb2tpbmdTZXJ2aWNlLmZpbmRGaWRlbGlvTW9jayA9IGZ1bmN0aW9uKCBjcmVkZW50aWFscywgdGFyZ2V0ICkge1xuICAgICAgICAvL2ZpbmQgZmlkZWxpbyBoZXJlXG4gICAgfTtcblxuICAgIHJldHVybiBmaW5kQm9va2luZ1NlcnZpY2U7XG59KTtcblxuIiwiXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG9sY2kuc2VydmljZXMuRmluZEltYWdlU2VydmljZVxuICogQGRlc2NyaXB0aW9uIFNlcnZpY2UgdGhhdCBmaW5kcyBhbmQgcmV0dXJucyBhIHByb21pc2UgZm9yIGltYWdlIHNyYyBzdHJpbmdzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb2xjaS5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlJywgW1xuICAgICAgICAnbmdTdG9yYWdlJyxcbiAgICAgICAgJ3ZlbmRvci5zdGVlbFRvZSdcbiAgICBdKVxuXG4uZmFjdG9yeSgnRmluZEltYWdlU2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkc2Vzc2lvblN0b3JhZ2UsICRxLCBzdGVlbFRvZSkge1xuICAgIC8vIENoZWNrcyBpZiBpbWFnZSBleGlzdHMuICBSZXR1cm5zIGRlZmF1bHQgaW1hZ2Ugc291cmNlIGlmIGl0IGRvZXNuJ3QuXG4gICAgLy8gUHJpdmF0ZSBoZWxwZXIgbWV0aG9kLlxuICAgIGZ1bmN0aW9uIGlzSW1hZ2Uoc3JjLCBkZWZhdWx0U3JjKSB7XG5cbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1hZ2Uub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2Vycm9yOiAnICsgc3JjICsgJyBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoIGRlZmF1bHRTcmMgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBzcmMgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2Uuc3JjID0gc3JjO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuRmluZEltYWdlU2VydmljZSNpdGluZXJhcnlJbWFnZVxuICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBHZW5lcmF0ZSBhIFVSTCBmb3IgaXRpbmVyYXJ5IGltYWdlLiAgSWYgZ2VuZXJhdGVkIFVSTCBpcyBub3QgdmFsaWQsIHJldHVybiBkZWZhdWx0IGltYWdlIFVSTC5cbiAgICAgICAgICogQHJldHVybnMge29iamVjdH0gYSBwcm9taXNlIG9iamVjdCB0aGF0IHJldHVybnMgYSByZWxhdGl2ZSBVUkwgZm9yIHRoZSByZXNvdXJjZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgPHByZT5cbiAgICAgICAgICdPTENJX2Rlc3RfQS5qcGcnXG4gICAgICAgICA8L3ByZT5cbiAgICAgICAgICogKi9cbiAgICAgICAgaXRpbmVyYXJ5SW1hZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGRlc3RDb2RlID0gc3RlZWxUb2UuZG8oJHNlc3Npb25TdG9yYWdlKS5nZXQoJ2Jvb2tpbmdJbmZvLmRlc3RpbmF0aW9uQ29kZScpIHx8ICcnO1xuICAgICAgICAgICAgcmV0dXJuIGlzSW1hZ2UoXG4gICAgICAgICAgICAgICAgJy4vYXNzZXRzL2ltYWdlcy9vbmJvYXJkL09MQ0lfZGVzdF8nICsgZGVzdENvZGUuc2xpY2UoMCwgMSkgKyAnLmpwZycsXG4gICAgICAgICAgICAgICAgJy4vYXNzZXRzL2ltYWdlcy9vbmJvYXJkL09MQ0lfZGVzdF9kZWZhdWx0LmpwZydcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0SGVhZGVySW1hZ2U6IGZ1bmN0aW9uKGNvbXBhbnlDb2RlKSB7XG4gICAgICAgICAgICB2YXIgaW1hZ2VVcmwgPSAoY29tcGFueUNvZGUgPT09ICdIQUwnKT9cbiAgICAgICAgICAgICAgICAnLi9hc3NldHMvaW1hZ2VzL2hlYWRlcl9TVkdzL2hhbC1sb2dvLnN2Zyc6XG4gICAgICAgICAgICAgICAgJy4vYXNzZXRzL2ltYWdlcy9oZWFkZXJfU1ZHcy9zYm4tbG9nby5naWYnO1xuICAgICAgICAgICAgcmV0dXJuIGlzSW1hZ2UoaW1hZ2VVcmwpO1xuXG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkZpbmRJbWFnZVNlcnZpY2UjYm9va2luZ1N1bW1hcnlJbWFnZVxuICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBHZW5lcmF0ZSBhIFVSTCBmb3IgYm9va2luZyBzdW1tYXJ5IGltYWdlLiAgSWYgZ2VuZXJhdGVkIFVSTCBpcyBub3QgdmFsaWQsIHJldHVybiBkZWZhdWx0IGltYWdlIFVSTC5cbiAgICAgICAgICogQHJldHVybnMge29iamVjdH0gYSBwcm9taXNlIG9iamVjdCB0aGF0IHJldHVybnMgYSByZWxhdGl2ZSBVUkwgZm9yIHRoZSByZXNvdXJjZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgPHByZT5cbiAgICAgICAgICdPTENJX2Rlc3RfQV8yLmpwZydcbiAgICAgICAgIDwvcHJlPlxuICAgICAgICAgKiAqL1xuICAgICAgICBib29raW5nU3VtbWFyeUltYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkZXN0Q29kZSA9IHN0ZWVsVG9lLmRvKCRzZXNzaW9uU3RvcmFnZSkuZ2V0KCdib29raW5nSW5mby5kZXN0aW5hdGlvbkNvZGUnKSB8fCBbXTtcbiAgICAgICAgICAgIHJldHVybiBpc0ltYWdlKFxuICAgICAgICAgICAgICAgICcuL2Fzc2V0cy9pbWFnZXMvb25ib2FyZC9PTENJX2Rlc3RfJyArIGRlc3RDb2RlLnNsaWNlKDAsIDEpICsgJ18yLmpwZycsXG4gICAgICAgICAgICAgICAgJy4vYXNzZXRzL2ltYWdlcy9vbmJvYXJkL09MQ0lfZGVzdF9kZWZhdWx0XzIuanBnJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBtYXJpbmVySW1hZ2U6IGZ1bmN0aW9uKG1hcmluZXJOdW0pIHtcbiAgICAgICAgICAgIGlmICghbWFyaW5lck51bSkgcmV0dXJuICcnO1xuICAgICAgICAgICAgcmV0dXJuIGlzSW1hZ2UoXG4gICAgICAgICAgICAgICAgJy4vYXNzZXRzL3N0YXJfbWFyaW5lci8nICsgbWFyaW5lck51bSArICdzdGFyTWFyaW5lci5naWYnXG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlI3N0YXRlUm9vbUltYWdlXG4gICAgICAgICAqIEBtZXRob2RPZiBvbGNpLnNlcnZpY2VzLkZpbmRJbWFnZVNlcnZpY2VcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIEdlbmVyYXRlIGEgVVJMIHN0YXRlcm9vbSBpbWFnZS4gIElmIGdlbmVyYXRlZCBVUkwgaXMgbm90IHZhbGlkLCByZXR1cm4gZGVmYXVsdCBpbWFnZSBVUkwuXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IGEgcHJvbWlzZSBvYmplY3QgdGhhdCByZXR1cm5zIGEgcmVsYXRpdmUgVVJMIGZvciB0aGUgcmVzb3VyY2VcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgIDxwcmU+XG4gICAgICAgICAnQU1fT0xDSV9zdGF0ZXJvb21fbmVwdHVuZS5qcGcnXG4gICAgICAgICA8L3ByZT5cbiAgICAgICAgICogKi9cbiAgICAgICAgc3RhdGVyb29tSW1hZ2U6IGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgICAgIHZhciBjYWJpbkNhdGVnb3JpZXMgPSBbIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnaW50ZXJpb3InLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ0knLCAnSicsICdLJywgJ0wnLCAnTScsICdNTScsICdOJywgJ05OJywgJ0lBJywgJ0lRJywgJ1InIF0gXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgeyAgLy8gVE9ETzogVGhpcyBtYXkgbm90IGJlIHJlYWwuXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnaW5zaWRlJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdJUycgXSAgXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdvY2VhbicsIFxuICAgICAgICAgICAgICAgICAgICBjb2RlczogWyAnQycsICdDQScsICdDUScsICdEJywgJ0RBJywgJ0REJywgJ0UnLCAnRUUnLCAnRicsICdGQScsICdGQicsICdGRicsICdHJywgJ0gnLCAnSEgnLCAnR0cnLCAnT08nLCAnUScgXSBcbiAgICAgICAgICAgICAgICB9LCBcbiAgICAgICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ3Zpc3RhJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdBJywgJ0FBJywgJ0FCJywgJ0FTJywgJ0InLCAnQkEnLCAnQkInLCAnQkMnLCAnQlEnIF0gXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICduZXB0dW5lJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdTJywgJ1NBJywgJ1NCJywgJ1NDJywgJ1NRJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAncGlubmFjbGUnLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ1BTJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAndmVyYW5kYWgnLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ1YnLCAnVkEnLCAnVkInLCAnVkMnLCAnVkQnLCAnVkUnLCAnVkYnLCAnVkgnLCAnVlEnLCAnVlMnLCAnVlQnIF0gXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdzaWduYXR1cmUnLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ1NTJywgJ1NZJywgJ1NaJywgJ1NVJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnbGFuYWknLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ0NBJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHZhciBzaGlwQ29kZSA9IHN0ZWVsVG9lLmRvKCRzZXNzaW9uU3RvcmFnZSkuZ2V0KCdib29raW5nSW5mby5zaGlwQ29kZScpIHx8ICcnO1xuICAgICAgICAgICAgc2hpcENvZGUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIHZhciBjYWJpbkNhdGVnb3J5ID0gc3RlZWxUb2UuZG8oJHNlc3Npb25TdG9yYWdlKS5nZXQoJ2Jvb2tpbmdJbmZvLnN0YXRlcm9vbUNhdGVnb3J5JykgfHwgJyc7XG4gICAgICAgICAgICBjYWJpbkNhdGVnb3J5LnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnkgPSAnZGVmYXVsdCc7XG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnlDb3VudCA9IGNhYmluQ2F0ZWdvcmllcy5sZW5ndGg7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNhdGVnb3J5Q291bnQ7IGkrKyApIHtcbiAgICAgICAgICAgICAgICBpZiAoIGNhYmluQ2F0ZWdvcmllc1tpXS5jb2Rlcy5pbmRleE9mKCBjYWJpbkNhdGVnb3J5ICkgIT09IC0xICkge1xuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeSA9IGNhYmluQ2F0ZWdvcmllc1tpXS5jYXRlZ29yeS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBpc0ltYWdlKFxuICAgICAgICAgICAgICAgICcuL2Fzc2V0cy9pbWFnZXMvb25ib2FyZC8nICsgc2hpcENvZGUgKyAnX09MQ0lfc3RhdGVyb29tXycgKyBjYXRlZ29yeSArICcuanBnJyxcbiAgICAgICAgICAgICAgICAnLi9hc3NldHMvaW1hZ2VzL29uYm9hcmQvT0xDSV9zdGF0ZXJvb21fZGVmYXVsdC5qcGcnXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7XG5cblxuXG4vLyBpbnRlcmlvclxuLy8gSSwgSiwgSywgTCwgTSwgTU0sIE4sIE5OLCBJQSwgSVEsIFJcblxuLy8gb2NlYW5cbi8vIEMsIENBLCBDUSwgRCwgREEsIERELCBFLCBFRSwgRiwgRkEsIEZCLCBGRiwgRywgSCwgSEgsIEdHLCBPTywgUVxuXG4vLyB2aXN0YVxuLy8gQSwgQUEsIEFCLCBBUywgQiwgQkEsIEJCLCBCQywgQlFcblxuLy8gbmVwdHVuZVxuLy8gUywgU0EsIFNCLCBTQywgU1FcblxuLy8gcGlubmFjbGVcbi8vIFBTXG5cbi8vIHZlcmFuZGFoXG4vLyBWLCBWQSwgVkIsIFZDLCBWRCwgVkUsIFZGLCBWSCwgVlEsIFZTLCBWVFxuXG4vLyBzaWduYXR1cmVcbi8vIFNTLCBTWSwgU1osIFNVXG5cbi8vIGxhbmFpXG4vLyBDQVxuXG4iLCJhbmd1bGFyLm1vZHVsZSgnb2xjaS5zZXJ2aWNlcy5Gb2N1c1NlcnZpY2UnLCBbXSlcblxuLmZhY3RvcnkoJ2dpdmVGb2N1cycsIGZ1bmN0aW9uKCR0aW1lb3V0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgICAgICBpZihlbGVtZW50KVxuICAgICAgICAgICAgICAgIGVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn0pOyIsIi8qXG4gKiBGcm9udEVuZExpbmtTZXJ2aWNlLmpzXG4gKlxuICogQ3JlYXRlZDogVGh1cnNkYXksIEZlYnJ1YXJ5IDEyLCAyMDE1XG4gKiAoYykgQ29weXJpZ2h0IDIwMTQgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkZyb250RW5kTGlua1NlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBTdG9yZXMgSEFMIGFuZCBTQk4gdmFyaWF0aW9ucyBvZiBjb21tb24gbGlua3MgXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvbGNpLnNlcnZpY2VzLkZyb250RW5kTGlua1NlcnZpY2UnLCBbXG4gICAgJ0FwcGxpY2F0aW9uQ29uZmlndXJhdGlvbicsXG4gICAgJ29sY2kuc2VydmljZXMuUm91dGluZ1V0aWxzU2VydmljZSdcbl0pXG5cbi5zZXJ2aWNlKCdGcm9udEVuZExpbmtTZXJ2aWNlJywgZnVuY3Rpb24gKENvbmZpZ3VyYXRpb24sIFJvdXRpbmdVdGlsc1NlcnZpY2UpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldFNpZ25vdXQ6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gQ29uZmlndXJhdGlvbi5hcHBOYW1lID09PSAnaGFsJyA/XG4gICAgICAgICAgICAgICAgUm91dGluZ1V0aWxzU2VydmljZS5mcm9udGVuZEJhc2VVcmwoJy9teUFjY291bnQvTG9nb3V0VXNlci5hY3Rpb24nKSA6XG4gICAgICAgICAgICAgICAgUm91dGluZ1V0aWxzU2VydmljZS5mcm9udGVuZEJhc2VVcmwoJy9teS1TZWFib3Vybi9Mb2dvdXRVc2VyLmFjdGlvbicpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldE15QWNjb3VudDogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiBDb25maWd1cmF0aW9uLmFwcE5hbWUgPT09ICdoYWwnID9cbiAgICAgICAgICAgICAgICBSb3V0aW5nVXRpbHNTZXJ2aWNlLmZyb250ZW5kQmFzZVVybCgnL215QWNjb3VudC9Bbm5vdW5jZW1lbnRzLmFjdGlvbicpIDpcbiAgICAgICAgICAgICAgICBSb3V0aW5nVXRpbHNTZXJ2aWNlLmZyb250ZW5kQmFzZVVybCgnL215LVNlYWJvdXJuL0Fubm91bmNlbWVudHMuYWN0aW9uJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0SGVscDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQ29uZmlndXJhdGlvbi5hcHBOYW1lID09PSAnaGFsJyA/XG4gICAgICAgICAgICAgICAgUm91dGluZ1V0aWxzU2VydmljZS5mcm9udGVuZEJhc2VVcmwoJy9jcnVpc2UtdmFjYXRpb24tcGxhbm5pbmcvUGxhbm5pbmdBbmRBZHZpY2UuYWN0aW9uP3RhYk5hbWU9TmV3K3RvK0NydWlzaW5nJykgOlxuICAgICAgICAgICAgICAgIFJvdXRpbmdVdGlsc1NlcnZpY2UuZnJvbnRlbmRCYXNlVXJsKCcvbHV4dXJ5LWNydWlzZS12YWNhdGlvbi1wbGFubmluZy9QbGFubmluZy1BbmQtQWR2aWNlLmFjdGlvbj90YWJOYW1lPUZyZXF1ZW50bHkrQXNrZWQrUXVlc3Rpb25zJldULmFjPXBuYXZfQWJvdXRGQVEnKTtcbiAgICAgICAgfSxcblxuICAgICAgICBnZXRDaGVja0luOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBDb25maWd1cmF0aW9uLmFwcE5hbWUgPT09ICdoYWwnID9cbiAgICAgICAgICAgICAgICBSb3V0aW5nVXRpbHNTZXJ2aWNlLmZyb250ZW5kQmFzZVVybCgnL2NydWlzZS12YWNhdGlvbi1wbGFubmluZy9PbmxpbmVDaGVja0luLmFjdGlvbicpIDpcbiAgICAgICAgICAgICAgICBSb3V0aW5nVXRpbHNTZXJ2aWNlLmZyb250ZW5kQmFzZVVybCgnL2x1eHVyeS1jcnVpc2UtdmFjYXRpb24tcGxhbm5pbmcvT25saW5lLUNoZWNrSW4uYWN0aW9uJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TWFrZVBheW1lbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIENvbmZpZ3VyYXRpb24uYXBwTmFtZSA9PT0gJ2hhbCcgP1xuICAgICAgICAgICAgICAgIFJvdXRpbmdVdGlsc1NlcnZpY2UuZnJvbnRlbmRCYXNlVXJsKCcvY3J1aXNlLXZhY2F0aW9uLXBsYW5uaW5nL01ha2VPbmxpbmVQYXltZW50LmFjdGlvbicpIDpcbiAgICAgICAgICAgICAgICBSb3V0aW5nVXRpbHNTZXJ2aWNlLmZyb250ZW5kQmFzZVVybCgnL2x1eHVyeS1jcnVpc2UtdmFjYXRpb24tcGxhbm5pbmcvTWFrZU9ubGluZVBheW1lbnQuYWN0aW9uJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RGVja1BsYW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIENvbmZpZ3VyYXRpb24uYXBwTmFtZSA9PT0gJ2hhbCcgP1xuICAgICAgICAgICAgICAgIFJvdXRpbmdVdGlsc1NlcnZpY2UuZnJvbnRlbmRCYXNlVXJsKCcvbWFpbi9EZWNrUGxhbnNGdWxsLmFjdGlvbj9XVC5hYz1wbmF2X09uYm9hcmRfRGVja3BsYW5zJykgOlxuICAgICAgICAgICAgICAgIFJvdXRpbmdVdGlsc1NlcnZpY2UuZnJvbnRlbmRCYXNlVXJsKCcvbWFpbi9EZWNrLVBsYW5zLUZ1bGwuYWN0aW9uP1dULmFjPXBuYXZfT25iRGVja3BsYW5zJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RG9jdW1lbnRhdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gQ29uZmlndXJhdGlvbi5hcHBOYW1lID09PSAnaGFsJyA/XG4gICAgICAgICAgICAgICAgUm91dGluZ1V0aWxzU2VydmljZS5mcm9udGVuZEJhc2VVcmwoJy9jcnVpc2UtdmFjYXRpb24tcGxhbm5pbmcvUGxhbm5pbmdBbmRBZHZpY2UuYWN0aW9uP3RhYk5hbWU9Q3J1aXNlK1ByZXBhcmF0aW9uJmNvbnRlbnRNZW51PVBhc3Nwb3J0cywrVmlzYXMrJTI2K1ZhY2NpbmF0aW9ucycpIDpcbiAgICAgICAgICAgICAgICBSb3V0aW5nVXRpbHNTZXJ2aWNlLmZyb250ZW5kQmFzZVVybCgnL2x1eHVyeS1jcnVpc2UtdmFjYXRpb24tcGxhbm5pbmcvUGxhbm5pbmctQW5kLUFkdmljZS5hY3Rpb24/dGFiTmFtZT1GcmVxdWVudGx5K0Fza2VkK1F1ZXN0aW9ucyZjb250ZW50TWVudT1UcmF2ZWwrRG9jdW1lbnRzJyk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldENoYXRDYWxsVGVtcGxhdGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gQ29uZmlndXJhdGlvbi5hcHBOYW1lID09PSAnaGFsJyA/XG4gICAgICAgICAgICAgICAgUm91dGluZ1V0aWxzU2VydmljZS5mcm9udGVuZEJhc2VVcmwoJy9tYWluL0xvYWRDaGF0Q2FsbERhdGEuYWN0aW9uJykgOlxuICAgICAgICAgICAgICAgIFJvdXRpbmdVdGlsc1NlcnZpY2UuZnJvbnRlbmRCYXNlVXJsKCcvbWFpbi9Mb2FkQ2hhdENhbGxEYXRhLmFjdGlvbicpO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7XG5cbiIsIlxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5HZXRDb3B5U2VydmljZVxuICogQGRlc2NyaXB0aW9uIFNlcnZpY2UgdGhhdCBmaW5kcyBhbmQgcmV0dXJucyBhIHByb21pc2UgY29weSBzdHJpbmdzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb2xjaS5zZXJ2aWNlcy5HZXRDb3B5U2VydmljZScsIFtcbiAgICAgICAgJ3ZlbmRvci5zdGVlbFRvZSdcbiAgICBdKVxuXG4uZmFjdG9yeSgnR2V0Q29weVNlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkcSwgc3RlZWxUb2UpIHtcbiAgICB2YXIgQ09QWV9FTkRQT0lOVCA9ICcuL2Fzc2V0cy9jb3B5L2NvcHkuanNvbicsXG4gICAgICAgIFZJU0FfRU5EUE9JTlQgPSAnLi9hc3NldHMvY29weS92aXNhbm90aWZpY2F0aW9uX21vZGFsX2luYy0zLmpzb24nLFxuICAgICAgICBTVU1NQVJZX0xJTktTX0VORFBPSU5UID0gJy4vYXNzZXRzL2NvcHkvc3VtbWFyeV9saW5rcy5qc29uJyxcbiAgICAgICAgQUlSUE9SVF9DSVRJRVNfRU5EUE9JTlQgPSAnLi9hc3NldHMvY29weS9haXJwb3J0Q2l0aWVzRXhjbHVzaW9ucy5qc29uJztcbiAgICByZXR1cm4ge1xuICAgICAgICBpdGluZXJhcnlDb3B5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkZXN0Q29kZSA9IHN0ZWVsVG9lLmRvKCRzZXNzaW9uU3RvcmFnZSkuZ2V0KCdib29raW5nSW5mby5kZXN0aW5hdGlvbkNvZGUnKTsvLyA/ICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5kZXN0aW5hdGlvbkNvZGUuc2xpY2UoMCwgMSkgOiAnJztcbiAgICAgICAgICAgIHJldHVybiAkaHR0cFxuICAgICAgICAgICAgICAgICAgICAuZ2V0KCBDT1BZX0VORFBPSU5UIClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhLml0aW5lcmFyeVBob3RvQ29weVtkZXN0Q29kZV07XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEVycm9yIGhhbmRsaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgLy8gcmV0dXJuIGFzc2V0c0RhdGEuaXRpbmVyYXJ5UGhvdG9Db3B5W2Rlc3RDb2RlXSA/IGFzc2V0c0RhdGEuaXRpbmVyYXJ5UGhvdG9Db3B5W2Rlc3RDb2RlXSA6IHt0aXRsZTonJywgYm9keTonJ30gO1xuICAgICAgICB9LFxuXG4gICAgICAgIHZpc2FOb3RpZmljYXRpb25Db3B5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cFxuICAgICAgICAgICAgICAgICAgICAuZ2V0KCBWSVNBX0VORFBPSU5UIClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhLmRlZmF1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEVycm9yIGhhbmRsaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN1bW1hcnlMaW5rc0NvcHk6IGZ1bmN0aW9uKCBsaW5rTnVtICkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwXG4gICAgICAgICAgICAgICAgICAgIC5nZXQoIFNVTU1BUllfTElOS1NfRU5EUE9JTlQgKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGEuc3VtbWFyeUxpbmtDb3B5W2xpbmtOdW1dO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBFcnJvciBoYW5kbGluZy5cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBhaXJwb3J0Q2l0aWVzRXhjbHVzaW9uczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHBcbiAgICAgICAgICAgICAgICAgICAgLmdldCggQUlSUE9SVF9DSVRJRVNfRU5EUE9JTlQgKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGEuYWlycG9ydENpdGllc0V4Y2x1c2lvbnM7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IEVycm9yIGhhbmRsaW5nLlxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfTtcbn0pO1xuIiwiLypcbiAqIEh0dHBJbnRlcmNlcHRvclNlcnZpY2UuanNcbiAqXG4gKiBDcmVhdGVkOiBUaHVyc2RheSwgRGVjZW1iZXIgMTUsIDIwMTRcbiAqIChjKSBDb3B5cmlnaHQgMjAxNCBIb2xsYW5kIEFtZXJpY2EsIEluYy4gLSBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiBUaGlzIGlzIHVucHVibGlzaGVkIHByb3ByaWV0YXJ5IHNvdXJjZSBjb2RlIG9mIEhvbGxhbmQgQW1lcmljYSwgSW5jLlxuICogVGhlIGNvcHlyaWdodCBub3RpY2UgYWJvdmUgZG9lcyBub3QgZXZpZGVuY2UgYW55IGFjdHVhbCBvciBpbnRlbmRlZFxuICogcHVibGljYXRpb24gb2Ygc3VjaCBzb3VyY2UgY29kZS5cbiAqL1xuXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG9sY2kuc2VydmljZXMuSHR0cEludGVyY2VwdG9yU2VydmljZVxuICogQGRlc2NyaXB0aW9uIFByb3ZpZGUgYSBwbGFjZSB0byBpbnRlcmNlcHQgYW5kIGJyb2FkY2FzdCBodHRwIHJlcXVlc3RzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvbGNpLnNlcnZpY2VzLkh0dHBJbnRlcmNlcHRvclNlcnZpY2UnLCBbXG4gICAgJ29sY2kuc2VydmljZXMuQnJvd3NlclNlcnZpY2UnLFxuICAgIC8vICdhbmFseXRpY3Muc2VydmljZXMuQW5hbHl0aWNzU2VydmljZSdcbl0pXG5cbi5zZXJ2aWNlKCdIdHRwSW50ZXJjZXB0b3JTZXJ2aWNlJywgZnVuY3Rpb24gKEJyb3dzZXJTZXJ2aWNlLCAkY2FjaGVGYWN0b3J5LCAkcSwgJHJvb3RTY29wZSkge1xuXG4gICAgdmFyIGNhY2hlID0gJGNhY2hlRmFjdG9yeS5nZXQoJyRodHRwJyk7XG4gICAgdmFyIGFwaVJlcXVlc3RNYXRjaGVyID0gbmV3IFJlZ0V4cCgvc2Vjb25kYXJ5XFwvYXBpLyk7XG5cbiAgICB2YXIgc2VsZiA9IHtcbiAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24ocmVxdWVzdCkge1xuICAgICAgICAgICAgaWYgKHJlcXVlc3QubWV0aG9kICE9IFwiR0VUXCIpIHtcbiAgICAgICAgICAgICAgICBjYWNoZS5yZW1vdmVBbGwoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9jYWNoaW5nIGZpeCBmb3IgSUVcbiAgICAgICAgICAgIGlmIChCcm93c2VyU2VydmljZS5nZXRCcm93c2VyVHlwZSgpID09PSAnaWUnICYmXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5tZXRob2QgPT0gXCJHRVRcIiAmJlxuICAgICAgICAgICAgICAgIHJlcXVlc3QudXJsLm1hdGNoKGFwaVJlcXVlc3RNYXRjaGVyKSkge1xuICAgICAgICAgICAgICAgIHJlcXVlc3QudXJsICs9ICggIXJlcXVlc3QudXJsLm1hdGNoKC9cXD8vKSA/ICc/JyA6ICcmJyApICsgXCJfPVwiICsgRGF0ZS5ub3coKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XG4gICAgICAgIH0sXG4gICAgICAgIHJlcXVlc3RFcnJvcjogZnVuY3Rpb24ocmVxdWVzdCkge1xuICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXF1ZXN0KTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVzcG9uc2U6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAvLyBvbmx5IG1hdGNoIHJlc3BvbnNlcyBmcm9tIHN1Y2Nlc3NmdWwgQVBJIGNhbGxzXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3RhdHVzPT0yMDAgJiYgcmVzcG9uc2UuY29uZmlnLnVybC5tYXRjaChhcGlSZXF1ZXN0TWF0Y2hlcikpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2h0dHBTdWNjZXNzJywgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgICB9LFxuICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgLy8gQW5hbHl0aWNzU2VydmljZS5sb2dBUElSZXNwb25zZUVycm9yKHJlc3BvbnNlLmRhdGEgfHwgcmVzcG9uc2Uuc3RhdHVzVGV4dCk7XG4gICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gc2VsZjtcbn0pXG5cbi5jb25maWcoZnVuY3Rpb24oJGh0dHBQcm92aWRlcikge1xuICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goJ0h0dHBJbnRlcmNlcHRvclNlcnZpY2UnKTtcbn0pO1xuXG4iLCJcbmFuZ3VsYXIubW9kdWxlKCdvbGNpLnNlcnZpY2VzLkxvZ2luU2VydmljZScsIFtdKVxuXG4uc2VydmljZSgnTG9naW5TZXJ2aWNlJywgZnVuY3Rpb24oJHN0YXRlLCBBdXRoU2VydmljZSkgeyBcbiAgICAgICAgdmFyIG1lID0ge1xuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuTG9naW5TZXJ2aWNlI2luaXRcbiAgICAgICAgICAgICAqIEBtZXRob2RPZiBvbGNpLnNlcnZpY2VzLkxvZ2luU2VydmljZVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIHNldHMgcGFyYW1zOiByZWRpcmVjdFN0YXRlLCBhbmQgcmVkaXJlY3RQYXJhbXNcbiAgICAgICAgICAgICAqICovXG4gICAgICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBtZS5vbkxvZ2luKCdob21lJywge30pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkxvZ2luU2VydmljZSNvbkxvZ2luXG4gICAgICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5Mb2dpblNlcnZpY2VcbiAgICAgICAgICAgICAqIEBkZXNjcmlwdGlvbiByZW1lbWJlciBhIFVJLVJvdXRlciBwYWdlIHN0YXRlIHRvIG5hdmlnYXRlIHRvIGFmdGVyIGxvZ2luIHN1Y2NlZWRzXG4gICAgICAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhdGVOYW1lIHRoZSBzdGF0ZSB0byBqdW1wIHRvIGFmdGVyIHN1Y2Nlc3NmdWwgbG9naW5cbiAgICAgICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBzdGF0ZVBhcmFtcyB0aGUgc3RhdGUgcGFyYW1zIGZvciB0aGUgZGVzdGluYXRpb24gc3RhdGUgKGlmIGFwcGxpY2FibGUpXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIG9uTG9naW46IGZ1bmN0aW9uKHN0YXRlTmFtZSwgc3RhdGVQYXJhbXMpIHtcbiAgICAgICAgICAgICAgICBtZS5yZWRpcmVjdFN0YXRlID0gc3RhdGVOYW1lO1xuICAgICAgICAgICAgICAgIG1lLnJlZGlyZWN0UGFyYW1zID0gc3RhdGVQYXJhbXM7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFByb2NlZWQgcGFzdCBsb2dpbiBwcm9tcHQgdG8gdGhlIG9yaWdpbmFsbHkgZGVzaXJlZCBwYWdlXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGZpbmlzaExvZ2luOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28obWUucmVkaXJlY3RTdGF0ZSwgbWUucmVkaXJlY3RQYXJhbXMpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkxvZ2luU2VydmljZSNsb2dvdXRcbiAgICAgICAgICAgICAqIEBtZXRob2RPZiBvbGNpLnNlcnZpY2VzLkxvZ2luU2VydmljZVxuICAgICAgICAgICAgICogQGRlc2NyaXB0aW9uIGxvZ3Mgb3V0IHVzZXJcbiAgICAgICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSByZWRpcmVjdFRvIG5hbWUgb2Ygc3RhdGUgdG8gcmVkaXJlY3QgdG9cbiAgICAgICAgICAgICAqICovXG4gICAgICAgICAgICBsb2dvdXQ6IGZ1bmN0aW9uIChyZWRpcmVjdFRvKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc29sdmUgPSBBdXRoU2VydmljZS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlLmZpbmFsbHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLmluaXQoKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIHJldHVybiByZXNvbHZlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIG1lLmluaXQoKTtcbiAgICAgICAgcmV0dXJuIG1lO1xuICAgIH0pO1xuIiwiLypcbiAqIExveWFsdHlTZXJ2aWNlLmpzXG4gKlxuICogQ3JlYXRlZDogVHVlc2RheSwgSnVuIDExLCAyMDE1XG4gKiAoYykgQ29weXJpZ2h0IDIwMTUgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5Mb3lhbHR5U2VydmljZVxuICogQGRlc2NyaXB0aW9uIFRoaXMgbW9kdWxlIGlzIGRlZGljYXRlZCB0byBzZXJ2aWNlcyByZXNwb25zaWJsZSBmb3IgZmV0Y2hpbmcgY29udGVudCBmcm9tIHRoZVxuICogICAgIGJhY2tlbmQgdXNpbmcgcHJlcGVuZGVkIHBhdGhzLlxuICovXG5cbi8qKiAgTG95YWx0eSBQcmVmZXJlbmNlIE9wdGlvbnM6XG4gKlxuICogICBjb2RlSXRlbVR5cGUgPSBcIlNcIiwgXCJHXCIsIFwiT1wiLCBcIlNTXCIsIFwiUFwiLCBvciBcIjBcIlxuICogICAgICAgUyA9IFNob3JlIEV4Y3Vyc2lvbnMgRGlzY291bnRcbiAqICAgICAgIEcgPSBBbGNvaG9sIERpc2NvdW50XG4gKiAgICAgICBPID0gT3RoZXIgcGVya3MgKGxhdW5kcnksIGludGVybmV0LCB0ZWxlcGhvbmUsIG5ld3NwYXBlcixcbiAqICAgICAgIFNTPSBTcGEgYXQgU2VhYm91cm4gU2VyZW5lXG4gKiAgICAgICBQID0gU2VhYm91cm4gQ2x1YiBTaWduYXR1cmUgTWFzc2FnZVxuICogICAgICAgMCA9IG51bGw/IENvbXBsaW1lbnRhcnkgdGVsZXBob25lP1xuICpcbiAqICAgZGlzY291bnRUeXBlID0gXCJQXCIsIG9yIFwiT1wiXG4gKiAgICAgICBQID0gUGVyY2VudFxuICogICAgICAgTyA9IE90aGVyIC8gT25lIFVzZSAvIE9ycGhhbj9cbiAqXG4gKiAgIGRpc2NvdW50ID0gMCwgMTAsIDE1LCAyNSwgKG1heWJlIG1vcmUpXG4gKiAgICAgICAvL0lmIGRpc2NvdW50ID4gMCAmJiAgZGlzY291bnRUeXBlID09PSAnUCdcbiAqICAgICAgIC8vICBEaXNjb3VudCBpcyBuJVxuICogICAgICAgLy9cbiAqXG4gKiAgIGJlbmVmaXRUeXBlID0gXCJCXCIsIG9yIFwiU1wiXG4gKiAgICAgICBTID0gU2hhcmVkXG4gKiAgICAgICBCID0gQmVuZWZpdCAocGVyc29uYWwpXG4gKlxuICovXG5cblxuXG5cblxuYW5ndWxhci5tb2R1bGUoICdvbGNpLnNlcnZpY2VzLkxveWFsdHlTZXJ2aWNlJywgW1xuICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJyxcbiAgJ3Jlc3Rhbmd1bGFyJyxcbiAgJ25nU3RvcmFnZSdcbiAgLy8gJ3NlY29uZGFyeUZsb3cuc2VydmljZXMuQXV0aFNlcnZpY2UnLFxuICAvLyAnc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5Cb29raW5nU2VydmljZScsXG4gIC8vICdzZWNvbmRhcnlGbG93LnNlcnZpY2VzLlNob3BwaW5nQ2FydFNlcnZpY2UnLFxuICAvLyAnc2Vjb25kYXJ5Rmxvdy5zZXJ2aWNlcy5TaWduYWxUb3dlclNlcnZpY2UnXG5dIClcblxuICAuc2VydmljZSgnTG95YWx0eVNlcnZpY2UnLCBmdW5jdGlvbiAgTG95YWx0eVNlcnZpY2UoIFJlc3Rhbmd1bGFyLCAkcSwgJGludGVycG9sYXRlLCAkc2Vzc2lvblN0b3JhZ2UsIENvbmZpZ3VyYXRpb24pIHtcbiAgICB2YXIgQ04gPSBcIkxveWFsdHlTZXJ2aWNlXCI7XG4gICAgdmFyIGFwcE5hbWUgPSBDb25maWd1cmF0aW9uLmFwcE5hbWU7XG5cbiAgICB2YXIgbG95YWx0eVNlcnZpY2UgPSB7XG4gICAgICBjbGVhbkxveWFsdHlEYXRhIDoge30sXG4gICAgICBsb3lhbHR5U3VtbWFyeSA6IG51bGwsXG4gICAgICBsb3lhbHR5QmFzZVVybCA6IFJlc3Rhbmd1bGFyXG4gICAgICAgIC5vbmUoICdndWVzdC92MS4wLjAvbG95YWx0eVByZWZlcmVuY2UnIClcbiAgICAgICAgLm9uZSggJ2NvbXBhbnlDb2RlJywgQ29uZmlndXJhdGlvbi5jb21wYW55Q29kZSApLFxuXG4gICAgICB1cGRhdGVMb3lhbHR5UHJlZnNVcmwgOiBSZXN0YW5ndWxhclxuICAgICAgICAub25lKCAnc2hvcHBpbmcvdjEuMC4wJyApXG4gICAgICAgIC5vbmUoICdjb21wYW55Q29kZScsIENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGUgKVxuICAgICAgICAub25lKCdjYXJ0JyksXG5cbiAgICAgIGxveWFsdHlTdW1tYXJ5UmVzb2x2ZXIgOiBmdW5jdGlvbiBsb3lhbHR5U3VtbWFyeVJlc29sdmVyKCBib29raW5nTnVtYmVyICkge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgIGlmKCBsb3lhbHR5U2VydmljZS5sb3lhbHR5U3VtbWFyeSAhPT0gbnVsbCApIHtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBsb3lhbHR5U2VydmljZS5sb3lhbHR5U3VtbWFyeSApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoIGxveWFsdHlTZXJ2aWNlLmdldExveWFsdHlQcmVmcyggYm9va2luZ051bWJlciApICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgIH0sXG5cbiAgICAgIC8qKlxuICAgICAgICogSXQgZ2V0cyB0aGUgbG95YWx0eSBwcmVmZXJlbmNlcyBhbmQgc2V0cyBsb3lhbHR5U3VtbWFyeVxuICAgICAgICogQHBhcmFtIGJvb2tpbmdTdW1tYXJ5XG4gICAgICAgKiBAcmV0dXJucyB7cHJvbWlzZX1cbiAgICAgICAqL1xuXG4gICAgICBnZXRMb3lhbHR5UHJlZnMgOiBmdW5jdGlvbiBnZXRMb3lhbHR5UHJlZnMoIGJvb2tpbmdOdW1iZXIsIGd1ZXN0cykge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgIGxveWFsdHlTZXJ2aWNlLmxveWFsdHlCYXNlVXJsXG4gICAgICAgICAgLm9uZSggJ2Jvb2tpbmdOdW1iZXInLCBib29raW5nTnVtYmVyIClcbiAgICAgICAgICAuZ2V0KClcbiAgICAgICAgICAudGhlbihcbiAgICAgICAgICAgIGZ1bmN0aW9uIHByZWZzUmVjZWl2ZWQoIGxveWFsdHlEYXRhICkge1xuICAgICAgICAgICAgICBjb25zb2xlLmRpcihsb3lhbHR5RGF0YSk7XG4gICAgICAgICAgICAgIGxveWFsdHlEYXRhLmdldExpc3QoKTtcbiAgICAgICAgICAgICAgbG95YWx0eVNlcnZpY2UubG95YWx0eVN1bW1hcnkgPSBsb3lhbHR5U2VydmljZS5jcmVhdGVMb3lhbHR5U3VtbWFyeSggbG95YWx0eURhdGEsIGd1ZXN0cyApO1xuICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBsb3lhbHR5U2VydmljZS5sb3lhbHR5U3VtbWFyeSApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIHByZWZzRmFpbGVkKCBlcnJvciApIHtcbiAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCBlcnJvciApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgfSxcblxuICAgICAgLy8gRm9yIEZyaWRheSB3ZSBjcmVhdGUgdGhlIGZvciBsb29wIGhhc2htYXBcbiAgICAgIG1hcEJlc3RQcmVmcyA6IGZ1bmN0aW9uIG1hcEJlc3RQcmVmcyggcmF3TG95YWx0eURhdGEgKSB7XG4gICAgICAgIHZhciBiZXN0U2hhcmVkUHJlZnMgPSBbXTtcbiAgICAgICAgdmFyIGtleTtcblxuICAgICAgICBfLmVhY2goIHJhd0xveWFsdHlEYXRhLmJvb2tpbmdMb3lhbHR5UHJlZmVyZW5jZUd1ZXN0cyxcbiAgICAgICAgICBmdW5jdGlvbiBwcm9jZXNzTG95YWx0eUd1ZXN0KCBsb3lhbHR5R3Vlc3QgKSB7XG4gICAgICAgICAgICBfLmVhY2goIGxveWFsdHlHdWVzdC5sb3lhbHR5UHJlZmVyZW5jZXNEZXRhaWwucHJlZmVyZW5jZUxpc3Rmb3JUaWVyLFxuICAgICAgICAgICAgICBmdW5jdGlvbiBwcm9jZXNzUHJlZiggcHJlZiApIHtcbiAgICAgICAgICAgICAgICBpZiggcHJlZi5iZW5lZml0VHlwZSAhPT0gJ1MnICkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGtleSA9IGxveWFsdHlTZXJ2aWNlLmdldEtleUZvclByZWYoIHByZWYgKTtcblxuICAgICAgICAgICAgICAgIGlmKCAhYmVzdFNoYXJlZFByZWZzWyBrZXkgXSApIHtcbiAgICAgICAgICAgICAgICAgIGJlc3RTaGFyZWRQcmVmc1sga2V5IF0gPSBwcmVmO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICBpZiggcHJlZi5kaXNjb3VudCA+IGJlc3RTaGFyZWRQcmVmc1sga2V5IF0uZGlzY291bnQgKSB7XG4gICAgICAgICAgICAgICAgICAgIGJlc3RTaGFyZWRQcmVmc1sga2V5IF0gPSBwcmVmO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgfSApO1xuICAgICAgICAgIH0gKTtcblxuICAgICAgICByYXdMb3lhbHR5RGF0YS5iZXN0U2hhcmVkUHJlZnMgPSBiZXN0U2hhcmVkUHJlZnM7XG4gICAgICAgIHJldHVybiByYXdMb3lhbHR5RGF0YTsgLy9sb3lhbHR5U3VtbWFyeVJlc29sdmVyIHdlIGtub3cgaXQgcmV0dXJucyBhcyBhIHVuZGVmaW5lZFxuICAgICAgfSxcblxuICAgICAgZ2V0S2V5Rm9yUHJlZiA6IGZ1bmN0aW9uIGdldEtleUZvclByZWYoIHByZWYgKSB7XG5cbiAgICAgICAgdmFyIHBlcmNlbnRQb3MgPSBwcmVmLmRlc2NyaXB0aW9uLmluZGV4T2YoICclJyApO1xuICAgICAgICB2YXIga2V5ID0gcHJlZi5kZXNjcmlwdGlvbi5zdWJzdHJpbmcoIHBlcmNlbnRQb3MgKTtcblxuICAgICAgICByZXR1cm4ga2V5O1xuICAgICAgfSxcblxuICAgICAgXG5cbiAgICAgIGNyZWF0ZUxveWFsdHlTdW1tYXJ5IDogZnVuY3Rpb24gY3JlYXRlTG95YWx0eVN1bW1hcnkoIHJhd0xveWFsdHlEYXRhLCBndWVzdHMgKSB7XG4gICAgICAgIHZhciBsb3lhbHR5U3VtbWFyeSA9IGxveWFsdHlTZXJ2aWNlLm1hcEJlc3RQcmVmcyggcmF3TG95YWx0eURhdGEgKTtcbiAgICAgICAgbG95YWx0eVN1bW1hcnkucHJlZmVyZW5jZUNvdW50ID0gMDtcbiAgICAgICAgbG95YWx0eVN1bW1hcnkucHJlZmVyZW5jZUxpbWl0ID0gMDtcblxuICAgICAgICBsb3lhbHR5U3VtbWFyeS5pc0FueUd1ZXN0QWxsb3dlZFRvU3BlbmRMb3lhbHR5UG9pbnRzID0gZmFsc2U7XG4gICAgICAgIGxveWFsdHlTZXJ2aWNlLnNob3dTQk5TcGFMaW5rID0gZmFsc2U7XG4gICAgICAgIF8uZWFjaCggbG95YWx0eVN1bW1hcnkuYm9va2luZ0xveWFsdHlQcmVmZXJlbmNlR3Vlc3RzLCBmdW5jdGlvbiBwcm9jZXNzR3Vlc3RzKCBsb3lhbHR5R3Vlc3QgKSB7XG5cbiAgICAgICAgICAvLyBpZiAoIWxveWFsdHlTZXJ2aWNlLnNob3dTQk5TcGFMaW5rKSB7XG4gICAgICAgICAgLy8gICAgIC8vIGNhbGwgaGFzU0JOU3BhQmVuZWZpdCB3aGVuIHVuZGVmaW5lZCBvciBmYWxzZVxuICAgICAgICAgIC8vICAgICBsb3lhbHR5U2VydmljZS5zaG93U0JOU3BhTGluayA9IGxveWFsdHlTZXJ2aWNlLmhhc1NCTlNwYUJlbmVmaXQobG95YWx0eUd1ZXN0KTtcbiAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICBpZihsb3lhbHR5R3Vlc3QubG95YWx0eVByZWZlcmVuY2VzRGV0YWlsLnByZWZlcmVuY2VBbGxvd0xpbWl0ID4gMCkge1xuICAgICAgICAgICAgbG95YWx0eVN1bW1hcnkuaXNBbnlHdWVzdEFsbG93ZWRUb1NwZW5kTG95YWx0eVBvaW50cyA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgXy5maW5kKCBndWVzdHMsIGZ1bmN0aW9uIHRyYW5zZmVyR3Vlc3RJbmZvKCBib29raW5nR3Vlc3QgKSB7XG4gICAgICAgICAgICB2YXIgZmlyc3ROYW1lID0gYm9va2luZ0d1ZXN0LmZpcnN0TmFtZTtcbiAgICAgICAgICAgIHZhciBsYXN0TmFtZSA9IGJvb2tpbmdHdWVzdC5sYXN0TmFtZTtcbiAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICBpZiggTnVtYmVyKGJvb2tpbmdHdWVzdC5zZXFOdW1iZXIpID09IE51bWJlcihsb3lhbHR5R3Vlc3QucGFydHlOdW1iZXIpICkge1xuICAgICAgICAgICAgICBsb3lhbHR5R3Vlc3QuZ3Vlc3RJbmZvID0ge2ZpcnN0TmFtZTogZmlyc3ROYW1lLCBsYXN0TmFtZTogbGFzdE5hbWV9O1xuXG4gICAgICAgICAgICAgIGlmKCFsb3lhbHR5R3Vlc3QudW5pcXVlSWQpIHtcbiAgICAgICAgICAgICAgICAvL3RoaXMgd2FzIGNoYW5nZWQgZnJvbSBzZWNvbmRhcnkgZmxvdy4uLiB3ZSdyZSBqdXN0IHVzaW5nIHNlcXVlbmNlIG51bWJlclxuICAgICAgICAgICAgICAgIGxveWFsdHlHdWVzdC51bmlxdWVJZCA9IEJvb2tpbmdTZXJ2aWNlLmJvb2tpbmdTdW1tYXJ5LmJvb2tpbmdOdW1iZXIgKyBcIl9cIiArIGxveWFsdHlHdWVzdC5wYXJ0eU51bWJlcjtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmKCFsb3lhbHR5R3Vlc3QubXBVcGRhdGVkKSB7XG4gICAgICAgICAgICAgICAgLy9Eb24ndCBrbm93IHdoYXQgdGhpcyBhY3R1YWxseSBtZWFucyAtIFByZWV0aSBzYWlkIGl0IHdhcyByZXF1aXJlZCB0byBiZSBZIG9yIE4gYW5kIE4gaXMgZGVmYXVsdC5cbiAgICAgICAgICAgICAgICBsb3lhbHR5R3Vlc3QubXBVcGRhdGVkID0gXCJOXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgIC8vIHJldHVybiBkZWZlcnJlZC5yZXNvbHZlKGxveWFsdHlHdWVzdC5ndWVzdEluZm8uZmlyc3ROYW1lID09PSBib29raW5nR3Vlc3QuZmlyc3ROYW1lKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAvLyAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAvLyB9KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0gXG4gICAgICAgICAgICAvLyByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAvLyBkZWZlcnJlZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgIC8vIHJldHVybiggTnVtYmVyKGJvb2tpbmdHdWVzdC5zZXFOdW1iZXIpID09PSBOdW1iZXIobG95YWx0eUd1ZXN0LnBhcnR5TnVtYmVyKSApO1xuICAgICAgICAgIH0gKTtcblxuICAgICAgICAgIGxveWFsdHlTdW1tYXJ5LnByZWZlcmVuY2VDb3VudCArPSBsb3lhbHR5R3Vlc3Quc2VsZWN0ZWRMb3lhbHR5UHJlZmVyZW5jZXNEZXRhaWxzLmxlbmd0aDtcbiAgICAgICAgICBsb3lhbHR5U3VtbWFyeS5wcmVmZXJlbmNlTGltaXQgKz0gKGxveWFsdHlHdWVzdC5sb3lhbHR5UHJlZmVyZW5jZXNEZXRhaWwucHJlZmVyZW5jZUFsbG93TGltaXQgfHwgMCk7XG5cbiAgICAgICAgfSApO1xuICAgICAgICByZXR1cm4gbG95YWx0eVN1bW1hcnk7XG4gICAgICB9LFxuXG4gICAgICAvLyBoYXNTQk5TcGFCZW5lZml0OiBmdW5jdGlvbihsb3lhbHR5R3Vlc3QpIHtcbiAgICAgIC8vICAgICB2YXIgbWF0Y2ggPSBfLmZpbmQobG95YWx0eUd1ZXN0LnNlbGVjdGVkTG95YWx0eVByZWZlcmVuY2VzRGV0YWlscywgZnVuY3Rpb24oc2VsZWN0ZWQpIHtcbiAgICAgIC8vICAgICAgICAgcmV0dXJuIHNlbGVjdGVkLmNvZGUgPT09ICdUWlNFUicgJiYgc2VsZWN0ZWQucHJlcGFpZFNhbGUgPT09ICdOJyB8fFxuICAgICAgLy8gICAgICAgICAgICAgICAgc2VsZWN0ZWQuY29kZSA9PT0gJ1RaU1BBJyAmJiBzZWxlY3RlZC5wcmVwYWlkU2FsZSA9PT0gJ04nO1xuICAgICAgLy8gICAgIH0pO1xuXG4gICAgICAvLyAgICAgcmV0dXJuICEhbWF0Y2g7XG4gICAgICAvLyB9LFxuXG4gICAgICB1cGRhdGVMb3lhbHR5UHJlZnM6IGZ1bmN0aW9uIChsb3lhbHR5U3VtbWFyeSkge1xuICAgICAgICBpZighbG95YWx0eVN1bW1hcnkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBsb3lhbHR5U3VtbWFyeSA9IGxveWFsdHlTdW1tYXJ5LmJvb2tpbmdMb3lhbHR5UHJlZmVyZW5jZUd1ZXN0cztcbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcbiAgICAgICAgbG95YWx0eVNlcnZpY2UudXBkYXRlTG95YWx0eVByZWZzVXJsXG4gICAgICAgICAgLnBvc3QoJ2xveWFsdHlPcHRpb25zJywgbG95YWx0eVN1bW1hcnkpXG4gICAgICAgICAgLnRoZW4oXG4gICAgICAgICAgZnVuY3Rpb24gKGxveWFsdHlEYXRhKSB7XG4gICAgICAgICAgICAvL1RPRE8gSGFuZGxlIHJlc3BvbnNlcy4uLlxuXG4gICAgICAgICAgICAvL1JpZ2h0IG5vdyBMb3lhbHR5RGF0YSByZXR1cm5zIHVuZGVmaW5lZCBhbmQgdGhlIGNhY2hlZCBkYXRhIGRvZXNuJ3QgcmVmcmVzaCB0aGUgbG95YWx0eSBzZXJ2aWNlIHNlbGVjdGVkIHByZWZzXG4gICAgICAgICAgICBsb3lhbHR5U2VydmljZS5nZXRMb3lhbHR5UHJlZnMoICRzZXNzaW9uU3RvcmFnZS5ib29raW5nSW5mby5ib29raW5nTnVtYmVyICk7XG5cbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUobG95YWx0eURhdGEpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgLy91bnN1Y2Nlc3NmdWwgbmV0d29yayBjYWxsXG4gICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICB9LFxuXG4gICAgICByZXNldDogZnVuY3Rpb24gcmVzZXQoKSB7XG4gICAgICAgIGxveWFsdHlTZXJ2aWNlLmxveWFsdHlTdW1tYXJ5ID0gbnVsbDtcbiAgICAgICAgbG95YWx0eVNlcnZpY2UuY2xlYW5Mb3lhbHR5RGF0YSA9IHt9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gbG95YWx0eVNlcnZpY2U7XG4gIH0gKTtcblxuXG4gIC8vIGhhc1BvaW50c0ZpbHRlciA6IGZ1bmN0aW9uIGhhc1BvaW50c0ZpbHRlciggbG95YWx0eUd1ZXN0LCBoYXNQb2ludHMgKSB7XG4gIC8vICAgICAgICAgICAgIGlmICggdHlwZW9mIGxveWFsdHlHdWVzdC5sb3lhbHR5UHJlZmVyZW5jZXNEZXRhaWwucHJlZmVyZW5jZUFsbG93TGltaXQgIT09IHVuZGVmaW5lZCApIHJldHVybiBmYWxzZTtcbiAgLy8gICAgICAgICAgICAgcmV0dXJuIChoYXNQb2ludHMpID8gKCBsb3lhbHR5R3Vlc3QubG95YWx0eVByZWZlcmVuY2VzRGV0YWlsLnByZWZlcmVuY2VBbGxvd0xpbWl0ID4gMCApIDogISggbG95YWx0eUd1ZXN0LmxveWFsdHlQcmVmZXJlbmNlc0RldGFpbC5wcmVmZXJlbmNlQWxsb3dMaW1pdCA+IDAgKTtcbiAgLy8gICAgICAgICB9LFxuIiwiLypcbiAqIE1vZGFsU2VydmljZS5qc1xuICpcbiAqIENyZWF0ZWQ6IFRodXJzZGF5LCBOb3ZlbWJlciAzLCAyMDE0XG4gKiAoYykgQ29weXJpZ2h0IDIwMTQgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5Nb2RhbFNlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBUaGVzZSBzZXJ2aWNlIG1ldGhvZHMgYXJlIHVzZWQgd2l0aCBtb2RhbHMgdG8gY29udHJvbCBsaWZlY3ljbGUuXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ29sY2kuc2VydmljZXMuTW9kYWxTZXJ2aWNlJywgW1xuICAgICd1aS5ib290c3RyYXAubW9kYWwnLFxuICAgICdvbGNpLnNlcnZpY2VzLkFuYWx5dGljc1NlcnZpY2UnXG5dKVxuLnNlcnZpY2UoJ01vZGFsU2VydmljZScsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRtb2RhbCwgQW5hbHl0aWNzU2VydmljZSkge1xuICAgIHZhciBtZSA9IHtcbiAgICAgICAgbW9kYWw6IG51bGwsXG4gICAgICAgIG1vZGFsQXJnczogbnVsbCxcbiAgICAgICAgaXNNb2RhbE9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIG1lLm1vZGFsICE9PSBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBvcGVuTW9kYWw6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgICAgIG1lLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgIEFuYWx5dGljc1NlcnZpY2UubG9nTW9kYWxPcGVuRXZlbnQoYXJncyk7XG4gICAgICAgICAgICBtZS5tb2RhbEFyZ3MgPSBhcmdzO1xuICAgICAgICAgICAgbWUubW9kYWwgPSAkbW9kYWwub3BlbihhcmdzKTtcblxuICAgICAgICAgICAgcmV0dXJuIG1lLm1vZGFsO1xuICAgICAgICB9LFxuICAgICAgICBjbG9zZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChtZS5tb2RhbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWUubW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgICAgIG1lLm1vZGFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICBtZS5tb2RhbEFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vV2hlbiB0aGUgdXNlciBuYXZpZ2F0ZXMgYXdheSBmcm9tIGEgcGFnZSB3aGlsZSBhIG1vZGFsIGlzIG9wZW4sIGNsb3NlIHRoZSBtb2RhbC5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xuICAgICAgICBtZS5jbG9zZU1vZGFsKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWU7XG59KTsiLCIvKlxuICogUmVnRXhwU2VydmljZS5qc1xuICpcbiAqIENyZWF0ZWQ6IFR1ZXNkYXksIEF1Z3VzdCAxOSwgMjAxNFxuICogKGMpIENvcHlyaWdodCAyMDE0IEhvbGxhbmQgQW1lcmljYSwgSW5jLiAtIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqIFRoaXMgaXMgdW5wdWJsaXNoZWQgcHJvcHJpZXRhcnkgc291cmNlIGNvZGUgb2YgSG9sbGFuZCBBbWVyaWNhLCBJbmMuXG4gKiBUaGUgY29weXJpZ2h0IG5vdGljZSBhYm92ZSBkb2VzIG5vdCBldmlkZW5jZSBhbnkgYWN0dWFsIG9yIGludGVuZGVkXG4gKiBwdWJsaWNhdGlvbiBvZiBzdWNoIHNvdXJjZSBjb2RlLlxuICovXG5cbi8qKlxuICogQG5nZG9jIG92ZXJ2aWV3XG4gKiBAbmFtZSBvbGNpLnNlcnZpY2VzLlJlZ0V4cFNlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBBbiBlbXB0eSBtb2R1bGUgZGVzY3JpcHRpb24uIFBsZWFzZSBmaWxsIGluIGEgaGlnaCBsZXZlbCBkZXNjcmlwdGlvbiBvZiB0aGlzIG1vZHVsZS5cbiAqL1xuYW5ndWxhci5tb2R1bGUoICdvbGNpLnNlcnZpY2VzLlJlZ0V4cFNlcnZpY2UnLCBbXG5cblxuXSlcblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5SZWdFeHBTZXJ2aWNlXG4gKiBAZGVzY3JpcHRpb24gUmVndWxhciBleHByZXNzaW9ucyB0byBiZSB1c2VkIGluIGZpZWxkIHZhbGlkYXRpb25zLlxuICovXG4gICAgLnNlcnZpY2UoJ1JlZ0V4cFNlcnZpY2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlZ0V4cFNlcnZpY2UgPSB7XG5cbiAgICAgICAgICAgIC8vIENyZWRpdCBDYXJkIHR5cGVzXG4gICAgICAgICAgICBjYXJkVHlwZUFtZXggOiBuZXcgUmVnRXhwKC9eKDM0KXxeKDM3KS8pLFxuICAgICAgICAgICAgY2FyZFR5cGVEaXNjb3ZlciA6IG5ldyBSZWdFeHAoL14oNjAxMSl8Xig2MjIoMSgyWzYtOV18WzMtOV1bMC05XSl8WzItOF1bMC05XXsyfXw5KFswMV1bMC05XXwyWzAtNV0pKSl8Xig2NFs0LTldKXxeNjUvKSxcbiAgICAgICAgICAgIGNhcmRUeXBlTWFzdGVyIDogbmV3IFJlZ0V4cCgvXjVbMS01XS8pLFxuICAgICAgICAgICAgY2FyZFR5cGVWaXNhIDogbmV3IFJlZ0V4cCgvXjQvKSxcblxuICAgICAgICAgICAgLy8gYWRkaXRpb25hbCBjYXJkcyBmb3Igc2VhYm91cm5lXG4gICAgICAgICAgICAvLyBjYXJkVHlwZURpbmVyc0NsdWIgOiBuZXcgUmVnRXhwKC9eMyg/OjBbMC01XXxbNjhdWzAtOV0pWzAtOV17MTF9JC8pLFxuICAgICAgICAgICAgLy8gY2FyZFR5cGVKQ0IgOiBuZXcgUmVnRXhwKC9eKD86MjEzMXwxODAwfDM1XFxkezN9KVxcZHsxMX0kLyksXG5cbiAgICAgICAgICAgIG5hbWUgOiBuZXcgUmVnRXhwKC9eW2EtekEtWi0nXFwuIF0qJC8pLFxuICAgICAgICAgICAgbmFtZUxhc3Q6IG5ldyBSZWdFeHAoL15bYS16QS1aLScgXSokLyksXG4gICAgICAgICAgICBuYW1lRmlyc3Q6IG5ldyBSZWdFeHAoL15bYS16QS1aLSBdKiQvKSxcbiAgICAgICAgICAgIGFkZHJlc3M6IG5ldyBSZWdFeHAoL15bYS16QS1aMC05XFwgXFwsXFwuflxcYCFcXEBcXCNcXCRcXF5cXCooKVxcLV9cXCs9XFx7XFx9XFxbXFxdXFx8XFxcXDs6XFxcIlxcJ1xcL117MSwzMH0kLyksXG4gICAgICAgICAgICBjaXR5OiBuZXcgUmVnRXhwKC9eW2EtekEtWi1cXCcgXXsxLDMwfSQvKSxcbiAgICAgICAgICAgIC8vIHBvc3RhbCBjb2RlXG4gICAgICAgICAgICBwb3N0YWxDb2RlVVM6IG5ldyBSZWdFeHAoL15cXGR7NX1cXC1cXGR7NH0kfF5cXGR7OX0kfF5cXGR7NX0kLyksXG4gICAgICAgICAgICBwb3N0YWxDb2RlQVU6IG5ldyBSZWdFeHAoL15cXGR7NH0kLyksXG4gICAgICAgICAgICBwb3N0YWxDb2RlSUU6IG5ldyBSZWdFeHAoL15bYS16QS1aMC05XFwgXFwtXXswLDEwfSQvKSxcbiAgICAgICAgICAgIHBvc3RhbENvZGU6IG5ldyBSZWdFeHAoL15bYS16QS1aMC05XFwgXFwtXXsxLDEwfSQvKSxcbiAgICAgICAgICAgIC8vIFBob25lIG51bWJlcnNcbiAgICAgICAgICAgIHRlbGVwaG9uZVVTOiBuZXcgUmVnRXhwKC9eXFxkezEwfSQvKSxcbiAgICAgICAgICAgIHRlbGVwaG9uZUNBOiBuZXcgUmVnRXhwKC9eXFxkezEwfSQvKSxcbiAgICAgICAgICAgIHRlbGVwaG9uZTogbmV3IFJlZ0V4cCgvXltcXHNcXGQtLigpK117NiwzNn0kLyksXG5cbiAgICAgICAgICAgIHRlbGVwaG9uZUNsZWFuOiBuZXcgUmVnRXhwKC9bXlxcZF0vZyksXG5cbiAgICAgICAgICAgIGVtYWlsOiBuZXcgUmVnRXhwKC8oKFtePD4oKVtcXF1cXFxcLiw7Olxcc0BcXFwiXSsoXFwuW148PigpW1xcXVxcXFwuLDs6XFxzQFxcXCJdKykqKXwoXFxcIi4rXFxcIikpQCgoXFxbWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcXSl8KChbYS16QS1aXFwtMC05XStcXC4pK1thLXpBLVpdezIsfSkpLyksXG4gICAgICAgICAgICAvLyBnZW5lcmFsIHZhbGlkYXRpb25cbiAgICAgICAgICAgIG51bWJlcnNPbmx5OiBuZXcgUmVnRXhwKC8oWzEtOV1bMC05XSopfDAvKSxcblxuICAgICAgICAgICAgLyogcHJvbW9jb2RlICovXG4gICAgICAgICAgICBwcm9tb2NvZGU6IG5ldyBSZWdFeHAoL15bXFx3XXswLDI1fSQvaSksXG5cbiAgICAgICAgICAgIHZhbGlkYXRlUG9zdGFsQ29kZTogZnVuY3Rpb24oY29kZSwgY291bnRyeSkge1xuICAgICAgICAgICAgICAgIHZhciByZWdleHAgPSByZWdFeHBTZXJ2aWNlWydwb3N0YWxDb2RlJyArIGNvdW50cnldO1xuICAgICAgICAgICAgICAgIGlmICghcmVnZXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4cCA9IHJlZ0V4cFNlcnZpY2UucG9zdGFsQ29kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlZ2V4cC50ZXN0KGNvZGUpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0UG9zdGFsQ29kZVJlZ0V4cDogZnVuY3Rpb24oY291bnRyeSkge1xuICAgICAgICAgICAgICAgIHZhciByZWdleHAgPSByZWdFeHBTZXJ2aWNlWydwb3N0YWxDb2RlJyArIGNvdW50cnldO1xuICAgICAgICAgICAgICAgIGlmICghcmVnZXhwKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZ2V4cCA9IHJlZ0V4cFNlcnZpY2UucG9zdGFsQ29kZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlZ2V4cDtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHZhbGlkYXRlUGhvbmU6IGZ1bmN0aW9uKGNvZGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVnZXhwID0gcmVnRXhwU2VydmljZS50ZWxlcGhvbmU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlZ2V4cC50ZXN0KGNvZGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiByZWdFeHBTZXJ2aWNlO1xuICAgIH0pOyIsIi8qXG4gKiBSb3V0aW5nVXRpbHNTZXJ2aWNlLmpzXG4gKlxuICogQ3JlYXRlZDogVHVlc2RheSwgRmVicnVhcnkgMTEsIDIwMTRcbiAqIChjKSBDb3B5cmlnaHQgMjAxNCBIb2xsYW5kIEFtZXJpY2EsIEluYy4gLSBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiBUaGlzIGlzIHVucHVibGlzaGVkIHByb3ByaWV0YXJ5IHNvdXJjZSBjb2RlIG9mIEhvbGxhbmQgQW1lcmljYSwgSW5jLlxuICogVGhlIGNvcHlyaWdodCBub3RpY2UgYWJvdmUgZG9lcyBub3QgZXZpZGVuY2UgYW55IGFjdHVhbCBvciBpbnRlbmRlZFxuICogcHVibGljYXRpb24gb2Ygc3VjaCBzb3VyY2UgY29kZS5cbiAqL1xuXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG9sY2kuc2VydmljZXMuUm91dGluZ1V0aWxzU2VydmljZVxuICogQGRlc2NyaXB0aW9uIFNoaW0gZm9yIGdlbmVyYXRpbmcgdXJscy4gV2Ugc2hvdWxkIGxvb2sgaW50byB1c2luZyBTdGF0ZVByb3ZpZGVyIGZvciB0aGlzLlxuICogQHJlcXVpcmVzIHVpLnJvdXRlclxuICogQHJlcXVpcmVzIEFwcGxpY2F0aW9uQ29uZmlndXJhdGlvblxuICovXG5hbmd1bGFyLm1vZHVsZSggJ29sY2kuc2VydmljZXMuUm91dGluZ1V0aWxzU2VydmljZScsIFtcbiAgICAndWkucm91dGVyJyxcbiAgICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJ1xuXSlcbi5zZXJ2aWNlKCdSb3V0aW5nVXRpbHNTZXJ2aWNlJywgWyAnJGludGVycG9sYXRlJywgJyRmaWx0ZXInLCAnQ29uZmlndXJhdGlvbicsIGZ1bmN0aW9uKCRpbnRlcnBvbGF0ZSwgJGZpbHRlciwgQ29uZmlndXJhdGlvbikgeyByZXR1cm4ge1xuICAgIC8qKlxuICAgICAqIEdlbmVyYXRlIGEgVVJMIGZvciBmcm9udGVuZCBhY3Rpb25zXG4gICAgICogQHJldHVybnMge3N0cmluZ30gYW4gYWJzb2x1dGUgVVJMIGZvciB0aGUgc2VydmVyIHJlcXVlc3RcbiAgICAgKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLlJvdXRpbmdVdGlsc1NlcnZpY2UjZnJvbnRlbmRCYXNlVXJsXG4gICAgICAgICAqIEBtZXRob2RPZiBvbGNpLnNlcnZpY2VzLlJvdXRpbmdVdGlsc1NlcnZpY2VcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIEdlbmVyYXRlIGEgVVJMIGZvciBmcm9udGVuZCBhY3Rpb25zXG4gICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBhY3Rpb24gSFRUUCB2ZXJiXG4gICAgICAgICAqIEByZXR1cm5zIHtzdHJpbmd9IGFuIGFic29sdXRlIFVSTCBmb3IgdGhlIHNlcnZlciByZXF1ZXN0XG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICA8cHJlPlxuICAgICAgICAgICAgQ29uZmlndXJhdGlvbi5mcm9udGVuZC5iYXNlVXJsICsgYWN0aW9uO1xuICAgICAgICAgPC9wcmU+XG4gICAgICAgICAqICovXG4gICAgZnJvbnRlbmRCYXNlVXJsOiBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICAgICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBDb25maWd1cmF0aW9uLmZyb250ZW5kLmJhc2VVcmwgKyBhY3Rpb247XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSBVUkwgZm9yIGZyb250ZW5kIGJvb2tpbmdcbiAgICAgKiBAcmV0dXJucyB7c3RyaW5nfSBhbiBhYnNvbHV0ZSBVUkwgZm9yIHRoZSByZXNvdXJjZVxuICAgICAqL1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuUm91dGluZ1V0aWxzU2VydmljZSNmcm9udGVuZEJvb2tpbmdVcmxcbiAgICAgICAgICogQG1ldGhvZE9mIG9sY2kuc2VydmljZXMuUm91dGluZ1V0aWxzU2VydmljZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gR2VuZXJhdGUgYSBVUkwgZm9yIGZyb250ZW5kIGJvb2tpbmdcbiAgICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGFjdGlvbiBIVFRQIHZlcmJcbiAgICAgICAgICogQHJldHVybnMge3N0cmluZ30gYW4gYWJzb2x1dGUgVVJMIGZvciB0aGUgcmVzb3VyY2VcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgIDxwcmU+XG4gICAgICAgICBDb25maWd1cmF0aW9uLmZyb250ZW5kQm9va2luZy5iYXNlVXJsICsgYWN0aW9uO1xuICAgICAgICAgPC9wcmU+XG4gICAgICAgICAqICovXG4gICAgZnJvbnRlbmRCb29raW5nVXJsOiBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICAgICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBDb25maWd1cmF0aW9uLmZyb250ZW5kQm9va2luZy5iYXNlVXJsICsgYWN0aW9uO1xuICAgICAgICB9XG4gICAgfVxuXG59O31dKTtcbiIsImFuZ3VsYXIubW9kdWxlKCdvbGNpLnNlcnZpY2VzLlNlcmlhbGl6ZVNlcnZpY2UnLCBbXG4gICAgJ25nU3RvcmFnZScsXG4gICAgJ0FwcGxpY2F0aW9uQ29uZmlndXJhdGlvbicsXG4gICAgJ29sY2kuc2VydmljZXMuU2hhcmVkRGF0YVNlcnZpY2UnXG5dKVxuXG4uZmFjdG9yeSgnU2VyaWFsaXplU2VydmljZScsIGZ1bmN0aW9uKCAkc2Vzc2lvblN0b3JhZ2UsIENvbmZpZ3VyYXRpb24sIFNoYXJlZERhdGFTZXJ2aWNlICkge1xuICAgIHZhciBjb3VudHJpZXMgPSBTaGFyZWREYXRhU2VydmljZS5nZXRDb3VudHJpZXMoKTtcbiAgICByZXR1cm4ge1xuXG4gICAgICAgIHNlcmlhbGl6ZUNvdW50cnk6IGZ1bmN0aW9uKCBjb3VudHJ5TGFiZWwgKSB7XG4gICAgICAgICAgICB2YXIgY291bnRyeUNvZGU7XG4gICAgICAgICAgICBjb3VudHJpZXMuZm9yRWFjaCggZnVuY3Rpb24oIGVsZW1lbnQsIGluZGV4ICl7XG4gICAgICAgICAgICAgICAgaWYgKCBlbGVtZW50Lm5hbWUgPT09IGNvdW50cnlMYWJlbCApIHtcbiAgICAgICAgICAgICAgICAgICAgY291bnRyeUNvZGUgPSBlbGVtZW50LmNvZGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gY291bnRyeUNvZGU7XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiLypcbiAqIFNoYXJlZERhdGFTZXJ2aWNlLmpzXG4gKlxuICogQ3JlYXRlZDogQXByaWwsIDIwMTVcbiAqIChjKSBDb3B5cmlnaHQgMjAxNSBIb2xsYW5kIEFtZXJpY2EsIEluYy4gLSBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiBUaGlzIGlzIHVucHVibGlzaGVkIHByb3ByaWV0YXJ5IHNvdXJjZSBjb2RlIG9mIEhvbGxhbmQgQW1lcmljYSwgSW5jLlxuICogVGhlIGNvcHlyaWdodCBub3RpY2UgYWJvdmUgZG9lcyBub3QgZXZpZGVuY2UgYW55IGFjdHVhbCBvciBpbnRlbmRlZFxuICogcHVibGljYXRpb24gb2Ygc3VjaCBzb3VyY2UgY29kZS5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBvdmVydmlld1xuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5TaGFyZWREYXRhU2VydmljZVxuICogQGRlc2NyaXB0aW9uIFNpbmdsZSBzZXJ2aWNlIHRvIGhvbGQgc2hhcmVkIGNvbnN0YW50cyBhbmQgdmFyaWFibGVzXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdvbGNpLnNlcnZpY2VzLlNoYXJlZERhdGFTZXJ2aWNlJywgW1xuICAgICdwYXNjYWxwcmVjaHQudHJhbnNsYXRlJyxcbiAgICAncmVzdGFuZ3VsYXInLFxuICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nLFxuICAgICdvbGNpLnNlcnZpY2VzLkdldENvcHlTZXJ2aWNlJ1xuXSlcblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5TaGFyZWREYXRhU2VydmljZVxuICogQGRlc2NyaXB0aW9uIFNpbmdsZSBzZXJ2aWNlIHRvIGhvbGQgc2hhcmVkIGNvbnN0YW50cyBhbmQgdmFyaWFibGVzLlxuICovXG4gICAgLnNlcnZpY2UoJ1NoYXJlZERhdGFTZXJ2aWNlJywgZnVuY3Rpb24oJHRyYW5zbGF0ZSwgJHEsICR0aW1lb3V0LCAkaHR0cCwgUmVzdGFuZ3VsYXIsIENvbmZpZ3VyYXRpb24sIEdldENvcHlTZXJ2aWNlKSB7XG4gICAgICAgIHZhciBjb3VudHJ5ID0gJ1VTJztcbiAgICAgICAgdmFyIHRyYXZlbEJhc2VVcmwgPSBSZXN0YW5ndWxhci5vbmUoJ3RyYXZlbFBsYW5uaW5nL3YxLjAuMC9haXJIb21lQ2l0eUxpc3QnKS5vbmUoJ2NvbXBhbnlDb2RlJywgQ29uZmlndXJhdGlvbi5jb21wYW55Q29kZSkub25lKCdjb3VudHJ5Q29kZScsIGNvdW50cnkpO1xuXG5cbiAgICAgICAgLy8gdGFrZW4gZnJvbSBzZWNvbmRhcnlGbG93IENyZWRpdENhcmRTZXJ2aWNlXG4gICAgICAgIHZhciBrZXksXG4gICAgICAgICAgICAvLyBjb3VudHJpZXMgPSBbXG4gICAgICAgICAgICAvLyBcIkFEXCIsXCJBRVwiLFwiQUdcIixcIkFJXCIsXCJBTVwiLFwiQU5cIixcIkFPXCIsXCJBUlwiLFwiQVNcIixcIkFUXCIsXG4gICAgICAgICAgICAvLyBcIkFVXCIsXCJBV1wiLFwiQVpcIixcIkJBXCIsXCJCQlwiLFwiQkRcIixcIkJFXCIsXCJCRlwiLFwiQkdcIixcIkJIXCIsXG4gICAgICAgICAgICAvLyBcIkJJXCIsXCJCSlwiLFwiQk1cIixcIkJOXCIsXCJCT1wiLFwiQlJcIixcIkJTXCIsXCJCVFwiLFwiQldcIixcIkJZXCIsXG4gICAgICAgICAgICAvLyBcIkJaXCIsXCJDQVwiLFwiQ0NcIixcIkNEXCIsXCJDRlwiLFwiQ0dcIixcIkNIXCIsXCJDSVwiLFwiQ0tcIixcIkNMXCIsXG4gICAgICAgICAgICAvLyBcIkNNXCIsXCJDTlwiLFwiQ09cIixcIkNSXCIsXCJDVVwiLFwiQ1ZcIixcIkNYXCIsXCJDWVwiLFwiQ1pcIixcIkRFXCIsXG4gICAgICAgICAgICAvLyBcIkRKXCIsXCJES1wiLFwiRE1cIixcIkRPXCIsXCJEWlwiLFwiRUNcIixcIkVFXCIsXCJFR1wiLFwiRUhcIixcIkVSXCIsXG4gICAgICAgICAgICAvLyBcIkVTXCIsXCJFVFwiLFwiRklcIixcIkZKXCIsXCJGS1wiLFwiRk1cIixcIkZPXCIsXCJGUlwiLFwiRlhcIixcIkdBXCIsXG4gICAgICAgICAgICAvLyBcIkdCXCIsXCJHRFwiLFwiR0VcIixcIkdGXCIsXCJHR1wiLFwiR0hcIixcIkdJXCIsXCJHTFwiLFwiR01cIixcIkdOXCIsXG4gICAgICAgICAgICAvLyBcIkdQXCIsXCJHUVwiLFwiR1JcIixcIkdUXCIsXCJHVVwiLFwiR1dcIixcIkdZXCIsXCJIS1wiLFwiSE5cIixcIkhSXCIsXG4gICAgICAgICAgICAvLyBcIkhUXCIsXCJIVVwiLFwiSURcIixcIklFXCIsXCJJTFwiLFwiSU1cIixcIklOXCIsXCJJT1wiLFwiSVFcIixcIklSXCIsXG4gICAgICAgICAgICAvLyBcIklTXCIsXCJJVFwiLFwiSkVcIixcIkpNXCIsXCJKT1wiLFwiSlBcIixcIktFXCIsXCJLR1wiLFwiS0hcIixcIktJXCIsXG4gICAgICAgICAgICAvLyBcIktNXCIsXCJLTlwiLFwiS1BcIixcIktSXCIsXCJLV1wiLFwiS1lcIixcIktaXCIsXCJMQVwiLFwiTEJcIixcIkxDXCIsXG4gICAgICAgICAgICAvLyBcIkxJXCIsXCJMVFwiLFwiTEtcIixcIkxSXCIsXCJMU1wiLFwiTFVcIixcIkxWXCIsXCJMWVwiLFwiTUFcIixcIk1DXCIsXG4gICAgICAgICAgICAvLyBcIk1EXCIsXCJNRVwiLFwiTUdcIixcIk1IXCIsXCJNS1wiLFwiTUxcIixcIk1NXCIsXCJNTlwiLFwiTU9cIixcIk1QXCIsXG4gICAgICAgICAgICAvLyBcIk1RXCIsXCJNUlwiLFwiTVNcIixcIk1UXCIsXCJNVVwiLFwiTVZcIixcIk1XXCIsXCJNWFwiLFwiTVlcIixcIk1aXCIsXG4gICAgICAgICAgICAvLyBcIk5BXCIsXCJOQ1wiLFwiTkVcIixcIk5GXCIsXCJOR1wiLFwiTklcIixcIk5MXCIsXCJOT1wiLFwiTlBcIixcIk5SXCIsXG4gICAgICAgICAgICAvLyBcIk5VXCIsXCJOWlwiLFwiT01cIixcIlBBXCIsXCJQRVwiLFwiUEZcIixcIlBHXCIsXCJQSFwiLFwiUEtcIixcIlBMXCIsXG4gICAgICAgICAgICAvLyBcIlBNXCIsXCJQUlwiLFwiUFNcIixcIlBUXCIsXCJQV1wiLFwiUFlcIixcIlFBXCIsXCJSRVwiLFwiUk9cIixcIlJTXCIsXG4gICAgICAgICAgICAvLyBcIlJVXCIsXCJSV1wiLFwiU0FcIixcIlNCXCIsXCJTQ1wiLFwiU0RcIixcIlNFXCIsXCJTR1wiLFwiU0hcIixcIlNJXCIsXG4gICAgICAgICAgICAvLyBcIlNKXCIsXCJTS1wiLFwiU0xcIixcIlNNXCIsXCJTTlwiLFwiU09cIixcIlNSXCIsXCJTVFwiLFwiU1ZcIixcIlNZXCIsXG4gICAgICAgICAgICAvLyBcIlNaXCIsXCJUQ1wiLFwiVERcIixcIlRHXCIsXCJUSFwiLFwiVEpcIixcIlRMXCIsXCJUTlwiLFwiVE9cIixcIlRSXCIsXG4gICAgICAgICAgICAvLyBcIlRUXCIsXCJUVlwiLFwiVFdcIixcIlRaXCIsXCJVQVwiLFwiVUdcIixcIlVNXCIsXCJVU1wiLFwiVVlcIixcIlVaXCIsXG4gICAgICAgICAgICAvLyBcIlZDXCIsXCJWRVwiLFwiVkdcIixcIlZJXCIsXCJWTlwiLFwiVlVcIixcIldGXCIsXCJXU1wiLFwiWUVcIixcIllUXCIsXG4gICAgICAgICAgICAvLyBcIlpBXCIsXCJaTVwiLFwiWldcIlxuICAgICAgICAgICAgLy8gXSxcbiAgICAgICAgICAgIGNvdW50cnlMaXN0LFxuICAgICAgICAgICAgc3RhdGVzTWFwcGluZyA9IHtcbiAgICAgICAgICAgICAgICBcIlVTXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJBQVwiLFwiQUVcIixcIkFMXCIsXCJBUFwiLFwiQUtcIixcbiAgICAgICAgICAgICAgICAgICAgXCJBWlwiLFwiQVJcIixcIkNBXCIsXCJDT1wiLFwiQ1RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJEQ1wiLFwiREVcIixcIkZMXCIsXCJHQVwiLFwiSElcIixcbiAgICAgICAgICAgICAgICAgICAgXCJJRFwiLFwiSUxcIixcIklOXCIsXCJJQVwiLFwiS1NcIixcbiAgICAgICAgICAgICAgICAgICAgXCJLWVwiLFwiTEFcIixcIk1FXCIsXCJNRFwiLFwiTUFcIixcbiAgICAgICAgICAgICAgICAgICAgXCJNSVwiLFwiTU5cIixcIk1TXCIsXCJNT1wiLFwiTVRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJORVwiLFwiTlZcIixcIk5IXCIsXCJOSlwiLFwiTk1cIixcbiAgICAgICAgICAgICAgICAgICAgXCJOWVwiLFwiTkNcIixcIk5EXCIsXCJPSFwiLFwiT0tcIixcbiAgICAgICAgICAgICAgICAgICAgXCJPUlwiLFwiUEFcIixcIlJJXCIsXCJTQ1wiLFwiU0RcIixcbiAgICAgICAgICAgICAgICAgICAgXCJUTlwiLFwiVFhcIixcIlVUXCIsXCJWVFwiLFwiVkFcIixcbiAgICAgICAgICAgICAgICAgICAgXCJXQVwiLFwiV1ZcIixcIldJXCIsXCJXWVwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcIkNBXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJBQlwiLFwiQkNcIixcIk1CXCIsXCJOQlwiLFwiTkZcIixcbiAgICAgICAgICAgICAgICAgICAgXCJOTFwiLFwiTlNcIixcIk5UXCIsXCJOVVwiLFwiT05cIixcbiAgICAgICAgICAgICAgICAgICAgXCJQRVwiLFwiUUNcIixcIlNLXCIsXCJZVFwiXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBcIkFVXCI6IFtcbiAgICAgICAgICAgICAgICAgICAgXCJBQ1RcIixcIk5TV1wiLFwiTlRcIixcIk5aXCIsXCJRTERcIixcbiAgICAgICAgICAgICAgICAgICAgXCJTQVwiLFwiVEFTXCIsXCJWSUNcIixcIldBXCJcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdGVzUHJvbWlzZSxcbiAgICAgICAgICAgIHN0YXRlc0tleXMsXG4gICAgICAgICAgICBjb3VudHJ5S2V5LFxuICAgICAgICAgICAgc3RhdGVzTGlzdHM7XG5cbiAgICAgICAgLy8gdmFyIHN0cmluZ1ByZWZpeCA9ICdjb3VudHJ5Lic7IC8vIHRoaXMgaXMgdGhlIHByZWZpeCB3ZSBuZWVkIHRvIHBhc3MgdG8gJHRyYW5zbGF0ZSB0byBnZXQgdGhlIGNvdW50cnkgbmFtZXMgcHJvcGVybHlcbiAgICAgICAgLy8gZm9yICh2YXIgYz0wOyBjIDwgY291bnRyaWVzLmxlbmd0aDsgYysrKSB7XG4gICAgICAgIC8vICAgICBjb3VudHJpZXNbY10gPSBzdHJpbmdQcmVmaXggKyBjb3VudHJpZXNbY107XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gY291bnRyaWVzUHJvbWlzZSA9XG4gICAgICAgIC8vICAgICAkdHJhbnNsYXRlKGNvdW50cmllcylcbiAgICAgICAgLy8gICAgICAgICAudGhlbihmdW5jdGlvbih0cmFuc2xhdGlvbnMpIHtcbiAgICAgICAgLy8gICAgICAgICAgICAgdmFyIGtleTtcbiAgICAgICAgLy8gICAgICAgICAgICAgY291bnRyeUxpc3QgPSBbXTtcbiAgICAgICAgLy8gICAgICAgICAgICAgZm9yIChrZXkgaW4gdHJhbnNsYXRpb25zKSB7XG4gICAgICAgIC8vICAgICAgICAgICAgICAgICBjb3VudHJ5TGlzdC5wdXNoKHtcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgICAgICAnYWJicic6IGtleS5zdWJzdHIoa2V5Lmxhc3RJbmRleE9mKCcuJykrMSksXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJyA6IHRyYW5zbGF0aW9uc1trZXldXG4gICAgICAgIC8vICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgLy8gICAgICAgICAgICAgfVxuICAgICAgICAvLyAgICAgICAgIH0pXG4gICAgICAgIC8vICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKCl7XG4gICAgICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NoYXJlZERhdGFTZXJ2aWNlIGNhbm5vdCBmaW5kIGNvdW50cnkgc3RyaW5ncyBpbiBsb2NhbGVfZW4uanNvbicpO1xuICAgICAgICAvLyAgICAgICAgIH0pO1xuICAgICAgICBzdHJpbmdQcmVmaXggPSAnc3RhdGVzLic7XG4gICAgICAgIHN0YXRlc0tleXMgPSBbXTtcbiAgICAgICAgZnVuY3Rpb24gY3JlYXRlS2V5KGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHN0YXRlc0tleXMucHVzaChjb3VudHJ5S2V5ICsgZWxlbWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChrZXkgaW4gc3RhdGVzTWFwcGluZykge1xuICAgICAgICAgICAgY291bnRyeUtleSA9IHN0cmluZ1ByZWZpeCArIGtleSArICcuJztcbiAgICAgICAgICAgIHN0YXRlc01hcHBpbmdba2V5XS5mb3JFYWNoKGNyZWF0ZUtleSk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGVzUHJvbWlzZSA9ICR0cmFuc2xhdGUoc3RhdGVzS2V5cylcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHRyYW5zbGF0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBsYXN0RG90LFxuICAgICAgICAgICAgICAgICAgICBjb3VudHJ5Q29kZTtcbiAgICAgICAgICAgICAgICBzdGF0ZXNMaXN0cyA9IFtdO1xuICAgICAgICAgICAgICAgIGZvciAoa2V5IGluIHRyYW5zbGF0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBsYXN0RG90ID0ga2V5Lmxhc3RJbmRleE9mKCcuJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvdW50cnlDb2RlID0ga2V5LnN1YnN0cihsYXN0RG90LTIsIDIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0YXRlc0xpc3RzW2NvdW50cnlDb2RlXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGVzTGlzdHNbY291bnRyeUNvZGVdID0gW107XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc3RhdGVzTGlzdHNbY291bnRyeUNvZGVdLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAgICAgYWJicjoga2V5LnN1YnN0cihsYXN0RG90ICsgMSksXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogdHJhbnNsYXRpb25zW2tleV1cbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgdmFyIGFpcnBvcnRzID0ge307XG5cbiAgICAgICAgdmFyIHNoYXJlZERhdGFTZXJ2aWNlID0ge1xuICAgICAgICAgICAgY291bnRyaWVzOiBbIFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJBRFwiLCBcIm5hbWVcIjogXCJBbmRvcnJhXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJBRVwiLCBcIm5hbWVcIjogXCJVbml0ZWQgQXJhYiBFbWlyYXRlc1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQUdcIiwgXCJuYW1lXCI6IFwiQU5USUdVQSBBTkQgQkFSQlVEQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQUlcIiwgXCJuYW1lXCI6IFwiQU5HVUlMTEFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkFNXCIsIFwibmFtZVwiOiBcIkFSTUVOSUFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkFOXCIsIFwibmFtZVwiOiBcIk5FVEhFUkxBTkRTIEFOVElMTEVTXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJBT1wiLCBcIm5hbWVcIjogXCJBTkdPTEFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkFSXCIsIFwibmFtZVwiOiBcIkFyZ2VudGluYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQVNcIiwgXCJuYW1lXCI6IFwiQU1FUklDQU4gU0FNT0FcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkFUXCIsIFwibmFtZVwiOiBcIkF1c3RyaWFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkFVXCIsIFwibmFtZVwiOiBcIkF1c3RyYWxpYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQVdcIiwgXCJuYW1lXCI6IFwiQXJ1YmFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkFaXCIsIFwibmFtZVwiOiBcIkFaRVJCQUlKQU5cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkJBXCIsIFwibmFtZVwiOiBcIkJPU05JQSBIRVJaRUdPVklOQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQkJcIiwgXCJuYW1lXCI6IFwiQmFyYmFkb3NcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkJEXCIsIFwibmFtZVwiOiBcIkJBTkdMQURFU0hcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkJFXCIsIFwibmFtZVwiOiBcIkJlbGdpdW1cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkJGXCIsIFwibmFtZVwiOiBcIkJVUktJTkEgRkFTT1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQkdcIiwgXCJuYW1lXCI6IFwiQnVsZ2FyaWFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkJIXCIsIFwibmFtZVwiOiBcIkJhaHJhaW5cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkJJXCIsIFwibmFtZVwiOiBcIkJVUlVORElcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkJKXCIsIFwibmFtZVwiOiBcIkJFTklOXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJCTVwiLCBcIm5hbWVcIjogXCJCZXJtdWRhXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJCTlwiLCBcIm5hbWVcIjogXCJCUlVORUkgREFSVVNTQUxBTVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQk9cIiwgXCJuYW1lXCI6IFwiQm9saXZpYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQlJcIiwgXCJuYW1lXCI6IFwiQnJhemlsXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJCU1wiLCBcIm5hbWVcIjogXCJCYWhhbWFzXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJCVFwiLCBcIm5hbWVcIjogXCJCSFVUQU5cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkJXXCIsIFwibmFtZVwiOiBcIkJPVFNXQU5BXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJCWVwiLCBcIm5hbWVcIjogXCJCRUxBUlVTXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJCWlwiLCBcIm5hbWVcIjogXCJCZWxpemVcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkNBXCIsIFwibmFtZVwiOiBcIkNhbmFkYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQ0NcIiwgXCJuYW1lXCI6IFwiQ09DT1MgKEtFRUxJTkcpIElTTEFORFNcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkNEXCIsIFwibmFtZVwiOiBcIkRFTU9DUkFUSUMgUkVQVUJMSUMgT0YgQ09OR09cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkNGXCIsIFwibmFtZVwiOiBcIkNFTlRSQUwgQUZSSUNBIFJFUFwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQ0dcIiwgXCJuYW1lXCI6IFwiQ09OR09cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkNIXCIsIFwibmFtZVwiOiBcIlN3aXR6ZXJsYW5kXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJDSVwiLCBcIm5hbWVcIjogXCJDT1RFIEQgSVZPSVJFXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJDS1wiLCBcIm5hbWVcIjogXCJDT09LIElTTEFORFNcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkNMXCIsIFwibmFtZVwiOiBcIkNoaWxlXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJDTVwiLCBcIm5hbWVcIjogXCJDQU1FUk9PTlwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQ05cIiwgXCJuYW1lXCI6IFwiQ2hpbmFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkNPXCIsIFwibmFtZVwiOiBcIkNvbG9tYmlhXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJDUlwiLCBcIm5hbWVcIjogXCJDT1NUQSBSSUNBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJDVVwiLCBcIm5hbWVcIjogXCJDVUJBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJDVlwiLCBcIm5hbWVcIjogXCJDQVBFIFZFUkRFXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJDWFwiLCBcIm5hbWVcIjogXCJDSFJJU1RNQVMgSVNcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkNZXCIsIFwibmFtZVwiOiBcIkN5cHJ1c1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiQ1pcIiwgXCJuYW1lXCI6IFwiQ3plY2ggUmVwdWJsaWNcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkRFXCIsIFwibmFtZVwiOiBcIkdlcm1hbnlcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkRKXCIsIFwibmFtZVwiOiBcIkRKSUJPVVRJXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJES1wiLCBcIm5hbWVcIjogXCJEZW5tYXJrXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJETVwiLCBcIm5hbWVcIjogXCJET01JTklDQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiRE9cIiwgXCJuYW1lXCI6IFwiRG9taW5pY2FuIFJlcHVibGljXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJEWlwiLCBcIm5hbWVcIjogXCJBTEdFUklBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJFQ1wiLCBcIm5hbWVcIjogXCJFY3VhZG9yXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJFRVwiLCBcIm5hbWVcIjogXCJFc3RvbmlhXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJFR1wiLCBcIm5hbWVcIjogXCJFZ3lwdFwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiRUhcIiwgXCJuYW1lXCI6IFwiV0VTVEVSTiBTQUhBUkFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkVSXCIsIFwibmFtZVwiOiBcIkVSSVRSRUFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkVTXCIsIFwibmFtZVwiOiBcIlNwYWluXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJFVFwiLCBcIm5hbWVcIjogXCJFVEhJT1BJQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiRklcIiwgXCJuYW1lXCI6IFwiRmlubGFuZFwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiRkpcIiwgXCJuYW1lXCI6IFwiRklKSVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiRktcIiwgXCJuYW1lXCI6IFwiRkFMS0xBTkQgSVNMQU5EU1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiRk1cIiwgXCJuYW1lXCI6IFwiTUlDUk9ORVNJQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiRk9cIiwgXCJuYW1lXCI6IFwiRkFST0UgSVNMQU5EU1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiRlJcIiwgXCJuYW1lXCI6IFwiRnJhbmNlXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJGWFwiLCBcIm5hbWVcIjogXCJGcmFuY2VcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkdBXCIsIFwibmFtZVwiOiBcIkdBQk9OXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJHQlwiLCBcIm5hbWVcIjogXCJVbml0ZWQga2luZ2RvbVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiR0RcIiwgXCJuYW1lXCI6IFwiR3JlbmFkYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiR0VcIiwgXCJuYW1lXCI6IFwiR2VvcmdpYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiR0ZcIiwgXCJuYW1lXCI6IFwiRlJFTkNIIEdVSUFOQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiR0dcIiwgXCJuYW1lXCI6IFwiR1VFUk5TRVlcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkdIXCIsIFwibmFtZVwiOiBcIkdIQU5BXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJHSVwiLCBcIm5hbWVcIjogXCJHaWJyYWx0YXJcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkdMXCIsIFwibmFtZVwiOiBcIkdSRUVOTEFORFwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiR01cIiwgXCJuYW1lXCI6IFwiR0FNQklBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJHTlwiLCBcIm5hbWVcIjogXCJHVUlORUFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkdQXCIsIFwibmFtZVwiOiBcIkdVQURFTE9VUEUvU1QgQkFSVEgvU1QgTUFSVElOXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJHUVwiLCBcIm5hbWVcIjogXCJFUVVBVE9SSUFMIEdVSU5FQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiR1JcIiwgXCJuYW1lXCI6IFwiR3JlZWNlXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJHVFwiLCBcIm5hbWVcIjogXCJHdWF0ZW1hbGFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkdVXCIsIFwibmFtZVwiOiBcIkdVQU1cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkdXXCIsIFwibmFtZVwiOiBcIkdVSU5FQSBCSVNTQVVcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkdZXCIsIFwibmFtZVwiOiBcIkdVWUFOQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSEtcIiwgXCJuYW1lXCI6IFwiSG9uZyBLb25nXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJITlwiLCBcIm5hbWVcIjogXCJIb25kdXJhc1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSFJcIiwgXCJuYW1lXCI6IFwiQ3JvYXRpYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSFRcIiwgXCJuYW1lXCI6IFwiSEFJVElcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkhVXCIsIFwibmFtZVwiOiBcIkh1bmdhcnlcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIklEXCIsIFwibmFtZVwiOiBcIkluZG9uZXNpYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSUVcIiwgXCJuYW1lXCI6IFwiSXJlbGFuZFwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSUxcIiwgXCJuYW1lXCI6IFwiSXNyYWVsXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJJTVwiLCBcIm5hbWVcIjogXCJJU0xFIE9GIE1BTlwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSU5cIiwgXCJuYW1lXCI6IFwiSW5kaWEvQW5kYW1hbiBJUy5cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIklPXCIsIFwibmFtZVwiOiBcIkJSSVRJU0ggSU5ESUFOIE9DRUFOIFRFUlJJVE9SWVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSVFcIiwgXCJuYW1lXCI6IFwiSXJhcVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSVJcIiwgXCJuYW1lXCI6IFwiSXJhblwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSVNcIiwgXCJuYW1lXCI6IFwiSWNlbGFuZFwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSVRcIiwgXCJuYW1lXCI6IFwiSXRhbHlcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkpFXCIsIFwibmFtZVwiOiBcIkpFUlNFWVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSk1cIiwgXCJuYW1lXCI6IFwiSmFtYWljYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiSk9cIiwgXCJuYW1lXCI6IFwiSk9SREFOXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJKUFwiLCBcIm5hbWVcIjogXCJKYXBhblwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiS0VcIiwgXCJuYW1lXCI6IFwiS0VOWUFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIktHXCIsIFwibmFtZVwiOiBcIktSWUdZU1RBTlwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiS0hcIiwgXCJuYW1lXCI6IFwiQ0FNQk9ESUFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIktJXCIsIFwibmFtZVwiOiBcIktJUklCQVRJXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJLTVwiLCBcIm5hbWVcIjogXCJDT01PUk9TXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJLTlwiLCBcIm5hbWVcIjogXCJTdCBLaXR0cy9OZXZpc1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiS1BcIiwgXCJuYW1lXCI6IFwiS09SRUEgKE5PUlRIKVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiS1JcIiwgXCJuYW1lXCI6IFwiS29yZWEoU291dGgpXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJLV1wiLCBcIm5hbWVcIjogXCJLdXdhaXRcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIktZXCIsIFwibmFtZVwiOiBcIkNheW1hbiBJc2xhbmRzXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJLWlwiLCBcIm5hbWVcIjogXCJLQVpBS0hTVEFOXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJMQVwiLCBcIm5hbWVcIjogXCJMQU9TXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJMQlwiLCBcIm5hbWVcIjogXCJMRUJBTk9OXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJMQ1wiLCBcIm5hbWVcIjogXCJTYWludCBMdWNpYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTElcIiwgXCJuYW1lXCI6IFwiTGljaHRlbnN0ZWluXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJMVFwiLCBcIm5hbWVcIjogXCJMaXRodWFuaWFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIkxLXCIsIFwibmFtZVwiOiBcIlNSSSBMQU5LQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTFJcIiwgXCJuYW1lXCI6IFwiTElCRVJJQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTFNcIiwgXCJuYW1lXCI6IFwiTEVTT1RIT1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTFVcIiwgXCJuYW1lXCI6IFwiTHV4ZW1ib3VyZ1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTFZcIiwgXCJuYW1lXCI6IFwiTGF0dmlhXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJMWVwiLCBcIm5hbWVcIjogXCJMSUJZQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTUFcIiwgXCJuYW1lXCI6IFwiTW9yb2Njb1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTUNcIiwgXCJuYW1lXCI6IFwiTW9uYWNvXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNRFwiLCBcIm5hbWVcIjogXCJNT0xET1ZBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNRVwiLCBcIm5hbWVcIjogXCJNT05URU5FR1JPXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNR1wiLCBcIm5hbWVcIjogXCJNQURBR0FTQ0FSXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNSFwiLCBcIm5hbWVcIjogXCJNQVJTSEFMTCBJU0xBTkRTXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNS1wiLCBcIm5hbWVcIjogXCJNYWNlZG9uaWFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIk1MXCIsIFwibmFtZVwiOiBcIk1BTElcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIk1NXCIsIFwibmFtZVwiOiBcIk1ZQU5NQVIvQlVSTUFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIk1OXCIsIFwibmFtZVwiOiBcIk1PTkdPTElBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNT1wiLCBcIm5hbWVcIjogXCJNQUNBVVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTVBcIiwgXCJuYW1lXCI6IFwiTk9SVEhFUk4gTUFSSUFOQSBJU0xBTkRTXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNUVwiLCBcIm5hbWVcIjogXCJNYXJ0aW5pcXVlXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNUlwiLCBcIm5hbWVcIjogXCJNQVVSSVRBTklBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNU1wiLCBcIm5hbWVcIjogXCJNT05UU0VSUkFUXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNVFwiLCBcIm5hbWVcIjogXCJNYWx0YVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTVVcIiwgXCJuYW1lXCI6IFwiTUFVUklUSVVTXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNVlwiLCBcIm5hbWVcIjogXCJNQUxESVZFU1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTVdcIiwgXCJuYW1lXCI6IFwiTUFMQVdJXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNWFwiLCBcIm5hbWVcIjogXCJNZXhpY29cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIk1ZXCIsIFwibmFtZVwiOiBcIk1hbGF5c2lhXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJNWlwiLCBcIm5hbWVcIjogXCJNT1pBTUJJUVVFXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJOQVwiLCBcIm5hbWVcIjogXCJOQU1JQklBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJOQ1wiLCBcIm5hbWVcIjogXCJORVcgQ0FMRURPTklBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJORVwiLCBcIm5hbWVcIjogXCJOSUdFUlwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTkZcIiwgXCJuYW1lXCI6IFwiTk9SRk9MSyBJU0xBTkRcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIk5HXCIsIFwibmFtZVwiOiBcIk5pZ2VyaWFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIk5JXCIsIFwibmFtZVwiOiBcIk5JQ0FSQUdVQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTkxcIiwgXCJuYW1lXCI6IFwiTmV0aGVybGFuZHNcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIk5PXCIsIFwibmFtZVwiOiBcIk5vcndheVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiTlBcIiwgXCJuYW1lXCI6IFwiTmVwYWxcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIk5SXCIsIFwibmFtZVwiOiBcIk5BVVJVXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJOVVwiLCBcIm5hbWVcIjogXCJOSVVFXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJOWlwiLCBcIm5hbWVcIjogXCJOZXcgWmVhbGFuZFwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiT01cIiwgXCJuYW1lXCI6IFwiT21hblwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiUEFcIiwgXCJuYW1lXCI6IFwiUGFuYW1hXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJQRVwiLCBcIm5hbWVcIjogXCJQZXJ1XCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJQRlwiLCBcIm5hbWVcIjogXCJGUi4gUE9MWU5FU0lBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJQR1wiLCBcIm5hbWVcIjogXCJQQVBVQSBORVcgR1VJTkVBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJQSFwiLCBcIm5hbWVcIjogXCJQaGlsaXBwaW5lc1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiUEtcIiwgXCJuYW1lXCI6IFwiUEFLSVNUQU5cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlBMXCIsIFwibmFtZVwiOiBcIlBvbGFuZFwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiUE1cIiwgXCJuYW1lXCI6IFwiU1QuIFBJRVJSRS9NSVFVRUxPTlwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiUFJcIiwgXCJuYW1lXCI6IFwiUHVlcnRvIFJpY29cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlBTXCIsIFwibmFtZVwiOiBcIlBBTEVTVElOSUFOIFRFUlJJVE9SWVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiUFRcIiwgXCJuYW1lXCI6IFwiUG9ydHVnYWxcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlBXXCIsIFwibmFtZVwiOiBcIlBBTEFVXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJQWVwiLCBcIm5hbWVcIjogXCJQYXJhZ3VheVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiUUFcIiwgXCJuYW1lXCI6IFwiUWF0YXJcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlJFXCIsIFwibmFtZVwiOiBcIlJFVU5JT05cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlJPXCIsIFwibmFtZVwiOiBcIlJvbWFuaWFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlJTXCIsIFwibmFtZVwiOiBcIlNFUkJJQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiUlVcIiwgXCJuYW1lXCI6IFwiUnVzc2lhbiBGZWRlcmF0aW9uXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJSV1wiLCBcIm5hbWVcIjogXCJSV0FOREFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlNBXCIsIFwibmFtZVwiOiBcIlNhdWRpIEFyYWJpYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiU0JcIiwgXCJuYW1lXCI6IFwiU09MT01PTiBJU0xBTkRTXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJTQ1wiLCBcIm5hbWVcIjogXCJTRVlDSEVMTEVTXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJTRFwiLCBcIm5hbWVcIjogXCJTVURBTlwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiU0VcIiwgXCJuYW1lXCI6IFwiU3dlZGVuXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJTR1wiLCBcIm5hbWVcIjogXCJTaW5nYXBvcmVcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlNIXCIsIFwibmFtZVwiOiBcIlNULkhFTEVOQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiU0lcIiwgXCJuYW1lXCI6IFwiU2xvdmVuaWFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlNKXCIsIFwibmFtZVwiOiBcIlNWQUxCQVJEIEFORCBKQU4gTUFZRU4gSVNMQU5EU1wifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiU0tcIiwgXCJuYW1lXCI6IFwiU2xvdmFrIFJlcHVibGljXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJTTFwiLCBcIm5hbWVcIjogXCJTSUVSUkEgTEVPTkVcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlNNXCIsIFwibmFtZVwiOiBcIlNBTiBNQVJJTk9cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlNOXCIsIFwibmFtZVwiOiBcIlNlbmVnYWxcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlNPXCIsIFwibmFtZVwiOiBcIlNPTUFMSUFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlNSXCIsIFwibmFtZVwiOiBcIlNVUklOQU1FIFwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiU1RcIiwgXCJuYW1lXCI6IFwiU0FPIFRPTUUgQU5EIFBSSU5DSVBFXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJTVlwiLCBcIm5hbWVcIjogXCJFbCBTYWx2YWRvclwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiU1lcIiwgXCJuYW1lXCI6IFwiU1lSSUFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlNaXCIsIFwibmFtZVwiOiBcIlNXQVpJTEFORFwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiVENcIiwgXCJuYW1lXCI6IFwiVHVya3MvQ2FpY29zIElzbGFuZHNcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlREXCIsIFwibmFtZVwiOiBcIkNIQURcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlRHXCIsIFwibmFtZVwiOiBcIlRPR09cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlRIXCIsIFwibmFtZVwiOiBcIlRoYWlsYW5kXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJUSlwiLCBcIm5hbWVcIjogXCJUQUpJS0lTVEFOXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJUTFwiLCBcIm5hbWVcIjogXCJUSU1PUi1MRVNURVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiVE5cIiwgXCJuYW1lXCI6IFwiVFVOSVNJQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiVE9cIiwgXCJuYW1lXCI6IFwiVE9OR0FcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlRSXCIsIFwibmFtZVwiOiBcIlR1cmtleVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiVFRcIiwgXCJuYW1lXCI6IFwiVHJpbmlkYWQvVG9iYWdvXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJUVlwiLCBcIm5hbWVcIjogXCJUdXZhbHVcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlRXXCIsIFwibmFtZVwiOiBcIlRBSVdBTlwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiVFpcIiwgXCJuYW1lXCI6IFwiVEFOWkFOSUFcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlVBXCIsIFwibmFtZVwiOiBcIlVrcmFpbmVcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlVHXCIsIFwibmFtZVwiOiBcIlVHQU5EQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiVU1cIiwgXCJuYW1lXCI6IFwiVS5TLiBNSU5PUiBPVVRMWUlORyBJU0xBTkRTXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJVU1wiLCBcIm5hbWVcIjogXCJVbml0ZWQgU3RhdGVzXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJVWVwiLCBcIm5hbWVcIjogXCJVcnVndWF5XCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJVWlwiLCBcIm5hbWVcIjogXCJVWkJFS0lTVEFOXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJWQ1wiLCBcIm5hbWVcIjogXCJTdCBWaW5jZW50L0dyZW5hZGluZXNcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlZFXCIsIFwibmFtZVwiOiBcIlZlbmV6dWVsYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiVkdcIiwgXCJuYW1lXCI6IFwiVmlyZ2luIElTL0JyaXRpc2hcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlZJXCIsIFwibmFtZVwiOiBcIlZpcmdpbiBJc2xhbmRzfSwgVS5TLlwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiVk5cIiwgXCJuYW1lXCI6IFwiVmlldG5hbVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiVlVcIiwgXCJuYW1lXCI6IFwiVkFOVUFUVVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiV0ZcIiwgXCJuYW1lXCI6IFwiV0FMTElTL0ZVTlRVTkEgSVMuXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJXU1wiLCBcIm5hbWVcIjogXCJTQU1PQVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiWUVcIiwgXCJuYW1lXCI6IFwiWUVNRU5cIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIllUXCIsIFwibmFtZVwiOiBcIk1BWU9UVEVcIn0sXG4gICAgICAgICAgICAgICAge1wiY29kZVwiOiBcIlpBXCIsIFwibmFtZVwiOiBcIlNvdXRoIEFmcmljYVwifSxcbiAgICAgICAgICAgICAgICB7XCJjb2RlXCI6IFwiWk1cIiwgXCJuYW1lXCI6IFwiWkFNQklBXCJ9LFxuICAgICAgICAgICAgICAgIHtcImNvZGVcIjogXCJaV1wiLCBcIm5hbWVcIjogXCJaSU1CQUJXRVwifVxuICAgICAgICAgICAgXSxcblxuICAgICAgICAgICAgLy8gc2V0Q291bnRyeU9mTG9jYWxlOiBmdW5jdGlvbiggY291bnRyeUNvZGUgKSB7XG4gICAgICAgICAgICAvLyAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgdGhpcy5jb3VudHJpZXMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmICggdGhpcy5jb3VudHJpZXNbIGkgXS5jb2RlID09PSBjb3VudHJ5Q29kZSApIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHZhciBjb3VudHJ5T2ZMb2NhbGUgPSBhbmd1bGFyLmNvcHkoY291bnRyaWVzWyBpIF0pO1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgdGhpcy5jb3VudHJpZXMgPSB0aGlzLmNvdW50cmllcy5zcGxpY2UoIGksIDEgKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHRoaXMuY291bnRyaWVzLnVuc2hpZnQoIGNvdW50cnlPZkxvY2FsZSApO1xuICAgICAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgc2V0Q291bnRyeUxpc3Q6IGZ1bmN0aW9uKGNvdW50cmllcykge1xuICAgICAgICAgICAgICAgIHRoaXMuY291bnRyaWVzID0gY291bnRyaWVzO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0Q291bnRyaWVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5jb3VudHJpZXM7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBjb3VudHJpZXNQcm9taXNlOiBjb3VudHJpZXNQcm9taXNlLFxuXG4gICAgICAgICAgICBzZXRBaXJwb3J0Q2l0aWVzOiBmdW5jdGlvbihuZXdBaXJwb3J0cykge1xuICAgICAgICAgICAgICAgIGFpcnBvcnRzID0gbmV3QWlycG9ydHMgfHwgYWlycG9ydHM7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gR290IHRoZXNlIGZyb206IGh0dHA6Ly9oYWxkZXZjbXMwMS5ocS5oYWx3LmNvbToxMDU4MC9oYWwtZHNzZi1zZXJ2ZXIvcmVzdC90cmF2ZWxQbGFubmluZy92MS4wLjAvYWlySG9tZUNpdHlMaXN0L2NvbXBhbnlDb2RlL0hBTC9jb3VudHJ5Q29kZS9VUy9cbiAgICAgICAgICAgIC8vIGh0dHA6Ly9oYWxwamlyYTAxOjgwOTAvY29uZmx1ZW5jZS9wYWdlcy92aWV3cGFnZS5hY3Rpb24/cGFnZUlkPTMxMzYwNDQ3XG5cbiAgICAgICAgICAgIGdldEFpcnBvcnRDaXRpZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG4gICAgICAgICAgICAgICAgR2V0Q29weVNlcnZpY2UuYWlycG9ydENpdGllc0V4Y2x1c2lvbnMoKS50aGVuKCBmdW5jdGlvbiAoZXhjbHVkZWRDb2Rlcykge1xuICAgICAgICAgICAgICAgICAgICB0cmF2ZWxCYXNlVXJsLmdldCgpLnRoZW4oIGZ1bmN0aW9uICggYWlyQ2l0aWVzICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJldHVybkFycmF5ID0gYWlyQ2l0aWVzLmZpbHRlciggZnVuY3Rpb24gKCBjaXR5ICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggZXhjbHVkZWRDb2Rlcy5pbmRleE9mKGNpdHkua2V5KSA+IC0xICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoIHJldHVybkFycmF5ICk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBwcmlvckNydWlzZUxpbmVzIDogW1xuICAgICAgICAgICAgICAgIC8vIFRPRE86IHZhbHVlIHNob3VsZCBiZSByZXBsYWNlZCBieSB0aGUgdmFsdWUgcmVxdWlyZWQgaW4gdGhlIGRhdGFiYXNlXG4gICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImxhYmVsXCI6IFwiQ2Fybml2YWxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCIxXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJsYWJlbFwiOiBcIkNlbGVicml0eVwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIjJcIlxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcImxhYmVsXCI6IFwiQ29zdGFcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCIzXCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJsYWJlbFwiOiBcIkNyeXN0YWxcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCI0XCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJsYWJlbFwiOiBcIkN1bmFyZFwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIjVcIlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGFiZWxcIjogXCJOb3J3ZWdpYW5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCI2XCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJsYWJlbFwiOiBcIlByaW5jZXNzXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiN1wiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGFiZWxcIjogXCJSb3lhbCBDYXJpYmJlYW5cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidmFsdWVcIjogXCI4XCJcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgXCJsYWJlbFwiOiBcIlNlYWJvdXJuXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBcInZhbHVlXCI6IFwiOVwiXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibGFiZWxcIjogXCJXaW5kc3RhclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ2YWx1ZVwiOiBcIjEwXCJcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIF1cbiAgICAgICAgICAgIF0sXG5cbiAgICAgICAgICAgIC8vIGdldENvdW50cmllczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyAgICAgcmV0dXJuICRodHRwLmdldCgnLi9hc3NldHMvY291bnRyaWVzLmpzb24nKVxuICAgICAgICAgICAgLy8gICAgICAgICAudGhlbihmdW5jdGlvbihyZXMpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfSlcbiAgICAgICAgICAgIC8vICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uKHN0YXR1cykge1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgY29uc29sZS5sb2coc3RhdHVzKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyB9LFxuICAgICAgICAgICAgLy8gZ2V0Q291bnRyaWVzRm9ybWF0dGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyAgICAgdmFyIGRlZmVyID0gJHEuZGVmZXIoKSxcbiAgICAgICAgICAgIC8vICAgICAgICAgY291bnRyaWVzO1xuICAgICAgICAgICAgLy8gICAgIHRoaXMuZ2V0Q291bnRyaWVzKClcbiAgICAgICAgICAgIC8vICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBjb3VudHJpZXMgPSByZXN1bHQuY291bnRyaWVzLm1hcCggZnVuY3Rpb24gKG9iaikge1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgIHZhciBjb2RlID0gT2JqZWN0LmtleXMob2JqKVswXSxcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgICAgICAgY291bnRyeSA9IG9ialtjb2RlXTtcblxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgICAgIHJldHVybiB7IGNvZGU6IGNvZGUsIGxhYmVsOiBjb3VudHJ5IH07XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgZGVmZXIucmVzb2x2ZSggY291bnRyaWVzICk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH0pXG4gICAgICAgICAgICAvLyAgICAgICAgIC5jYXRjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1NoYXJlZERhdGFTZXJ2aWNlLmNvdW50cmllcyByZXF1ZXN0IGZhaWxlZCcpO1xuICAgICAgICAgICAgLy8gICAgICAgICB9KTtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gZGVmZXIucHJvbWlzZTtcbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHN0YXRlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBkZnIgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlc0xpc3RzKSB7XG4gICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGZyLnJlc29sdmUoc3RhdGVzTGlzdHMpO1xuICAgICAgICAgICAgICAgICAgICB9LDApO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICRxLmFsbChbc3RhdGVzUHJvbWlzZV0pXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihvYmopIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZnIucmVzb2x2ZShzdGF0ZXNMaXN0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRmci5wcm9taXNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFJlbGF0aW9uc2hpcHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiQXVudFwiLCBcImNvZGVcIjogXCJBVU5UXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogXCJCb3lmcmllbmRcIiwgXCJjb2RlXCI6IFwiQk9ZRlJORFwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiQnJvdGhlclwiLCBcImNvZGVcIjogXCJCUk9USEVSXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogXCJCcm90aGVyIEluLUxhd1wiLCBcImNvZGVcIjogXCJCUk9MQVdcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIkNvbW1vbiBMYXdcIiwgXCJjb2RlXCI6IFwiQ09NTkxBV1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiQ291c2luXCIsIFwiY29kZVwiOiBcIkNPVVNJTlwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiRGF1Z2h0ZXJcIiwgXCJjb2RlXCI6IFwiREFVR0hURVJcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIkRhdWdodGVyIEluLUxhd1wiLCBcImNvZGVcIjogXCJEVFJMQVdcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIkZhdGhlclwiLCBcImNvZGVcIjogXCJGQVRIRVJcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIkZhdGhlciBJbi1MYXdcIiwgXCJjb2RlXCI6IFwiRlRIUkxBV1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiRmlhbmNlXCIsIFwiY29kZVwiOiBcIkZJQU5DRVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiRnJpZW5kXCIsIFwiY29kZVwiOiBcIkZSSUVORFwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiR2lybGZyaWVuZFwiLCBcImNvZGVcIjogXCJHSVJMRlJORFwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiR29kZmF0aGVyXCIsIFwiY29kZVwiOiBcIkdPREZUSFJcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIkdvZG1vdGhlclwiLCBcImNvZGVcIjogXCJHT0RNVEhSXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogXCJHcmFuZGZhdGhlclwiLCBcImNvZGVcIjogXCJHUkFORlRIUlwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiR3JhbmRtb3RoZXJcIiwgXCJjb2RlXCI6IFwiR1JBTk1USFJcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIkdyYW5kZGF1Z2h0ZXJcIiwgXCJjb2RlXCI6IFwiR1JBTkRUUlwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiR3JhbmRzb25cIiwgXCJjb2RlXCI6IFwiR1JBTkRTT05cIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIkh1c2JhbmRcIiwgXCJjb2RlXCI6IFwiSFVTQkFORFwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiTGlmZSBQYXJ0bmVyXCIsIFwiY29kZVwiOiBcIkxJRkVQUlRSXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogXCJNb3RoZXJcIiwgXCJjb2RlXCI6IFwiTU9USEVSXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogXCJNb3RoZXIgSW4tTGF3XCIsIFwiY29kZVwiOiBcIk1PTUxBV1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiTmVwaGV3XCIsIFwiY29kZVwiOiBcIk5FUEhFV1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiTmllY2VcIiwgXCJjb2RlXCI6IFwiTklFQ0VcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIlBvd2VyIG9mIEF0dG9ybmV5XCIsIFwiY29kZVwiOiBcIlBXUkFUVFlcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIlNpc3RlclwiLCBcImNvZGVcIjogXCJTSVNURVJcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIlNpc3RlciBJbi1MYXdcIiwgXCJjb2RlXCI6IFwiU0lTTEFXXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogXCJTb25cIiwgXCJjb2RlXCI6IFwiU09OXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogXCJTb24gSW4tTGF3XCIsIFwiY29kZVwiOiBcIlNPTkxBV1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiU3BvdXNlXCIsIFwiY29kZVwiOiBcIlNQT1VTRVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiU3RlcCBSZWxhdGl2ZVwiLCBcImNvZGVcIjogXCJTVEVQUkVMQVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiU3RlcC1Ccm90aGVyXCIsIFwiY29kZVwiOiBcIlNURVBCUk9cIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIlN0ZXBjaGlsZFwiLCBcImNvZGVcIjogXCJTVEVQQ0hEXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogXCJTdGVwLUZhdGhlclwiLCBcImNvZGVcIjogXCJTVEVQRlRIUlwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiU3RlcC1HcmFuZCBGYXRoZXJcIiwgXCJjb2RlXCI6IFwiU1RQR1JORlJcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIlN0ZXAtR3JhbmQgTW90aGVyXCIsIFwiY29kZVwiOiBcIlNUUEdSTk1SXCIgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogXCJTdGVwLU1vdGhlciBcIiwgXCJjb2RlXCI6IFwiU1RFUE1PTVwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiU3RlcC1TaXN0ZXJcIiwgXCJjb2RlXCI6IFwiU1RFUFNJU1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiVW5jbGVcIiwgXCJjb2RlXCI6IFwiVU5DTEVcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIldpZmVcIiwgXCJjb2RlXCI6IFwiV0lGRVwiIH1cbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWVzKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldFNhZmV0eUxhbmd1YWdlczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCksXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcyA9IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogJ0VuZ2xpc2gnLCAgICBcImNvZGVcIjogJ0VOJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiAnRHV0Y2gnLCAgICAgIFwiY29kZVwiOiAnTkwnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6ICdEYW5pc2gnLCAgICAgXCJjb2RlXCI6ICdEQScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogJ0dlcm1hbicsICAgICBcImNvZGVcIjogJ0RFJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiAnU3BhbmlzaCcsICAgIFwiY29kZVwiOiAnRVMnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6ICdGcmVuY2gnLCAgICAgXCJjb2RlXCI6ICdGUicgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogJ0l0YWxpYW4nLCAgICBcImNvZGVcIjogJ0lUJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiAnSGVicmV3JywgICAgIFwiY29kZVwiOiAnSEUnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6ICdKYXBhbmVzZScsICAgXCJjb2RlXCI6ICdKQScgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogJ0tvcmVhbicsICAgICBcImNvZGVcIjogJ0tPJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiAnTm9yd2VnaWFuJywgIFwiY29kZVwiOiAnTk8nIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6ICdQb3J0dWd1ZXNlJywgXCJjb2RlXCI6ICdQVCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgXCJsYWJlbFwiIDogJ1J1c3NpYW4nLCAgICBcImNvZGVcIjogJ1JVJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiAnU3dlZGlzaCcsICAgIFwiY29kZVwiOiAnU1YnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6ICdDaGluZXNlJywgICAgXCJjb2RlXCI6ICdaSCcgfVxuICAgICAgICAgICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSh2YWx1ZXMpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZ2V0RG9jVHlwZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMgPSBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiUGFzc3BvcnRcIiwgICAgICAgICAgICAgICAgICAgXCJjb2RlXCI6IFwiUFwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiUGFzc3BvcnQgQ2FyZFwiLCAgICAgICAgICAgICAgXCJjb2RlXCI6IFwiQ1wiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiRW5oYW5jZWQgRHJpdmVyXFwncyBMaWNlbnNlXCIsIFwiY29kZVwiOiBcIkRcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIkVuaGFuY2VkIE5vbi1Ecml2ZXIgSURcIiwgICAgIFwiY29kZVwiOiBcIkVcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIk5FWFVTIENhcmRcIiwgICAgICAgICAgICAgICAgIFwiY29kZVwiOiBcIk5cIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIlNFTlRSSSBDYXJkXCIsICAgICAgICAgICAgICAgIFwiY29kZVwiOiBcIlNcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIkZhc3QgQ2FyZFwiLCAgICAgICAgICAgICAgICAgIFwiY29kZVwiOiBcIkZcIiB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBcImxhYmVsXCIgOiBcIkJpcnRoIENlcnRpZmljYXRlIChXaXRoIGEgZ292ZXJubWVudC1pc3N1ZWQgcGljdHVyZSBJRClcIiwgXCJjb2RlXCI6IFwiQlwiIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IFwibGFiZWxcIiA6IFwiRXVyb3BlYW4gSUQgQ2FyZFwiLCAgICAgICAgICAgXCJjb2RlXCI6IFwiVVwiIH1cbiAgICAgICAgICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodmFsdWVzKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gJGh0dHAuZ2V0KCAnLi9hc3NldHMvY291bnRyaWVzLmpzb24nIClcbiAgICAgICAgLy8gICAgIC50aGVuKCBmdW5jdGlvbiggcmVzdWx0ICkge1xuICAgICAgICAvLyAgICAgICAgIGNvdW50cmllcyA9IHJlc3VsdC5kYXRhLmNvdW50cmllcy5tYXAoIGZ1bmN0aW9uICggb2JqICkge1xuICAgICAgICAvLyAgICAgICAgICAgICB2YXIgY29kZSA9IE9iamVjdC5rZXlzKCBvYmogKVswXSxcbiAgICAgICAgLy8gICAgICAgICAgICAgICAgIGNvdW50cnkgPSBvYmpbY29kZV07XG5cbiAgICAgICAgLy8gICAgICAgICAgICAgcmV0dXJuIHsgY29kZTogY29kZSwgbGFiZWw6IGNvdW50cnkgfTtcbiAgICAgICAgLy8gICAgICAgICB9KTtcbiAgICAgICAgLy8gICAgICAgICBzaGFyZWREYXRhU2VydmljZS5zZXRDb3VudHJ5TGlzdCggY291bnRyaWVzICk7XG4gICAgICAgIC8vICAgICB9KVxuICAgICAgICAvLyAgICAgLmNhdGNoKCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgICAgICBjb25zb2xlLmVycm9yKCAnU2hhcmVkRGF0YVNlcnZpY2UuY291bnRyaWVzIHJlcXVlc3QgZmFpbGVkJyApO1xuICAgICAgICAvLyAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHNoYXJlZERhdGFTZXJ2aWNlO1xuICAgIH0pO1xuIiwiLypcbiAqIFN0YWxlU2Vzc2lvblNlcnZpY2UuanNcbiAqXG4gKiBDcmVhdGVkOiBXZWRuZXNkYXksIERlY2VtYmVyIDE1LCAyMDE0XG4gKiAoYykgQ29weXJpZ2h0IDIwMTQgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5TdGFsZVNlc3Npb25TZXJ2aWNlXG4gKiBAZGVzY3JpcHRpb24gcmVjZWl2ZXMgYW4gZXZlbnQgZm9yIGh0dHAgc3VjY2VzcyBhbmQgcmVzZXRzIHN0YWxlIHNlc3Npb24gdGltZXJgXG4gKi9cbmFuZ3VsYXJcblxuICAgIC5tb2R1bGUoICdvbGNpLnNlcnZpY2VzLlN0YWxlU2Vzc2lvblNlcnZpY2UnLCBbXG4gICAgICAgICdvbGNpLnNlcnZpY2VzLk1vZGFsU2VydmljZScsXG4gICAgICAgICdvbGNpLmRpcmVjdGl2ZXMubW9kYWxzLnN0YWxlU2Vzc2lvbk1vZGFsJ1xuICAgIF0pXG5cbiAgICAuc2VydmljZSgnU3RhbGVTZXNzaW9uU2VydmljZScsIGZ1bmN0aW9uKCAkcSwgJHN0YXRlLCAkY29va2llcywgJGludGVydmFsLCAkdGltZW91dCwgJHdpbmRvdywgQXV0aFNlcnZpY2UsIE1vZGFsU2VydmljZSwgQ29uZmlndXJhdGlvbiApIHtcblxuICAgICAgICB2YXIgc3RhbGVTZXNzaW9uU2VydmljZSA9IHtcblxuICAgICAgICAgICAgLy8gY29udmVydCBtaW51dGVzIG9mIHRpbWVvdXQgdG8gbXM6ICBtaW4gKiBzZWMvbWluICogbXMvc2VjXG4gICAgICAgICAgICB0aW1lb3V0TXMgOiAxOCAqIDYwICogMTAwMCxcbiAgICAgICAgICAgIC8vIHRpbWVvdXRNcyA6IDEwICogMTAwMCwgLy8gMTBzIGZvciB0ZXN0aW5nLlxuXG4gICAgICAgICAgICBzdGFsZVNlc3Npb25UaW1lciA6IG51bGwsXG5cbiAgICAgICAgICAgIGVuZFNlc3Npb24gOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIExvZ2luU2VydmljZS5sb2dvdXQoKTtcblxuICAgICAgICAgICAgICAgIC8vIEZvbGxvd2luZyBpcyBmcm9tIExvZ2luU2VydmljZS5sb2dvdXRcbiAgICAgICAgICAgICAgICB2YXIgcmVzb2x2ZSA9IEF1dGhTZXJ2aWNlLmxvZ291dCgpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUuZmluYWxseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuaW5pdCgpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc29sdmU7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBjb250aW51ZVNlc3Npb24gOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICB2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xuXG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UucmVjb3ZlclNlc3Npb24oKVxuICAgICAgICAgICAgICAgICAgICAudGhlbihcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHVzZXJEYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFsZVNlc3Npb25TZXJ2aWNlLnJlc2V0U3RhbGVTZXNzaW9uVGltZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUodXNlckRhdGEpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNhbGxTdGFsZVNlc3Npb25Nb2RhbCA6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgIGlmICgkc3RhdGUuY3VycmVudC5uYW1lID09ICdsb2dpbicpIHtcbiAgICAgICAgICAgICAgICAgICAgc3RhbGVTZXNzaW9uU2VydmljZS5yZXNldFN0YWxlU2Vzc2lvblRpbWVyKCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyB0aGVyZSBtYXkgYmUgYSBtb2RhbCBhbHJlYWR5IG9wZW5cbiAgICAgICAgICAgICAgICBNb2RhbFNlcnZpY2UuY2xvc2VNb2RhbCgpO1xuXG4gICAgICAgICAgICAgICAgc3RhbGVTZXNzaW9uU2VydmljZS5tb2RhbEluc3RhbmNlID0gTW9kYWxTZXJ2aWNlLm9wZW5Nb2RhbCh7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9tb2RhbHMvc3RhbGVTZXNzaW9uTW9kYWwvc3RhbGVTZXNzaW9uTW9kYWwudHBsLmh0bWwnLFxuICAgICAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnc3RhbGVTZXNzaW9uTW9kYWxDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Q2xhc3M6ICdzdGFsZS1zZXNzaW9uLW1vZGFsJyxcbiAgICAgICAgICAgICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgICAgICAgICAgICBrZXlib2FyZDogZmFsc2VcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVzZXRTdGFsZVNlc3Npb25UaW1lciA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkaW50ZXJ2YWwuY2FuY2VsKHN0YWxlU2Vzc2lvblNlcnZpY2Uuc3RhbGVTZXNzaW9uVGltZXIpO1xuICAgICAgICAgICAgICAgIHN0YWxlU2Vzc2lvblNlcnZpY2Uuc3RhbGVTZXNzaW9uVGltZXIgPSAkaW50ZXJ2YWwoc3RhbGVTZXNzaW9uU2VydmljZS5jYWxsU3RhbGVTZXNzaW9uTW9kYWwsIHN0YWxlU2Vzc2lvblNlcnZpY2UudGltZW91dE1zLCAxKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBzdGFsZVNlc3Npb25TZXJ2aWNlO1xuICAgIH0pO1xuXG5cbiIsIi8qXG4gKiBTdG9yYWdlU2VydmljZS5qc1xuICpcbiAqIENyZWF0ZWQ6IFR1ZXNkYXksIE1hcmNoIDE3LCAyMDE1XG4gKiAoYykgQ29weXJpZ2h0IDIwMTUgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBjb21tb24uc2VydmljZXMuU3RvcmFnZVNlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBXcmFwcGVyIG9uIHRvcCBvZiBsb2NhbFN0b3JhZ2Ugb3Igc2Vzc2lvblN0b3JhZ2UuXG4gKlxuICovXG5hbmd1bGFyLm1vZHVsZSgnb2xjaS5zZXJ2aWNlcy5TdG9yYWdlU2VydmljZScsIFtdKVxuICAgIC5zZXJ2aWNlKCdTdG9yYWdlU2VydmljZScsIGZ1bmN0aW9uICgpe1xuICAgICAgICB2YXIgc3RvcmFnZVNlcnZpY2UgPSB7XG4gICAgICAgICAgICB0eXBlOiBcImxvY2FsU3RvcmFnZVwiLFxuICAgICAgICAgICAgc2V0SXRlbTogZnVuY3Rpb24gc2V0SXRlbShrZXksIHZhbHVlKXtcbiAgICAgICAgICAgICAgICBpZighd2luZG93LmxvY2FsU3RvcmFnZSB8fCAhd2luZG93LnNlc3Npb25TdG9yYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJFQUxMWV9PTERfQlJPV1NFUlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oIGtleSwgdmFsdWUgKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHsgLy90aGlzIHNob3VsZCBhbHdheXMgd29ya1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmFnZS50eXBlID0gXCJzZXNzaW9uU3RvcmFnZVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgga2V5LCB2YWx1ZSApO1xuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoKHNlc3NFcnIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9wZXJoYXBzIHVzZSBjb29raWVzIGluIHRoZSBmdXR1cmU/XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBzZXNzRXJyO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGdldEl0ZW06IGZ1bmN0aW9uIGdldEl0ZW0oa2V5KXtcbiAgICAgICAgICAgICAgICByZXR1cm4gd2luZG93W3N0b3JhZ2VTZXJ2aWNlLnR5cGVdLmdldEl0ZW0oa2V5KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICByZW1vdmVJdGVtOiBmdW5jdGlvbiByZW1vdmVJdGVtKGtleSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdpbmRvd1tzdG9yYWdlU2VydmljZS50eXBlXS5yZW1vdmVJdGVtKGtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBzdG9yYWdlU2VydmljZTtcbiAgICB9KTsiLCIvKlxuICogVGltZVV0aWxzU2VydmljZS5qc1xuICpcbiAqIENyZWF0ZWQ6IFdlZG5lc2RheSwgRmVicnVhcnkgMTIsIDIwMTRcbiAqIChjKSBDb3B5cmlnaHQgMjAxNCBIb2xsYW5kIEFtZXJpY2EsIEluYy4gLSBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiBUaGlzIGlzIHVucHVibGlzaGVkIHByb3ByaWV0YXJ5IHNvdXJjZSBjb2RlIG9mIEhvbGxhbmQgQW1lcmljYSwgSW5jLlxuICogVGhlIGNvcHlyaWdodCBub3RpY2UgYWJvdmUgZG9lcyBub3QgZXZpZGVuY2UgYW55IGFjdHVhbCBvciBpbnRlbmRlZFxuICogcHVibGljYXRpb24gb2Ygc3VjaCBzb3VyY2UgY29kZS5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBvbGNpLnNlcnZpY2VzLlRpbWVVdGlsc1NlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBDYWxjdWxhdGVzIHRyaXAgdGltZTo8YnI+XG4gKiBgZGF5c0xlZnQoKWA8YnI+XG4gKiBgY29udmVydFRvSG91cnNPckRheXMoKWBcbiAqL1xuIGFuZ3VsYXIubW9kdWxlKCAnb2xjaS5zZXJ2aWNlcy5UaW1lVXRpbHNTZXJ2aWNlJywgW1xuXG5cbl0pXG4uc2VydmljZSgnVGltZVV0aWxzU2VydmljZScsIFsgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuVGltZVV0aWxzU2VydmljZSNkYXlzTGVmdFxuICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5UaW1lVXRpbHNTZXJ2aWNlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBjYWxjdWxhdGVzIGRheXMgbGVmdFxuICAgICAgICAgKiBAcGFyYW0ge2RhdGV9IGl0aW5lcmFyeUJlZ2luRGF0ZSBkYXRlIG9iamVjdFxuICAgICAgICAgKiBAcGFyYW0ge2RhdGV9IGN1cnJlbnREYXRlIGRhdGUgb2JqZWN0XG4gICAgICAgICAqIEByZXR1cm5zIHtudW1iZXJ9IG1pbGxpc2Vjb25kcyBvZiB0aW1lIGxlZnRcbiAgICAgICAgICogKi9cbiAgICAgICAgZGF5c0xlZnQ6IGZ1bmN0aW9uKGl0aW5lcmFyeUJlZ2luRGF0ZSwgY3VycmVudERhdGUpIHtcbiAgICAgICAgICAgIGlmICghaXRpbmVyYXJ5QmVnaW5EYXRlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFNldHRpbmcgdGltZSB0byBtaWRuaWdodCwgdG8gY2FsY3VsYXRlIGZ1bGwgZGF5cy5cbiAgICAgICAgICAgIHZhciBkZXBhcnR1cmVEYXRlID0gbmV3IERhdGUoaXRpbmVyYXJ5QmVnaW5EYXRlKS5zZXRIb3VycygwLCAwLCAwLCAwKTtcbiAgICAgICAgICAgIHZhciBsb2NhbERhdGUgPSBuZXcgRGF0ZShjdXJyZW50RGF0ZSkuc2V0SG91cnMoMCwgMCwgMCwgMCk7XG4gICAgICAgICAgICB2YXIgbWlsbGlzZWNvbmRzID0gTWF0aC5tYXgoMCwgZGVwYXJ0dXJlRGF0ZSAtIGxvY2FsRGF0ZSk7XG5cbiAgICAgICAgICAgIC8vRFNUIGNhbiBjYXVzZSB0aGlzIHRvIHJldHVybiAyLjA0IGRheXMgb3IgMS45NiBkYXlzIGlmIHRoZSB0aW1lIHNwYW5zIGEgY2hhbmdlb3ZlciAtSkRNXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChtaWxsaXNlY29uZHMgLyAoMjQgKiA2MCAqIDYwICogMTAwMCkpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICogaG91cnMgc2hvdWxkIGJlIGZvcm1hdHRlZCB0byBvbmUgZGVjaW1hbCBwbGFjZVxuICAgICAgICAgKiB3aGVuIGhvdXJzIGFyZSAuOSBvciBsZXNzIHRoZSBhZmZpeCBvZiBcImhvdXJzXCIgd2lsbCBiZSB1c2VkXG4gICAgICAgICAqIHdoZW4gaG91cnMgaXMgMSB0aGUgYWZmaXggXCJob3VyXCIgd2lsbCBiZSB1c2VkXG4gICAgICAgICAqIHdoZW4gaG91cnMgaXMgaW4gdGhlIHJhbmdlIGZyb20gMS4xIHRvIDIzLjkgdGhlIGFmZml4IFwiaG91cnNcIiB3aWxsIGJlIHVzZWRcbiAgICAgICAgICogaG91cnMgd2lsbCBiZSBjb252ZXJ0ZWQgaW50byBkYXlzIHN0YXJ0aW5nIHdpdGggMjRcbiAgICAgICAgICogZGF5cyB3aWxsIGFsd2F5cyBiZSBsaXN0ZWQgYXMgYSB3aG9sZSBudW1iZXIgd2l0aCBhbnkgZGVjaW1hbCBkcm9wcGVkXG4gICAgICAgICAqIHdoZW4gZGF5cyBpcyAxIHRoZSBhZmZpeCB3aWxsIGJlIFwiZGF5XCJcbiAgICAgICAgICogd2hlbiBkYXlzIGlzIGdyZWF0ZXIgdGhhbiAxIHRoZSBhZmZpeCBcImRheXNcIiB3aWxsIGJlIHVzZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybiB7e2Ftb3VudDogTnVtYmVyLCB1bml0czogJ2hvdXJzJyB8ICdkYXlzJyB9fVxuICAgICAgICAgKi9cblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLlRpbWVVdGlsc1NlcnZpY2UjY29udmVydFRvSG91cnNPckRheXNcbiAgICAgICAgICogQG1ldGhvZE9mIG9sY2kuc2VydmljZXMuVGltZVV0aWxzU2VydmljZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gaG91cnMgc2hvdWxkIGJlIGZvcm1hdHRlZCB0byBvbmUgZGVjaW1hbCBwbGFjZVxuICAgICAgICAgPHByZT5cbiAgICAgICAgICAgICB3aGVuIGhvdXJzIGFyZSAuOSBvciBsZXNzIHRoZSBhZmZpeCBvZiBcImhvdXJzXCIgd2lsbCBiZSB1c2VkXG4gICAgICAgICAgICAgd2hlbiBob3VycyBpcyAxIHRoZSBhZmZpeCBcImhvdXJcIiB3aWxsIGJlIHVzZWRcbiAgICAgICAgICAgICB3aGVuIGhvdXJzIGlzIGluIHRoZSByYW5nZSBmcm9tIDEuMSB0byAyMy45IHRoZSBhZmZpeCBcImhvdXJzXCJcbiAgICAgICAgICAgICAgICB3aWxsIGJlIHVzZWRcbiAgICAgICAgICAgICBob3VycyB3aWxsIGJlIGNvbnZlcnRlZCBpbnRvIGRheXMgc3RhcnRpbmcgd2l0aCAyNFxuICAgICAgICAgICAgIGRheXMgd2lsbCBhbHdheXMgYmUgbGlzdGVkIGFzIGEgd2hvbGUgbnVtYmVyIHdpdGggYW55IGRlY2ltYWwgZHJvcHBlZFxuICAgICAgICAgICAgIHdoZW4gZGF5cyBpcyAxIHRoZSBhZmZpeCB3aWxsIGJlIFwiZGF5XCJcbiAgICAgICAgICAgICB3aGVuIGRheXMgaXMgZ3JlYXRlciB0aGFuIDEgdGhlIGFmZml4IFwiZGF5c1wiIHdpbGwgYmUgdXNlZFxuICAgICAgICAgPC9wcmU+XG4gICAgICAgICAqIEBwYXJhbSB7bnVtYmVyfSBob3VycyBudW1iZXIgb2YgaG91cnNcbiAgICAgICAgICogQHJldHVybnMge09iamVjdH0gcmVzdWx0IG9iamVjdFxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgPHByZT5cbiAgICAgICAgICAgIHt7YW1vdW50OiBOdW1iZXIsIHVuaXRzOiAnaG91cnMnIHwgJ2RheXMnIH19XG4gICAgICAgICA8L3ByZT5cbiAgICAgICAgICogKi9cbiAgICAgICAgY29udmVydFRvSG91cnNPckRheXM6IGZ1bmN0aW9uKGhvdXJzKSB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0O1xuXG4gICAgICAgICAgICBpZiAoaG91cnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHsgYW1vdW50OiAwLCB1bml0czogJ2hvdXJzJywgdHJhbnNsYXRpb246ICdzaG9yZXhMYW5kaW5nLmhvdXJzJ307XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGhvdXJzIDwgMjQpIHtcbiAgICAgICAgICAgICAgICAvLyByb3VuZCBob3VycyB0byBvbmUgZGVjaW1hbCBwbGFjZVxuICAgICAgICAgICAgICAgIHZhciB0ZW50aHMgPSBNYXRoLnJvdW5kKGhvdXJzICogMTAgKSAvIDEwO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IHsgYW1vdW50OiB0ZW50aHMsIHVuaXRzOiAnaG91cnMnLCB0cmFuc2xhdGlvbjogdGVudGhzID09PSAxID8gJ3Nob3JleExhbmRpbmcuaG91cicgOiAnc2hvcmV4TGFuZGluZy5ob3Vycyd9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSB7IGFtb3VudDogTWF0aC5mbG9vcihob3VycyAvIDI0KSArIDEsIHVuaXRzOiAnZGF5cycsIHRyYW5zbGF0aW9uOiAnc2hvcmV4TGFuZGluZy5kYXlzJ307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICB9O1xufV0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ29sY2kuc2VydmljZXMuVHJhbnNmb3JtVXRpbHNTZXJ2aWNlJywgW1xuICAgICduZ1N0b3JhZ2UnLFxuICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nLFxuICAgICd2ZW5kb3Iuc3RlZWxUb2UnXG5dKVxuXG4uZmFjdG9yeSgnVHJhbnNmb3JtVXRpbHNTZXJ2aWNlJywgZnVuY3Rpb24oICRzZXNzaW9uU3RvcmFnZSwgQ29uZmlndXJhdGlvbiwgc3RlZWxUb2UgKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvL2NvcGllcyBwcm9wZXJpZXMgZnJvbSBvbmUgb2JqZWN0IHRvIGFub3RoZXJcbiAgICAgICAgdHJhbnNmb3JtT2JqZWN0OiBmdW5jdGlvbiggcmVhZE9iaiwgd3JpdGVPYmosIHBhdGhzICkge1xuICAgICAgICAgICAgcGF0aHMuZm9yRWFjaChmdW5jdGlvbiggZWwsIGluZGV4LCBhcnJheSApIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVhZEl0ZW0gPSBzdGVlbFRvZS5kbyggcmVhZE9iaiApLmdldCggZWwucmVhZCApO1xuICAgICAgICAgICAgICAgIHN0ZWVsVG9lLmRvKCB3cml0ZU9iaiApLnNldCggZWwud3JpdGUsIHJlYWRJdGVtICk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB0cmFuc2Zvcm1SZXF1ZXN0T2JqZWN0OiBmdW5jdGlvbiggb2JqICkge1xuICAgICAgICAgICAgdmFyIHN0ciA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBvYmopIHtcbiAgICAgICAgICAgICAgICBzdHIucHVzaChlbmNvZGVVUklDb21wb25lbnQocCkgKyBcIj1cIiArIGVuY29kZVVSSUNvbXBvbmVudChvYmpbcF0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXN1bHRzID0gc3RyLmpvaW4oXCImXCIpO1xuICAgICAgICAgICAgY29uc29sZS5sb2cocmVzdWx0cyk7XG4gICAgICAgICAgICByZXR1cm4gc3RyLmpvaW4oXCImXCIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHplcm9QYWQ6IGZ1bmN0aW9uKCBuLCB3aWR0aCwgeiApIHtcbiAgICAgICAgICAgIHogPSB6IHx8ICcwJztcbiAgICAgICAgICAgIHdpZHRoID0gd2lkdGggfHwgMjtcbiAgICAgICAgICAgIG4gPSBuICsgJyc7XG4gICAgICAgICAgICByZXR1cm4gbi5sZW5ndGggPj0gd2lkdGggPyBuIDogbmV3IEFycmF5KCB3aWR0aCAtIG4ubGVuZ3RoICsgMSApLmpvaW4oIHogKSArIG47XG4gICAgICAgIH1cblxuICAgIH07XG4gICAgXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=