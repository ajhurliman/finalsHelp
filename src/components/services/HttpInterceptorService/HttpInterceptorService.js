/*
 * HttpInterceptorService.js
 *
 * Created: Thursday, December 15, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name olci.services.HttpInterceptorService
 * @description Provide a place to intercept and broadcast http requests
 */
angular.module('olci.services.HttpInterceptorService', [
    'olci.services.BrowserService',
    // 'analytics.services.AnalyticsService'
])

.service('HttpInterceptorService', function (BrowserService, $cacheFactory, $q, $rootScope) {

    var cache = $cacheFactory.get('$http');
    var apiRequestMatcher = new RegExp(/secondary\/api/);

    var self = {
        request: function(request) {
            if (request.method != "GET") {
                cache.removeAll();
            }

            //caching fix for IE
            if (BrowserService.getBrowserType() === 'ie' &&
                request.method == "GET" &&
                request.url.match(apiRequestMatcher)) {
                request.url += ( !request.url.match(/\?/) ? '?' : '&' ) + "_=" + Date.now();
            }

            return request;
        },
        requestError: function(request) {
            return $q.reject(request);
        },
        response: function(response) {
            // only match responses from successful API calls
            if (response.status==200 && response.config.url.match(apiRequestMatcher)) {
                $rootScope.$broadcast('httpSuccess', response);
            }
            return response;
        },
        responseError: function(response) {
            // AnalyticsService.logAPIResponseError(response.data || response.statusText);
            return $q.reject(response);
        }
    };

    return self;
})

.config(function($httpProvider) {
    $httpProvider.interceptors.push('HttpInterceptorService');
});

