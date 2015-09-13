/*
 * AnalyticsService.spec.js
 *
 * Created: Tuesday, April 21, 2015
 * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */
describe('Analytics Service', function() {
    var service, toState, toParams, fromState, fromParams, $window, $state;

    beforeEach(function() {
        module('olci.services.AnalyticsService');
        module('ui.router');

        toState = {
            'name': 'target',
            'url': '/target'
        };

        fromState = {
            'name': 'source',
            'url': '/source'
        };

        toParams = {};
        fromParams = {};

        inject(function (_$window_, AnalyticsService, _$state_) {
            service = AnalyticsService;
            $window = _$window_;
            $state = _$state_;

            $window.TLT = {
                logCustomEvent: function() {},
                logScreenviewLoad: function() {},
                flushAll: function() {},
                isInitialized: function() {
                    return true;
                }
            };

            $window.ensDL = function() {};
            spyOn($window.TLT, 'logCustomEvent');
            spyOn($window.TLT, 'logScreenviewLoad');
            spyOn($window.TLT, 'flushAll');
            spyOn($window, 'ensDL');
        });
    });

    it('should load', function() {
        expect(service).toBeDefined();
    });

    it('should get browser data', function() {
        expect(service.getBrowserData().navigator.platform).toBeDefined();
    });

    it('should log a custom event', function() {
        var data = { "test": true };

        service.logCustomEvent('customEvent', data);

        angular.extend(data, service.getBrowserData());
        data.eventName = 'customEvent';
        expect($window.TLT.logCustomEvent).toHaveBeenCalledWith('customEvent', data);
        expect($window.ensDL).toHaveBeenCalledWith(data);
    });

    it('should log a state change', function() {
        spyOn(service, 'logCustomEvent');

        service.logStateChange(toState, toParams, fromState, fromParams, {});

        expect(service.logCustomEvent).toHaveBeenCalled();
    });

    it('should flush the logs', function() {
        service.flush();
        expect($window.TLT.flushAll).toHaveBeenCalled();
    });

    describe('log API requests', function() {
        var request;
        beforeEach(function() {
            request = {
                url: '/olci/api',
                data: {
                    ccNumber: '1234'
                },
                transformRequest: function() {},
                transformResponse: function() {}
            };
        });

        it('should remove transforms', function() {
            var info = service._cleanLogInfo(request);
            expect(info.transformRequest).not.toBeDefined();
            expect(info.transformResponse).not.toBeDefined();
        });

        it('should remove ccNumber', function() {
            var info = service._cleanLogInfo(request);
            expect(info.data.ccNumber).not.toBeDefined();
        });

        it('should not remove secret for non-authentication URL', function() {
            request.url = '/test/url';
            request.data = 'bookingNumber=12345&secret=abcde';
            var expected = {
                url: '/test/url',
                data: 'bookingNumber=12345&secret=abcde'
            };
            var info = service._cleanLogInfo(request);
            expect(info).toEqual(expected);
        });

        it('should remove secret for authentication request', function() {
            request.url = '/olci/api/authentication';
            request.data = 'bookingNumber=12345&secret=abcde';
            var info = service._cleanLogInfo(request);
            expect(info.data).toEqual('bookingNumber=12345&secret=xxxx');
        });

        it('should log API requests', function() {
            spyOn(service, 'logCustomEvent');
            var expected = {
                url: '/olci/api',
                data: {}
            };
            service.logAPIRequest(request);
            expect(service.logCustomEvent).toHaveBeenCalledWith('APIRequest', expected);
        });

        it('should not log non-API requests', function() {
            spyOn(service, 'logCustomEvent');
            request.url = '/olci/notAnAPI';
            service.logAPIRequest(request);
            expect(service.logCustomEvent).not.toHaveBeenCalled();
        });
    });

    describe('logging API responses', function() {
        it('should log the full API response', function() {
            spyOn(service, 'logCustomEvent');
            var response = {
                config: {
                    url: '/olci/api'
                },
                test: 'blah'
            };

            service.logAPIResponse(response);
            expect(service.logCustomEvent).toHaveBeenCalledWith('APIResponse', response);
        });
    });

    describe('log page view', function() {
        it('should log a page view', function() {
            spyOn(service, 'logCustomEvent');
            var data = {
                test: 'blah'
            };
            service.logCustomPageView('TEST', data);
            expect(service.logCustomEvent).toHaveBeenCalledWith('PageView: TEST', data);
        });
    });

    describe('logModalCloseEvent method', function() {
        var data;
        beforeEach(function() {
            data = {
                'controller': 'testController'
            };
        });

        it('should log a modal open event', function() {
            spyOn(service, 'logCustomEvent');
            data.windowClass = 'blah';
            service.logModalOpenEvent(data);
            expect(service.logCustomEvent).toHaveBeenCalledWith('ModalOpen: blah testController', {
                'controller': 'testController',
                'windowClass': 'blah',
                'stateName': ''
            });
        });

        it('should log a modal open event with a controller name', function() {
            spyOn(service, 'logCustomEvent');
            service.logModalOpenEvent(data);
            expect(service.logCustomEvent).toHaveBeenCalledWith('ModalOpen: testController', {
                'controller': 'testController',
                'stateName': ''
            });
        });

        it('should log a modal close event', function() {
            spyOn(service, 'logCustomEvent');
            data.windowClass = 'blah';
            service.logModalCloseEvent(data);
            expect(service.logCustomEvent).toHaveBeenCalledWith('ModalClose: blah testController', data);
        });

        it('should log a modal close event with a controller name', function() {
            spyOn(service, 'logCustomEvent');
            service.logModalCloseEvent(data);
            expect(service.logCustomEvent).toHaveBeenCalledWith('ModalClose: testController', data);
        });
    });
    
    describe('logScreenviewLoad method', function() {
        it('logs a screen view for TLT', function() {
            service.logScreenviewLoad('testName', 'testInfo');
            expect($window.TLT.logScreenviewLoad).toHaveBeenCalledWith('testName', 'testInfo');
        });
    });

});
