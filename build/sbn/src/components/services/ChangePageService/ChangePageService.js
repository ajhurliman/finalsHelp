

/**
 * @ngdoc service
 * @name olci.services.ChangePageService
 * @description Service that changes page and all associated logic.
 */
angular.module('olci.services.ChangePageService', [
    'ui.router',
    'ngStorage',
    'ApplicationConfiguration'
])

.factory('ChangePageService', function($state, $sessionStorage, $q, $rootScope, Configuration) {

    var pages = (Configuration.companyCode === 'HAL') ?
    [
        'selectGuest',
        'details',
        'flights',
        'emergency',
        'account',
        'contract',
        'summary'
    ] : [
        'selectGuest',
        'details',
        'flights',
        'emergency',
        'account',
        'contract',
        'preferences',
        'summary'
    ];


    return {
        /**
         * @ngdoc method
         * @name olci.services.ChangePageService#nextPage
         * @methodOf olci.services.ChangePageService
         * @description Changes state to next page in pages array.
         * */
        nextPage: function () {
            var currStateIndex = pages.indexOf( $state.current.name );
            $state.go( pages[currStateIndex + 1] );
        },

        /**
         * @ngdoc method
         * @name olci.services.ChangePageService#getPages
         * @methodOf olci.services.ChangePageService
         * @description Returns array of page names.
         * */
        getPages: function () {
            return pages;
        }

        /**
         * @ngdoc method
         * @name olci.services.ChangePageService#goToPage
         * @methodOf olci.services.ChangePageService
         * @description Changes state to specified page.
         * */
        // goToPage: function( pageName ) {
        //     $state.go( pageName );
        // },

        /**
         * @ngdoc method
         * @name olci.services.ChangePageService#updatePage
         * @methodOf olci.services.ChangePageService
         * @description Updates current page.
         * */
        // updatePage: function( pageName ) {
        //     currPage = pages.indexOf(pageName);
        // }

        // TODO: Logic for Barclay's offer
        // TODO: Logic for when user clicks 'continue' and session has expired?

    };
});
