(function () {
    'use strict';
})();

angular.module('fh', [
    'ngStorage',
    'cgBusy',
    'ui.router',
    'ui.bootstrap',
    'ui.bootstrap.showErrors',
    'ui.utils',
    'restangular',
    'templates-app',
    'templates-components',
    'ApplicationConfiguration',
    'fh.landing',
    'fh.home',
    'fh.search',
    'fh.findAndEdit',
    'fh.directives.mainHeader',
    'fh.directives.modals.showPdfModal',
    // 'fh.directives.modals',
    'fh.services.FocusService',
    'vendor.steelToe',
    'base64',
    'angular-momentjs'
])

    .config(function($urlRouterProvider, RestangularProvider, Configuration, $uiViewScrollProvider, $httpProvider) {

        RestangularProvider.setBaseUrl('/api');
        RestangularProvider.setDefaultHttpFields({
            withCredentials: true,
            timeout: Configuration.timeoutInMillis,
            cache: true
        });

        $urlRouterProvider.when('', '/landing').otherwise('/landing');

        // scrolls to top of page on state change
        $uiViewScrollProvider.useAnchorScroll();

    })
    .run(function($rootScope, 
        Configuration, 
        $state, 
        $sessionStorage) {

        $rootScope.appName = Configuration.appName;
        $rootScope.companyCode = Configuration.companyCode;


        $state.go('landing');

        //auth check every time the state/page changes
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            // $rootScope.stateChangeAuthCheck(event, toState, toParams, fromState, fromParams);
        });


        //EVENT BANK
        /*
        $rootScope.$on('auth-logout-success', function(event, args) {
        });*/



    })

    .constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

angular.module('fh.findAndEdit', [
  'ui.select',
  'ngStorage'
])

.config(function homeConfig( $stateProvider ) {
  $stateProvider.state('findAndEdit', {
    url: '/findAndEdit',
    views: {
      main: {
        controller: 'FindAndEditController',
        templateUrl: 'findAndEdit/findAndEdit.tpl.html'
      }
    },
    pageTitle: 'Find And Edit',
    resolve: {
      allClasses: function( $http, $sessionStorage ) {
        return $http({
          method: 'GET',
          url: 'api/classes/all',
          headers: {
            jwt: $sessionStorage.jwt
          }
        }).then(function ( res ) {
          return res.data;
        }, function( err ) {
          console.log(err);
        });
      }
    }
  });
})

.controller('FindAndEditController', function( $scope, $http, $sessionStorage, allClasses, $timeout ) {
  var PAPERS_URL                       = '/api/papers';
  $http.defaults.headers.common['jwt'] = $sessionStorage.jwt;
  $scope.query                         = {};
  $scope.editData                      = {};
  $scope.allClasses                    = allClasses;

  $scope.seasons = [
    {name: 'Spring', code: "SP"},
    {name: 'Summer', code: "SU"},
    {name: 'Fall', code: "FA"},
    {name: 'Winter', code: "WI"}
  ];
  $scope.years = [
    {name: '95', code: '95'},
    {name: '96', code: '96'},
    {name: '97', code: '97'},
    {name: '98', code: '98'},
    {name: '99', code: '99'},
    {name: '00', code: '00'},
    {name: '01', code: '01'},
    {name: '02', code: '02'},
    {name: '03', code: '03'},
    {name: '04', code: '04'},
    {name: '05', code: '05'},
    {name: '06', code: '06'},
    {name: '07', code: '07'},
    {name: '08', code: '08'},
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

  $scope.findClasses = function( query ) {
    $http({
      method: 'GET',
      url: PAPERS_URL + '/classAndType/class/' + query.classId //+ '/type/' + query.typeCode
    }).then(function( res ) {
      $scope.papers = res.data;
    }, function( err ) {
      console.log( err );
    });
  };

  $scope.$watch('papers', function() {
    if ( !$scope.papers ) return;
    
    $timeout(function() {
      for ( var i = 0; i < $scope.papers.length; i++ ) {
        renderPdf( $scope.papers[ i ] );
      }
    }, 100);
  });

  function renderPdf( paper ) {
    var canvas = document.getElementById( paper._id );
    var context = canvas.getContext('2d');

    if ( paper ) {
      PDFJS.getDocument( paper.img.data ).then(function( pdf ) {
        pdf.getPage(1).then(function( page ) {

          var scale = .4;
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
  }

  $scope.showEditPanel = function(id) {
    $scope[ 'openEditPanel-' + id ] = !$scope[ 'openEditPanel-' + id ];
  };

  $scope.isEditPanelOpen = function(id) {
    return !!$scope[ 'openEditPanel-' + id ];
  };

  $scope.submitEditedPaper = function( paper, newData ) {
    putObj = {
      title: newData.title,
      period: newData.season + newData.year,
      type: newData.type,
      classId: newData.classId
    };

    paper.success = $http({
      method: 'PUT',
      url: 'api/papers/single/' + paper._id,
      data: putObj
    }).then(function( res ) {
      console.log( res );
      return true;
    }, function( err ) {
      console.error ( err );
      return false;
    });
  };


});
angular.module('fh.home', [
  'ui.select',
  'ngStorage',
  'ngFileUpload',
  'fh.services.FocusService'
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
        }).then(function( res ) {
          return res.data;
        }, function( err ) {
          console.log(err);
        });
      },

      tokens: function( $http ) {
        return $http({
          method: 'GET',
          url: 'assets/tokens.json'
        }).then(function( res ) {
          return res.data;
        }, function( err ) {
          console.log(err);
        });
      }
    }
  });
})

.controller('HomeController', function( $scope, $http, $sessionStorage, $timeout, giveFocus, Upload, allClasses, tokens ) {
  var PAPERS_URL = '/api/papers';
  $http.defaults.headers.common['jwt'] = $sessionStorage.jwt;
  $scope.allClasses = allClasses;

  $scope.$watch('files', function() {
    $scope.upload( $scope.files );
  });

  $scope.$watch('file', function() {
    if ($scope.file != null) {
      $scope.upload([$scope.file]);
    }
  });

  $scope.log          = '';
  $scope.papersToEdit = [];
  $scope.editData     = {};

  $scope.seasons = [
    {name: 'Spring', code: "SP"},
    {name: 'Summer', code: "SU"},
    {name: 'Fall', code: "FA"},
    {name: 'Winter', code: "WI"}
  ];
  $scope.years = [
    {name: '95', code: '95'},
    {name: '96', code: '96'},
    {name: '97', code: '97'},
    {name: '98', code: '98'},
    {name: '99', code: '99'},
    {name: '00', code: '00'},
    {name: '01', code: '01'},
    {name: '02', code: '02'},
    {name: '03', code: '03'},
    {name: '04', code: '04'},
    {name: '05', code: '05'},
    {name: '06', code: '06'},
    {name: '07', code: '07'},
    {name: '08', code: '08'},
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
              ', ID: ' +
              data._id
              '\n' + 
              $scope.log;

            $scope.papersToEdit.push( data );

            giveFocus('season-picker');

          });
        });
      }
    }
  };

  $scope.submitEditedPaper = function( paper, newData ) {
    putObj = {
      title: newData.title,
      period: newData.season + newData.year,
      type: newData.type,
      classId: newData.classId
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

  // re-renders the main canvas upon change
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

  // re-renders the secondary canvas upon change
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
      url: '/api/classes',
      data: postObj
    }).then(function( res ) {

      $http({
        method: 'GET',
        url: '/api/classes/all'
      }).then(function (res ) {
        $scope.allClasses = res.data;
      });

    }, function( err ) {
      console.log( err );
    });
  };

  // $scope.addTokens = function() {
  //   tokens.tokens.forEach( function( token, index, array) {
  //     $http({
  //       method: 'POST',
  //       url: '/api/makeToken',
  //       data: token
  //     }).then(function( res ) {
  //       console.log('yes');
  //     }, function( err ) {
  //       console.log('FFFFFFFFFFUUUUU', err);
  //     });
  //   });
  // };


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
      passwordConfirm: credentials.passwordConfirm,
      token: credentials.addCode
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
      // $scope.registerCredentials = {};
      // $scope.registerSuccess = true;
      $sessionStorage.jwt = data.jwt;
      $state.go('search');
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
        $state.go('search');
      })
      .error(function(err) {
        console.dir(err);
      });
  };

});
angular.module('fh.search', [
  'ui.select',
  'ngStorage'
])

.config(function searchConfig($stateProvider) {
  $stateProvider.state('search', {
    url: '/search',
    views: {
      main: {
        controller: 'SearchController',
        templateUrl: 'search/search.tpl.html'
      }
    },
    pageTitle: 'Search',
    resolve: {
      allClasses: function( $http, $sessionStorage ) {
        return $http({
          method: 'GET',
          url: 'api/classes/all',
          headers: {
            jwt: $sessionStorage.jwt
          }
        }).then(function( res ) {
          return res.data;
        }, function( err ) {
          console.log(err);
        });
      }
    }
  });
})

.controller('SearchController', function( $scope, $http, $sessionStorage, allClasses, $timeout ) {
  $scope.allClasses = allClasses;
  $scope.query = {};
  var PAPERS_URL = '/api/papers';

  $scope.findPapersByClass = function(query) {
    $http({
      method: 'GET',
      url: PAPERS_URL + '/class/' + query.classId
    }).then(function( res ) {
      $scope.papers = res.data;
    }, function( err ) {
      console.log( err );
    });
  };

  $scope.findImage = function( paperId ) {
    $http({
      method: 'GET',
      url: PAPERS_URL + '/single/' + paperId
    }).then(function( res ) {
      $scope.paper = res.data;
    }, function( err ) {
      console.log( err );
    });
  };

  $scope.$watch('paper', function() {
    if ( !$scope.paper ) return;
    
    $timeout(function() {
      renderPdf( $scope.paper );
    }, 100);
  });

  function renderPdf( paper ) {
    var canvas = document.getElementById( 'display-paper' );
    var context = canvas.getContext('2d');

    if ( paper ) {
      PDFJS.getDocument( paper.img.data ).then(function( pdf ) {
        pdf.getPage(1).then(function( page ) {

          var scale = 1;
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
  }
});
angular.module('fh.directives.mainHeader', [
    'ngStorage',
    'ApplicationConfiguration'
])

.directive('mainHeader', function() {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'directives/mainHeader/mainHeader.tpl.html',
        controller: function( $scope, $state ) {
        }
    };
});
angular.module('fh.directives.modals.showPdfModal', [
  'ui.bootstrap',
  'fh.services.ModalService'
])

.directive('showPdfModal', function( ModalService ) {
  return {
    restrict: 'AE',
    link: function(scope, element, attrs) {
      element.on('click', function() {
        ModalService.openModal({
          templateUrl: 'directives/modals/showPdfModal/showPdfModal.tpl.html',
          controller: 'ShowPdfModalController',
          windowClass: 'show-pdf-modal',
          backdrop: 'static',
          keyboard: false,
          resolve: {
            paper: function() {
              return scope.paper;
            }
          }
        });
      });
    }
  };
})

.controller('ShowPdfModalController', function($scope, $timeout, ModalService, paper) {
  $scope.close = function() {
    ModalService.closeModal();
  };
  $scope.modalId = paper._id + 'modal';
  $scope.paper = paper

  $timeout(function() {
    var canvas = document.getElementById(paper._id + 'modal');
    var context = canvas.getContext('2d');

    if ( paper ) {
      PDFJS.getDocument( paper.img.data ).then(function( pdf ) {
        pdf.getPage(1).then(function( page ) {

          var scale = 1;
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
  }, 50);
    
});


/**
 * @ngdoc service
 * @name olci.services.FindImageService
 * @description Service that finds and returns a promise for image src strings.
 */
angular.module('fh.services.FindImageService', [
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
            var imageUrl = './assets/images/headerImage.jpg';
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


angular.module('fh.services.FocusService', [])

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

angular.module('fh.services.ModalService', [
    'ui.bootstrap.modal',
])
.service('ModalService', function($rootScope, $modal) {
    var me = {
        modal: null,
        modalArgs: null,
        isModalOpen: function() {
            return me.modal !== null;
        },
        openModal: function(args) {
            me.closeModal();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbmRBbmRFZGl0LmpzIiwiaG9tZS5qcyIsImxhbmRpbmcuanMiLCJzZWFyY2guanMiLCJtYWluSGVhZGVyLmpzIiwic2hvd1BkZk1vZGFsLmpzIiwiRmluZEltYWdlU2VydmljZS5qcyIsIkZvY3VzU2VydmljZS5qcyIsIk1vZGFsU2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoib2xjaUFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xufSkoKTtcblxuYW5ndWxhci5tb2R1bGUoJ2ZoJywgW1xuICAgICduZ1N0b3JhZ2UnLFxuICAgICdjZ0J1c3knLFxuICAgICd1aS5yb3V0ZXInLFxuICAgICd1aS5ib290c3RyYXAnLFxuICAgICd1aS5ib290c3RyYXAuc2hvd0Vycm9ycycsXG4gICAgJ3VpLnV0aWxzJyxcbiAgICAncmVzdGFuZ3VsYXInLFxuICAgICd0ZW1wbGF0ZXMtYXBwJyxcbiAgICAndGVtcGxhdGVzLWNvbXBvbmVudHMnLFxuICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nLFxuICAgICdmaC5sYW5kaW5nJyxcbiAgICAnZmguaG9tZScsXG4gICAgJ2ZoLnNlYXJjaCcsXG4gICAgJ2ZoLmZpbmRBbmRFZGl0JyxcbiAgICAnZmguZGlyZWN0aXZlcy5tYWluSGVhZGVyJyxcbiAgICAnZmguZGlyZWN0aXZlcy5tb2RhbHMuc2hvd1BkZk1vZGFsJyxcbiAgICAvLyAnZmguZGlyZWN0aXZlcy5tb2RhbHMnLFxuICAgICdmaC5zZXJ2aWNlcy5Gb2N1c1NlcnZpY2UnLFxuICAgICd2ZW5kb3Iuc3RlZWxUb2UnLFxuICAgICdiYXNlNjQnLFxuICAgICdhbmd1bGFyLW1vbWVudGpzJ1xuXSlcblxuICAgIC5jb25maWcoZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyLCBSZXN0YW5ndWxhclByb3ZpZGVyLCBDb25maWd1cmF0aW9uLCAkdWlWaWV3U2Nyb2xsUHJvdmlkZXIsICRodHRwUHJvdmlkZXIpIHtcblxuICAgICAgICBSZXN0YW5ndWxhclByb3ZpZGVyLnNldEJhc2VVcmwoJy9hcGknKTtcbiAgICAgICAgUmVzdGFuZ3VsYXJQcm92aWRlci5zZXREZWZhdWx0SHR0cEZpZWxkcyh7XG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICB0aW1lb3V0OiBDb25maWd1cmF0aW9uLnRpbWVvdXRJbk1pbGxpcyxcbiAgICAgICAgICAgIGNhY2hlOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcnLCAnL2xhbmRpbmcnKS5vdGhlcndpc2UoJy9sYW5kaW5nJyk7XG5cbiAgICAgICAgLy8gc2Nyb2xscyB0byB0b3Agb2YgcGFnZSBvbiBzdGF0ZSBjaGFuZ2VcbiAgICAgICAgJHVpVmlld1Njcm9sbFByb3ZpZGVyLnVzZUFuY2hvclNjcm9sbCgpO1xuXG4gICAgfSlcbiAgICAucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsIFxuICAgICAgICBDb25maWd1cmF0aW9uLCBcbiAgICAgICAgJHN0YXRlLCBcbiAgICAgICAgJHNlc3Npb25TdG9yYWdlKSB7XG5cbiAgICAgICAgJHJvb3RTY29wZS5hcHBOYW1lID0gQ29uZmlndXJhdGlvbi5hcHBOYW1lO1xuICAgICAgICAkcm9vdFNjb3BlLmNvbXBhbnlDb2RlID0gQ29uZmlndXJhdGlvbi5jb21wYW55Q29kZTtcblxuXG4gICAgICAgICRzdGF0ZS5nbygnbGFuZGluZycpO1xuXG4gICAgICAgIC8vYXV0aCBjaGVjayBldmVyeSB0aW1lIHRoZSBzdGF0ZS9wYWdlIGNoYW5nZXNcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcbiAgICAgICAgICAgIC8vICRyb290U2NvcGUuc3RhdGVDaGFuZ2VBdXRoQ2hlY2soZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpO1xuICAgICAgICB9KTtcblxuXG4gICAgICAgIC8vRVZFTlQgQkFOS1xuICAgICAgICAvKlxuICAgICAgICAkcm9vdFNjb3BlLiRvbignYXV0aC1sb2dvdXQtc3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCBhcmdzKSB7XG4gICAgICAgIH0pOyovXG5cblxuXG4gICAgfSlcblxuICAgIC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmZpbmRBbmRFZGl0JywgW1xuICAndWkuc2VsZWN0JyxcbiAgJ25nU3RvcmFnZSdcbl0pXG5cbi5jb25maWcoZnVuY3Rpb24gaG9tZUNvbmZpZyggJHN0YXRlUHJvdmlkZXIgKSB7XG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdmaW5kQW5kRWRpdCcsIHtcbiAgICB1cmw6ICcvZmluZEFuZEVkaXQnLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdGaW5kQW5kRWRpdENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2ZpbmRBbmRFZGl0L2ZpbmRBbmRFZGl0LnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnRmluZCBBbmQgRWRpdCcsXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxsQ2xhc3NlczogZnVuY3Rpb24oICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UgKSB7XG4gICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIGp3dDogJHNlc3Npb25TdG9yYWdlLmp3dFxuICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoIHJlcyApIHtcbiAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdGaW5kQW5kRWRpdENvbnRyb2xsZXInLCBmdW5jdGlvbiggJHNjb3BlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCBhbGxDbGFzc2VzLCAkdGltZW91dCApIHtcbiAgdmFyIFBBUEVSU19VUkwgICAgICAgICAgICAgICAgICAgICAgID0gJy9hcGkvcGFwZXJzJztcbiAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ2p3dCddID0gJHNlc3Npb25TdG9yYWdlLmp3dDtcbiAgJHNjb3BlLnF1ZXJ5ICAgICAgICAgICAgICAgICAgICAgICAgID0ge307XG4gICRzY29wZS5lZGl0RGF0YSAgICAgICAgICAgICAgICAgICAgICA9IHt9O1xuICAkc2NvcGUuYWxsQ2xhc3NlcyAgICAgICAgICAgICAgICAgICAgPSBhbGxDbGFzc2VzO1xuXG4gICRzY29wZS5zZWFzb25zID0gW1xuICAgIHtuYW1lOiAnU3ByaW5nJywgY29kZTogXCJTUFwifSxcbiAgICB7bmFtZTogJ1N1bW1lcicsIGNvZGU6IFwiU1VcIn0sXG4gICAge25hbWU6ICdGYWxsJywgY29kZTogXCJGQVwifSxcbiAgICB7bmFtZTogJ1dpbnRlcicsIGNvZGU6IFwiV0lcIn1cbiAgXTtcbiAgJHNjb3BlLnllYXJzID0gW1xuICAgIHtuYW1lOiAnOTUnLCBjb2RlOiAnOTUnfSxcbiAgICB7bmFtZTogJzk2JywgY29kZTogJzk2J30sXG4gICAge25hbWU6ICc5NycsIGNvZGU6ICc5Nyd9LFxuICAgIHtuYW1lOiAnOTgnLCBjb2RlOiAnOTgnfSxcbiAgICB7bmFtZTogJzk5JywgY29kZTogJzk5J30sXG4gICAge25hbWU6ICcwMCcsIGNvZGU6ICcwMCd9LFxuICAgIHtuYW1lOiAnMDEnLCBjb2RlOiAnMDEnfSxcbiAgICB7bmFtZTogJzAyJywgY29kZTogJzAyJ30sXG4gICAge25hbWU6ICcwMycsIGNvZGU6ICcwMyd9LFxuICAgIHtuYW1lOiAnMDQnLCBjb2RlOiAnMDQnfSxcbiAgICB7bmFtZTogJzA1JywgY29kZTogJzA1J30sXG4gICAge25hbWU6ICcwNicsIGNvZGU6ICcwNid9LFxuICAgIHtuYW1lOiAnMDcnLCBjb2RlOiAnMDcnfSxcbiAgICB7bmFtZTogJzA4JywgY29kZTogJzA4J30sXG4gICAge25hbWU6ICcwOScsIGNvZGU6ICcwOSd9LFxuICAgIHtuYW1lOiAnMTAnLCBjb2RlOiAnMTAnfSxcbiAgICB7bmFtZTogJzExJywgY29kZTogJzExJ30sXG4gICAge25hbWU6ICcxMicsIGNvZGU6ICcxMid9LFxuICAgIHtuYW1lOiAnMTMnLCBjb2RlOiAnMTMnfSxcbiAgICB7bmFtZTogJzE0JywgY29kZTogJzE0J30sXG4gICAge25hbWU6ICcxNScsIGNvZGU6ICcxNSd9XG4gIF07XG4gICRzY29wZS50eXBlcyA9IFtcbiAgICB7bmFtZTogJ0hvbWV3b3JrJywgY29kZTogJ0gnfSxcbiAgICB7bmFtZTogJ01pZHRlcm0nLCBjb2RlOiAnTSd9LFxuICAgIHtuYW1lOiAnTm90ZXMnLCBjb2RlOiAnTid9LFxuICAgIHtuYW1lOiAnUXVpeicsIGNvZGU6ICdRJ30sXG4gICAge25hbWU6ICdGaW5hbCcsIGNvZGU6ICdGJ30sXG4gICAge25hbWU6ICdMYWInLCBjb2RlOiAnTCd9XG4gIF07XG5cbiAgJHNjb3BlLmZpbmRDbGFzc2VzID0gZnVuY3Rpb24oIHF1ZXJ5ICkge1xuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICB1cmw6IFBBUEVSU19VUkwgKyAnL2NsYXNzQW5kVHlwZS9jbGFzcy8nICsgcXVlcnkuY2xhc3NJZCAvLysgJy90eXBlLycgKyBxdWVyeS50eXBlQ29kZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgICRzY29wZS5wYXBlcnMgPSByZXMuZGF0YTtcbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5sb2coIGVyciApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS4kd2F0Y2goJ3BhcGVycycsIGZ1bmN0aW9uKCkge1xuICAgIGlmICggISRzY29wZS5wYXBlcnMgKSByZXR1cm47XG4gICAgXG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCAkc2NvcGUucGFwZXJzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICByZW5kZXJQZGYoICRzY29wZS5wYXBlcnNbIGkgXSApO1xuICAgICAgfVxuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHJlbmRlclBkZiggcGFwZXIgKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBwYXBlci5faWQgKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgaWYgKCBwYXBlciApIHtcbiAgICAgIFBERkpTLmdldERvY3VtZW50KCBwYXBlci5pbWcuZGF0YSApLnRoZW4oZnVuY3Rpb24oIHBkZiApIHtcbiAgICAgICAgcGRmLmdldFBhZ2UoMSkudGhlbihmdW5jdGlvbiggcGFnZSApIHtcblxuICAgICAgICAgIHZhciBzY2FsZSA9IC40O1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLnNob3dFZGl0UGFuZWwgPSBmdW5jdGlvbihpZCkge1xuICAgICRzY29wZVsgJ29wZW5FZGl0UGFuZWwtJyArIGlkIF0gPSAhJHNjb3BlWyAnb3BlbkVkaXRQYW5lbC0nICsgaWQgXTtcbiAgfTtcblxuICAkc2NvcGUuaXNFZGl0UGFuZWxPcGVuID0gZnVuY3Rpb24oaWQpIHtcbiAgICByZXR1cm4gISEkc2NvcGVbICdvcGVuRWRpdFBhbmVsLScgKyBpZCBdO1xuICB9O1xuXG4gICRzY29wZS5zdWJtaXRFZGl0ZWRQYXBlciA9IGZ1bmN0aW9uKCBwYXBlciwgbmV3RGF0YSApIHtcbiAgICBwdXRPYmogPSB7XG4gICAgICB0aXRsZTogbmV3RGF0YS50aXRsZSxcbiAgICAgIHBlcmlvZDogbmV3RGF0YS5zZWFzb24gKyBuZXdEYXRhLnllYXIsXG4gICAgICB0eXBlOiBuZXdEYXRhLnR5cGUsXG4gICAgICBjbGFzc0lkOiBuZXdEYXRhLmNsYXNzSWRcbiAgICB9O1xuXG4gICAgcGFwZXIuc3VjY2VzcyA9ICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICB1cmw6ICdhcGkvcGFwZXJzL3NpbmdsZS8nICsgcGFwZXIuX2lkLFxuICAgICAgZGF0YTogcHV0T2JqXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgY29uc29sZS5sb2coIHJlcyApO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IgKCBlcnIgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgfTtcblxuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnZmguaG9tZScsIFtcbiAgJ3VpLnNlbGVjdCcsXG4gICduZ1N0b3JhZ2UnLFxuICAnbmdGaWxlVXBsb2FkJyxcbiAgJ2ZoLnNlcnZpY2VzLkZvY3VzU2VydmljZSdcbl0pXG5cbi5jb25maWcoZnVuY3Rpb24gaG9tZUNvbmZpZygkc3RhdGVQcm92aWRlcikge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICB1cmw6ICcvaG9tZScsXG4gICAgdmlld3M6IHtcbiAgICAgIG1haW46IHtcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdob21lL2hvbWUudHBsLmh0bWwnXG4gICAgICB9XG4gICAgfSxcbiAgICBwYWdlVGl0bGU6ICdIb21lJyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGxDbGFzc2VzOiBmdW5jdGlvbiggJGh0dHAsICRzZXNzaW9uU3RvcmFnZSApIHtcbiAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIHVybDogJ2FwaS9jbGFzc2VzL2FsbCcsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgand0OiAkc2Vzc2lvblN0b3JhZ2Uuand0XG4gICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgdG9rZW5zOiBmdW5jdGlvbiggJGh0dHAgKSB7XG4gICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICB1cmw6ICdhc3NldHMvdG9rZW5zLmpzb24nXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIGZ1bmN0aW9uKCAkc2NvcGUsICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UsICR0aW1lb3V0LCBnaXZlRm9jdXMsIFVwbG9hZCwgYWxsQ2xhc3NlcywgdG9rZW5zICkge1xuICB2YXIgUEFQRVJTX1VSTCA9ICcvYXBpL3BhcGVycyc7XG4gICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydqd3QnXSA9ICRzZXNzaW9uU3RvcmFnZS5qd3Q7XG4gICRzY29wZS5hbGxDbGFzc2VzID0gYWxsQ2xhc3NlcztcblxuICAkc2NvcGUuJHdhdGNoKCdmaWxlcycsIGZ1bmN0aW9uKCkge1xuICAgICRzY29wZS51cGxvYWQoICRzY29wZS5maWxlcyApO1xuICB9KTtcblxuICAkc2NvcGUuJHdhdGNoKCdmaWxlJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCRzY29wZS5maWxlICE9IG51bGwpIHtcbiAgICAgICRzY29wZS51cGxvYWQoWyRzY29wZS5maWxlXSk7XG4gICAgfVxuICB9KTtcblxuICAkc2NvcGUubG9nICAgICAgICAgID0gJyc7XG4gICRzY29wZS5wYXBlcnNUb0VkaXQgPSBbXTtcbiAgJHNjb3BlLmVkaXREYXRhICAgICA9IHt9O1xuXG4gICRzY29wZS5zZWFzb25zID0gW1xuICAgIHtuYW1lOiAnU3ByaW5nJywgY29kZTogXCJTUFwifSxcbiAgICB7bmFtZTogJ1N1bW1lcicsIGNvZGU6IFwiU1VcIn0sXG4gICAge25hbWU6ICdGYWxsJywgY29kZTogXCJGQVwifSxcbiAgICB7bmFtZTogJ1dpbnRlcicsIGNvZGU6IFwiV0lcIn1cbiAgXTtcbiAgJHNjb3BlLnllYXJzID0gW1xuICAgIHtuYW1lOiAnOTUnLCBjb2RlOiAnOTUnfSxcbiAgICB7bmFtZTogJzk2JywgY29kZTogJzk2J30sXG4gICAge25hbWU6ICc5NycsIGNvZGU6ICc5Nyd9LFxuICAgIHtuYW1lOiAnOTgnLCBjb2RlOiAnOTgnfSxcbiAgICB7bmFtZTogJzk5JywgY29kZTogJzk5J30sXG4gICAge25hbWU6ICcwMCcsIGNvZGU6ICcwMCd9LFxuICAgIHtuYW1lOiAnMDEnLCBjb2RlOiAnMDEnfSxcbiAgICB7bmFtZTogJzAyJywgY29kZTogJzAyJ30sXG4gICAge25hbWU6ICcwMycsIGNvZGU6ICcwMyd9LFxuICAgIHtuYW1lOiAnMDQnLCBjb2RlOiAnMDQnfSxcbiAgICB7bmFtZTogJzA1JywgY29kZTogJzA1J30sXG4gICAge25hbWU6ICcwNicsIGNvZGU6ICcwNid9LFxuICAgIHtuYW1lOiAnMDcnLCBjb2RlOiAnMDcnfSxcbiAgICB7bmFtZTogJzA4JywgY29kZTogJzA4J30sXG4gICAge25hbWU6ICcwOScsIGNvZGU6ICcwOSd9LFxuICAgIHtuYW1lOiAnMTAnLCBjb2RlOiAnMTAnfSxcbiAgICB7bmFtZTogJzExJywgY29kZTogJzExJ30sXG4gICAge25hbWU6ICcxMicsIGNvZGU6ICcxMid9LFxuICAgIHtuYW1lOiAnMTMnLCBjb2RlOiAnMTMnfSxcbiAgICB7bmFtZTogJzE0JywgY29kZTogJzE0J30sXG4gICAge25hbWU6ICcxNScsIGNvZGU6ICcxNSd9XG4gIF07XG4gICRzY29wZS50eXBlcyA9IFtcbiAgICB7bmFtZTogJ0hvbWV3b3JrJywgY29kZTogJ0gnfSxcbiAgICB7bmFtZTogJ01pZHRlcm0nLCBjb2RlOiAnTSd9LFxuICAgIHtuYW1lOiAnTm90ZXMnLCBjb2RlOiAnTid9LFxuICAgIHtuYW1lOiAnUXVpeicsIGNvZGU6ICdRJ30sXG4gICAge25hbWU6ICdGaW5hbCcsIGNvZGU6ICdGJ30sXG4gICAge25hbWU6ICdMYWInLCBjb2RlOiAnTCd9XG4gIF07XG5cbiAgJHNjb3BlLnVwbG9hZCA9IGZ1bmN0aW9uKCBmaWxlcyApIHtcbiAgICBpZiAoZmlsZXMgJiYgZmlsZXMubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBmaWxlID0gZmlsZXNbaV07XG5cbiAgICAgICAgVXBsb2FkLnVwbG9hZCh7XG4gICAgICAgICAgdXJsOiBQQVBFUlNfVVJMLFxuICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgfSlcblxuICAgICAgICAucHJvZ3Jlc3MoZnVuY3Rpb24gKCBldnQgKSB7XG4gICAgICAgICAgdmFyIHByb2dyZXNzUGVyY2VudGFnZSA9IHBhcnNlSW50KDEwMC4wICogZXZ0LmxvYWRlZCAvIGV2dC50b3RhbCk7XG4gICAgICAgICAgJHNjb3BlLmxvZyA9ICdwcm9ncmVzczogJyArIFxuICAgICAgICAgICAgcHJvZ3Jlc3NQZXJjZW50YWdlICsgXG4gICAgICAgICAgICAnJScgKyBcbiAgICAgICAgICAgIGV2dC5jb25maWcuZmlsZS5uYW1lICsgXG4gICAgICAgICAgICAnXFxuJyArIFxuICAgICAgICAgICAgJHNjb3BlLmxvZztcbiAgICAgICAgfSlcblxuICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiggZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcgKSB7XG4gICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICRzY29wZS5sb2cgPSAnZmlsZTogJyArIFxuICAgICAgICAgICAgICBjb25maWcuZmlsZS5uYW1lICsgXG4gICAgICAgICAgICAgICcsIFJlc3BvbnNlOiAnICsgXG4gICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KCBkYXRhLnRpdGxlICkgKyBcbiAgICAgICAgICAgICAgJywgSUQ6ICcgK1xuICAgICAgICAgICAgICBkYXRhLl9pZFxuICAgICAgICAgICAgICAnXFxuJyArIFxuICAgICAgICAgICAgICAkc2NvcGUubG9nO1xuXG4gICAgICAgICAgICAkc2NvcGUucGFwZXJzVG9FZGl0LnB1c2goIGRhdGEgKTtcblxuICAgICAgICAgICAgZ2l2ZUZvY3VzKCdzZWFzb24tcGlja2VyJyk7XG5cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5zdWJtaXRFZGl0ZWRQYXBlciA9IGZ1bmN0aW9uKCBwYXBlciwgbmV3RGF0YSApIHtcbiAgICBwdXRPYmogPSB7XG4gICAgICB0aXRsZTogbmV3RGF0YS50aXRsZSxcbiAgICAgIHBlcmlvZDogbmV3RGF0YS5zZWFzb24gKyBuZXdEYXRhLnllYXIsXG4gICAgICB0eXBlOiBuZXdEYXRhLnR5cGUsXG4gICAgICBjbGFzc0lkOiBuZXdEYXRhLmNsYXNzSWRcbiAgICB9O1xuXG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgIHVybDogJ2FwaS9wYXBlcnMvc2luZ2xlLycgKyBwYXBlci5faWQsXG4gICAgICBkYXRhOiBwdXRPYmpcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICBjb25zb2xlLmxvZyggcmVzICk7XG4gICAgICAkc2NvcGUucGFwZXJUb0VkaXRCYWNrU3RvcmUgPSAkc2NvcGUucGFwZXJzVG9FZGl0LnNoaWZ0KCk7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IgKCBlcnIgKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyByZS1yZW5kZXJzIHRoZSBtYWluIGNhbnZhcyB1cG9uIGNoYW5nZVxuICAkc2NvcGUuJHdhdGNoKCdwYXBlcnNUb0VkaXRbMF0nLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21haW4tdmlld2VyJyk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggJHNjb3BlLnBhcGVyc1RvRWRpdFswXSApIHtcbiAgICAgIFBERkpTLmdldERvY3VtZW50KCAkc2NvcGUucGFwZXJzVG9FZGl0WzBdLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKHBhZ2UpIHtcblxuICAgICAgICAgIHZhciBzY2FsZSA9IDAuODtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gcmUtcmVuZGVycyB0aGUgc2Vjb25kYXJ5IGNhbnZhcyB1cG9uIGNoYW5nZVxuICAkc2NvcGUuJHdhdGNoKCdwYXBlcnNUb0VkaXRbMV0nLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHQtdXAtcGRmLWNvbnRhaW5lcicpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoICRzY29wZS5wYXBlcnNUb0VkaXRbMV0gKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggJHNjb3BlLnBhcGVyc1RvRWRpdFsxXS5pbWcuZGF0YSApLnRoZW4oZnVuY3Rpb24oIHBkZiApIHtcbiAgICAgICAgcGRmLmdldFBhZ2UoMSkudGhlbihmdW5jdGlvbihwYWdlKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAwLjI7XG4gICAgICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgICAgICBjYW52YXNDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICAgICAgfTtcbiAgICAgICAgICBwYWdlLnJlbmRlcihyZW5kZXJDb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH0pO1xuXG4gICRzY29wZS5hZGRDbGFzcyA9IGZ1bmN0aW9uKCBuZXdDbGFzcyApIHtcbiAgICB2YXIgcG9zdE9iaiA9IHt0aXRsZTogbmV3Q2xhc3N9O1xuXG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICB1cmw6ICcvYXBpL2NsYXNzZXMnLFxuICAgICAgZGF0YTogcG9zdE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICB1cmw6ICcvYXBpL2NsYXNzZXMvYWxsJ1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzICkge1xuICAgICAgICAkc2NvcGUuYWxsQ2xhc3NlcyA9IHJlcy5kYXRhO1xuICAgICAgfSk7XG5cbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5sb2coIGVyciApO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vICRzY29wZS5hZGRUb2tlbnMgPSBmdW5jdGlvbigpIHtcbiAgLy8gICB0b2tlbnMudG9rZW5zLmZvckVhY2goIGZ1bmN0aW9uKCB0b2tlbiwgaW5kZXgsIGFycmF5KSB7XG4gIC8vICAgICAkaHR0cCh7XG4gIC8vICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAvLyAgICAgICB1cmw6ICcvYXBpL21ha2VUb2tlbicsXG4gIC8vICAgICAgIGRhdGE6IHRva2VuXG4gIC8vICAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gIC8vICAgICAgIGNvbnNvbGUubG9nKCd5ZXMnKTtcbiAgLy8gICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gIC8vICAgICAgIGNvbnNvbGUubG9nKCdGRkZGRkZGRkZGVVVVVVUnLCBlcnIpO1xuICAvLyAgICAgfSk7XG4gIC8vICAgfSk7XG4gIC8vIH07XG5cblxufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnZmgubGFuZGluZycsW1xuICAnbmdTdG9yYWdlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiAoICRzdGF0ZVByb3ZpZGVyICkge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGFuZGluZycsIHtcbiAgICB1cmw6ICcvJyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnTGFuZGluZ0NvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2xhbmRpbmcvbGFuZGluZy50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ2xhbmRpbmdQYWdlLnBhZ2VUaXRsZSdcbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignTGFuZGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoICRzY29wZSwgJHN0YXRlLCAkaHR0cCwgJGJhc2U2NCwgJHNlc3Npb25TdG9yYWdlKSB7XG4gIHZhciBVU0VSU19VUkwgPSAnL2FwaS91c2Vycyc7XG5cbiAgJHNjb3BlLnJlZ2lzdGVyID0gZnVuY3Rpb24oIGNyZWRlbnRpYWxzICkge1xuICAgIHZhciBuZXdVc2VyID0ge1xuICAgICAgbmFtZTogY3JlZGVudGlhbHMubmFtZSxcbiAgICAgIHBob25lOiBjcmVkZW50aWFscy5waG9uZSxcbiAgICAgIGVtYWlsOiBjcmVkZW50aWFscy5lbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBjcmVkZW50aWFscy5wYXNzd29yZCxcbiAgICAgIHBhc3N3b3JkQ29uZmlybTogY3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtLFxuICAgICAgdG9rZW46IGNyZWRlbnRpYWxzLmFkZENvZGVcbiAgICB9O1xuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgdXJsOiBVU0VSU19VUkwsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0sXG4gICAgICBkYXRhOiBuZXdVc2VyXG4gICAgfSlcbiAgICAuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICBjb25zb2xlLmRpcihkYXRhKTtcbiAgICAgIC8vICRzY29wZS5yZWdpc3RlckNyZWRlbnRpYWxzID0ge307XG4gICAgICAvLyAkc2NvcGUucmVnaXN0ZXJTdWNjZXNzID0gdHJ1ZTtcbiAgICAgICRzZXNzaW9uU3RvcmFnZS5qd3QgPSBkYXRhLmp3dDtcbiAgICAgICRzdGF0ZS5nbygnc2VhcmNoJyk7XG4gICAgfSlcbiAgICAuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XG4gICAgICBjb25zb2xlLmRpcihlcnIpO1xuICAgICAgJHNjb3BlLnJlZ2lzdGVyQ3JlZGVudGlhbHMucGFzc3dvcmQgPSAnJztcbiAgICAgICRzY29wZS5yZWdpc3RlckNyZWRlbnRpYWxzLnBhc3N3b3JkQ29uZmlybSA9ICcnO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XG5cbiAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aG9yaXphdGlvbiddID0gXG4gICAgICAnQmFzaWMgJyArIFxuICAgICAgJGJhc2U2NC5lbmNvZGUoY3JlZGVudGlhbHMuZW1haWwgKyBcbiAgICAgICc6JyArIFxuICAgICAgY3JlZGVudGlhbHMucGFzc3dvcmQpO1xuICAgIFxuICAgICRodHRwLmdldChVU0VSU19VUkwpXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGNvbnNvbGUuZGlyKGRhdGEpO1xuICAgICAgICAkc2Vzc2lvblN0b3JhZ2Uuand0ID0gZGF0YS5qd3Q7XG4gICAgICAgICRzdGF0ZS5nbygnc2VhcmNoJyk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBjb25zb2xlLmRpcihlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5zZWFyY2gnLCBbXG4gICd1aS5zZWxlY3QnLFxuICAnbmdTdG9yYWdlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiBzZWFyY2hDb25maWcoJHN0YXRlUHJvdmlkZXIpIHtcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NlYXJjaCcsIHtcbiAgICB1cmw6ICcvc2VhcmNoJyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnU2VhcmNoQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnc2VhcmNoL3NlYXJjaC50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ1NlYXJjaCcsXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxsQ2xhc3NlczogZnVuY3Rpb24oICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UgKSB7XG4gICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIGp3dDogJHNlc3Npb25TdG9yYWdlLmp3dFxuICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ1NlYXJjaENvbnRyb2xsZXInLCBmdW5jdGlvbiggJHNjb3BlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCBhbGxDbGFzc2VzLCAkdGltZW91dCApIHtcbiAgJHNjb3BlLmFsbENsYXNzZXMgPSBhbGxDbGFzc2VzO1xuICAkc2NvcGUucXVlcnkgPSB7fTtcbiAgdmFyIFBBUEVSU19VUkwgPSAnL2FwaS9wYXBlcnMnO1xuXG4gICRzY29wZS5maW5kUGFwZXJzQnlDbGFzcyA9IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIHVybDogUEFQRVJTX1VSTCArICcvY2xhc3MvJyArIHF1ZXJ5LmNsYXNzSWRcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAkc2NvcGUucGFwZXJzID0gcmVzLmRhdGE7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuZmluZEltYWdlID0gZnVuY3Rpb24oIHBhcGVySWQgKSB7XG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIHVybDogUEFQRVJTX1VSTCArICcvc2luZ2xlLycgKyBwYXBlcklkXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgJHNjb3BlLnBhcGVyID0gcmVzLmRhdGE7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuJHdhdGNoKCdwYXBlcicsIGZ1bmN0aW9uKCkge1xuICAgIGlmICggISRzY29wZS5wYXBlciApIHJldHVybjtcbiAgICBcbiAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHJlbmRlclBkZiggJHNjb3BlLnBhcGVyICk7XG4gICAgfSwgMTAwKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gcmVuZGVyUGRmKCBwYXBlciApIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdkaXNwbGF5LXBhcGVyJyApO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoIHBhcGVyICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoIHBhcGVyLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKCBwYWdlICkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMTtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfVxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmRpcmVjdGl2ZXMubWFpbkhlYWRlcicsIFtcbiAgICAnbmdTdG9yYWdlJyxcbiAgICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJ1xuXSlcblxuLmRpcmVjdGl2ZSgnbWFpbkhlYWRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9tYWluSGVhZGVyL21haW5IZWFkZXIudHBsLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiggJHNjb3BlLCAkc3RhdGUgKSB7XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzLnNob3dQZGZNb2RhbCcsIFtcbiAgJ3VpLmJvb3RzdHJhcCcsXG4gICdmaC5zZXJ2aWNlcy5Nb2RhbFNlcnZpY2UnXG5dKVxuXG4uZGlyZWN0aXZlKCdzaG93UGRmTW9kYWwnLCBmdW5jdGlvbiggTW9kYWxTZXJ2aWNlICkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQUUnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgTW9kYWxTZXJ2aWNlLm9wZW5Nb2RhbCh7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICdkaXJlY3RpdmVzL21vZGFscy9zaG93UGRmTW9kYWwvc2hvd1BkZk1vZGFsLnRwbC5odG1sJyxcbiAgICAgICAgICBjb250cm9sbGVyOiAnU2hvd1BkZk1vZGFsQ29udHJvbGxlcicsXG4gICAgICAgICAgd2luZG93Q2xhc3M6ICdzaG93LXBkZi1tb2RhbCcsXG4gICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgIGtleWJvYXJkOiBmYWxzZSxcbiAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICBwYXBlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzY29wZS5wYXBlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufSlcblxuLmNvbnRyb2xsZXIoJ1Nob3dQZGZNb2RhbENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsICR0aW1lb3V0LCBNb2RhbFNlcnZpY2UsIHBhcGVyKSB7XG4gICRzY29wZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIE1vZGFsU2VydmljZS5jbG9zZU1vZGFsKCk7XG4gIH07XG4gICRzY29wZS5tb2RhbElkID0gcGFwZXIuX2lkICsgJ21vZGFsJztcbiAgJHNjb3BlLnBhcGVyID0gcGFwZXJcblxuICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocGFwZXIuX2lkICsgJ21vZGFsJyk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggcGFwZXIgKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggcGFwZXIuaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAxO1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9LCA1MCk7XG4gICAgXG59KTsiLCJcblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlXG4gKiBAZGVzY3JpcHRpb24gU2VydmljZSB0aGF0IGZpbmRzIGFuZCByZXR1cm5zIGEgcHJvbWlzZSBmb3IgaW1hZ2Ugc3JjIHN0cmluZ3MuXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCdmaC5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlJywgW1xuICAgICAgICAnbmdTdG9yYWdlJyxcbiAgICAgICAgJ3ZlbmRvci5zdGVlbFRvZSdcbiAgICBdKVxuXG4uZmFjdG9yeSgnRmluZEltYWdlU2VydmljZScsIGZ1bmN0aW9uKCRodHRwLCAkc2Vzc2lvblN0b3JhZ2UsICRxLCBzdGVlbFRvZSkge1xuICAgIC8vIENoZWNrcyBpZiBpbWFnZSBleGlzdHMuICBSZXR1cm5zIGRlZmF1bHQgaW1hZ2Ugc291cmNlIGlmIGl0IGRvZXNuJ3QuXG4gICAgLy8gUHJpdmF0ZSBoZWxwZXIgbWV0aG9kLlxuICAgIGZ1bmN0aW9uIGlzSW1hZ2Uoc3JjLCBkZWZhdWx0U3JjKSB7XG5cbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1hZ2Uub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2Vycm9yOiAnICsgc3JjICsgJyBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoIGRlZmF1bHRTcmMgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBzcmMgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2Uuc3JjID0gc3JjO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuRmluZEltYWdlU2VydmljZSNpdGluZXJhcnlJbWFnZVxuICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBHZW5lcmF0ZSBhIFVSTCBmb3IgaXRpbmVyYXJ5IGltYWdlLiAgSWYgZ2VuZXJhdGVkIFVSTCBpcyBub3QgdmFsaWQsIHJldHVybiBkZWZhdWx0IGltYWdlIFVSTC5cbiAgICAgICAgICogQHJldHVybnMge29iamVjdH0gYSBwcm9taXNlIG9iamVjdCB0aGF0IHJldHVybnMgYSByZWxhdGl2ZSBVUkwgZm9yIHRoZSByZXNvdXJjZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgPHByZT5cbiAgICAgICAgICdPTENJX2Rlc3RfQS5qcGcnXG4gICAgICAgICA8L3ByZT5cbiAgICAgICAgICogKi9cbiAgICAgICAgaXRpbmVyYXJ5SW1hZ2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGRlc3RDb2RlID0gc3RlZWxUb2UuZG8oJHNlc3Npb25TdG9yYWdlKS5nZXQoJ2Jvb2tpbmdJbmZvLmRlc3RpbmF0aW9uQ29kZScpIHx8ICcnO1xuICAgICAgICAgICAgcmV0dXJuIGlzSW1hZ2UoXG4gICAgICAgICAgICAgICAgJy4vYXNzZXRzL2ltYWdlcy9vbmJvYXJkL09MQ0lfZGVzdF8nICsgZGVzdENvZGUuc2xpY2UoMCwgMSkgKyAnLmpwZycsXG4gICAgICAgICAgICAgICAgJy4vYXNzZXRzL2ltYWdlcy9vbmJvYXJkL09MQ0lfZGVzdF9kZWZhdWx0LmpwZydcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0SGVhZGVySW1hZ2U6IGZ1bmN0aW9uKGNvbXBhbnlDb2RlKSB7XG4gICAgICAgICAgICB2YXIgaW1hZ2VVcmwgPSAnLi9hc3NldHMvaW1hZ2VzL2hlYWRlckltYWdlLmpwZyc7XG4gICAgICAgICAgICByZXR1cm4gaXNJbWFnZShpbWFnZVVybCk7XG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkZpbmRJbWFnZVNlcnZpY2UjYm9va2luZ1N1bW1hcnlJbWFnZVxuICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBHZW5lcmF0ZSBhIFVSTCBmb3IgYm9va2luZyBzdW1tYXJ5IGltYWdlLiAgSWYgZ2VuZXJhdGVkIFVSTCBpcyBub3QgdmFsaWQsIHJldHVybiBkZWZhdWx0IGltYWdlIFVSTC5cbiAgICAgICAgICogQHJldHVybnMge29iamVjdH0gYSBwcm9taXNlIG9iamVjdCB0aGF0IHJldHVybnMgYSByZWxhdGl2ZSBVUkwgZm9yIHRoZSByZXNvdXJjZVxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgPHByZT5cbiAgICAgICAgICdPTENJX2Rlc3RfQV8yLmpwZydcbiAgICAgICAgIDwvcHJlPlxuICAgICAgICAgKiAqL1xuICAgICAgICBib29raW5nU3VtbWFyeUltYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkZXN0Q29kZSA9IHN0ZWVsVG9lLmRvKCRzZXNzaW9uU3RvcmFnZSkuZ2V0KCdib29raW5nSW5mby5kZXN0aW5hdGlvbkNvZGUnKSB8fCBbXTtcbiAgICAgICAgICAgIHJldHVybiBpc0ltYWdlKFxuICAgICAgICAgICAgICAgICcuL2Fzc2V0cy9pbWFnZXMvb25ib2FyZC9PTENJX2Rlc3RfJyArIGRlc3RDb2RlLnNsaWNlKDAsIDEpICsgJ18yLmpwZycsXG4gICAgICAgICAgICAgICAgJy4vYXNzZXRzL2ltYWdlcy9vbmJvYXJkL09MQ0lfZGVzdF9kZWZhdWx0XzIuanBnJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcblxuICAgICAgICBtYXJpbmVySW1hZ2U6IGZ1bmN0aW9uKG1hcmluZXJOdW0pIHtcbiAgICAgICAgICAgIGlmICghbWFyaW5lck51bSkgcmV0dXJuICcnO1xuICAgICAgICAgICAgcmV0dXJuIGlzSW1hZ2UoXG4gICAgICAgICAgICAgICAgJy4vYXNzZXRzL3N0YXJfbWFyaW5lci8nICsgbWFyaW5lck51bSArICdzdGFyTWFyaW5lci5naWYnXG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlI3N0YXRlUm9vbUltYWdlXG4gICAgICAgICAqIEBtZXRob2RPZiBvbGNpLnNlcnZpY2VzLkZpbmRJbWFnZVNlcnZpY2VcbiAgICAgICAgICogQGRlc2NyaXB0aW9uIEdlbmVyYXRlIGEgVVJMIHN0YXRlcm9vbSBpbWFnZS4gIElmIGdlbmVyYXRlZCBVUkwgaXMgbm90IHZhbGlkLCByZXR1cm4gZGVmYXVsdCBpbWFnZSBVUkwuXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IGEgcHJvbWlzZSBvYmplY3QgdGhhdCByZXR1cm5zIGEgcmVsYXRpdmUgVVJMIGZvciB0aGUgcmVzb3VyY2VcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgIDxwcmU+XG4gICAgICAgICAnQU1fT0xDSV9zdGF0ZXJvb21fbmVwdHVuZS5qcGcnXG4gICAgICAgICA8L3ByZT5cbiAgICAgICAgICogKi9cbiAgICAgICAgc3RhdGVyb29tSW1hZ2U6IGZ1bmN0aW9uKCkgeyBcbiAgICAgICAgICAgIHZhciBjYWJpbkNhdGVnb3JpZXMgPSBbIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnaW50ZXJpb3InLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ0knLCAnSicsICdLJywgJ0wnLCAnTScsICdNTScsICdOJywgJ05OJywgJ0lBJywgJ0lRJywgJ1InIF0gXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgeyAgLy8gVE9ETzogVGhpcyBtYXkgbm90IGJlIHJlYWwuXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnaW5zaWRlJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdJUycgXSAgXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdvY2VhbicsIFxuICAgICAgICAgICAgICAgICAgICBjb2RlczogWyAnQycsICdDQScsICdDUScsICdEJywgJ0RBJywgJ0REJywgJ0UnLCAnRUUnLCAnRicsICdGQScsICdGQicsICdGRicsICdHJywgJ0gnLCAnSEgnLCAnR0cnLCAnT08nLCAnUScgXSBcbiAgICAgICAgICAgICAgICB9LCBcbiAgICAgICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ3Zpc3RhJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdBJywgJ0FBJywgJ0FCJywgJ0FTJywgJ0InLCAnQkEnLCAnQkInLCAnQkMnLCAnQlEnIF0gXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICduZXB0dW5lJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdTJywgJ1NBJywgJ1NCJywgJ1NDJywgJ1NRJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAncGlubmFjbGUnLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ1BTJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAndmVyYW5kYWgnLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ1YnLCAnVkEnLCAnVkInLCAnVkMnLCAnVkQnLCAnVkUnLCAnVkYnLCAnVkgnLCAnVlEnLCAnVlMnLCAnVlQnIF0gXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICdzaWduYXR1cmUnLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ1NTJywgJ1NZJywgJ1NaJywgJ1NVJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnbGFuYWknLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ0NBJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHZhciBzaGlwQ29kZSA9IHN0ZWVsVG9lLmRvKCRzZXNzaW9uU3RvcmFnZSkuZ2V0KCdib29raW5nSW5mby5zaGlwQ29kZScpIHx8ICcnO1xuICAgICAgICAgICAgc2hpcENvZGUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIHZhciBjYWJpbkNhdGVnb3J5ID0gc3RlZWxUb2UuZG8oJHNlc3Npb25TdG9yYWdlKS5nZXQoJ2Jvb2tpbmdJbmZvLnN0YXRlcm9vbUNhdGVnb3J5JykgfHwgJyc7XG4gICAgICAgICAgICBjYWJpbkNhdGVnb3J5LnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnkgPSAnZGVmYXVsdCc7XG4gICAgICAgICAgICB2YXIgY2F0ZWdvcnlDb3VudCA9IGNhYmluQ2F0ZWdvcmllcy5sZW5ndGg7XG5cbiAgICAgICAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8IGNhdGVnb3J5Q291bnQ7IGkrKyApIHtcbiAgICAgICAgICAgICAgICBpZiAoIGNhYmluQ2F0ZWdvcmllc1tpXS5jb2Rlcy5pbmRleE9mKCBjYWJpbkNhdGVnb3J5ICkgIT09IC0xICkge1xuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeSA9IGNhYmluQ2F0ZWdvcmllc1tpXS5jYXRlZ29yeS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBpc0ltYWdlKFxuICAgICAgICAgICAgICAgICcuL2Fzc2V0cy9pbWFnZXMvb25ib2FyZC8nICsgc2hpcENvZGUgKyAnX09MQ0lfc3RhdGVyb29tXycgKyBjYXRlZ29yeSArICcuanBnJyxcbiAgICAgICAgICAgICAgICAnLi9hc3NldHMvaW1hZ2VzL29uYm9hcmQvT0xDSV9zdGF0ZXJvb21fZGVmYXVsdC5qcGcnXG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7XG5cblxuXG4vLyBpbnRlcmlvclxuLy8gSSwgSiwgSywgTCwgTSwgTU0sIE4sIE5OLCBJQSwgSVEsIFJcblxuLy8gb2NlYW5cbi8vIEMsIENBLCBDUSwgRCwgREEsIERELCBFLCBFRSwgRiwgRkEsIEZCLCBGRiwgRywgSCwgSEgsIEdHLCBPTywgUVxuXG4vLyB2aXN0YVxuLy8gQSwgQUEsIEFCLCBBUywgQiwgQkEsIEJCLCBCQywgQlFcblxuLy8gbmVwdHVuZVxuLy8gUywgU0EsIFNCLCBTQywgU1FcblxuLy8gcGlubmFjbGVcbi8vIFBTXG5cbi8vIHZlcmFuZGFoXG4vLyBWLCBWQSwgVkIsIFZDLCBWRCwgVkUsIFZGLCBWSCwgVlEsIFZTLCBWVFxuXG4vLyBzaWduYXR1cmVcbi8vIFNTLCBTWSwgU1osIFNVXG5cbi8vIGxhbmFpXG4vLyBDQVxuXG4iLCJhbmd1bGFyLm1vZHVsZSgnZmguc2VydmljZXMuRm9jdXNTZXJ2aWNlJywgW10pXG5cbi5mYWN0b3J5KCdnaXZlRm9jdXMnLCBmdW5jdGlvbigkdGltZW91dCkge1xuICAgIHJldHVybiBmdW5jdGlvbihpZCkge1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuICAgICAgICAgICAgaWYoZWxlbWVudClcbiAgICAgICAgICAgICAgICBlbGVtZW50LmZvY3VzKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG59KTsiLCIvKlxuICogTW9kYWxTZXJ2aWNlLmpzXG4gKlxuICogQ3JlYXRlZDogVGh1cnNkYXksIE5vdmVtYmVyIDMsIDIwMTRcbiAqIChjKSBDb3B5cmlnaHQgMjAxNCBIb2xsYW5kIEFtZXJpY2EsIEluYy4gLSBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiBUaGlzIGlzIHVucHVibGlzaGVkIHByb3ByaWV0YXJ5IHNvdXJjZSBjb2RlIG9mIEhvbGxhbmQgQW1lcmljYSwgSW5jLlxuICogVGhlIGNvcHlyaWdodCBub3RpY2UgYWJvdmUgZG9lcyBub3QgZXZpZGVuY2UgYW55IGFjdHVhbCBvciBpbnRlbmRlZFxuICogcHVibGljYXRpb24gb2Ygc3VjaCBzb3VyY2UgY29kZS5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSBvbGNpLnNlcnZpY2VzLk1vZGFsU2VydmljZVxuICogQGRlc2NyaXB0aW9uIFRoZXNlIHNlcnZpY2UgbWV0aG9kcyBhcmUgdXNlZCB3aXRoIG1vZGFscyB0byBjb250cm9sIGxpZmVjeWNsZS5cbiAqL1xuXG5hbmd1bGFyLm1vZHVsZSgnZmguc2VydmljZXMuTW9kYWxTZXJ2aWNlJywgW1xuICAgICd1aS5ib290c3RyYXAubW9kYWwnLFxuXSlcbi5zZXJ2aWNlKCdNb2RhbFNlcnZpY2UnLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkbW9kYWwpIHtcbiAgICB2YXIgbWUgPSB7XG4gICAgICAgIG1vZGFsOiBudWxsLFxuICAgICAgICBtb2RhbEFyZ3M6IG51bGwsXG4gICAgICAgIGlzTW9kYWxPcGVuOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBtZS5tb2RhbCAhPT0gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgb3Blbk1vZGFsOiBmdW5jdGlvbihhcmdzKSB7XG4gICAgICAgICAgICBtZS5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICBtZS5tb2RhbEFyZ3MgPSBhcmdzO1xuICAgICAgICAgICAgbWUubW9kYWwgPSAkbW9kYWwub3BlbihhcmdzKTtcblxuICAgICAgICAgICAgcmV0dXJuIG1lLm1vZGFsO1xuICAgICAgICB9LFxuICAgICAgICBjbG9zZU1vZGFsOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChtZS5tb2RhbCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbWUubW9kYWwuZGlzbWlzcygpO1xuICAgICAgICAgICAgICAgIG1lLm1vZGFsID0gbnVsbDtcbiAgICAgICAgICAgICAgICBtZS5tb2RhbEFyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vV2hlbiB0aGUgdXNlciBuYXZpZ2F0ZXMgYXdheSBmcm9tIGEgcGFnZSB3aGlsZSBhIG1vZGFsIGlzIG9wZW4sIGNsb3NlIHRoZSBtb2RhbC5cbiAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xuICAgICAgICBtZS5jbG9zZU1vZGFsKCk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWU7XG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=