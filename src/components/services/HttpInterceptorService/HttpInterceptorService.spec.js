// /*
//  * HttpInterceptorService.spec.js
//  *
//  * Created: Wednesday, December 16, 2014
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
// describe( 'HttpInterceptorService section', function() {
//     var hiService, scope, q, $window, $cacheFactory, BrowserService, cache;

//     beforeEach(function() {
//         module('olci.services.HttpInterceptorService');
//         module('olci.services.BrowserService');
//         module('ui.router');

//         module(function ($provide) {
//             $cacheFactory = function(){};
//             $cacheFactory.get = function(){};

//             cache = {
//                 removeAll: function (){}
//             };
//             spyOn(cache, 'removeAll');
//             spyOn($cacheFactory, 'get').and.returnValue(cache);

//             $provide.value('$cacheFactory', $cacheFactory);
//         });

//         inject(function( HttpInterceptorService, $rootScope, $q, _$window_, _$cacheFactory_, _BrowserService_ ) {
//             hiService = HttpInterceptorService;
//             scope = $rootScope.$new();
//             q = $q;

//             BrowserService = _BrowserService_;

//             $window = _$window_;
//             $window.TLT = {
//                 logScreenviewLoad: function(){},
//                 isInitialized: function(){ return true; }
//             };

//             spyOn($window.TLT, 'logScreenviewLoad');
//         });
//     });

//     it('should broadcast and receive httpSuccess event', function() {
//         scope.$on('httpSuccess',function(event, response) {
//             expect(response).toEqual({
//                 status: 200,
//                 config: {
//                     url: "/secondary/api"
//                 }
//             });
//         });
//         hiService.response({
//             status: 200,
//             config: {
//                 url: "/secondary/api"
//             }
//         });
//     });

//     describe('requestError method', function(){
//         it('should reject the response', function() {
//             spyOn(q, 'reject');
//             var rejectData = {
//                 status: 400
//             };
//             hiService.requestError(rejectData);

//             expect(q.reject).toHaveBeenCalledWith(rejectData);
//         });
//     });

//     describe('request method', function(){
//         var requestData;
//         beforeEach(function(){
//             requestData = {
//                 method: "POST",
//                 url: '/secondary/api'
//             };
//         });

//         it('should call [cache.removeAll] on non-GET requests', function() {
//             var response = hiService.request(requestData);

//             expect(cache.removeAll).toHaveBeenCalled();
//             expect(response).toEqual(requestData);
//         });

//         it('should cache-bust for IE', function() {
//             spyOn(BrowserService, 'getBrowserType').and.returnValue('ie');
//             requestData.method = 'GET';
//             var response = hiService.request(requestData);

//             expect(cache.removeAll).not.toHaveBeenCalled();
//             expect(response.url).toContainText("?_=");
//         });
//     });

//     it('responseError should reject the promise', function() {
//         var responseVar;
//         q.reject = function(p) {
//             responseVar = p;
//         };
//         spyOn(q,'reject').and.callThrough();
//         hiService.responseError({
//             'test' : 'test',
//             'statusText': 'error'
//         });
//         expect($window.TLT.logScreenviewLoad).toHaveBeenCalledWith('', 'error');
//         expect(q.reject).toHaveBeenCalled();
//         expect(responseVar).toEqual({
//             'test' : 'test',
//             'statusText': 'error'
//         });
//     });

// });

