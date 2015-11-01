angular.module('fh.directives.mainHeader', [
    'ngStorage',
    'ApplicationConfiguration'
])

.directive('mainHeader', function() {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'directives/mainHeader/mainHeader.tpl.html',
        controller: function( $scope, $rootScope, $state, $sessionStorage ) {

          $scope.sendEmail = function() {
            var link = "mailto:james.hurliman@gmail.com?subject=Help%20with%20FinalsHelp.com";
            window.open(link, '_blank');
          };

          $scope.logout = function() {
            $sessionStorage.jwt = null;
            $sessionStorage.user = null;
            $rootScope.user = null;
            $state.go('landing');
          }
        }
    };
});