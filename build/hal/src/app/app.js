(function () {
    'use strict';
})();

angular.module('olci', [
    'ngStorage',
    'cgBusy',
    'ui.router',
    'ui.bootstrap',
    'ui.bootstrap.showErrors',
    'ui.utils',
    'ngCookies',
    'restangular',
    'templates-app',
    'templates-components',
    'ApplicationConfiguration',
    'fh.landing',
    'fh.home',
    'olci.directives.pageTitle',
    'olci.directives.halHeader',
    'olci.directives.checkinProgress',
    'olci.directives.itineraryPhoto',
    'olci.directives.modals',
    'olci.directives.modals.errorModal',
    'olci.directives.modals.login',
    'olci.services.AuthService',
    'olci.services.AnalyticsService',
    'olci.services.RoutingUtilsService',
    'olci.services.RegExpService',
    'olci.services.SharedDataService',
    'olci.services.TimeUtilsService',
    'olci.services.FindImageService',
    'olci.services.GetCopyService',
    'olci.services.FocusService',
    'olci.services.ChangePageService',
    'olci.services.DataTransformService',
    'olci.services.FrontEndLinkService',
    'olci.services.StaleSessionService',
    'olci.services.HttpInterceptorService',
    'olci.services.BrowserService',
    'vendor.steelToe',
    'base64',
    'angular-momentjs'
])

    .config(function($urlRouterProvider, RestangularProvider, Configuration, $uiViewScrollProvider, $httpProvider, $translateProvider, $compileProvider) {

        // TODO: This is needed for the Call/Chat buttons in the header. Just like on homepage:
        // https://halprdgit01.hq.halw.com:8443/projects/WA/repos/marketinghomepage/browse/src/app/app.js
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|javascript):/);

        RestangularProvider.setBaseUrl('/api');
        RestangularProvider.setDefaultHttpFields({
            withCredentials: true,
            timeout: Configuration.timeoutInMillis,
            cache: true
        });
        RestangularProvider.setDefaultHeaders({
            'Client-Id': Configuration.halPorta.clientId
        });

        $urlRouterProvider.when('', '/landing').otherwise('/landing');

        // scrolls to top of page on state change
        $uiViewScrollProvider.useAnchorScroll();

        // // initialize $translateProvider
        // $translateProvider.useStaticFilesLoader({
        //     prefix: "assets/i18n/locale-",
        //     suffix: ".json"
        // });

        // $translateProvider.preferredLanguage('en');
        // $translateProvider.fallbackLanguage('en');

    })
    .run(function($rootScope, 
        Configuration, 
        $state, 
        $sessionStorage, 
        $translate, 
        ChangePageService, 
        DataTransformService, 
        AuthService, 
        $cookies, 
        FindImageService, 
        HttpInterceptorService, 
        StaleSessionService, 
        ModalService, 
        $location, 
        steelToe) {

        $rootScope.appName = Configuration.appName;
        $rootScope.companyCode = Configuration.companyCode;


        // $state.go('findBooking'); //delete before committing

        //auth check every time the state/page changes
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            // $rootScope.stateChangeAuthCheck(event, toState, toParams, fromState, fromParams);
        });


        // $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState) {

        //     $translate(toState.pageTitle)
        //         .then(function( pageTitle ) {
        //             $rootScope.pageTitle = pageTitle;
        //         })
        //         .catch(function( pageTitle ) {
        //             $rootScope.pageTitle = 'Holland America Line';
        //         });

        //         // 'From page' has been visited so set cookie.
        //         // TODO: Add per person in booking.
        //         if ( fromState.name && $sessionStorage.bookingInfo) {
        //             // Need to check that user is not on guestSelect page.
        //             if ( ChangePageService.getPages().slice(1).indexOf( toState.name ) !== -1 ) {
        //                 $sessionStorage.bookingInfo.guest.forEach( function ( guest, index, arr ) {
        //                     if ( $rootScope.selectGuestFilter( guest.seqNumber ) ) {
        //                         $cookies[ $sessionStorage.bookingInfo.bookingNumber + guest.seqNumber + fromState.name + 'Visited' ] = 'true';
        //                     }
        //                 });
        //             }
                    
        //         }
        // });


        //EVENT BANK
        /*$rootScope.$on('auth-login-success', function(event, args) {
            var bookingInfo = DataTransformService.serializePolar($sessionStorage.polar);
            $sessionStorage.bookingInfo = DataTransformService.serializeWebDb($sessionStorage.webDb, bookingInfo);
            $rootScope.setMarinerImg($sessionStorage.bookingInfo.guest[0].pastGuestLoyalty);
            $rootScope.setMainName($sessionStorage.bookingInfo.guest[0]);
            // $sessionStorage.bookingInfo = bookingInfoAndWeb
            $state.go('selectGuest');
        });

        $rootScope.$on('auth-logout-success', function(event, args) {

        });*/

        $rootScope.isHal = function () {
            return Configuration.companyCode === 'HAL';
        };

        $rootScope.isSbn = function () {
            return Configuration.companyCode === 'SBN';
        };



    })

    .constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });
