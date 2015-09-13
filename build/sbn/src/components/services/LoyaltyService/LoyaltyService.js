/*
 * LoyaltyService.js
 *
 * Created: Tuesday, Jun 11, 2015
 * (c) Copyright 2015 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc service
 * @name olci.services.LoyaltyService
 * @description This module is dedicated to services responsible for fetching content from the
 *     backend using prepended paths.
 */

/**  Loyalty Preference Options:
 *
 *   codeItemType = "S", "G", "O", "SS", "P", or "0"
 *       S = Shore Excursions Discount
 *       G = Alcohol Discount
 *       O = Other perks (laundry, internet, telephone, newspaper,
 *       SS= Spa at Seabourn Serene
 *       P = Seabourn Club Signature Massage
 *       0 = null? Complimentary telephone?
 *
 *   discountType = "P", or "O"
 *       P = Percent
 *       O = Other / One Use / Orphan?
 *
 *   discount = 0, 10, 15, 25, (maybe more)
 *       //If discount > 0 &&  discountType === 'P'
 *       //  Discount is n%
 *       //
 *
 *   benefitType = "B", or "S"
 *       S = Shared
 *       B = Benefit (personal)
 *
 */





angular.module( 'olci.services.LoyaltyService', [
  'ApplicationConfiguration',
  'restangular',
  'ngStorage'
  // 'secondaryFlow.services.AuthService',
  // 'secondaryFlow.services.BookingService',
  // 'secondaryFlow.services.ShoppingCartService',
  // 'secondaryFlow.services.SignalTowerService'
] )

  .service('LoyaltyService', function  LoyaltyService( Restangular, $q, $interpolate, $sessionStorage, Configuration) {
    var CN = "LoyaltyService";
    var appName = Configuration.appName;

    var loyaltyService = {
      cleanLoyaltyData : {},
      loyaltySummary : null,
      loyaltyBaseUrl : Restangular
        .one( 'guest/v1.0.0/loyaltyPreference' )
        .one( 'companyCode', Configuration.companyCode ),

      updateLoyaltyPrefsUrl : Restangular
        .one( 'shopping/v1.0.0' )
        .one( 'companyCode', Configuration.companyCode )
        .one('cart'),

      loyaltySummaryResolver : function loyaltySummaryResolver( bookingNumber ) {
        var deferred = $q.defer();

        if( loyaltyService.loyaltySummary !== null ) {
          deferred.resolve( loyaltyService.loyaltySummary );
        } else {
          deferred.resolve( loyaltyService.getLoyaltyPrefs( bookingNumber ) );
        }

        return deferred.promise;
      },

      /**
       * It gets the loyalty preferences and sets loyaltySummary
       * @param bookingSummary
       * @returns {promise}
       */

      getLoyaltyPrefs : function getLoyaltyPrefs( bookingNumber, guests) {
        var deferred = $q.defer();

        loyaltyService.loyaltyBaseUrl
          .one( 'bookingNumber', bookingNumber )
          .get()
          .then(
            function prefsReceived( loyaltyData ) {
              console.dir(loyaltyData);
              loyaltyData.getList();
              loyaltyService.loyaltySummary = loyaltyService.createLoyaltySummary( loyaltyData, guests );
              deferred.resolve( loyaltyService.loyaltySummary );
            },
            function prefsFailed( error ) {
              deferred.reject( error );
            }
          );
        return deferred.promise;
      },

      // For Friday we create the for loop hashmap
      mapBestPrefs : function mapBestPrefs( rawLoyaltyData ) {
        var bestSharedPrefs = [];
        var key;

        _.each( rawLoyaltyData.bookingLoyaltyPreferenceGuests,
          function processLoyaltyGuest( loyaltyGuest ) {
            _.each( loyaltyGuest.loyaltyPreferencesDetail.preferenceListforTier,
              function processPref( pref ) {
                if( pref.benefitType !== 'S' ) {
                  return false;
                }

                key = loyaltyService.getKeyForPref( pref );

                if( !bestSharedPrefs[ key ] ) {
                  bestSharedPrefs[ key ] = pref;
                } else {
                  if( pref.discount > bestSharedPrefs[ key ].discount ) {
                    bestSharedPrefs[ key ] = pref;
                  }
                }
                return true;
              } );
          } );

        rawLoyaltyData.bestSharedPrefs = bestSharedPrefs;
        return rawLoyaltyData; //loyaltySummaryResolver we know it returns as a undefined
      },

      getKeyForPref : function getKeyForPref( pref ) {

        var percentPos = pref.description.indexOf( '%' );
        var key = pref.description.substring( percentPos );

        return key;
      },

      

      createLoyaltySummary : function createLoyaltySummary( rawLoyaltyData, guests ) {
        var loyaltySummary = loyaltyService.mapBestPrefs( rawLoyaltyData );
        loyaltySummary.preferenceCount = 0;
        loyaltySummary.preferenceLimit = 0;

        loyaltySummary.isAnyGuestAllowedToSpendLoyaltyPoints = false;
        loyaltyService.showSBNSpaLink = false;
        _.each( loyaltySummary.bookingLoyaltyPreferenceGuests, function processGuests( loyaltyGuest ) {

          // if (!loyaltyService.showSBNSpaLink) {
          //     // call hasSBNSpaBenefit when undefined or false
          //     loyaltyService.showSBNSpaLink = loyaltyService.hasSBNSpaBenefit(loyaltyGuest);
          // }

          if(loyaltyGuest.loyaltyPreferencesDetail.preferenceAllowLimit > 0) {
            loyaltySummary.isAnyGuestAllowedToSpendLoyaltyPoints = true;
          }

          _.find( guests, function transferGuestInfo( bookingGuest ) {
            var firstName = bookingGuest.firstName;
            var lastName = bookingGuest.lastName;
            var deferred = $q.defer();
            if( Number(bookingGuest.seqNumber) == Number(loyaltyGuest.partyNumber) ) {
              loyaltyGuest.guestInfo = {firstName: firstName, lastName: lastName};

              if(!loyaltyGuest.uniqueId) {
                //this was changed from secondary flow... we're just using sequence number
                loyaltyGuest.uniqueId = BookingService.bookingSummary.bookingNumber + "_" + loyaltyGuest.partyNumber;
              }

              if(!loyaltyGuest.mpUpdated) {
                //Don't know what this actually means - Preeti said it was required to be Y or N and N is default.
                loyaltyGuest.mpUpdated = "N";
              }
              return true;
              // return deferred.resolve(loyaltyGuest.guestInfo.firstName === bookingGuest.firstName).then(function() {
              //   return true;
              // });
            } else {
              return false;
            } 
            // return false;
            // deferred.resolve();
              // return( Number(bookingGuest.seqNumber) === Number(loyaltyGuest.partyNumber) );
          } );

          loyaltySummary.preferenceCount += loyaltyGuest.selectedLoyaltyPreferencesDetails.length;
          loyaltySummary.preferenceLimit += (loyaltyGuest.loyaltyPreferencesDetail.preferenceAllowLimit || 0);

        } );
        return loyaltySummary;
      },

      // hasSBNSpaBenefit: function(loyaltyGuest) {
      //     var match = _.find(loyaltyGuest.selectedLoyaltyPreferencesDetails, function(selected) {
      //         return selected.code === 'TZSER' && selected.prepaidSale === 'N' ||
      //                selected.code === 'TZSPA' && selected.prepaidSale === 'N';
      //     });

      //     return !!match;
      // },

      updateLoyaltyPrefs: function (loyaltySummary) {
        if(!loyaltySummary) {
          return;
        }

        loyaltySummary = loyaltySummary.bookingLoyaltyPreferenceGuests;
        var deferred = $q.defer();
        loyaltyService.updateLoyaltyPrefsUrl
          .post('loyaltyOptions', loyaltySummary)
          .then(
          function (loyaltyData) {
            //TODO Handle responses...

            //Right now LoyaltyData returns undefined and the cached data doesn't refresh the loyalty service selected prefs
            loyaltyService.getLoyaltyPrefs( $sessionStorage.bookingInfo.bookingNumber );

            deferred.resolve(loyaltyData);
          },
          //unsuccessful network call
          function (error) {
            deferred.reject(error);
          }
        );
        return deferred.promise;
      },

      reset: function reset() {
        loyaltyService.loyaltySummary = null;
        loyaltyService.cleanLoyaltyData = {};
      }
    };

    return loyaltyService;
  } );


  // hasPointsFilter : function hasPointsFilter( loyaltyGuest, hasPoints ) {
  //             if ( typeof loyaltyGuest.loyaltyPreferencesDetail.preferenceAllowLimit !== undefined ) return false;
  //             return (hasPoints) ? ( loyaltyGuest.loyaltyPreferencesDetail.preferenceAllowLimit > 0 ) : !( loyaltyGuest.loyaltyPreferencesDetail.preferenceAllowLimit > 0 );
  //         },
