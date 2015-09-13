/*
 * ChatCallService.spec.js
 *
 * Created: Tuesday, September 09, 2014
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
describe('ChatCallService section', function () {
    beforeEach(module('olci.services.ChatCallService'));

    it('should have a dummy test', inject(function () {
        expect(true).toBeTruthy();
    }));
});
