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