

/**
 * @ngdoc directive
 * @name olci.directives.buttonGreen
 * @description Directive for green 'continue' button and copy at the bottom of the page.
 */
angular.module('olci.directives.buttonGreen', [])

    .directive('buttonGreen', function factory() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                copy: '@buttonGreenCopy',
                label: '@buttonGreenLabel'
            },
            templateUrl: 'directives/buttonGreen/buttonGreen.tpl.html',
            controller: function($scope, $state) {
                
            }
        };
    });
