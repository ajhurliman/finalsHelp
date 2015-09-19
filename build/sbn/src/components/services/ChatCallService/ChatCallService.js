/*
 * ChatCallService.js
 *
 * Created: Tuesday, September 09, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc overview
 * @name homePage.services.ChatCallService
 * @description An empty module description. Please fill in a high level description of this module.
 */
angular.module('olci.services.ChatCallService', [
    'olci.services.FrontEndLinkService'

])

/**
 * @ngdoc service
 * @name homePage.services.ChatCallService
 * @description An empty service description. Please fill in a high level description of this service.
 */
    .service('ChatCallService', function ($q, $http, FrontEndLinkService) {
        
        var loadedChatCallData = null;
        var loadChatCallPromise = false;

        var loadChatCallData = function(mainMenuItem, subMenuItem, requestPage, force){
            var self = this;
            var deferred = $q.defer();
            // var urlRequest = FrontEndLinkService.getChatCallTemplate();
            var urlRequest = '/olci/frontend/main/LoadChatCallData.action';
            
            if(loadChatCallPromise) {
                return loadChatCallPromise;
            }

            $http({
                url: urlRequest,
                method: "POST",
                data: "mainMenuItem=" + encodeURIComponent(mainMenuItem) + "&subMenuItem=" + encodeURIComponent(subMenuItem) + "&requestPage=" + encodeURIComponent(requestPage),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
                }
            }).success(function(data, status, headers, config){
                self.loadedChatCallData = data;
                deferred.resolve(data);
            }).error(function(data, status, headers, config){
                deferred.reject(data);
            });

            loadChatCallPromise = deferred.promise;
            return deferred.promise;
        };
        
        return {

            getChatCallData: function(mainMenuItem, subMenuItem, requestPage) {
                var deferred = $q.defer();
                
                if (loadedChatCallData) {
                    deferred.resolve(loadedChatCallData);
                } else {
                    loadChatCallData(mainMenuItem, subMenuItem, requestPage).then(
                        function(data) {
                            deferred.resolve(data);
                        }
                    );
                }

                return deferred.promise;
            }
        };
    });
