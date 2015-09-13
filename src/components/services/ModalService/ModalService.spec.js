/*
 * ModalService.spec.js
 *
 * Created: Tuesday, May 19, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

 describe('ModalService module', function() {
    var service, $modal, AnalyticsService;

    beforeEach(function() {
        module('olci.services.ModalService');
        module('olci.services.AnalyticsService');

        inject(function(ModalService, _$modal_, _AnalyticsService_) {
            service = ModalService;
            $modal = _$modal_;
            AnalyticsService = _AnalyticsService_;
        });

        spyOn($modal, 'open');
        spyOn(AnalyticsService, 'logModalOpenEvent');
        spyOn(AnalyticsService, 'logModalCloseEvent');
    });

    it('should load', function() {
        expect(service).toBeDefined();
    });

    it('should determine if a modal is open or not', function() {
        expect(service.isModalOpen()).toBe(false);
    });

    describe('openModal()', function() {
        var reply;
        var expected = {foo: 'bar'};

        beforeEach(function() {
            $modal.open.and.returnValue(expected);
            reply = service.openModal({template: '<div></div>'});
        });

        it('should have created a modal object', function() {
            expect(reply).toBe(expected);
        });

        it('should remember that a modal was opened', function() {
            expect(service.isModalOpen()).toBe(true);
        });

    });


    describe('closeModal()', function() {
        it('should do nothing if called prematurely', function() {
            expect(service.closeModal()).toBe(false);
        });

        describe('after opening a modal', function() {
            var modalSpy;

            beforeEach(function() {
                modalSpy = {
                    dismiss: function() {}
                };

                spyOn(modalSpy, 'dismiss');
                modalSpy.dismiss.and.callThrough();
                
                $modal.open.and.returnValue(modalSpy);

                service.openModal({ template: '<div></div>'});
                service.closeModal();
            });

            it('should have closed the modal', function() {
                expect(modalSpy.dismiss).toHaveBeenCalled();
            });

            it('should report that the modal is now closed', function() {
                expect(service.isModalOpen()).toBe(false);
            });

            it('should not error out on additional calls', function() {
                expect(service.closeModal()).toBe(false);
            });

            it('should allow subsequent openModal calls', function() {
                $modal.open.and.returnValue('foo');

                expect(service.openModal({template: '<div></div>'})).toBe('foo');
            });
        });
    });

 });