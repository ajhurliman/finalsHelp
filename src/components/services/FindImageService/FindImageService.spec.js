describe('Find Image Service', function() {
    var service, $httpBackend, q, scope, $timeout;

    beforeEach(function() {
        module('olci.services.FindImageService');

        inject(function(_$rootScope_, FindImageService, _$httpBackend_, _$q_, _$sessionStorage_, _$timeout_) {
            $rootScope = _$rootScope_;
            service = FindImageService;
            $httpBackend = _$httpBackend_;
            q = _$q_;
            $sessionStorage = _$sessionStorage_;
            $timeout = _$timeout_;
        });
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should load', function() {
        expect(service).toBeDefined();
    });

    describe('itineraryImage function', function() {

        it('should exist', function() {
            expect(service.itineraryImage).toBeDefined();
        });

        // beforeEach(function(done) {
        //     $sessionStorage.user = {
        //         polarData: {
        //             displayBookingResponse: {
        //                 destinationId: 'TPW'
        //             }
        //         }
        //     };

        //     imagePath = service.itineraryImage().then(function() {
        //         done();
        //     });
        // });

        // it('should return an image', function() {
        //     expect(imagePath).toEqual('./assets/images/onboard/OLCI_dest_default');
        // });

    });
});