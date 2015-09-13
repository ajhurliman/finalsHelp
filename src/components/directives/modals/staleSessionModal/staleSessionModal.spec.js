// describe('Stale Session', function () {

//     describe('staleSessionModal', function () {
//         var scope, elem, compile, templateCache, translator, modalTemplate, modalService;

//         beforeEach(function () {
//             module('olci.directives.modals');
//             module('olci.directives.modals.staleSessionModal');
//             module('templates-components');
//             module('templates-app');

//             module('pascalprecht.translate', function ($translateProvider) {
//                 translator = $translateProvider;
//                 translator.preferredLanguage('en');
//             });

//             inject(function ($rootScope, $compile, $templateCache, ModalService) {
//                 scope = $rootScope.$new();
//                 modalService = ModalService;
//                 compile = $compile;
//                 templateCache = $templateCache;

//                 elem = angular.element('<div stale-session-modal></div>');

//                 translator.translations('en', {
//                     "login": {
//                         "staleSession": {
//                             "headline": "Your Session Is About To Expire",
//                             "subHeadline": "Are you still there?",
//                             "body": "For security purposes, your on-line session only remains active for approximately 20 minutes without any browser activity.",
//                             "continue": "Continue Session",
//                             "logout": "Log Out"
//                         }
//                     }
//                 });

//                 modalTemplate =
//                     angular.element(templateCache.get('directives/modals/staleSessionModal/staleSessionModal.tpl.html'));

//                 $compile(elem)(scope);
//                 $compile(modalTemplate)(scope);

//                 scope.$digest();
//             });
//         });

//         it('click should open the modal', function () {
//             spyOn(modalService, 'openModal');
//             elem.click();
//             expect(modalService.openModal).toHaveBeenCalled();
//         });

//     });
//     /* end directive  */

//     describe('stale session modal controller', function () {
//         var scope, modalService, compile, ctlr, q, ssService, timeout, authService;

//         beforeEach(function () {
//             module('olci.services.LoginService');
//             // module('olci.services.TravelOptionsService');
//             module('olci.directives.modals');
//             module('olci.directives.modals.staleSessionModal');
//             module('olci.services.StaleSessionService');
//             // module('templates-components');

//             module(function($provide) {
//                 $window = {
//                     location: {}
//                 };
//                 $provide.value('$window',$window);
//             });

//             inject(function (AuthService, $timeout, StaleSessionService, $q, $rootScope, $compile, $controller, ModalService, LoginService) {
//                 q = $q;
//                 scope = $rootScope.$new();
//                 compile = $compile;
//                 modalService = ModalService;
//                 ctlr = $controller('staleSessionModalController', {
//                     $scope: scope
//                 });
//                 ssService = StaleSessionService;
//                 timeout = $timeout;
//                 authService = AuthService;
//             });

//         });

//         describe('when dismissing the modal', function() {

//             beforeEach(function() {
//                 spyOn(modalService, 'closeModal');
//                 spyOn(scope,'redirectLoggedOutUser');
//             });

//             it('when chooseEndSession() is called its internals are called', function () {
//                 spyOn(authService,'isLoggedIn').and.returnValue(true);
//                 spyOn(ssService,'endSession').and.returnValue(q.when());

//                 scope.chooseEndSession();
//                 timeout.flush();

//                 expect(authService.isLoggedIn).toHaveBeenCalled();
//                 expect(ssService.endSession).toHaveBeenCalled();
//                 expect(scope.userLoggedOut).toEqual(true);
//                 expect(scope.redirectLoggedOutUser).toHaveBeenCalled();
//             });

//             it('when chooseContinueSession() succeeds it closes the modal', function() {
//                 spyOn(ssService,'continueSession').and.returnValue(q.when());
//                 scope.chooseContinueSession();
//                 timeout.flush();
//                 expect(modalService.closeModal).toHaveBeenCalled();
//             });

//             it('when chooseContinueSession() fails it sets sessionExpired to true', function () {
//                 spyOn(ssService,'continueSession').and.returnValue(q.reject());
//                 scope.chooseContinueSession();
//                 timeout.flush();
//                 expect(scope.sessionExpired).toEqual(true);
//             });

//         });

//     });
// });
