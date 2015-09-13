angular.module('olci.directives.modals.errorModal', [
    'ui.bootstrap',
    'olci.services.ModalService'
])

.directive('errorModal', function(ModalService) {
    return {
        restrict: 'A',
        link: function( scope, element, attrs ) {
            scope.$on('server-error', function( event, args ) {
                ModalService.openModal({
                    templateUrl: 'directives/modals/errorModal/errorModal.tpl.html',
                    controller: 'errorModalController',
                    windowClass: 'error-modal',
                    backdrop: 'static',
                    keyboard: false,
                    resolve: {
                        errorObj: function() {
                            return args;
                        }
                    }
                });
            });
        }
    };
})

.controller('errorModalController', function($scope, ModalService, errorObj, $window) {
    $scope.status = errorObj.status;
    $scope.statusText = errorObj.statusText;

    $scope.close = function() {
        ModalService.closeModal();
        $window.location.reload();
    };
});


// // Timeout response?
// {
//   "data": null,
//   "status": 0,
//   "config": {
//     "method": "GET",
//     "transformRequest": [
//       null
//     ],
//     "transformResponse": [
//       null
//     ],
//     "headers": {
//       "Accept": "application/json, text/plain, */*"
//     },
//     "withCredentials": true,
//     "timeout": 15000,
//     "cache": true,
//     "url": "/secondary/api/checkin/v1.0.0/companyCode/HAL/countryCode/US/booking"
//   },
//   "statusText": ""
// }
