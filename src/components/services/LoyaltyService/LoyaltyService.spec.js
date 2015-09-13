// /*
//  * LoyaltyService.spec.js
//  *
//  * Created: Tuesday, Feb 11, 2015
//  * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
//  * This is unpublished proprietary source code of Holland America, Inc.
//  * The copyright notice above does not evidence any actual or intended
//  * publication of such source code.
//  */

// describe('LoyaltyService section', function () {
//     var BookingService, LoyaltyService, appName, q, timeout, httpBackend, mockLoyaltyData;


//     beforeEach(function () {
//         module('restangular');
//         module('ApplicationConfiguration');
//         module('secondaryFlow.services.BookingService');
//         module('secondaryFlow.services.LoyaltyService');



//         mockLoyaltyData = [
//                 {
//                     "guestId": "null",
//                     "partyNumber": " 1",
//                     "uniqueId": null,
//                     "mpUpdated": null,
//                     "tierLevel": "Gold Member",
//                     "loyaltyPreferencesDetail": {
//                         "preferenceAllowLimit": 2,
//                         "preferenceListforTier": [
//                             {
//                                 "idLoyalty": 17,
//                                 "codeLoyalty": "TGSHX10P",
//                                 "codeItemType": "S",
//                                 "discount": 10,
//                                 "discountType": "P",
//                                 "benefitType": "S",
//                                 "description": "10% savings on Shore Excursions",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Gold",
//                                 "displayOrder": 1,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 18,
//                                 "codeLoyalty": "TGALC15P",
//                                 "codeItemType": "G",
//                                 "discount": 15,
//                                 "discountType": "P",
//                                 "benefitType": "S",
//                                 "description": "15% savings on premium wines and spirits",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Gold",
//                                 "displayOrder": 2,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 19,
//                                 "codeLoyalty": "TGLND1BG",
//                                 "codeItemType": "O",
//                                 "discount": 0,
//                                 "discountType": "O",
//                                 "benefitType": "B",
//                                 "description": "One complimentary bag of laundry every seven days",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Gold",
//                                 "displayOrder": 7,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 20,
//                                 "codeLoyalty": "TGINT3H",
//                                 "codeItemType": "O",
//                                 "discount": 0,
//                                 "discountType": "O",
//                                 "benefitType": "B",
//                                 "description": "Complimentary internet - 3-hour Gold package ",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Gold",
//                                 "displayOrder": 3,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 21,
//                                 "codeLoyalty": "TGTEL30M",
//                                 "codeItemType": "0",
//                                 "discount": 0,
//                                 "discountType": "0",
//                                 "benefitType": "B",
//                                 "description": "Complimentary telephone - 30 minutes",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Gold",
//                                 "displayOrder": 4,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 22,
//                                 "codeLoyalty": "TZSER",
//                                 "codeItemType": "SS",
//                                 "discount": 0,
//                                 "discountType": "O",
//                                 "benefitType": "B",
//                                 "description": "Day in the Spa at Seabourn Serene Area **",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Gold",
//                                 "displayOrder": 6,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 23,
//                                 "codeLoyalty": "TZSPA",
//                                 "codeItemType": "P",
//                                 "discount": 0,
//                                 "discountType": "O",
//                                 "benefitType": "B",
//                                 "description": "Seabourn Club Signature Massage",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Gold",
//                                 "displayOrder": 5,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             }
//                         ]
//                     },
//                     "selectedSbnBkngPreferencesDetail": [
//                         {
//                             "code": "TGALC15P",
//                             "comments1": "1",
//                             "prepaidSale": "Y",
//                             "uniqueId": null
//                         },
//                         {
//                             "code": "TZSPA",
//                             "comments1": "1",
//                             "prepaidSale": "N",
//                             "uniqueId": null
//                         }
//                     ]
//                 },
//                 {
//                     "guestId": "null",
//                     "partyNumber": " 2",
//                     "uniqueId": null,
//                     "mpUpdated": null,
//                     "tierLevel": "Silver Member",
//                     "loyaltyPreferencesDetail": {
//                         "preferenceAllowLimit": 1,
//                         "preferenceListforTier": [
//                             {
//                                 "idLoyalty": 24,
//                                 "codeLoyalty": "TSSHX10P",
//                                 "codeItemType": "S",
//                                 "discount": 10,
//                                 "discountType": "P",
//                                 "benefitType": "S",
//                                 "description": "10% savings on Shore Excursions",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Silver",
//                                 "displayOrder": 1,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 25,
//                                 "codeLoyalty": "TSALC10P",
//                                 "codeItemType": "G",
//                                 "discount": 10,
//                                 "discountType": "P",
//                                 "benefitType": "S",
//                                 "description": "10% savings on premium wines and spirits",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Silver",
//                                 "displayOrder": 2,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 26,
//                                 "codeLoyalty": "TSLND1BG",
//                                 "codeItemType": "O",
//                                 "discount": 0,
//                                 "discountType": "O",
//                                 "benefitType": "B",
//                                 "description": "One complimentary bag of laundry",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Silver",
//                                 "displayOrder": 7,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 27,
//                                 "codeLoyalty": "TSINT2H",
//                                 "codeItemType": "O",
//                                 "discount": 0,
//                                 "discountType": "O",
//                                 "benefitType": "B",
//                                 "description": "Complimentary internet - 2-hour Silver package",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Silver",
//                                 "displayOrder": 3,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 28,
//                                 "codeLoyalty": "TSTEL20M",
//                                 "codeItemType": "O",
//                                 "discount": 0,
//                                 "discountType": "O",
//                                 "benefitType": "B",
//                                 "description": "Complimentary telephone-20 minutes",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Silver",
//                                 "displayOrder": 4,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 29,
//                                 "codeLoyalty": "TZSER",
//                                 "codeItemType": "SS",
//                                 "discount": 0,
//                                 "discountType": "O",
//                                 "benefitType": "B",
//                                 "description": "Day in the Spa at Seabourn Serene Area  **",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Silver",
//                                 "displayOrder": 6,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             },
//                             {
//                                 "idLoyalty": 30,
//                                 "codeLoyalty": "TZSPA",
//                                 "codeItemType": "P",
//                                 "discount": 0,
//                                 "discountType": "O",
//                                 "benefitType": "B",
//                                 "description": "Seabourn Club Signature Massage",
//                                 "codeCo": "SBN",
//                                 "tierLevel": "Silver",
//                                 "displayOrder": 5,
//                                 "dateCreated": null,
//                                 "dateModified": null
//                             }
//                         ]
//                     },
//                     "selectedSbnBkngPreferencesDetail": [
//                         {
//                             "code": "TSINT2H",
//                             "comments1": "1",
//                             "prepaidSale": "N",
//                             "uniqueId": null
//                         }
//                     ]
//                 }
//             ];


//         inject(function ($httpBackend, $timeout, $q, _BookingService_, _LoyaltyService_, Configuration, Restangular) {
//             appName = Configuration.appName;
//             BookingService = _BookingService_;
//             LoyaltyService = _LoyaltyService_;
//             q = $q;
//             httpBackend =$httpBackend;
//             timeout = $timeout;
//             restangular = Restangular;

//             BookingService.bookingSummary = {
//                 guests:[{
//                     academyLevel: "",
//                     age: 11,
//                     ageCode: "AD",
//                     firstName: "JACK",
//                     gender: "M",
//                     genderName: "Male",
//                     idGuest: 15106146,
//                     insuranceCode: "N",
//                     insuranceName: "DECLINED SEABOURNSHIELD",
//                     lastName: "HORGEN",
//                     marinerId: "3000092266",
//                     marinerLevel: "SM",
//                     middleName: "CHRISTOPHER",
//                     name: "Jack Horgen",
//                     sequenceNumber: 1,
//                     suffix: "",
//                     title: "MR",
//                     uniqueKey: "CWVWDG_1"
//                 }],
//                 bookingNumber:1
//             };
//         });
//     });

//     describe('loyaltySummaryResolver method', function () {

//         it('should resolve the loyaltySummary', function () {
//             LoyaltyService.loyaltySummary = 'test';
//             var result = null;
//             LoyaltyService.loyaltySummaryResolver(BookingService.bookingSummary).then(function (data) {
//                 result = data;
//             });
//             timeout.flush();
//             expect(result).toEqual('test');
//         });

//         it('should not resolve the loyaltySummary', function () {
//            var result = null;
//             spyOn(LoyaltyService , 'getLoyaltyPrefs').and.returnValue('turkey');
//             LoyaltyService.loyaltySummaryResolver(BookingService.bookingSummary).then(function (data) {
//                 result = data;
//             });
//             timeout.flush();
//             expect(result).toEqual('turkey');
//             expect(LoyaltyService.getLoyaltyPrefs).toHaveBeenCalled();
//         });

//     });

//     describe('getLoyaltyPrefs method', function(){

//         it('should get the loyalty data', function () {
//             spyOn(LoyaltyService, 'createLoyaltySummary').and.returnValue('test');
//             httpBackend.expectGET('/guest/v1.0.0/loyaltyPreference/companyCode/HAL/bookingNumber/1').respond(mockLoyaltyData);
//             var promise = LoyaltyService.getLoyaltyPrefs(BookingService.bookingSummary);
//             var result = null;
//             promise.then(function(data) {
//                 result = data;
//             });
//             httpBackend.flush();

//             expect(result).toEqual('test');
//             expect(LoyaltyService.loyaltySummary).toEqual('test');
//             expect(LoyaltyService.createLoyaltySummary).toHaveBeenCalledWith(mockLoyaltyData);
//         });

//         it('should not get the loyalty data', function () {
//             httpBackend.expectGET('/guest/v1.0.0/loyaltyPreference/companyCode/HAL/bookingNumber/1').respond(400, 'error');
//             var promise = LoyaltyService.getLoyaltyPrefs(BookingService.bookingSummary);
//             var result = null;
//             promise.catch(function(data) {
//                 result = data;
//             });
//             httpBackend.flush();

//             expect(result.data).toEqual('error');
//             expect(LoyaltyService.loyaltySummary).toBeNull();
//         });

//     });

//     describe('tests for loyaltyPrefs', function(){
//         var rawLoyaltyPrefs;

//         beforeEach(function(){
//             rawLoyaltyPrefs = {
//                 bookingLoyaltyPreferenceGuests: [
//                     {//loyaltyGuest
//                         idGuest: 15106146,
//                         selectedLoyaltyPreferencesDetails: [],
//                         loyaltyPreferencesDetail: {
//                             preferenceAllowLimit: 1,
//                             preferenceListforTier: [
//                                 {//selections for the preferences
//                                     benefitType: 'S',
//                                     discount: 10,
//                                     description: 'abc%123'
//                                 }//end selections for the detail
//                             ]
//                         }
//                     }//end guest
//                 ]
//             };
//         });

//         describe('mapBestPrefs method', function(){

//             it('should test for a benefitType of X', function(){
//                 rawLoyaltyPrefs.bookingLoyaltyPreferenceGuests[0].loyaltyPreferencesDetail.preferenceListforTier[0].benefitType = 'X';
//                 var loyaltyPrefs = LoyaltyService.mapBestPrefs(rawLoyaltyPrefs);
//                 expect(loyaltyPrefs.bestSharedPrefs).toEqual([]);
//             });

//             it('sets bestSharedPrefs', function(){
//                 spyOn(LoyaltyService, 'getKeyForPref').and.returnValue('fakeKey');
//                 var loyaltyPrefs = LoyaltyService.mapBestPrefs(rawLoyaltyPrefs);
//                 expect(loyaltyPrefs.bestSharedPrefs.fakeKey).toEqual({
//                     benefitType:'S',
//                     discount:10,
//                     description: 'abc%123'
//                 });
//             });

//             it('bestSharedPrefs at the key should be the highest number', function(){
//                 var fakeBenefit = {
//                     benefitType: 'S',
//                     discount: 25
//                 };
//                 spyOn(LoyaltyService, 'getKeyForPref').and.returnValue('fakeKey');
//                 rawLoyaltyPrefs.bookingLoyaltyPreferenceGuests[0].loyaltyPreferencesDetail.preferenceListforTier.push(fakeBenefit);
//                 var loyaltyPrefs = LoyaltyService.mapBestPrefs(rawLoyaltyPrefs);
//                 expect(loyaltyPrefs.bestSharedPrefs.fakeKey).toEqual(fakeBenefit);
//             });

//         });

//         describe('createLoyaltySummary method', function(){
//             it('should do something', function(){
//                 spyOn(LoyaltyService, 'mapBestPrefs').and.callThrough();
//                 var loyaltySummary = LoyaltyService.createLoyaltySummary( rawLoyaltyPrefs );
//                 expect(loyaltySummary.preferenceCount).toEqual(0);
//                 expect(loyaltySummary.preferenceLimit).toEqual(1);
//                 expect(loyaltySummary.isAnyGuestAllowedToSpendLoyaltyPoints).toEqual(true);
//                 expect(loyaltySummary.bookingLoyaltyPreferenceGuests[0].guestInfo).toEqual(BookingService.bookingSummary.guests[0]);
//             });
//         });
//     });


//     describe('getKeyForPref method', function(){
//         it('should return a the end of a string after a percent sign', function(){
//             var perf = {
//                 description:'15%GuardOnHit'
//             };
//             var result = LoyaltyService.getKeyForPref(perf);
//             expect(result).toEqual('%GuardOnHit');
//         });
//     });



//     describe('updateLoyaltyPrefs method', function(){
//         it('should do something', function(){

//         });
//     });


//     describe('hasSBNSpaBenefit', function() {
//         var loyaltyGuest = {
//             selectedLoyaltyPreferencesDetails: [
//                 {
//                     code: 'TZSPA',
//                     prepaidSale: 'N'
//                 }
//             ]
//         };

//         it('returns true', function() {
//             expect(LoyaltyService.hasSBNSpaBenefit(loyaltyGuest)).toBe(true);
//         });
//     });

// });
