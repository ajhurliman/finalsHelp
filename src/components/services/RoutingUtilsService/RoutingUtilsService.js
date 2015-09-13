/*
 * RoutingUtilsService.js
 *
 * Created: Tuesday, February 11, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name olci.services.RoutingUtilsService
 * @description Shim for generating urls. We should look into using StateProvider for this.
 * @requires ui.router
 * @requires ApplicationConfiguration
 */
angular.module( 'olci.services.RoutingUtilsService', [
    'ui.router',
    'ApplicationConfiguration'
])
.service('RoutingUtilsService', [ '$interpolate', '$filter', 'Configuration', function($interpolate, $filter, Configuration) { return {
    /**
     * Generate a URL for frontend actions
     * @returns {string} an absolute URL for the server request
     */

        /**
         * @ngdoc method
         * @name olci.services.RoutingUtilsService#frontendBaseUrl
         * @methodOf olci.services.RoutingUtilsService
         * @description Generate a URL for frontend actions
         * @param {string} action HTTP verb
         * @returns {string} an absolute URL for the server request
         * @example
         <pre>
            Configuration.frontend.baseUrl + action;
         </pre>
         * */
    frontendBaseUrl: function(action) {
        if (!action) {
            return '';
        } else {
            return Configuration.frontend.baseUrl + action;
        }
    },

    /**
     * Generate a URL for frontend booking
     * @returns {string} an absolute URL for the resource
     */

        /**
         * @ngdoc method
         * @name olci.services.RoutingUtilsService#frontendBookingUrl
         * @methodOf olci.services.RoutingUtilsService
         * @description Generate a URL for frontend booking
         * @param {string} action HTTP verb
         * @returns {string} an absolute URL for the resource
         * @example
         <pre>
         Configuration.frontendBooking.baseUrl + action;
         </pre>
         * */
    frontendBookingUrl: function(action) {
        if (!action) {
            return '';
        } else {
            return Configuration.frontendBooking.baseUrl + action;
        }
    }

};}]);
