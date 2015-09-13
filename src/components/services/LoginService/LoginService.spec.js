/*
 * LoginService.spec.js
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
 describe('LoginService module', function() {
    var q;
    var timeout;
    var loginService;
    var authService;
    var state;
    var promise;
    var SignalTowerService;

    beforeEach(function() {
        module('olci.services.LoginService', 'ui.router', function($provide) {

            state = jasmine.createSpyObj('$state', ['go']);

            promise = {
                then: function(success, failure) {
                    success();
                }
            };

            authService = {
                authenticate: function() {
                    return promise;
                },
                logout: function() {
                    return promise;
                },
                isAuthenticated: function() {
                    return true;
                }
            };

            $window = {
                location: {}
            };

            $provide.value('AuthService', authService);
            $provide.value('$window', $window);
            $provide.value('$state', state);
        });

        inject(function(_LoginService_, $timeout, $q) {
            LoginService = _LoginService_;
            timeout = $timeout;
            q = $q;
        });
    });

    describe('logout', function() {
        it('should be defined', function() {
            expect(LoginService).toBeDefined();
        });

        it('should call authService', function() {
            spyOn(authService, 'logout').and.returnValue(q.when());
            LoginService.logout();
            timeout.flush();
            expect(authService.logout).toHaveBeenCalled();
        });
    });
 });