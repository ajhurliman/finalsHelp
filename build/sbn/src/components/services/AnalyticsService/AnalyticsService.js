/*
 * AnalyticsService.js
 *
 * Created: Tuesday, February 3, 2015
 * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name olci.services.AnalyticsService
 * @description Performs analytics tasks
 * @requires restangular
 * @requires olci.services.AuthService (opt?)
 * @requires olci.services.RoutingUtilsService (opt?)
 * @requires olci.filters.PortNameFilter (opt?)
 */

angular.module( 'olci.services.AnalyticsService', [])

/**
 * @ngdoc service
 * @name olci.services.AnalyticsService
 * @description Used for Tealeaf and WebTrends events, among others.
 */
.service('AnalyticsService', [ '$window', '$document', '$injector', function($window, $document, $injector) {
        var self = {

            /**
             * @ngdoc getBrowserData
             * @name olci.services.AnalyticsService#getBrowserData
             * @methodOf olci.services.AnalyticsService
             * @returns {object} Useful browser information.
             */
            getBrowserData: function() {
                return {
                    navigator: {
                        platform: $window.navigator.platform,
                        product: $window.navigator.product,
                        productSub: $window.navigator.productSub,
                        vendor: $window.navigator.vendor
                    }
                };
            },

            /**
             * @ngdoc logStateChange
             * @name olci.services.AnalyticsService#logStateChange
             * @methodOf olci.services.AnalyticsService
             * @description Logs a state change event to the analytics providers
             * @param {object} toState The toState from the stateChangeSuccess method
             * @param {object} toParams The toParamms from the stateChangeSuccess method
             * @param {object} fromState The fromState from the stateChangeSuccess method
             * @param {object} fromParams The fromParams from the stateChangeSuccess method
             */
            logStateChange: function(toState, toParams, fromState, fromParams) {
                var data = {
                    referrer: $document.referrer || "",
                    toState: {
                        name: toState.name,
                        url: toState.url,
                        fullUrl: $window.location.href,
                        params: fromParams
                    },
                    fromState: {
                        name: fromState.name,
                        url: fromState.url,
                        params: fromParams
                    }
                };

                self.logCustomEvent('pageView: '+toState.name, data);
            },

            /**
             * @ngdoc logStateChangeError
             * @name olci.services.AnalyticsService#logStateChangeError
             * @methodOf olci.services.AnalyticsService
             * @description Logs a state change error event to the analytics providers
             * @param {object} toState The toState from the stateChangeError method
             * @param {object} toParams The toParamms from the stateChangeError method
             * @param {object} fromState The fromState from the stateChangeError method
             * @param {object} fromParams The fromParams from the stateChangeError method
             * @param {object} error The error from the stateChangeError method
             */
            logStateChangeError: function(toState, toParams, fromState, fromParams, error) {
                var data = {
                    referrer: $document.referrer,
                    toState: {
                        name: toState.name,
                        url: toState.url,
                        fullUrl: $window.location.href,
                        params: fromParams
                    },
                    fromState: {
                        name: fromState.name,
                        url: fromState.url,
                        params: fromParams
                    },
                    error: error
                };

                self.logCustomEvent('pageView Error: '+toState.name, data);
            },

            /**
             * @ngdoc logCustomEvent
             * @name olci.services.AnalyticsService#logCustomEvent
             * @methodOf olci.services.AnalyticsService
             * @description Logs a custom event to the analytics providers
             * @param {string} eventName An event name to identify the event
             * @param {object} data Any JSON serializable data object to be logged by the analytics software
             */
            logCustomEvent: function(eventName, data) {
                if(!data) { data={}; }
                // angular.extend(data, self.getBrowserData());
                
                if($window.TLT && $window.TLT.isInitialized()) {
                    $window.TLT.logCustomEvent(eventName, data);
                }

                data.eventName = eventName;

                if($window.ensDL) {
                    $window.ensDL(data);
                }
            },

            logScreenviewLoad: function(viewName, altInfo) {
                if($window.TLT && $window.TLT.isInitialized()) {
                    $window.TLT.logScreenviewLoad(viewName, altInfo);
                }

                if($window.ensDL) {
                    $window.ensDL({
                        eventName: 'ScreenView',
                        name: viewName,
                        referrer: altInfo
                    });
                }
            },

            /**
             * @ngdoc logCustomPageView
             * @name analytics.services.AnalyticsService#logCustomPageView
             * @methodOf analytics.services.AnalyticsService
             * @description Logs a custom page view to the analytics providers
             * @param {string} pageName The page being viewed.
             * @param {object} data Any JSON serializable data object to be logged by the analytics software
             */
            logCustomPageView: function(pageName, data){
                self.logCustomEvent('PageView: ' + pageName, data);
            },

            /**
             * @ngdoc flush
             * @name olci.services.AnalyticsService#flush
             * @methodOf olci.services.AnalyticsService
             * @description Flushes the queues of the analytics tools, sending the data to the external services.
             */
            flush: function() {
                if($window.TLT) { $window.TLT.flushAll(); }
            },

            /**
             * @ngdoc _cleanLogInfo
             * @name olci.services.AnalyticsService#_cleanLogInfo
             * @methodOf olci.services.AnalyticsService
             * @description Private function that removes certain private variables and data that should not be logged.
             */
            _cleanLogInfo: function(request) {
                var logInfo = angular.copy(request, {});
                var authenticationRequestMatcher = new RegExp(/olci\/api\/authentication/);

                //delete some angular-specific methods
                if(logInfo.transformRequest) { delete logInfo.transformRequest; }
                if(logInfo.transformResponse) { delete logInfo.transformResponse; }

                if(logInfo.data) {
                    //we don't log credit card numbers
                    if(logInfo.data.ccNumber) { delete logInfo.data.ccNumber; }

                    //we don't log passwords
                    if(authenticationRequestMatcher.test(request.url) && typeof logInfo.data == "string") {
                        logInfo.data = logInfo.data.replace(/&secret=.*/, "&secret=xxxx");
                    }
                }
                return logInfo;
            },

            /**
             * @ngdoc logAPIRequest
             * @name olci.services.AnalyticsService#logAPIRequest
             * @methodOf olci.services.AnalyticsService
             * @description Logs API requests.
             */
            logAPIRequest: function(data) {
                var logInfo;
                var apiRequestMatcher = new RegExp(/olci\/api/);

                if (apiRequestMatcher.test(data.url)) {
                    //Makes sure we don't log templates
                    //overwrite logInfo with a cleaned version
                    logInfo = self._cleanLogInfo(data);
                    self.logCustomEvent("APIRequest", logInfo);
                }
            },

            /**
             * @ngdoc logAPIResponse
             * @name olci.services.AnalyticsService#logAPIResponse
             * @methodOf olci.services.AnalyticsService
             * @description Logs API responses.
             */
            logAPIResponse: function(data) {
                var apiRequestMatcher = new RegExp(/olci\/api/);

                if (apiRequestMatcher.test(data.config.url)) {
                    self.logCustomEvent("APIResponse", data);
                }
            },

            /**
             * @ngdoc logModalOpenEvent
             * @name olci.services.AnalyticsService#logModalOpenEvent
             * @methodOf olci.services.AnalyticsService
             * @param {object} data The arguments used to open the modal.
             * @description Logs Modal open events.
             */
            logModalOpenEvent: function(data) {
                var copiedData = {};
                angular.copy(data, copiedData);

                var modalName = data.windowClass || data.controller;
                modalName += ( modalName !== data.controller ? ' ' + data.controller : '' );
                var $state = $injector.get('$state');
                if ($state.current) {
                    copiedData.stateName = $state.current.name;
                }

                self.logCustomEvent("ModalOpen: " + modalName, copiedData);
            },


            /**
             * @ngdoc logModalOpenEvent
             * @name olci.services.AnalyticsService#logModalOpenEvent
             * @methodOf olci.services.AnalyticsService
             * @param {object} data The arguments used to open the modal.
             * @description Logs Modal open events.
             */
            logModalCloseEvent: function(data) {
                var modalName = data.windowClass || data.controller;
                modalName += ( modalName !== data.controller ? ' ' + data.controller : '' );
                var $state = $injector.get('$state');
                if($state.current) {
                    data.stateName = $state.current.name;
                }
                self.logCustomEvent("ModalClose: "+modalName, data);
            }
        };

        return self;
    }
]);