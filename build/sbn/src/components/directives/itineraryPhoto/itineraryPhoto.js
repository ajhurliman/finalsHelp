

/**
 * @ngdoc directive
 * @name olci.directives.itineraryPhoto
 * @description Directive for itinerary photo in the side bar.
 */
angular.module('olci.directives.itineraryPhoto', [])

    .directive('itineraryPhoto', function factory() {
        return {
            restrict: 'A',
            replace: false,
            templateUrl: 'directives/itineraryPhoto/itineraryPhoto.tpl.html',
            controller: function($scope, $state, FindImageService, GetCopyService) {
                // Sets image src.
            	FindImageService.itineraryImage().then( function (src) {
            		$scope.imgSrc = src;
            	});
                // Sets copy.
                GetCopyService.itineraryCopy().then( function (copy) {
                    $scope.copy = copy;
                });
            }
        };
    });
