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