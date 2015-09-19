/*
 * StorageService.js
 *
 * Created: Tuesday, March 17, 2015
 * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name common.services.StorageService
 * @description Wrapper on top of localStorage or sessionStorage.
 *
 */
angular.module('olci.services.StorageService', [])
    .service('StorageService', function (){
        var storageService = {
            type: "localStorage",
            setItem: function setItem(key, value){
                if(!window.localStorage || !window.sessionStorage) {
                    throw new Error("REALLY_OLD_BROWSER");
                }
                try {
                    localStorage.setItem( key, value );
                } catch (err) {
                    try { //this should always work
                        storage.type = "sessionStorage";
                        sessionStorage.setItem( key, value );
                    } catch(sessErr){
                        //perhaps use cookies in the future?
                        throw sessErr;
                    }
                }
            },
            getItem: function getItem(key){
                return window[storageService.type].getItem(key);
            },
            removeItem: function removeItem(key){
                return window[storageService.type].removeItem(key);
            }
        };
        return storageService;
    });