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

.controller('SearchController', function( $rootScope, $scope, $http, $sessionStorage, $timeout ) {
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
      $scope.paperToRender = res.data;
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

  $scope.$watch('paperToRender', function() {
    if ( !$scope.paperToRender ) return;
    $timeout(function() {
      // renderPdfInitial( $scope.paper );
      $rootScope.$broadcast('pdf-ready-to-render');
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

.directive('showPdfModal', function( ModalService, $http ) {
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
            paperToRender: function() {
              return $http({
                method: 'GET',
                url: '/api/papers' + '/single/' + scope.paper._id
              }).then(function( res ) {
                return res.data;
              }, function( err ) {
                console.log( err );
              });
            }
          }
        });
      });
    }
  };
})

.controller('ShowPdfModalController', function($scope, $timeout, ModalService, paperToRender) {
  $scope.close = function() {
    ModalService.closeModal();
  };
  var page;
  $scope.paperToRender = paperToRender;

  $timeout(function() {
    var canvas = document.getElementById('rendered-pdf-modal');
    var context = canvas.getContext('2d');
    if ( paperToRender ) {
      PDFJS.getDocument( paperToRender.img.data ).then(function( pdf ) {
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
        $scope.page = 1

        // event listeners for PDF page navigation
        document.getElementById('previous-page-modal').addEventListener('click',
          function() {
            if ( $scope.page > 1 ) {
              $scope.page--;
              renderPdf( $scope.page );
            }
        });
        document.getElementById('next-page-modal').addEventListener('click',
          function() {
            if ( $scope.pdf.numPages > $scope.page ) {
              $scope.page++;
              renderPdf( $scope.page );
            }
        });
      });
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, 50);

  // $scope.nextPage = function() {
  //   if ( $scope.pdf.numPages > $scope.page ) {
  //     $scope.page++;
  //     renderPdf( $scope.page );
  //   }
  // };

  function renderPdf( page ) {
    var canvas = document.getElementById('rendered-pdf-modal');
    var context = canvas.getContext('2d');

    $scope.pdf.getPage( page ).then(function( renderPage ) {
      var scale = 1;
      var viewport = renderPage.getViewport(scale);

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      renderPage.render(renderContext);
    })
  }
    
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbmRBbmRFZGl0LmpzIiwiaG9tZS5qcyIsImxhbmRpbmcuanMiLCJzZWFyY2guanMiLCJtYWluSGVhZGVyLmpzIiwic2hvd1BkZk1vZGFsLmpzIiwiRmluZEltYWdlU2VydmljZS5qcyIsIkZvY3VzU2VydmljZS5qcyIsIk1vZGFsU2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaFFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZmluYWxzSGVscEFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xufSkoKTtcblxuYW5ndWxhci5tb2R1bGUoJ2ZoJywgW1xuICAgICduZ1N0b3JhZ2UnLFxuICAgICd1aS5yb3V0ZXInLFxuICAgICd1aS5ib290c3RyYXAnLFxuICAgICd1aS5ib290c3RyYXAuc2hvd0Vycm9ycycsXG4gICAgJ3VpLnV0aWxzJyxcbiAgICAncmVzdGFuZ3VsYXInLFxuICAgICd0ZW1wbGF0ZXMtYXBwJyxcbiAgICAndGVtcGxhdGVzLWNvbXBvbmVudHMnLFxuICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nLFxuICAgICdmaC5sYW5kaW5nJyxcbiAgICAnZmguaG9tZScsXG4gICAgJ2ZoLnNlYXJjaCcsXG4gICAgJ2ZoLmZpbmRBbmRFZGl0JyxcbiAgICAnZmguZGlyZWN0aXZlcy5tYWluSGVhZGVyJyxcbiAgICAnZmguZGlyZWN0aXZlcy5tb2RhbHMuc2hvd1BkZk1vZGFsJyxcbiAgICAvLyAnZmguZGlyZWN0aXZlcy5tb2RhbHMnLFxuICAgICdmaC5zZXJ2aWNlcy5Gb2N1c1NlcnZpY2UnLFxuICAgICd2ZW5kb3Iuc3RlZWxUb2UnLFxuICAgICdiYXNlNjQnLFxuICAgICdhbmd1bGFyLW1vbWVudGpzJ1xuXSlcblxuICAgIC5jb25maWcoZnVuY3Rpb24oJHVybFJvdXRlclByb3ZpZGVyLCBSZXN0YW5ndWxhclByb3ZpZGVyLCBDb25maWd1cmF0aW9uLCAkdWlWaWV3U2Nyb2xsUHJvdmlkZXIsICRodHRwUHJvdmlkZXIpIHtcblxuICAgICAgICBSZXN0YW5ndWxhclByb3ZpZGVyLnNldEJhc2VVcmwoJy9hcGknKTtcbiAgICAgICAgUmVzdGFuZ3VsYXJQcm92aWRlci5zZXREZWZhdWx0SHR0cEZpZWxkcyh7XG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWUsXG4gICAgICAgICAgICB0aW1lb3V0OiBDb25maWd1cmF0aW9uLnRpbWVvdXRJbk1pbGxpcyxcbiAgICAgICAgICAgIGNhY2hlOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcnLCAnL2xhbmRpbmcnKS5vdGhlcndpc2UoJy9sYW5kaW5nJyk7XG5cbiAgICAgICAgLy8gc2Nyb2xscyB0byB0b3Agb2YgcGFnZSBvbiBzdGF0ZSBjaGFuZ2VcbiAgICAgICAgJHVpVmlld1Njcm9sbFByb3ZpZGVyLnVzZUFuY2hvclNjcm9sbCgpO1xuXG4gICAgfSlcbiAgICAucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsIFxuICAgICAgICBDb25maWd1cmF0aW9uLCBcbiAgICAgICAgJHN0YXRlLCBcbiAgICAgICAgJHNlc3Npb25TdG9yYWdlKSB7XG5cbiAgICAgICAgJHJvb3RTY29wZS5hcHBOYW1lID0gQ29uZmlndXJhdGlvbi5hcHBOYW1lO1xuICAgICAgICAkcm9vdFNjb3BlLmNvbXBhbnlDb2RlID0gQ29uZmlndXJhdGlvbi5jb21wYW55Q29kZTtcblxuXG4gICAgICAgICRzdGF0ZS5nbygnbGFuZGluZycpO1xuXG4gICAgICAgIC8vYXV0aCBjaGVjayBldmVyeSB0aW1lIHRoZSBzdGF0ZS9wYWdlIGNoYW5nZXNcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcbiAgICAgICAgICAgIC8vICRyb290U2NvcGUuc3RhdGVDaGFuZ2VBdXRoQ2hlY2soZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpO1xuICAgICAgICB9KTtcblxuXG4gICAgICAgIC8vRVZFTlQgQkFOS1xuICAgICAgICAvKlxuICAgICAgICAkcm9vdFNjb3BlLiRvbignYXV0aC1sb2dvdXQtc3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCBhcmdzKSB7XG4gICAgICAgIH0pOyovXG5cblxuXG4gICAgfSlcblxuICAgIC5jb25zdGFudCgnQVVUSF9FVkVOVFMnLCB7XG4gICAgICAgIGxvZ2luU3VjY2VzczogJ2F1dGgtbG9naW4tc3VjY2VzcycsXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxuICAgICAgICBsb2dvdXRTdWNjZXNzOiAnYXV0aC1sb2dvdXQtc3VjY2VzcycsXG4gICAgICAgIHNlc3Npb25UaW1lb3V0OiAnYXV0aC1zZXNzaW9uLXRpbWVvdXQnLFxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXG4gICAgICAgIG5vdEF1dGhvcml6ZWQ6ICdhdXRoLW5vdC1hdXRob3JpemVkJ1xuICAgIH0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmZpbmRBbmRFZGl0JywgW1xuICAndWkuc2VsZWN0JyxcbiAgJ25nU3RvcmFnZSdcbl0pXG5cbi5jb25maWcoZnVuY3Rpb24gaG9tZUNvbmZpZyggJHN0YXRlUHJvdmlkZXIgKSB7XG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdmaW5kQW5kRWRpdCcsIHtcbiAgICB1cmw6ICcvZmluZEFuZEVkaXQnLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdGaW5kQW5kRWRpdENvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2ZpbmRBbmRFZGl0L2ZpbmRBbmRFZGl0LnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnRmluZCBBbmQgRWRpdCcsXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxsQ2xhc3NlczogZnVuY3Rpb24oICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UgKSB7XG4gICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIGp3dDogJHNlc3Npb25TdG9yYWdlLmp3dFxuICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAoIHJlcyApIHtcbiAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdGaW5kQW5kRWRpdENvbnRyb2xsZXInLCBmdW5jdGlvbiggJHNjb3BlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCBhbGxDbGFzc2VzLCAkdGltZW91dCApIHtcbiAgdmFyIFBBUEVSU19VUkwgICAgICAgICAgICAgICAgICAgICAgID0gJy9hcGkvcGFwZXJzJztcbiAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ2p3dCddID0gJHNlc3Npb25TdG9yYWdlLmp3dDtcbiAgJHNjb3BlLnF1ZXJ5ICAgICAgICAgICAgICAgICAgICAgICAgID0ge307XG4gICRzY29wZS5lZGl0RGF0YSAgICAgICAgICAgICAgICAgICAgICA9IHt9O1xuICAkc2NvcGUuYWxsQ2xhc3NlcyAgICAgICAgICAgICAgICAgICAgPSBhbGxDbGFzc2VzO1xuXG4gICRzY29wZS5zZWFzb25zID0gW1xuICAgIHtuYW1lOiAnU3ByaW5nJywgY29kZTogXCJTUFwifSxcbiAgICB7bmFtZTogJ1N1bW1lcicsIGNvZGU6IFwiU1VcIn0sXG4gICAge25hbWU6ICdGYWxsJywgY29kZTogXCJGQVwifSxcbiAgICB7bmFtZTogJ1dpbnRlcicsIGNvZGU6IFwiV0lcIn1cbiAgXTtcbiAgJHNjb3BlLnllYXJzID0gW1xuICAgIHtuYW1lOiAnOTUnLCBjb2RlOiAnOTUnfSxcbiAgICB7bmFtZTogJzk2JywgY29kZTogJzk2J30sXG4gICAge25hbWU6ICc5NycsIGNvZGU6ICc5Nyd9LFxuICAgIHtuYW1lOiAnOTgnLCBjb2RlOiAnOTgnfSxcbiAgICB7bmFtZTogJzk5JywgY29kZTogJzk5J30sXG4gICAge25hbWU6ICcwMCcsIGNvZGU6ICcwMCd9LFxuICAgIHtuYW1lOiAnMDEnLCBjb2RlOiAnMDEnfSxcbiAgICB7bmFtZTogJzAyJywgY29kZTogJzAyJ30sXG4gICAge25hbWU6ICcwMycsIGNvZGU6ICcwMyd9LFxuICAgIHtuYW1lOiAnMDQnLCBjb2RlOiAnMDQnfSxcbiAgICB7bmFtZTogJzA1JywgY29kZTogJzA1J30sXG4gICAge25hbWU6ICcwNicsIGNvZGU6ICcwNid9LFxuICAgIHtuYW1lOiAnMDcnLCBjb2RlOiAnMDcnfSxcbiAgICB7bmFtZTogJzA4JywgY29kZTogJzA4J30sXG4gICAge25hbWU6ICcwOScsIGNvZGU6ICcwOSd9LFxuICAgIHtuYW1lOiAnMTAnLCBjb2RlOiAnMTAnfSxcbiAgICB7bmFtZTogJzExJywgY29kZTogJzExJ30sXG4gICAge25hbWU6ICcxMicsIGNvZGU6ICcxMid9LFxuICAgIHtuYW1lOiAnMTMnLCBjb2RlOiAnMTMnfSxcbiAgICB7bmFtZTogJzE0JywgY29kZTogJzE0J30sXG4gICAge25hbWU6ICcxNScsIGNvZGU6ICcxNSd9XG4gIF07XG4gICRzY29wZS50eXBlcyA9IFtcbiAgICB7bmFtZTogJ0hvbWV3b3JrJywgY29kZTogJ0gnfSxcbiAgICB7bmFtZTogJ01pZHRlcm0nLCBjb2RlOiAnTSd9LFxuICAgIHtuYW1lOiAnTm90ZXMnLCBjb2RlOiAnTid9LFxuICAgIHtuYW1lOiAnUXVpeicsIGNvZGU6ICdRJ30sXG4gICAge25hbWU6ICdGaW5hbCcsIGNvZGU6ICdGJ30sXG4gICAge25hbWU6ICdMYWInLCBjb2RlOiAnTCd9XG4gIF07XG5cbiAgJHNjb3BlLmZpbmRDbGFzc2VzID0gZnVuY3Rpb24oIHF1ZXJ5ICkge1xuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICB1cmw6IFBBUEVSU19VUkwgKyAnL2NsYXNzQW5kVHlwZS9jbGFzcy8nICsgcXVlcnkuY2xhc3NJZCAvLysgJy90eXBlLycgKyBxdWVyeS50eXBlQ29kZVxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgICRzY29wZS5wYXBlcnMgPSByZXMuZGF0YTtcbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5sb2coIGVyciApO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS4kd2F0Y2goJ3BhcGVycycsIGZ1bmN0aW9uKCkge1xuICAgIGlmICggISRzY29wZS5wYXBlcnMgKSByZXR1cm47XG4gICAgXG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICBmb3IgKCB2YXIgaSA9IDA7IGkgPCAkc2NvcGUucGFwZXJzLmxlbmd0aDsgaSsrICkge1xuICAgICAgICByZW5kZXJQZGYoICRzY29wZS5wYXBlcnNbIGkgXSApO1xuICAgICAgfVxuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG4gIGZ1bmN0aW9uIHJlbmRlclBkZiggcGFwZXIgKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCBwYXBlci5faWQgKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgaWYgKCBwYXBlciApIHtcbiAgICAgIFBERkpTLmdldERvY3VtZW50KCBwYXBlci5pbWcuZGF0YSApLnRoZW4oZnVuY3Rpb24oIHBkZiApIHtcbiAgICAgICAgcGRmLmdldFBhZ2UoMSkudGhlbihmdW5jdGlvbiggcGFnZSApIHtcblxuICAgICAgICAgIHZhciBzY2FsZSA9IC40O1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9XG5cbiAgJHNjb3BlLnNob3dFZGl0UGFuZWwgPSBmdW5jdGlvbihpZCkge1xuICAgICRzY29wZVsgJ29wZW5FZGl0UGFuZWwtJyArIGlkIF0gPSAhJHNjb3BlWyAnb3BlbkVkaXRQYW5lbC0nICsgaWQgXTtcbiAgfTtcblxuICAkc2NvcGUuaXNFZGl0UGFuZWxPcGVuID0gZnVuY3Rpb24oaWQpIHtcbiAgICByZXR1cm4gISEkc2NvcGVbICdvcGVuRWRpdFBhbmVsLScgKyBpZCBdO1xuICB9O1xuXG4gICRzY29wZS5zdWJtaXRFZGl0ZWRQYXBlciA9IGZ1bmN0aW9uKCBwYXBlciwgbmV3RGF0YSApIHtcbiAgICBwdXRPYmogPSB7XG4gICAgICB0aXRsZTogbmV3RGF0YS50aXRsZSxcbiAgICAgIHBlcmlvZDogbmV3RGF0YS5zZWFzb24gKyBuZXdEYXRhLnllYXIsXG4gICAgICB0eXBlOiBuZXdEYXRhLnR5cGUsXG4gICAgICBjbGFzc0lkOiBuZXdEYXRhLmNsYXNzSWRcbiAgICB9O1xuXG4gICAgcGFwZXIuc3VjY2VzcyA9ICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICB1cmw6ICdhcGkvcGFwZXJzL3NpbmdsZS8nICsgcGFwZXIuX2lkLFxuICAgICAgZGF0YTogcHV0T2JqXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgY29uc29sZS5sb2coIHJlcyApO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IgKCBlcnIgKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KTtcbiAgfTtcblxuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnZmguaG9tZScsIFtcbiAgJ3VpLnNlbGVjdCcsXG4gICduZ1N0b3JhZ2UnLFxuICAnbmdGaWxlVXBsb2FkJyxcbiAgJ2ZoLnNlcnZpY2VzLkZvY3VzU2VydmljZSdcbl0pXG5cbi5jb25maWcoZnVuY3Rpb24gaG9tZUNvbmZpZygkc3RhdGVQcm92aWRlcikge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaG9tZScsIHtcbiAgICB1cmw6ICcvaG9tZScsXG4gICAgdmlld3M6IHtcbiAgICAgIG1haW46IHtcbiAgICAgICAgY29udHJvbGxlcjogJ0hvbWVDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdob21lL2hvbWUudHBsLmh0bWwnXG4gICAgICB9XG4gICAgfSxcbiAgICBwYWdlVGl0bGU6ICdIb21lJyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGxDbGFzc2VzOiBmdW5jdGlvbiggJGh0dHAsICRzZXNzaW9uU3RvcmFnZSApIHtcbiAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgIHVybDogJ2FwaS9jbGFzc2VzL2FsbCcsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgand0OiAkc2Vzc2lvblN0b3JhZ2Uuand0XG4gICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfSxcblxuICAgICAgdG9rZW5zOiBmdW5jdGlvbiggJGh0dHAgKSB7XG4gICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICB1cmw6ICdhc3NldHMvdG9rZW5zLmpzb24nXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIGZ1bmN0aW9uKCAkc2NvcGUsICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UsICR0aW1lb3V0LCBnaXZlRm9jdXMsIFVwbG9hZCwgYWxsQ2xhc3NlcywgdG9rZW5zICkge1xuICB2YXIgUEFQRVJTX1VSTCA9ICcvYXBpL3BhcGVycyc7XG4gICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydqd3QnXSA9ICRzZXNzaW9uU3RvcmFnZS5qd3Q7XG4gICRzY29wZS5hbGxDbGFzc2VzID0gYWxsQ2xhc3NlcztcblxuICAkc2NvcGUuJHdhdGNoKCdmaWxlcycsIGZ1bmN0aW9uKCkge1xuICAgICRzY29wZS51cGxvYWQoICRzY29wZS5maWxlcyApO1xuICB9KTtcblxuICAkc2NvcGUuJHdhdGNoKCdmaWxlJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCRzY29wZS5maWxlICE9IG51bGwpIHtcbiAgICAgICRzY29wZS51cGxvYWQoWyRzY29wZS5maWxlXSk7XG4gICAgfVxuICB9KTtcblxuICAkc2NvcGUubG9nICAgICAgICAgID0gJyc7XG4gICRzY29wZS5wYXBlcnNUb0VkaXQgPSBbXTtcbiAgJHNjb3BlLmVkaXREYXRhICAgICA9IHt9O1xuXG4gICRzY29wZS5zZWFzb25zID0gW1xuICAgIHtuYW1lOiAnU3ByaW5nJywgY29kZTogXCJTUFwifSxcbiAgICB7bmFtZTogJ1N1bW1lcicsIGNvZGU6IFwiU1VcIn0sXG4gICAge25hbWU6ICdGYWxsJywgY29kZTogXCJGQVwifSxcbiAgICB7bmFtZTogJ1dpbnRlcicsIGNvZGU6IFwiV0lcIn1cbiAgXTtcbiAgJHNjb3BlLnllYXJzID0gW1xuICAgIHtuYW1lOiAnOTUnLCBjb2RlOiAnOTUnfSxcbiAgICB7bmFtZTogJzk2JywgY29kZTogJzk2J30sXG4gICAge25hbWU6ICc5NycsIGNvZGU6ICc5Nyd9LFxuICAgIHtuYW1lOiAnOTgnLCBjb2RlOiAnOTgnfSxcbiAgICB7bmFtZTogJzk5JywgY29kZTogJzk5J30sXG4gICAge25hbWU6ICcwMCcsIGNvZGU6ICcwMCd9LFxuICAgIHtuYW1lOiAnMDEnLCBjb2RlOiAnMDEnfSxcbiAgICB7bmFtZTogJzAyJywgY29kZTogJzAyJ30sXG4gICAge25hbWU6ICcwMycsIGNvZGU6ICcwMyd9LFxuICAgIHtuYW1lOiAnMDQnLCBjb2RlOiAnMDQnfSxcbiAgICB7bmFtZTogJzA1JywgY29kZTogJzA1J30sXG4gICAge25hbWU6ICcwNicsIGNvZGU6ICcwNid9LFxuICAgIHtuYW1lOiAnMDcnLCBjb2RlOiAnMDcnfSxcbiAgICB7bmFtZTogJzA4JywgY29kZTogJzA4J30sXG4gICAge25hbWU6ICcwOScsIGNvZGU6ICcwOSd9LFxuICAgIHtuYW1lOiAnMTAnLCBjb2RlOiAnMTAnfSxcbiAgICB7bmFtZTogJzExJywgY29kZTogJzExJ30sXG4gICAge25hbWU6ICcxMicsIGNvZGU6ICcxMid9LFxuICAgIHtuYW1lOiAnMTMnLCBjb2RlOiAnMTMnfSxcbiAgICB7bmFtZTogJzE0JywgY29kZTogJzE0J30sXG4gICAge25hbWU6ICcxNScsIGNvZGU6ICcxNSd9XG4gIF07XG4gICRzY29wZS50eXBlcyA9IFtcbiAgICB7bmFtZTogJ0hvbWV3b3JrJywgY29kZTogJ0gnfSxcbiAgICB7bmFtZTogJ01pZHRlcm0nLCBjb2RlOiAnTSd9LFxuICAgIHtuYW1lOiAnTm90ZXMnLCBjb2RlOiAnTid9LFxuICAgIHtuYW1lOiAnUXVpeicsIGNvZGU6ICdRJ30sXG4gICAge25hbWU6ICdGaW5hbCcsIGNvZGU6ICdGJ30sXG4gICAge25hbWU6ICdMYWInLCBjb2RlOiAnTCd9XG4gIF07XG5cbiAgJHNjb3BlLnVwbG9hZCA9IGZ1bmN0aW9uKCBmaWxlcyApIHtcbiAgICBpZiAoZmlsZXMgJiYgZmlsZXMubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBmaWxlID0gZmlsZXNbaV07XG5cbiAgICAgICAgVXBsb2FkLnVwbG9hZCh7XG4gICAgICAgICAgdXJsOiBQQVBFUlNfVVJMLFxuICAgICAgICAgIGZpbGU6IGZpbGVcbiAgICAgICAgfSlcblxuICAgICAgICAucHJvZ3Jlc3MoZnVuY3Rpb24gKCBldnQgKSB7XG4gICAgICAgICAgdmFyIHByb2dyZXNzUGVyY2VudGFnZSA9IHBhcnNlSW50KDEwMC4wICogZXZ0LmxvYWRlZCAvIGV2dC50b3RhbCk7XG4gICAgICAgICAgJHNjb3BlLmxvZyA9ICdwcm9ncmVzczogJyArIFxuICAgICAgICAgICAgcHJvZ3Jlc3NQZXJjZW50YWdlICsgXG4gICAgICAgICAgICAnJScgKyBcbiAgICAgICAgICAgIGV2dC5jb25maWcuZmlsZS5uYW1lICsgXG4gICAgICAgICAgICAnXFxuJyArIFxuICAgICAgICAgICAgJHNjb3BlLmxvZztcbiAgICAgICAgfSlcblxuICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiggZGF0YSwgc3RhdHVzLCBoZWFkZXJzLCBjb25maWcgKSB7XG4gICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICRzY29wZS5sb2cgPSAnZmlsZTogJyArIFxuICAgICAgICAgICAgICBjb25maWcuZmlsZS5uYW1lICsgXG4gICAgICAgICAgICAgICcsIFJlc3BvbnNlOiAnICsgXG4gICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KCBkYXRhLnRpdGxlICkgKyBcbiAgICAgICAgICAgICAgJywgSUQ6ICcgK1xuICAgICAgICAgICAgICBkYXRhLl9pZFxuICAgICAgICAgICAgICAnXFxuJyArIFxuICAgICAgICAgICAgICAkc2NvcGUubG9nO1xuXG4gICAgICAgICAgICAkc2NvcGUucGFwZXJzVG9FZGl0LnB1c2goIGRhdGEgKTtcblxuICAgICAgICAgICAgZ2l2ZUZvY3VzKCdzZWFzb24tcGlja2VyJyk7XG5cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gICRzY29wZS5zdWJtaXRFZGl0ZWRQYXBlciA9IGZ1bmN0aW9uKCBwYXBlciwgbmV3RGF0YSApIHtcbiAgICBwdXRPYmogPSB7XG4gICAgICB0aXRsZTogbmV3RGF0YS50aXRsZSxcbiAgICAgIHBlcmlvZDogbmV3RGF0YS5zZWFzb24gKyBuZXdEYXRhLnllYXIsXG4gICAgICB0eXBlOiBuZXdEYXRhLnR5cGUsXG4gICAgICBjbGFzc0lkOiBuZXdEYXRhLmNsYXNzSWRcbiAgICB9O1xuXG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgIHVybDogJ2FwaS9wYXBlcnMvc2luZ2xlLycgKyBwYXBlci5faWQsXG4gICAgICBkYXRhOiBwdXRPYmpcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICBjb25zb2xlLmxvZyggcmVzICk7XG4gICAgICAkc2NvcGUucGFwZXJUb0VkaXRCYWNrU3RvcmUgPSAkc2NvcGUucGFwZXJzVG9FZGl0LnNoaWZ0KCk7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUuZXJyb3IgKCBlcnIgKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyByZS1yZW5kZXJzIHRoZSBtYWluIGNhbnZhcyB1cG9uIGNoYW5nZVxuICAkc2NvcGUuJHdhdGNoKCdwYXBlcnNUb0VkaXRbMF0nLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21haW4tdmlld2VyJyk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggJHNjb3BlLnBhcGVyc1RvRWRpdFswXSApIHtcbiAgICAgIFBERkpTLmdldERvY3VtZW50KCAkc2NvcGUucGFwZXJzVG9FZGl0WzBdLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKHBhZ2UpIHtcblxuICAgICAgICAgIHZhciBzY2FsZSA9IDAuODtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfSk7XG5cbiAgLy8gcmUtcmVuZGVycyB0aGUgc2Vjb25kYXJ5IGNhbnZhcyB1cG9uIGNoYW5nZVxuICAkc2NvcGUuJHdhdGNoKCdwYXBlcnNUb0VkaXRbMV0nLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHQtdXAtcGRmLWNvbnRhaW5lcicpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICBpZiAoICRzY29wZS5wYXBlcnNUb0VkaXRbMV0gKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggJHNjb3BlLnBhcGVyc1RvRWRpdFsxXS5pbWcuZGF0YSApLnRoZW4oZnVuY3Rpb24oIHBkZiApIHtcbiAgICAgICAgcGRmLmdldFBhZ2UoMSkudGhlbihmdW5jdGlvbihwYWdlKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAwLjI7XG4gICAgICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgICAgICBjYW52YXNDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICAgICAgfTtcbiAgICAgICAgICBwYWdlLnJlbmRlcihyZW5kZXJDb250ZXh0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH0pO1xuXG4gICRzY29wZS5hZGRDbGFzcyA9IGZ1bmN0aW9uKCBuZXdDbGFzcyApIHtcbiAgICB2YXIgcG9zdE9iaiA9IHt0aXRsZTogbmV3Q2xhc3N9O1xuXG4gICAgJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICB1cmw6ICcvYXBpL2NsYXNzZXMnLFxuICAgICAgZGF0YTogcG9zdE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcblxuICAgICAgJGh0dHAoe1xuICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICB1cmw6ICcvYXBpL2NsYXNzZXMvYWxsJ1xuICAgICAgfSkudGhlbihmdW5jdGlvbiAocmVzICkge1xuICAgICAgICAkc2NvcGUuYWxsQ2xhc3NlcyA9IHJlcy5kYXRhO1xuICAgICAgfSk7XG5cbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5sb2coIGVyciApO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vICRzY29wZS5hZGRUb2tlbnMgPSBmdW5jdGlvbigpIHtcbiAgLy8gICB0b2tlbnMudG9rZW5zLmZvckVhY2goIGZ1bmN0aW9uKCB0b2tlbiwgaW5kZXgsIGFycmF5KSB7XG4gIC8vICAgICAkaHR0cCh7XG4gIC8vICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAvLyAgICAgICB1cmw6ICcvYXBpL21ha2VUb2tlbicsXG4gIC8vICAgICAgIGRhdGE6IHRva2VuXG4gIC8vICAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gIC8vICAgICAgIGNvbnNvbGUubG9nKCd5ZXMnKTtcbiAgLy8gICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gIC8vICAgICAgIGNvbnNvbGUubG9nKCdGRkZGRkZGRkZGVVVVVVUnLCBlcnIpO1xuICAvLyAgICAgfSk7XG4gIC8vICAgfSk7XG4gIC8vIH07XG5cblxufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnZmgubGFuZGluZycsW1xuICAnbmdTdG9yYWdlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiAoICRzdGF0ZVByb3ZpZGVyICkge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGFuZGluZycsIHtcbiAgICB1cmw6ICcvJyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnTGFuZGluZ0NvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2xhbmRpbmcvbGFuZGluZy50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ2xhbmRpbmdQYWdlLnBhZ2VUaXRsZSdcbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignTGFuZGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoICRzY29wZSwgJHN0YXRlLCAkaHR0cCwgJGJhc2U2NCwgJHNlc3Npb25TdG9yYWdlKSB7XG4gIHZhciBVU0VSU19VUkwgPSAnL2FwaS91c2Vycyc7XG5cbiAgJHNjb3BlLnJlZ2lzdGVyID0gZnVuY3Rpb24oIGNyZWRlbnRpYWxzICkge1xuICAgIGlmICggIWNyZWRlbnRpYWxzLm5hbWUgfHxcbiAgICAgICAgICFjcmVkZW50aWFscy5lbWFpbCB8fFxuICAgICAgICAgIWNyZWRlbnRpYWxzLnBhc3N3b3JkIHx8XG4gICAgICAgICAhY3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtIHx8XG4gICAgICAgICAhY3JlZGVudGlhbHMuYWRkQ29kZSApIHtcbiAgICAgICRzY29wZS5yZWdpc3RyYXRpb25FcnJvciA9ICdQbGVhc2UgY29tcGxldGUgdGhlIGZvcm0gYmVmb3JlIHN1Ym1pdHRpbmcnO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBuZXdVc2VyID0ge1xuICAgICAgbmFtZTogY3JlZGVudGlhbHMubmFtZSxcbiAgICAgIHBob25lOiBjcmVkZW50aWFscy5waG9uZSxcbiAgICAgIGVtYWlsOiBjcmVkZW50aWFscy5lbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBjcmVkZW50aWFscy5wYXNzd29yZCxcbiAgICAgIHBhc3N3b3JkQ29uZmlybTogY3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtLFxuICAgICAgdG9rZW46IGNyZWRlbnRpYWxzLmFkZENvZGVcbiAgICB9O1xuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgdXJsOiBVU0VSU19VUkwsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0sXG4gICAgICBkYXRhOiBuZXdVc2VyXG4gICAgfSlcbiAgICAuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICBjb25zb2xlLmRpcihkYXRhKTtcbiAgICAgIC8vICRzY29wZS5yZWdpc3RlckNyZWRlbnRpYWxzID0ge307XG4gICAgICAvLyAkc2NvcGUucmVnaXN0ZXJTdWNjZXNzID0gdHJ1ZTtcbiAgICAgICRzZXNzaW9uU3RvcmFnZS5qd3QgPSBkYXRhLmp3dDtcbiAgICAgICRzdGF0ZS5nbygnc2VhcmNoJyk7XG4gICAgfSlcbiAgICAuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAkc2NvcGUucmVnaXN0cmF0aW9uRXJyb3IgPSBlcnI7XG4gICAgICBjb25zb2xlLmRpcihlcnIpO1xuICAgICAgJHNjb3BlLnJlZ2lzdGVyQ3JlZGVudGlhbHMucGFzc3dvcmQgPSAnJztcbiAgICAgICRzY29wZS5yZWdpc3RlckNyZWRlbnRpYWxzLnBhc3N3b3JkQ29uZmlybSA9ICcnO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XG5cbiAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aG9yaXphdGlvbiddID0gXG4gICAgICAnQmFzaWMgJyArIFxuICAgICAgJGJhc2U2NC5lbmNvZGUoY3JlZGVudGlhbHMuZW1haWwgKyBcbiAgICAgICc6JyArIFxuICAgICAgY3JlZGVudGlhbHMucGFzc3dvcmQpO1xuICAgIFxuICAgICRodHRwLmdldChVU0VSU19VUkwpXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGNvbnNvbGUuZGlyKGRhdGEpO1xuICAgICAgICAkc2Vzc2lvblN0b3JhZ2Uuand0ID0gZGF0YS5qd3Q7XG4gICAgICAgICRzdGF0ZS5nbygnc2VhcmNoJyk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAkc2NvcGUubG9naW5FcnJvciA9IGVycjtcbiAgICAgICAgY29uc29sZS5kaXIoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnZmguc2VhcmNoJywgW1xuICAndWkuc2VsZWN0JyxcbiAgJ2NnQnVzeScsXG4gICduZ1N0b3JhZ2UnLFxuICAnc21hcnQtdGFibGUnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIHNlYXJjaENvbmZpZygkc3RhdGVQcm92aWRlcikge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2VhcmNoJywge1xuICAgIHVybDogJy9zZWFyY2gnLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdzZWFyY2gvc2VhcmNoLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnU2VhcmNoJ1xuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdTZWFyY2hDb250cm9sbGVyJywgZnVuY3Rpb24oICRyb290U2NvcGUsICRzY29wZSwgJGh0dHAsICRzZXNzaW9uU3RvcmFnZSwgJHRpbWVvdXQgKSB7XG4gICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydqd3QnXSA9ICRzZXNzaW9uU3RvcmFnZS5qd3Q7XG5cbiAgJHNjb3BlLnJldmVyc2UgICAgPSB0cnVlO1xuICAkc2NvcGUucHJlZGljYXRlICA9ICdwZXJpb2QnO1xuICAkc2NvcGUucmVuZGVyZWQgICA9IGZhbHNlO1xuICAkc2NvcGUucXVlcnkgICAgICA9IHt9O1xuICB2YXIgUEFQRVJTX1VSTCAgICA9ICcvYXBpL3BhcGVycyc7XG4gICRzY29wZS5zb3J0UGVyaW9kID0ge1xuICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICByZXZlcnNlOiB0cnVlXG4gIH07XG4gICRzY29wZS5zb3J0VHlwZSAgID0ge1xuICAgIGFjdGl2ZTogZmFsc2UsXG4gICAgcmV2ZXJzZTogZmFsc2VcbiAgfTtcblxuICB2YXIgcGFnZTtcblxuICAkaHR0cCh7XG4gICAgbWV0aG9kOiAnR0VUJyxcbiAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnXG4gIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAkc2NvcGUuYWxsQ2xhc3NlcyA9IHJlcy5kYXRhO1xuICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gIH0pO1xuXG4gICRzY29wZS50b2dnbGVQZXJpb2RSZXZlcnNlID0gZnVuY3Rpb24oKSB7XG4gICAgJHNjb3BlLnNvcnRUeXBlLmFjdGl2ZSAgICA9IGZhbHNlO1xuICAgICRzY29wZS5zb3J0VHlwZS5yZXZlcnNlICAgPSBmYWxzZTtcbiAgICAkc2NvcGUuc29ydFBlcmlvZC5hY3RpdmUgID0gdHJ1ZTtcbiAgICAkc2NvcGUuc29ydFBlcmlvZC5yZXZlcnNlID0gISRzY29wZS5zb3J0UGVyaW9kLnJldmVyc2U7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVR5cGVSZXZlcnNlID0gZnVuY3Rpb24oKSB7XG4gICAgJHNjb3BlLnNvcnRQZXJpb2QuYWN0aXZlICA9IGZhbHNlO1xuICAgIC8vIFxcL1xcL1xcLyBzb3J0UGVyaW9kLnJldmVyc2UgaXMgcmVzZXQgdG8gdHJ1ZSBiZWNhdXNlIGl0J3MgbW9yZSBuYXR1cmFsIHRvIHNlZSBsYXJnZXIgZGF0ZXMgKG1vcmUgcmVjZW50KSBmaXJzdFxuICAgICRzY29wZS5zb3J0UGVyaW9kLnJldmVyc2UgPSB0cnVlOyBcbiAgICAkc2NvcGUuc29ydFR5cGUuYWN0aXZlICAgID0gdHJ1ZTtcbiAgICAkc2NvcGUuc29ydFR5cGUucmV2ZXJzZSAgID0gISRzY29wZS5zb3J0VHlwZS5yZXZlcnNlO1xuICB9O1xuXG4gICRzY29wZS5ob3ZlckluT3JPdXQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmhvdmVyRWRpdCA9ICF0aGlzLmhvdmVyRWRpdDtcbiAgfTtcblxuICAkc2NvcGUuZmluZFBhcGVyc0J5Q2xhc3MgPSBmdW5jdGlvbihxdWVyeSkge1xuICAgICRzY29wZS5idXN5RmluZGluZ1BhcGVycyA9ICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICB1cmw6IFBBUEVSU19VUkwgKyAnL2NsYXNzLycgKyBxdWVyeS5jbGFzc0lkXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgJHNjb3BlLnBhcGVycyA9IGRlc2VyaWFsaXplUGFwZXJzKHJlcy5kYXRhKTtcbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5sb2coIGVyciApO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRlc2VyaWFsaXplUGFwZXJzKHBhcGVycykge1xuICAgIGlmICghcGFwZXJzKSByZXR1cm47XG5cbiAgICByZXR1cm4gcGFwZXJzLm1hcChmdW5jdGlvbihwYXBlcikge1xuICAgICAgdmFyIHNlYXNvbiA9IHBhcGVyLnBlcmlvZC5zbGljZSgwLDIpO1xuICAgICAgdmFyIHllYXIgPSBwYXBlci5wZXJpb2Quc2xpY2UoMiw0KTtcbiAgICAgIHZhciBtb250aDtcblxuICAgICAgLy8gY29udmVydCBzZWFzb24gc3RyaW5nIGludG8gbW9udGggbnVtYmVyXG4gICAgICBzd2l0Y2ggKHNlYXNvbikge1xuICAgICAgICBjYXNlICdXSSc6XG4gICAgICAgICAgbW9udGggPSAwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdTUCc6XG4gICAgICAgICAgbW9udGggPSAzO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdTVSc6XG4gICAgICAgICAgbW9udGggPSA2O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdGQSc6XG4gICAgICAgICAgbW9udGggPSA5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBjb252ZXJ0IHllYXIgc3RyaW5nIGludG8geWVhciBudW1iZXIgKGRvdWJsZSBkaWdpdHMgY29udmVydCB0byAxOTAwLTE5OTksIG5lZWQgNCB5ZWFyIGZvciBhZnRlciAxOTk5KVxuICAgICAgeWVhciA9IHBhcnNlSW50KHllYXIpO1xuXG4gICAgICBpZiAoeWVhciA8IDgwKSB7XG4gICAgICAgIHllYXIgKz0gMjAwMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHllYXIgKz0gMTkwMDtcbiAgICAgIH1cblxuICAgICAgcGFwZXIucGVyaW9kID0gbmV3IERhdGUoeWVhciwgbW9udGgsIDEpO1xuICAgICAgcmV0dXJuIHBhcGVyO1xuICAgIH0pO1xuICB9XG5cbiAgJHNjb3BlLmZpbmRJbWFnZSA9IGZ1bmN0aW9uKCBwYXBlcklkICkge1xuICAgICRzY29wZS5idXN5RmluZGluZ1BhcGVySW1hZ2UgPSAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgdXJsOiBQQVBFUlNfVVJMICsgJy9zaW5nbGUvJyArIHBhcGVySWRcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAkc2NvcGUucGFwZXJUb1JlbmRlciA9IHJlcy5kYXRhO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gcmVuZGVyUGRmKCBwYWdlICkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2Rpc3BsYXktcGFwZXInICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICRzY29wZS5wZGYuZ2V0UGFnZSggcGFnZSApLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG4gICAgICB2YXIgc2NhbGUgPSAxO1xuICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgfTtcbiAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJQZGZJbml0aWFsKCBwYXBlciApIHtcbiAgICAkc2NvcGUucmVuZGVyZWQgPSB0cnVlO1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2Rpc3BsYXktcGFwZXInICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggcGFwZXIgKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggcGFwZXIuaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAxO1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5wZGYgPSBwZGY7XG4gICAgICAgIHBhZ2UgPSAxO1xuXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcmV2aW91cy1wYWdlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLFxuICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCBwYWdlID4gMSApIHtcbiAgICAgICAgICAgICAgcGFnZS0tO1xuICAgICAgICAgICAgICByZW5kZXJQZGYoIHBhZ2UgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXh0LXBhZ2UnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoICRzY29wZS5wZGYubnVtUGFnZXMgPiBwYWdlICkge1xuICAgICAgICAgICAgICBwYWdlKys7XG4gICAgICAgICAgICAgIHJlbmRlclBkZiggcGFnZSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG5cbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH1cblxuICAkc2NvcGUuJHdhdGNoKCdwYXBlclRvUmVuZGVyJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCAhJHNjb3BlLnBhcGVyVG9SZW5kZXIgKSByZXR1cm47XG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAvLyByZW5kZXJQZGZJbml0aWFsKCAkc2NvcGUucGFwZXIgKTtcbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgncGRmLXJlYWR5LXRvLXJlbmRlcicpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG59KVxuXG4uZmlsdGVyKCdwZXJpb2RGaWx0ZXInLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0UGVyaW9kKSB7XG4gICAgdmFyIHllYXIgICAgID0gaW5wdXRQZXJpb2QuZ2V0RnVsbFllYXIoKTtcbiAgICB2YXIgd2ludGVyICAgPSBuZXcgRGF0ZSh5ZWFyLCAwLCAxKTtcbiAgICB2YXIgc3ByaW5nICAgPSBuZXcgRGF0ZSh5ZWFyLCAzLCAxKTtcbiAgICB2YXIgc3VtbWVyICAgPSBuZXcgRGF0ZSh5ZWFyLCA2LCAxKTtcbiAgICB2YXIgZmFsbCAgICAgPSBuZXcgRGF0ZSh5ZWFyLCA5LCAxKTtcbiAgICB2YXIgc2Vhc29uO1xuXG4gICAgc3dpdGNoIChpbnB1dFBlcmlvZC5nZXRNb250aCgpKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIHNlYXNvbiA9ICdXSSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBzZWFzb24gPSAnU1AnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjpcbiAgICAgICAgc2Vhc29uID0gJ1NVJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDk6XG4gICAgICAgIHNlYXNvbiA9ICdGQSc7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB2YXIgcmV0dXJuWWVhciA9IGlucHV0UGVyaW9kLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcbiAgICByZXR1cm5ZZWFyID0gcmV0dXJuWWVhci5zbGljZSgyLDQpO1xuXG4gICAgcmV0dXJuICcnICsgc2Vhc29uICsgcmV0dXJuWWVhcjtcbiAgfVxufSlcblxuLmZpbHRlcigndHlwZUZpbHRlcicsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oaW5wdXRUeXBlKSB7XG4gICAgc3dpdGNoIChpbnB1dFR5cGUpIHtcbiAgICAgIGNhc2UgJ0gnOlxuICAgICAgICByZXR1cm4gJ0hvbWV3b3JrJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdNJzpcbiAgICAgICAgcmV0dXJuICdNaWR0ZXJtJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdOJzpcbiAgICAgICAgcmV0dXJuICdOb3Rlcyc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnUSc6XG4gICAgICAgIHJldHVybiAnUXVpeic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnRic6XG4gICAgICAgIHJldHVybiAnRmluYWwnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0wnOlxuICAgICAgICByZXR1cm4gJ0xhYic7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufSlcbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5kaXJlY3RpdmVzLm1haW5IZWFkZXInLCBbXG4gICAgJ25nU3RvcmFnZScsXG4gICAgJ0FwcGxpY2F0aW9uQ29uZmlndXJhdGlvbidcbl0pXG5cbi5kaXJlY3RpdmUoJ21haW5IZWFkZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2RpcmVjdGl2ZXMvbWFpbkhlYWRlci9tYWluSGVhZGVyLnRwbC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oICRzY29wZSwgJHN0YXRlICkge1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5kaXJlY3RpdmVzLm1vZGFscy5zaG93UGRmTW9kYWwnLCBbXG4gICd1aS5ib290c3RyYXAnLFxuICAnZmguc2VydmljZXMuTW9kYWxTZXJ2aWNlJ1xuXSlcblxuLmRpcmVjdGl2ZSgnc2hvd1BkZk1vZGFsJywgZnVuY3Rpb24oIE1vZGFsU2VydmljZSwgJGh0dHAgKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBRScsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBNb2RhbFNlcnZpY2Uub3Blbk1vZGFsKHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2RpcmVjdGl2ZXMvbW9kYWxzL3Nob3dQZGZNb2RhbC9zaG93UGRmTW9kYWwudHBsLmh0bWwnLFxuICAgICAgICAgIGNvbnRyb2xsZXI6ICdTaG93UGRmTW9kYWxDb250cm9sbGVyJyxcbiAgICAgICAgICB3aW5kb3dDbGFzczogJ3Nob3ctcGRmLW1vZGFsJyxcbiAgICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXG4gICAgICAgICAga2V5Ym9hcmQ6IGZhbHNlLFxuICAgICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgIHBhcGVyVG9SZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9wYXBlcnMnICsgJy9zaW5nbGUvJyArIHNjb3BlLnBhcGVyLl9pZFxuICAgICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn0pXG5cbi5jb250cm9sbGVyKCdTaG93UGRmTW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCAkdGltZW91dCwgTW9kYWxTZXJ2aWNlLCBwYXBlclRvUmVuZGVyKSB7XG4gICRzY29wZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIE1vZGFsU2VydmljZS5jbG9zZU1vZGFsKCk7XG4gIH07XG4gIHZhciBwYWdlO1xuICAkc2NvcGUucGFwZXJUb1JlbmRlciA9IHBhcGVyVG9SZW5kZXI7XG5cbiAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZW5kZXJlZC1wZGYtbW9kYWwnKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGlmICggcGFwZXJUb1JlbmRlciApIHtcbiAgICAgIFBERkpTLmdldERvY3VtZW50KCBwYXBlclRvUmVuZGVyLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKCBwYWdlICkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMTtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUucGRmID0gcGRmO1xuICAgICAgICAkc2NvcGUucGFnZSA9IDFcblxuICAgICAgICAvLyBldmVudCBsaXN0ZW5lcnMgZm9yIFBERiBwYWdlIG5hdmlnYXRpb25cbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ByZXZpb3VzLXBhZ2UtbW9kYWwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoICRzY29wZS5wYWdlID4gMSApIHtcbiAgICAgICAgICAgICAgJHNjb3BlLnBhZ2UtLTtcbiAgICAgICAgICAgICAgcmVuZGVyUGRmKCAkc2NvcGUucGFnZSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHQtcGFnZS1tb2RhbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyxcbiAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICggJHNjb3BlLnBkZi5udW1QYWdlcyA+ICRzY29wZS5wYWdlICkge1xuICAgICAgICAgICAgICAkc2NvcGUucGFnZSsrO1xuICAgICAgICAgICAgICByZW5kZXJQZGYoICRzY29wZS5wYWdlICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9LCA1MCk7XG5cbiAgLy8gJHNjb3BlLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgaWYgKCAkc2NvcGUucGRmLm51bVBhZ2VzID4gJHNjb3BlLnBhZ2UgKSB7XG4gIC8vICAgICAkc2NvcGUucGFnZSsrO1xuICAvLyAgICAgcmVuZGVyUGRmKCAkc2NvcGUucGFnZSApO1xuICAvLyAgIH1cbiAgLy8gfTtcblxuICBmdW5jdGlvbiByZW5kZXJQZGYoIHBhZ2UgKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZW5kZXJlZC1wZGYtbW9kYWwnKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgJHNjb3BlLnBkZi5nZXRQYWdlKCBwYWdlICkudGhlbihmdW5jdGlvbiggcmVuZGVyUGFnZSApIHtcbiAgICAgIHZhciBzY2FsZSA9IDE7XG4gICAgICB2YXIgdmlld3BvcnQgPSByZW5kZXJQYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICB9O1xuICAgICAgcmVuZGVyUGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgfSlcbiAgfVxuICAgIFxufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnZmguc2VydmljZXMuRmluZEltYWdlU2VydmljZScsIFtcbiAgICAgICAgJ25nU3RvcmFnZScsXG4gICAgICAgICd2ZW5kb3Iuc3RlZWxUb2UnXG4gICAgXSlcblxuLmZhY3RvcnkoJ0ZpbmRJbWFnZVNlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkcSwgc3RlZWxUb2UpIHtcblxuICAgIGZ1bmN0aW9uIGlzSW1hZ2Uoc3JjLCBkZWZhdWx0U3JjKSB7XG5cbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1hZ2Uub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2Vycm9yOiAnICsgc3JjICsgJyBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoIGRlZmF1bHRTcmMgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBzcmMgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2Uuc3JjID0gc3JjO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldEhlYWRlckltYWdlOiBmdW5jdGlvbihjb21wYW55Q29kZSkge1xuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gJy4vYXNzZXRzL2ltYWdlcy9oZWFkZXJJbWFnZS5qcGcnO1xuICAgICAgICAgICAgcmV0dXJuIGlzSW1hZ2UoaW1hZ2VVcmwpO1xuICAgICAgICB9XG4gICAgfTtcbn0pO1xuXG5cblxuLy8gaW50ZXJpb3Jcbi8vIEksIEosIEssIEwsIE0sIE1NLCBOLCBOTiwgSUEsIElRLCBSXG5cbi8vIG9jZWFuXG4vLyBDLCBDQSwgQ1EsIEQsIERBLCBERCwgRSwgRUUsIEYsIEZBLCBGQiwgRkYsIEcsIEgsIEhILCBHRywgT08sIFFcblxuLy8gdmlzdGFcbi8vIEEsIEFBLCBBQiwgQVMsIEIsIEJBLCBCQiwgQkMsIEJRXG5cbi8vIG5lcHR1bmVcbi8vIFMsIFNBLCBTQiwgU0MsIFNRXG5cbi8vIHBpbm5hY2xlXG4vLyBQU1xuXG4vLyB2ZXJhbmRhaFxuLy8gViwgVkEsIFZCLCBWQywgVkQsIFZFLCBWRiwgVkgsIFZRLCBWUywgVlRcblxuLy8gc2lnbmF0dXJlXG4vLyBTUywgU1ksIFNaLCBTVVxuXG4vLyBsYW5haVxuLy8gQ0FcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLkZvY3VzU2VydmljZScsIFtdKVxuXG4uZmFjdG9yeSgnZ2l2ZUZvY3VzJywgZnVuY3Rpb24oJHRpbWVvdXQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgICAgIGlmKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLk1vZGFsU2VydmljZScsIFtcbiAgICAndWkuYm9vdHN0cmFwLm1vZGFsJyxcbl0pXG4uc2VydmljZSgnTW9kYWxTZXJ2aWNlJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJG1vZGFsKSB7XG4gICAgdmFyIG1lID0ge1xuICAgICAgICBtb2RhbDogbnVsbCxcbiAgICAgICAgbW9kYWxBcmdzOiBudWxsLFxuICAgICAgICBpc01vZGFsT3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbWUubW9kYWwgIT09IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW5Nb2RhbDogZnVuY3Rpb24oYXJncykge1xuICAgICAgICAgICAgbWUuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgbWUubW9kYWxBcmdzID0gYXJncztcbiAgICAgICAgICAgIG1lLm1vZGFsID0gJG1vZGFsLm9wZW4oYXJncyk7XG5cbiAgICAgICAgICAgIHJldHVybiBtZS5tb2RhbDtcbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2VNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAobWUubW9kYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1lLm1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICBtZS5tb2RhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgbWUubW9kYWxBcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvL1doZW4gdGhlIHVzZXIgbmF2aWdhdGVzIGF3YXkgZnJvbSBhIHBhZ2Ugd2hpbGUgYSBtb2RhbCBpcyBvcGVuLCBjbG9zZSB0aGUgbW9kYWwuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcbiAgICAgICAgbWUuY2xvc2VNb2RhbCgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1lO1xufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9