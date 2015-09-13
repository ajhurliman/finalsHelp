// /*
//  * BookingService.js
//  *
//  * Created: Friday, February 07, 2014
//  * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
//  * This is unpublished proprietary source code of Holland America, Inc.
//  * The copyright notice above does not evidence any actual or intended
//  * publication of such source code.
//  */


// /**
//  * @ngdoc service
//  * @name olci.services.BookingService
//  * @description GETs and sets booking summary data, including authorizations.
//  * @requires restangular
//  * @requires olci.services.AuthService
//  * @requires olci.services.RoutingUtilsService
//  * @requires olci.filters.PortNameFilter
//  */

// angular.module('olci.services.BookingService', [
//     'restangular',
//     'ApplicationConfiguration',
//     'olci.services.AuthService',
// //     'olci.services.RoutingUtilsService',
// //     'olci.services.TimeUtilsService',
// //     'olci.filters.PortNameFilter',
// //     'olci.filters.TitleCaseFilter'
// ])

// /**
//  * @ngdoc service
//  * @name olci.services.BookingService
//  * @description An empty service description. Please fill in a high level description of this
//  *     service.
//  */
//     .service('BookingService', [ 'Restangular', '$q', '$interpolate', '$location', '$filter', 'Configuration', 'RoutingUtilsService', 'TimeUtilsService', 'AuthService',
//         function (Restangular, $q, $interpolate, $location, $filter, Configuration, RoutingUtilsService, TimeUtilsService, AuthService) {
//             var appName = Configuration.appName;

//             return {
//                 bookingBaseUrl: Restangular.one('guest/v1.0.0/booking').one('companyCode', Configuration.companyCode),
//                 bookingSummary: null,

//                 bookingSummaryResolver: function () {
//                     var self = this;
//                     var promise = $q.reject('not logged in');

//                     if (self.bookingSummary !== null) {
//                         promise = $q.when(self.bookingSummary);
//                     } else if (AuthService.isAuthenticated()) {
//                         promise = self.getBookingSummary(AuthService.currentUser.bookingNumber).then(function (bookingSummary) {
//                             self.bookingSummary = bookingSummary;
//                             return bookingSummary;
//                         });
//                     }

//                     return promise;
//                 },

//                 _setItineraryDate: function (itineraryDayList) {
//                     if (itineraryDayList !== undefined) {

//                         for (var i = 0; i < itineraryDayList.length; i++) {
//                             itineraryDayList[i].label = $filter('date')(itineraryDayList[i].date, 'MMMM d') + " - " + itineraryDayList[i].portName;
//                         }
//                     }
//                 },

//                 _setGuestDisplayNames: function (guests) {
//                     if (guests !== undefined) {
//                         for (var g = 0; g < guests.length; g++) {
//                             var guest = guests[g];
//                             var displayName = $interpolate('{{firstName}} {{lastName}}')(guest);

//                             guest.name = $filter('titleCase')(displayName);
//                         }
//                     }
//                 },

//                 /**
//                  * @ngdoc method
//                  * @name olci.services.BookingService#getBookingSummary
//                  * @methodOf olci.services.BookingService
//                  * @description GETs and sets bookingSummary data.
//                  * @returns {object} promise object
//                  * */
//                 getBookingSummary: function (bookingNumber) {
//                     var self = this;
//                     var deferred = $q.defer();

//                     var getBookingSummary = self.bookingBaseUrl
//                         .one('bookingNumber', bookingNumber);

//                     getBookingSummary.get().then(function (bookingSummary) {

//                         self._cleanUpBookingSummary(bookingSummary);

//                         deferred.resolve(bookingSummary);
//                     }, function (error) {
//                         deferred.reject(error);
//                     });

//                     return deferred.promise;
//                 },
//                 _portMetadata: function (itineraryDay) {
//                     if (itineraryDay.portName === null) {
//                         return { };
//                     }

//                     // Fix casing for departure, return ports
//                     var portStrings = itineraryDay.portName.split(',').map(function (entry) {
//                         return entry.trim();
//                     });
//                     var portData = {
//                         country: portStrings.pop(),
//                         city: portStrings.join(', ')
//                     };

//                     portData.name = $interpolate("{{ city }}, {{ country }}")(portData);

//                     return portData;
//                 },
//                 _cleanUpBookingSummary: function (bookingSummary) {
//                     var self = this;

//                     // Stateroom file name is uppercase, ship image is lowercase
//                     bookingSummary.stateroomImage = $interpolate(RoutingUtilsService.frontendBaseUrl("/images/cruise-vacation-onboard/ships/{{ shipCode }}/150XInside.jpg"))(bookingSummary);
//                     bookingSummary.shipImage = $interpolate(RoutingUtilsService.frontendBaseUrl("/assets/deckplans/ships/{{ shipCode | lowercase }}.jpg"))(bookingSummary);
//                     bookingSummary.mapImage = $interpolate(RoutingUtilsService.frontendBaseUrl("/images/itineraryMaps/{{ itineraryCode }}.jpg"))(bookingSummary);

//                     // Fix up Itinerary Data
//                     var itineraryDayList = bookingSummary.itinerary.itineraryDayList;
//                     for (var i = 0; i < itineraryDayList.length; i++) {
//                         var day = itineraryDayList[i];

//                         // TODO: (JDM) the server should be giving us dates in the format it expects to receive
//                         // them
//                         day.serviceDateCode = $interpolate('{{ date | date : "yyyyMMdd" }}')(day);
//                         day.portNameShort = $interpolate('{{ portName | portName }}')(day);
//                     }

//                     bookingSummary.departurePort = self._portMetadata(itineraryDayList[0]);
//                     bookingSummary.returnPort = self._portMetadata(itineraryDayList[itineraryDayList.length - 1]);

//                     bookingSummary.heroImages = self.getHeroImage(bookingSummary.itineraryCode);

//                     bookingSummary.itinerary.beginDate = itineraryDayList[0].arrivalDateTime;
//                     bookingSummary.itinerary.endDate = itineraryDayList[itineraryDayList.length - 1].arrivalDateTime;

//                     // sets days till departure for messaging around the 3 day rule.
//                     var daysTillDeparture = 3;
//                     var daysLeft = TimeUtilsService.daysLeft(bookingSummary.itinerary.beginDate, new Date());
//                     bookingSummary.purchasesAllowed = (daysLeft > daysTillDeparture); // returns true/false -
//                     // true: you can make
//                     // purchases - false: you
//                     // cannot make purchases

//                     self._setGuestDisplayNames(bookingSummary.guests);
//                     self._setItineraryDate(bookingSummary.itinerary.itineraryDayList);

//                     return bookingSummary;
//                 },

//                 /**
//                  * @ngdoc method
//                  * @name olci.services.BookingService#getHeroImage
//                  * @methodOf olci.services.BookingService
//                  * @description map of hero images, e.g. 'hero-itinerary-A.jpg'
//                  * @returns {object} hero image map
//                  * */
//                 getHeroImage: function (itineraryId) {
//                     var self = this;
//                     var itineraryCode = itineraryId.substring(0, 2);
//                     var destCode = itineraryCode.substring(0, 1);

//                     var itineraryImage = self.heroImageMap[itineraryCode];
//                     var destinationImage = self.heroImageMap[destCode];
//                     var images = self.heroImageMap['default'];

//                     if (itineraryImage) {
//                         images = itineraryImage;
//                     } else if (destinationImage) {
//                         images = destinationImage;
//                     }

//                     return {
//                         shorex: '/content/'+appName+'/cruise-experience/shorex/' + images.shorex,
//                         itinerary: '/content/'+appName+'/cruise-experience/itinerary/' + images.itinerary,
//                         home: '/content/'+appName+'/cruise-experience/home/' + images.home,
//                         spa: '/content/'+appName+'/cruise-experience/spa/' + images.spa
//                     };
//                 },

//                 heroImageMap: {
//                     'A': {
//                         itinerary: 'hero-itinerary-A.jpg',
//                         shorex: 'hero-shorex-A.jpg',
//                         home: 'hero-home-A.jpg'
//                     },
//                     'AC': {
//                         itinerary: 'hero-itinerary-AC.jpg',
//                         shorex: 'hero-shorex-AC.jpg',
//                         home: 'hero-home-AC.jpg'
//                     },
//                     'AT': {
//                         itinerary: 'hero-itinerary-AT.jpg',
//                         shorex: 'hero-shorex-AT.jpg',
//                         home: 'hero-home-AT.jpg'
//                     },
//                     'B': {
//                         itinerary: 'hero-itinerary-B.jpg',
//                         shorex: 'hero-shorex-B.jpg',
//                         home: 'hero-home-B.jpg'
//                     },
//                     'C': {
//                         itinerary: 'hero-itinerary-C.jpg',
//                         shorex: 'hero-shorex-C.jpg',
//                         home: 'hero-home-C.jpg'
//                     },
//                     'CE': {
//                         itinerary: 'hero-itinerary-CE.jpg',
//                         shorex: 'hero-shorex-CE.jpg',
//                         home: 'hero-home-CE.jpg'
//                     },
//                     'CF': {
//                         itinerary: 'hero-itinerary-CF.jpg',
//                         shorex: 'hero-shorex-CF.jpg',
//                         home: 'hero-home-CF.jpg'
//                     },
//                     'CS': {
//                         itinerary: 'hero-itinerary-CS.jpg',
//                         shorex: 'hero-shorex-CS.jpg',
//                         home: 'hero-home-CS.jpg'
//                     },
//                     'CW': {
//                         itinerary: 'hero-itinerary-CW.jpg',
//                         shorex: 'hero-shorex-CW.jpg',
//                         home: 'hero-home-CW.jpg'
//                     },
//                     'E': {
//                         itinerary: 'hero-itinerary-E.jpg',
//                         shorex: 'hero-shorex-E.jpg',
//                         home: 'hero-home-E.jpg'
//                     },
//                     'EB': {
//                         itinerary: 'hero-itinerary-EB.jpg',
//                         shorex: 'hero-shorex-EB.jpg',
//                         home: 'hero-home-EB.jpg'
//                     },
//                     'EC': {
//                         itinerary: 'hero-itinerary-EC.jpg',
//                         shorex: 'hero-shorex-EC.jpg',
//                         home: 'hero-home-EC.jpg'
//                     },
//                     'EM': {
//                         itinerary: 'hero-itinerary-EM.jpg',
//                         shorex: 'hero-shorex-EM.jpg',
//                         home: 'hero-home-EM.jpg'
//                     },
//                     'EN': {
//                         itinerary: 'hero-itinerary-EN.jpg',
//                         shorex: 'hero-shorex-EN.jpg',
//                         home: 'hero-home-EN.jpg'
//                     },
//                     'ET': {
//                         itinerary: 'hero-itinerary-ET.jpg',
//                         shorex: 'hero-shorex-ET.jpg',
//                         home: 'hero-home-ET.jpg'
//                     },
//                     'EW': {
//                         itinerary: 'hero-itinerary-EW.jpg',
//                         shorex: 'hero-shorex-EW.jpg',
//                         home: 'hero-home-EW.jpg'
//                     },
//                     'H': {
//                         itinerary: 'hero-itinerary-H.jpg',
//                         shorex: 'hero-shorex-H.jpg',
//                         home: 'hero-home-H.jpg'
//                     },
//                     'I': {
//                         itinerary: 'hero-itinerary-I.jpg',
//                         shorex: 'hero-shorex-I.jpg',
//                         home: 'hero-home-I.jpg'
//                     },
//                     'IA': {
//                         itinerary: 'hero-itinerary-IA.jpg',
//                         shorex: 'hero-shorex-IA.jpg',
//                         home: 'hero-home-IA.jpg'
//                     },
//                     'IF': {
//                         itinerary: 'hero-itinerary-IF.jpg',
//                         shorex: 'hero-shorex-IF.jpg',
//                         home: 'hero-home-IF.jpg'
//                     },
//                     'L': {
//                         itinerary: 'hero-itinerary-L.jpg',
//                         shorex: 'hero-shorex-L.jpg',
//                         home: 'hero-home-L.jpg'
//                     },
//                     'M': {
//                         itinerary: 'hero-itinerary-M.jpg',
//                         shorex: 'hero-shorex-M.jpg',
//                         home: 'hero-home-M.jpg'
//                     },
//                     'N': {
//                         itinerary: 'hero-itinerary-N.jpg',
//                         shorex: 'hero-shorex-N.jpg',
//                         home: 'hero-home-N.jpg'
//                     },
//                     'O': {
//                         itinerary: 'hero-itinerary-O.jpg',
//                         shorex: 'hero-shorex-O.jpg',
//                         home: 'hero-home-O.jpg'
//                     },
//                     'P': {
//                         itinerary: 'hero-itinerary-P.jpg',
//                         shorex: 'hero-shorex-P.jpg',
//                         home: 'hero-home-P.jpg'
//                     },
//                     'S': {
//                         itinerary: 'hero-itinerary-S.jpg',
//                         shorex: 'hero-shorex-S.jpg',
//                         home: 'hero-home-S.jpg'
//                     },
//                     'SN': {
//                         itinerary: 'hero-itinerary-SN.jpg',
//                         shorex: 'hero-shorex-SN.jpg',
//                         home: 'hero-home-SN.jpg'
//                     },
//                     'T': {
//                         itinerary: 'hero-itinerary-T.jpg',
//                         shorex: 'hero-shorex-T.jpg',
//                         home: 'hero-home-T.jpg'
//                     },
//                     'W': {
//                         itinerary: 'hero-itinerary-W.jpg',
//                         shorex: 'hero-shorex-W.jpg',
//                         home: 'hero-home-W.jpg'
//                     },
//                     'WA': {
//                         itinerary: 'hero-itinerary-WA.jpg',
//                         shorex: 'hero-shorex-WA.jpg',
//                         home: 'hero-home-WA.jpg'
//                     },
//                     'WF': {
//                         itinerary: 'hero-itinerary-WF.jpg',
//                         shorex: 'hero-shorex-WF.jpg',
//                         home: 'hero-home-WF.jpg'
//                     },
//                     'WM': {
//                         itinerary: 'hero-itinerary-WM.jpg',
//                         shorex: 'hero-shorex-WM.jpg',
//                         home: 'hero-home-WM.jpg'
//                     },
//                     'WS': {
//                         itinerary: 'hero-itinerary-WS.jpg',
//                         shorex: 'hero-shorex-WS.jpg',
//                         home: 'hero-home-WS.jpg'
//                     },
//                     'WW': {
//                         itinerary: 'hero-itinerary-WW.jpg',
//                         shorex: 'hero-shorex-WW.jpg',
//                         home: 'hero-home-WW.jpg'
//                     },
//                     'X': {
//                         itinerary: 'hero-itinerary-X.jpg',
//                         shorex: 'hero-shorex-X.jpg',
//                         home: 'hero-home-X.jpg'
//                     },
//                     'default': {
//                         itinerary: 'hero-itinerary-default.jpg',
//                         shorex: 'hero-shorex-default.jpg',
//                         home: 'hero-home-default.jpg',
//                         spa: 'hero-spa.jpg'
//                     }
//                 }

//             };
//         }]);
