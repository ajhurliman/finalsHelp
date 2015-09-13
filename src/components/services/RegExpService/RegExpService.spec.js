/*
 * RegExpService.spec.js
 *
 * Created: Thursday, August 08, 2014
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
describe( 'RegExpService section', function() {
    var service;

    beforeEach(function() {
        module('olci.services.RegExpService');

        inject(function(RegExpService) {
            service = RegExpService;
        });
    });



    describe('getRegExp function', function() {

        describe('name matcher', function() {
            //   /^[a-zA-Z-' ]*$/
            var matcher;
            beforeEach(function() {
                matcher = service.name;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("abcABC'def.").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("ABC123*&^%$#@!").not.toMatch(matcher);
            });
        });

        describe('name_last matcher', function() {
            //   /^[a-zA-Z-' ]*$/
            var matcher;
            beforeEach(function() {
                matcher = service.nameLast;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("abcABC'def").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("ABC123*&^%$#@!.").not.toMatch(matcher);
            });
        });

        describe('name_first matcher', function() {
            //   /^[a-zA-Z- ]*$/
            var matcher;
            beforeEach(function() {
                matcher = service.nameFirst;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("abcABC def").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("ABC123*&^%$#@!.").not.toMatch(matcher);
            });
        });

        describe('address matcher', function() {
            //   /^[a-zA-Z0-9\ \,\.~\`!\@\#\$\^\*()\-_\+=\{\}\[\]\|\\;:\"\'\/]{1,30}$/
            var matcher;
            beforeEach(function() {
                matcher = service.address;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("abcABC,def190").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("ABC123*&^%$#@!.123456789ZzBbGgAhx").not.toMatch(matcher);
            });
        });

        describe('city matcher', function() {
            //   /^[a-zA-Z-\' ]{1,30}$/
            var matcher;
            beforeEach(function() {
                matcher = service.city;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("abcABC'd ef").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("ABC123*&^ hdashg %$#@aaaaaa!.123456789ZzBbGgAhx").not.toMatch(matcher);
            });
        });

        describe('email matcher', function() {
            //   /(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/
            var matcher;
            beforeEach(function() {
                matcher = service.email;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("abc123ABC@GMAIL12.com").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("ABC123*&^hda.blahblahblah").not.toMatch(matcher);
            });
        });

        describe('numbers_only matcher', function() {
            //   /([1-9][0-9]*)|0/
            var matcher;
            beforeEach(function() {
                matcher = service.numbersOnly;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("1234567890").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("ABC").not.toMatch(matcher);
            });
        });

        describe('US_postalCode matcher', function() {
            //   /^\d{5}\-\d{4}$|^\d{9}$|^\d{5}$/
            var matcher;
            beforeEach(function() {
                matcher = service.postalCodeUS;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("44125").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("ABC").not.toMatch(matcher);
            });
        });

        describe('AU_postalCode matcher', function() {
            //   /^\d{4}$/
            var matcher;
            beforeEach(function() {
                matcher = service.postalCodeAU;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("1234").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("ABC12345678").not.toMatch(matcher);
            });
        });

        describe('IE_postalCode matcher', function() {
            //   /^[a-zA-Z0-9\ \-]{0,10}$/
            var matcher;
            beforeEach(function() {
                matcher = service.postalCodeIE;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("K").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("1234ABC12345678").not.toMatch(matcher);
            });
        });

        describe('other_postalCode matcher', function() {
            //   /^[a-zA-Z0-9\ \-]{1,10}$/
            var matcher;
            beforeEach(function() {
                matcher = service.postalCode;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("ABC123").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("1234AB'#$%C12345678").not.toMatch(matcher);
            });
        });

        describe('US_telephone matcher', function() {
            //   /^\d{10}$/
            var matcher;
            beforeEach(function() {
                matcher = service.telephoneUS;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("5551234567").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("1234AB'#$%C12345678").not.toMatch(matcher);
            });
        });

        describe('CA_telephone matcher', function() {
            //   /^\d{10}$/
            var matcher;
            beforeEach(function() {
                matcher = service.telephoneCA;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("5551234567").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("1234AB'#$%C12345678").not.toMatch(matcher);
            });
        });

        describe('other_telephone matcher', function() {
            //  /^[\s\d-.()+]{6,36}$/
            var matcher;
            beforeEach(function() {
                matcher = service.telephone;
            });
            it('exists', function() {
                expect(matcher).toBeDefined();
            });
            it("matches what it should", function() {
                expect("115551223").toMatch(matcher);
            });
            it("doesn't match what it should not", function() {
                expect("1234AB'#$%C12345678").not.toMatch(matcher);
            });
        });

        describe('amex card matcher', function() {
            // Amex starts with 34 or 37 and have 15 characters
            var matcher;

            beforeEach(function() {
                matcher = service.cardTypeAmex;
            });

            it('exists', function() {
                expect(matcher).toBeDefined();
            });

            it("doesn't match on other cards", function() {
                expect('4432 1111 1111 1111').not.toMatch(matcher);
            });

            it('matches some Amex cards', function() {
                expect('3411 1111 1111 1111').toMatch(matcher);
            });

            it('matches other Amex cards', function() {
                expect('3711 1111 1111 1111').toMatch(matcher);
            });
        });

        describe('Discover card matcher', function() {
            // Discover starts with 6011 or 65 and has 16 digits
            var matcher;

            beforeEach(function() {
                matcher = service.cardTypeDiscover;
            });

            it('exists', function() {
                expect(matcher).toBeDefined();
            });

            it("doesn't match on other cards", function() {
                expect('4432 1111 1111 1111').not.toMatch(matcher);
            });

            it('matches some Discover cards', function() {
                expect('6011 1111 1111 1111').toMatch(matcher);
            });

            it('matches other Discover cards', function() {
                expect('6555 1111 1111 1111').toMatch(matcher);
            });
        });

        describe('Mastercard matcher', function() {
            // Mastercard starts with 51-55 and length 16
            var matcher;

            beforeEach(function() {
                matcher = service.cardTypeMaster;
            });

            it('exists', function() {
                expect(matcher).toBeDefined();
            });

            it("doesn't match on other cards", function() {
                expect('4432 1111 1111 1111').not.toMatch(matcher);
            });

            it("doesn't match on wrong second digit", function() {
                expect('5632 1111 1111 1111').not.toMatch(matcher);
            });

            it("matches on first two numbers", function() {
                expect('5432 1111 1111 1111').toMatch(matcher);
            });
        });

        describe('Visa card matcher', function() {
            // Visa starts with 4 and also verifies length 13 or 16
            var matcher;

            beforeEach(function() {
                matcher = service.cardTypeVisa;
            });

            it('exists', function() {
                expect(matcher).toBeDefined();
            });

            it("Doesn't match on other cards", function() {
                expect('5432 1111 1111 1111').not.toMatch(matcher);
            });

            it("Match on prefix", function() {
                expect('4432 1111 1111 1111').toMatch(matcher);
            });
        });

        // Diners Club starts with 300 through 305, 36, 38 and has 14 digits. Any that start with 5 identify as mastercard
        // JCB begin with 2131 or 1800 and have 15 digits and cards beginning with 35 have 16 digits
    });

    describe('validatePostalCode function', function() {

        it('should exist', function() {
            expect(service.validatePostalCode).toBeDefined();
        });

        it('should return a true value when a country is defined', function() {
            expect(service.validatePostalCode('44215','US')).toBeDefined();
        });

        it('should return a value when country is not defined', function() {
            expect(service.validatePostalCode('66666','XX')).toBeDefined();
        });

        it('should return true when code is valid', function() {
            expect(service.validatePostalCode('44215','US')).toBe(true);
        });

        it('should return false when code is not valid', function() {
            expect(service.validatePostalCode('X1234567890YZ','US')).toBe(false);
        });

    });

    describe('validatePhone function', function() {

        it('should exist', function() {
            expect(service.validatePhone).toBeDefined();
        });

        it('should return a value when a country is defined', function() {
            expect(service.validatePhone('US')).toBeDefined();
        });

        it('should return a value when country is not defined', function() {
            expect(service.validatePhone('XX')).toBeDefined();
        });

        it('should return true when code is valid', function() {
            expect(service.validatePhone('5551234567','US')).toBe(true);
        });

        it('should return false when code is not valid', function() {
            expect(service.validatePhone('X1234567890YZ','US')).toBe(false);
        });

    });


    describe('promocode reg expression', function () {
        it('Should not match NON-Alphanumeric', function () {
            expect("non***alpha".match(service.promocode)).toBe(null);
        });
        it('Should match Alphanumeric', function () {
            expect("nonalpha".match(service.promocode)[0]).toEqual('nonalpha');
        });
        it('Should not macth more than 25 chars', function () {
            expect("morethantwentyfivecharacters".match(service.promocode)).toEqual(null);
        });
        it('Should macth 25 chars', function () {
            expect("morethantwentyfivecharact".match(service.promocode)[0]).toBeDefined();
        });
    });

});
