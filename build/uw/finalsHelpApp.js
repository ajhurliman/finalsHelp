angular.module('fh.account', [
  'ngStorage'
])

.config(function ( $stateProvider ) {
  $stateProvider.state('account', {
    url: '/account',
    views: {
      main: {
        controller: 'AccountController',
        templateUrl: 'account/account.tpl.html'
      }
    }
  });
})

.controller('AccountController', function($scope, $state,  $base64, $http, $sessionStorage) {
  var USERS_URL = '/api/users';
  $scope.formData = {};
  if ($sessionStorage.user) {
    $scope.user = $sessionStorage.user;
  } else {
    $state.go('landing');
  }
    

  $scope.authCheck = function(oldPassword) {
    $http.defaults.headers.common['Authorization'] = 
      'Basic ' + 
      $base64.encode($sessionStorage.user.basic.email + 
      ':' + 
      oldPassword);
    
    $http.get(USERS_URL)
      .success(function(data) {
        $sessionStorage.jwt = data.jwt;
        $sessionStorage.user = data.user;
        $scope.authSuccess = true;
        $scope.updatePasswordError = null;
      })
      .error(function(err) {
        $scope.updatePasswordError = err;
        $scope.authSuccess = false;
      });
  }

  $scope.updatePassword = function( newPassword, newPasswordConfirm ) {
    if (!newPassword ||
        !newPasswordConfirm) {
      $scope.updatePasswordError = 'Please complete the form before submitting';
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      $scope.updatePasswordError = 'Password must match';
      return;
    }

    $http({
      method: 'PUT',
      url: USERS_URL + '/password',
      headers: {
        'Content-Type': 'application/json',
        'jwt': $sessionStorage.jwt
      },
      data: {newPassword: newPassword}
    })
    .success(function(data) {
      console.dir(data);
      $sessionStorage.jwt = data.jwt;
      $scope.updatePasswordError = null;
      $scope.updatePasswordSuccess = 'Password changed!';
      $scope.passwords = {};
    })
    .error(function(err) {
      $scope.updatePasswordError = err;
      $scope.passwords = {};
    });
  };


  $scope.editPasswordEnabled = function() {
    if (!$scope.oldPassword) return 'disabled';
    else return '';
  };
});
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
    'fh.account',
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
    }
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
      $sessionStorage.user = data.user;
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
        $sessionStorage.user = data.user;
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

.controller('SearchController', function( $rootScope, $state, $scope, $http, $sessionStorage, $timeout ) {
  $http.defaults.headers.common['jwt'] = $sessionStorage.jwt;

  if (!$sessionStorage.user) {
    $state.go('landing');
  }

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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFjY291bnQuanMiLCJhcHAuanMiLCJmaW5kQW5kRWRpdC5qcyIsImhvbWUuanMiLCJsYW5kaW5nLmpzIiwic2VhcmNoLmpzIiwibWFpbkhlYWRlci5qcyIsInNob3dQZGZNb2RhbC5qcyIsIkZpbmRJbWFnZVNlcnZpY2UuanMiLCJGb2N1c1NlcnZpY2UuanMiLCJNb2RhbFNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3BRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDclFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZmluYWxzSGVscEFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbImFuZ3VsYXIubW9kdWxlKCdmaC5hY2NvdW50JywgW1xuICAnbmdTdG9yYWdlJ1xuXSlcblxuLmNvbmZpZyhmdW5jdGlvbiAoICRzdGF0ZVByb3ZpZGVyICkge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWNjb3VudCcsIHtcbiAgICB1cmw6ICcvYWNjb3VudCcsXG4gICAgdmlld3M6IHtcbiAgICAgIG1haW46IHtcbiAgICAgICAgY29udHJvbGxlcjogJ0FjY291bnRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhY2NvdW50L2FjY291bnQudHBsLmh0bWwnXG4gICAgICB9XG4gICAgfVxuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdBY2NvdW50Q29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlLCAgJGJhc2U2NCwgJGh0dHAsICRzZXNzaW9uU3RvcmFnZSkge1xuICB2YXIgVVNFUlNfVVJMID0gJy9hcGkvdXNlcnMnO1xuICAkc2NvcGUuZm9ybURhdGEgPSB7fTtcbiAgaWYgKCRzZXNzaW9uU3RvcmFnZS51c2VyKSB7XG4gICAgJHNjb3BlLnVzZXIgPSAkc2Vzc2lvblN0b3JhZ2UudXNlcjtcbiAgfSBlbHNlIHtcbiAgICAkc3RhdGUuZ28oJ2xhbmRpbmcnKTtcbiAgfVxuICAgIFxuXG4gICRzY29wZS5hdXRoQ2hlY2sgPSBmdW5jdGlvbihvbGRQYXNzd29yZCkge1xuICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRob3JpemF0aW9uJ10gPSBcbiAgICAgICdCYXNpYyAnICsgXG4gICAgICAkYmFzZTY0LmVuY29kZSgkc2Vzc2lvblN0b3JhZ2UudXNlci5iYXNpYy5lbWFpbCArIFxuICAgICAgJzonICsgXG4gICAgICBvbGRQYXNzd29yZCk7XG4gICAgXG4gICAgJGh0dHAuZ2V0KFVTRVJTX1VSTClcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgJHNlc3Npb25TdG9yYWdlLmp3dCA9IGRhdGEuand0O1xuICAgICAgICAkc2Vzc2lvblN0b3JhZ2UudXNlciA9IGRhdGEudXNlcjtcbiAgICAgICAgJHNjb3BlLmF1dGhTdWNjZXNzID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZVBhc3N3b3JkRXJyb3IgPSBudWxsO1xuICAgICAgfSlcbiAgICAgIC5lcnJvcihmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgJHNjb3BlLnVwZGF0ZVBhc3N3b3JkRXJyb3IgPSBlcnI7XG4gICAgICAgICRzY29wZS5hdXRoU3VjY2VzcyA9IGZhbHNlO1xuICAgICAgfSk7XG4gIH1cblxuICAkc2NvcGUudXBkYXRlUGFzc3dvcmQgPSBmdW5jdGlvbiggbmV3UGFzc3dvcmQsIG5ld1Bhc3N3b3JkQ29uZmlybSApIHtcbiAgICBpZiAoIW5ld1Bhc3N3b3JkIHx8XG4gICAgICAgICFuZXdQYXNzd29yZENvbmZpcm0pIHtcbiAgICAgICRzY29wZS51cGRhdGVQYXNzd29yZEVycm9yID0gJ1BsZWFzZSBjb21wbGV0ZSB0aGUgZm9ybSBiZWZvcmUgc3VibWl0dGluZyc7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKG5ld1Bhc3N3b3JkICE9PSBuZXdQYXNzd29yZENvbmZpcm0pIHtcbiAgICAgICRzY29wZS51cGRhdGVQYXNzd29yZEVycm9yID0gJ1Bhc3N3b3JkIG11c3QgbWF0Y2gnO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICB1cmw6IFVTRVJTX1VSTCArICcvcGFzc3dvcmQnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnand0JzogJHNlc3Npb25TdG9yYWdlLmp3dFxuICAgICAgfSxcbiAgICAgIGRhdGE6IHtuZXdQYXNzd29yZDogbmV3UGFzc3dvcmR9XG4gICAgfSlcbiAgICAuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICBjb25zb2xlLmRpcihkYXRhKTtcbiAgICAgICRzZXNzaW9uU3RvcmFnZS5qd3QgPSBkYXRhLmp3dDtcbiAgICAgICRzY29wZS51cGRhdGVQYXNzd29yZEVycm9yID0gbnVsbDtcbiAgICAgICRzY29wZS51cGRhdGVQYXNzd29yZFN1Y2Nlc3MgPSAnUGFzc3dvcmQgY2hhbmdlZCEnO1xuICAgICAgJHNjb3BlLnBhc3N3b3JkcyA9IHt9O1xuICAgIH0pXG4gICAgLmVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgJHNjb3BlLnVwZGF0ZVBhc3N3b3JkRXJyb3IgPSBlcnI7XG4gICAgICAkc2NvcGUucGFzc3dvcmRzID0ge307XG4gICAgfSk7XG4gIH07XG5cblxuICAkc2NvcGUuZWRpdFBhc3N3b3JkRW5hYmxlZCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghJHNjb3BlLm9sZFBhc3N3b3JkKSByZXR1cm4gJ2Rpc2FibGVkJztcbiAgICBlbHNlIHJldHVybiAnJztcbiAgfTtcbn0pOyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xufSkoKTtcblxuYW5ndWxhci5tb2R1bGUoJ2ZoJywgW1xuICAgICduZ1N0b3JhZ2UnLFxuICAgICd1aS5yb3V0ZXInLFxuICAgICd1aS5ib290c3RyYXAnLFxuICAgICd1aS5ib290c3RyYXAuc2hvd0Vycm9ycycsXG4gICAgJ3VpLnV0aWxzJyxcbiAgICAncmVzdGFuZ3VsYXInLFxuICAgICd0ZW1wbGF0ZXMtYXBwJyxcbiAgICAndGVtcGxhdGVzLWNvbXBvbmVudHMnLFxuICAgICdBcHBsaWNhdGlvbkNvbmZpZ3VyYXRpb24nLFxuICAgICdmaC5sYW5kaW5nJyxcbiAgICAnZmguaG9tZScsXG4gICAgJ2ZoLmFjY291bnQnLFxuICAgICdmaC5zZWFyY2gnLFxuICAgICdmaC5maW5kQW5kRWRpdCcsXG4gICAgJ2ZoLmRpcmVjdGl2ZXMubWFpbkhlYWRlcicsXG4gICAgJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzLnNob3dQZGZNb2RhbCcsXG4gICAgLy8gJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzJyxcbiAgICAnZmguc2VydmljZXMuRm9jdXNTZXJ2aWNlJyxcbiAgICAndmVuZG9yLnN0ZWVsVG9lJyxcbiAgICAnYmFzZTY0JyxcbiAgICAnYW5ndWxhci1tb21lbnRqcydcbl0pXG5cbiAgICAuY29uZmlnKGZ1bmN0aW9uKCR1cmxSb3V0ZXJQcm92aWRlciwgUmVzdGFuZ3VsYXJQcm92aWRlciwgQ29uZmlndXJhdGlvbiwgJHVpVmlld1Njcm9sbFByb3ZpZGVyLCAkaHR0cFByb3ZpZGVyKSB7XG5cbiAgICAgICAgUmVzdGFuZ3VsYXJQcm92aWRlci5zZXRCYXNlVXJsKCcvYXBpJyk7XG4gICAgICAgIFJlc3Rhbmd1bGFyUHJvdmlkZXIuc2V0RGVmYXVsdEh0dHBGaWVsZHMoe1xuICAgICAgICAgICAgd2l0aENyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICAgICAgdGltZW91dDogQ29uZmlndXJhdGlvbi50aW1lb3V0SW5NaWxsaXMsXG4gICAgICAgICAgICBjYWNoZTogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIud2hlbignJywgJy9sYW5kaW5nJykub3RoZXJ3aXNlKCcvbGFuZGluZycpO1xuXG4gICAgICAgIC8vIHNjcm9sbHMgdG8gdG9wIG9mIHBhZ2Ugb24gc3RhdGUgY2hhbmdlXG4gICAgICAgICR1aVZpZXdTY3JvbGxQcm92aWRlci51c2VBbmNob3JTY3JvbGwoKTtcblxuICAgIH0pXG4gICAgLnJ1bihmdW5jdGlvbigkcm9vdFNjb3BlLCBcbiAgICAgICAgQ29uZmlndXJhdGlvbiwgXG4gICAgICAgICRzdGF0ZSwgXG4gICAgICAgICRzZXNzaW9uU3RvcmFnZSkge1xuXG4gICAgICAgICRyb290U2NvcGUuYXBwTmFtZSA9IENvbmZpZ3VyYXRpb24uYXBwTmFtZTtcbiAgICAgICAgJHJvb3RTY29wZS5jb21wYW55Q29kZSA9IENvbmZpZ3VyYXRpb24uY29tcGFueUNvZGU7XG5cblxuICAgICAgICAkc3RhdGUuZ28oJ2xhbmRpbmcnKTtcblxuICAgICAgICAvL2F1dGggY2hlY2sgZXZlcnkgdGltZSB0aGUgc3RhdGUvcGFnZSBjaGFuZ2VzXG4gICAgICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKSB7XG4gICAgICAgICAgICAvLyAkcm9vdFNjb3BlLnN0YXRlQ2hhbmdlQXV0aENoZWNrKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKTtcbiAgICAgICAgfSk7XG5cblxuICAgICAgICAvL0VWRU5UIEJBTktcbiAgICAgICAgLypcbiAgICAgICAgJHJvb3RTY29wZS4kb24oJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLCBmdW5jdGlvbihldmVudCwgYXJncykge1xuICAgICAgICB9KTsqL1xuXG5cblxuICAgIH0pXG5cbiAgICAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5maW5kQW5kRWRpdCcsIFtcbiAgJ3VpLnNlbGVjdCcsXG4gICduZ1N0b3JhZ2UnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIGhvbWVDb25maWcoICRzdGF0ZVByb3ZpZGVyICkge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnZmluZEFuZEVkaXQnLCB7XG4gICAgdXJsOiAnL2ZpbmRBbmRFZGl0JyxcbiAgICB2aWV3czoge1xuICAgICAgbWFpbjoge1xuICAgICAgICBjb250cm9sbGVyOiAnRmluZEFuZEVkaXRDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdmaW5kQW5kRWRpdC9maW5kQW5kRWRpdC50cGwuaHRtbCdcbiAgICAgIH1cbiAgICB9LFxuICAgIHBhZ2VUaXRsZTogJ0ZpbmQgQW5kIEVkaXQnLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsbENsYXNzZXM6IGZ1bmN0aW9uKCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlICkge1xuICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgdXJsOiAnYXBpL2NsYXNzZXMvYWxsJyxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBqd3Q6ICRzZXNzaW9uU3RvcmFnZS5qd3RcbiAgICAgICAgICB9XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKCByZXMgKSB7XG4gICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignRmluZEFuZEVkaXRDb250cm9sbGVyJywgZnVuY3Rpb24oICRzY29wZSwgJGh0dHAsICRzZXNzaW9uU3RvcmFnZSwgYWxsQ2xhc3NlcywgJHRpbWVvdXQgKSB7XG4gIHZhciBQQVBFUlNfVVJMICAgICAgICAgICAgICAgICAgICAgICA9ICcvYXBpL3BhcGVycyc7XG4gICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydqd3QnXSA9ICRzZXNzaW9uU3RvcmFnZS5qd3Q7XG4gICRzY29wZS5xdWVyeSAgICAgICAgICAgICAgICAgICAgICAgICA9IHt9O1xuICAkc2NvcGUuZWRpdERhdGEgICAgICAgICAgICAgICAgICAgICAgPSB7fTtcbiAgJHNjb3BlLmFsbENsYXNzZXMgICAgICAgICAgICAgICAgICAgID0gYWxsQ2xhc3NlcztcblxuICAkc2NvcGUuc2Vhc29ucyA9IFtcbiAgICB7bmFtZTogJ1NwcmluZycsIGNvZGU6IFwiU1BcIn0sXG4gICAge25hbWU6ICdTdW1tZXInLCBjb2RlOiBcIlNVXCJ9LFxuICAgIHtuYW1lOiAnRmFsbCcsIGNvZGU6IFwiRkFcIn0sXG4gICAge25hbWU6ICdXaW50ZXInLCBjb2RlOiBcIldJXCJ9XG4gIF07XG4gICRzY29wZS55ZWFycyA9IFtcbiAgICB7bmFtZTogJzk1JywgY29kZTogJzk1J30sXG4gICAge25hbWU6ICc5NicsIGNvZGU6ICc5Nid9LFxuICAgIHtuYW1lOiAnOTcnLCBjb2RlOiAnOTcnfSxcbiAgICB7bmFtZTogJzk4JywgY29kZTogJzk4J30sXG4gICAge25hbWU6ICc5OScsIGNvZGU6ICc5OSd9LFxuICAgIHtuYW1lOiAnMDAnLCBjb2RlOiAnMDAnfSxcbiAgICB7bmFtZTogJzAxJywgY29kZTogJzAxJ30sXG4gICAge25hbWU6ICcwMicsIGNvZGU6ICcwMid9LFxuICAgIHtuYW1lOiAnMDMnLCBjb2RlOiAnMDMnfSxcbiAgICB7bmFtZTogJzA0JywgY29kZTogJzA0J30sXG4gICAge25hbWU6ICcwNScsIGNvZGU6ICcwNSd9LFxuICAgIHtuYW1lOiAnMDYnLCBjb2RlOiAnMDYnfSxcbiAgICB7bmFtZTogJzA3JywgY29kZTogJzA3J30sXG4gICAge25hbWU6ICcwOCcsIGNvZGU6ICcwOCd9LFxuICAgIHtuYW1lOiAnMDknLCBjb2RlOiAnMDknfSxcbiAgICB7bmFtZTogJzEwJywgY29kZTogJzEwJ30sXG4gICAge25hbWU6ICcxMScsIGNvZGU6ICcxMSd9LFxuICAgIHtuYW1lOiAnMTInLCBjb2RlOiAnMTInfSxcbiAgICB7bmFtZTogJzEzJywgY29kZTogJzEzJ30sXG4gICAge25hbWU6ICcxNCcsIGNvZGU6ICcxNCd9LFxuICAgIHtuYW1lOiAnMTUnLCBjb2RlOiAnMTUnfVxuICBdO1xuICAkc2NvcGUudHlwZXMgPSBbXG4gICAge25hbWU6ICdIb21ld29yaycsIGNvZGU6ICdIJ30sXG4gICAge25hbWU6ICdNaWR0ZXJtJywgY29kZTogJ00nfSxcbiAgICB7bmFtZTogJ05vdGVzJywgY29kZTogJ04nfSxcbiAgICB7bmFtZTogJ1F1aXonLCBjb2RlOiAnUSd9LFxuICAgIHtuYW1lOiAnRmluYWwnLCBjb2RlOiAnRid9LFxuICAgIHtuYW1lOiAnTGFiJywgY29kZTogJ0wnfVxuICBdO1xuXG4gICRzY29wZS5maW5kQ2xhc3NlcyA9IGZ1bmN0aW9uKCBxdWVyeSApIHtcbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgdXJsOiBQQVBFUlNfVVJMICsgJy9jbGFzc0FuZFR5cGUvY2xhc3MvJyArIHF1ZXJ5LmNsYXNzSWQgLy8rICcvdHlwZS8nICsgcXVlcnkudHlwZUNvZGVcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAkc2NvcGUucGFwZXJzID0gcmVzLmRhdGE7XG4gICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgICB9KTtcbiAgfTtcblxuICAkc2NvcGUuJHdhdGNoKCdwYXBlcnMnLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoICEkc2NvcGUucGFwZXJzICkgcmV0dXJuO1xuICAgIFxuICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgZm9yICggdmFyIGkgPSAwOyBpIDwgJHNjb3BlLnBhcGVycy5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgcmVuZGVyUGRmKCAkc2NvcGUucGFwZXJzWyBpIF0gKTtcbiAgICAgIH1cbiAgICB9LCAxMDApO1xuICB9KTtcblxuICBmdW5jdGlvbiByZW5kZXJQZGYoIHBhcGVyICkge1xuICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCggcGFwZXIuX2lkICk7XG4gICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIGlmICggcGFwZXIgKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggcGFwZXIuaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24oIHBhZ2UgKSB7XG5cbiAgICAgICAgICB2YXIgc2NhbGUgPSAuNDtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfVxuXG4gICRzY29wZS5zaG93RWRpdFBhbmVsID0gZnVuY3Rpb24oaWQpIHtcbiAgICAkc2NvcGVbICdvcGVuRWRpdFBhbmVsLScgKyBpZCBdID0gISRzY29wZVsgJ29wZW5FZGl0UGFuZWwtJyArIGlkIF07XG4gIH07XG5cbiAgJHNjb3BlLmlzRWRpdFBhbmVsT3BlbiA9IGZ1bmN0aW9uKGlkKSB7XG4gICAgcmV0dXJuICEhJHNjb3BlWyAnb3BlbkVkaXRQYW5lbC0nICsgaWQgXTtcbiAgfTtcblxuICAkc2NvcGUuc3VibWl0RWRpdGVkUGFwZXIgPSBmdW5jdGlvbiggcGFwZXIsIG5ld0RhdGEgKSB7XG4gICAgcHV0T2JqID0ge1xuICAgICAgdGl0bGU6IG5ld0RhdGEudGl0bGUsXG4gICAgICBwZXJpb2Q6IG5ld0RhdGEuc2Vhc29uICsgbmV3RGF0YS55ZWFyLFxuICAgICAgdHlwZTogbmV3RGF0YS50eXBlLFxuICAgICAgY2xhc3NJZDogbmV3RGF0YS5jbGFzc0lkXG4gICAgfTtcblxuICAgIHBhcGVyLnN1Y2Nlc3MgPSAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgdXJsOiAnYXBpL3BhcGVycy9zaW5nbGUvJyArIHBhcGVyLl9pZCxcbiAgICAgIGRhdGE6IHB1dE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgIGNvbnNvbGUubG9nKCByZXMgKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmVycm9yICggZXJyICk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG4gIH07XG5cblxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmhvbWUnLCBbXG4gICd1aS5zZWxlY3QnLFxuICAnbmdTdG9yYWdlJyxcbiAgJ25nRmlsZVVwbG9hZCcsXG4gICdmaC5zZXJ2aWNlcy5Gb2N1c1NlcnZpY2UnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIGhvbWVDb25maWcoJHN0YXRlUHJvdmlkZXIpIHtcbiAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgdXJsOiAnL2hvbWUnLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnaG9tZS9ob21lLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnSG9tZScsXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxsQ2xhc3NlczogZnVuY3Rpb24oICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UgKSB7XG4gICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICB1cmw6ICdhcGkvY2xhc3Nlcy9hbGwnLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgIGp3dDogJHNlc3Npb25TdG9yYWdlLmp3dFxuICAgICAgICAgIH1cbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gdG9rZW5zOiBmdW5jdGlvbiggJGh0dHAgKSB7XG4gICAgICAvLyAgIHJldHVybiAkaHR0cCh7XG4gICAgICAvLyAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIC8vICAgICB1cmw6ICdhc3NldHMvdG9rZW5zLmpzb24nXG4gICAgICAvLyAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgIC8vICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAvLyAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICAvLyAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgIC8vICAgfSk7XG4gICAgICAvLyB9XG4gICAgfVxuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdIb21lQ29udHJvbGxlcicsIGZ1bmN0aW9uKCAkc2NvcGUsICRodHRwLCAkc2Vzc2lvblN0b3JhZ2UsICR0aW1lb3V0LCBnaXZlRm9jdXMsIFVwbG9hZCwgYWxsQ2xhc3NlcyApIHtcbiAgdmFyIFBBUEVSU19VUkwgPSAnL2FwaS9wYXBlcnMnO1xuICAkaHR0cC5kZWZhdWx0cy5oZWFkZXJzLmNvbW1vblsnand0J10gPSAkc2Vzc2lvblN0b3JhZ2Uuand0O1xuICAkc2NvcGUuYWxsQ2xhc3NlcyA9IGFsbENsYXNzZXM7XG5cbiAgJHNjb3BlLiR3YXRjaCgnZmlsZXMnLCBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUudXBsb2FkKCAkc2NvcGUuZmlsZXMgKTtcbiAgfSk7XG5cbiAgJHNjb3BlLiR3YXRjaCgnZmlsZScsIGZ1bmN0aW9uKCkge1xuICAgIGlmICgkc2NvcGUuZmlsZSAhPSBudWxsKSB7XG4gICAgICAkc2NvcGUudXBsb2FkKFskc2NvcGUuZmlsZV0pO1xuICAgIH1cbiAgfSk7XG5cbiAgJHNjb3BlLmxvZyAgICAgICAgICA9ICcnO1xuICAkc2NvcGUucGFwZXJzVG9FZGl0ID0gW107XG4gICRzY29wZS5lZGl0RGF0YSAgICAgPSB7fTtcblxuICAkc2NvcGUuc2Vhc29ucyA9IFtcbiAgICB7bmFtZTogJ1NwcmluZycsIGNvZGU6IFwiU1BcIn0sXG4gICAge25hbWU6ICdTdW1tZXInLCBjb2RlOiBcIlNVXCJ9LFxuICAgIHtuYW1lOiAnRmFsbCcsIGNvZGU6IFwiRkFcIn0sXG4gICAge25hbWU6ICdXaW50ZXInLCBjb2RlOiBcIldJXCJ9XG4gIF07XG4gICRzY29wZS55ZWFycyA9IFtcbiAgICB7bmFtZTogJzk1JywgY29kZTogJzk1J30sXG4gICAge25hbWU6ICc5NicsIGNvZGU6ICc5Nid9LFxuICAgIHtuYW1lOiAnOTcnLCBjb2RlOiAnOTcnfSxcbiAgICB7bmFtZTogJzk4JywgY29kZTogJzk4J30sXG4gICAge25hbWU6ICc5OScsIGNvZGU6ICc5OSd9LFxuICAgIHtuYW1lOiAnMDAnLCBjb2RlOiAnMDAnfSxcbiAgICB7bmFtZTogJzAxJywgY29kZTogJzAxJ30sXG4gICAge25hbWU6ICcwMicsIGNvZGU6ICcwMid9LFxuICAgIHtuYW1lOiAnMDMnLCBjb2RlOiAnMDMnfSxcbiAgICB7bmFtZTogJzA0JywgY29kZTogJzA0J30sXG4gICAge25hbWU6ICcwNScsIGNvZGU6ICcwNSd9LFxuICAgIHtuYW1lOiAnMDYnLCBjb2RlOiAnMDYnfSxcbiAgICB7bmFtZTogJzA3JywgY29kZTogJzA3J30sXG4gICAge25hbWU6ICcwOCcsIGNvZGU6ICcwOCd9LFxuICAgIHtuYW1lOiAnMDknLCBjb2RlOiAnMDknfSxcbiAgICB7bmFtZTogJzEwJywgY29kZTogJzEwJ30sXG4gICAge25hbWU6ICcxMScsIGNvZGU6ICcxMSd9LFxuICAgIHtuYW1lOiAnMTInLCBjb2RlOiAnMTInfSxcbiAgICB7bmFtZTogJzEzJywgY29kZTogJzEzJ30sXG4gICAge25hbWU6ICcxNCcsIGNvZGU6ICcxNCd9LFxuICAgIHtuYW1lOiAnMTUnLCBjb2RlOiAnMTUnfVxuICBdO1xuICAkc2NvcGUudHlwZXMgPSBbXG4gICAge25hbWU6ICdIb21ld29yaycsIGNvZGU6ICdIJ30sXG4gICAge25hbWU6ICdNaWR0ZXJtJywgY29kZTogJ00nfSxcbiAgICB7bmFtZTogJ05vdGVzJywgY29kZTogJ04nfSxcbiAgICB7bmFtZTogJ1F1aXonLCBjb2RlOiAnUSd9LFxuICAgIHtuYW1lOiAnRmluYWwnLCBjb2RlOiAnRid9LFxuICAgIHtuYW1lOiAnTGFiJywgY29kZTogJ0wnfVxuICBdO1xuXG4gICRzY29wZS51cGxvYWQgPSBmdW5jdGlvbiggZmlsZXMgKSB7XG4gICAgaWYgKGZpbGVzICYmIGZpbGVzLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBmaWxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgZmlsZSA9IGZpbGVzW2ldO1xuXG4gICAgICAgIFVwbG9hZC51cGxvYWQoe1xuICAgICAgICAgIHVybDogUEFQRVJTX1VSTCxcbiAgICAgICAgICBmaWxlOiBmaWxlXG4gICAgICAgIH0pXG5cbiAgICAgICAgLnByb2dyZXNzKGZ1bmN0aW9uICggZXZ0ICkge1xuICAgICAgICAgIHZhciBwcm9ncmVzc1BlcmNlbnRhZ2UgPSBwYXJzZUludCgxMDAuMCAqIGV2dC5sb2FkZWQgLyBldnQudG90YWwpO1xuICAgICAgICAgICRzY29wZS5sb2cgPSAncHJvZ3Jlc3M6ICcgKyBcbiAgICAgICAgICAgIHByb2dyZXNzUGVyY2VudGFnZSArIFxuICAgICAgICAgICAgJyUnICsgXG4gICAgICAgICAgICBldnQuY29uZmlnLmZpbGUubmFtZSArIFxuICAgICAgICAgICAgJ1xcbicgKyBcbiAgICAgICAgICAgICRzY29wZS5sb2c7XG4gICAgICAgIH0pXG5cbiAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oIGRhdGEsIHN0YXR1cywgaGVhZGVycywgY29uZmlnICkge1xuICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAkc2NvcGUubG9nID0gJ2ZpbGU6ICcgKyBcbiAgICAgICAgICAgICAgY29uZmlnLmZpbGUubmFtZSArIFxuICAgICAgICAgICAgICAnLCBSZXNwb25zZTogJyArIFxuICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSggZGF0YS50aXRsZSApICsgXG4gICAgICAgICAgICAgICcsIElEOiAnICtcbiAgICAgICAgICAgICAgZGF0YS5faWRcbiAgICAgICAgICAgICAgJ1xcbicgKyBcbiAgICAgICAgICAgICAgJHNjb3BlLmxvZztcblxuICAgICAgICAgICAgJHNjb3BlLnBhcGVyc1RvRWRpdC5wdXNoKHtcbiAgICAgICAgICAgICAgX2lkOiBkYXRhLl9pZCxcbiAgICAgICAgICAgICAgdGl0bGU6IGRhdGEudGl0bGUsXG4gICAgICAgICAgICAgIHVzZXJJZDogZGF0YS51c2VySWRcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBnaXZlRm9jdXMoJ3NlYXNvbi1waWNrZXInKTtcblxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgJHNjb3BlLnN1Ym1pdEVkaXRlZFBhcGVyID0gZnVuY3Rpb24oIHBhcGVyLCBuZXdEYXRhICkge1xuICAgIHB1dE9iaiA9IHtcbiAgICAgIHRpdGxlOiBuZXdEYXRhLnRpdGxlLFxuICAgICAgcGVyaW9kOiBuZXdEYXRhLnNlYXNvbiArIG5ld0RhdGEueWVhcixcbiAgICAgIHR5cGU6IG5ld0RhdGEudHlwZSxcbiAgICAgIGNsYXNzSWQ6IG5ld0RhdGEuY2xhc3NJZFxuICAgIH07XG5cbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgdXJsOiAnYXBpL3BhcGVycy9zaW5nbGUvJyArIHBhcGVyLl9pZCxcbiAgICAgIGRhdGE6IHB1dE9ialxuICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgICAgIGNvbnNvbGUubG9nKCByZXMgKTtcbiAgICAgICRzY29wZS5wYXBlclRvRWRpdEJhY2tTdG9yZSA9ICRzY29wZS5wYXBlcnNUb0VkaXQuc2hpZnQoKTtcbiAgICB9LCBmdW5jdGlvbiggZXJyICkge1xuICAgICAgY29uc29sZS5lcnJvciAoIGVyciApO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIHJlLXJlbmRlcnMgdGhlIG1haW4gY2FudmFzIHVwb24gY2hhbmdlXG4gIC8vICRzY29wZS4kd2F0Y2goJ3BhcGVyc1RvRWRpdFswXScsIGZ1bmN0aW9uKCkge1xuICAvLyAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWFpbi12aWV3ZXInKTtcbiAgLy8gICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgLy8gaWYgKCAkc2NvcGUucGFwZXJzVG9FZGl0WzBdICkge1xuICAgIC8vICAgUERGSlMuZ2V0RG9jdW1lbnQoICRzY29wZS5wYXBlcnNUb0VkaXRbMF0uaW1nLmRhdGEgKS50aGVuKGZ1bmN0aW9uKCBwZGYgKSB7XG4gICAgLy8gICAgIHBkZi5nZXRQYWdlKDEpLnRoZW4oZnVuY3Rpb24ocGFnZSkge1xuXG4gICAgLy8gICAgICAgdmFyIHNjYWxlID0gMC44O1xuICAgIC8vICAgICAgIHZhciB2aWV3cG9ydCA9IHBhZ2UuZ2V0Vmlld3BvcnQoc2NhbGUpO1xuXG4gICAgLy8gICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAvLyAgICAgICBjYW52YXMud2lkdGggPSB2aWV3cG9ydC53aWR0aDtcblxuICAgIC8vICAgICAgIHZhciByZW5kZXJDb250ZXh0ID0ge1xuICAgIC8vICAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAvLyAgICAgICAgIHZpZXdwb3J0OiB2aWV3cG9ydFxuICAgIC8vICAgICAgIH07XG4gICAgLy8gICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgLy8gICAgIH0pO1xuICAgIC8vICAgfSk7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgLy8gfVxuICAvLyB9KTtcblxuICAvLyByZS1yZW5kZXJzIHRoZSBzZWNvbmRhcnkgY2FudmFzIHVwb24gY2hhbmdlXG4gIC8vICRzY29wZS4kd2F0Y2goJ3BhcGVyc1RvRWRpdFsxXScsIGZ1bmN0aW9uKCkge1xuICAvLyAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbmV4dC11cC1wZGYtY29udGFpbmVyJyk7XG4gIC8vICAgdmFyIGNvbnRleHQgPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgIC8vIGlmICggJHNjb3BlLnBhcGVyc1RvRWRpdFsxXSApIHtcbiAgICAvLyAgIFBERkpTLmdldERvY3VtZW50KCAkc2NvcGUucGFwZXJzVG9FZGl0WzFdLmltZy5kYXRhICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgIC8vICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKHBhZ2UpIHtcblxuICAgIC8vICAgICAgIHZhciBzY2FsZSA9IDAuMjtcbiAgICAvLyAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgIC8vICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgLy8gICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAvLyAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAvLyAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgLy8gICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAvLyAgICAgICB9O1xuICAgIC8vICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgIC8vICAgICB9KTtcbiAgICAvLyAgIH0pO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIC8vIH1cbiAgLy8gfSk7XG5cbiAgJHNjb3BlLmFkZENsYXNzID0gZnVuY3Rpb24oIG5ld0NsYXNzICkge1xuICAgIHZhciBwb3N0T2JqID0ge3RpdGxlOiBuZXdDbGFzc307XG5cbiAgICAkaHR0cCh7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIHVybDogJy9hcGkvY2xhc3NlcycsXG4gICAgICBkYXRhOiBwb3N0T2JqXG4gICAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuXG4gICAgICAkaHR0cCh7XG4gICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgIHVybDogJy9hcGkvY2xhc3Nlcy9hbGwnXG4gICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXMgKSB7XG4gICAgICAgICRzY29wZS5hbGxDbGFzc2VzID0gcmVzLmRhdGE7XG4gICAgICB9KTtcblxuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgLy8gJHNjb3BlLmFkZFRva2VucyA9IGZ1bmN0aW9uKCkge1xuICAvLyAgICRzY29wZS50b2tlbnMuZm9yRWFjaCggZnVuY3Rpb24oIHRva2VuLCBpbmRleCwgYXJyYXkpIHtcbiAgLy8gICAgICRodHRwKHtcbiAgLy8gICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gIC8vICAgICAgIHVybDogJy9hcGkvbWFrZVRva2VuJyxcbiAgLy8gICAgICAgZGF0YTogdG9rZW5cbiAgLy8gICAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgLy8gICAgICAgY29uc29sZS5sb2coJ3llcycpO1xuICAvLyAgICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgLy8gICAgICAgY29uc29sZS5sb2coJ0ZGRkZGRkZGRkZVVVVVVScsIGVycik7XG4gIC8vICAgICB9KTtcbiAgLy8gICB9KTtcbiAgLy8gfTtcblxuXG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdmaC5sYW5kaW5nJyxbXG4gICduZ1N0b3JhZ2UnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uICggJHN0YXRlUHJvdmlkZXIgKSB7XG4gICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsYW5kaW5nJywge1xuICAgIHVybDogJy8nLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdMYW5kaW5nQ29udHJvbGxlcicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnbGFuZGluZy9sYW5kaW5nLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59KVxuXG4uY29udHJvbGxlcignTGFuZGluZ0NvbnRyb2xsZXInLCBmdW5jdGlvbiAoICRzY29wZSwgJHN0YXRlLCAkaHR0cCwgJGJhc2U2NCwgJHNlc3Npb25TdG9yYWdlKSB7XG4gIHZhciBVU0VSU19VUkwgPSAnL2FwaS91c2Vycyc7XG5cbiAgJHNjb3BlLnJlZ2lzdGVyID0gZnVuY3Rpb24oIGNyZWRlbnRpYWxzICkge1xuICAgIGlmICggIWNyZWRlbnRpYWxzLm5hbWUgfHxcbiAgICAgICAgICFjcmVkZW50aWFscy5lbWFpbCB8fFxuICAgICAgICAgIWNyZWRlbnRpYWxzLnBhc3N3b3JkIHx8XG4gICAgICAgICAhY3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtIHx8XG4gICAgICAgICAhY3JlZGVudGlhbHMuYWRkQ29kZSApIHtcbiAgICAgICRzY29wZS5yZWdpc3RyYXRpb25FcnJvciA9ICdQbGVhc2UgY29tcGxldGUgdGhlIGZvcm0gYmVmb3JlIHN1Ym1pdHRpbmcnO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBuZXdVc2VyID0ge1xuICAgICAgbmFtZTogY3JlZGVudGlhbHMubmFtZSxcbiAgICAgIHBob25lOiBjcmVkZW50aWFscy5waG9uZSxcbiAgICAgIGVtYWlsOiBjcmVkZW50aWFscy5lbWFpbCxcbiAgICAgIHBhc3N3b3JkOiBjcmVkZW50aWFscy5wYXNzd29yZCxcbiAgICAgIHBhc3N3b3JkQ29uZmlybTogY3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtLFxuICAgICAgdG9rZW46IGNyZWRlbnRpYWxzLmFkZENvZGVcbiAgICB9O1xuICAgICRodHRwKHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgdXJsOiBVU0VSU19VUkwsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0sXG4gICAgICBkYXRhOiBuZXdVc2VyXG4gICAgfSlcbiAgICAuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG4gICAgICBjb25zb2xlLmRpcihkYXRhKTtcbiAgICAgIC8vICRzY29wZS5yZWdpc3RlckNyZWRlbnRpYWxzID0ge307XG4gICAgICAvLyAkc2NvcGUucmVnaXN0ZXJTdWNjZXNzID0gdHJ1ZTtcbiAgICAgICRzZXNzaW9uU3RvcmFnZS5qd3QgPSBkYXRhLmp3dDtcbiAgICAgICRzZXNzaW9uU3RvcmFnZS51c2VyID0gZGF0YS51c2VyO1xuICAgICAgJHN0YXRlLmdvKCdzZWFyY2gnKTtcbiAgICB9KVxuICAgIC5lcnJvcihmdW5jdGlvbihlcnIpIHtcbiAgICAgICRzY29wZS5yZWdpc3RyYXRpb25FcnJvciA9IGVycjtcbiAgICAgIGNvbnNvbGUuZGlyKGVycik7XG4gICAgICAkc2NvcGUucmVnaXN0ZXJDcmVkZW50aWFscy5wYXNzd29yZCA9ICcnO1xuICAgICAgJHNjb3BlLnJlZ2lzdGVyQ3JlZGVudGlhbHMucGFzc3dvcmRDb25maXJtID0gJyc7XG4gICAgfSk7XG4gIH07XG5cbiAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcblxuICAgICRodHRwLmRlZmF1bHRzLmhlYWRlcnMuY29tbW9uWydBdXRob3JpemF0aW9uJ10gPSBcbiAgICAgICdCYXNpYyAnICsgXG4gICAgICAkYmFzZTY0LmVuY29kZShjcmVkZW50aWFscy5lbWFpbCArIFxuICAgICAgJzonICsgXG4gICAgICBjcmVkZW50aWFscy5wYXNzd29yZCk7XG4gICAgXG4gICAgJGh0dHAuZ2V0KFVTRVJTX1VSTClcbiAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY29uc29sZS5kaXIoZGF0YSk7XG4gICAgICAgICRzZXNzaW9uU3RvcmFnZS5qd3QgPSBkYXRhLmp3dDtcbiAgICAgICAgJHNlc3Npb25TdG9yYWdlLnVzZXIgPSBkYXRhLnVzZXI7XG4gICAgICAgICRzdGF0ZS5nbygnc2VhcmNoJyk7XG4gICAgICB9KVxuICAgICAgLmVycm9yKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAkc2NvcGUubG9naW5FcnJvciA9IGVycjtcbiAgICAgICAgY29uc29sZS5kaXIoZXJyKTtcbiAgICAgIH0pO1xuICB9O1xuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnZmguc2VhcmNoJywgW1xuICAndWkuc2VsZWN0JyxcbiAgJ2NnQnVzeScsXG4gICduZ1N0b3JhZ2UnLFxuICAnc21hcnQtdGFibGUnXG5dKVxuXG4uY29uZmlnKGZ1bmN0aW9uIHNlYXJjaENvbmZpZygkc3RhdGVQcm92aWRlcikge1xuICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2VhcmNoJywge1xuICAgIHVybDogJy9zZWFyY2gnLFxuICAgIHZpZXdzOiB7XG4gICAgICBtYWluOiB7XG4gICAgICAgIGNvbnRyb2xsZXI6ICdTZWFyY2hDb250cm9sbGVyJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdzZWFyY2gvc2VhcmNoLnRwbC5odG1sJ1xuICAgICAgfVxuICAgIH0sXG4gICAgcGFnZVRpdGxlOiAnU2VhcmNoJ1xuICB9KTtcbn0pXG5cbi5jb250cm9sbGVyKCdTZWFyY2hDb250cm9sbGVyJywgZnVuY3Rpb24oICRyb290U2NvcGUsICRzdGF0ZSwgJHNjb3BlLCAkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkdGltZW91dCApIHtcbiAgJGh0dHAuZGVmYXVsdHMuaGVhZGVycy5jb21tb25bJ2p3dCddID0gJHNlc3Npb25TdG9yYWdlLmp3dDtcblxuICBpZiAoISRzZXNzaW9uU3RvcmFnZS51c2VyKSB7XG4gICAgJHN0YXRlLmdvKCdsYW5kaW5nJyk7XG4gIH1cblxuICAkc2NvcGUucmV2ZXJzZSAgICA9IHRydWU7XG4gICRzY29wZS5wcmVkaWNhdGUgID0gJ3BlcmlvZCc7XG4gICRzY29wZS5yZW5kZXJlZCAgID0gZmFsc2U7XG4gICRzY29wZS5xdWVyeSAgICAgID0ge307XG4gIHZhciBQQVBFUlNfVVJMICAgID0gJy9hcGkvcGFwZXJzJztcbiAgJHNjb3BlLnNvcnRQZXJpb2QgPSB7XG4gICAgYWN0aXZlOiB0cnVlLFxuICAgIHJldmVyc2U6IHRydWVcbiAgfTtcbiAgJHNjb3BlLnNvcnRUeXBlICAgPSB7XG4gICAgYWN0aXZlOiBmYWxzZSxcbiAgICByZXZlcnNlOiBmYWxzZVxuICB9O1xuXG4gIHZhciBwYWdlO1xuXG4gICRodHRwKHtcbiAgICBtZXRob2Q6ICdHRVQnLFxuICAgIHVybDogJ2FwaS9jbGFzc2VzL2FsbCdcbiAgfSkudGhlbihmdW5jdGlvbiggcmVzICkge1xuICAgICRzY29wZS5hbGxDbGFzc2VzID0gcmVzLmRhdGE7XG4gIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgY29uc29sZS5sb2coZXJyKTtcbiAgfSk7XG5cbiAgJHNjb3BlLnRvZ2dsZVBlcmlvZFJldmVyc2UgPSBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUuc29ydFR5cGUuYWN0aXZlICAgID0gZmFsc2U7XG4gICAgJHNjb3BlLnNvcnRUeXBlLnJldmVyc2UgICA9IGZhbHNlO1xuICAgICRzY29wZS5zb3J0UGVyaW9kLmFjdGl2ZSAgPSB0cnVlO1xuICAgICRzY29wZS5zb3J0UGVyaW9kLnJldmVyc2UgPSAhJHNjb3BlLnNvcnRQZXJpb2QucmV2ZXJzZTtcbiAgfTtcblxuICAkc2NvcGUudG9nZ2xlVHlwZVJldmVyc2UgPSBmdW5jdGlvbigpIHtcbiAgICAkc2NvcGUuc29ydFBlcmlvZC5hY3RpdmUgID0gZmFsc2U7XG4gICAgLy8gXFwvXFwvXFwvIHNvcnRQZXJpb2QucmV2ZXJzZSBpcyByZXNldCB0byB0cnVlIGJlY2F1c2UgaXQncyBtb3JlIG5hdHVyYWwgdG8gc2VlIGxhcmdlciBkYXRlcyAobW9yZSByZWNlbnQpIGZpcnN0XG4gICAgJHNjb3BlLnNvcnRQZXJpb2QucmV2ZXJzZSA9IHRydWU7IFxuICAgICRzY29wZS5zb3J0VHlwZS5hY3RpdmUgICAgPSB0cnVlO1xuICAgICRzY29wZS5zb3J0VHlwZS5yZXZlcnNlICAgPSAhJHNjb3BlLnNvcnRUeXBlLnJldmVyc2U7XG4gIH07XG5cbiAgJHNjb3BlLmhvdmVySW5Pck91dCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuaG92ZXJFZGl0ID0gIXRoaXMuaG92ZXJFZGl0O1xuICB9O1xuXG4gICRzY29wZS5maW5kUGFwZXJzQnlDbGFzcyA9IGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgJHNjb3BlLmJ1c3lGaW5kaW5nUGFwZXJzID0gJGh0dHAoe1xuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIHVybDogUEFQRVJTX1VSTCArICcvY2xhc3MvJyArIHF1ZXJ5LmNsYXNzSWRcbiAgICB9KS50aGVuKGZ1bmN0aW9uKCByZXMgKSB7XG4gICAgICAkc2NvcGUucGFwZXJzID0gZGVzZXJpYWxpemVQYXBlcnMocmVzLmRhdGEpO1xuICAgIH0sIGZ1bmN0aW9uKCBlcnIgKSB7XG4gICAgICBjb25zb2xlLmxvZyggZXJyICk7XG4gICAgfSk7XG4gIH07XG5cbiAgZnVuY3Rpb24gZGVzZXJpYWxpemVQYXBlcnMocGFwZXJzKSB7XG4gICAgaWYgKCFwYXBlcnMpIHJldHVybjtcblxuICAgIHJldHVybiBwYXBlcnMubWFwKGZ1bmN0aW9uKHBhcGVyKSB7XG4gICAgICB2YXIgc2Vhc29uID0gcGFwZXIucGVyaW9kLnNsaWNlKDAsMik7XG4gICAgICB2YXIgeWVhciA9IHBhcGVyLnBlcmlvZC5zbGljZSgyLDQpO1xuICAgICAgdmFyIG1vbnRoO1xuXG4gICAgICAvLyBjb252ZXJ0IHNlYXNvbiBzdHJpbmcgaW50byBtb250aCBudW1iZXJcbiAgICAgIHN3aXRjaCAoc2Vhc29uKSB7XG4gICAgICAgIGNhc2UgJ1dJJzpcbiAgICAgICAgICBtb250aCA9IDA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1NQJzpcbiAgICAgICAgICBtb250aCA9IDM7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1NVJzpcbiAgICAgICAgICBtb250aCA9IDY7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ0ZBJzpcbiAgICAgICAgICBtb250aCA9IDk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIGNvbnZlcnQgeWVhciBzdHJpbmcgaW50byB5ZWFyIG51bWJlciAoZG91YmxlIGRpZ2l0cyBjb252ZXJ0IHRvIDE5MDAtMTk5OSwgbmVlZCA0IHllYXIgZm9yIGFmdGVyIDE5OTkpXG4gICAgICB5ZWFyID0gcGFyc2VJbnQoeWVhcik7XG5cbiAgICAgIGlmICh5ZWFyIDwgODApIHtcbiAgICAgICAgeWVhciArPSAyMDAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgeWVhciArPSAxOTAwO1xuICAgICAgfVxuXG4gICAgICBwYXBlci5wZXJpb2QgPSBuZXcgRGF0ZSh5ZWFyLCBtb250aCwgMSk7XG4gICAgICByZXR1cm4gcGFwZXI7XG4gICAgfSk7XG4gIH1cblxuICAvLyAkc2NvcGUuZmluZEltYWdlID0gZnVuY3Rpb24oIHBhcGVySWQgKSB7XG4gIC8vICAgJHNjb3BlLmJ1c3lGaW5kaW5nUGFwZXJJbWFnZSA9ICRodHRwKHtcbiAgLy8gICAgIG1ldGhvZDogJ0dFVCcsXG4gIC8vICAgICB1cmw6IFBBUEVSU19VUkwgKyAnL3NpbmdsZS8nICsgcGFwZXJJZFxuICAvLyAgIH0pLnRoZW4oZnVuY3Rpb24oIHJlcyApIHtcbiAgLy8gICAgICRzY29wZS5wYXBlclRvUmVuZGVyID0gcmVzLmRhdGE7XG4gIC8vICAgfSwgZnVuY3Rpb24oIGVyciApIHtcbiAgLy8gICAgIGNvbnNvbGUubG9nKCBlcnIgKTtcbiAgLy8gICB9KTtcbiAgLy8gfTtcblxuICBmdW5jdGlvbiByZW5kZXJQZGYoIHBhZ2UgKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnZGlzcGxheS1wYXBlcicgKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgJHNjb3BlLnBkZi5nZXRQYWdlKCBwYWdlICkudGhlbihmdW5jdGlvbiggcGFnZSApIHtcbiAgICAgIHZhciBzY2FsZSA9IDE7XG4gICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICB9O1xuICAgICAgcGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlclBkZkluaXRpYWwoIHBhcGVyICkge1xuICAgICRzY29wZS5yZW5kZXJlZCA9IHRydWU7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCAnZGlzcGxheS1wYXBlcicgKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgaWYgKCBwYXBlciApIHtcbiAgICAgIFBERkpTLmdldERvY3VtZW50KCBwYXBlci5pbWcuZGF0YSApLnRoZW4oZnVuY3Rpb24oIHBkZiApIHtcbiAgICAgICAgcGRmLmdldFBhZ2UoMSkudGhlbihmdW5jdGlvbiggcGFnZSApIHtcblxuICAgICAgICAgIHZhciBzY2FsZSA9IDE7XG4gICAgICAgICAgdmFyIHZpZXdwb3J0ID0gcGFnZS5nZXRWaWV3cG9ydChzY2FsZSk7XG5cbiAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gdmlld3BvcnQuaGVpZ2h0O1xuICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICAgICAgdmFyIHJlbmRlckNvbnRleHQgPSB7XG4gICAgICAgICAgICBjYW52YXNDb250ZXh0OiBjb250ZXh0LFxuICAgICAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICAgICAgfTtcbiAgICAgICAgICBwYWdlLnJlbmRlcihyZW5kZXJDb250ZXh0KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHNjb3BlLnBkZiA9IHBkZjtcbiAgICAgICAgcGFnZSA9IDE7XG5cbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ByZXZpb3VzLXBhZ2UnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIHBhZ2UgPiAxICkge1xuICAgICAgICAgICAgICBwYWdlLS07XG4gICAgICAgICAgICAgIHJlbmRlclBkZiggcGFnZSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHQtcGFnZScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyxcbiAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICggJHNjb3BlLnBkZi5udW1QYWdlcyA+IHBhZ2UgKSB7XG4gICAgICAgICAgICAgIHBhZ2UrKztcbiAgICAgICAgICAgICAgcmVuZGVyUGRmKCBwYWdlICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cblxuICAgIH0gZWxzZSB7XG4gICAgICBjb250ZXh0LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIH1cbiAgfVxuXG4gICRzY29wZS4kd2F0Y2goJ3BhcGVyVG9SZW5kZXInLCBmdW5jdGlvbigpIHtcbiAgICBpZiAoICEkc2NvcGUucGFwZXJUb1JlbmRlciApIHJldHVybjtcbiAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgIC8vIHJlbmRlclBkZkluaXRpYWwoICRzY29wZS5wYXBlciApO1xuICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KCdwZGYtcmVhZHktdG8tcmVuZGVyJyk7XG4gICAgfSwgMTAwKTtcbiAgfSk7XG5cbn0pXG5cbi5maWx0ZXIoJ3BlcmlvZEZpbHRlcicsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZnVuY3Rpb24oaW5wdXRQZXJpb2QpIHtcbiAgICB2YXIgeWVhciAgICAgPSBpbnB1dFBlcmlvZC5nZXRGdWxsWWVhcigpO1xuICAgIHZhciB3aW50ZXIgICA9IG5ldyBEYXRlKHllYXIsIDAsIDEpO1xuICAgIHZhciBzcHJpbmcgICA9IG5ldyBEYXRlKHllYXIsIDMsIDEpO1xuICAgIHZhciBzdW1tZXIgICA9IG5ldyBEYXRlKHllYXIsIDYsIDEpO1xuICAgIHZhciBmYWxsICAgICA9IG5ldyBEYXRlKHllYXIsIDksIDEpO1xuICAgIHZhciBzZWFzb247XG5cbiAgICBzd2l0Y2ggKGlucHV0UGVyaW9kLmdldE1vbnRoKCkpIHtcbiAgICAgIGNhc2UgMDpcbiAgICAgICAgc2Vhc29uID0gJ1dJJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDM6XG4gICAgICAgIHNlYXNvbiA9ICdTUCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSA2OlxuICAgICAgICBzZWFzb24gPSAnU1UnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgOTpcbiAgICAgICAgc2Vhc29uID0gJ0ZBJztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHZhciByZXR1cm5ZZWFyID0gaW5wdXRQZXJpb2QuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpO1xuICAgIHJldHVyblllYXIgPSByZXR1cm5ZZWFyLnNsaWNlKDIsNCk7XG5cbiAgICByZXR1cm4gJycgKyBzZWFzb24gKyByZXR1cm5ZZWFyO1xuICB9XG59KVxuXG4uZmlsdGVyKCd0eXBlRmlsdGVyJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiBmdW5jdGlvbihpbnB1dFR5cGUpIHtcbiAgICBzd2l0Y2ggKGlucHV0VHlwZSkge1xuICAgICAgY2FzZSAnSCc6XG4gICAgICAgIHJldHVybiAnSG9tZXdvcmsnO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ00nOlxuICAgICAgICByZXR1cm4gJ01pZHRlcm0nO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ04nOlxuICAgICAgICByZXR1cm4gJ05vdGVzJztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdRJzpcbiAgICAgICAgcmV0dXJuICdRdWl6JztcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdGJzpcbiAgICAgICAgcmV0dXJuICdGaW5hbCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnTCc6XG4gICAgICAgIHJldHVybiAnTGFiJztcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG59KVxuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmRpcmVjdGl2ZXMubWFpbkhlYWRlcicsIFtcbiAgICAnbmdTdG9yYWdlJyxcbiAgICAnQXBwbGljYXRpb25Db25maWd1cmF0aW9uJ1xuXSlcblxuLmRpcmVjdGl2ZSgnbWFpbkhlYWRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIHJlcGxhY2U6IHRydWUsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9tYWluSGVhZGVyL21haW5IZWFkZXIudHBsLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiggJHNjb3BlLCAkc3RhdGUgKSB7XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLmRpcmVjdGl2ZXMubW9kYWxzLnNob3dQZGZNb2RhbCcsIFtcbiAgJ3VpLmJvb3RzdHJhcCcsXG4gICdmaC5zZXJ2aWNlcy5Nb2RhbFNlcnZpY2UnXG5dKVxuXG4uZGlyZWN0aXZlKCdzaG93UGRmTW9kYWwnLCBmdW5jdGlvbiggTW9kYWxTZXJ2aWNlLCAkaHR0cCApIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0FFJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgIGVsZW1lbnQub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIE1vZGFsU2VydmljZS5vcGVuTW9kYWwoe1xuICAgICAgICAgIHRlbXBsYXRlVXJsOiAnZGlyZWN0aXZlcy9tb2RhbHMvc2hvd1BkZk1vZGFsL3Nob3dQZGZNb2RhbC50cGwuaHRtbCcsXG4gICAgICAgICAgY29udHJvbGxlcjogJ1Nob3dQZGZNb2RhbENvbnRyb2xsZXInLFxuICAgICAgICAgIHdpbmRvd0NsYXNzOiAnc2hvdy1wZGYtbW9kYWwnLFxuICAgICAgICAgIGJhY2tkcm9wOiAnc3RhdGljJyxcbiAgICAgICAgICBrZXlib2FyZDogZmFsc2UsXG4gICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgcGFwZXJUb1JlbmRlcklkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHNjb3BlLnBhcGVyLl9pZFxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59KVxuXG4uY29udHJvbGxlcignU2hvd1BkZk1vZGFsQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwgJHRpbWVvdXQsIE1vZGFsU2VydmljZSwgcGFwZXJUb1JlbmRlcklkKSB7XG4gICRzY29wZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xuICAgIE1vZGFsU2VydmljZS5jbG9zZU1vZGFsKCk7XG4gIH07XG4gIHZhciBwYWdlO1xuICAkc2NvcGUucGFwZXJUb1JlbmRlciA9IHBhcGVyVG9SZW5kZXJJZDtcblxuICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlbmRlcmVkLXBkZi1tb2RhbCcpO1xuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgaWYgKCBwYXBlclRvUmVuZGVySWQgKSB7XG4gICAgICBQREZKUy5nZXREb2N1bWVudCggJy9hcGkvcGFwZXJzL3NpbmdsZS9pbWFnZS8nICsgcGFwZXJUb1JlbmRlcklkICkudGhlbihmdW5jdGlvbiggcGRmICkge1xuICAgICAgICBwZGYuZ2V0UGFnZSgxKS50aGVuKGZ1bmN0aW9uKCBwYWdlICkge1xuXG4gICAgICAgICAgdmFyIHNjYWxlID0gMTtcbiAgICAgICAgICB2YXIgdmlld3BvcnQgPSBwYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSB2aWV3cG9ydC5oZWlnaHQ7XG4gICAgICAgICAgY2FudmFzLndpZHRoID0gdmlld3BvcnQud2lkdGg7XG5cbiAgICAgICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgICAgIGNhbnZhc0NvbnRleHQ6IGNvbnRleHQsXG4gICAgICAgICAgICB2aWV3cG9ydDogdmlld3BvcnRcbiAgICAgICAgICB9O1xuICAgICAgICAgIHBhZ2UucmVuZGVyKHJlbmRlckNvbnRleHQpO1xuICAgICAgICB9KTtcblxuICAgICAgICAkc2NvcGUucGRmID0gcGRmO1xuICAgICAgICAkc2NvcGUucGFnZSA9IDFcblxuICAgICAgICAvLyBldmVudCBsaXN0ZW5lcnMgZm9yIFBERiBwYWdlIG5hdmlnYXRpb25cbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3ByZXZpb3VzLXBhZ2UtbW9kYWwnKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsXG4gICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoICRzY29wZS5wYWdlID4gMSApIHtcbiAgICAgICAgICAgICAgJHNjb3BlLnBhZ2UtLTtcbiAgICAgICAgICAgICAgcmVuZGVyUGRmKCAkc2NvcGUucGFnZSApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHQtcGFnZS1tb2RhbCcpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJyxcbiAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICggJHNjb3BlLnBkZi5udW1QYWdlcyA+ICRzY29wZS5wYWdlICkge1xuICAgICAgICAgICAgICAkc2NvcGUucGFnZSsrO1xuICAgICAgICAgICAgICByZW5kZXJQZGYoICRzY29wZS5wYWdlICk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnRleHQuY2xlYXJSZWN0KDAsIDAsIGNhbnZhcy53aWR0aCwgY2FudmFzLmhlaWdodCk7XG4gICAgfVxuICB9LCA1MCk7XG5cbiAgLy8gJHNjb3BlLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgaWYgKCAkc2NvcGUucGRmLm51bVBhZ2VzID4gJHNjb3BlLnBhZ2UgKSB7XG4gIC8vICAgICAkc2NvcGUucGFnZSsrO1xuICAvLyAgICAgcmVuZGVyUGRmKCAkc2NvcGUucGFnZSApO1xuICAvLyAgIH1cbiAgLy8gfTtcblxuICBmdW5jdGlvbiByZW5kZXJQZGYoIHBhZ2UgKSB7XG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZW5kZXJlZC1wZGYtbW9kYWwnKTtcbiAgICB2YXIgY29udGV4dCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgJHNjb3BlLnBkZi5nZXRQYWdlKCBwYWdlICkudGhlbihmdW5jdGlvbiggcmVuZGVyUGFnZSApIHtcbiAgICAgIHZhciBzY2FsZSA9IDE7XG4gICAgICB2YXIgdmlld3BvcnQgPSByZW5kZXJQYWdlLmdldFZpZXdwb3J0KHNjYWxlKTtcblxuICAgICAgY2FudmFzLmhlaWdodCA9IHZpZXdwb3J0LmhlaWdodDtcbiAgICAgIGNhbnZhcy53aWR0aCA9IHZpZXdwb3J0LndpZHRoO1xuXG4gICAgICB2YXIgcmVuZGVyQ29udGV4dCA9IHtcbiAgICAgICAgY2FudmFzQ29udGV4dDogY29udGV4dCxcbiAgICAgICAgdmlld3BvcnQ6IHZpZXdwb3J0XG4gICAgICB9O1xuICAgICAgcmVuZGVyUGFnZS5yZW5kZXIocmVuZGVyQ29udGV4dCk7XG4gICAgfSlcbiAgfVxuICAgIFxufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnZmguc2VydmljZXMuRmluZEltYWdlU2VydmljZScsIFtcbiAgICAgICAgJ25nU3RvcmFnZScsXG4gICAgICAgICd2ZW5kb3Iuc3RlZWxUb2UnXG4gICAgXSlcblxuLmZhY3RvcnkoJ0ZpbmRJbWFnZVNlcnZpY2UnLCBmdW5jdGlvbigkaHR0cCwgJHNlc3Npb25TdG9yYWdlLCAkcSwgc3RlZWxUb2UpIHtcblxuICAgIGZ1bmN0aW9uIGlzSW1hZ2Uoc3JjLCBkZWZhdWx0U3JjKSB7XG5cbiAgICAgICAgdmFyIGRlZmVycmVkID0gJHEuZGVmZXIoKTtcblxuICAgICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgaW1hZ2Uub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2Vycm9yOiAnICsgc3JjICsgJyBub3QgZm91bmQnKTtcbiAgICAgICAgICAgIGRlZmVycmVkLnJlc29sdmUoIGRlZmF1bHRTcmMgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2Uub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKCBzcmMgKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1hZ2Uuc3JjID0gc3JjO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAgIGdldEhlYWRlckltYWdlOiBmdW5jdGlvbihjb21wYW55Q29kZSkge1xuICAgICAgICAgICAgdmFyIGltYWdlVXJsID0gJy4vYXNzZXRzL2ltYWdlcy9oZWFkZXJJbWFnZS5qcGcnO1xuICAgICAgICAgICAgcmV0dXJuIGlzSW1hZ2UoaW1hZ2VVcmwpO1xuICAgICAgICB9XG4gICAgfTtcbn0pO1xuXG5cblxuLy8gaW50ZXJpb3Jcbi8vIEksIEosIEssIEwsIE0sIE1NLCBOLCBOTiwgSUEsIElRLCBSXG5cbi8vIG9jZWFuXG4vLyBDLCBDQSwgQ1EsIEQsIERBLCBERCwgRSwgRUUsIEYsIEZBLCBGQiwgRkYsIEcsIEgsIEhILCBHRywgT08sIFFcblxuLy8gdmlzdGFcbi8vIEEsIEFBLCBBQiwgQVMsIEIsIEJBLCBCQiwgQkMsIEJRXG5cbi8vIG5lcHR1bmVcbi8vIFMsIFNBLCBTQiwgU0MsIFNRXG5cbi8vIHBpbm5hY2xlXG4vLyBQU1xuXG4vLyB2ZXJhbmRhaFxuLy8gViwgVkEsIFZCLCBWQywgVkQsIFZFLCBWRiwgVkgsIFZRLCBWUywgVlRcblxuLy8gc2lnbmF0dXJlXG4vLyBTUywgU1ksIFNaLCBTVVxuXG4vLyBsYW5haVxuLy8gQ0FcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLkZvY3VzU2VydmljZScsIFtdKVxuXG4uZmFjdG9yeSgnZ2l2ZUZvY3VzJywgZnVuY3Rpb24oJHRpbWVvdXQpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgICAgIGlmKGVsZW1lbnQpXG4gICAgICAgICAgICAgICAgZWxlbWVudC5mb2N1cygpO1xuICAgICAgICB9KTtcbiAgICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2ZoLnNlcnZpY2VzLk1vZGFsU2VydmljZScsIFtcbiAgICAndWkuYm9vdHN0cmFwLm1vZGFsJyxcbl0pXG4uc2VydmljZSgnTW9kYWxTZXJ2aWNlJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJG1vZGFsKSB7XG4gICAgdmFyIG1lID0ge1xuICAgICAgICBtb2RhbDogbnVsbCxcbiAgICAgICAgbW9kYWxBcmdzOiBudWxsLFxuICAgICAgICBpc01vZGFsT3BlbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gbWUubW9kYWwgIT09IG51bGw7XG4gICAgICAgIH0sXG4gICAgICAgIG9wZW5Nb2RhbDogZnVuY3Rpb24oYXJncykge1xuICAgICAgICAgICAgbWUuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgbWUubW9kYWxBcmdzID0gYXJncztcbiAgICAgICAgICAgIG1lLm1vZGFsID0gJG1vZGFsLm9wZW4oYXJncyk7XG5cbiAgICAgICAgICAgIHJldHVybiBtZS5tb2RhbDtcbiAgICAgICAgfSxcbiAgICAgICAgY2xvc2VNb2RhbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAobWUubW9kYWwgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1lLm1vZGFsLmRpc21pc3MoKTtcbiAgICAgICAgICAgICAgICBtZS5tb2RhbCA9IG51bGw7XG4gICAgICAgICAgICAgICAgbWUubW9kYWxBcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvL1doZW4gdGhlIHVzZXIgbmF2aWdhdGVzIGF3YXkgZnJvbSBhIHBhZ2Ugd2hpbGUgYSBtb2RhbCBpcyBvcGVuLCBjbG9zZSB0aGUgbW9kYWwuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcbiAgICAgICAgbWUuY2xvc2VNb2RhbCgpO1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1lO1xufSk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9