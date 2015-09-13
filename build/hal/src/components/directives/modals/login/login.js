/*
 * login.js
 *
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

angular.module( 'olci.directives.modals.login', [
    'ui.bootstrap',
    'olci.services.RoutingUtilsService'
])

/**
 * @ngdoc directive
 * @name olci.directives.login
 * @restrict A
 * @element ANY
 * @description fallback-src directive supplying alternative src for images that fail to load
 */
    .directive('loginModal', function factory(ModalService) { return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            scope.loginData = {};
            element.on('click', function() {
                ModalService.openModal( {
                    templateUrl: 'directives/modals/login/login.tpl.html',
                    controller: 'LoginModalController',
                    backdrop: 'static',
                    resolve: {
                        loginData: function () {
                            return scope.loginData;
                        }
                    }

                });
            });
        }
    };})
/**
 * @ngdoc controller
 * @name LoginModalController
 */
    .controller('LoginModalController', function LoginModalController($scope, ModalService, $state, AuthService, RoutingUtilsService) {
        $scope.preTag = "OCLogMdl";
        // $scope.loginData = loginData;

        $scope.close = function() {
            window.location.href = RoutingUtilsService.frontendBaseUrl(' ');
            ModalService.closeModal();
        };

    });
