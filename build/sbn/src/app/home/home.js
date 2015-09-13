angular.module('fh.home', [
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
    pageTitle: 'Home'
  });
})

.controller('HomeController', function( $scope, $state, $http, $sessionStorage, $timeout, Upload, pdfDelegate ) {
  var PAPERS_URL = '/api/papers';
  $http.defaults.headers.common['jwt'] = $sessionStorage.jwt;

  $scope.mainPdfData = './assets/images/fw4.pdf';

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
  var BASE64_MARKER = ';base64,';

  function isImage(buffer) {
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
              JSON.stringify(data.title) + 
              '\n' + 
              $scope.log;

              // if it's a PDF
              // if (data.img.contentType === 'application/pdf') {
              //   $scope.mainPdfData = data.img.data;
              // }
              // $scope.papersToEdit.push(data);

          });
        });
      }
    }
  };




});
