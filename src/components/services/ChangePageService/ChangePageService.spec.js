describe('Change Page Service', function () {
    var service, $httpBackend, q, scope, $timeout;

    beforeEach( function () {
        module('olci');
        module('olci.services.ChangePageService');

        inject(function(_$rootScope_, ChangePageService, _$q_, _$sessionStorage_, _$timeout_) {
            $rootScope = _$rootScope_;
            service = ChangePageService;
            q = _$q_;
            $sessionStorage = _$sessionStorage_;
            $timeout = _$timeout_;
        });

    });

    describe('nextPage', function() {
        beforeEach( function (done) {
            spyOn(service, 'updatePage').and.callThrough();
            service.nextPage();
        }); 

        // it('calls updatePage', function () {
        //         expect(service.updatePage).toHaveBeenCalled();
        // });


    });

    describe('updatePage', function() {
        beforeEach( function (done) {
            service.updatePage('details');
        }); 
    
        // it('calls updatePage', function () {
        //     expect(currPage).toBe(1);
        // });


    });
});
