/*
 * RoutingUtilsService.spec.js
 *
 * Created: Tuesday, February 11, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


describe('RoutingUtilsService section', function() {
    var service, appName, baseDomain, bookingDomain, Configuration;

    beforeEach(function() {
        module('olci.services.RoutingUtilsService');
        module('ApplicationConfiguration');

        inject(function(RoutingUtilsService, _Configuration_) {
            service = RoutingUtilsService;
            Configuration = _Configuration_;
            appName = Configuration.companyCode;

            baseDomain = (appName == 'SBN'?'qa.seabourn.com':'qa.hollandamerica.com');
            bookingDomain = (appName == 'SBN'?'testbook.seabourn.com':'testbook.hollandamerica.com');
        });
    });

    it('should load', function() {
        expect( service ).toBeDefined();
    });

    describe('frontendBaseUrl()', function() {
        it('should exist', function() {
            expect(service.frontendBaseUrl).toBeDefined();
        });

        it('handles null', function() {
            var actual = service.frontendBaseUrl(null);

            expect(actual).toEqual('');
        });

        it('returns a base url appended with the passed in arg', function() {
            var actual = service.frontendBaseUrl('/newPath');
            expect(actual).toEqual('https://'+baseDomain+'/newPath');
        });
    });

    describe('frontendBookingUrl()', function() {
        it('should exist', function() {
            expect(service.frontendBookingUrl).toBeDefined();
        });

        it('handles null', function() {
            var actual = service.frontendBookingUrl(null);

            expect(actual).toEqual('');
        });

        it('returns a base url appended with the passed in arg', function() {
            Configuration.frontendBooking.baseUrl = "https://"+bookingDomain;
            var actual = service.frontendBookingUrl('/newPath');
            expect(actual).toEqual('https://'+bookingDomain+'/newPath');
        });
    });
});

