/*
 * staleSessionModal.js
 *
 * Created: Thursday, December 12, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc directive
 * @name olci.directives.modals.staleSessionModal
 * @restrict A
 * @element ANY
 * @description A modal dialog that fetches and displays Terms and Conditions according to the user's country,
 * determined via inspection of the frontend data packet.
 */
angular.module( 'olci.directives.modals.staleSessionModal', [
    'ui.bootstrap',
    // 'olci.services.AssetService',
    'olci.services.AuthService',
    'olci.services.ModalService',
    'olci.services.StaleSessionService'
])

    .directive('staleSessionModal', function(ModalService) { return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.on('click', function() {
                ModalService.openModal({
                    templateUrl: 'directives/modals/staleSessionModal/staleSessionModal.tpl.html',
                    controller: 'staleSessionModalController',
                    windowClass: 'stale-session-modal',
                    backdrop: 'static',
                    keyboard: false
                });
            });
        }
    };})
/**
 * @ngdoc method
 * @name olci.directives.modals.staleSessionModal#staleSessionModalController
 * @methodOf olci.directives.modals.staleSessionModal
 *
 */
    .controller('staleSessionModalController',
    function staleSessionModalController($window, $timeout, $state, $scope, $cookies, ModalService, AuthService, Configuration, StaleSessionService) {

        $scope.sessionExpired = false;
        $scope.frontEndUrl = Configuration.frontend.baseUrl;
        $scope.isLoggedIn = false;

        $scope.redirectLoggedOutUser = function() {
            if ($scope.isLoggedIn) {
                $window.location.href = Configuration.frontend.baseUrl;
            } else {
                $state.go('findBooking');
            }
        };

        $scope.chooseEndSession = function() {
            // get this before logging out
            $scope.isLoggedIn = AuthService.isLoggedIn();
            StaleSessionService.endSession()
                .finally(function() {
                    $scope.userLoggedOut = true;
                    $scope.redirectLoggedOutUser();
                });
        };

        $scope.chooseContinueSession = function() {
            return StaleSessionService.continueSession()
                .then(
                    function() {
                        ModalService.closeModal();
                    })
                .catch(
                    function() {
                        $scope.sessionExpired = true;
                        $timeout($scope.chooseEndSession,6000);
                    }
                );
        };

    });
