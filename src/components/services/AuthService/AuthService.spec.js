// describe('AuthService section', function () {
//     var service, $httpBackend, $timeout, appName, q, StorageService;

//     beforeEach( function () {
//         module('olci.services.AuthService');

//         inject(function (AuthService, AnalyticsService, _$httpBackend_, Configuration, _$q_, _$timeout_, _StorageService_ ) {
//             service = AuthService;
//             $httpBackend = _$httpBackend_;
//             appName = Configuration.companyCode;
//             StorageService = _StorageService_;
//             q = _$q_;
//             $timeout = _$timeout_;
//         });
//     });

//     afterEach(function(){
//         $httpBackend.verifyNoOutstandingExpectation();
//         $httpBackend.verifyNoOutstandingRequest();
//     });

//     describe('isAuthenticated function', function () {
//         it('should return false if currentUser null', function () {
//             expect(service.isAuthenticated()).toBeFalsy();
//         });

//         it('should return true if currentUser not null', function () {
//             service.currentUser = { token: "test" };
//             expect(service.isAuthenticated()).toBeTruthy();
//         });
//     });

//     describe('requestRoleChange function', function () {
//         it('should request a role for the current user', function () {
//             service.currentUser = { token: "test" };
//             $httpBackend.expectPUT('/authentication/v1.0.0/companyCode/'+appName+'/test/role/newRole').respond({
//                 token: "test",
//                 details: {
//                     bookingNumber: 'xxyyzz'
//                 },
//                 roles: ['DIRECT_GUEST_NOT_LOGGED_IN']
//             });
//             service.requestRoleChange('newRole');
//             $httpBackend.flush();

//             expect(service.currentUser.bookingNumber).toBe('xxyyzz');
//         });
//     });

//     describe('authorize function', function () {
//         it('returns true if authorized', function(){
//             service.currentUser = {
//                 roles: ['GIFTER']
//             };
//             expect(service.authorize('cpp')).toBe(false);
//         });

//         it('returns false if not authorized', function(){
//             service.currentUser = {
//                 roles: ['DIRECT_GUEST_LOGGED_IN']
//             };
//             expect(service.authorize('cpp')).toBe(true);
//         });

//     });

//     describe( 'getCurrentRoles function', function() {
//         it ( 'should return user roles when present', function() {
//             service.currentUser = {
//                 roles: ['a', 'b']
//             };
//             expect(service.getCurrentRoles()).toBe(service.currentUser.roles);
//         });
//     });

//     describe('isLoggedIn method', function(){
//         it('returns true', function(){
//             service.currentUser = {
//                 roles: ['DIRECT_GUEST_LOGGED_IN']
//             };
//             expect(service.isLoggedIn()).toBe(true);
//         });

//         it('returns false', function(){
//             service.currentUser = {
//                 roles: ['GIFTER']
//             };
//             expect(service.isLoggedIn()).toBe(false);
//         });
//     });

//     describe( 'logout function', function() {

//         it ( 'should be called', function() {
//             spyOn(service,'init');
//             StorageService.setItem("token", "abc");
//             $httpBackend.expect('DELETE','/authentication/v1.0.0/companyCode/HAL/abc').respond({});
//             service.logout();
//             $httpBackend.flush();
//             expect(StorageService.getItem("token")).toBe(null);
//             expect(service.init).toHaveBeenCalled();
//         });

//     });

//     describe( '_checkAuthentication function', function() {
//         var authData = null;
//         beforeEach(function(){
//             authData = {
//                 token: "12345",
//                 principal: "abc",
//                 roles: ['EXPLORER'],
//                 details: {
//                     bookingNumber: "9876",
//                     lastName: "Doe",
//                     country: "US"
//                 }
//             };
//         });

//         it ( 'reject because of the roles', function() {
//             spyOn(service, '_extractCurrentUser').and.callThrough();
//             spyOn(service, '_setTokenTimestamp').and.callThrough();

//             var promise = service._checkAuthentication(authData);
//             var theError = '';
//             promise.catch(function(err){
//                 theError = err;
//             });
//             $timeout.flush();

//             expect(theError).toEqual('INVALID_ROLE');
//         });

//         it ( 'resolves the userData', function() {
//             authData.roles = ["DIRECT_GUEST_LOGGED_IN"];

//             spyOn(service, '_extractCurrentUser').and.callThrough();
//             spyOn(service, '_setTokenTimestamp').and.callThrough();

//             var promise = service._checkAuthentication(authData);
//             var userData = {};
//             promise.then(function(data){
//                 userData = data;
//             });
//             $timeout.flush();

//             expect(userData.bookingNumber).toEqual('9876');
//         });

//     });

//     describe( 'verify function', function() {
//         it ( 'should not make a network call without a token', function() {
//             var rejected = false;
//             service.verify().catch(function(){
//                 rejected = true;
//             });
//             $timeout.flush();
//             expect(rejected).toEqual(true);
//         });

//         it ( 'should make a network call with a token', function() {
//             var fakeToken = "ab829fe";
//             spyOn(service,'_checkAuthentication');
//             service.verify(fakeToken);
//             $httpBackend.expectGET(/\/authentication\/v1.0.0/).respond('');
//             $httpBackend.flush();
//             expect(service._checkAuthentication).toHaveBeenCalled();
//         });

//     });

//     describe('_transformRequestObject method', function(){
//         it('should create a query string array', function(){
//             var obj = {"blah": "test", "hello": "world"};
//             var queryString = service._transformRequestObject(obj);
//             expect(queryString).toEqual("blah=test&hello=world");
//         });
//     });

//     describe( 'authenticate function', function() {

//         it( 'should be called', function() {
//             var bookingNumber = "XYZABC";
//             var lastName = "Smith";
//             spyOn(service,'_transformRequestObject');
//             spyOn(service,'_checkAuthentication');

//             $httpBackend.expect('POST', '/authentication/v1.0.0/companyCode/HAL').respond(200, []);

//             service.authenticate(bookingNumber,lastName);

//             $httpBackend.flush();

//             expect(service._transformRequestObject).toHaveBeenCalled();
//             expect(service._checkAuthentication).toHaveBeenCalledWith([]);
//         });

//     });

//     describe('needsSessionRecovery method', function(){
//         it('checks if the token is timed out', function(){
//             //set timestamp to 12345 seconds from Jan 1, 1970
//             StorageService.setItem('tokenTimestamp', 12345);
//             expect(service.needsSessionRecovery()).toBe(true);
//         });
//     });

//     describe('currentUserResolver method', function(){
//         it('returns the current user', function(){
//             service.currentUser = {
//                 roles: ['DIRECT_GUEST_LOGGED_IN']
//             };
//             var currentUser = null;
//             service.currentUserResolver().then(function(user){
//                currentUser = user;
//             });
//             $timeout.flush();

//             expect(currentUser).toEqual({
//                 roles: ['DIRECT_GUEST_LOGGED_IN']
//             });
//         });

//         it('calls recoverSession', function(){
//             spyOn(service, 'recoverSession');
//             service.currentUser = null;
//             service.currentUserResolver();
//             expect(service.recoverSession).toHaveBeenCalled();
//         });
//     });
// });

