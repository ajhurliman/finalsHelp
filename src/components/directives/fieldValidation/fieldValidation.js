

/**
 * @ngdoc directive
 * @name olci.directives.fieldValidation
 * @description Adds some alerts for field validation.
 */
angular.module('olci.directives.fieldValidation', [])

    .directive('fieldValidation', function factory() {
        return {
            restrict: 'E',
            replace: false,
            // scope: {
            //     copy: '@buttonGreenCopy',
            //     label: '@buttonGreenLabel'
            // },
            templateUrl: 'directives/fieldValidation/fieldValidation.tpl.html',
            controller: function( $scope, $state ) {
                
            }
        };
    });
