/*
 * RegExpService.js
 *
 * Created: Tuesday, August 19, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc overview
 * @name olci.services.RegExpService
 * @description An empty module description. Please fill in a high level description of this module.
 */
angular.module( 'olci.services.RegExpService', [


])

/**
 * @ngdoc service
 * @name olci.services.RegExpService
 * @description Regular expressions to be used in field validations.
 */
    .service('RegExpService', function() {
        var regExpService = {

            // Credit Card types
            cardTypeAmex : new RegExp(/^(34)|^(37)/),
            cardTypeDiscover : new RegExp(/^(6011)|^(622(1(2[6-9]|[3-9][0-9])|[2-8][0-9]{2}|9([01][0-9]|2[0-5])))|^(64[4-9])|^65/),
            cardTypeMaster : new RegExp(/^5[1-5]/),
            cardTypeVisa : new RegExp(/^4/),

            // additional cards for seabourne
            // cardTypeDinersClub : new RegExp(/^3(?:0[0-5]|[68][0-9])[0-9]{11}$/),
            // cardTypeJCB : new RegExp(/^(?:2131|1800|35\d{3})\d{11}$/),

            name : new RegExp(/^[a-zA-Z-'\. ]*$/),
            nameLast: new RegExp(/^[a-zA-Z-' ]*$/),
            nameFirst: new RegExp(/^[a-zA-Z- ]*$/),
            address: new RegExp(/^[a-zA-Z0-9\ \,\.~\`!\@\#\$\^\*()\-_\+=\{\}\[\]\|\\;:\"\'\/]{1,30}$/),
            city: new RegExp(/^[a-zA-Z-\' ]{1,30}$/),
            // postal code
            postalCodeUS: new RegExp(/^\d{5}\-\d{4}$|^\d{9}$|^\d{5}$/),
            postalCodeAU: new RegExp(/^\d{4}$/),
            postalCodeIE: new RegExp(/^[a-zA-Z0-9\ \-]{0,10}$/),
            postalCode: new RegExp(/^[a-zA-Z0-9\ \-]{1,10}$/),
            // Phone numbers
            telephoneUS: new RegExp(/^\d{10}$/),
            telephoneCA: new RegExp(/^\d{10}$/),
            telephone: new RegExp(/^[\s\d-.()+]{6,36}$/),

            telephoneClean: new RegExp(/[^\d]/g),

            email: new RegExp(/(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/),
            // general validation
            numbersOnly: new RegExp(/([1-9][0-9]*)|0/),

            /* promocode */
            promocode: new RegExp(/^[\w]{0,25}$/i),

            validatePostalCode: function(code, country) {
                var regexp = regExpService['postalCode' + country];
                if (!regexp) {
                    regexp = regExpService.postalCode;
                }
                return regexp.test(code);
            },

            getPostalCodeRegExp: function(country) {
                var regexp = regExpService['postalCode' + country];
                if (!regexp) {
                    regexp = regExpService.postalCode;
                }
                return regexp;
            },

            validatePhone: function(code) {
                var regexp = regExpService.telephone;
                return regexp.test(code);
            }

        };
        return regExpService;
    });