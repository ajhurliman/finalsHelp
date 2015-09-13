angular.module('olci.directives.modals.alerts', [
    'ui.bootstrap',
    'ngCookies',
    'ngStorage',
    'olci.services.ModalService',
    'olci.services.GetCopyService',
    'olci.services.DataTransformService'
])

.directive('passportVisaNotification', function( ModalService, $cookies, $sessionStorage) {
    return {
        restrict: 'A',
        scope: { passenger: '=' },
        link: function(scope, element, attrs) {
            element.on('click', function() {
                if ( $cookies[$sessionStorage.bookingInfo.bookingNumber + scope.passenger.seqNumber + 'termsConditionsVisaFlag'] !== 'true' || attrs.pvnInfinite.toLowerCase() === 'true' ) {
                    ModalService.openModal({
                        templateUrl: 'directives/modals/passportVisaNotification/passportVisaNotification.tpl.html',
                        controller: 'passportVisaNotificationController',
                        windowClass: 'passport-visa-notification-modal',
                        backdrop: 'static',
                        keyboard: false,
                        resolve: {
                            agreeToTerms: function() {
                                return attrs.agreeToTerms;
                            },
                            passenger: function () {
                                return scope.passenger;
                            }
                        }
                    });
                }
            });
        }
    };
})

.controller('passportVisaNotificationController', function( $scope, $cookies, $sessionStorage, agreeToTerms, passenger, ModalService, GetCopyService) {
    $scope.alerts = {};
    $scope.copy = "";

    // Check for voyage specific notification first.  If none, get default notification.
    if ( passenger.notifications[0].notification !== '' ) {
        passenger.notifications.map( function (notification) {
            $scope.copy += notification.description;
        });
    }
    else {
        GetCopyService.visaNotificationCopy().then( function(copy) {
            $scope.copy = copy;
        });
    }

    $scope.close = function() {
        $cookies[$sessionStorage.bookingInfo.bookingNumber + passenger.seqNumber + 'termsConditionsVisaFlag'] = 'true';

        var currDate = new Date();
        passenger.CheckInPassenger.termsConditionsVisaFlag = currDate.getFullYear() + "-" + currDate.getDay() + "-" + currDate.getMonth();

        ModalService.closeModal();
    };
});
