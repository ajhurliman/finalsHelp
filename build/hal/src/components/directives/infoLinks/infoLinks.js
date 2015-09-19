/*
 * infoLinks.js
 *
 * Created: Monday, May 04, 2014
 * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @name olci.directives.infoLinks
 * @description An empty module description. Please fill in a high level description of this module.

 */
angular.module('olci.directives.infoLinks', [
    'pascalprecht.translate',
    'vendor.steelToe',
    'ngStorage',
    'ApplicationConfiguration'
])

    .controller('InfoLinksController', function ( $http, $translate, $scope, steelToe, $sessionStorage, Configuration ) {
        $scope.preTag = 'OCFndInfo';

        $http.get( './assets/infoLinks.json' )
            .then(function( res ) {
                $scope.infoLinks = res.data[ Configuration.companyCode ];
            })
            .catch(function( status ) {
                console.log( status );
            });

        // var linkTexts = [],
        //     linkLinks = [],
        //     linkTags = [],
        //     strDotText = '.text',
        //     strDotLink = '.link',
        //     strDotTag = '.tag',
        //     str;

        // for (var i=1; i <= 15; i++) {
        //     str = 'infoLinks.HAL.item' + ((i<10)?'0':'') + i.toString();
        //     linkTexts.push(str + strDotText);
        //     linkLinks.push(str + strDotLink);
        //     linkTags.push(str + strDotTag);
        // }

        // $scope.infoLinks = [];
        // $translate( linkTexts.concat( linkLinks, linkTags ) )
        //     .then(function(linkStrings) {
        //         var linkKey;
        //         // code assumes that keys are iterated through in alphabetical order!!
        //         for (var key in linkStrings) {
        //             // only work on '.text' keys and skip strings that aren't defined in the locale_en.json
        //             // if the string isn't found in locale_en.json, then value = key
        //             if (key.indexOf(strDotText) !== -1 &&
        //                 key != linkStrings[key]) {
        //                 linkKey = key.replace(strDotText, strDotLink);
        //                 // only create a link if both text and url are found
        //                 if (linkStrings[linkKey]) {
        //                     $scope.infoLinks.push({
        //                         text: linkStrings[key],
        //                         url: linkStrings[linkKey],
        //                         tag: linkStrings[tag]
        //                     });
        //                 }
        //             }
        //         }
        //     });
        // Eliminates the link about Alaska if the cruise isn't going to Alaska
        $scope.isAlaskaFilter = function(link) {
            var includAlaska = steelToe.do($sessionStorage.bookingInfo.guest[0]).get('CheckInPassenger.mktIncludeAlaskaTour');
            if (includAlaska) {
                return (!link.isAlaska);
            } else {
                return true;
            }
        };
    })
/**
 *  @ngdoc directive
 * @name olci.directives.infoLinks
 * @restrict A
 * @element ANY
 * @description An empty directive description. Please fill in a high level description of this directive.
 @example
 <pre>
 <div id="hal-footer" info-links></div>
 </pre>

 <example>

 </example>
 */
    .directive('infoLinks', function factory() {
        return {
            restrict: 'A',
            replace: true,
            controller: 'InfoLinksController',
            templateUrl: 'directives/infoLinks/infoLinks.tpl.html'
        };
    });