/*
 * FindBookingService.spec.js
 *
 * Created: Thursday, March 13, 2014
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
/*
describe('FindBookingService module', function() {
    var httpBackend,
        findBookingService,
        sessionStorage,
        credentials = {
            bookingNumber: '3253433',
            lname: 'Gough-Home',
            travelAgent: ''
        },
        sessionStorage,
        booking = {
            user: {
                firstName: 'Joseph',
                lastName: 'Testing-Surname'
            }
        };

    beforeEach(function() {
        module('olci.services.FindBookingService', 'ui.router', function($provide) {

            // mock of sessionStorage
            sessionStorage = function () { return {}};

            $provide.value('$http', httpBackend);
            $provide.value('$sessionStorage', sessionStorage);

        });

        inject(function(_FindBookingService_, $httpBackend) {
            findBookingService = _FindBookingService_;
            $httpBackend.when('GET', '/api/user').respond(booking)
        });
    });

    //beforeEach(inject(function($injector) {
    //
    //    httpBackend = $injector.get('$httpBackend');
    //    httpBackend.when('GET', '/api/user').respond(booking)
    //
    //    // mock of sessionStorage
    //    sessionStorage = function () { return {}};
    //
    //    module(function($provide) {
    //        // Tell Angular to replace dependency request for first parameter with the second parameter
    //        $provide.value('$http', httpBackend);
    //        $provide.value('$sessionStorage', sessionStorage);
    //    });
    //
    //}));

    afterEach(function() {
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    describe('FindBookingService', function() {
        it('should contain findBooking',
            inject(function(findBookingService) {
                expect(findBookingService).not.to.equal(null);
            }));

        //it(' should find a booking', function() {
        //    // setup FindBookingService.findBooking return value
        //    httpBackend.when('GET', '/api/user/').respond(booking);
        //    findBookingService.findBooking(credentials)
        //        .then(function(data){
        //            console.log(data);
        //            expect()
        //        });
        //});
    });
});
*/
