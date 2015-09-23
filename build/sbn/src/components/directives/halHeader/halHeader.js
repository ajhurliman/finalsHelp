/*
 * halHeader.js
 *
 * Created: Monday, February 03, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @name olci.directives.halHeader
 * @description This module populates the header, which may or may not include the pnav.
 */
angular.module('fh.directives.halHeader', [
    'ngStorage',
    'ApplicationConfiguration'
])

/**
 * @ngdoc directive
 * @name olci.directives.halHeader
 * @restrict A
 * @element ANY
 * @description An empty directive description. Please fill in a high level description of this
 *     directive.
 * @example
 *
 <pre>
    <div id="hal-header" hal-header primary-guest="primaryGuest" logout="logout()"></div>
 </pre>
 <example>
     <file name="halHeader.html">
        Place rendered HTML here.
     </file>
 </example>
 *
 */

.directive('halHeader', function factory() {
    return {
        restrict: 'A',
        replace: true,
        templateUrl: 'directives/halHeader/halHeader.tpl.html',
        controller: function() {

        }
    };
});