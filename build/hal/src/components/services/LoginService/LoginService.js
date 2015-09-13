
angular.module('olci.services.LoginService', [])

.service('LoginService', function($state, AuthService) { 
        var me = {

            /**
             * @ngdoc method
             * @name olci.services.LoginService#init
             * @methodOf olci.services.LoginService
             * @description sets params: redirectState, and redirectParams
             * */
            init: function() {
                me.onLogin('home', {});
            },

            /**
             * @ngdoc method
             * @name olci.services.LoginService#onLogin
             * @methodOf olci.services.LoginService
             * @description remember a UI-Router page state to navigate to after login succeeds
             * @param {string} stateName the state to jump to after successful login
             * @param {object} stateParams the state params for the destination state (if applicable)
             */
            onLogin: function(stateName, stateParams) {
                me.redirectState = stateName;
                me.redirectParams = stateParams;
            },

            /**
             * Proceed past login prompt to the originally desired page
             */
            finishLogin: function() {
                $state.go(me.redirectState, me.redirectParams);
            },

            /**
             * @ngdoc method
             * @name olci.services.LoginService#logout
             * @methodOf olci.services.LoginService
             * @description logs out user
             * @param {string} redirectTo name of state to redirect to
             * */
            logout: function (redirectTo) {
                var resolve = AuthService.logout();
                resolve.finally(function() {
                    me.init();
                });

                return resolve;
            }
        };

        me.init();
        return me;
    });
