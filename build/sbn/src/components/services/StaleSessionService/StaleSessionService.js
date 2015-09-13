/*
 * StaleSessionService.js
 *
 * Created: Wednesday, December 15, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc service
 * @name olci.services.StaleSessionService
 * @description receives an event for http success and resets stale session timer`
 */
angular

    .module( 'olci.services.StaleSessionService', [
        'olci.services.ModalService',
        'olci.directives.modals.staleSessionModal'
    ])

    .service('StaleSessionService', function( $q, $state, $cookies, $interval, $timeout, $window, AuthService, ModalService, Configuration ) {

        var staleSessionService = {

            // convert minutes of timeout to ms:  min * sec/min * ms/sec
            timeoutMs : 18 * 60 * 1000,
            // timeoutMs : 10 * 1000, // 10s for testing.

            staleSessionTimer : null,

            endSession : function () {
                // return LoginService.logout();

                // Following is from LoginService.logout
                var resolve = AuthService.logout();
                resolve.finally(function() {
                    me.init();
                });

                return resolve;
            },

            continueSession : function () {

                var deferred = $q.defer();

                AuthService.recoverSession()
                    .then(
                    function (userData) {
                        staleSessionService.resetStaleSessionTimer();
                        deferred.resolve(userData);
                    },
                    function () {
                        deferred.reject();
                    });

                return deferred.promise;
            },

            callStaleSessionModal : function () {

                if ($state.current.name == 'login') {
                    staleSessionService.resetStaleSessionTimer();
                    return;
                }

                // there may be a modal already open
                ModalService.closeModal();

                staleSessionService.modalInstance = ModalService.openModal({
                    templateUrl: 'directives/modals/staleSessionModal/staleSessionModal.tpl.html',
                    controller: 'staleSessionModalController',
                    windowClass: 'stale-session-modal',
                    backdrop: 'static',
                    keyboard: false
                });

            },

            resetStaleSessionTimer : function () {
                $interval.cancel(staleSessionService.staleSessionTimer);
                staleSessionService.staleSessionTimer = $interval(staleSessionService.callStaleSessionModal, staleSessionService.timeoutMs, 1);
                return true;
            }

        };

        return staleSessionService;
    });


