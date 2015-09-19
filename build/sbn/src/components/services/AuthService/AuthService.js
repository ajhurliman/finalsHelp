/*
 * AuthService.js
 *
 * Created: Friday, February 21, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name secondaryFlow.services.AuthService
 * @description Reads and sets user's HAL token to/from cookie.
 * Authenticates and verifies user token, and handles role changes.
 * @requires restangular
 * @requires ApplicationConfiguration
 * @requires ui.router
 * @requires ngCookies
 *
 */
angular.module( 'olci.services.AuthService', [
    'restangular',
    'ApplicationConfiguration',
    'ngCookies',
    'olci.services.AnalyticsService',
    'olci.services.SharedDataService',
    'ngStorage'
])

.service( 'AuthService', function (Restangular, Configuration, $q, $cookies, AnalyticsService, SharedDataService, $sessionStorage) {
    var me = {

        ROLES_WITH_BOOKING: {
            GIFTER: [ // gifters cannot see these sections
                'headerWelcomeMessage',
                'headerMyAccount',
                'headerSignOut',
                'headerCheckIn',
                'headerMakePayment',
                'headerPromoCode',
                'heroWelcomeName',
                'pnavTravelPlanning',
                'heroBookFlightsTravel',
                'heroStateroomTile',
                'b4LeaveCheckIn',
                'b4LeaveFinalPayment',
                'b4LeaveCPP',
                'b4LeavePrePostCruise',
                'b4LeaveVisas',
                'b4LeaveDeckPlan',
                'itineraryPurchases',

                // sections by (state) name
                'travelOptions',
                'preCruiseTravel',
                'postCruiseTravel',
                'bookFlights',
                'cpp'
            ],
            TRAVEL_AGENT: [ // travel agents cannot see these sections
                'headerWelcomeMessage',
                'headerMyAccount',
                'headerSignOut',
                'headerCheckIn',
                'headerMakePayment',
                'headerPromoCode',
                'heroWelcomeName',
                'pnavTravelPlanning',
                'heroBookFlightsTravel',
                'b4LeaveCheckIn',
                'b4LeaveFinalPayment',
                'b4LeaveCPP',
                'b4LeavePrePostCruise',
                'b4LeaveVisas',
                'b4LeaveDeckPlan',
                'itineraryPurchases',

                // sections by (state) name
                'travelOptions',
                'preCruiseTravel',
                'postCruiseTravel',
                'bookFlights',
                'cpp'
            ],
            'DIRECT_GUEST_LOGGED_IN': [],
            'DIRECT_GUEST_NOT_LOGGED_IN': [
                'headerMakePayment',
                'headerWelcomeMessage',
                'headerSignOut',
                'heroBookFlightsTravel',
                'heroStateroomTile',
                'heroWelcomeName',
                'itineraryPurchases',
                'pnavPrePostCruise',
                'pnavCPP',
                'pnavMakePayment',
                'b4LeaveFinalPayment',
                'b4LeaveCPP',
                'b4LeavePrePostCruise',

                // sections by (state) name
                'travelOptions',
                'cpp'
            ],
            'TRAVEL_AGENCY_BOOKED_GUEST_LOGGED_IN': [
                'headerMakePayment',
                'pnavPrePostCruise',
                'pnavCPP',
                'pnavMakePayment',
                'heroBookFlightsTravel',
                'b4LeaveFinalPayment',
                'b4LeaveCPP',
                'b4LeavePrePostCruise',

                // sections by (state) name
                'travelOptions',
                'cpp'
            ],
            'TRAVEL_AGENCY_BOOKED_GUEST_NOT_LOGGED_IN': [
                'headerMakePayment',
                'headerWelcomeMessage',
                'headerSignOut',
                'heroWelcomeName',
                'pnavPrePostCruise',
                'pnavCPP',
                'pnavMakePayment',
                'heroBookFlightsTravel',
                'heroStateroomTile',
                'b4LeaveFinalPayment',
                'b4LeaveCPP',
                'b4LeavePrePostCruise',
                'itineraryPurchases',

                // sections by (state) name
                'travelOptions',
                'cpp'
            ]



        },

        authenticationBaseUrl: Restangular.one( 'authentication/v1.0.0' ).one( 'companyCode', Configuration.companyCode),

        init: function () {
            me.currentUser = null;
        },

        currentUserResolver: function () {
            var deferred = $q.defer();

            if (me.currentUser !== null) {
                deferred.resolve(me.currentUser);
            } else {
                deferred.resolve(me.recoverSession());
            }
            return deferred.promise;
        },
        
        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#getCurrentUser
         * @methodOf secondaryFlow.services.AuthService
         * @description gets and returns currentUser from cookie, else null.
         * @returns {object} currentUser else null
         * */
        getCurrentUser: function () {
            return me.currentUser;
        },


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#getCurrentRoles
         * @methodOf secondaryFlow.services.AuthService
         * @description Get an array of the roles the current user belongs to.
         * @returns {array} roles[] of roles.
         * */
        getCurrentRoles: function () {
            var roles = [];
            if (me.currentUser && angular.isArray(me.currentUser.roles)) {
                roles = me.currentUser.roles;
            }
            return roles;
        },

        /**
         * Recover session data, for instance on a reload.
         *
         * HAL_AUTH_TOKEN is used for REST calls, but a page reload can potentially get the cookies out of sync,
         * causing the user to appear logged in but all requests fail.
         * @returns {object} promise
         */
        recoverSession: function() {
            return me.verify($sessionStorage.token);
        },

        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#needsSessionRecovery
         * @methodOf secondaryFlow.services.AuthService
         * @description Checks if the token has timed out.
         * @returns {boolean} true if the token has timed out
         **/
        needsSessionRecovery: function(){
            var currentTime = (new Date()).getTime();
            var timeoutms = Configuration.tokenTimeout;
            var tokenTimestamp = $sessionStorage.tokenTimestamp;
            return (tokenTimestamp !== null && (currentTime - tokenTimestamp) > timeoutms);
        },

        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#authenticate
         * @methodOf secondaryFlow.services.AuthService
         * @description Authenticates user.
         * @param {string} bookingNumber e.g. GPML8P
         * @param {string} lastName e.g. BETTES
         * @returns {object} promise
         * */
        authenticate: function ( bookingNumber, lastName ) {
            var header = {
                "Content-Type": "application/x-www-form-urlencoded;"
            };

            var authData = me._transformRequestObject({
                "key": bookingNumber,
                "secret": lastName
            });

            return me.authenticationBaseUrl.customPOST( authData, undefined, undefined, header ).then(function ( data ) {
                return me._checkAuthentication( data );
            });
        },

        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#requestRoleChange
         * @methodOf secondaryFlow.services.AuthService
         * @description changes roles if authorized.
         * @param {string} newRole string.
         * @returns {object} promise.
         * */
        requestRoleChange: function( newRole ) {
            var request = me.authenticationBaseUrl.one( me.getCurrentUser().token + '/role/' + newRole );

            return request.put().then(function ( data ) {
                return me._checkAuthentication( data );
            });
        },


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#verify
         * @methodOf secondaryFlow.services.AuthService
         * @description not sure
         * @param {string} token e.g. xxxxxxxx
         * @returns {object} promise.
         * */
        verify: function ( token ) {
            var deferred = $q.defer();
            if ( !token ) {
                deferred.reject( 'no token' );
            } else {
                me.authenticationBaseUrl.customGET( token ).then(function ( data ) {
                    me._setTokenTimestamp();
                    deferred.resolve( me._checkAuthentication( data ) );
                }).catch(function(){
                    deferred.resolve(deferred.reject( 'no token' ));
                });
            }
            
            return deferred.promise;
        },


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#isAuthenticated
         * @methodOf secondaryFlow.services.AuthService
         * @description tests for current user.
         * @returns {bool} !!getCurrentUser()
         * */
        isAuthenticated: function () {
            return !!( me.getCurrentUser() );
        },


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#isLoggedIn
         * @methodOf secondaryFlow.services.AuthService
         * @description Tests whether current user is logged in to front-end marketing website.
         * @returns {bool} true if user is logged in.
         * */
        isLoggedIn: function() {
            var loggedIn = false;
            var roles = me.getCurrentRoles();

            loggedIn = !!(_.find( roles, function( role ) {
                return role.match(/LOGGED_IN/) && !role.match(/NOT_LOGGED_IN/);
            }));

            return loggedIn;
        },

        isDirectGuest: function() {
            var directGuest = false;
            var roles = me.getCurrentRoles();

            directGuest = !!(_.find( roles, function( role ) {
                return role.match(/DIRECT_GUEST/) && !role.match(/INDIRECT_GUEST/);
            }));

            return directGuest;
        },
        
        isExplorer: function() {
            var loggedIn = false;
            var roles = me.getCurrentRoles();

            loggedIn = !!(_.find( roles, function( role ) {
                return role.match(/EXPLORER/);
            }));

            return loggedIn;
        },
        
        isTravelAgent: function() {
            var loggedIn = false;
            var roles = me.getCurrentRoles();

            loggedIn = !!(_.find( roles, function( role ) {
                return role.match(/TRAVEL_AGENT/);
            }));

            return loggedIn;
        },


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#authorize
         * @methodOf secondaryFlow.services.AuthService
         * @description Checks authorization permission.
         * @param {string} accessLevels a string array with role names or a string with role name.
         * @returns {boolean} true if the role is authorized.
         */
        authorize: function ( name ) {
            var hasAccess = false;
            var roles = me.getCurrentRoles();

            if ( me.ROLES_WITH_BOOKING[ roles[ 0 ] ] && !_.find( me.ROLES_WITH_BOOKING[ roles[ 0 ] ], function( val ) { return val === name; } ) ) {
                hasAccess = true;
            }

            return hasAccess;
        }, 


        /**
         * @ngdoc method
         * @name secondaryFlow.services.AuthService#logout
         * @methodOf secondaryFlow.services.AuthService
         * @description Removes session information
         * */
        logout: function () {
            // delete the user token with auth service endpoint
            var resolve =  me.authenticationBaseUrl.one( $sessionStorage.token ).remove()
                .finally(function() {
                    // Wipe out cookies and user
                    document.cookie = 'HAL_AUTH_TOKEN=;path=/secondary/api'; // REST cookie at /secondary/api
                    $sessionStorage.token = '';
                    $sessionStorage.tokenTimestamp = '';
                    me.init();
                    $state.go( 'findBooking' );
                }
            );

            return resolve;
        },

        /**
         * Glean authentication information out of the data returned from one of the auth calls
         *
         * @param authData
         * @private
         */
        _extractCurrentUser: function ( authData ) {
            var currentUser = authData;

            // TODO: remove this and refactor the references,
            // use currentUser.details.* instead
            if (authData.details) {
                currentUser.bookingNumber = authData.details.bookingNumber;
                currentUser.lastName = authData.details.lastName;
                currentUser.countryCode = authData.details.country;

                // SharedDataService.setCountryOfLocale( authData.details.country );
            }

            return currentUser;
        },

        /**
         * Glean authentication information out of the data returned from one of the auth calls
         *
         * @param authData
         * @private
         * @return promise
         */
        _checkAuthentication: function ( authData ) {
            var userData = me._extractCurrentUser( authData );

            // store auth token for later, but don't let Angular set expiration date
            $sessionStorage.currentUser = userData.token;
            me._setTokenTimestamp();
            me.currentUser = userData;

            // check for invalid role
            var securityCheckRoles = _.intersection(userData.roles, Object.keys(me.ROLES_WITH_BOOKING));
            // It's only an invalid role if the booking number is present,
            // otherwise the user should see the login screen with fields filled in.
            if ( securityCheckRoles.length === 0 && userData.bookingNumber ){
                me.init();
                return $q.reject( 'INVALID_ROLE' );
            }
            return $q.when( userData );
        },

        _transformRequestObject: function ( obj ) {
            var str = [];
            for ( var p in obj ) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            return str.join( "&" );
        },

        _setTokenTimestamp: function(){
            $sessionStorage.tokenTimestamp = new Date().getTime();
        }

    };

    me.init();
    return me;
});
