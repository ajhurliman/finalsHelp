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
    'fh.directives.halHeader',
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


        $state.go('search');

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

angular.module('fh.home', [
  'ui.select',
  'ngStorage',
  'ngFileUpload'
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

.controller('HomeController', function( $scope, $http, $sessionStorage, $timeout, Upload, allClasses ) {
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
  // $scope.newSeason    = {};
  // $scope.newYear      = {};
  // $scope.newType      = {};

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
angular.module('fh.search', [
  'ui.select',
  'ngStorage'
])

.config(function homeConfig( $stateProvider ) {
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
        }).then(function ( res ) {
          return res.data;
        }, function( err ) {
          console.log(err);
        });
      }
    }
  });
})

.controller('SearchController', function( $scope, $http, $sessionStorage, allClasses, $timeout ) {
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
      url: PAPERS_URL + '/classAndType/class/' + query.classId + '/type/' + query.typeCode
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
        var canvas = document.getElementById($scope.papers[ i ]._id);
        var context = canvas.getContext('2d');

        if ( $scope.papers[ i ] ) {
          PDFJS.getDocument( $scope.papers[ i ].img.data ).then(function( pdf ) {
            pdf.getPage(1).then(function( page ) {

              var scale = .5;
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
    }, 100);
  });

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

    $http({
      method: 'PUT',
      url: 'api/papers/single/' + paper._id,
      data: putObj
    }).then(function( res ) {
      console.log( res );
    }, function( err ) {
      console.error ( err );
    });
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
angular.module('fh.directives.halHeader', [
    'ngStorage',
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
        controller: function() {

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImhvbWUuanMiLCJsYW5kaW5nLmpzIiwic2VhcmNoLmpzIiwiaGFsSGVhZGVyLmpzIiwic2hvd1BkZk1vZGFsLmpzIiwiRm9jdXNTZXJ2aWNlLmpzIiwiTW9kYWxTZXJ2aWNlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ROQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im9sY2lBcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0Jztcbn0pKCk7XG5cbmFuZ3VsYXIubW9kdWxlKCdmaCcsIFtcbiAgICAnbmdTdG9yYWdlJyxcbiAgICAnY2dCdXN5JyxcbiAgICAndWkucm91dGVyJyxcbiAgICAndWkuYm9vdHN0cmFwJyxcbiAgICAndWkuYm9vdHN0cmFwLnNob3dFcnJvcnMnLFxuICAgICd1aS51dGlscycsXG4gICAgJ3Jlc3Rhbmd1bGFyJyxcbiAgICAndGVtcGxhdGVzLWFwcCcsXG4gICAgJ3RlbXBsYXRlcy1jb21wb25lbnRzJyxcbiAgICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJyxcbiAgICAnZmgubGFuZGluZycsXG4gICAgJ2ZoLmhvbWUnLFxuICAgICdmaC5zZWFyY2gnLFxuICAgICdmaC5kaXJlY3RpdmVzLmhhbEhlYWRlcicsXG4gICAgJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzLnNob3dQZGZNb2RhbCcsXG4gICAgLy8gJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzJyxcbiAgICAnZmguc2VydmljZXMuRm9jdXNTZXJ2aWNlJyxcbiAgICAndmVuZG9yLnN0ZWVsVG9lJyxcbiAgICAnYmFzZTY0JyxcbiAgICAnYW5ndWxhci1tb21lbnRqcydcbl0pXG5cbiAgICAuY29uZmlnKGZ1bmN0aW9uKCR1cmxSb3V0ZXJQcm92aWRlciwgUmVzdGFuZ3VsYXJQcm92aWRlciwgQ29uZmlndXJhdGlvbiwgJHVpVmlld1Njcm9sbFByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyKSB7XG5cbiAgICAgICAgUmVzdGFuZ3VsYXJQcm92aWRlci5zZXRCYXNlVXJsKCcvYXBpJyk7XG4gICAgICAgIFJlc3Rhbmd1bGFyUHJvdmlkZXIuc2V0RGVmYXVsdEh0dHBGaWVsZHMoe1xuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgdGltZW91dDogQ29uZmlndXJhdGlvbi50aW1lb3V0SW5NaWxsaXMsXG4gICAgICAgICAgICBjYWNoZTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignJywgJy9sYW5kaW5nJykub3RoZXJ3aXNlKCcvbGFuZGluZycpO1xuXG4gICAgICAgIC8vIHNjcm9sbHMgdG8gdG9wIG9mIHBhZ2Ugb24gc3RhdGUgY2hhbmdlXG4gICAgICAgICR1aVZpZXdTY3JvbGxQcm92aWRlci51c2VBbmNob3JTY3JvbGwoKTtcblxuICAgIH0pXG4gICAgLnJ1bihmdW5jdGlvbigkcm9vdFNjb3BlLCBcbiAgICAgICAgQ29uZmlndXJhdGlvbiwgXG4gICAgICAgICRzdGF0ZSwgXG4gICAgICAgICRzZXNzaW9uU3RvcmFnZSkge1xuXG4gICAgICAgICRyb290U2NvcGUuYXBwTmFtZSA9IENvbmZpZ3VyYXRpb24uYXBwTmFtZTtcbiAgICAgICAgJHJvb3RTY29wZS5jb21wYW55Q29kZSA9IENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGU7XG5cblxuICAgICAgICAkc3RhdGUuZ28oJ3NlYXJjaCcpO1xuXG4gICAgICAgIC8vYXV0aCBjaGVjayBldmVyeSB0aW1lIHRoZSBzdGF0ZS9wYWdlIGNoYW5nZXNcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcbiAgICAgICAgICAgIC8vICRyb290U2NvcGUuc3RhdGVDaGFuZ2VBdXRoQ2hlY2soZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpO1xuICAgICAgICB9KTtcblxuXG4gICAgICAgIC8vRVZFTlQgQkFOS1xuICAgICAgICAvKlxuICAgICAgICAkcm9vdFNjb3BlLiRvbignYXV0aC1sb2dvdXQtc3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCBhcmdzKSB7XG4gICAgICAgIH0pOyovXG5cblxuXG4gICAgfSlcblxuICAgIC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmhvbWUnLCBbXG4gICd1aS5zZWxlY3QnLFxuICAnbmdTdG9yYWdlJyxcbiAgJ25nRmlsZVVwbG9hZCdcbl0pXG5cbi5jb25maWcoZnVuY3Rpb24gaG9tZUNvbmZpZygkc3RhdGVQcm92aWRlcikge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICB1cmw6ICcvaG9tZScsXG4gICAgdmlld3M6IHtcbiAgICAgIG1haW46IHtcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdob21lL2hvbWUudHBsLmh0bWwnXG4gICAgICB9XG4gICAgfSxcbiAgICBwYWdlVGl0bGU6ICdIb21lJyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGxDbGFzc2VzOiBmdW5jdGlvbiggJGh0dHAsICRzZXNzaW9uU3RvcmFnZSApIHtcbiAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIHVybDogJ2FwaS9jbGFzc2VzL2FsbCcsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgand0OiAkc2Vzc2lvblN0b3JhZ2Uuand0XG4gICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXMgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignSG9tZUNvbnRyb2xsZXInLCBmdW5jdGlvbiggJHNjb3BlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkdGltZW91dCwgVXBsb2FkLCBhbGxDbGFzc2VzICkge1xuICB2YXIgUEFQRVJTX1VSTCA9ICcvYXBpL3BhcGVycyc7XG4gICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydqd3QnXSA9ICRzZXNzaW9uU3RvcmFnZS5qd3Q7XG4gICRzY29wZS5hbGxDbGFzc2VzID0gYWxsQ2xhc3NlcztcblxuICAkc2NvcGUuJHdhdGNoKCdmaWxlcycsIGZ1bmN0aW9uKCkge1xuICAgICRzY29wZS51cGxvYWQoICRzY29wZS5maWxlcyApO1xuICB9KTtcblxuICAkc2NvcGUuJHdhdGNoKCdmaWxlJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCRzY29wZS5maWxlICE9IG51bGwpIHtcbiAgICAgICRzY29wZS51cGxvYWQoWyRzY29wZS5maWxlXSk7XG4gICAgfVxuICB9KTtcblxuICAkc2NvcGUubG9nICAgICAgICAgID0gJyc7XG4gICRzY29wZS5wYXBlcnNUb0VkaXQgPSBbXTtcbiAgJHNjb3BlLmVkaXREYXRhICAgICA9IHt9O1xuICAvLyAkc2NvcGUubmV3U2Vhc29uICAgID0ge307XG4gIC8vICRzY29wZS5uZXdZZWFyICAgICAgPSB7fTtcbiAgLy8gJHNjb3BlLm5ld1R5cGUgICAgICA9IHt9O1xuXG4gICRzY29wZS5zZWFzb25zID0gW1xuICAgIHtuYW1lOiAnU3ByaW5nJywgY29kZTogXCJTUFwifSxcbiAgICB7bmFtZTogJ1N1bW1lcicsIGNvZGU6IFwiU1VcIn0sXG4gICAge25hbWU6ICdGYWxsJywgY29kZTogXCJGQVwifSxcbiAgICB7bmFtZTogJ1dpbnRlcicsIGNvZGU6IFwiV0lcIn1cbiAgXTtcbiAgJHNjb3BlLnllYXJzID0gW1xuICAgIHtuYW1lOiAnMDknLCBjb2RlOiAnMDknfSxcbiAgICB7bmFtZTogJzEwJywgY29kZTogJzEwJ30sXG4gICAge25hbWU6ICcxMScsIGNvZGU6ICcxMSd9LFxuICAgIHtuYW1lOiAnMTInLCBjb2RlOiAnMTInfSxcbiAgICB7bmFtZTogJzEzJywgY29kZTogJzEzJ30sXG4gICAge25hbWU6ICcxNCcsIGNvZGU6ICcxNCd9LFxuICAgIHtuYW1lOiAnMTUnLCBjb2RlOiAnMTUnfVxuICBdO1xuICAkc2NvcGUudHlwZXMgPSBbXG4gICAge25hbWU6ICdIb21ld29yaycsIGNvZGU6ICdIJ30sXG4gICAge25hbWU6ICdNaWR0ZXJtJywgY29kZTogJ00nfSxcbiAgICB7bmFtZTogJ05vdGVzJywgY29kZTogJ04nfSxcbiAgICB7bmFtZTogJ1F1aXonLCBjb2RlOiAnUSd9LFxuICAgIHtuYW1lOiAnRmluYWwnLCBjb2RlOiAnRid9LFxuICAgIHtuYW1lOiAnTGFiJywgY29kZTogJ0wnfVxuICBdO1xuXG4gICRzY29wZS51cGxvYWQgPSBmdW5jdGlvbiggZmlsZXMgKSB7XG4gICAgaWYgKGZpbGVzICYmIGZpbGVzLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZmlsZSA9IGZpbGVzW2ldO1xuXG4gICAgICAgIFVwbG9hZC51cGxvYWQoe1xuICAgICAgICAgIHVybDogUEFQRVJTX1VSTCxcbiAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgIH0pXG5cbiAgICAgICAgLnByb2dyZXNzKGZ1bmN0aW9uICggZXZ0ICkge1xuICAgICAgICAgIHZhciBwcm9ncmVzc1BlcmNlbnRhZ2UgPSBwYXJzZUludCgxMDAuMCAqIGV2dC5sb2FkZWQgLyBldnQudG90YWwpO1xuICAgICAgICAgICRzY29wZS5sb2cgPSAncHJvZ3Jlc3M6ICcgKyBcbiAgICAgICAgICAgIHByb2dyZXNzUGVyY2VudGFnZSArIFxuICAgICAgICAgICAgJyUnICsgXG4gICAgICAgICAgICBldnQuY29uZmlnLmZpbGUubmFtZSArIFxuICAgICAgICAgICAgJ1xcbicgKyBcbiAgICAgICAgICAgICRzY29wZS5sb2c7XG4gICAgICAgIH0pXG5cbiAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oIGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnICkge1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAkc2NvcGUubG9nID0gJ2ZpbGU6ICcgKyBcbiAgICAgICAgICAgICAgY29uZmlnLmZpbGUubmFtZSArIFxuICAgICAgICAgICAgICAnLCBSZXNwb25zZTogJyArIFxuICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSggZGF0YS50aXRsZSApICsgXG4gICAgICAgICAgICAgICdcXG4nICsgXG4gICAgICAgICAgICAgICRzY29wZS5sb2c7XG5cbiAgICAgICAgICAgICRzY29wZS5wYXBlcnNUb0VkaXQucHVzaCggZGF0YSApO1xuXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc3VibWl0RWRpdGVkUGFwZXIgPSBmdW5jdGlvbiggcGFwZXIsIG5ld0RhdGEgKSB7XG4gICAgcHV0T2JqID0ge1xuICAgICAgdGl0bGU6IG5ld0RhdGEudGl0bGUsXG4gICAgICBwZXJpb2Q6IG5ld0RhdGEuc2Vhc29uICsgbmV3RGF0YS55ZWFyLFxuICAgICAgdHlwZTogbmV3RGF0YS50eXBlLFxuICAgICAgY2xhc3NJZDogbmV3RGF0YS5jbGFzc0lkXG4gICAgfTtcblxuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICB1cmw6ICdhcGkvcGFwZXJzL3NpbmdsZS8nICsgcGFwZXIuX2lkLFxuICAgICAgZGF0YTogcHV0T2JqXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgY29uc29sZS5sb2coIHJlcyApO1xuICAgICAgJHNjb3BlLnBhcGVyVG9FZGl0QmFja1N0b3JlID0gJHNjb3BlLnBhcGVyc1RvRWRpdC5zaGlmdCgpO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmVycm9yICggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLiR3YXRjaCgncGFwZXJzVG9FZGl0WzBdJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLXZpZXdlcicpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoICRzY29wZS5wYXBlcnNUb0VkaXRbMF0gKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggJHNjb3BlLnBhcGVyc1RvRWRpdFswXS5pbWcuZGF0YSApLnRoZW4oZnVuY3Rpb24oIHBkZiApIHtcbiAgICAgICAgcGRmLmdldFBhZ2UoMSkudGhlbihmdW5jdGlvbihwYWdlKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAwLjg7XG4gICAgICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgICAgICBjYW52YXNDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICAgICAgfTtcbiAgICAgICAgICBwYWdlLnJlbmRlcihyZW5kZXJDb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH0pO1xuXG5cbiAgJHNjb3BlLiR3YXRjaCgncGFwZXJzVG9FZGl0WzFdJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXh0LXVwLXBkZi1jb250YWluZXInKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgaWYgKCAkc2NvcGUucGFwZXJzVG9FZGl0WzFdICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoICRzY29wZS5wYXBlcnNUb0VkaXRbMV0uaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24ocGFnZSkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMC4yO1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9KTtcblxuICAkc2NvcGUuYWRkQ2xhc3MgPSBmdW5jdGlvbiggbmV3Q2xhc3MgKSB7XG4gICAgdmFyIHBvc3RPYmogPSB7dGl0bGU6IG5ld0NsYXNzfTtcblxuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgdXJsOiAnYXBpL2NsYXNzZXMnLFxuICAgICAgZGF0YTogcG9zdE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXMgKSB7XG4gICAgICAgICRzY29wZS5hbGxDbGFzc2VzID0gcmVzLmRhdGE7XG4gICAgICB9KTtcblxuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cblxufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnZmgubGFuZGluZycsW1xuICAnbmdTdG9yYWdlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiAoICRzdGF0ZVByb3ZpZGVyICkge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGFuZGluZycsIHtcbiAgICB1cmw6ICcvJyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnTGFuZGluZ0NvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2xhbmRpbmcvbGFuZGluZy50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ2xhbmRpbmdQYWdlLnBhZ2VUaXRsZSdcbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignTGFuZGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoICRzY29wZSwgJHN0YXRlLCAkaHR0cCwgJGJhc2U2NCwgJHNlc3Npb25TdG9yYWdlKSB7XG4gIHZhciBVU0VSU19VUkwgPSAnL2FwaS91c2Vycyc7XG5cbiAgJHNjb3BlLnJlZ2lzdGVyID0gZnVuY3Rpb24oIGNyZWRlbnRpYWxzICkge1xuICAgIHZhciBuZXdVc2VyID0ge1xuICAgICAgbmFtZTogY3JlZGVudGlhbHMubmFtZSxcbiAgICAgIHBob25lOiBjcmVkZW50aWFscy5waG9uZSxcbiAgICAgIGVtYWlsOiBjcmVkZW50aWFscy5lbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBjcmVkZW50aWFscy5wYXNzd29yZCxcbiAgICAgIHBhc3N3b3JkQ29uZmlybTogY3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtXG4gICAgfTtcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogVVNFUlNfVVJMLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9LFxuICAgICAgZGF0YTogbmV3VXNlclxuICAgIH0pXG4gICAgLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgY29uc29sZS5kaXIoZGF0YSk7XG4gICAgICAkc2NvcGUucmVnaXN0ZXJDcmVkZW50aWFscyA9IHt9O1xuICAgIH0pXG4gICAgLmVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgY29uc29sZS5kaXIoZXJyKTtcbiAgICAgICRzY29wZS5yZWdpc3RlckNyZWRlbnRpYWxzLnBhc3N3b3JkID0gJyc7XG4gICAgICAkc2NvcGUucmVnaXN0ZXJDcmVkZW50aWFscy5wYXNzd29yZENvbmZpcm0gPSAnJztcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbihjcmVkZW50aWFscykge1xuXG4gICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGhvcml6YXRpb24nXSA9IFxuICAgICAgJ0Jhc2ljICcgKyBcbiAgICAgICRiYXNlNjQuZW5jb2RlKGNyZWRlbnRpYWxzLmVtYWlsICsgXG4gICAgICAnOicgKyBcbiAgICAgIGNyZWRlbnRpYWxzLnBhc3N3b3JkKTtcbiAgICBcbiAgICAkaHR0cC5nZXQoVVNFUlNfVVJMKVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBjb25zb2xlLmRpcihkYXRhKTtcbiAgICAgICAgJHNlc3Npb25TdG9yYWdlLmp3dCA9IGRhdGEuand0O1xuICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZGlyKGVycik7XG4gICAgICB9KTtcbiAgfTtcblxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlYXJjaCcsIFtcbiAgJ3VpLnNlbGVjdCcsXG4gICduZ1N0b3JhZ2UnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIGhvbWVDb25maWcoICRzdGF0ZVByb3ZpZGVyICkge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2VhcmNoJywge1xuICAgIHVybDogJy9zZWFyY2gnLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdzZWFyY2gvc2VhcmNoLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnU2VhcmNoJyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGxDbGFzc2VzOiBmdW5jdGlvbiggJGh0dHAsICRzZXNzaW9uU3RvcmFnZSApIHtcbiAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIHVybDogJ2FwaS9jbGFzc2VzL2FsbCcsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgand0OiAkc2Vzc2lvblN0b3JhZ2Uuand0XG4gICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICggcmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ1NlYXJjaENvbnRyb2xsZXInLCBmdW5jdGlvbiggJHNjb3BlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCBhbGxDbGFzc2VzLCAkdGltZW91dCApIHtcbiAgdmFyIFBBUEVSU19VUkwgICAgICAgICAgICAgICAgICAgICAgID0gJy9hcGkvcGFwZXJzJztcbiAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ2p3dCddID0gJHNlc3Npb25TdG9yYWdlLmp3dDtcbiAgJHNjb3BlLnF1ZXJ5ICAgICAgICAgICAgICAgICAgICAgICAgID0ge307XG4gICRzY29wZS5lZGl0RGF0YSAgICAgICAgICAgICAgICAgICAgICA9IHt9O1xuICAkc2NvcGUuYWxsQ2xhc3NlcyAgICAgICAgICAgICAgICAgICAgPSBhbGxDbGFzc2VzO1xuXG4gICRzY29wZS5zZWFzb25zID0gW1xuICAgIHtuYW1lOiAnU3ByaW5nJywgY29kZTogXCJTUFwifSxcbiAgICB7bmFtZTogJ1N1bW1lcicsIGNvZGU6IFwiU1VcIn0sXG4gICAge25hbWU6ICdGYWxsJywgY29kZTogXCJGQVwifSxcbiAgICB7bmFtZTogJ1dpbnRlcicsIGNvZGU6IFwiV0lcIn1cbiAgXTtcbiAgJHNjb3BlLnllYXJzID0gW1xuICAgIHtuYW1lOiAnMDknLCBjb2RlOiAnMDknfSxcbiAgICB7bmFtZTogJzEwJywgY29kZTogJzEwJ30sXG4gICAge25hbWU6ICcxMScsIGNvZGU6ICcxMSd9LFxuICAgIHtuYW1lOiAnMTInLCBjb2RlOiAnMTInfSxcbiAgICB7bmFtZTogJzEzJywgY29kZTogJzEzJ30sXG4gICAge25hbWU6ICcxNCcsIGNvZGU6ICcxNCd9LFxuICAgIHtuYW1lOiAnMTUnLCBjb2RlOiAnMTUnfVxuICBdO1xuICAkc2NvcGUudHlwZXMgPSBbXG4gICAge25hbWU6ICdIb21ld29yaycsIGNvZGU6ICdIJ30sXG4gICAge25hbWU6ICdNaWR0ZXJtJywgY29kZTogJ00nfSxcbiAgICB7bmFtZTogJ05vdGVzJywgY29kZTogJ04nfSxcbiAgICB7bmFtZTogJ1F1aXonLCBjb2RlOiAnUSd9LFxuICAgIHtuYW1lOiAnRmluYWwnLCBjb2RlOiAnRid9LFxuICAgIHtuYW1lOiAnTGFiJywgY29kZTogJ0wnfVxuICBdO1xuXG4gICRzY29wZS5maW5kQ2xhc3NlcyA9IGZ1bmN0aW9uKCBxdWVyeSApIHtcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgdXJsOiBQQVBFUlNfVVJMICsgJy9jbGFzc0FuZFR5cGUvY2xhc3MvJyArIHF1ZXJ5LmNsYXNzSWQgKyAnL3R5cGUvJyArIHF1ZXJ5LnR5cGVDb2RlXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgJHNjb3BlLnBhcGVycyA9IHJlcy5kYXRhO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLiR3YXRjaCgncGFwZXJzJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCAhJHNjb3BlLnBhcGVycyApIHJldHVybjtcbiAgICBcbiAgICAkdGltZW91dChmdW5jdGlvbigpIHtcblxuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgJHNjb3BlLnBhcGVycy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCRzY29wZS5wYXBlcnNbIGkgXS5faWQpO1xuICAgICAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIGlmICggJHNjb3BlLnBhcGVyc1sgaSBdICkge1xuICAgICAgICAgIFBERkpTLmdldERvY3VtZW50KCAkc2NvcGUucGFwZXJzWyBpIF0uaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKCBwYWdlICkge1xuXG4gICAgICAgICAgICAgIHZhciBzY2FsZSA9IC41O1xuICAgICAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgICAgICBjYW52YXNDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBwYWdlLnJlbmRlcihyZW5kZXJDb250ZXh0KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgICAgIH1cblxuICAgICAgfVxuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gICRzY29wZS5zaG93RWRpdFBhbmVsID0gZnVuY3Rpb24oaWQpIHtcbiAgICAkc2NvcGVbICdvcGVuRWRpdFBhbmVsLScgKyBpZCBdID0gISRzY29wZVsgJ29wZW5FZGl0UGFuZWwtJyArIGlkIF07XG4gIH07XG5cbiAgJHNjb3BlLmlzRWRpdFBhbmVsT3BlbiA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuICEhJHNjb3BlWyAnb3BlbkVkaXRQYW5lbC0nICsgaWQgXTtcbiAgfTtcblxuICAkc2NvcGUuc3VibWl0RWRpdGVkUGFwZXIgPSBmdW5jdGlvbiggcGFwZXIsIG5ld0RhdGEgKSB7XG4gICAgcHV0T2JqID0ge1xuICAgICAgdGl0bGU6IG5ld0RhdGEudGl0bGUsXG4gICAgICBwZXJpb2Q6IG5ld0RhdGEuc2Vhc29uICsgbmV3RGF0YS55ZWFyLFxuICAgICAgdHlwZTogbmV3RGF0YS50eXBlLFxuICAgICAgY2xhc3NJZDogbmV3RGF0YS5jbGFzc0lkXG4gICAgfTtcblxuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICB1cmw6ICdhcGkvcGFwZXJzL3NpbmdsZS8nICsgcGFwZXIuX2lkLFxuICAgICAgZGF0YTogcHV0T2JqXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgY29uc29sZS5sb2coIHJlcyApO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmVycm9yICggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cblxufSk7IiwiLypcbiAqIGhhbEhlYWRlci5qc1xuICpcbiAqIENyZWF0ZWQ6IE1vbmRheSwgRmVicnVhcnkgMDMsIDIwMTRcbiAqIChjKSBDb3B5cmlnaHQgMjAxNCBIb2xsYW5kIEFtZXJpY2EsIEluYy4gLSBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiBUaGlzIGlzIHVucHVibGlzaGVkIHByb3ByaWV0YXJ5IHNvdXJjZSBjb2RlIG9mIEhvbGxhbmQgQW1lcmljYSwgSW5jLlxuICogVGhlIGNvcHlyaWdodCBub3RpY2UgYWJvdmUgZG9lcyBub3QgZXZpZGVuY2UgYW55IGFjdHVhbCBvciBpbnRlbmRlZFxuICogcHVibGljYXRpb24gb2Ygc3VjaCBzb3VyY2UgY29kZS5cbiAqL1xuXG4vKipcbiAqIEBuYW1lIG9sY2kuZGlyZWN0aXZlcy5oYWxIZWFkZXJcbiAqIEBkZXNjcmlwdGlvbiBUaGlzIG1vZHVsZSBwb3B1bGF0ZXMgdGhlIGhlYWRlciwgd2hpY2ggbWF5IG9yIG1heSBub3QgaW5jbHVkZSB0aGUgcG5hdi5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ2ZoLmRpcmVjdGl2ZXMuaGFsSGVhZGVyJywgW1xuICAgICduZ1N0b3JhZ2UnLFxuICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nXG5dKVxuXG4vKipcbiAqIEBuZ2RvYyBkaXJlY3RpdmVcbiAqIEBuYW1lIG9sY2kuZGlyZWN0aXZlcy5oYWxIZWFkZXJcbiAqIEByZXN0cmljdCBBXG4gKiBAZWxlbWVudCBBTllcbiAqIEBkZXNjcmlwdGlvbiBBbiBlbXB0eSBkaXJlY3RpdmUgZGVzY3JpcHRpb24uIFBsZWFzZSBmaWxsIGluIGEgaGlnaCBsZXZlbCBkZXNjcmlwdGlvbiBvZiB0aGlzXG4gKiAgICAgZGlyZWN0aXZlLlxuICogQGV4YW1wbGVcbiAqXG4gPHByZT5cbiAgICA8ZGl2IGlkPVwiaGFsLWhlYWRlclwiIGhhbC1oZWFkZXIgcHJpbWFyeS1ndWVzdD1cInByaW1hcnlHdWVzdFwiIGxvZ291dD1cImxvZ291dCgpXCI+PC9kaXY+XG4gPC9wcmU+XG4gPGV4YW1wbGU+XG4gICAgIDxmaWxlIG5hbWU9XCJoYWxIZWFkZXIuaHRtbFwiPlxuICAgICAgICBQbGFjZSByZW5kZXJlZCBIVE1MIGhlcmUuXG4gICAgIDwvZmlsZT5cbiA8L2V4YW1wbGU+XG4gKlxuICovXG5cbi5kaXJlY3RpdmUoJ2hhbEhlYWRlcicsIGZ1bmN0aW9uIGZhY3RvcnkoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdkaXJlY3RpdmVzL2hhbEhlYWRlci9oYWxIZWFkZXIudHBsLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigpIHtcblxuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5kaXJlY3RpdmVzLm1vZGFscy5zaG93UGRmTW9kYWwnLCBbXG4gICd1aS5ib290c3RyYXAnLFxuICAnZmguc2VydmljZXMuTW9kYWxTZXJ2aWNlJ1xuXSlcblxuLmRpcmVjdGl2ZSgnc2hvd1BkZk1vZGFsJywgZnVuY3Rpb24oIE1vZGFsU2VydmljZSApIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0FFJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIE1vZGFsU2VydmljZS5vcGVuTW9kYWwoe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9tb2RhbHMvc2hvd1BkZk1vZGFsL3Nob3dQZGZNb2RhbC50cGwuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlcjogJ1Nob3dQZGZNb2RhbENvbnRyb2xsZXInLFxuICAgICAgICAgIHdpbmRvd0NsYXNzOiAnc2hvdy1wZGYtbW9kYWwnLFxuICAgICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgICBrZXlib2FyZDogZmFsc2UsXG4gICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgcGFwZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2NvcGUucGFwZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn0pXG5cbi5jb250cm9sbGVyKCdTaG93UGRmTW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkdGltZW91dCwgTW9kYWxTZXJ2aWNlLCBwYXBlcikge1xuICAkc2NvcGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICBNb2RhbFNlcnZpY2UuY2xvc2VNb2RhbCgpO1xuICB9O1xuICAkc2NvcGUubW9kYWxJZCA9IHBhcGVyLl9pZCArICdtb2RhbCc7XG4gICRzY29wZS5wYXBlciA9IHBhcGVyXG5cbiAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBhcGVyLl9pZCArICdtb2RhbCcpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoIHBhcGVyICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoIHBhcGVyLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKCBwYWdlICkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMTtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfSwgNTApO1xuICAgIFxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLkZvY3VzU2VydmljZScsIFtdKVxuXG4uZmFjdG9yeSgnZ2l2ZUZvY3VzJywgZnVuY3Rpb24oJHRpbWVvdXQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgICAgIGlmKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICB9O1xufSk7IiwiLypcbiAqIE1vZGFsU2VydmljZS5qc1xuICpcbiAqIENyZWF0ZWQ6IFRodXJzZGF5LCBOb3ZlbWJlciAzLCAyMDE0XG4gKiAoYykgQ29weXJpZ2h0IDIwMTQgSG9sbGFuZCBBbWVyaWNhLCBJbmMuIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVGhpcyBpcyB1bnB1Ymxpc2hlZCBwcm9wcmlldGFyeSBzb3VyY2UgY29kZSBvZiBIb2xsYW5kIEFtZXJpY2EsIEluYy5cbiAqIFRoZSBjb3B5cmlnaHQgbm90aWNlIGFib3ZlIGRvZXMgbm90IGV2aWRlbmNlIGFueSBhY3R1YWwgb3IgaW50ZW5kZWRcbiAqIHB1YmxpY2F0aW9uIG9mIHN1Y2ggc291cmNlIGNvZGUuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgb2xjaS5zZXJ2aWNlcy5Nb2RhbFNlcnZpY2VcbiAqIEBkZXNjcmlwdGlvbiBUaGVzZSBzZXJ2aWNlIG1ldGhvZHMgYXJlIHVzZWQgd2l0aCBtb2RhbHMgdG8gY29udHJvbCBsaWZlY3ljbGUuXG4gKi9cblxuYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLk1vZGFsU2VydmljZScsIFtcbiAgICAndWkuYm9vdHN0cmFwLm1vZGFsJyxcbl0pXG4uc2VydmljZSgnTW9kYWxTZXJ2aWNlJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJG1vZGFsKSB7XG4gICAgdmFyIG1lID0ge1xuICAgICAgICBtb2RhbDogbnVsbCxcbiAgICAgICAgbW9kYWxBcmdzOiBudWxsLFxuICAgICAgICBpc01vZGFsT3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbWUubW9kYWwgIT09IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW5Nb2RhbDogZnVuY3Rpb24oYXJncykge1xuICAgICAgICAgICAgbWUuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgbWUubW9kYWxBcmdzID0gYXJncztcbiAgICAgICAgICAgIG1lLm1vZGFsID0gJG1vZGFsLm9wZW4oYXJncyk7XG5cbiAgICAgICAgICAgIHJldHVybiBtZS5tb2RhbDtcbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2VNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAobWUubW9kYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1lLm1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICBtZS5tb2RhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgbWUubW9kYWxBcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvL1doZW4gdGhlIHVzZXIgbmF2aWdhdGVzIGF3YXkgZnJvbSBhIHBhZ2Ugd2hpbGUgYSBtb2RhbCBpcyBvcGVuLCBjbG9zZSB0aGUgbW9kYWwuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcbiAgICAgICAgbWUuY2xvc2VNb2RhbCgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1lO1xufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9