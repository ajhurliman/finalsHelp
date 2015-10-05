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
    pageTitle: 'Search'
  });
})

.controller('SearchController', function( $scope, $http, $sessionStorage, $timeout ) {
  $http.defaults.headers.common['jwt'] = $sessionStorage.jwt;
  $scope.query = {};
  var PAPERS_URL = '/api/papers';

  $http({
    method: 'GET',
    url: 'api/classes/all'
  }).then(function( res ) {
    $scope.allClasses = res.data;
  }, function( err ) {
    console.log(err);
  });

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
angular.module('fh.services.FindImageService', [
        'ngStorage',
        'vendor.steelToe'
    ])

.factory('FindImageService', function($http, $sessionStorage, $q, steelToe) {

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
        getHeaderImage: function(companyCode) {
            var imageUrl = './assets/images/headerImage.jpg';
            return isImage(imageUrl);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbmRBbmRFZGl0LmpzIiwiaG9tZS5qcyIsImxhbmRpbmcuanMiLCJzZWFyY2guanMiLCJtYWluSGVhZGVyLmpzIiwic2hvd1BkZk1vZGFsLmpzIiwiRmluZEltYWdlU2VydmljZS5qcyIsIkZvY3VzU2VydmljZS5qcyIsIk1vZGFsU2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im9sY2lBcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0Jztcbn0pKCk7XG5cbmFuZ3VsYXIubW9kdWxlKCdmaCcsIFtcbiAgICAnbmdTdG9yYWdlJyxcbiAgICAnY2dCdXN5JyxcbiAgICAndWkucm91dGVyJyxcbiAgICAndWkuYm9vdHN0cmFwJyxcbiAgICAndWkuYm9vdHN0cmFwLnNob3dFcnJvcnMnLFxuICAgICd1aS51dGlscycsXG4gICAgJ3Jlc3Rhbmd1bGFyJyxcbiAgICAndGVtcGxhdGVzLWFwcCcsXG4gICAgJ3RlbXBsYXRlcy1jb21wb25lbnRzJyxcbiAgICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJyxcbiAgICAnZmgubGFuZGluZycsXG4gICAgJ2ZoLmhvbWUnLFxuICAgICdmaC5zZWFyY2gnLFxuICAgICdmaC5maW5kQW5kRWRpdCcsXG4gICAgJ2ZoLmRpcmVjdGl2ZXMubWFpbkhlYWRlcicsXG4gICAgJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzLnNob3dQZGZNb2RhbCcsXG4gICAgLy8gJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzJyxcbiAgICAnZmguc2VydmljZXMuRm9jdXNTZXJ2aWNlJyxcbiAgICAndmVuZG9yLnN0ZWVsVG9lJyxcbiAgICAnYmFzZTY0JyxcbiAgICAnYW5ndWxhci1tb21lbnRqcydcbl0pXG5cbiAgICAuY29uZmlnKGZ1bmN0aW9uKCR1cmxSb3V0ZXJQcm92aWRlciwgUmVzdGFuZ3VsYXJQcm92aWRlciwgQ29uZmlndXJhdGlvbiwgJHVpVmlld1Njcm9sbFByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyKSB7XG5cbiAgICAgICAgUmVzdGFuZ3VsYXJQcm92aWRlci5zZXRCYXNlVXJsKCcvYXBpJyk7XG4gICAgICAgIFJlc3Rhbmd1bGFyUHJvdmlkZXIuc2V0RGVmYXVsdEh0dHBGaWVsZHMoe1xuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgdGltZW91dDogQ29uZmlndXJhdGlvbi50aW1lb3V0SW5NaWxsaXMsXG4gICAgICAgICAgICBjYWNoZTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignJywgJy9sYW5kaW5nJykub3RoZXJ3aXNlKCcvbGFuZGluZycpO1xuXG4gICAgICAgIC8vIHNjcm9sbHMgdG8gdG9wIG9mIHBhZ2Ugb24gc3RhdGUgY2hhbmdlXG4gICAgICAgICR1aVZpZXdTY3JvbGxQcm92aWRlci51c2VBbmNob3JTY3JvbGwoKTtcblxuICAgIH0pXG4gICAgLnJ1bihmdW5jdGlvbigkcm9vdFNjb3BlLCBcbiAgICAgICAgQ29uZmlndXJhdGlvbiwgXG4gICAgICAgICRzdGF0ZSwgXG4gICAgICAgICRzZXNzaW9uU3RvcmFnZSkge1xuXG4gICAgICAgICRyb290U2NvcGUuYXBwTmFtZSA9IENvbmZpZ3VyYXRpb24uYXBwTmFtZTtcbiAgICAgICAgJHJvb3RTY29wZS5jb21wYW55Q29kZSA9IENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGU7XG5cblxuICAgICAgICAkc3RhdGUuZ28oJ2xhbmRpbmcnKTtcblxuICAgICAgICAvL2F1dGggY2hlY2sgZXZlcnkgdGltZSB0aGUgc3RhdGUvcGFnZSBjaGFuZ2VzXG4gICAgICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgICAgICAvLyAkcm9vdFNjb3BlLnN0YXRlQ2hhbmdlQXV0aENoZWNrKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvL0VWRU5UIEJBTktcbiAgICAgICAgLypcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLCBmdW5jdGlvbihldmVudCwgYXJncykge1xuICAgICAgICB9KTsqL1xuXG5cblxuICAgIH0pXG5cbiAgICAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5maW5kQW5kRWRpdCcsIFtcbiAgJ3VpLnNlbGVjdCcsXG4gICduZ1N0b3JhZ2UnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIGhvbWVDb25maWcoICRzdGF0ZVByb3ZpZGVyICkge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZmluZEFuZEVkaXQnLCB7XG4gICAgdXJsOiAnL2ZpbmRBbmRFZGl0JyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnRmluZEFuZEVkaXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdmaW5kQW5kRWRpdC9maW5kQW5kRWRpdC50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ0ZpbmQgQW5kIEVkaXQnLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsbENsYXNzZXM6IGZ1bmN0aW9uKCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlICkge1xuICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgdXJsOiAnYXBpL2NsYXNzZXMvYWxsJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBqd3Q6ICRzZXNzaW9uU3RvcmFnZS5qd3RcbiAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCByZXMgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignRmluZEFuZEVkaXRDb250cm9sbGVyJywgZnVuY3Rpb24oICRzY29wZSwgJGh0dHAsICRzZXNzaW9uU3RvcmFnZSwgYWxsQ2xhc3NlcywgJHRpbWVvdXQgKSB7XG4gIHZhciBQQVBFUlNfVVJMICAgICAgICAgICAgICAgICAgICAgICA9ICcvYXBpL3BhcGVycyc7XG4gICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydqd3QnXSA9ICRzZXNzaW9uU3RvcmFnZS5qd3Q7XG4gICRzY29wZS5xdWVyeSAgICAgICAgICAgICAgICAgICAgICAgICA9IHt9O1xuICAkc2NvcGUuZWRpdERhdGEgICAgICAgICAgICAgICAgICAgICAgPSB7fTtcbiAgJHNjb3BlLmFsbENsYXNzZXMgICAgICAgICAgICAgICAgICAgID0gYWxsQ2xhc3NlcztcblxuICAkc2NvcGUuc2Vhc29ucyA9IFtcbiAgICB7bmFtZTogJ1NwcmluZycsIGNvZGU6IFwiU1BcIn0sXG4gICAge25hbWU6ICdTdW1tZXInLCBjb2RlOiBcIlNVXCJ9LFxuICAgIHtuYW1lOiAnRmFsbCcsIGNvZGU6IFwiRkFcIn0sXG4gICAge25hbWU6ICdXaW50ZXInLCBjb2RlOiBcIldJXCJ9XG4gIF07XG4gICRzY29wZS55ZWFycyA9IFtcbiAgICB7bmFtZTogJzk1JywgY29kZTogJzk1J30sXG4gICAge25hbWU6ICc5NicsIGNvZGU6ICc5Nid9LFxuICAgIHtuYW1lOiAnOTcnLCBjb2RlOiAnOTcnfSxcbiAgICB7bmFtZTogJzk4JywgY29kZTogJzk4J30sXG4gICAge25hbWU6ICc5OScsIGNvZGU6ICc5OSd9LFxuICAgIHtuYW1lOiAnMDAnLCBjb2RlOiAnMDAnfSxcbiAgICB7bmFtZTogJzAxJywgY29kZTogJzAxJ30sXG4gICAge25hbWU6ICcwMicsIGNvZGU6ICcwMid9LFxuICAgIHtuYW1lOiAnMDMnLCBjb2RlOiAnMDMnfSxcbiAgICB7bmFtZTogJzA0JywgY29kZTogJzA0J30sXG4gICAge25hbWU6ICcwNScsIGNvZGU6ICcwNSd9LFxuICAgIHtuYW1lOiAnMDYnLCBjb2RlOiAnMDYnfSxcbiAgICB7bmFtZTogJzA3JywgY29kZTogJzA3J30sXG4gICAge25hbWU6ICcwOCcsIGNvZGU6ICcwOCd9LFxuICAgIHtuYW1lOiAnMDknLCBjb2RlOiAnMDknfSxcbiAgICB7bmFtZTogJzEwJywgY29kZTogJzEwJ30sXG4gICAge25hbWU6ICcxMScsIGNvZGU6ICcxMSd9LFxuICAgIHtuYW1lOiAnMTInLCBjb2RlOiAnMTInfSxcbiAgICB7bmFtZTogJzEzJywgY29kZTogJzEzJ30sXG4gICAge25hbWU6ICcxNCcsIGNvZGU6ICcxNCd9LFxuICAgIHtuYW1lOiAnMTUnLCBjb2RlOiAnMTUnfVxuICBdO1xuICAkc2NvcGUudHlwZXMgPSBbXG4gICAge25hbWU6ICdIb21ld29yaycsIGNvZGU6ICdIJ30sXG4gICAge25hbWU6ICdNaWR0ZXJtJywgY29kZTogJ00nfSxcbiAgICB7bmFtZTogJ05vdGVzJywgY29kZTogJ04nfSxcbiAgICB7bmFtZTogJ1F1aXonLCBjb2RlOiAnUSd9LFxuICAgIHtuYW1lOiAnRmluYWwnLCBjb2RlOiAnRid9LFxuICAgIHtuYW1lOiAnTGFiJywgY29kZTogJ0wnfVxuICBdO1xuXG4gICRzY29wZS5maW5kQ2xhc3NlcyA9IGZ1bmN0aW9uKCBxdWVyeSApIHtcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgdXJsOiBQQVBFUlNfVVJMICsgJy9jbGFzc0FuZFR5cGUvY2xhc3MvJyArIHF1ZXJ5LmNsYXNzSWQgLy8rICcvdHlwZS8nICsgcXVlcnkudHlwZUNvZGVcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAkc2NvcGUucGFwZXJzID0gcmVzLmRhdGE7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuJHdhdGNoKCdwYXBlcnMnLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoICEkc2NvcGUucGFwZXJzICkgcmV0dXJuO1xuICAgIFxuICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgJHNjb3BlLnBhcGVycy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgcmVuZGVyUGRmKCAkc2NvcGUucGFwZXJzWyBpIF0gKTtcbiAgICAgIH1cbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBmdW5jdGlvbiByZW5kZXJQZGYoIHBhcGVyICkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggcGFwZXIuX2lkICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggcGFwZXIgKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggcGFwZXIuaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAuNDtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfVxuXG4gICRzY29wZS5zaG93RWRpdFBhbmVsID0gZnVuY3Rpb24oaWQpIHtcbiAgICAkc2NvcGVbICdvcGVuRWRpdFBhbmVsLScgKyBpZCBdID0gISRzY29wZVsgJ29wZW5FZGl0UGFuZWwtJyArIGlkIF07XG4gIH07XG5cbiAgJHNjb3BlLmlzRWRpdFBhbmVsT3BlbiA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuICEhJHNjb3BlWyAnb3BlbkVkaXRQYW5lbC0nICsgaWQgXTtcbiAgfTtcblxuICAkc2NvcGUuc3VibWl0RWRpdGVkUGFwZXIgPSBmdW5jdGlvbiggcGFwZXIsIG5ld0RhdGEgKSB7XG4gICAgcHV0T2JqID0ge1xuICAgICAgdGl0bGU6IG5ld0RhdGEudGl0bGUsXG4gICAgICBwZXJpb2Q6IG5ld0RhdGEuc2Vhc29uICsgbmV3RGF0YS55ZWFyLFxuICAgICAgdHlwZTogbmV3RGF0YS50eXBlLFxuICAgICAgY2xhc3NJZDogbmV3RGF0YS5jbGFzc0lkXG4gICAgfTtcblxuICAgIHBhcGVyLnN1Y2Nlc3MgPSAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgdXJsOiAnYXBpL3BhcGVycy9zaW5nbGUvJyArIHBhcGVyLl9pZCxcbiAgICAgIGRhdGE6IHB1dE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgIGNvbnNvbGUubG9nKCByZXMgKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmVycm9yICggZXJyICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH07XG5cblxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmhvbWUnLCBbXG4gICd1aS5zZWxlY3QnLFxuICAnbmdTdG9yYWdlJyxcbiAgJ25nRmlsZVVwbG9hZCcsXG4gICdmaC5zZXJ2aWNlcy5Gb2N1c1NlcnZpY2UnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIGhvbWVDb25maWcoJHN0YXRlUHJvdmlkZXIpIHtcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgdXJsOiAnL2hvbWUnLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaG9tZS9ob21lLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnSG9tZScsXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxsQ2xhc3NlczogZnVuY3Rpb24oICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UgKSB7XG4gICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIGp3dDogJHNlc3Npb25TdG9yYWdlLmp3dFxuICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG5cbiAgICAgIHRva2VuczogZnVuY3Rpb24oICRodHRwICkge1xuICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgdXJsOiAnYXNzZXRzL3Rva2Vucy5qc29uJ1xuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignSG9tZUNvbnRyb2xsZXInLCBmdW5jdGlvbiggJHNjb3BlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkdGltZW91dCwgZ2l2ZUZvY3VzLCBVcGxvYWQsIGFsbENsYXNzZXMsIHRva2VucyApIHtcbiAgdmFyIFBBUEVSU19VUkwgPSAnL2FwaS9wYXBlcnMnO1xuICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnand0J10gPSAkc2Vzc2lvblN0b3JhZ2Uuand0O1xuICAkc2NvcGUuYWxsQ2xhc3NlcyA9IGFsbENsYXNzZXM7XG5cbiAgJHNjb3BlLiR3YXRjaCgnZmlsZXMnLCBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUudXBsb2FkKCAkc2NvcGUuZmlsZXMgKTtcbiAgfSk7XG5cbiAgJHNjb3BlLiR3YXRjaCgnZmlsZScsIGZ1bmN0aW9uKCkge1xuICAgIGlmICgkc2NvcGUuZmlsZSAhPSBudWxsKSB7XG4gICAgICAkc2NvcGUudXBsb2FkKFskc2NvcGUuZmlsZV0pO1xuICAgIH1cbiAgfSk7XG5cbiAgJHNjb3BlLmxvZyAgICAgICAgICA9ICcnO1xuICAkc2NvcGUucGFwZXJzVG9FZGl0ID0gW107XG4gICRzY29wZS5lZGl0RGF0YSAgICAgPSB7fTtcblxuICAkc2NvcGUuc2Vhc29ucyA9IFtcbiAgICB7bmFtZTogJ1NwcmluZycsIGNvZGU6IFwiU1BcIn0sXG4gICAge25hbWU6ICdTdW1tZXInLCBjb2RlOiBcIlNVXCJ9LFxuICAgIHtuYW1lOiAnRmFsbCcsIGNvZGU6IFwiRkFcIn0sXG4gICAge25hbWU6ICdXaW50ZXInLCBjb2RlOiBcIldJXCJ9XG4gIF07XG4gICRzY29wZS55ZWFycyA9IFtcbiAgICB7bmFtZTogJzk1JywgY29kZTogJzk1J30sXG4gICAge25hbWU6ICc5NicsIGNvZGU6ICc5Nid9LFxuICAgIHtuYW1lOiAnOTcnLCBjb2RlOiAnOTcnfSxcbiAgICB7bmFtZTogJzk4JywgY29kZTogJzk4J30sXG4gICAge25hbWU6ICc5OScsIGNvZGU6ICc5OSd9LFxuICAgIHtuYW1lOiAnMDAnLCBjb2RlOiAnMDAnfSxcbiAgICB7bmFtZTogJzAxJywgY29kZTogJzAxJ30sXG4gICAge25hbWU6ICcwMicsIGNvZGU6ICcwMid9LFxuICAgIHtuYW1lOiAnMDMnLCBjb2RlOiAnMDMnfSxcbiAgICB7bmFtZTogJzA0JywgY29kZTogJzA0J30sXG4gICAge25hbWU6ICcwNScsIGNvZGU6ICcwNSd9LFxuICAgIHtuYW1lOiAnMDYnLCBjb2RlOiAnMDYnfSxcbiAgICB7bmFtZTogJzA3JywgY29kZTogJzA3J30sXG4gICAge25hbWU6ICcwOCcsIGNvZGU6ICcwOCd9LFxuICAgIHtuYW1lOiAnMDknLCBjb2RlOiAnMDknfSxcbiAgICB7bmFtZTogJzEwJywgY29kZTogJzEwJ30sXG4gICAge25hbWU6ICcxMScsIGNvZGU6ICcxMSd9LFxuICAgIHtuYW1lOiAnMTInLCBjb2RlOiAnMTInfSxcbiAgICB7bmFtZTogJzEzJywgY29kZTogJzEzJ30sXG4gICAge25hbWU6ICcxNCcsIGNvZGU6ICcxNCd9LFxuICAgIHtuYW1lOiAnMTUnLCBjb2RlOiAnMTUnfVxuICBdO1xuICAkc2NvcGUudHlwZXMgPSBbXG4gICAge25hbWU6ICdIb21ld29yaycsIGNvZGU6ICdIJ30sXG4gICAge25hbWU6ICdNaWR0ZXJtJywgY29kZTogJ00nfSxcbiAgICB7bmFtZTogJ05vdGVzJywgY29kZTogJ04nfSxcbiAgICB7bmFtZTogJ1F1aXonLCBjb2RlOiAnUSd9LFxuICAgIHtuYW1lOiAnRmluYWwnLCBjb2RlOiAnRid9LFxuICAgIHtuYW1lOiAnTGFiJywgY29kZTogJ0wnfVxuICBdO1xuXG4gICRzY29wZS51cGxvYWQgPSBmdW5jdGlvbiggZmlsZXMgKSB7XG4gICAgaWYgKGZpbGVzICYmIGZpbGVzLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZmlsZSA9IGZpbGVzW2ldO1xuXG4gICAgICAgIFVwbG9hZC51cGxvYWQoe1xuICAgICAgICAgIHVybDogUEFQRVJTX1VSTCxcbiAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgIH0pXG5cbiAgICAgICAgLnByb2dyZXNzKGZ1bmN0aW9uICggZXZ0ICkge1xuICAgICAgICAgIHZhciBwcm9ncmVzc1BlcmNlbnRhZ2UgPSBwYXJzZUludCgxMDAuMCAqIGV2dC5sb2FkZWQgLyBldnQudG90YWwpO1xuICAgICAgICAgICRzY29wZS5sb2cgPSAncHJvZ3Jlc3M6ICcgKyBcbiAgICAgICAgICAgIHByb2dyZXNzUGVyY2VudGFnZSArIFxuICAgICAgICAgICAgJyUnICsgXG4gICAgICAgICAgICBldnQuY29uZmlnLmZpbGUubmFtZSArIFxuICAgICAgICAgICAgJ1xcbicgKyBcbiAgICAgICAgICAgICRzY29wZS5sb2c7XG4gICAgICAgIH0pXG5cbiAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oIGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnICkge1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAkc2NvcGUubG9nID0gJ2ZpbGU6ICcgKyBcbiAgICAgICAgICAgICAgY29uZmlnLmZpbGUubmFtZSArIFxuICAgICAgICAgICAgICAnLCBSZXNwb25zZTogJyArIFxuICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSggZGF0YS50aXRsZSApICsgXG4gICAgICAgICAgICAgICcsIElEOiAnICtcbiAgICAgICAgICAgICAgZGF0YS5faWRcbiAgICAgICAgICAgICAgJ1xcbicgKyBcbiAgICAgICAgICAgICAgJHNjb3BlLmxvZztcblxuICAgICAgICAgICAgJHNjb3BlLnBhcGVyc1RvRWRpdC5wdXNoKCBkYXRhICk7XG5cbiAgICAgICAgICAgIGdpdmVGb2N1cygnc2Vhc29uLXBpY2tlcicpO1xuXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICAkc2NvcGUuc3VibWl0RWRpdGVkUGFwZXIgPSBmdW5jdGlvbiggcGFwZXIsIG5ld0RhdGEgKSB7XG4gICAgcHV0T2JqID0ge1xuICAgICAgdGl0bGU6IG5ld0RhdGEudGl0bGUsXG4gICAgICBwZXJpb2Q6IG5ld0RhdGEuc2Vhc29uICsgbmV3RGF0YS55ZWFyLFxuICAgICAgdHlwZTogbmV3RGF0YS50eXBlLFxuICAgICAgY2xhc3NJZDogbmV3RGF0YS5jbGFzc0lkXG4gICAgfTtcblxuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICB1cmw6ICdhcGkvcGFwZXJzL3NpbmdsZS8nICsgcGFwZXIuX2lkLFxuICAgICAgZGF0YTogcHV0T2JqXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgY29uc29sZS5sb2coIHJlcyApO1xuICAgICAgJHNjb3BlLnBhcGVyVG9FZGl0QmFja1N0b3JlID0gJHNjb3BlLnBhcGVyc1RvRWRpdC5zaGlmdCgpO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmVycm9yICggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gcmUtcmVuZGVycyB0aGUgbWFpbiBjYW52YXMgdXBvbiBjaGFuZ2VcbiAgJHNjb3BlLiR3YXRjaCgncGFwZXJzVG9FZGl0WzBdJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtYWluLXZpZXdlcicpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoICRzY29wZS5wYXBlcnNUb0VkaXRbMF0gKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggJHNjb3BlLnBhcGVyc1RvRWRpdFswXS5pbWcuZGF0YSApLnRoZW4oZnVuY3Rpb24oIHBkZiApIHtcbiAgICAgICAgcGRmLmdldFBhZ2UoMSkudGhlbihmdW5jdGlvbihwYWdlKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAwLjg7XG4gICAgICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgICAgICBjYW52YXNDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICAgICAgfTtcbiAgICAgICAgICBwYWdlLnJlbmRlcihyZW5kZXJDb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH0pO1xuXG4gIC8vIHJlLXJlbmRlcnMgdGhlIHNlY29uZGFyeSBjYW52YXMgdXBvbiBjaGFuZ2VcbiAgJHNjb3BlLiR3YXRjaCgncGFwZXJzVG9FZGl0WzFdJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXh0LXVwLXBkZi1jb250YWluZXInKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgaWYgKCAkc2NvcGUucGFwZXJzVG9FZGl0WzFdICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoICRzY29wZS5wYXBlcnNUb0VkaXRbMV0uaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24ocGFnZSkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMC4yO1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9KTtcblxuICAkc2NvcGUuYWRkQ2xhc3MgPSBmdW5jdGlvbiggbmV3Q2xhc3MgKSB7XG4gICAgdmFyIHBvc3RPYmogPSB7dGl0bGU6IG5ld0NsYXNzfTtcblxuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgdXJsOiAnL2FwaS9jbGFzc2VzJyxcbiAgICAgIGRhdGE6IHBvc3RPYmpcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG5cbiAgICAgICRodHRwKHtcbiAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgdXJsOiAnL2FwaS9jbGFzc2VzL2FsbCdcbiAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJlcyApIHtcbiAgICAgICAgJHNjb3BlLmFsbENsYXNzZXMgPSByZXMuZGF0YTtcbiAgICAgIH0pO1xuXG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyAkc2NvcGUuYWRkVG9rZW5zID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgdG9rZW5zLnRva2Vucy5mb3JFYWNoKCBmdW5jdGlvbiggdG9rZW4sIGluZGV4LCBhcnJheSkge1xuICAvLyAgICAgJGh0dHAoe1xuICAvLyAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgLy8gICAgICAgdXJsOiAnL2FwaS9tYWtlVG9rZW4nLFxuICAvLyAgICAgICBkYXRhOiB0b2tlblxuICAvLyAgICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAvLyAgICAgICBjb25zb2xlLmxvZygneWVzJyk7XG4gIC8vICAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAvLyAgICAgICBjb25zb2xlLmxvZygnRkZGRkZGRkZGRlVVVVVVJywgZXJyKTtcbiAgLy8gICAgIH0pO1xuICAvLyAgIH0pO1xuICAvLyB9O1xuXG5cbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmxhbmRpbmcnLFtcbiAgJ25nU3RvcmFnZSdcbl0pXG5cbi5jb25maWcoZnVuY3Rpb24gKCAkc3RhdGVQcm92aWRlciApIHtcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xhbmRpbmcnLCB7XG4gICAgdXJsOiAnLycsXG4gICAgdmlld3M6IHtcbiAgICAgIG1haW46IHtcbiAgICAgICAgY29udHJvbGxlcjogJ0xhbmRpbmdDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdsYW5kaW5nL2xhbmRpbmcudHBsLmh0bWwnXG4gICAgICB9XG4gICAgfSxcbiAgICBwYWdlVGl0bGU6ICdsYW5kaW5nUGFnZS5wYWdlVGl0bGUnXG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ0xhbmRpbmdDb250cm9sbGVyJywgZnVuY3Rpb24gKCAkc2NvcGUsICRzdGF0ZSwgJGh0dHAsICRiYXNlNjQsICRzZXNzaW9uU3RvcmFnZSkge1xuICB2YXIgVVNFUlNfVVJMID0gJy9hcGkvdXNlcnMnO1xuXG4gICRzY29wZS5yZWdpc3RlciA9IGZ1bmN0aW9uKCBjcmVkZW50aWFscyApIHtcbiAgICB2YXIgbmV3VXNlciA9IHtcbiAgICAgIG5hbWU6IGNyZWRlbnRpYWxzLm5hbWUsXG4gICAgICBwaG9uZTogY3JlZGVudGlhbHMucGhvbmUsXG4gICAgICBlbWFpbDogY3JlZGVudGlhbHMuZW1haWwsXG4gICAgICBwYXNzd29yZDogY3JlZGVudGlhbHMucGFzc3dvcmQsXG4gICAgICBwYXNzd29yZENvbmZpcm06IGNyZWRlbnRpYWxzLnBhc3N3b3JkQ29uZmlybSxcbiAgICAgIHRva2VuOiBjcmVkZW50aWFscy5hZGRDb2RlXG4gICAgfTtcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogVVNFUlNfVVJMLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9LFxuICAgICAgZGF0YTogbmV3VXNlclxuICAgIH0pXG4gICAgLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgY29uc29sZS5kaXIoZGF0YSk7XG4gICAgICAvLyAkc2NvcGUucmVnaXN0ZXJDcmVkZW50aWFscyA9IHt9O1xuICAgICAgLy8gJHNjb3BlLnJlZ2lzdGVyU3VjY2VzcyA9IHRydWU7XG4gICAgICAkc2Vzc2lvblN0b3JhZ2Uuand0ID0gZGF0YS5qd3Q7XG4gICAgICAkc3RhdGUuZ28oJ3NlYXJjaCcpO1xuICAgIH0pXG4gICAgLmVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgY29uc29sZS5kaXIoZXJyKTtcbiAgICAgICRzY29wZS5yZWdpc3RlckNyZWRlbnRpYWxzLnBhc3N3b3JkID0gJyc7XG4gICAgICAkc2NvcGUucmVnaXN0ZXJDcmVkZW50aWFscy5wYXNzd29yZENvbmZpcm0gPSAnJztcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbihjcmVkZW50aWFscykge1xuXG4gICAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ0F1dGhvcml6YXRpb24nXSA9IFxuICAgICAgJ0Jhc2ljICcgKyBcbiAgICAgICRiYXNlNjQuZW5jb2RlKGNyZWRlbnRpYWxzLmVtYWlsICsgXG4gICAgICAnOicgKyBcbiAgICAgIGNyZWRlbnRpYWxzLnBhc3N3b3JkKTtcbiAgICBcbiAgICAkaHR0cC5nZXQoVVNFUlNfVVJMKVxuICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICBjb25zb2xlLmRpcihkYXRhKTtcbiAgICAgICAgJHNlc3Npb25TdG9yYWdlLmp3dCA9IGRhdGEuand0O1xuICAgICAgICAkc3RhdGUuZ28oJ3NlYXJjaCcpO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgY29uc29sZS5kaXIoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnZmguc2VhcmNoJywgW1xuICAndWkuc2VsZWN0JyxcbiAgJ25nU3RvcmFnZSdcbl0pXG5cbi5jb25maWcoZnVuY3Rpb24gc2VhcmNoQ29uZmlnKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZWFyY2gnLCB7XG4gICAgdXJsOiAnL3NlYXJjaCcsXG4gICAgdmlld3M6IHtcbiAgICAgIG1haW46IHtcbiAgICAgICAgY29udHJvbGxlcjogJ1NlYXJjaENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3NlYXJjaC9zZWFyY2gudHBsLmh0bWwnXG4gICAgICB9XG4gICAgfSxcbiAgICBwYWdlVGl0bGU6ICdTZWFyY2gnXG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ1NlYXJjaENvbnRyb2xsZXInLCBmdW5jdGlvbiggJHNjb3BlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkdGltZW91dCApIHtcbiAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ2p3dCddID0gJHNlc3Npb25TdG9yYWdlLmp3dDtcbiAgJHNjb3BlLnF1ZXJ5ID0ge307XG4gIHZhciBQQVBFUlNfVVJMID0gJy9hcGkvcGFwZXJzJztcblxuICAkaHR0cCh7XG4gICAgbWV0aG9kOiAnR0VUJyxcbiAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnXG4gIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAkc2NvcGUuYWxsQ2xhc3NlcyA9IHJlcy5kYXRhO1xuICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gIH0pO1xuXG4gICRzY29wZS5maW5kUGFwZXJzQnlDbGFzcyA9IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIHVybDogUEFQRVJTX1VSTCArICcvY2xhc3MvJyArIHF1ZXJ5LmNsYXNzSWRcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAkc2NvcGUucGFwZXJzID0gcmVzLmRhdGE7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuZmluZEltYWdlID0gZnVuY3Rpb24oIHBhcGVySWQgKSB7XG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIHVybDogUEFQRVJTX1VSTCArICcvc2luZ2xlLycgKyBwYXBlcklkXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgJHNjb3BlLnBhcGVyID0gcmVzLmRhdGE7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuJHdhdGNoKCdwYXBlcicsIGZ1bmN0aW9uKCkge1xuICAgIGlmICggISRzY29wZS5wYXBlciApIHJldHVybjtcbiAgICBcbiAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHJlbmRlclBkZiggJHNjb3BlLnBhcGVyICk7XG4gICAgfSwgMTAwKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gcmVuZGVyUGRmKCBwYXBlciApIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoICdkaXNwbGF5LXBhcGVyJyApO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoIHBhcGVyICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoIHBhcGVyLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKCBwYWdlICkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMTtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfVxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmRpcmVjdGl2ZXMubWFpbkhlYWRlcicsIFtcbiAgICAnbmdTdG9yYWdlJyxcbiAgICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJ1xuXSlcblxuLmRpcmVjdGl2ZSgnbWFpbkhlYWRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9tYWluSGVhZGVyL21haW5IZWFkZXIudHBsLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiggJHNjb3BlLCAkc3RhdGUgKSB7XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzLnNob3dQZGZNb2RhbCcsIFtcbiAgJ3VpLmJvb3RzdHJhcCcsXG4gICdmaC5zZXJ2aWNlcy5Nb2RhbFNlcnZpY2UnXG5dKVxuXG4uZGlyZWN0aXZlKCdzaG93UGRmTW9kYWwnLCBmdW5jdGlvbiggTW9kYWxTZXJ2aWNlICkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnQUUnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgTW9kYWxTZXJ2aWNlLm9wZW5Nb2RhbCh7XG4gICAgICAgICAgdGVtcGxhdGVVcmw6ICdkaXJlY3RpdmVzL21vZGFscy9zaG93UGRmTW9kYWwvc2hvd1BkZk1vZGFsLnRwbC5odG1sJyxcbiAgICAgICAgICBjb250cm9sbGVyOiAnU2hvd1BkZk1vZGFsQ29udHJvbGxlcicsXG4gICAgICAgICAgd2luZG93Q2xhc3M6ICdzaG93LXBkZi1tb2RhbCcsXG4gICAgICAgICAgYmFja2Ryb3A6ICdzdGF0aWMnLFxuICAgICAgICAgIGtleWJvYXJkOiBmYWxzZSxcbiAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICBwYXBlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzY29wZS5wYXBlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufSlcblxuLmNvbnRyb2xsZXIoJ1Nob3dQZGZNb2RhbENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsICR0aW1lb3V0LCBNb2RhbFNlcnZpY2UsIHBhcGVyKSB7XG4gICRzY29wZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIE1vZGFsU2VydmljZS5jbG9zZU1vZGFsKCk7XG4gIH07XG4gICRzY29wZS5tb2RhbElkID0gcGFwZXIuX2lkICsgJ21vZGFsJztcbiAgJHNjb3BlLnBhcGVyID0gcGFwZXJcblxuICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQocGFwZXIuX2lkICsgJ21vZGFsJyk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggcGFwZXIgKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggcGFwZXIuaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAxO1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9LCA1MCk7XG4gICAgXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnZmguc2VydmljZXMuRmluZEltYWdlU2VydmljZScsIFtcbiAgICAgICAgJ25nU3RvcmFnZScsXG4gICAgICAgICd2ZW5kb3Iuc3RlZWxUb2UnXG4gICAgXSlcblxuLmZhY3RvcnkoJ0ZpbmRJbWFnZVNlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkcSwgc3RlZWxUb2UpIHtcblxuICAgIGZ1bmN0aW9uIGlzSW1hZ2Uoc3JjLCBkZWZhdWx0U3JjKSB7XG5cbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1hZ2Uub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2Vycm9yOiAnICsgc3JjICsgJyBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoIGRlZmF1bHRTcmMgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBzcmMgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2Uuc3JjID0gc3JjO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldEhlYWRlckltYWdlOiBmdW5jdGlvbihjb21wYW55Q29kZSkge1xuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gJy4vYXNzZXRzL2ltYWdlcy9oZWFkZXJJbWFnZS5qcGcnO1xuICAgICAgICAgICAgcmV0dXJuIGlzSW1hZ2UoaW1hZ2VVcmwpO1xuICAgICAgICB9XG4gICAgfTtcbn0pO1xuXG5cblxuLy8gaW50ZXJpb3Jcbi8vIEksIEosIEssIEwsIE0sIE1NLCBOLCBOTiwgSUEsIElRLCBSXG5cbi8vIG9jZWFuXG4vLyBDLCBDQSwgQ1EsIEQsIERBLCBERCwgRSwgRUUsIEYsIEZBLCBGQiwgRkYsIEcsIEgsIEhILCBHRywgT08sIFFcblxuLy8gdmlzdGFcbi8vIEEsIEFBLCBBQiwgQVMsIEIsIEJBLCBCQiwgQkMsIEJRXG5cbi8vIG5lcHR1bmVcbi8vIFMsIFNBLCBTQiwgU0MsIFNRXG5cbi8vIHBpbm5hY2xlXG4vLyBQU1xuXG4vLyB2ZXJhbmRhaFxuLy8gViwgVkEsIFZCLCBWQywgVkQsIFZFLCBWRiwgVkgsIFZRLCBWUywgVlRcblxuLy8gc2lnbmF0dXJlXG4vLyBTUywgU1ksIFNaLCBTVVxuXG4vLyBsYW5haVxuLy8gQ0FcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLkZvY3VzU2VydmljZScsIFtdKVxuXG4uZmFjdG9yeSgnZ2l2ZUZvY3VzJywgZnVuY3Rpb24oJHRpbWVvdXQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgICAgIGlmKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLk1vZGFsU2VydmljZScsIFtcbiAgICAndWkuYm9vdHN0cmFwLm1vZGFsJyxcbl0pXG4uc2VydmljZSgnTW9kYWxTZXJ2aWNlJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJG1vZGFsKSB7XG4gICAgdmFyIG1lID0ge1xuICAgICAgICBtb2RhbDogbnVsbCxcbiAgICAgICAgbW9kYWxBcmdzOiBudWxsLFxuICAgICAgICBpc01vZGFsT3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbWUubW9kYWwgIT09IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW5Nb2RhbDogZnVuY3Rpb24oYXJncykge1xuICAgICAgICAgICAgbWUuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgbWUubW9kYWxBcmdzID0gYXJncztcbiAgICAgICAgICAgIG1lLm1vZGFsID0gJG1vZGFsLm9wZW4oYXJncyk7XG5cbiAgICAgICAgICAgIHJldHVybiBtZS5tb2RhbDtcbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2VNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAobWUubW9kYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1lLm1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICBtZS5tb2RhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgbWUubW9kYWxBcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvL1doZW4gdGhlIHVzZXIgbmF2aWdhdGVzIGF3YXkgZnJvbSBhIHBhZ2Ugd2hpbGUgYSBtb2RhbCBpcyBvcGVuLCBjbG9zZSB0aGUgbW9kYWwuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcbiAgICAgICAgbWUuY2xvc2VNb2RhbCgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1lO1xufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9