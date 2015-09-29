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

  $scope.addTokens = function() {
    tokens.tokens.forEach( function( token, index, array) {
      $http({
        method: 'POST',
        url: '/api/makeToken',
        data: token
      }).then(function( res ) {
        console.log('yes');
      }, function( err ) {
        console.log('FFFFFFFFFFUUUUU', err);
      });
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

.controller('SearchController', function( $scope, $http, $sessionStorage, allClasses ) {
  $scope.findPapersByClass = function() {
    
  };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbmRBbmRFZGl0LmpzIiwiaG9tZS5qcyIsImxhbmRpbmcuanMiLCJzZWFyY2guanMiLCJtYWluSGVhZGVyLmpzIiwic2hvd1BkZk1vZGFsLmpzIiwiRmluZEltYWdlU2VydmljZS5qcyIsIkZvY3VzU2VydmljZS5qcyIsIk1vZGFsU2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzVEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeExBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJvbGNpQXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG59KSgpO1xuXG5hbmd1bGFyLm1vZHVsZSgnZmgnLCBbXG4gICAgJ25nU3RvcmFnZScsXG4gICAgJ2NnQnVzeScsXG4gICAgJ3VpLnJvdXRlcicsXG4gICAgJ3VpLmJvb3RzdHJhcCcsXG4gICAgJ3VpLmJvb3RzdHJhcC5zaG93RXJyb3JzJyxcbiAgICAndWkudXRpbHMnLFxuICAgICdyZXN0YW5ndWxhcicsXG4gICAgJ3RlbXBsYXRlcy1hcHAnLFxuICAgICd0ZW1wbGF0ZXMtY29tcG9uZW50cycsXG4gICAgJ0FwcGxpY2F0aW9uQ29uZmlndXJhdGlvbicsXG4gICAgJ2ZoLmxhbmRpbmcnLFxuICAgICdmaC5ob21lJyxcbiAgICAnZmguc2VhcmNoJyxcbiAgICAnZmguZmluZEFuZEVkaXQnLFxuICAgICdmaC5kaXJlY3RpdmVzLm1haW5IZWFkZXInLFxuICAgICdmaC5kaXJlY3RpdmVzLm1vZGFscy5zaG93UGRmTW9kYWwnLFxuICAgIC8vICdmaC5kaXJlY3RpdmVzLm1vZGFscycsXG4gICAgJ2ZoLnNlcnZpY2VzLkZvY3VzU2VydmljZScsXG4gICAgJ3ZlbmRvci5zdGVlbFRvZScsXG4gICAgJ2Jhc2U2NCcsXG4gICAgJ2FuZ3VsYXItbW9tZW50anMnXG5dKVxuXG4gICAgLmNvbmZpZyhmdW5jdGlvbigkdXJsUm91dGVyUHJvdmlkZXIsIFJlc3Rhbmd1bGFyUHJvdmlkZXIsIENvbmZpZ3VyYXRpb24sICR1aVZpZXdTY3JvbGxQcm92aWRlciwgJGh0dHBQcm92aWRlcikge1xuXG4gICAgICAgIFJlc3Rhbmd1bGFyUHJvdmlkZXIuc2V0QmFzZVVybCgnL2FwaScpO1xuICAgICAgICBSZXN0YW5ndWxhclByb3ZpZGVyLnNldERlZmF1bHRIdHRwRmllbGRzKHtcbiAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IENvbmZpZ3VyYXRpb24udGltZW91dEluTWlsbGlzLFxuICAgICAgICAgICAgY2FjaGU6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJycsICcvbGFuZGluZycpLm90aGVyd2lzZSgnL2xhbmRpbmcnKTtcblxuICAgICAgICAvLyBzY3JvbGxzIHRvIHRvcCBvZiBwYWdlIG9uIHN0YXRlIGNoYW5nZVxuICAgICAgICAkdWlWaWV3U2Nyb2xsUHJvdmlkZXIudXNlQW5jaG9yU2Nyb2xsKCk7XG5cbiAgICB9KVxuICAgIC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgXG4gICAgICAgIENvbmZpZ3VyYXRpb24sIFxuICAgICAgICAkc3RhdGUsIFxuICAgICAgICAkc2Vzc2lvblN0b3JhZ2UpIHtcblxuICAgICAgICAkcm9vdFNjb3BlLmFwcE5hbWUgPSBDb25maWd1cmF0aW9uLmFwcE5hbWU7XG4gICAgICAgICRyb290U2NvcGUuY29tcGFueUNvZGUgPSBDb25maWd1cmF0aW9uLmNvbXBhbnlDb2RlO1xuXG5cbiAgICAgICAgJHN0YXRlLmdvKCdsYW5kaW5nJyk7XG5cbiAgICAgICAgLy9hdXRoIGNoZWNrIGV2ZXJ5IHRpbWUgdGhlIHN0YXRlL3BhZ2UgY2hhbmdlc1xuICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xuICAgICAgICAgICAgLy8gJHJvb3RTY29wZS5zdGF0ZUNoYW5nZUF1dGhDaGVjayhldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcyk7XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgLy9FVkVOVCBCQU5LXG4gICAgICAgIC8qXG4gICAgICAgICRyb290U2NvcGUuJG9uKCdhdXRoLWxvZ291dC1zdWNjZXNzJywgZnVuY3Rpb24oZXZlbnQsIGFyZ3MpIHtcbiAgICAgICAgfSk7Ki9cblxuXG5cbiAgICB9KVxuXG4gICAgLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnZmguZmluZEFuZEVkaXQnLCBbXG4gICd1aS5zZWxlY3QnLFxuICAnbmdTdG9yYWdlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiBob21lQ29uZmlnKCAkc3RhdGVQcm92aWRlciApIHtcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2ZpbmRBbmRFZGl0Jywge1xuICAgIHVybDogJy9maW5kQW5kRWRpdCcsXG4gICAgdmlld3M6IHtcbiAgICAgIG1haW46IHtcbiAgICAgICAgY29udHJvbGxlcjogJ0ZpbmRBbmRFZGl0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnZmluZEFuZEVkaXQvZmluZEFuZEVkaXQudHBsLmh0bWwnXG4gICAgICB9XG4gICAgfSxcbiAgICBwYWdlVGl0bGU6ICdGaW5kIEFuZCBFZGl0JyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGxDbGFzc2VzOiBmdW5jdGlvbiggJGh0dHAsICRzZXNzaW9uU3RvcmFnZSApIHtcbiAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIHVybDogJ2FwaS9jbGFzc2VzL2FsbCcsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgand0OiAkc2Vzc2lvblN0b3JhZ2Uuand0XG4gICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICggcmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ0ZpbmRBbmRFZGl0Q29udHJvbGxlcicsIGZ1bmN0aW9uKCAkc2NvcGUsICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UsIGFsbENsYXNzZXMsICR0aW1lb3V0ICkge1xuICB2YXIgUEFQRVJTX1VSTCAgICAgICAgICAgICAgICAgICAgICAgPSAnL2FwaS9wYXBlcnMnO1xuICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnand0J10gPSAkc2Vzc2lvblN0b3JhZ2Uuand0O1xuICAkc2NvcGUucXVlcnkgICAgICAgICAgICAgICAgICAgICAgICAgPSB7fTtcbiAgJHNjb3BlLmVkaXREYXRhICAgICAgICAgICAgICAgICAgICAgID0ge307XG4gICRzY29wZS5hbGxDbGFzc2VzICAgICAgICAgICAgICAgICAgICA9IGFsbENsYXNzZXM7XG5cbiAgJHNjb3BlLnNlYXNvbnMgPSBbXG4gICAge25hbWU6ICdTcHJpbmcnLCBjb2RlOiBcIlNQXCJ9LFxuICAgIHtuYW1lOiAnU3VtbWVyJywgY29kZTogXCJTVVwifSxcbiAgICB7bmFtZTogJ0ZhbGwnLCBjb2RlOiBcIkZBXCJ9LFxuICAgIHtuYW1lOiAnV2ludGVyJywgY29kZTogXCJXSVwifVxuICBdO1xuICAkc2NvcGUueWVhcnMgPSBbXG4gICAge25hbWU6ICc5NScsIGNvZGU6ICc5NSd9LFxuICAgIHtuYW1lOiAnOTYnLCBjb2RlOiAnOTYnfSxcbiAgICB7bmFtZTogJzk3JywgY29kZTogJzk3J30sXG4gICAge25hbWU6ICc5OCcsIGNvZGU6ICc5OCd9LFxuICAgIHtuYW1lOiAnOTknLCBjb2RlOiAnOTknfSxcbiAgICB7bmFtZTogJzAwJywgY29kZTogJzAwJ30sXG4gICAge25hbWU6ICcwMScsIGNvZGU6ICcwMSd9LFxuICAgIHtuYW1lOiAnMDInLCBjb2RlOiAnMDInfSxcbiAgICB7bmFtZTogJzAzJywgY29kZTogJzAzJ30sXG4gICAge25hbWU6ICcwNCcsIGNvZGU6ICcwNCd9LFxuICAgIHtuYW1lOiAnMDUnLCBjb2RlOiAnMDUnfSxcbiAgICB7bmFtZTogJzA2JywgY29kZTogJzA2J30sXG4gICAge25hbWU6ICcwNycsIGNvZGU6ICcwNyd9LFxuICAgIHtuYW1lOiAnMDgnLCBjb2RlOiAnMDgnfSxcbiAgICB7bmFtZTogJzA5JywgY29kZTogJzA5J30sXG4gICAge25hbWU6ICcxMCcsIGNvZGU6ICcxMCd9LFxuICAgIHtuYW1lOiAnMTEnLCBjb2RlOiAnMTEnfSxcbiAgICB7bmFtZTogJzEyJywgY29kZTogJzEyJ30sXG4gICAge25hbWU6ICcxMycsIGNvZGU6ICcxMyd9LFxuICAgIHtuYW1lOiAnMTQnLCBjb2RlOiAnMTQnfSxcbiAgICB7bmFtZTogJzE1JywgY29kZTogJzE1J31cbiAgXTtcbiAgJHNjb3BlLnR5cGVzID0gW1xuICAgIHtuYW1lOiAnSG9tZXdvcmsnLCBjb2RlOiAnSCd9LFxuICAgIHtuYW1lOiAnTWlkdGVybScsIGNvZGU6ICdNJ30sXG4gICAge25hbWU6ICdOb3RlcycsIGNvZGU6ICdOJ30sXG4gICAge25hbWU6ICdRdWl6JywgY29kZTogJ1EnfSxcbiAgICB7bmFtZTogJ0ZpbmFsJywgY29kZTogJ0YnfSxcbiAgICB7bmFtZTogJ0xhYicsIGNvZGU6ICdMJ31cbiAgXTtcblxuICAkc2NvcGUuZmluZENsYXNzZXMgPSBmdW5jdGlvbiggcXVlcnkgKSB7XG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIHVybDogUEFQRVJTX1VSTCArICcvY2xhc3NBbmRUeXBlL2NsYXNzLycgKyBxdWVyeS5jbGFzc0lkIC8vKyAnL3R5cGUvJyArIHF1ZXJ5LnR5cGVDb2RlXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgJHNjb3BlLnBhcGVycyA9IHJlcy5kYXRhO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLiR3YXRjaCgncGFwZXJzJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCAhJHNjb3BlLnBhcGVycyApIHJldHVybjtcbiAgICBcbiAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8ICRzY29wZS5wYXBlcnMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgIHJlbmRlclBkZiggJHNjb3BlLnBhcGVyc1sgaSBdICk7XG4gICAgICB9XG4gICAgfSwgMTAwKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gcmVuZGVyUGRmKCBwYXBlciApIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIHBhcGVyLl9pZCApO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoIHBhcGVyICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoIHBhcGVyLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKCBwYWdlICkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gLjQ7XG4gICAgICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgICAgICBjYW52YXNDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICAgICAgfTtcbiAgICAgICAgICBwYWdlLnJlbmRlcihyZW5kZXJDb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH1cblxuICAkc2NvcGUuc2hvd0VkaXRQYW5lbCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgJHNjb3BlWyAnb3BlbkVkaXRQYW5lbC0nICsgaWQgXSA9ICEkc2NvcGVbICdvcGVuRWRpdFBhbmVsLScgKyBpZCBdO1xuICB9O1xuXG4gICRzY29wZS5pc0VkaXRQYW5lbE9wZW4gPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiAhISRzY29wZVsgJ29wZW5FZGl0UGFuZWwtJyArIGlkIF07XG4gIH07XG5cbiAgJHNjb3BlLnN1Ym1pdEVkaXRlZFBhcGVyID0gZnVuY3Rpb24oIHBhcGVyLCBuZXdEYXRhICkge1xuICAgIHB1dE9iaiA9IHtcbiAgICAgIHRpdGxlOiBuZXdEYXRhLnRpdGxlLFxuICAgICAgcGVyaW9kOiBuZXdEYXRhLnNlYXNvbiArIG5ld0RhdGEueWVhcixcbiAgICAgIHR5cGU6IG5ld0RhdGEudHlwZSxcbiAgICAgIGNsYXNzSWQ6IG5ld0RhdGEuY2xhc3NJZFxuICAgIH07XG5cbiAgICBwYXBlci5zdWNjZXNzID0gJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgIHVybDogJ2FwaS9wYXBlcnMvc2luZ2xlLycgKyBwYXBlci5faWQsXG4gICAgICBkYXRhOiBwdXRPYmpcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICBjb25zb2xlLmxvZyggcmVzICk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5lcnJvciAoIGVyciApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICB9O1xuXG5cbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5ob21lJywgW1xuICAndWkuc2VsZWN0JyxcbiAgJ25nU3RvcmFnZScsXG4gICduZ0ZpbGVVcGxvYWQnLFxuICAnZmguc2VydmljZXMuRm9jdXNTZXJ2aWNlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiBob21lQ29uZmlnKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgIHVybDogJy9ob21lJyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnSG9tZUNvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2hvbWUvaG9tZS50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ0hvbWUnLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsbENsYXNzZXM6IGZ1bmN0aW9uKCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlICkge1xuICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgdXJsOiAnYXBpL2NsYXNzZXMvYWxsJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBqd3Q6ICRzZXNzaW9uU3RvcmFnZS5qd3RcbiAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICB0b2tlbnM6IGZ1bmN0aW9uKCAkaHR0cCApIHtcbiAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIHVybDogJ2Fzc2V0cy90b2tlbnMuanNvbidcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ0hvbWVDb250cm9sbGVyJywgZnVuY3Rpb24oICRzY29wZSwgJGh0dHAsICRzZXNzaW9uU3RvcmFnZSwgJHRpbWVvdXQsIGdpdmVGb2N1cywgVXBsb2FkLCBhbGxDbGFzc2VzLCB0b2tlbnMgKSB7XG4gIHZhciBQQVBFUlNfVVJMID0gJy9hcGkvcGFwZXJzJztcbiAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ2p3dCddID0gJHNlc3Npb25TdG9yYWdlLmp3dDtcbiAgJHNjb3BlLmFsbENsYXNzZXMgPSBhbGxDbGFzc2VzO1xuXG4gICRzY29wZS4kd2F0Y2goJ2ZpbGVzJywgZnVuY3Rpb24oKSB7XG4gICAgJHNjb3BlLnVwbG9hZCggJHNjb3BlLmZpbGVzICk7XG4gIH0pO1xuXG4gICRzY29wZS4kd2F0Y2goJ2ZpbGUnLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoJHNjb3BlLmZpbGUgIT0gbnVsbCkge1xuICAgICAgJHNjb3BlLnVwbG9hZChbJHNjb3BlLmZpbGVdKTtcbiAgICB9XG4gIH0pO1xuXG4gICRzY29wZS5sb2cgICAgICAgICAgPSAnJztcbiAgJHNjb3BlLnBhcGVyc1RvRWRpdCA9IFtdO1xuICAkc2NvcGUuZWRpdERhdGEgICAgID0ge307XG5cbiAgJHNjb3BlLnNlYXNvbnMgPSBbXG4gICAge25hbWU6ICdTcHJpbmcnLCBjb2RlOiBcIlNQXCJ9LFxuICAgIHtuYW1lOiAnU3VtbWVyJywgY29kZTogXCJTVVwifSxcbiAgICB7bmFtZTogJ0ZhbGwnLCBjb2RlOiBcIkZBXCJ9LFxuICAgIHtuYW1lOiAnV2ludGVyJywgY29kZTogXCJXSVwifVxuICBdO1xuICAkc2NvcGUueWVhcnMgPSBbXG4gICAge25hbWU6ICc5NScsIGNvZGU6ICc5NSd9LFxuICAgIHtuYW1lOiAnOTYnLCBjb2RlOiAnOTYnfSxcbiAgICB7bmFtZTogJzk3JywgY29kZTogJzk3J30sXG4gICAge25hbWU6ICc5OCcsIGNvZGU6ICc5OCd9LFxuICAgIHtuYW1lOiAnOTknLCBjb2RlOiAnOTknfSxcbiAgICB7bmFtZTogJzAwJywgY29kZTogJzAwJ30sXG4gICAge25hbWU6ICcwMScsIGNvZGU6ICcwMSd9LFxuICAgIHtuYW1lOiAnMDInLCBjb2RlOiAnMDInfSxcbiAgICB7bmFtZTogJzAzJywgY29kZTogJzAzJ30sXG4gICAge25hbWU6ICcwNCcsIGNvZGU6ICcwNCd9LFxuICAgIHtuYW1lOiAnMDUnLCBjb2RlOiAnMDUnfSxcbiAgICB7bmFtZTogJzA2JywgY29kZTogJzA2J30sXG4gICAge25hbWU6ICcwNycsIGNvZGU6ICcwNyd9LFxuICAgIHtuYW1lOiAnMDgnLCBjb2RlOiAnMDgnfSxcbiAgICB7bmFtZTogJzA5JywgY29kZTogJzA5J30sXG4gICAge25hbWU6ICcxMCcsIGNvZGU6ICcxMCd9LFxuICAgIHtuYW1lOiAnMTEnLCBjb2RlOiAnMTEnfSxcbiAgICB7bmFtZTogJzEyJywgY29kZTogJzEyJ30sXG4gICAge25hbWU6ICcxMycsIGNvZGU6ICcxMyd9LFxuICAgIHtuYW1lOiAnMTQnLCBjb2RlOiAnMTQnfSxcbiAgICB7bmFtZTogJzE1JywgY29kZTogJzE1J31cbiAgXTtcbiAgJHNjb3BlLnR5cGVzID0gW1xuICAgIHtuYW1lOiAnSG9tZXdvcmsnLCBjb2RlOiAnSCd9LFxuICAgIHtuYW1lOiAnTWlkdGVybScsIGNvZGU6ICdNJ30sXG4gICAge25hbWU6ICdOb3RlcycsIGNvZGU6ICdOJ30sXG4gICAge25hbWU6ICdRdWl6JywgY29kZTogJ1EnfSxcbiAgICB7bmFtZTogJ0ZpbmFsJywgY29kZTogJ0YnfSxcbiAgICB7bmFtZTogJ0xhYicsIGNvZGU6ICdMJ31cbiAgXTtcblxuICAkc2NvcGUudXBsb2FkID0gZnVuY3Rpb24oIGZpbGVzICkge1xuICAgIGlmIChmaWxlcyAmJiBmaWxlcy5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGZpbGUgPSBmaWxlc1tpXTtcblxuICAgICAgICBVcGxvYWQudXBsb2FkKHtcbiAgICAgICAgICB1cmw6IFBBUEVSU19VUkwsXG4gICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICB9KVxuXG4gICAgICAgIC5wcm9ncmVzcyhmdW5jdGlvbiAoIGV2dCApIHtcbiAgICAgICAgICB2YXIgcHJvZ3Jlc3NQZXJjZW50YWdlID0gcGFyc2VJbnQoMTAwLjAgKiBldnQubG9hZGVkIC8gZXZ0LnRvdGFsKTtcbiAgICAgICAgICAkc2NvcGUubG9nID0gJ3Byb2dyZXNzOiAnICsgXG4gICAgICAgICAgICBwcm9ncmVzc1BlcmNlbnRhZ2UgKyBcbiAgICAgICAgICAgICclJyArIFxuICAgICAgICAgICAgZXZ0LmNvbmZpZy5maWxlLm5hbWUgKyBcbiAgICAgICAgICAgICdcXG4nICsgXG4gICAgICAgICAgICAkc2NvcGUubG9nO1xuICAgICAgICB9KVxuXG4gICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKCBkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZyApIHtcbiAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgJHNjb3BlLmxvZyA9ICdmaWxlOiAnICsgXG4gICAgICAgICAgICAgIGNvbmZpZy5maWxlLm5hbWUgKyBcbiAgICAgICAgICAgICAgJywgUmVzcG9uc2U6ICcgKyBcbiAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoIGRhdGEudGl0bGUgKSArIFxuICAgICAgICAgICAgICAnLCBJRDogJyArXG4gICAgICAgICAgICAgIGRhdGEuX2lkXG4gICAgICAgICAgICAgICdcXG4nICsgXG4gICAgICAgICAgICAgICRzY29wZS5sb2c7XG5cbiAgICAgICAgICAgICRzY29wZS5wYXBlcnNUb0VkaXQucHVzaCggZGF0YSApO1xuXG4gICAgICAgICAgICBnaXZlRm9jdXMoJ3NlYXNvbi1waWNrZXInKTtcblxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnN1Ym1pdEVkaXRlZFBhcGVyID0gZnVuY3Rpb24oIHBhcGVyLCBuZXdEYXRhICkge1xuICAgIHB1dE9iaiA9IHtcbiAgICAgIHRpdGxlOiBuZXdEYXRhLnRpdGxlLFxuICAgICAgcGVyaW9kOiBuZXdEYXRhLnNlYXNvbiArIG5ld0RhdGEueWVhcixcbiAgICAgIHR5cGU6IG5ld0RhdGEudHlwZSxcbiAgICAgIGNsYXNzSWQ6IG5ld0RhdGEuY2xhc3NJZFxuICAgIH07XG5cbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgdXJsOiAnYXBpL3BhcGVycy9zaW5nbGUvJyArIHBhcGVyLl9pZCxcbiAgICAgIGRhdGE6IHB1dE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgIGNvbnNvbGUubG9nKCByZXMgKTtcbiAgICAgICRzY29wZS5wYXBlclRvRWRpdEJhY2tTdG9yZSA9ICRzY29wZS5wYXBlcnNUb0VkaXQuc2hpZnQoKTtcbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5lcnJvciAoIGVyciApO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIHJlLXJlbmRlcnMgdGhlIG1haW4gY2FudmFzIHVwb24gY2hhbmdlXG4gICRzY29wZS4kd2F0Y2goJ3BhcGVyc1RvRWRpdFswXScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbi12aWV3ZXInKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgaWYgKCAkc2NvcGUucGFwZXJzVG9FZGl0WzBdICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoICRzY29wZS5wYXBlcnNUb0VkaXRbMF0uaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24ocGFnZSkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMC44O1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9KTtcblxuICAvLyByZS1yZW5kZXJzIHRoZSBzZWNvbmRhcnkgY2FudmFzIHVwb24gY2hhbmdlXG4gICRzY29wZS4kd2F0Y2goJ3BhcGVyc1RvRWRpdFsxXScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV4dC11cC1wZGYtY29udGFpbmVyJyk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggJHNjb3BlLnBhcGVyc1RvRWRpdFsxXSApIHtcbiAgICAgIFBERkpTLmdldERvY3VtZW50KCAkc2NvcGUucGFwZXJzVG9FZGl0WzFdLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKHBhZ2UpIHtcblxuICAgICAgICAgIHZhciBzY2FsZSA9IDAuMjtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgJHNjb3BlLmFkZENsYXNzID0gZnVuY3Rpb24oIG5ld0NsYXNzICkge1xuICAgIHZhciBwb3N0T2JqID0ge3RpdGxlOiBuZXdDbGFzc307XG5cbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogJy9hcGkvY2xhc3NlcycsXG4gICAgICBkYXRhOiBwb3N0T2JqXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogJy9hcGkvY2xhc3Nlcy9hbGwnXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXMgKSB7XG4gICAgICAgICRzY29wZS5hbGxDbGFzc2VzID0gcmVzLmRhdGE7XG4gICAgICB9KTtcblxuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmFkZFRva2VucyA9IGZ1bmN0aW9uKCkge1xuICAgIHRva2Vucy50b2tlbnMuZm9yRWFjaCggZnVuY3Rpb24oIHRva2VuLCBpbmRleCwgYXJyYXkpIHtcbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgIHVybDogJy9hcGkvbWFrZVRva2VuJyxcbiAgICAgICAgZGF0YTogdG9rZW5cbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3llcycpO1xuICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZGRkZGRkZGRkZVVVVVVScsIGVycik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfTtcblxuXG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5sYW5kaW5nJyxbXG4gICduZ1N0b3JhZ2UnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uICggJHN0YXRlUHJvdmlkZXIgKSB7XG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsYW5kaW5nJywge1xuICAgIHVybDogJy8nLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdMYW5kaW5nQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnbGFuZGluZy9sYW5kaW5nLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnbGFuZGluZ1BhZ2UucGFnZVRpdGxlJ1xuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdMYW5kaW5nQ29udHJvbGxlcicsIGZ1bmN0aW9uICggJHNjb3BlLCAkc3RhdGUsICRodHRwLCAkYmFzZTY0LCAkc2Vzc2lvblN0b3JhZ2UpIHtcbiAgdmFyIFVTRVJTX1VSTCA9ICcvYXBpL3VzZXJzJztcblxuICAkc2NvcGUucmVnaXN0ZXIgPSBmdW5jdGlvbiggY3JlZGVudGlhbHMgKSB7XG4gICAgdmFyIG5ld1VzZXIgPSB7XG4gICAgICBuYW1lOiBjcmVkZW50aWFscy5uYW1lLFxuICAgICAgcGhvbmU6IGNyZWRlbnRpYWxzLnBob25lLFxuICAgICAgZW1haWw6IGNyZWRlbnRpYWxzLmVtYWlsLFxuICAgICAgcGFzc3dvcmQ6IGNyZWRlbnRpYWxzLnBhc3N3b3JkLFxuICAgICAgcGFzc3dvcmRDb25maXJtOiBjcmVkZW50aWFscy5wYXNzd29yZENvbmZpcm0sXG4gICAgICB0b2tlbjogY3JlZGVudGlhbHMuYWRkQ29kZVxuICAgIH07XG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICB1cmw6IFVTRVJTX1VSTCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfSxcbiAgICAgIGRhdGE6IG5ld1VzZXJcbiAgICB9KVxuICAgIC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGNvbnNvbGUuZGlyKGRhdGEpO1xuICAgICAgJHNjb3BlLnJlZ2lzdGVyQ3JlZGVudGlhbHMgPSB7fTtcbiAgICB9KVxuICAgIC5lcnJvcihmdW5jdGlvbihlcnIpIHtcbiAgICAgIGNvbnNvbGUuZGlyKGVycik7XG4gICAgICAkc2NvcGUucmVnaXN0ZXJDcmVkZW50aWFscy5wYXNzd29yZCA9ICcnO1xuICAgICAgJHNjb3BlLnJlZ2lzdGVyQ3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtID0gJyc7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcblxuICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRob3JpemF0aW9uJ10gPSBcbiAgICAgICdCYXNpYyAnICsgXG4gICAgICAkYmFzZTY0LmVuY29kZShjcmVkZW50aWFscy5lbWFpbCArIFxuICAgICAgJzonICsgXG4gICAgICBjcmVkZW50aWFscy5wYXNzd29yZCk7XG4gICAgXG4gICAgJGh0dHAuZ2V0KFVTRVJTX1VSTClcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY29uc29sZS5kaXIoZGF0YSk7XG4gICAgICAgICRzZXNzaW9uU3RvcmFnZS5qd3QgPSBkYXRhLmp3dDtcbiAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgICBjb25zb2xlLmRpcihlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5zZWFyY2gnLCBbXG4gICd1aS5zZWxlY3QnLFxuICAnbmdTdG9yYWdlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiBzZWFyY2hDb25maWcoJHN0YXRlUHJvdmlkZXIpIHtcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NlYXJjaCcsIHtcbiAgICB1cmw6ICcvc2VhcmNoJyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnU2VhcmNoQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnc2VhcmNoL3NlYXJjaC50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ1NlYXJjaCcsXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxsQ2xhc3NlczogZnVuY3Rpb24oICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UgKSB7XG4gICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIGp3dDogJHNlc3Npb25TdG9yYWdlLmp3dFxuICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ1NlYXJjaENvbnRyb2xsZXInLCBmdW5jdGlvbiggJHNjb3BlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCBhbGxDbGFzc2VzICkge1xuICAkc2NvcGUuZmluZFBhcGVyc0J5Q2xhc3MgPSBmdW5jdGlvbigpIHtcbiAgICBcbiAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5kaXJlY3RpdmVzLm1haW5IZWFkZXInLCBbXG4gICAgJ25nU3RvcmFnZScsXG4gICAgJ0FwcGxpY2F0aW9uQ29uZmlndXJhdGlvbidcbl0pXG5cbi5kaXJlY3RpdmUoJ21haW5IZWFkZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2RpcmVjdGl2ZXMvbWFpbkhlYWRlci9tYWluSGVhZGVyLnRwbC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oICRzY29wZSwgJHN0YXRlICkge1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5kaXJlY3RpdmVzLm1vZGFscy5zaG93UGRmTW9kYWwnLCBbXG4gICd1aS5ib290c3RyYXAnLFxuICAnZmguc2VydmljZXMuTW9kYWxTZXJ2aWNlJ1xuXSlcblxuLmRpcmVjdGl2ZSgnc2hvd1BkZk1vZGFsJywgZnVuY3Rpb24oIE1vZGFsU2VydmljZSApIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0FFJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIE1vZGFsU2VydmljZS5vcGVuTW9kYWwoe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9tb2RhbHMvc2hvd1BkZk1vZGFsL3Nob3dQZGZNb2RhbC50cGwuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlcjogJ1Nob3dQZGZNb2RhbENvbnRyb2xsZXInLFxuICAgICAgICAgIHdpbmRvd0NsYXNzOiAnc2hvdy1wZGYtbW9kYWwnLFxuICAgICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgICBrZXlib2FyZDogZmFsc2UsXG4gICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgcGFwZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2NvcGUucGFwZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn0pXG5cbi5jb250cm9sbGVyKCdTaG93UGRmTW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkdGltZW91dCwgTW9kYWxTZXJ2aWNlLCBwYXBlcikge1xuICAkc2NvcGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICBNb2RhbFNlcnZpY2UuY2xvc2VNb2RhbCgpO1xuICB9O1xuICAkc2NvcGUubW9kYWxJZCA9IHBhcGVyLl9pZCArICdtb2RhbCc7XG4gICRzY29wZS5wYXBlciA9IHBhcGVyXG5cbiAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBhcGVyLl9pZCArICdtb2RhbCcpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoIHBhcGVyICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoIHBhcGVyLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKCBwYWdlICkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMTtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfSwgNTApO1xuICAgIFxufSk7IiwiXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lIG9sY2kuc2VydmljZXMuRmluZEltYWdlU2VydmljZVxuICogQGRlc2NyaXB0aW9uIFNlcnZpY2UgdGhhdCBmaW5kcyBhbmQgcmV0dXJucyBhIHByb21pc2UgZm9yIGltYWdlIHNyYyBzdHJpbmdzLlxuICovXG5hbmd1bGFyLm1vZHVsZSgnZmguc2VydmljZXMuRmluZEltYWdlU2VydmljZScsIFtcbiAgICAgICAgJ25nU3RvcmFnZScsXG4gICAgICAgICd2ZW5kb3Iuc3RlZWxUb2UnXG4gICAgXSlcblxuLmZhY3RvcnkoJ0ZpbmRJbWFnZVNlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkcSwgc3RlZWxUb2UpIHtcbiAgICAvLyBDaGVja3MgaWYgaW1hZ2UgZXhpc3RzLiAgUmV0dXJucyBkZWZhdWx0IGltYWdlIHNvdXJjZSBpZiBpdCBkb2Vzbid0LlxuICAgIC8vIFByaXZhdGUgaGVscGVyIG1ldGhvZC5cbiAgICBmdW5jdGlvbiBpc0ltYWdlKHNyYywgZGVmYXVsdFNyYykge1xuXG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltYWdlLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdlcnJvcjogJyArIHNyYyArICcgbm90IGZvdW5kJyk7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBkZWZhdWx0U3JjICk7XG4gICAgICAgIH07XG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSggc3JjICk7XG4gICAgICAgIH07XG4gICAgICAgIGltYWdlLnNyYyA9IHNyYztcblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAgICAgKiBAbmFtZSBvbGNpLnNlcnZpY2VzLkZpbmRJbWFnZVNlcnZpY2UjaXRpbmVyYXJ5SW1hZ2VcbiAgICAgICAgICogQG1ldGhvZE9mIG9sY2kuc2VydmljZXMuRmluZEltYWdlU2VydmljZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gR2VuZXJhdGUgYSBVUkwgZm9yIGl0aW5lcmFyeSBpbWFnZS4gIElmIGdlbmVyYXRlZCBVUkwgaXMgbm90IHZhbGlkLCByZXR1cm4gZGVmYXVsdCBpbWFnZSBVUkwuXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IGEgcHJvbWlzZSBvYmplY3QgdGhhdCByZXR1cm5zIGEgcmVsYXRpdmUgVVJMIGZvciB0aGUgcmVzb3VyY2VcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgIDxwcmU+XG4gICAgICAgICAnT0xDSV9kZXN0X0EuanBnJ1xuICAgICAgICAgPC9wcmU+XG4gICAgICAgICAqICovXG4gICAgICAgIGl0aW5lcmFyeUltYWdlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkZXN0Q29kZSA9IHN0ZWVsVG9lLmRvKCRzZXNzaW9uU3RvcmFnZSkuZ2V0KCdib29raW5nSW5mby5kZXN0aW5hdGlvbkNvZGUnKSB8fCAnJztcbiAgICAgICAgICAgIHJldHVybiBpc0ltYWdlKFxuICAgICAgICAgICAgICAgICcuL2Fzc2V0cy9pbWFnZXMvb25ib2FyZC9PTENJX2Rlc3RfJyArIGRlc3RDb2RlLnNsaWNlKDAsIDEpICsgJy5qcGcnLFxuICAgICAgICAgICAgICAgICcuL2Fzc2V0cy9pbWFnZXMvb25ib2FyZC9PTENJX2Rlc3RfZGVmYXVsdC5qcGcnXG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuXG4gICAgICAgIGdldEhlYWRlckltYWdlOiBmdW5jdGlvbihjb21wYW55Q29kZSkge1xuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gJy4vYXNzZXRzL2ltYWdlcy9oZWFkZXJJbWFnZS5qcGcnO1xuICAgICAgICAgICAgcmV0dXJuIGlzSW1hZ2UoaW1hZ2VVcmwpO1xuICAgICAgICB9LFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgICAgICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlI2Jvb2tpbmdTdW1tYXJ5SW1hZ2VcbiAgICAgICAgICogQG1ldGhvZE9mIG9sY2kuc2VydmljZXMuRmluZEltYWdlU2VydmljZVxuICAgICAgICAgKiBAZGVzY3JpcHRpb24gR2VuZXJhdGUgYSBVUkwgZm9yIGJvb2tpbmcgc3VtbWFyeSBpbWFnZS4gIElmIGdlbmVyYXRlZCBVUkwgaXMgbm90IHZhbGlkLCByZXR1cm4gZGVmYXVsdCBpbWFnZSBVUkwuXG4gICAgICAgICAqIEByZXR1cm5zIHtvYmplY3R9IGEgcHJvbWlzZSBvYmplY3QgdGhhdCByZXR1cm5zIGEgcmVsYXRpdmUgVVJMIGZvciB0aGUgcmVzb3VyY2VcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgIDxwcmU+XG4gICAgICAgICAnT0xDSV9kZXN0X0FfMi5qcGcnXG4gICAgICAgICA8L3ByZT5cbiAgICAgICAgICogKi9cbiAgICAgICAgYm9va2luZ1N1bW1hcnlJbWFnZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZGVzdENvZGUgPSBzdGVlbFRvZS5kbygkc2Vzc2lvblN0b3JhZ2UpLmdldCgnYm9va2luZ0luZm8uZGVzdGluYXRpb25Db2RlJykgfHwgW107XG4gICAgICAgICAgICByZXR1cm4gaXNJbWFnZShcbiAgICAgICAgICAgICAgICAnLi9hc3NldHMvaW1hZ2VzL29uYm9hcmQvT0xDSV9kZXN0XycgKyBkZXN0Q29kZS5zbGljZSgwLCAxKSArICdfMi5qcGcnLFxuICAgICAgICAgICAgICAgICcuL2Fzc2V0cy9pbWFnZXMvb25ib2FyZC9PTENJX2Rlc3RfZGVmYXVsdF8yLmpwZydcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbWFyaW5lckltYWdlOiBmdW5jdGlvbihtYXJpbmVyTnVtKSB7XG4gICAgICAgICAgICBpZiAoIW1hcmluZXJOdW0pIHJldHVybiAnJztcbiAgICAgICAgICAgIHJldHVybiBpc0ltYWdlKFxuICAgICAgICAgICAgICAgICcuL2Fzc2V0cy9zdGFyX21hcmluZXIvJyArIG1hcmluZXJOdW0gKyAnc3Rhck1hcmluZXIuZ2lmJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfSxcblxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICAgICAqIEBuYW1lIG9sY2kuc2VydmljZXMuRmluZEltYWdlU2VydmljZSNzdGF0ZVJvb21JbWFnZVxuICAgICAgICAgKiBAbWV0aG9kT2Ygb2xjaS5zZXJ2aWNlcy5GaW5kSW1hZ2VTZXJ2aWNlXG4gICAgICAgICAqIEBkZXNjcmlwdGlvbiBHZW5lcmF0ZSBhIFVSTCBzdGF0ZXJvb20gaW1hZ2UuICBJZiBnZW5lcmF0ZWQgVVJMIGlzIG5vdCB2YWxpZCwgcmV0dXJuIGRlZmF1bHQgaW1hZ2UgVVJMLlxuICAgICAgICAgKiBAcmV0dXJucyB7b2JqZWN0fSBhIHByb21pc2Ugb2JqZWN0IHRoYXQgcmV0dXJucyBhIHJlbGF0aXZlIFVSTCBmb3IgdGhlIHJlc291cmNlXG4gICAgICAgICAqIEBleGFtcGxlXG4gICAgICAgICA8cHJlPlxuICAgICAgICAgJ0FNX09MQ0lfc3RhdGVyb29tX25lcHR1bmUuanBnJ1xuICAgICAgICAgPC9wcmU+XG4gICAgICAgICAqICovXG4gICAgICAgIHN0YXRlcm9vbUltYWdlOiBmdW5jdGlvbigpIHsgXG4gICAgICAgICAgICB2YXIgY2FiaW5DYXRlZ29yaWVzID0gWyBcbiAgICAgICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ2ludGVyaW9yJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdJJywgJ0onLCAnSycsICdMJywgJ00nLCAnTU0nLCAnTicsICdOTicsICdJQScsICdJUScsICdSJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgIHsgIC8vIFRPRE86IFRoaXMgbWF5IG5vdCBiZSByZWFsLlxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ2luc2lkZScsIFxuICAgICAgICAgICAgICAgICAgICBjb2RlczogWyAnSVMnIF0gIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnb2NlYW4nLCBcbiAgICAgICAgICAgICAgICAgICAgY29kZXM6IFsgJ0MnLCAnQ0EnLCAnQ1EnLCAnRCcsICdEQScsICdERCcsICdFJywgJ0VFJywgJ0YnLCAnRkEnLCAnRkInLCAnRkYnLCAnRycsICdIJywgJ0hIJywgJ0dHJywgJ09PJywgJ1EnIF0gXG4gICAgICAgICAgICAgICAgfSwgXG4gICAgICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnk6ICd2aXN0YScsIFxuICAgICAgICAgICAgICAgICAgICBjb2RlczogWyAnQScsICdBQScsICdBQicsICdBUycsICdCJywgJ0JBJywgJ0JCJywgJ0JDJywgJ0JRJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnbmVwdHVuZScsIFxuICAgICAgICAgICAgICAgICAgICBjb2RlczogWyAnUycsICdTQScsICdTQicsICdTQycsICdTUScgXSBcbiAgICAgICAgICAgICAgICB9LCBcbiAgICAgICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ3Bpbm5hY2xlJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdQUycgXSBcbiAgICAgICAgICAgICAgICB9LCBcbiAgICAgICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ3ZlcmFuZGFoJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdWJywgJ1ZBJywgJ1ZCJywgJ1ZDJywgJ1ZEJywgJ1ZFJywgJ1ZGJywgJ1ZIJywgJ1ZRJywgJ1ZTJywgJ1ZUJyBdIFxuICAgICAgICAgICAgICAgIH0sIFxuICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgIGNhdGVnb3J5OiAnc2lnbmF0dXJlJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdTUycsICdTWScsICdTWicsICdTVScgXSBcbiAgICAgICAgICAgICAgICB9LCBcbiAgICAgICAgICAgICAgICB7IFxuICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeTogJ2xhbmFpJywgXG4gICAgICAgICAgICAgICAgICAgIGNvZGVzOiBbICdDQScgXSBcbiAgICAgICAgICAgICAgICB9LCBcbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICB2YXIgc2hpcENvZGUgPSBzdGVlbFRvZS5kbygkc2Vzc2lvblN0b3JhZ2UpLmdldCgnYm9va2luZ0luZm8uc2hpcENvZGUnKSB8fCAnJztcbiAgICAgICAgICAgIHNoaXBDb2RlLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgICAgICB2YXIgY2FiaW5DYXRlZ29yeSA9IHN0ZWVsVG9lLmRvKCRzZXNzaW9uU3RvcmFnZSkuZ2V0KCdib29raW5nSW5mby5zdGF0ZXJvb21DYXRlZ29yeScpIHx8ICcnO1xuICAgICAgICAgICAgY2FiaW5DYXRlZ29yeS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgdmFyIGNhdGVnb3J5ID0gJ2RlZmF1bHQnO1xuICAgICAgICAgICAgdmFyIGNhdGVnb3J5Q291bnQgPSBjYWJpbkNhdGVnb3JpZXMubGVuZ3RoO1xuXG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCBjYXRlZ29yeUNvdW50OyBpKysgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBjYWJpbkNhdGVnb3JpZXNbaV0uY29kZXMuaW5kZXhPZiggY2FiaW5DYXRlZ29yeSApICE9PSAtMSApIHtcbiAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnkgPSBjYWJpbkNhdGVnb3JpZXNbaV0uY2F0ZWdvcnkudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaXNJbWFnZShcbiAgICAgICAgICAgICAgICAnLi9hc3NldHMvaW1hZ2VzL29uYm9hcmQvJyArIHNoaXBDb2RlICsgJ19PTENJX3N0YXRlcm9vbV8nICsgY2F0ZWdvcnkgKyAnLmpwZycsXG4gICAgICAgICAgICAgICAgJy4vYXNzZXRzL2ltYWdlcy9vbmJvYXJkL09MQ0lfc3RhdGVyb29tX2RlZmF1bHQuanBnJ1xuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgfTtcbn0pO1xuXG5cblxuLy8gaW50ZXJpb3Jcbi8vIEksIEosIEssIEwsIE0sIE1NLCBOLCBOTiwgSUEsIElRLCBSXG5cbi8vIG9jZWFuXG4vLyBDLCBDQSwgQ1EsIEQsIERBLCBERCwgRSwgRUUsIEYsIEZBLCBGQiwgRkYsIEcsIEgsIEhILCBHRywgT08sIFFcblxuLy8gdmlzdGFcbi8vIEEsIEFBLCBBQiwgQVMsIEIsIEJBLCBCQiwgQkMsIEJRXG5cbi8vIG5lcHR1bmVcbi8vIFMsIFNBLCBTQiwgU0MsIFNRXG5cbi8vIHBpbm5hY2xlXG4vLyBQU1xuXG4vLyB2ZXJhbmRhaFxuLy8gViwgVkEsIFZCLCBWQywgVkQsIFZFLCBWRiwgVkgsIFZRLCBWUywgVlRcblxuLy8gc2lnbmF0dXJlXG4vLyBTUywgU1ksIFNaLCBTVVxuXG4vLyBsYW5haVxuLy8gQ0FcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLkZvY3VzU2VydmljZScsIFtdKVxuXG4uZmFjdG9yeSgnZ2l2ZUZvY3VzJywgZnVuY3Rpb24oJHRpbWVvdXQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgICAgIGlmKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICB9O1xufSk7IiwiLypcbiAqIE1vZGFsU2VydmljZS5qc1xuICpcbiAqIENyZWF0ZWQ6IFRodXJzZGF5LCBOb3ZlbWJlciAzLCAyMDE0XG4gKiAoYykgQ29weXJpZ2h0IDIwMTQgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5Nb2RhbFNlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBUaGVzZSBzZXJ2aWNlIG1ldGhvZHMgYXJlIHVzZWQgd2l0aCBtb2RhbHMgdG8gY29udHJvbCBsaWZlY3ljbGUuXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLk1vZGFsU2VydmljZScsIFtcbiAgICAndWkuYm9vdHN0cmFwLm1vZGFsJyxcbl0pXG4uc2VydmljZSgnTW9kYWxTZXJ2aWNlJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJG1vZGFsKSB7XG4gICAgdmFyIG1lID0ge1xuICAgICAgICBtb2RhbDogbnVsbCxcbiAgICAgICAgbW9kYWxBcmdzOiBudWxsLFxuICAgICAgICBpc01vZGFsT3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbWUubW9kYWwgIT09IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW5Nb2RhbDogZnVuY3Rpb24oYXJncykge1xuICAgICAgICAgICAgbWUuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgbWUubW9kYWxBcmdzID0gYXJncztcbiAgICAgICAgICAgIG1lLm1vZGFsID0gJG1vZGFsLm9wZW4oYXJncyk7XG5cbiAgICAgICAgICAgIHJldHVybiBtZS5tb2RhbDtcbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2VNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAobWUubW9kYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1lLm1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICBtZS5tb2RhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgbWUubW9kYWxBcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvL1doZW4gdGhlIHVzZXIgbmF2aWdhdGVzIGF3YXkgZnJvbSBhIHBhZ2Ugd2hpbGUgYSBtb2RhbCBpcyBvcGVuLCBjbG9zZSB0aGUgbW9kYWwuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcbiAgICAgICAgbWUuY2xvc2VNb2RhbCgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1lO1xufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9