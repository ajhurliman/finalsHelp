/*
 * BrowserService.js
 *
 * Created: Wednesday, January 7, 2015
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/*
 * return browser type
 * could be extended to give version as well
 */

angular.module('olci.services.BrowserService', [

])

    .service('BrowserService', function ($window) {

        var self = {

            _browserType: undefined,

            getBrowserType: function() {
                if (self._browserType) {
                    return self._browserType;
                } else {
                    self._browserType = "unknown";
                    var userAgent = $window.navigator.userAgent;
                    // order is important, do not change ordering of these strings
                    var browsers = {
                        safari: /safari/i,
                        chrome: /chrome/i,
                        firefox: /firefox/i,
                        opera: /opr/i,
                        ie: /.NET/
                    };
                    for (var key in browsers) {
                        if (userAgent.match(browsers[key])) {
                            self._browserType = key;
                        }
                    }
                    return self._browserType;
                }
            }

        };

        return self;

    });

