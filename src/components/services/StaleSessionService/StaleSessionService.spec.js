// /*
//  * StaleSessionService.spec.js
//  *
//  * Created: Wednesday, February 12, 2014
//  * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
//  * This is unpublished proprietary source code of Holland America, Inc.
//  * The copyright notice above does not evidence any actual or intended
//  * publication of such source code.
//  */

// /**
//  * Tests sit right alongside the file they are testing, which is more intuitive
//  * and portable than separating `src` and `test` directories. Additionally, the
//  * build process will exclude all `.spec.js` files from the build
//  * automatically.
//  */
// describe( 'StaleSessionService section', function() {
//     var scope, ssService, loginService, modalService, state, authService, q, httpBackend, cookies, timeout, StorageService;

//     beforeEach( module( function($provide) {
//         $window = {
//             location: {}
//         };
//         // Mock out $window to prevent full page reloads. Karma doesn't like those.
//         $provide.constant( '$window' , $window );
//     }));

//     beforeEach(function(){
//         module('olci.services.StaleSessionService');
//         // module('olci.services.LoginService');
//         module('ui.router');
//         // module('olci.services.TravelOptionsService');
//         module('olci.services.ModalService');
//         module('olci.services.AuthService');
//         // module('common.services.StorageService');
//         module('ngCookies');

//         inject(function($timeout, _$cookies_, $window, $q, AuthService, $state, StaleSessionService, Configuration, LoginService, ModalService, _StorageService_) {
//             ssService = StaleSessionService;
//             authService = AuthService;
//             loginService = LoginService;
//             modalService = ModalService;
//             StorageService = _StorageService_;

//             state = $state;
//             q = $q;
//             cookies = _$cookies_;
//             timeout = $timeout;

//             spyOn(authService,'logout').and.returnValue(q.when());
//             spyOn(loginService,'logout').and.returnValue(q.when());
//             spyOn(authService,'verify').and.callThrough();
//             spyOn(ssService,'resetStaleSessionTimer').and.callThrough();
//             spyOn(modalService,'openModal');
//             spyOn(ssService,'callStaleSessionModal').and.callThrough();
//         });
//     });

//     describe('resolves the promises', function(){
//         beforeEach(function() {
//             spyOn(authService,'recoverSession').and.returnValue(q.when());
//         });

//         // it('calling endSession should call loginService.logout', function() {
//         //     ssService.endSession();
//         //     timeout.flush();
//         //     expect(loginService.logout).toHaveBeenCalled();
//         // });

//         it('should check the auth token when trying to continueSession', function() {
//             StorageService.setItem('token', 12345);
//             ssService.continueSession();
//             timeout.flush();
//             expect(authService.recoverSession).toHaveBeenCalled();
//             expect(ssService.resetStaleSessionTimer).toHaveBeenCalled();
//         });

//         it('authService.recoverSession should be called by ssService.continueSession', function() {
//             StorageService.setItem('token', 12345);
//             ssService.continueSession();
//             expect(authService.recoverSession).toHaveBeenCalled();
//         });

//         it('when you are on the login page the modal should not be opened', function() {
//             state.current.name = 'login';

//             ssService.callStaleSessionModal();
//             expect(ssService.resetStaleSessionTimer).toHaveBeenCalled();
//             expect(modalService.openModal).not.toHaveBeenCalled();
//         });

//         it('should call callStaleSessionModal', function() {

//             ssService.callStaleSessionModal();
//             expect(ssService.callStaleSessionModal).toHaveBeenCalled();
//             expect(modalService.openModal).toHaveBeenCalled();
//         });

//         it('should call resetStaleSessionTimer', function(){
//             ssService.resetStaleSessionTimer();
//             expect(ssService.staleSessionTimer).not.toEqual(null);
//         });
//     });

//     describe('rejects the promise', function() {
//         beforeEach(function () {
//             spyOn(authService, 'recoverSession').and.returnValue(q.reject());
//         });

//         it('when continue session is called and authservice fails, it should not call reset timer', function() {
//             ssService.continueSession();
//             timeout.flush();
//             expect(authService.recoverSession).toHaveBeenCalled();
//             expect(ssService.resetStaleSessionTimer).not.toHaveBeenCalled();
//         });
//     });

// });

