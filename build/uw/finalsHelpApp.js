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
      }

      // tokens: function( $http ) {
      //   return $http({
      //     method: 'GET',
      //     url: 'assets/tokens.json'
      //   }).then(function( res ) {
      //     return res.data;
      //   }, function( err ) {
      //     console.log(err);
      //   });
      // }
    }
  });
})

.controller('HomeController', function( $scope, $http, $sessionStorage, $timeout, giveFocus, Upload, allClasses ) {
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

            $scope.papersToEdit.push({
              _id: data._id,
              title: data.title,
              userId: data.userId
            });

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
  // $scope.$watch('papersToEdit[0]', function() {
  //   var canvas = document.getElementById('main-viewer');
  //   var context = canvas.getContext('2d');

    // if ( $scope.papersToEdit[0] ) {
    //   PDFJS.getDocument( $scope.papersToEdit[0].img.data ).then(function( pdf ) {
    //     pdf.getPage(1).then(function(page) {

    //       var scale = 0.8;
    //       var viewport = page.getViewport(scale);

    //       canvas.height = viewport.height;
    //       canvas.width = viewport.width;

    //       var renderContext = {
    //         canvasContext: context,
    //         viewport: viewport
    //       };
    //       page.render(renderContext);
    //     });
    //   });
    // } else {
    //   context.clearRect(0, 0, canvas.width, canvas.height);
    // }
  // });

  // re-renders the secondary canvas upon change
  // $scope.$watch('papersToEdit[1]', function() {
  //   var canvas = document.getElementById('next-up-pdf-container');
  //   var context = canvas.getContext('2d');

    // if ( $scope.papersToEdit[1] ) {
    //   PDFJS.getDocument( $scope.papersToEdit[1].img.data ).then(function( pdf ) {
    //     pdf.getPage(1).then(function(page) {

    //       var scale = 0.2;
    //       var viewport = page.getViewport(scale);

    //       canvas.height = viewport.height;
    //       canvas.width = viewport.width;

    //       var renderContext = {
    //         canvasContext: context,
    //         viewport: viewport
    //       };
    //       page.render(renderContext);
    //     });
    //   });
    // } else {
    //   context.clearRect(0, 0, canvas.width, canvas.height);
    // }
  // });

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
  //   $scope.tokens.forEach( function( token, index, array) {
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

  // $scope.findImage = function( paperId ) {
  //   $scope.busyFindingPaperImage = $http({
  //     method: 'GET',
  //     url: PAPERS_URL + '/single/' + paperId
  //   }).then(function( res ) {
  //     $scope.paperToRender = res.data;
  //   }, function( err ) {
  //     console.log( err );
  //   });
  // };

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
            paperToRenderId: function() {
              return scope.paper._id
            }
          }
        });
      });
    }
  };
})

.controller('ShowPdfModalController', function($scope, $timeout, ModalService, paperToRenderId) {
  $scope.close = function() {
    ModalService.closeModal();
  };
  var page;
  $scope.paperToRender = paperToRenderId;

  $timeout(function() {
    var canvas = document.getElementById('rendered-pdf-modal');
    var context = canvas.getContext('2d');
    if ( paperToRenderId ) {
      PDFJS.getDocument( '/api/papers/single/image/' + paperToRenderId ).then(function( pdf ) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImZpbmRBbmRFZGl0LmpzIiwiaG9tZS5qcyIsImxhbmRpbmcuanMiLCJzZWFyY2guanMiLCJtYWluSGVhZGVyLmpzIiwic2hvd1BkZk1vZGFsLmpzIiwiRmluZEltYWdlU2VydmljZS5qcyIsIkZvY3VzU2VydmljZS5qcyIsIk1vZGFsU2VydmljZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDblFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2pRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImZpbmFsc0hlbHBBcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0Jztcbn0pKCk7XG5cbmFuZ3VsYXIubW9kdWxlKCdmaCcsIFtcbiAgICAnbmdTdG9yYWdlJyxcbiAgICAndWkucm91dGVyJyxcbiAgICAndWkuYm9vdHN0cmFwJyxcbiAgICAndWkuYm9vdHN0cmFwLnNob3dFcnJvcnMnLFxuICAgICd1aS51dGlscycsXG4gICAgJ3Jlc3Rhbmd1bGFyJyxcbiAgICAndGVtcGxhdGVzLWFwcCcsXG4gICAgJ3RlbXBsYXRlcy1jb21wb25lbnRzJyxcbiAgICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJyxcbiAgICAnZmgubGFuZGluZycsXG4gICAgJ2ZoLmhvbWUnLFxuICAgICdmaC5zZWFyY2gnLFxuICAgICdmaC5maW5kQW5kRWRpdCcsXG4gICAgJ2ZoLmRpcmVjdGl2ZXMubWFpbkhlYWRlcicsXG4gICAgJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzLnNob3dQZGZNb2RhbCcsXG4gICAgLy8gJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzJyxcbiAgICAnZmguc2VydmljZXMuRm9jdXNTZXJ2aWNlJyxcbiAgICAndmVuZG9yLnN0ZWVsVG9lJyxcbiAgICAnYmFzZTY0JyxcbiAgICAnYW5ndWxhci1tb21lbnRqcydcbl0pXG5cbiAgICAuY29uZmlnKGZ1bmN0aW9uKCR1cmxSb3V0ZXJQcm92aWRlciwgUmVzdGFuZ3VsYXJQcm92aWRlciwgQ29uZmlndXJhdGlvbiwgJHVpVmlld1Njcm9sbFByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyKSB7XG5cbiAgICAgICAgUmVzdGFuZ3VsYXJQcm92aWRlci5zZXRCYXNlVXJsKCcvYXBpJyk7XG4gICAgICAgIFJlc3Rhbmd1bGFyUHJvdmlkZXIuc2V0RGVmYXVsdEh0dHBGaWVsZHMoe1xuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgdGltZW91dDogQ29uZmlndXJhdGlvbi50aW1lb3V0SW5NaWxsaXMsXG4gICAgICAgICAgICBjYWNoZTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignJywgJy9sYW5kaW5nJykub3RoZXJ3aXNlKCcvbGFuZGluZycpO1xuXG4gICAgICAgIC8vIHNjcm9sbHMgdG8gdG9wIG9mIHBhZ2Ugb24gc3RhdGUgY2hhbmdlXG4gICAgICAgICR1aVZpZXdTY3JvbGxQcm92aWRlci51c2VBbmNob3JTY3JvbGwoKTtcblxuICAgIH0pXG4gICAgLnJ1bihmdW5jdGlvbigkcm9vdFNjb3BlLCBcbiAgICAgICAgQ29uZmlndXJhdGlvbiwgXG4gICAgICAgICRzdGF0ZSwgXG4gICAgICAgICRzZXNzaW9uU3RvcmFnZSkge1xuXG4gICAgICAgICRyb290U2NvcGUuYXBwTmFtZSA9IENvbmZpZ3VyYXRpb24uYXBwTmFtZTtcbiAgICAgICAgJHJvb3RTY29wZS5jb21wYW55Q29kZSA9IENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGU7XG5cblxuICAgICAgICAkc3RhdGUuZ28oJ2xhbmRpbmcnKTtcblxuICAgICAgICAvL2F1dGggY2hlY2sgZXZlcnkgdGltZSB0aGUgc3RhdGUvcGFnZSBjaGFuZ2VzXG4gICAgICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgICAgICAvLyAkcm9vdFNjb3BlLnN0YXRlQ2hhbmdlQXV0aENoZWNrKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvL0VWRU5UIEJBTktcbiAgICAgICAgLypcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLCBmdW5jdGlvbihldmVudCwgYXJncykge1xuICAgICAgICB9KTsqL1xuXG5cblxuICAgIH0pXG5cbiAgICAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5maW5kQW5kRWRpdCcsIFtcbiAgJ3VpLnNlbGVjdCcsXG4gICduZ1N0b3JhZ2UnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIGhvbWVDb25maWcoICRzdGF0ZVByb3ZpZGVyICkge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZmluZEFuZEVkaXQnLCB7XG4gICAgdXJsOiAnL2ZpbmRBbmRFZGl0JyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnRmluZEFuZEVkaXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdmaW5kQW5kRWRpdC9maW5kQW5kRWRpdC50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ0ZpbmQgQW5kIEVkaXQnLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsbENsYXNzZXM6IGZ1bmN0aW9uKCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlICkge1xuICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgdXJsOiAnYXBpL2NsYXNzZXMvYWxsJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBqd3Q6ICRzZXNzaW9uU3RvcmFnZS5qd3RcbiAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCByZXMgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignRmluZEFuZEVkaXRDb250cm9sbGVyJywgZnVuY3Rpb24oICRzY29wZSwgJGh0dHAsICRzZXNzaW9uU3RvcmFnZSwgYWxsQ2xhc3NlcywgJHRpbWVvdXQgKSB7XG4gIHZhciBQQVBFUlNfVVJMICAgICAgICAgICAgICAgICAgICAgICA9ICcvYXBpL3BhcGVycyc7XG4gICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydqd3QnXSA9ICRzZXNzaW9uU3RvcmFnZS5qd3Q7XG4gICRzY29wZS5xdWVyeSAgICAgICAgICAgICAgICAgICAgICAgICA9IHt9O1xuICAkc2NvcGUuZWRpdERhdGEgICAgICAgICAgICAgICAgICAgICAgPSB7fTtcbiAgJHNjb3BlLmFsbENsYXNzZXMgICAgICAgICAgICAgICAgICAgID0gYWxsQ2xhc3NlcztcblxuICAkc2NvcGUuc2Vhc29ucyA9IFtcbiAgICB7bmFtZTogJ1NwcmluZycsIGNvZGU6IFwiU1BcIn0sXG4gICAge25hbWU6ICdTdW1tZXInLCBjb2RlOiBcIlNVXCJ9LFxuICAgIHtuYW1lOiAnRmFsbCcsIGNvZGU6IFwiRkFcIn0sXG4gICAge25hbWU6ICdXaW50ZXInLCBjb2RlOiBcIldJXCJ9XG4gIF07XG4gICRzY29wZS55ZWFycyA9IFtcbiAgICB7bmFtZTogJzk1JywgY29kZTogJzk1J30sXG4gICAge25hbWU6ICc5NicsIGNvZGU6ICc5Nid9LFxuICAgIHtuYW1lOiAnOTcnLCBjb2RlOiAnOTcnfSxcbiAgICB7bmFtZTogJzk4JywgY29kZTogJzk4J30sXG4gICAge25hbWU6ICc5OScsIGNvZGU6ICc5OSd9LFxuICAgIHtuYW1lOiAnMDAnLCBjb2RlOiAnMDAnfSxcbiAgICB7bmFtZTogJzAxJywgY29kZTogJzAxJ30sXG4gICAge25hbWU6ICcwMicsIGNvZGU6ICcwMid9LFxuICAgIHtuYW1lOiAnMDMnLCBjb2RlOiAnMDMnfSxcbiAgICB7bmFtZTogJzA0JywgY29kZTogJzA0J30sXG4gICAge25hbWU6ICcwNScsIGNvZGU6ICcwNSd9LFxuICAgIHtuYW1lOiAnMDYnLCBjb2RlOiAnMDYnfSxcbiAgICB7bmFtZTogJzA3JywgY29kZTogJzA3J30sXG4gICAge25hbWU6ICcwOCcsIGNvZGU6ICcwOCd9LFxuICAgIHtuYW1lOiAnMDknLCBjb2RlOiAnMDknfSxcbiAgICB7bmFtZTogJzEwJywgY29kZTogJzEwJ30sXG4gICAge25hbWU6ICcxMScsIGNvZGU6ICcxMSd9LFxuICAgIHtuYW1lOiAnMTInLCBjb2RlOiAnMTInfSxcbiAgICB7bmFtZTogJzEzJywgY29kZTogJzEzJ30sXG4gICAge25hbWU6ICcxNCcsIGNvZGU6ICcxNCd9LFxuICAgIHtuYW1lOiAnMTUnLCBjb2RlOiAnMTUnfVxuICBdO1xuICAkc2NvcGUudHlwZXMgPSBbXG4gICAge25hbWU6ICdIb21ld29yaycsIGNvZGU6ICdIJ30sXG4gICAge25hbWU6ICdNaWR0ZXJtJywgY29kZTogJ00nfSxcbiAgICB7bmFtZTogJ05vdGVzJywgY29kZTogJ04nfSxcbiAgICB7bmFtZTogJ1F1aXonLCBjb2RlOiAnUSd9LFxuICAgIHtuYW1lOiAnRmluYWwnLCBjb2RlOiAnRid9LFxuICAgIHtuYW1lOiAnTGFiJywgY29kZTogJ0wnfVxuICBdO1xuXG4gICRzY29wZS5maW5kQ2xhc3NlcyA9IGZ1bmN0aW9uKCBxdWVyeSApIHtcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgdXJsOiBQQVBFUlNfVVJMICsgJy9jbGFzc0FuZFR5cGUvY2xhc3MvJyArIHF1ZXJ5LmNsYXNzSWQgLy8rICcvdHlwZS8nICsgcXVlcnkudHlwZUNvZGVcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAkc2NvcGUucGFwZXJzID0gcmVzLmRhdGE7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuJHdhdGNoKCdwYXBlcnMnLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoICEkc2NvcGUucGFwZXJzICkgcmV0dXJuO1xuICAgIFxuICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgJHNjb3BlLnBhcGVycy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgcmVuZGVyUGRmKCAkc2NvcGUucGFwZXJzWyBpIF0gKTtcbiAgICAgIH1cbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBmdW5jdGlvbiByZW5kZXJQZGYoIHBhcGVyICkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggcGFwZXIuX2lkICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggcGFwZXIgKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggcGFwZXIuaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAuNDtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfVxuXG4gICRzY29wZS5zaG93RWRpdFBhbmVsID0gZnVuY3Rpb24oaWQpIHtcbiAgICAkc2NvcGVbICdvcGVuRWRpdFBhbmVsLScgKyBpZCBdID0gISRzY29wZVsgJ29wZW5FZGl0UGFuZWwtJyArIGlkIF07XG4gIH07XG5cbiAgJHNjb3BlLmlzRWRpdFBhbmVsT3BlbiA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuICEhJHNjb3BlWyAnb3BlbkVkaXRQYW5lbC0nICsgaWQgXTtcbiAgfTtcblxuICAkc2NvcGUuc3VibWl0RWRpdGVkUGFwZXIgPSBmdW5jdGlvbiggcGFwZXIsIG5ld0RhdGEgKSB7XG4gICAgcHV0T2JqID0ge1xuICAgICAgdGl0bGU6IG5ld0RhdGEudGl0bGUsXG4gICAgICBwZXJpb2Q6IG5ld0RhdGEuc2Vhc29uICsgbmV3RGF0YS55ZWFyLFxuICAgICAgdHlwZTogbmV3RGF0YS50eXBlLFxuICAgICAgY2xhc3NJZDogbmV3RGF0YS5jbGFzc0lkXG4gICAgfTtcblxuICAgIHBhcGVyLnN1Y2Nlc3MgPSAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgdXJsOiAnYXBpL3BhcGVycy9zaW5nbGUvJyArIHBhcGVyLl9pZCxcbiAgICAgIGRhdGE6IHB1dE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgIGNvbnNvbGUubG9nKCByZXMgKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmVycm9yICggZXJyICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH07XG5cblxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmhvbWUnLCBbXG4gICd1aS5zZWxlY3QnLFxuICAnbmdTdG9yYWdlJyxcbiAgJ25nRmlsZVVwbG9hZCcsXG4gICdmaC5zZXJ2aWNlcy5Gb2N1c1NlcnZpY2UnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIGhvbWVDb25maWcoJHN0YXRlUHJvdmlkZXIpIHtcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgdXJsOiAnL2hvbWUnLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaG9tZS9ob21lLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnSG9tZScsXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxsQ2xhc3NlczogZnVuY3Rpb24oICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UgKSB7XG4gICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIGp3dDogJHNlc3Npb25TdG9yYWdlLmp3dFxuICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gdG9rZW5zOiBmdW5jdGlvbiggJGh0dHAgKSB7XG4gICAgICAvLyAgIHJldHVybiAkaHR0cCh7XG4gICAgICAvLyAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIC8vICAgICB1cmw6ICdhc3NldHMvdG9rZW5zLmpzb24nXG4gICAgICAvLyAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgIC8vICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAvLyAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICAvLyAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgIC8vICAgfSk7XG4gICAgICAvLyB9XG4gICAgfVxuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIGZ1bmN0aW9uKCAkc2NvcGUsICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UsICR0aW1lb3V0LCBnaXZlRm9jdXMsIFVwbG9hZCwgYWxsQ2xhc3NlcyApIHtcbiAgdmFyIFBBUEVSU19VUkwgPSAnL2FwaS9wYXBlcnMnO1xuICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnand0J10gPSAkc2Vzc2lvblN0b3JhZ2Uuand0O1xuICAkc2NvcGUuYWxsQ2xhc3NlcyA9IGFsbENsYXNzZXM7XG5cbiAgJHNjb3BlLiR3YXRjaCgnZmlsZXMnLCBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUudXBsb2FkKCAkc2NvcGUuZmlsZXMgKTtcbiAgfSk7XG5cbiAgJHNjb3BlLiR3YXRjaCgnZmlsZScsIGZ1bmN0aW9uKCkge1xuICAgIGlmICgkc2NvcGUuZmlsZSAhPSBudWxsKSB7XG4gICAgICAkc2NvcGUudXBsb2FkKFskc2NvcGUuZmlsZV0pO1xuICAgIH1cbiAgfSk7XG5cbiAgJHNjb3BlLmxvZyAgICAgICAgICA9ICcnO1xuICAkc2NvcGUucGFwZXJzVG9FZGl0ID0gW107XG4gICRzY29wZS5lZGl0RGF0YSAgICAgPSB7fTtcblxuICAkc2NvcGUuc2Vhc29ucyA9IFtcbiAgICB7bmFtZTogJ1NwcmluZycsIGNvZGU6IFwiU1BcIn0sXG4gICAge25hbWU6ICdTdW1tZXInLCBjb2RlOiBcIlNVXCJ9LFxuICAgIHtuYW1lOiAnRmFsbCcsIGNvZGU6IFwiRkFcIn0sXG4gICAge25hbWU6ICdXaW50ZXInLCBjb2RlOiBcIldJXCJ9XG4gIF07XG4gICRzY29wZS55ZWFycyA9IFtcbiAgICB7bmFtZTogJzk1JywgY29kZTogJzk1J30sXG4gICAge25hbWU6ICc5NicsIGNvZGU6ICc5Nid9LFxuICAgIHtuYW1lOiAnOTcnLCBjb2RlOiAnOTcnfSxcbiAgICB7bmFtZTogJzk4JywgY29kZTogJzk4J30sXG4gICAge25hbWU6ICc5OScsIGNvZGU6ICc5OSd9LFxuICAgIHtuYW1lOiAnMDAnLCBjb2RlOiAnMDAnfSxcbiAgICB7bmFtZTogJzAxJywgY29kZTogJzAxJ30sXG4gICAge25hbWU6ICcwMicsIGNvZGU6ICcwMid9LFxuICAgIHtuYW1lOiAnMDMnLCBjb2RlOiAnMDMnfSxcbiAgICB7bmFtZTogJzA0JywgY29kZTogJzA0J30sXG4gICAge25hbWU6ICcwNScsIGNvZGU6ICcwNSd9LFxuICAgIHtuYW1lOiAnMDYnLCBjb2RlOiAnMDYnfSxcbiAgICB7bmFtZTogJzA3JywgY29kZTogJzA3J30sXG4gICAge25hbWU6ICcwOCcsIGNvZGU6ICcwOCd9LFxuICAgIHtuYW1lOiAnMDknLCBjb2RlOiAnMDknfSxcbiAgICB7bmFtZTogJzEwJywgY29kZTogJzEwJ30sXG4gICAge25hbWU6ICcxMScsIGNvZGU6ICcxMSd9LFxuICAgIHtuYW1lOiAnMTInLCBjb2RlOiAnMTInfSxcbiAgICB7bmFtZTogJzEzJywgY29kZTogJzEzJ30sXG4gICAge25hbWU6ICcxNCcsIGNvZGU6ICcxNCd9LFxuICAgIHtuYW1lOiAnMTUnLCBjb2RlOiAnMTUnfVxuICBdO1xuICAkc2NvcGUudHlwZXMgPSBbXG4gICAge25hbWU6ICdIb21ld29yaycsIGNvZGU6ICdIJ30sXG4gICAge25hbWU6ICdNaWR0ZXJtJywgY29kZTogJ00nfSxcbiAgICB7bmFtZTogJ05vdGVzJywgY29kZTogJ04nfSxcbiAgICB7bmFtZTogJ1F1aXonLCBjb2RlOiAnUSd9LFxuICAgIHtuYW1lOiAnRmluYWwnLCBjb2RlOiAnRid9LFxuICAgIHtuYW1lOiAnTGFiJywgY29kZTogJ0wnfVxuICBdO1xuXG4gICRzY29wZS51cGxvYWQgPSBmdW5jdGlvbiggZmlsZXMgKSB7XG4gICAgaWYgKGZpbGVzICYmIGZpbGVzLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZmlsZSA9IGZpbGVzW2ldO1xuXG4gICAgICAgIFVwbG9hZC51cGxvYWQoe1xuICAgICAgICAgIHVybDogUEFQRVJTX1VSTCxcbiAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgIH0pXG5cbiAgICAgICAgLnByb2dyZXNzKGZ1bmN0aW9uICggZXZ0ICkge1xuICAgICAgICAgIHZhciBwcm9ncmVzc1BlcmNlbnRhZ2UgPSBwYXJzZUludCgxMDAuMCAqIGV2dC5sb2FkZWQgLyBldnQudG90YWwpO1xuICAgICAgICAgICRzY29wZS5sb2cgPSAncHJvZ3Jlc3M6ICcgKyBcbiAgICAgICAgICAgIHByb2dyZXNzUGVyY2VudGFnZSArIFxuICAgICAgICAgICAgJyUnICsgXG4gICAgICAgICAgICBldnQuY29uZmlnLmZpbGUubmFtZSArIFxuICAgICAgICAgICAgJ1xcbicgKyBcbiAgICAgICAgICAgICRzY29wZS5sb2c7XG4gICAgICAgIH0pXG5cbiAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oIGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnICkge1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAkc2NvcGUubG9nID0gJ2ZpbGU6ICcgKyBcbiAgICAgICAgICAgICAgY29uZmlnLmZpbGUubmFtZSArIFxuICAgICAgICAgICAgICAnLCBSZXNwb25zZTogJyArIFxuICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSggZGF0YS50aXRsZSApICsgXG4gICAgICAgICAgICAgICcsIElEOiAnICtcbiAgICAgICAgICAgICAgZGF0YS5faWRcbiAgICAgICAgICAgICAgJ1xcbicgKyBcbiAgICAgICAgICAgICAgJHNjb3BlLmxvZztcblxuICAgICAgICAgICAgJHNjb3BlLnBhcGVyc1RvRWRpdC5wdXNoKHtcbiAgICAgICAgICAgICAgX2lkOiBkYXRhLl9pZCxcbiAgICAgICAgICAgICAgdGl0bGU6IGRhdGEudGl0bGUsXG4gICAgICAgICAgICAgIHVzZXJJZDogZGF0YS51c2VySWRcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBnaXZlRm9jdXMoJ3NlYXNvbi1waWNrZXInKTtcblxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnN1Ym1pdEVkaXRlZFBhcGVyID0gZnVuY3Rpb24oIHBhcGVyLCBuZXdEYXRhICkge1xuICAgIHB1dE9iaiA9IHtcbiAgICAgIHRpdGxlOiBuZXdEYXRhLnRpdGxlLFxuICAgICAgcGVyaW9kOiBuZXdEYXRhLnNlYXNvbiArIG5ld0RhdGEueWVhcixcbiAgICAgIHR5cGU6IG5ld0RhdGEudHlwZSxcbiAgICAgIGNsYXNzSWQ6IG5ld0RhdGEuY2xhc3NJZFxuICAgIH07XG5cbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgdXJsOiAnYXBpL3BhcGVycy9zaW5nbGUvJyArIHBhcGVyLl9pZCxcbiAgICAgIGRhdGE6IHB1dE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgIGNvbnNvbGUubG9nKCByZXMgKTtcbiAgICAgICRzY29wZS5wYXBlclRvRWRpdEJhY2tTdG9yZSA9ICRzY29wZS5wYXBlcnNUb0VkaXQuc2hpZnQoKTtcbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5lcnJvciAoIGVyciApO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIHJlLXJlbmRlcnMgdGhlIG1haW4gY2FudmFzIHVwb24gY2hhbmdlXG4gIC8vICRzY29wZS4kd2F0Y2goJ3BhcGVyc1RvRWRpdFswXScsIGZ1bmN0aW9uKCkge1xuICAvLyAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbi12aWV3ZXInKTtcbiAgLy8gICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgLy8gaWYgKCAkc2NvcGUucGFwZXJzVG9FZGl0WzBdICkge1xuICAgIC8vICAgUERGSlMuZ2V0RG9jdW1lbnQoICRzY29wZS5wYXBlcnNUb0VkaXRbMF0uaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgLy8gICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24ocGFnZSkge1xuXG4gICAgLy8gICAgICAgdmFyIHNjYWxlID0gMC44O1xuICAgIC8vICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgLy8gICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAvLyAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgIC8vICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgIC8vICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAvLyAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgIC8vICAgICAgIH07XG4gICAgLy8gICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgfSk7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgLy8gfVxuICAvLyB9KTtcblxuICAvLyByZS1yZW5kZXJzIHRoZSBzZWNvbmRhcnkgY2FudmFzIHVwb24gY2hhbmdlXG4gIC8vICRzY29wZS4kd2F0Y2goJ3BhcGVyc1RvRWRpdFsxXScsIGZ1bmN0aW9uKCkge1xuICAvLyAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV4dC11cC1wZGYtY29udGFpbmVyJyk7XG4gIC8vICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIC8vIGlmICggJHNjb3BlLnBhcGVyc1RvRWRpdFsxXSApIHtcbiAgICAvLyAgIFBERkpTLmdldERvY3VtZW50KCAkc2NvcGUucGFwZXJzVG9FZGl0WzFdLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgIC8vICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKHBhZ2UpIHtcblxuICAgIC8vICAgICAgIHZhciBzY2FsZSA9IDAuMjtcbiAgICAvLyAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgIC8vICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgLy8gICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAvLyAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAvLyAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgLy8gICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAvLyAgICAgICB9O1xuICAgIC8vICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgIH0pO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIC8vIH1cbiAgLy8gfSk7XG5cbiAgJHNjb3BlLmFkZENsYXNzID0gZnVuY3Rpb24oIG5ld0NsYXNzICkge1xuICAgIHZhciBwb3N0T2JqID0ge3RpdGxlOiBuZXdDbGFzc307XG5cbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogJy9hcGkvY2xhc3NlcycsXG4gICAgICBkYXRhOiBwb3N0T2JqXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogJy9hcGkvY2xhc3Nlcy9hbGwnXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXMgKSB7XG4gICAgICAgICRzY29wZS5hbGxDbGFzc2VzID0gcmVzLmRhdGE7XG4gICAgICB9KTtcblxuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gJHNjb3BlLmFkZFRva2VucyA9IGZ1bmN0aW9uKCkge1xuICAvLyAgICRzY29wZS50b2tlbnMuZm9yRWFjaCggZnVuY3Rpb24oIHRva2VuLCBpbmRleCwgYXJyYXkpIHtcbiAgLy8gICAgICRodHRwKHtcbiAgLy8gICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gIC8vICAgICAgIHVybDogJy9hcGkvbWFrZVRva2VuJyxcbiAgLy8gICAgICAgZGF0YTogdG9rZW5cbiAgLy8gICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgLy8gICAgICAgY29uc29sZS5sb2coJ3llcycpO1xuICAvLyAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgLy8gICAgICAgY29uc29sZS5sb2coJ0ZGRkZGRkZGRkZVVVVVVScsIGVycik7XG4gIC8vICAgICB9KTtcbiAgLy8gICB9KTtcbiAgLy8gfTtcblxufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnZmgubGFuZGluZycsW1xuICAnbmdTdG9yYWdlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiAoICRzdGF0ZVByb3ZpZGVyICkge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnbGFuZGluZycsIHtcbiAgICB1cmw6ICcvJyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnTGFuZGluZ0NvbnRyb2xsZXInLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2xhbmRpbmcvbGFuZGluZy50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ2xhbmRpbmdQYWdlLnBhZ2VUaXRsZSdcbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignTGFuZGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoICRzY29wZSwgJHN0YXRlLCAkaHR0cCwgJGJhc2U2NCwgJHNlc3Npb25TdG9yYWdlKSB7XG4gIHZhciBVU0VSU19VUkwgPSAnL2FwaS91c2Vycyc7XG5cbiAgJHNjb3BlLnJlZ2lzdGVyID0gZnVuY3Rpb24oIGNyZWRlbnRpYWxzICkge1xuICAgIGlmICggIWNyZWRlbnRpYWxzLm5hbWUgfHxcbiAgICAgICAgICFjcmVkZW50aWFscy5lbWFpbCB8fFxuICAgICAgICAgIWNyZWRlbnRpYWxzLnBhc3N3b3JkIHx8XG4gICAgICAgICAhY3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtIHx8XG4gICAgICAgICAhY3JlZGVudGlhbHMuYWRkQ29kZSApIHtcbiAgICAgICRzY29wZS5yZWdpc3RyYXRpb25FcnJvciA9ICdQbGVhc2UgY29tcGxldGUgdGhlIGZvcm0gYmVmb3JlIHN1Ym1pdHRpbmcnO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBuZXdVc2VyID0ge1xuICAgICAgbmFtZTogY3JlZGVudGlhbHMubmFtZSxcbiAgICAgIHBob25lOiBjcmVkZW50aWFscy5waG9uZSxcbiAgICAgIGVtYWlsOiBjcmVkZW50aWFscy5lbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBjcmVkZW50aWFscy5wYXNzd29yZCxcbiAgICAgIHBhc3N3b3JkQ29uZmlybTogY3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtLFxuICAgICAgdG9rZW46IGNyZWRlbnRpYWxzLmFkZENvZGVcbiAgICB9O1xuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgdXJsOiBVU0VSU19VUkwsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0sXG4gICAgICBkYXRhOiBuZXdVc2VyXG4gICAgfSlcbiAgICAuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICBjb25zb2xlLmRpcihkYXRhKTtcbiAgICAgIC8vICRzY29wZS5yZWdpc3RlckNyZWRlbnRpYWxzID0ge307XG4gICAgICAvLyAkc2NvcGUucmVnaXN0ZXJTdWNjZXNzID0gdHJ1ZTtcbiAgICAgICRzZXNzaW9uU3RvcmFnZS5qd3QgPSBkYXRhLmp3dDtcbiAgICAgICRzdGF0ZS5nbygnc2VhcmNoJyk7XG4gICAgfSlcbiAgICAuZXJyb3IoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAkc2NvcGUucmVnaXN0cmF0aW9uRXJyb3IgPSBlcnI7XG4gICAgICBjb25zb2xlLmRpcihlcnIpO1xuICAgICAgJHNjb3BlLnJlZ2lzdGVyQ3JlZGVudGlhbHMucGFzc3dvcmQgPSAnJztcbiAgICAgICRzY29wZS5yZWdpc3RlckNyZWRlbnRpYWxzLnBhc3N3b3JkQ29uZmlybSA9ICcnO1xuICAgIH0pO1xuICB9O1xuXG4gICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XG5cbiAgICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnQXV0aG9yaXphdGlvbiddID0gXG4gICAgICAnQmFzaWMgJyArIFxuICAgICAgJGJhc2U2NC5lbmNvZGUoY3JlZGVudGlhbHMuZW1haWwgKyBcbiAgICAgICc6JyArIFxuICAgICAgY3JlZGVudGlhbHMucGFzc3dvcmQpO1xuICAgIFxuICAgICRodHRwLmdldChVU0VSU19VUkwpXG4gICAgICAuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIGNvbnNvbGUuZGlyKGRhdGEpO1xuICAgICAgICAkc2Vzc2lvblN0b3JhZ2Uuand0ID0gZGF0YS5qd3Q7XG4gICAgICAgICRzdGF0ZS5nbygnc2VhcmNoJyk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAkc2NvcGUubG9naW5FcnJvciA9IGVycjtcbiAgICAgICAgY29uc29sZS5kaXIoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnZmguc2VhcmNoJywgW1xuICAndWkuc2VsZWN0JyxcbiAgJ2NnQnVzeScsXG4gICduZ1N0b3JhZ2UnLFxuICAnc21hcnQtdGFibGUnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIHNlYXJjaENvbmZpZygkc3RhdGVQcm92aWRlcikge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2VhcmNoJywge1xuICAgIHVybDogJy9zZWFyY2gnLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdzZWFyY2gvc2VhcmNoLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnU2VhcmNoJ1xuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdTZWFyY2hDb250cm9sbGVyJywgZnVuY3Rpb24oICRyb290U2NvcGUsICRzY29wZSwgJGh0dHAsICRzZXNzaW9uU3RvcmFnZSwgJHRpbWVvdXQgKSB7XG4gICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydqd3QnXSA9ICRzZXNzaW9uU3RvcmFnZS5qd3Q7XG5cbiAgJHNjb3BlLnJldmVyc2UgICAgPSB0cnVlO1xuICAkc2NvcGUucHJlZGljYXRlICA9ICdwZXJpb2QnO1xuICAkc2NvcGUucmVuZGVyZWQgICA9IGZhbHNlO1xuICAkc2NvcGUucXVlcnkgICAgICA9IHt9O1xuICB2YXIgUEFQRVJTX1VSTCAgICA9ICcvYXBpL3BhcGVycyc7XG4gICRzY29wZS5zb3J0UGVyaW9kID0ge1xuICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICByZXZlcnNlOiB0cnVlXG4gIH07XG4gICRzY29wZS5zb3J0VHlwZSAgID0ge1xuICAgIGFjdGl2ZTogZmFsc2UsXG4gICAgcmV2ZXJzZTogZmFsc2VcbiAgfTtcblxuICB2YXIgcGFnZTtcblxuICAkaHR0cCh7XG4gICAgbWV0aG9kOiAnR0VUJyxcbiAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnXG4gIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAkc2NvcGUuYWxsQ2xhc3NlcyA9IHJlcy5kYXRhO1xuICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgIGNvbnNvbGUubG9nKGVycik7XG4gIH0pO1xuXG4gICRzY29wZS50b2dnbGVQZXJpb2RSZXZlcnNlID0gZnVuY3Rpb24oKSB7XG4gICAgJHNjb3BlLnNvcnRUeXBlLmFjdGl2ZSAgICA9IGZhbHNlO1xuICAgICRzY29wZS5zb3J0VHlwZS5yZXZlcnNlICAgPSBmYWxzZTtcbiAgICAkc2NvcGUuc29ydFBlcmlvZC5hY3RpdmUgID0gdHJ1ZTtcbiAgICAkc2NvcGUuc29ydFBlcmlvZC5yZXZlcnNlID0gISRzY29wZS5zb3J0UGVyaW9kLnJldmVyc2U7XG4gIH07XG5cbiAgJHNjb3BlLnRvZ2dsZVR5cGVSZXZlcnNlID0gZnVuY3Rpb24oKSB7XG4gICAgJHNjb3BlLnNvcnRQZXJpb2QuYWN0aXZlICA9IGZhbHNlO1xuICAgIC8vIFxcL1xcL1xcLyBzb3J0UGVyaW9kLnJldmVyc2UgaXMgcmVzZXQgdG8gdHJ1ZSBiZWNhdXNlIGl0J3MgbW9yZSBuYXR1cmFsIHRvIHNlZSBsYXJnZXIgZGF0ZXMgKG1vcmUgcmVjZW50KSBmaXJzdFxuICAgICRzY29wZS5zb3J0UGVyaW9kLnJldmVyc2UgPSB0cnVlOyBcbiAgICAkc2NvcGUuc29ydFR5cGUuYWN0aXZlICAgID0gdHJ1ZTtcbiAgICAkc2NvcGUuc29ydFR5cGUucmV2ZXJzZSAgID0gISRzY29wZS5zb3J0VHlwZS5yZXZlcnNlO1xuICB9O1xuXG4gICRzY29wZS5ob3ZlckluT3JPdXQgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLmhvdmVyRWRpdCA9ICF0aGlzLmhvdmVyRWRpdDtcbiAgfTtcblxuICAkc2NvcGUuZmluZFBhcGVyc0J5Q2xhc3MgPSBmdW5jdGlvbihxdWVyeSkge1xuICAgICRzY29wZS5idXN5RmluZGluZ1BhcGVycyA9ICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICB1cmw6IFBBUEVSU19VUkwgKyAnL2NsYXNzLycgKyBxdWVyeS5jbGFzc0lkXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgJHNjb3BlLnBhcGVycyA9IGRlc2VyaWFsaXplUGFwZXJzKHJlcy5kYXRhKTtcbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5sb2coIGVyciApO1xuICAgIH0pO1xuICB9O1xuXG4gIGZ1bmN0aW9uIGRlc2VyaWFsaXplUGFwZXJzKHBhcGVycykge1xuICAgIGlmICghcGFwZXJzKSByZXR1cm47XG5cbiAgICByZXR1cm4gcGFwZXJzLm1hcChmdW5jdGlvbihwYXBlcikge1xuICAgICAgdmFyIHNlYXNvbiA9IHBhcGVyLnBlcmlvZC5zbGljZSgwLDIpO1xuICAgICAgdmFyIHllYXIgPSBwYXBlci5wZXJpb2Quc2xpY2UoMiw0KTtcbiAgICAgIHZhciBtb250aDtcblxuICAgICAgLy8gY29udmVydCBzZWFzb24gc3RyaW5nIGludG8gbW9udGggbnVtYmVyXG4gICAgICBzd2l0Y2ggKHNlYXNvbikge1xuICAgICAgICBjYXNlICdXSSc6XG4gICAgICAgICAgbW9udGggPSAwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdTUCc6XG4gICAgICAgICAgbW9udGggPSAzO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdTVSc6XG4gICAgICAgICAgbW9udGggPSA2O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdGQSc6XG4gICAgICAgICAgbW9udGggPSA5O1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBjb252ZXJ0IHllYXIgc3RyaW5nIGludG8geWVhciBudW1iZXIgKGRvdWJsZSBkaWdpdHMgY29udmVydCB0byAxOTAwLTE5OTksIG5lZWQgNCB5ZWFyIGZvciBhZnRlciAxOTk5KVxuICAgICAgeWVhciA9IHBhcnNlSW50KHllYXIpO1xuXG4gICAgICBpZiAoeWVhciA8IDgwKSB7XG4gICAgICAgIHllYXIgKz0gMjAwMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHllYXIgKz0gMTkwMDtcbiAgICAgIH1cblxuICAgICAgcGFwZXIucGVyaW9kID0gbmV3IERhdGUoeWVhciwgbW9udGgsIDEpO1xuICAgICAgcmV0dXJuIHBhcGVyO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gJHNjb3BlLmZpbmRJbWFnZSA9IGZ1bmN0aW9uKCBwYXBlcklkICkge1xuICAvLyAgICRzY29wZS5idXN5RmluZGluZ1BhcGVySW1hZ2UgPSAkaHR0cCh7XG4gIC8vICAgICBtZXRob2Q6ICdHRVQnLFxuICAvLyAgICAgdXJsOiBQQVBFUlNfVVJMICsgJy9zaW5nbGUvJyArIHBhcGVySWRcbiAgLy8gICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gIC8vICAgICAkc2NvcGUucGFwZXJUb1JlbmRlciA9IHJlcy5kYXRhO1xuICAvLyAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gIC8vICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gIC8vICAgfSk7XG4gIC8vIH07XG5cbiAgZnVuY3Rpb24gcmVuZGVyUGRmKCBwYWdlICkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2Rpc3BsYXktcGFwZXInICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICRzY29wZS5wZGYuZ2V0UGFnZSggcGFnZSApLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG4gICAgICB2YXIgc2NhbGUgPSAxO1xuICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgfTtcbiAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXJQZGZJbml0aWFsKCBwYXBlciApIHtcbiAgICAkc2NvcGUucmVuZGVyZWQgPSB0cnVlO1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggJ2Rpc3BsYXktcGFwZXInICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggcGFwZXIgKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggcGFwZXIuaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAxO1xuICAgICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgICAgIH07XG4gICAgICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRzY29wZS5wZGYgPSBwZGY7XG4gICAgICAgIHBhZ2UgPSAxO1xuXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcmV2aW91cy1wYWdlJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLFxuICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCBwYWdlID4gMSApIHtcbiAgICAgICAgICAgICAgcGFnZS0tO1xuICAgICAgICAgICAgICByZW5kZXJQZGYoIHBhZ2UgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXh0LXBhZ2UnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoICRzY29wZS5wZGYubnVtUGFnZXMgPiBwYWdlICkge1xuICAgICAgICAgICAgICBwYWdlKys7XG4gICAgICAgICAgICAgIHJlbmRlclBkZiggcGFnZSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG5cbiAgICB9IGVsc2Uge1xuICAgICAgY29udGV4dC5jbGVhclJlY3QoMCwgMCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcbiAgICB9XG4gIH1cblxuICAkc2NvcGUuJHdhdGNoKCdwYXBlclRvUmVuZGVyJywgZnVuY3Rpb24oKSB7XG4gICAgaWYgKCAhJHNjb3BlLnBhcGVyVG9SZW5kZXIgKSByZXR1cm47XG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAvLyByZW5kZXJQZGZJbml0aWFsKCAkc2NvcGUucGFwZXIgKTtcbiAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdCgncGRmLXJlYWR5LXRvLXJlbmRlcicpO1xuICAgIH0sIDEwMCk7XG4gIH0pO1xuXG59KVxuXG4uZmlsdGVyKCdwZXJpb2RGaWx0ZXInLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0UGVyaW9kKSB7XG4gICAgdmFyIHllYXIgICAgID0gaW5wdXRQZXJpb2QuZ2V0RnVsbFllYXIoKTtcbiAgICB2YXIgd2ludGVyICAgPSBuZXcgRGF0ZSh5ZWFyLCAwLCAxKTtcbiAgICB2YXIgc3ByaW5nICAgPSBuZXcgRGF0ZSh5ZWFyLCAzLCAxKTtcbiAgICB2YXIgc3VtbWVyICAgPSBuZXcgRGF0ZSh5ZWFyLCA2LCAxKTtcbiAgICB2YXIgZmFsbCAgICAgPSBuZXcgRGF0ZSh5ZWFyLCA5LCAxKTtcbiAgICB2YXIgc2Vhc29uO1xuXG4gICAgc3dpdGNoIChpbnB1dFBlcmlvZC5nZXRNb250aCgpKSB7XG4gICAgICBjYXNlIDA6XG4gICAgICAgIHNlYXNvbiA9ICdXSSc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBzZWFzb24gPSAnU1AnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgNjpcbiAgICAgICAgc2Vhc29uID0gJ1NVJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDk6XG4gICAgICAgIHNlYXNvbiA9ICdGQSc7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB2YXIgcmV0dXJuWWVhciA9IGlucHV0UGVyaW9kLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcbiAgICByZXR1cm5ZZWFyID0gcmV0dXJuWWVhci5zbGljZSgyLDQpO1xuXG4gICAgcmV0dXJuICcnICsgc2Vhc29uICsgcmV0dXJuWWVhcjtcbiAgfVxufSlcblxuLmZpbHRlcigndHlwZUZpbHRlcicsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oaW5wdXRUeXBlKSB7XG4gICAgc3dpdGNoIChpbnB1dFR5cGUpIHtcbiAgICAgIGNhc2UgJ0gnOlxuICAgICAgICByZXR1cm4gJ0hvbWV3b3JrJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdNJzpcbiAgICAgICAgcmV0dXJuICdNaWR0ZXJtJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdOJzpcbiAgICAgICAgcmV0dXJuICdOb3Rlcyc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnUSc6XG4gICAgICAgIHJldHVybiAnUXVpeic7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnRic6XG4gICAgICAgIHJldHVybiAnRmluYWwnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ0wnOlxuICAgICAgICByZXR1cm4gJ0xhYic7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufSlcbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5kaXJlY3RpdmVzLm1haW5IZWFkZXInLCBbXG4gICAgJ25nU3RvcmFnZScsXG4gICAgJ0FwcGxpY2F0aW9uQ29uZmlndXJhdGlvbidcbl0pXG5cbi5kaXJlY3RpdmUoJ21haW5IZWFkZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2RpcmVjdGl2ZXMvbWFpbkhlYWRlci9tYWluSGVhZGVyLnRwbC5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oICRzY29wZSwgJHN0YXRlICkge1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5kaXJlY3RpdmVzLm1vZGFscy5zaG93UGRmTW9kYWwnLCBbXG4gICd1aS5ib290c3RyYXAnLFxuICAnZmguc2VydmljZXMuTW9kYWxTZXJ2aWNlJ1xuXSlcblxuLmRpcmVjdGl2ZSgnc2hvd1BkZk1vZGFsJywgZnVuY3Rpb24oIE1vZGFsU2VydmljZSwgJGh0dHAgKSB7XG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBRScsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICBlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBNb2RhbFNlcnZpY2Uub3Blbk1vZGFsKHtcbiAgICAgICAgICB0ZW1wbGF0ZVVybDogJ2RpcmVjdGl2ZXMvbW9kYWxzL3Nob3dQZGZNb2RhbC9zaG93UGRmTW9kYWwudHBsLmh0bWwnLFxuICAgICAgICAgIGNvbnRyb2xsZXI6ICdTaG93UGRmTW9kYWxDb250cm9sbGVyJyxcbiAgICAgICAgICB3aW5kb3dDbGFzczogJ3Nob3ctcGRmLW1vZGFsJyxcbiAgICAgICAgICBiYWNrZHJvcDogJ3N0YXRpYycsXG4gICAgICAgICAga2V5Ym9hcmQ6IGZhbHNlLFxuICAgICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgICAgIHBhcGVyVG9SZW5kZXJJZDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHJldHVybiBzY29wZS5wYXBlci5faWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufSlcblxuLmNvbnRyb2xsZXIoJ1Nob3dQZGZNb2RhbENvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsICR0aW1lb3V0LCBNb2RhbFNlcnZpY2UsIHBhcGVyVG9SZW5kZXJJZCkge1xuICAkc2NvcGUuY2xvc2UgPSBmdW5jdGlvbigpIHtcbiAgICBNb2RhbFNlcnZpY2UuY2xvc2VNb2RhbCgpO1xuICB9O1xuICB2YXIgcGFnZTtcbiAgJHNjb3BlLnBhcGVyVG9SZW5kZXIgPSBwYXBlclRvUmVuZGVySWQ7XG5cbiAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZW5kZXJlZC1wZGYtbW9kYWwnKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgIGlmICggcGFwZXJUb1JlbmRlcklkICkge1xuICAgICAgUERGSlMuZ2V0RG9jdW1lbnQoICcvYXBpL3BhcGVycy9zaW5nbGUvaW1hZ2UvJyArIHBhcGVyVG9SZW5kZXJJZCApLnRoZW4oZnVuY3Rpb24oIHBkZiApIHtcbiAgICAgICAgcGRmLmdldFBhZ2UoMSkudGhlbihmdW5jdGlvbiggcGFnZSApIHtcblxuICAgICAgICAgIHZhciBzY2FsZSA9IDE7XG4gICAgICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgICAgICBjYW52YXNDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICAgICAgfTtcbiAgICAgICAgICBwYWdlLnJlbmRlcihyZW5kZXJDb250ZXh0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLnBkZiA9IHBkZjtcbiAgICAgICAgJHNjb3BlLnBhZ2UgPSAxXG5cbiAgICAgICAgLy8gZXZlbnQgbGlzdGVuZXJzIGZvciBQREYgcGFnZSBuYXZpZ2F0aW9uXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcmV2aW91cy1wYWdlLW1vZGFsJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLFxuICAgICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCAkc2NvcGUucGFnZSA+IDEgKSB7XG4gICAgICAgICAgICAgICRzY29wZS5wYWdlLS07XG4gICAgICAgICAgICAgIHJlbmRlclBkZiggJHNjb3BlLnBhZ2UgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCduZXh0LXBhZ2UtbW9kYWwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoICRzY29wZS5wZGYubnVtUGFnZXMgPiAkc2NvcGUucGFnZSApIHtcbiAgICAgICAgICAgICAgJHNjb3BlLnBhZ2UrKztcbiAgICAgICAgICAgICAgcmVuZGVyUGRmKCAkc2NvcGUucGFnZSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfSwgNTApO1xuXG4gIC8vICRzY29wZS5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAvLyAgIGlmICggJHNjb3BlLnBkZi5udW1QYWdlcyA+ICRzY29wZS5wYWdlICkge1xuICAvLyAgICAgJHNjb3BlLnBhZ2UrKztcbiAgLy8gICAgIHJlbmRlclBkZiggJHNjb3BlLnBhZ2UgKTtcbiAgLy8gICB9XG4gIC8vIH07XG5cbiAgZnVuY3Rpb24gcmVuZGVyUGRmKCBwYWdlICkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVuZGVyZWQtcGRmLW1vZGFsJyk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICRzY29wZS5wZGYuZ2V0UGFnZSggcGFnZSApLnRoZW4oZnVuY3Rpb24oIHJlbmRlclBhZ2UgKSB7XG4gICAgICB2YXIgc2NhbGUgPSAxO1xuICAgICAgdmFyIHZpZXdwb3J0ID0gcmVuZGVyUGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgICAgfTtcbiAgICAgIHJlbmRlclBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgIH0pXG4gIH1cbiAgICBcbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLkZpbmRJbWFnZVNlcnZpY2UnLCBbXG4gICAgICAgICduZ1N0b3JhZ2UnLFxuICAgICAgICAndmVuZG9yLnN0ZWVsVG9lJ1xuICAgIF0pXG5cbi5mYWN0b3J5KCdGaW5kSW1hZ2VTZXJ2aWNlJywgZnVuY3Rpb24oJGh0dHAsICRzZXNzaW9uU3RvcmFnZSwgJHEsIHN0ZWVsVG9lKSB7XG5cbiAgICBmdW5jdGlvbiBpc0ltYWdlKHNyYywgZGVmYXVsdFNyYykge1xuXG4gICAgICAgIHZhciBkZWZlcnJlZCA9ICRxLmRlZmVyKCk7XG5cbiAgICAgICAgdmFyIGltYWdlID0gbmV3IEltYWdlKCk7XG4gICAgICAgIGltYWdlLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdlcnJvcjogJyArIHNyYyArICcgbm90IGZvdW5kJyk7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBkZWZhdWx0U3JjICk7XG4gICAgICAgIH07XG4gICAgICAgIGltYWdlLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZSggc3JjICk7XG4gICAgICAgIH07XG4gICAgICAgIGltYWdlLnNyYyA9IHNyYztcblxuICAgICAgICByZXR1cm4gZGVmZXJyZWQucHJvbWlzZTtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRIZWFkZXJJbWFnZTogZnVuY3Rpb24oY29tcGFueUNvZGUpIHtcbiAgICAgICAgICAgIHZhciBpbWFnZVVybCA9ICcuL2Fzc2V0cy9pbWFnZXMvaGVhZGVySW1hZ2UuanBnJztcbiAgICAgICAgICAgIHJldHVybiBpc0ltYWdlKGltYWdlVXJsKTtcbiAgICAgICAgfVxuICAgIH07XG59KTtcblxuXG5cbi8vIGludGVyaW9yXG4vLyBJLCBKLCBLLCBMLCBNLCBNTSwgTiwgTk4sIElBLCBJUSwgUlxuXG4vLyBvY2VhblxuLy8gQywgQ0EsIENRLCBELCBEQSwgREQsIEUsIEVFLCBGLCBGQSwgRkIsIEZGLCBHLCBILCBISCwgR0csIE9PLCBRXG5cbi8vIHZpc3RhXG4vLyBBLCBBQSwgQUIsIEFTLCBCLCBCQSwgQkIsIEJDLCBCUVxuXG4vLyBuZXB0dW5lXG4vLyBTLCBTQSwgU0IsIFNDLCBTUVxuXG4vLyBwaW5uYWNsZVxuLy8gUFNcblxuLy8gdmVyYW5kYWhcbi8vIFYsIFZBLCBWQiwgVkMsIFZELCBWRSwgVkYsIFZILCBWUSwgVlMsIFZUXG5cbi8vIHNpZ25hdHVyZVxuLy8gU1MsIFNZLCBTWiwgU1VcblxuLy8gbGFuYWlcbi8vIENBXG5cbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5zZXJ2aWNlcy5Gb2N1c1NlcnZpY2UnLCBbXSlcblxuLmZhY3RvcnkoJ2dpdmVGb2N1cycsIGZ1bmN0aW9uKCR0aW1lb3V0KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgICAgICBpZihlbGVtZW50KVxuICAgICAgICAgICAgICAgIGVsZW1lbnQuZm9jdXMoKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdmaC5zZXJ2aWNlcy5Nb2RhbFNlcnZpY2UnLCBbXG4gICAgJ3VpLmJvb3RzdHJhcC5tb2RhbCcsXG5dKVxuLnNlcnZpY2UoJ01vZGFsU2VydmljZScsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRtb2RhbCkge1xuICAgIHZhciBtZSA9IHtcbiAgICAgICAgbW9kYWw6IG51bGwsXG4gICAgICAgIG1vZGFsQXJnczogbnVsbCxcbiAgICAgICAgaXNNb2RhbE9wZW46IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIG1lLm1vZGFsICE9PSBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBvcGVuTW9kYWw6IGZ1bmN0aW9uKGFyZ3MpIHtcbiAgICAgICAgICAgIG1lLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgIG1lLm1vZGFsQXJncyA9IGFyZ3M7XG4gICAgICAgICAgICBtZS5tb2RhbCA9ICRtb2RhbC5vcGVuKGFyZ3MpO1xuXG4gICAgICAgICAgICByZXR1cm4gbWUubW9kYWw7XG4gICAgICAgIH0sXG4gICAgICAgIGNsb3NlTW9kYWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKG1lLm1vZGFsID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtZS5tb2RhbC5kaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgbWUubW9kYWwgPSBudWxsO1xuICAgICAgICAgICAgICAgIG1lLm1vZGFsQXJncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy9XaGVuIHRoZSB1c2VyIG5hdmlnYXRlcyBhd2F5IGZyb20gYSBwYWdlIHdoaWxlIGEgbW9kYWwgaXMgb3BlbiwgY2xvc2UgdGhlIG1vZGFsLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgIG1lLmNsb3NlTW9kYWwoKTtcbiAgICB9KTtcblxuICAgIHJldHVybiBtZTtcbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==