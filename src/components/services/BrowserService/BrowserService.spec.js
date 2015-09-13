/*
 * BrowserService.spec.js
 *
 * Created: Thursday, January 7, 2015
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * Tests sit right alongside the file they are testing, which is more intuitive
 * and portable than separating `src` and `test` directories. Additionally, the
 * build process will exclude all `.spec.js` files from the build
 * automatically.
 */
describe( 'BrowserService section', function() {
    var service, windowmock;


    beforeEach(function() {

        windowmock = {
            navigator: {userAgent: "foo" }
        };

        module('olci.services.BrowserService', function($provide) {
            $provide.value('$window',windowmock);
        });

        inject(function(BrowserService) {
            service = BrowserService;
        });

    });

    describe('getBrowserType function', function() {

        it('should return unknown for unknown browsers', function () {
            expect(service.getBrowserType()).toEqual("unknown");
        });

        it('should not return unknown for known browsers', function() {
            windowmock.navigator.userAgent = "chrome";
            expect(service.getBrowserType()).not.toEqual("unknown");
        });

        it('should have the browser type cached as a property', function() {
            service.getBrowserType();
            service.getBrowserType();
            expect(service._browserType).not.toEqual(undefined);
        });

    });

});
