(function () {
    'use strict';
})();

angular.module('fh', [
    'ngStorage',
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
    if ( !credentials.name ||
         !credentials.email ||
         !credentials.password ||
         !credentials.passwordConfirm ||
         !credentials.addCode ) {
      $scope.registrationError = 'Please complete the form before submitting';
      return;
    }

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
      $scope.registrationError = err;
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
        $scope.loginError = err;
        console.dir(err);
      });
  };

});
angular.module('fh.search', [
  'ui.select',
  'cgBusy',
  'ngStorage',
  'smart-table'
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

  $scope.reverse    = true;
  $scope.predicate  = 'period';
  $scope.rendered   = false;
  $scope.query      = {};
  var PAPERS_URL    = '/api/papers';
  $scope.sortPeriod = {
    active: true,
    reverse: true
  };
  $scope.sortType   = {
    active: false,
    reverse: false
  };

  var page;

  $http({
    method: 'GET',
    url: 'api/classes/all'
  }).then(function( res ) {
    $scope.allClasses = res.data;
  }, function( err ) {
    console.log(err);
  });

  $scope.togglePeriodReverse = function() {
    $scope.sortType.active    = false;
    $scope.sortType.reverse   = false;
    $scope.sortPeriod.active  = true;
    $scope.sortPeriod.reverse = !$scope.sortPeriod.reverse;
  };

  $scope.toggleTypeReverse = function() {
    $scope.sortPeriod.active  = false;
    // \/\/\/ sortPeriod.reverse is reset to true because it's more natural to see larger dates (more recent) first
    $scope.sortPeriod.reverse = true; 
    $scope.sortType.active    = true;
    $scope.sortType.reverse   = !$scope.sortType.reverse;
  };

  $scope.hoverInOrOut = function() {
    this.hoverEdit = !this.hoverEdit;
  };

  $scope.findPapersByClass = function(query) {
    $scope.busyFindingPapers = $http({
      method: 'GET',
      url: PAPERS_URL + '/class/' + query.classId
    }).then(function( res ) {
      $scope.papers = deserializePapers(res.data);
    }, function( err ) {
      console.log( err );
    });
  };

  function deserializePapers(papers) {
    if (!papers) return;

    return papers.map(function(paper) {
      var season = paper.period.slice(0,2);
      var year = paper.period.slice(2,4);
      var month;

      // convert season string into month number
      switch (season) {
        case 'WI':
          month = 0;
          break;
        case 'SP':
          month = 3;
          break;
        case 'SU':
          month = 6;
          break;
        case 'FA':
          month = 9;
          break;
      }

      // convert year string into year number (double digits convert to 1900-1999, need 4 year for after 1999)
      year = parseInt(year);

      if (year < 80) {
        year += 2000;
      } else {
        year += 1900;
      }

      paper.period = new Date(year, month, 1);
      return paper;
    });
  }

  $scope.findImage = function( paperId ) {
    $scope.busyFindingPaperImage = $http({
      method: 'GET',
      url: PAPERS_URL + '/single/' + paperId
    }).then(function( res ) {
      $scope.paper = res.data;
    }, function( err ) {
      console.log( err );
    });
  };

  function renderPdf( page ) {
    var canvas = document.getElementById( 'display-paper' );
    var context = canvas.getContext('2d');

    $scope.pdf.getPage( page ).then(function( page ) {
      var scale = 1;
      var viewport = page.getViewport(scale);

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      page.render(renderContext);
    })
  }

  function renderPdfInitial( paper ) {
    $scope.rendered = true;
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

        $scope.pdf = pdf;
        page = 1;

        document.getElementById('previous-page').addEventListener('click',
          function() {
            if ( page > 1 ) {
              page--;
              renderPdf( page );
            }
        });
        document.getElementById('next-page').addEventListener('click',
          function() {
            if ( $scope.pdf.numPages > page ) {
              page++;
              renderPdf( page );
            }
        });
      });


    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  $scope.$watch('paper', function() {
    if ( !$scope.paper ) return;
    $timeout(function() {
      renderPdfInitial( $scope.paper );
    }, 100);
  });

})

.filter('periodFilter', function() {
  return function(inputPeriod) {
    var year     = inputPeriod.getFullYear();
    var winter   = new Date(year, 0, 1);
    var spring   = new Date(year, 3, 1);
    var summer   = new Date(year, 6, 1);
    var fall     = new Date(year, 9, 1);
    var season;

    switch (inputPeriod.getMonth()) {
      case 0:
        season = 'WI';
        break;
      case 3:
        season = 'SP';
        break;
      case 6:
        season = 'SU';
        break;
      case 9:
        season = 'FA';
        break;
    }
    var returnYear = inputPeriod.getFullYear().toString();
    returnYear = returnYear.slice(2,4);

    return '' + season + returnYear;
  }
})

.filter('typeFilter', function() {
  return function(inputType) {
    switch (inputType) {
      case 'H':
        return 'Homework';
        break;
      case 'M':
        return 'Midterm';
        break;
      case 'N':
        return 'Notes';
        break;
      case 'Q':
        return 'Quiz';
        break;
      case 'F':
        return 'Final';
        break;
      case 'L':
        return 'Lab';
        break;
    }
  }
})

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbmRBbmRFZGl0LmpzIiwiaG9tZS5qcyIsImxhbmRpbmcuanMiLCJzZWFyY2guanMiLCJtYWluSGVhZGVyLmpzIiwic2hvd1BkZk1vZGFsLmpzIiwiRmluZEltYWdlU2VydmljZS5qcyIsIkZvY3VzU2VydmljZS5qcyIsIk1vZGFsU2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJmaW5hbHNIZWxwQXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG59KSgpO1xuXG5hbmd1bGFyLm1vZHVsZSgnZmgnLCBbXG4gICAgJ25nU3RvcmFnZScsXG4gICAgJ3VpLnJvdXRlcicsXG4gICAgJ3VpLmJvb3RzdHJhcCcsXG4gICAgJ3VpLmJvb3RzdHJhcC5zaG93RXJyb3JzJyxcbiAgICAndWkudXRpbHMnLFxuICAgICdyZXN0YW5ndWxhcicsXG4gICAgJ3RlbXBsYXRlcy1hcHAnLFxuICAgICd0ZW1wbGF0ZXMtY29tcG9uZW50cycsXG4gICAgJ0FwcGxpY2F0aW9uQ29uZmlndXJhdGlvbicsXG4gICAgJ2ZoLmxhbmRpbmcnLFxuICAgICdmaC5ob21lJyxcbiAgICAnZmguc2VhcmNoJyxcbiAgICAnZmguZmluZEFuZEVkaXQnLFxuICAgICdmaC5kaXJlY3RpdmVzLm1haW5IZWFkZXInLFxuICAgICdmaC5kaXJlY3RpdmVzLm1vZGFscy5zaG93UGRmTW9kYWwnLFxuICAgIC8vICdmaC5kaXJlY3RpdmVzLm1vZGFscycsXG4gICAgJ2ZoLnNlcnZpY2VzLkZvY3VzU2VydmljZScsXG4gICAgJ3ZlbmRvci5zdGVlbFRvZScsXG4gICAgJ2Jhc2U2NCcsXG4gICAgJ2FuZ3VsYXItbW9tZW50anMnXG5dKVxuXG4gICAgLmNvbmZpZyhmdW5jdGlvbigkdXJsUm91dGVyUHJvdmlkZXIsIFJlc3Rhbmd1bGFyUHJvdmlkZXIsIENvbmZpZ3VyYXRpb24sICR1aVZpZXdTY3JvbGxQcm92aWRlciwgJGh0dHBQcm92aWRlcikge1xuXG4gICAgICAgIFJlc3Rhbmd1bGFyUHJvdmlkZXIuc2V0QmFzZVVybCgnL2FwaScpO1xuICAgICAgICBSZXN0YW5ndWxhclByb3ZpZGVyLnNldERlZmF1bHRIdHRwRmllbGRzKHtcbiAgICAgICAgICAgIHdpdGhDcmVkZW50aWFsczogdHJ1ZSxcbiAgICAgICAgICAgIHRpbWVvdXQ6IENvbmZpZ3VyYXRpb24udGltZW91dEluTWlsbGlzLFxuICAgICAgICAgICAgY2FjaGU6IHRydWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLndoZW4oJycsICcvbGFuZGluZycpLm90aGVyd2lzZSgnL2xhbmRpbmcnKTtcblxuICAgICAgICAvLyBzY3JvbGxzIHRvIHRvcCBvZiBwYWdlIG9uIHN0YXRlIGNoYW5nZVxuICAgICAgICAkdWlWaWV3U2Nyb2xsUHJvdmlkZXIudXNlQW5jaG9yU2Nyb2xsKCk7XG5cbiAgICB9KVxuICAgIC5ydW4oZnVuY3Rpb24oJHJvb3RTY29wZSwgXG4gICAgICAgIENvbmZpZ3VyYXRpb24sIFxuICAgICAgICAkc3RhdGUsIFxuICAgICAgICAkc2Vzc2lvblN0b3JhZ2UpIHtcblxuICAgICAgICAkcm9vdFNjb3BlLmFwcE5hbWUgPSBDb25maWd1cmF0aW9uLmFwcE5hbWU7XG4gICAgICAgICRyb290U2NvcGUuY29tcGFueUNvZGUgPSBDb25maWd1cmF0aW9uLmNvbXBhbnlDb2RlO1xuXG5cbiAgICAgICAgJHN0YXRlLmdvKCdsYW5kaW5nJyk7XG5cbiAgICAgICAgLy9hdXRoIGNoZWNrIGV2ZXJ5IHRpbWUgdGhlIHN0YXRlL3BhZ2UgY2hhbmdlc1xuICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xuICAgICAgICAgICAgLy8gJHJvb3RTY29wZS5zdGF0ZUNoYW5nZUF1dGhDaGVjayhldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcyk7XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgLy9FVkVOVCBCQU5LXG4gICAgICAgIC8qXG4gICAgICAgICRyb290U2NvcGUuJG9uKCdhdXRoLWxvZ291dC1zdWNjZXNzJywgZnVuY3Rpb24oZXZlbnQsIGFyZ3MpIHtcbiAgICAgICAgfSk7Ki9cblxuXG5cbiAgICB9KVxuXG4gICAgLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnZmguZmluZEFuZEVkaXQnLCBbXG4gICd1aS5zZWxlY3QnLFxuICAnbmdTdG9yYWdlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiBob21lQ29uZmlnKCAkc3RhdGVQcm92aWRlciApIHtcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2ZpbmRBbmRFZGl0Jywge1xuICAgIHVybDogJy9maW5kQW5kRWRpdCcsXG4gICAgdmlld3M6IHtcbiAgICAgIG1haW46IHtcbiAgICAgICAgY29udHJvbGxlcjogJ0ZpbmRBbmRFZGl0Q29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnZmluZEFuZEVkaXQvZmluZEFuZEVkaXQudHBsLmh0bWwnXG4gICAgICB9XG4gICAgfSxcbiAgICBwYWdlVGl0bGU6ICdGaW5kIEFuZCBFZGl0JyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGxDbGFzc2VzOiBmdW5jdGlvbiggJGh0dHAsICRzZXNzaW9uU3RvcmFnZSApIHtcbiAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIHVybDogJ2FwaS9jbGFzc2VzL2FsbCcsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgand0OiAkc2Vzc2lvblN0b3JhZ2Uuand0XG4gICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uICggcmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ0ZpbmRBbmRFZGl0Q29udHJvbGxlcicsIGZ1bmN0aW9uKCAkc2NvcGUsICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UsIGFsbENsYXNzZXMsICR0aW1lb3V0ICkge1xuICB2YXIgUEFQRVJTX1VSTCAgICAgICAgICAgICAgICAgICAgICAgPSAnL2FwaS9wYXBlcnMnO1xuICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnand0J10gPSAkc2Vzc2lvblN0b3JhZ2Uuand0O1xuICAkc2NvcGUucXVlcnkgICAgICAgICAgICAgICAgICAgICAgICAgPSB7fTtcbiAgJHNjb3BlLmVkaXREYXRhICAgICAgICAgICAgICAgICAgICAgID0ge307XG4gICRzY29wZS5hbGxDbGFzc2VzICAgICAgICAgICAgICAgICAgICA9IGFsbENsYXNzZXM7XG5cbiAgJHNjb3BlLnNlYXNvbnMgPSBbXG4gICAge25hbWU6ICdTcHJpbmcnLCBjb2RlOiBcIlNQXCJ9LFxuICAgIHtuYW1lOiAnU3VtbWVyJywgY29kZTogXCJTVVwifSxcbiAgICB7bmFtZTogJ0ZhbGwnLCBjb2RlOiBcIkZBXCJ9LFxuICAgIHtuYW1lOiAnV2ludGVyJywgY29kZTogXCJXSVwifVxuICBdO1xuICAkc2NvcGUueWVhcnMgPSBbXG4gICAge25hbWU6ICc5NScsIGNvZGU6ICc5NSd9LFxuICAgIHtuYW1lOiAnOTYnLCBjb2RlOiAnOTYnfSxcbiAgICB7bmFtZTogJzk3JywgY29kZTogJzk3J30sXG4gICAge25hbWU6ICc5OCcsIGNvZGU6ICc5OCd9LFxuICAgIHtuYW1lOiAnOTknLCBjb2RlOiAnOTknfSxcbiAgICB7bmFtZTogJzAwJywgY29kZTogJzAwJ30sXG4gICAge25hbWU6ICcwMScsIGNvZGU6ICcwMSd9LFxuICAgIHtuYW1lOiAnMDInLCBjb2RlOiAnMDInfSxcbiAgICB7bmFtZTogJzAzJywgY29kZTogJzAzJ30sXG4gICAge25hbWU6ICcwNCcsIGNvZGU6ICcwNCd9LFxuICAgIHtuYW1lOiAnMDUnLCBjb2RlOiAnMDUnfSxcbiAgICB7bmFtZTogJzA2JywgY29kZTogJzA2J30sXG4gICAge25hbWU6ICcwNycsIGNvZGU6ICcwNyd9LFxuICAgIHtuYW1lOiAnMDgnLCBjb2RlOiAnMDgnfSxcbiAgICB7bmFtZTogJzA5JywgY29kZTogJzA5J30sXG4gICAge25hbWU6ICcxMCcsIGNvZGU6ICcxMCd9LFxuICAgIHtuYW1lOiAnMTEnLCBjb2RlOiAnMTEnfSxcbiAgICB7bmFtZTogJzEyJywgY29kZTogJzEyJ30sXG4gICAge25hbWU6ICcxMycsIGNvZGU6ICcxMyd9LFxuICAgIHtuYW1lOiAnMTQnLCBjb2RlOiAnMTQnfSxcbiAgICB7bmFtZTogJzE1JywgY29kZTogJzE1J31cbiAgXTtcbiAgJHNjb3BlLnR5cGVzID0gW1xuICAgIHtuYW1lOiAnSG9tZXdvcmsnLCBjb2RlOiAnSCd9LFxuICAgIHtuYW1lOiAnTWlkdGVybScsIGNvZGU6ICdNJ30sXG4gICAge25hbWU6ICdOb3RlcycsIGNvZGU6ICdOJ30sXG4gICAge25hbWU6ICdRdWl6JywgY29kZTogJ1EnfSxcbiAgICB7bmFtZTogJ0ZpbmFsJywgY29kZTogJ0YnfSxcbiAgICB7bmFtZTogJ0xhYicsIGNvZGU6ICdMJ31cbiAgXTtcblxuICAkc2NvcGUuZmluZENsYXNzZXMgPSBmdW5jdGlvbiggcXVlcnkgKSB7XG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIHVybDogUEFQRVJTX1VSTCArICcvY2xhc3NBbmRUeXBlL2NsYXNzLycgKyBxdWVyeS5jbGFzc0lkIC8vKyAnL3R5cGUvJyArIHF1ZXJ5LnR5cGVDb2RlXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgJHNjb3BlLnBhcGVycyA9IHJlcy5kYXRhO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLiR3YXRjaCgncGFwZXJzJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCAhJHNjb3BlLnBhcGVycyApIHJldHVybjtcbiAgICBcbiAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIGZvciAoIHZhciBpID0gMDsgaSA8ICRzY29wZS5wYXBlcnMubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgIHJlbmRlclBkZiggJHNjb3BlLnBhcGVyc1sgaSBdICk7XG4gICAgICB9XG4gICAgfSwgMTAwKTtcbiAgfSk7XG5cbiAgZnVuY3Rpb24gcmVuZGVyUGRmKCBwYXBlciApIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoIHBhcGVyLl9pZCApO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoIHBhcGVyICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoIHBhcGVyLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKCBwYWdlICkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gLjQ7XG4gICAgICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgICAgICBjYW52YXNDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICAgICAgfTtcbiAgICAgICAgICBwYWdlLnJlbmRlcihyZW5kZXJDb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH1cblxuICAkc2NvcGUuc2hvd0VkaXRQYW5lbCA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgJHNjb3BlWyAnb3BlbkVkaXRQYW5lbC0nICsgaWQgXSA9ICEkc2NvcGVbICdvcGVuRWRpdFBhbmVsLScgKyBpZCBdO1xuICB9O1xuXG4gICRzY29wZS5pc0VkaXRQYW5lbE9wZW4gPSBmdW5jdGlvbihpZCkge1xuICAgIHJldHVybiAhISRzY29wZVsgJ29wZW5FZGl0UGFuZWwtJyArIGlkIF07XG4gIH07XG5cbiAgJHNjb3BlLnN1Ym1pdEVkaXRlZFBhcGVyID0gZnVuY3Rpb24oIHBhcGVyLCBuZXdEYXRhICkge1xuICAgIHB1dE9iaiA9IHtcbiAgICAgIHRpdGxlOiBuZXdEYXRhLnRpdGxlLFxuICAgICAgcGVyaW9kOiBuZXdEYXRhLnNlYXNvbiArIG5ld0RhdGEueWVhcixcbiAgICAgIHR5cGU6IG5ld0RhdGEudHlwZSxcbiAgICAgIGNsYXNzSWQ6IG5ld0RhdGEuY2xhc3NJZFxuICAgIH07XG5cbiAgICBwYXBlci5zdWNjZXNzID0gJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgIHVybDogJ2FwaS9wYXBlcnMvc2luZ2xlLycgKyBwYXBlci5faWQsXG4gICAgICBkYXRhOiBwdXRPYmpcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICBjb25zb2xlLmxvZyggcmVzICk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5lcnJvciAoIGVyciApO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xuICB9O1xuXG5cbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5ob21lJywgW1xuICAndWkuc2VsZWN0JyxcbiAgJ25nU3RvcmFnZScsXG4gICduZ0ZpbGVVcGxvYWQnLFxuICAnZmguc2VydmljZXMuRm9jdXNTZXJ2aWNlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiBob21lQ29uZmlnKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgIHVybDogJy9ob21lJyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnSG9tZUNvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2hvbWUvaG9tZS50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ0hvbWUnLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsbENsYXNzZXM6IGZ1bmN0aW9uKCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlICkge1xuICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgdXJsOiAnYXBpL2NsYXNzZXMvYWxsJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBqd3Q6ICRzZXNzaW9uU3RvcmFnZS5qd3RcbiAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuXG4gICAgICB0b2tlbnM6IGZ1bmN0aW9uKCAkaHR0cCApIHtcbiAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIHVybDogJ2Fzc2V0cy90b2tlbnMuanNvbidcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ0hvbWVDb250cm9sbGVyJywgZnVuY3Rpb24oICRzY29wZSwgJGh0dHAsICRzZXNzaW9uU3RvcmFnZSwgJHRpbWVvdXQsIGdpdmVGb2N1cywgVXBsb2FkLCBhbGxDbGFzc2VzLCB0b2tlbnMgKSB7XG4gIHZhciBQQVBFUlNfVVJMID0gJy9hcGkvcGFwZXJzJztcbiAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ2p3dCddID0gJHNlc3Npb25TdG9yYWdlLmp3dDtcbiAgJHNjb3BlLmFsbENsYXNzZXMgPSBhbGxDbGFzc2VzO1xuXG4gICRzY29wZS4kd2F0Y2goJ2ZpbGVzJywgZnVuY3Rpb24oKSB7XG4gICAgJHNjb3BlLnVwbG9hZCggJHNjb3BlLmZpbGVzICk7XG4gIH0pO1xuXG4gICRzY29wZS4kd2F0Y2goJ2ZpbGUnLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoJHNjb3BlLmZpbGUgIT0gbnVsbCkge1xuICAgICAgJHNjb3BlLnVwbG9hZChbJHNjb3BlLmZpbGVdKTtcbiAgICB9XG4gIH0pO1xuXG4gICRzY29wZS5sb2cgICAgICAgICAgPSAnJztcbiAgJHNjb3BlLnBhcGVyc1RvRWRpdCA9IFtdO1xuICAkc2NvcGUuZWRpdERhdGEgICAgID0ge307XG5cbiAgJHNjb3BlLnNlYXNvbnMgPSBbXG4gICAge25hbWU6ICdTcHJpbmcnLCBjb2RlOiBcIlNQXCJ9LFxuICAgIHtuYW1lOiAnU3VtbWVyJywgY29kZTogXCJTVVwifSxcbiAgICB7bmFtZTogJ0ZhbGwnLCBjb2RlOiBcIkZBXCJ9LFxuICAgIHtuYW1lOiAnV2ludGVyJywgY29kZTogXCJXSVwifVxuICBdO1xuICAkc2NvcGUueWVhcnMgPSBbXG4gICAge25hbWU6ICc5NScsIGNvZGU6ICc5NSd9LFxuICAgIHtuYW1lOiAnOTYnLCBjb2RlOiAnOTYnfSxcbiAgICB7bmFtZTogJzk3JywgY29kZTogJzk3J30sXG4gICAge25hbWU6ICc5OCcsIGNvZGU6ICc5OCd9LFxuICAgIHtuYW1lOiAnOTknLCBjb2RlOiAnOTknfSxcbiAgICB7bmFtZTogJzAwJywgY29kZTogJzAwJ30sXG4gICAge25hbWU6ICcwMScsIGNvZGU6ICcwMSd9LFxuICAgIHtuYW1lOiAnMDInLCBjb2RlOiAnMDInfSxcbiAgICB7bmFtZTogJzAzJywgY29kZTogJzAzJ30sXG4gICAge25hbWU6ICcwNCcsIGNvZGU6ICcwNCd9LFxuICAgIHtuYW1lOiAnMDUnLCBjb2RlOiAnMDUnfSxcbiAgICB7bmFtZTogJzA2JywgY29kZTogJzA2J30sXG4gICAge25hbWU6ICcwNycsIGNvZGU6ICcwNyd9LFxuICAgIHtuYW1lOiAnMDgnLCBjb2RlOiAnMDgnfSxcbiAgICB7bmFtZTogJzA5JywgY29kZTogJzA5J30sXG4gICAge25hbWU6ICcxMCcsIGNvZGU6ICcxMCd9LFxuICAgIHtuYW1lOiAnMTEnLCBjb2RlOiAnMTEnfSxcbiAgICB7bmFtZTogJzEyJywgY29kZTogJzEyJ30sXG4gICAge25hbWU6ICcxMycsIGNvZGU6ICcxMyd9LFxuICAgIHtuYW1lOiAnMTQnLCBjb2RlOiAnMTQnfSxcbiAgICB7bmFtZTogJzE1JywgY29kZTogJzE1J31cbiAgXTtcbiAgJHNjb3BlLnR5cGVzID0gW1xuICAgIHtuYW1lOiAnSG9tZXdvcmsnLCBjb2RlOiAnSCd9LFxuICAgIHtuYW1lOiAnTWlkdGVybScsIGNvZGU6ICdNJ30sXG4gICAge25hbWU6ICdOb3RlcycsIGNvZGU6ICdOJ30sXG4gICAge25hbWU6ICdRdWl6JywgY29kZTogJ1EnfSxcbiAgICB7bmFtZTogJ0ZpbmFsJywgY29kZTogJ0YnfSxcbiAgICB7bmFtZTogJ0xhYicsIGNvZGU6ICdMJ31cbiAgXTtcblxuICAkc2NvcGUudXBsb2FkID0gZnVuY3Rpb24oIGZpbGVzICkge1xuICAgIGlmIChmaWxlcyAmJiBmaWxlcy5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGZpbGUgPSBmaWxlc1tpXTtcblxuICAgICAgICBVcGxvYWQudXBsb2FkKHtcbiAgICAgICAgICB1cmw6IFBBUEVSU19VUkwsXG4gICAgICAgICAgZmlsZTogZmlsZVxuICAgICAgICB9KVxuXG4gICAgICAgIC5wcm9ncmVzcyhmdW5jdGlvbiAoIGV2dCApIHtcbiAgICAgICAgICB2YXIgcHJvZ3Jlc3NQZXJjZW50YWdlID0gcGFyc2VJbnQoMTAwLjAgKiBldnQubG9hZGVkIC8gZXZ0LnRvdGFsKTtcbiAgICAgICAgICAkc2NvcGUubG9nID0gJ3Byb2dyZXNzOiAnICsgXG4gICAgICAgICAgICBwcm9ncmVzc1BlcmNlbnRhZ2UgKyBcbiAgICAgICAgICAgICclJyArIFxuICAgICAgICAgICAgZXZ0LmNvbmZpZy5maWxlLm5hbWUgKyBcbiAgICAgICAgICAgICdcXG4nICsgXG4gICAgICAgICAgICAkc2NvcGUubG9nO1xuICAgICAgICB9KVxuXG4gICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKCBkYXRhLCBzdGF0dXMsIGhlYWRlcnMsIGNvbmZpZyApIHtcbiAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgJHNjb3BlLmxvZyA9ICdmaWxlOiAnICsgXG4gICAgICAgICAgICAgIGNvbmZpZy5maWxlLm5hbWUgKyBcbiAgICAgICAgICAgICAgJywgUmVzcG9uc2U6ICcgKyBcbiAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkoIGRhdGEudGl0bGUgKSArIFxuICAgICAgICAgICAgICAnLCBJRDogJyArXG4gICAgICAgICAgICAgIGRhdGEuX2lkXG4gICAgICAgICAgICAgICdcXG4nICsgXG4gICAgICAgICAgICAgICRzY29wZS5sb2c7XG5cbiAgICAgICAgICAgICRzY29wZS5wYXBlcnNUb0VkaXQucHVzaCggZGF0YSApO1xuXG4gICAgICAgICAgICBnaXZlRm9jdXMoJ3NlYXNvbi1waWNrZXInKTtcblxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnN1Ym1pdEVkaXRlZFBhcGVyID0gZnVuY3Rpb24oIHBhcGVyLCBuZXdEYXRhICkge1xuICAgIHB1dE9iaiA9IHtcbiAgICAgIHRpdGxlOiBuZXdEYXRhLnRpdGxlLFxuICAgICAgcGVyaW9kOiBuZXdEYXRhLnNlYXNvbiArIG5ld0RhdGEueWVhcixcbiAgICAgIHR5cGU6IG5ld0RhdGEudHlwZSxcbiAgICAgIGNsYXNzSWQ6IG5ld0RhdGEuY2xhc3NJZFxuICAgIH07XG5cbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgdXJsOiAnYXBpL3BhcGVycy9zaW5nbGUvJyArIHBhcGVyLl9pZCxcbiAgICAgIGRhdGE6IHB1dE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgIGNvbnNvbGUubG9nKCByZXMgKTtcbiAgICAgICRzY29wZS5wYXBlclRvRWRpdEJhY2tTdG9yZSA9ICRzY29wZS5wYXBlcnNUb0VkaXQuc2hpZnQoKTtcbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5lcnJvciAoIGVyciApO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIHJlLXJlbmRlcnMgdGhlIG1haW4gY2FudmFzIHVwb24gY2hhbmdlXG4gICRzY29wZS4kd2F0Y2goJ3BhcGVyc1RvRWRpdFswXScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbi12aWV3ZXInKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgaWYgKCAkc2NvcGUucGFwZXJzVG9FZGl0WzBdICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoICRzY29wZS5wYXBlcnNUb0VkaXRbMF0uaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24ocGFnZSkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMC44O1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9KTtcblxuICAvLyByZS1yZW5kZXJzIHRoZSBzZWNvbmRhcnkgY2FudmFzIHVwb24gY2hhbmdlXG4gICRzY29wZS4kd2F0Y2goJ3BhcGVyc1RvRWRpdFsxXScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV4dC11cC1wZGYtY29udGFpbmVyJyk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggJHNjb3BlLnBhcGVyc1RvRWRpdFsxXSApIHtcbiAgICAgIFBERkpTLmdldERvY3VtZW50KCAkc2NvcGUucGFwZXJzVG9FZGl0WzFdLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKHBhZ2UpIHtcblxuICAgICAgICAgIHZhciBzY2FsZSA9IDAuMjtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgJHNjb3BlLmFkZENsYXNzID0gZnVuY3Rpb24oIG5ld0NsYXNzICkge1xuICAgIHZhciBwb3N0T2JqID0ge3RpdGxlOiBuZXdDbGFzc307XG5cbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogJy9hcGkvY2xhc3NlcycsXG4gICAgICBkYXRhOiBwb3N0T2JqXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogJy9hcGkvY2xhc3Nlcy9hbGwnXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXMgKSB7XG4gICAgICAgICRzY29wZS5hbGxDbGFzc2VzID0gcmVzLmRhdGE7XG4gICAgICB9KTtcblxuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gJHNjb3BlLmFkZFRva2VucyA9IGZ1bmN0aW9uKCkge1xuICAvLyAgIHRva2Vucy50b2tlbnMuZm9yRWFjaCggZnVuY3Rpb24oIHRva2VuLCBpbmRleCwgYXJyYXkpIHtcbiAgLy8gICAgICRodHRwKHtcbiAgLy8gICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gIC8vICAgICAgIHVybDogJy9hcGkvbWFrZVRva2VuJyxcbiAgLy8gICAgICAgZGF0YTogdG9rZW5cbiAgLy8gICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgLy8gICAgICAgY29uc29sZS5sb2coJ3llcycpO1xuICAvLyAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgLy8gICAgICAgY29uc29sZS5sb2coJ0ZGRkZGRkZGRkZVVVVVVScsIGVycik7XG4gIC8vICAgICB9KTtcbiAgLy8gICB9KTtcbiAgLy8gfTtcblxuXG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5sYW5kaW5nJyxbXG4gICduZ1N0b3JhZ2UnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uICggJHN0YXRlUHJvdmlkZXIgKSB7XG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsYW5kaW5nJywge1xuICAgIHVybDogJy8nLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdMYW5kaW5nQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnbGFuZGluZy9sYW5kaW5nLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnbGFuZGluZ1BhZ2UucGFnZVRpdGxlJ1xuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdMYW5kaW5nQ29udHJvbGxlcicsIGZ1bmN0aW9uICggJHNjb3BlLCAkc3RhdGUsICRodHRwLCAkYmFzZTY0LCAkc2Vzc2lvblN0b3JhZ2UpIHtcbiAgdmFyIFVTRVJTX1VSTCA9ICcvYXBpL3VzZXJzJztcblxuICAkc2NvcGUucmVnaXN0ZXIgPSBmdW5jdGlvbiggY3JlZGVudGlhbHMgKSB7XG4gICAgaWYgKCAhY3JlZGVudGlhbHMubmFtZSB8fFxuICAgICAgICAgIWNyZWRlbnRpYWxzLmVtYWlsIHx8XG4gICAgICAgICAhY3JlZGVudGlhbHMucGFzc3dvcmQgfHxcbiAgICAgICAgICFjcmVkZW50aWFscy5wYXNzd29yZENvbmZpcm0gfHxcbiAgICAgICAgICFjcmVkZW50aWFscy5hZGRDb2RlICkge1xuICAgICAgJHNjb3BlLnJlZ2lzdHJhdGlvbkVycm9yID0gJ1BsZWFzZSBjb21wbGV0ZSB0aGUgZm9ybSBiZWZvcmUgc3VibWl0dGluZyc7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIG5ld1VzZXIgPSB7XG4gICAgICBuYW1lOiBjcmVkZW50aWFscy5uYW1lLFxuICAgICAgcGhvbmU6IGNyZWRlbnRpYWxzLnBob25lLFxuICAgICAgZW1haWw6IGNyZWRlbnRpYWxzLmVtYWlsLFxuICAgICAgcGFzc3dvcmQ6IGNyZWRlbnRpYWxzLnBhc3N3b3JkLFxuICAgICAgcGFzc3dvcmRDb25maXJtOiBjcmVkZW50aWFscy5wYXNzd29yZENvbmZpcm0sXG4gICAgICB0b2tlbjogY3JlZGVudGlhbHMuYWRkQ29kZVxuICAgIH07XG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICB1cmw6IFVTRVJTX1VSTCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJ1xuICAgICAgfSxcbiAgICAgIGRhdGE6IG5ld1VzZXJcbiAgICB9KVxuICAgIC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIGNvbnNvbGUuZGlyKGRhdGEpO1xuICAgICAgLy8gJHNjb3BlLnJlZ2lzdGVyQ3JlZGVudGlhbHMgPSB7fTtcbiAgICAgIC8vICRzY29wZS5yZWdpc3RlclN1Y2Nlc3MgPSB0cnVlO1xuICAgICAgJHNlc3Npb25TdG9yYWdlLmp3dCA9IGRhdGEuand0O1xuICAgICAgJHN0YXRlLmdvKCdzZWFyY2gnKTtcbiAgICB9KVxuICAgIC5lcnJvcihmdW5jdGlvbihlcnIpIHtcbiAgICAgICRzY29wZS5yZWdpc3RyYXRpb25FcnJvciA9IGVycjtcbiAgICAgIGNvbnNvbGUuZGlyKGVycik7XG4gICAgICAkc2NvcGUucmVnaXN0ZXJDcmVkZW50aWFscy5wYXNzd29yZCA9ICcnO1xuICAgICAgJHNjb3BlLnJlZ2lzdGVyQ3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtID0gJyc7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcblxuICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRob3JpemF0aW9uJ10gPSBcbiAgICAgICdCYXNpYyAnICsgXG4gICAgICAkYmFzZTY0LmVuY29kZShjcmVkZW50aWFscy5lbWFpbCArIFxuICAgICAgJzonICsgXG4gICAgICBjcmVkZW50aWFscy5wYXNzd29yZCk7XG4gICAgXG4gICAgJGh0dHAuZ2V0KFVTRVJTX1VSTClcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY29uc29sZS5kaXIoZGF0YSk7XG4gICAgICAgICRzZXNzaW9uU3RvcmFnZS5qd3QgPSBkYXRhLmp3dDtcbiAgICAgICAgJHN0YXRlLmdvKCdzZWFyY2gnKTtcbiAgICAgIH0pXG4gICAgICAuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICRzY29wZS5sb2dpbkVycm9yID0gZXJyO1xuICAgICAgICBjb25zb2xlLmRpcihlcnIpO1xuICAgICAgfSk7XG4gIH07XG5cbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5zZWFyY2gnLCBbXG4gICd1aS5zZWxlY3QnLFxuICAnY2dCdXN5JyxcbiAgJ25nU3RvcmFnZScsXG4gICdzbWFydC10YWJsZSdcbl0pXG5cbi5jb25maWcoZnVuY3Rpb24gc2VhcmNoQ29uZmlnKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZWFyY2gnLCB7XG4gICAgdXJsOiAnL3NlYXJjaCcsXG4gICAgdmlld3M6IHtcbiAgICAgIG1haW46IHtcbiAgICAgICAgY29udHJvbGxlcjogJ1NlYXJjaENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ3NlYXJjaC9zZWFyY2gudHBsLmh0bWwnXG4gICAgICB9XG4gICAgfSxcbiAgICBwYWdlVGl0bGU6ICdTZWFyY2gnXG4gIH0pO1xufSlcblxuLmNvbnRyb2xsZXIoJ1NlYXJjaENvbnRyb2xsZXInLCBmdW5jdGlvbiggJHNjb3BlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkdGltZW91dCApIHtcbiAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ2p3dCddID0gJHNlc3Npb25TdG9yYWdlLmp3dDtcblxuICAkc2NvcGUucmV2ZXJzZSAgICA9IHRydWU7XG4gICRzY29wZS5wcmVkaWNhdGUgID0gJ3BlcmlvZCc7XG4gICRzY29wZS5yZW5kZXJlZCAgID0gZmFsc2U7XG4gICRzY29wZS5xdWVyeSAgICAgID0ge307XG4gIHZhciBQQVBFUlNfVVJMICAgID0gJy9hcGkvcGFwZXJzJztcbiAgJHNjb3BlLnNvcnRQZXJpb2QgPSB7XG4gICAgYWN0aXZlOiB0cnVlLFxuICAgIHJldmVyc2U6IHRydWVcbiAgfTtcbiAgJHNjb3BlLnNvcnRUeXBlICAgPSB7XG4gICAgYWN0aXZlOiBmYWxzZSxcbiAgICByZXZlcnNlOiBmYWxzZVxuICB9O1xuXG4gIHZhciBwYWdlO1xuXG4gICRodHRwKHtcbiAgICBtZXRob2Q6ICdHRVQnLFxuICAgIHVybDogJ2FwaS9jbGFzc2VzL2FsbCdcbiAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICRzY29wZS5hbGxDbGFzc2VzID0gcmVzLmRhdGE7XG4gIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgY29uc29sZS5sb2coZXJyKTtcbiAgfSk7XG5cbiAgJHNjb3BlLnRvZ2dsZVBlcmlvZFJldmVyc2UgPSBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUuc29ydFR5cGUuYWN0aXZlICAgID0gZmFsc2U7XG4gICAgJHNjb3BlLnNvcnRUeXBlLnJldmVyc2UgICA9IGZhbHNlO1xuICAgICRzY29wZS5zb3J0UGVyaW9kLmFjdGl2ZSAgPSB0cnVlO1xuICAgICRzY29wZS5zb3J0UGVyaW9kLnJldmVyc2UgPSAhJHNjb3BlLnNvcnRQZXJpb2QucmV2ZXJzZTtcbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlVHlwZVJldmVyc2UgPSBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUuc29ydFBlcmlvZC5hY3RpdmUgID0gZmFsc2U7XG4gICAgLy8gXFwvXFwvXFwvIHNvcnRQZXJpb2QucmV2ZXJzZSBpcyByZXNldCB0byB0cnVlIGJlY2F1c2UgaXQncyBtb3JlIG5hdHVyYWwgdG8gc2VlIGxhcmdlciBkYXRlcyAobW9yZSByZWNlbnQpIGZpcnN0XG4gICAgJHNjb3BlLnNvcnRQZXJpb2QucmV2ZXJzZSA9IHRydWU7IFxuICAgICRzY29wZS5zb3J0VHlwZS5hY3RpdmUgICAgPSB0cnVlO1xuICAgICRzY29wZS5zb3J0VHlwZS5yZXZlcnNlICAgPSAhJHNjb3BlLnNvcnRUeXBlLnJldmVyc2U7XG4gIH07XG5cbiAgJHNjb3BlLmhvdmVySW5Pck91dCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaG92ZXJFZGl0ID0gIXRoaXMuaG92ZXJFZGl0O1xuICB9O1xuXG4gICRzY29wZS5maW5kUGFwZXJzQnlDbGFzcyA9IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgJHNjb3BlLmJ1c3lGaW5kaW5nUGFwZXJzID0gJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIHVybDogUEFQRVJTX1VSTCArICcvY2xhc3MvJyArIHF1ZXJ5LmNsYXNzSWRcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAkc2NvcGUucGFwZXJzID0gZGVzZXJpYWxpemVQYXBlcnMocmVzLmRhdGEpO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZGVzZXJpYWxpemVQYXBlcnMocGFwZXJzKSB7XG4gICAgaWYgKCFwYXBlcnMpIHJldHVybjtcblxuICAgIHJldHVybiBwYXBlcnMubWFwKGZ1bmN0aW9uKHBhcGVyKSB7XG4gICAgICB2YXIgc2Vhc29uID0gcGFwZXIucGVyaW9kLnNsaWNlKDAsMik7XG4gICAgICB2YXIgeWVhciA9IHBhcGVyLnBlcmlvZC5zbGljZSgyLDQpO1xuICAgICAgdmFyIG1vbnRoO1xuXG4gICAgICAvLyBjb252ZXJ0IHNlYXNvbiBzdHJpbmcgaW50byBtb250aCBudW1iZXJcbiAgICAgIHN3aXRjaCAoc2Vhc29uKSB7XG4gICAgICAgIGNhc2UgJ1dJJzpcbiAgICAgICAgICBtb250aCA9IDA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1NQJzpcbiAgICAgICAgICBtb250aCA9IDM7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1NVJzpcbiAgICAgICAgICBtb250aCA9IDY7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ0ZBJzpcbiAgICAgICAgICBtb250aCA9IDk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIGNvbnZlcnQgeWVhciBzdHJpbmcgaW50byB5ZWFyIG51bWJlciAoZG91YmxlIGRpZ2l0cyBjb252ZXJ0IHRvIDE5MDAtMTk5OSwgbmVlZCA0IHllYXIgZm9yIGFmdGVyIDE5OTkpXG4gICAgICB5ZWFyID0gcGFyc2VJbnQoeWVhcik7XG5cbiAgICAgIGlmICh5ZWFyIDwgODApIHtcbiAgICAgICAgeWVhciArPSAyMDAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgeWVhciArPSAxOTAwO1xuICAgICAgfVxuXG4gICAgICBwYXBlci5wZXJpb2QgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgMSk7XG4gICAgICByZXR1cm4gcGFwZXI7XG4gICAgfSk7XG4gIH1cblxuICAkc2NvcGUuZmluZEltYWdlID0gZnVuY3Rpb24oIHBhcGVySWQgKSB7XG4gICAgJHNjb3BlLmJ1c3lGaW5kaW5nUGFwZXJJbWFnZSA9ICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICB1cmw6IFBBUEVSU19VUkwgKyAnL3NpbmdsZS8nICsgcGFwZXJJZFxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgICRzY29wZS5wYXBlciA9IHJlcy5kYXRhO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gcmVuZGVyUGRmKCBwYWdlICkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2Rpc3BsYXktcGFwZXInICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICRzY29wZS5wZGYuZ2V0UGFnZSggcGFnZSApLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG4gICAgICB2YXIgc2NhbGUgPSAxO1xuICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgfTtcbiAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJQZGZJbml0aWFsKCBwYXBlciApIHtcbiAgICAkc2NvcGUucmVuZGVyZWQgPSB0cnVlO1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2Rpc3BsYXktcGFwZXInICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggcGFwZXIgKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggcGFwZXIuaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAxO1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5wZGYgPSBwZGY7XG4gICAgICAgIHBhZ2UgPSAxO1xuXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcmV2aW91cy1wYWdlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLFxuICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCBwYWdlID4gMSApIHtcbiAgICAgICAgICAgICAgcGFnZS0tO1xuICAgICAgICAgICAgICByZW5kZXJQZGYoIHBhZ2UgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXh0LXBhZ2UnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoICRzY29wZS5wZGYubnVtUGFnZXMgPiBwYWdlICkge1xuICAgICAgICAgICAgICBwYWdlKys7XG4gICAgICAgICAgICAgIHJlbmRlclBkZiggcGFnZSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG5cbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH1cblxuICAkc2NvcGUuJHdhdGNoKCdwYXBlcicsIGZ1bmN0aW9uKCkge1xuICAgIGlmICggISRzY29wZS5wYXBlciApIHJldHVybjtcbiAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIHJlbmRlclBkZkluaXRpYWwoICRzY29wZS5wYXBlciApO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG59KVxuXG4uZmlsdGVyKCdwZXJpb2RGaWx0ZXInLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0UGVyaW9kKSB7XG4gICAgdmFyIHllYXIgICAgID0gaW5wdXRQZXJpb2QuZ2V0RnVsbFllYXIoKTtcbiAgICB2YXIgd2ludGVyICAgPSBuZXcgRGF0ZSh5ZWFyLCAwLCAxKTtcbiAgICB2YXIgc3ByaW5nICAgPSBuZXcgRGF0ZSh5ZWFyLCAzLCAxKTtcbiAgICB2YXIgc3VtbWVyICAgPSBuZXcgRGF0ZSh5ZWFyLCA2LCAxKTtcbiAgICB2YXIgZmFsbCAgICAgPSBuZXcgRGF0ZSh5ZWFyLCA5LCAxKTtcbiAgICB2YXIgc2Vhc29uO1xuXG4gICAgc3dpdGNoIChpbnB1dFBlcmlvZC5nZXRNb250aCgpKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIHNlYXNvbiA9ICdXSSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBzZWFzb24gPSAnU1AnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjpcbiAgICAgICAgc2Vhc29uID0gJ1NVJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDk6XG4gICAgICAgIHNlYXNvbiA9ICdGQSc7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB2YXIgcmV0dXJuWWVhciA9IGlucHV0UGVyaW9kLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcbiAgICByZXR1cm5ZZWFyID0gcmV0dXJuWWVhci5zbGljZSgyLDQpO1xuXG4gICAgcmV0dXJuICcnICsgc2Vhc29uICsgcmV0dXJuWWVhcjtcbiAgfVxufSlcblxuLmZpbHRlcigndHlwZUZpbHRlcicsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oaW5wdXRUeXBlKSB7XG4gICAgc3dpdGNoIChpbnB1dFR5cGUpIHtcbiAgICAgIGNhc2UgJ0gnOlxuICAgICAgICByZXR1cm4gJ0hvbWV3b3JrJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdNJzpcbiAgICAgICAgcmV0dXJuICdNaWR0ZXJtJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdOJzpcbiAgICAgICAgcmV0dXJuICdOb3Rlcyc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnUSc6XG4gICAgICAgIHJldHVybiAnUXVpeic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnRic6XG4gICAgICAgIHJldHVybiAnRmluYWwnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0wnOlxuICAgICAgICByZXR1cm4gJ0xhYic7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufSlcbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5kaXJlY3RpdmVzLm1haW5IZWFkZXInLCBbXG4gICAgJ25nU3RvcmFnZScsXG4gICAgJ0FwcGxpY2F0aW9uQ29uZmlndXJhdGlvbidcbl0pXG5cbi5kaXJlY3RpdmUoJ21haW5IZWFkZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2RpcmVjdGl2ZXMvbWFpbkhlYWRlci9tYWluSGVhZGVyLnRwbC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oICRzY29wZSwgJHN0YXRlICkge1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5kaXJlY3RpdmVzLm1vZGFscy5zaG93UGRmTW9kYWwnLCBbXG4gICd1aS5ib290c3RyYXAnLFxuICAnZmguc2VydmljZXMuTW9kYWxTZXJ2aWNlJ1xuXSlcblxuLmRpcmVjdGl2ZSgnc2hvd1BkZk1vZGFsJywgZnVuY3Rpb24oIE1vZGFsU2VydmljZSApIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0FFJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIE1vZGFsU2VydmljZS5vcGVuTW9kYWwoe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9tb2RhbHMvc2hvd1BkZk1vZGFsL3Nob3dQZGZNb2RhbC50cGwuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlcjogJ1Nob3dQZGZNb2RhbENvbnRyb2xsZXInLFxuICAgICAgICAgIHdpbmRvd0NsYXNzOiAnc2hvdy1wZGYtbW9kYWwnLFxuICAgICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgICBrZXlib2FyZDogZmFsc2UsXG4gICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgcGFwZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gc2NvcGUucGFwZXI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn0pXG5cbi5jb250cm9sbGVyKCdTaG93UGRmTW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkdGltZW91dCwgTW9kYWxTZXJ2aWNlLCBwYXBlcikge1xuICAkc2NvcGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICBNb2RhbFNlcnZpY2UuY2xvc2VNb2RhbCgpO1xuICB9O1xuICAkc2NvcGUubW9kYWxJZCA9IHBhcGVyLl9pZCArICdtb2RhbCc7XG4gICRzY29wZS5wYXBlciA9IHBhcGVyXG5cbiAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHBhcGVyLl9pZCArICdtb2RhbCcpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoIHBhcGVyICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoIHBhcGVyLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKCBwYWdlICkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMTtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfSwgNTApO1xuICAgIFxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLkZpbmRJbWFnZVNlcnZpY2UnLCBbXG4gICAgICAgICduZ1N0b3JhZ2UnLFxuICAgICAgICAndmVuZG9yLnN0ZWVsVG9lJ1xuICAgIF0pXG5cbi5mYWN0b3J5KCdGaW5kSW1hZ2VTZXJ2aWNlJywgZnVuY3Rpb24oJGh0dHAsICRzZXNzaW9uU3RvcmFnZSwgJHEsIHN0ZWVsVG9lKSB7XG5cbiAgICBmdW5jdGlvbiBpc0ltYWdlKHNyYywgZGVmYXVsdFNyYykge1xuXG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltYWdlLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdlcnJvcjogJyArIHNyYyArICcgbm90IGZvdW5kJyk7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBkZWZhdWx0U3JjICk7XG4gICAgICAgIH07XG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSggc3JjICk7XG4gICAgICAgIH07XG4gICAgICAgIGltYWdlLnNyYyA9IHNyYztcblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRIZWFkZXJJbWFnZTogZnVuY3Rpb24oY29tcGFueUNvZGUpIHtcbiAgICAgICAgICAgIHZhciBpbWFnZVVybCA9ICcuL2Fzc2V0cy9pbWFnZXMvaGVhZGVySW1hZ2UuanBnJztcbiAgICAgICAgICAgIHJldHVybiBpc0ltYWdlKGltYWdlVXJsKTtcbiAgICAgICAgfVxuICAgIH07XG59KTtcblxuXG5cbi8vIGludGVyaW9yXG4vLyBJLCBKLCBLLCBMLCBNLCBNTSwgTiwgTk4sIElBLCBJUSwgUlxuXG4vLyBvY2VhblxuLy8gQywgQ0EsIENRLCBELCBEQSwgREQsIEUsIEVFLCBGLCBGQSwgRkIsIEZGLCBHLCBILCBISCwgR0csIE9PLCBRXG5cbi8vIHZpc3RhXG4vLyBBLCBBQSwgQUIsIEFTLCBCLCBCQSwgQkIsIEJDLCBCUVxuXG4vLyBuZXB0dW5lXG4vLyBTLCBTQSwgU0IsIFNDLCBTUVxuXG4vLyBwaW5uYWNsZVxuLy8gUFNcblxuLy8gdmVyYW5kYWhcbi8vIFYsIFZBLCBWQiwgVkMsIFZELCBWRSwgVkYsIFZILCBWUSwgVlMsIFZUXG5cbi8vIHNpZ25hdHVyZVxuLy8gU1MsIFNZLCBTWiwgU1VcblxuLy8gbGFuYWlcbi8vIENBXG5cbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5zZXJ2aWNlcy5Gb2N1c1NlcnZpY2UnLCBbXSlcblxuLmZhY3RvcnkoJ2dpdmVGb2N1cycsIGZ1bmN0aW9uKCR0aW1lb3V0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgICAgICBpZihlbGVtZW50KVxuICAgICAgICAgICAgICAgIGVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5zZXJ2aWNlcy5Nb2RhbFNlcnZpY2UnLCBbXG4gICAgJ3VpLmJvb3RzdHJhcC5tb2RhbCcsXG5dKVxuLnNlcnZpY2UoJ01vZGFsU2VydmljZScsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRtb2RhbCkge1xuICAgIHZhciBtZSA9IHtcbiAgICAgICAgbW9kYWw6IG51bGwsXG4gICAgICAgIG1vZGFsQXJnczogbnVsbCxcbiAgICAgICAgaXNNb2RhbE9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIG1lLm1vZGFsICE9PSBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBvcGVuTW9kYWw6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgICAgIG1lLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgIG1lLm1vZGFsQXJncyA9IGFyZ3M7XG4gICAgICAgICAgICBtZS5tb2RhbCA9ICRtb2RhbC5vcGVuKGFyZ3MpO1xuXG4gICAgICAgICAgICByZXR1cm4gbWUubW9kYWw7XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKG1lLm1vZGFsID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtZS5tb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgbWUubW9kYWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIG1lLm1vZGFsQXJncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy9XaGVuIHRoZSB1c2VyIG5hdmlnYXRlcyBhd2F5IGZyb20gYSBwYWdlIHdoaWxlIGEgbW9kYWwgaXMgb3BlbiwgY2xvc2UgdGhlIG1vZGFsLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgIG1lLmNsb3NlTW9kYWwoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBtZTtcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==