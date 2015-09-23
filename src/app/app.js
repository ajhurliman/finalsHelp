(function () {
    'use strict';
})();

angular.module('fh', [
    'ngStorage',
    'cgBusy',
    'ui.router',
    'ui.bootstrap',
    'ui.bootstrap.showErrors',
    'ui.utils',
    'restangular',
    'templates-app',
    'templates-components',
    'ApplicationConfiguration',
    'fh.landing',
    'fh.home',
    'fh.search',
    'fh.directives.halHeader',
    'fh.directives.modals.showPdfModal',
    // 'fh.directives.modals',
    'fh.services.FocusService',
    'vendor.steelToe',
    'base64',
    'angular-momentjs'
])

    .config(function($urlRouterProvider, RestangularProvider, Configuration, $uiViewScrollProvider, $httpProvider) {

        RestangularProvider.setBaseUrl('/api');
        RestangularProvider.setDefaultHttpFields({
            withCredentials: true,
            timeout: Configuration.timeoutInMillis,
            cache: true
        });

        $urlRouterProvider.when('', '/landing').otherwise('/landing');

        // scrolls to top of page on state change
        $uiViewScrollProvider.useAnchorScroll();

    })
    .run(function($rootScope, 
        Configuration, 
        $state, 
        $sessionStorage) {

        $rootScope.appName = Configuration.appName;
        $rootScope.companyCode = Configuration.companyCode;


        $state.go('search');

        //auth check every time the state/page changes
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
            // $rootScope.stateChangeAuthCheck(event, toState, toParams, fromState, fromParams);
        });


        //EVENT BANK
        /*
        $rootScope.$on('auth-logout-success', function(event, args) {
        });*/



    })

    .constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });
