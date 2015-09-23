

/**
 * @ngdoc service
 * @name olci.services.FindImageService
 * @description Service that finds and returns a promise for image src strings.
 */
angular.module('fh.services.FindImageService', [
        'ngStorage',
        'vendor.steelToe'
    ])

.factory('FindImageService', function($http, $sessionStorage, $q, steelToe) {
    // Checks if image exists.  Returns default image source if it doesn't.
    // Private helper method.
    function isImage(src, defaultSrc) {

        var deferred = $q.defer();

        var image = new Image();
        image.onerror = function() {
            // console.log('error: ' + src + ' not found');
            deferred.resolve( defaultSrc );
        };
        image.onload = function() {
            deferred.resolve( src );
        };
        image.src = src;

        return deferred.promise;
    }

    return {
        /**
         * @ngdoc method
         * @name olci.services.FindImageService#itineraryImage
         * @methodOf olci.services.FindImageService
         * @description Generate a URL for itinerary image.  If generated URL is not valid, return default image URL.
         * @returns {object} a promise object that returns a relative URL for the resource
         * @example
         <pre>
         'OLCI_dest_A.jpg'
         </pre>
         * */
        itineraryImage: function() {
            var destCode = steelToe.do($sessionStorage).get('bookingInfo.destinationCode') || '';
            return isImage(
                './assets/images/onboard/OLCI_dest_' + destCode.slice(0, 1) + '.jpg',
                './assets/images/onboard/OLCI_dest_default.jpg'
            );
        },

        getHeaderImage: function(companyCode) {
            var imageUrl = './assets/images/headerImage.jpg';
            return isImage(imageUrl);
        },


        /**
         * @ngdoc method
         * @name olci.services.FindImageService#bookingSummaryImage
         * @methodOf olci.services.FindImageService
         * @description Generate a URL for booking summary image.  If generated URL is not valid, return default image URL.
         * @returns {object} a promise object that returns a relative URL for the resource
         * @example
         <pre>
         'OLCI_dest_A_2.jpg'
         </pre>
         * */
        bookingSummaryImage: function() {
            var destCode = steelToe.do($sessionStorage).get('bookingInfo.destinationCode') || [];
            return isImage(
                './assets/images/onboard/OLCI_dest_' + destCode.slice(0, 1) + '_2.jpg',
                './assets/images/onboard/OLCI_dest_default_2.jpg'
            );
        },

        marinerImage: function(marinerNum) {
            if (!marinerNum) return '';
            return isImage(
                './assets/star_mariner/' + marinerNum + 'starMariner.gif'
            );
        },


        /**
         * @ngdoc method
         * @name olci.services.FindImageService#stateRoomImage
         * @methodOf olci.services.FindImageService
         * @description Generate a URL stateroom image.  If generated URL is not valid, return default image URL.
         * @returns {object} a promise object that returns a relative URL for the resource
         * @example
         <pre>
         'AM_OLCI_stateroom_neptune.jpg'
         </pre>
         * */
        stateroomImage: function() { 
            var cabinCategories = [ 
                { 
                    category: 'interior', 
                    codes: [ 'I', 'J', 'K', 'L', 'M', 'MM', 'N', 'NN', 'IA', 'IQ', 'R' ] 
                }, 
                {  // TODO: This may not be real.
                    category: 'inside', 
                    codes: [ 'IS' ]  
                }, 
                { 
                    category: 'ocean', 
                    codes: [ 'C', 'CA', 'CQ', 'D', 'DA', 'DD', 'E', 'EE', 'F', 'FA', 'FB', 'FF', 'G', 'H', 'HH', 'GG', 'OO', 'Q' ] 
                }, 
                { 
                    category: 'vista', 
                    codes: [ 'A', 'AA', 'AB', 'AS', 'B', 'BA', 'BB', 'BC', 'BQ' ] 
                }, 
                { 
                    category: 'neptune', 
                    codes: [ 'S', 'SA', 'SB', 'SC', 'SQ' ] 
                }, 
                { 
                    category: 'pinnacle', 
                    codes: [ 'PS' ] 
                }, 
                { 
                    category: 'verandah', 
                    codes: [ 'V', 'VA', 'VB', 'VC', 'VD', 'VE', 'VF', 'VH', 'VQ', 'VS', 'VT' ] 
                }, 
                { 
                    category: 'signature', 
                    codes: [ 'SS', 'SY', 'SZ', 'SU' ] 
                }, 
                { 
                    category: 'lanai', 
                    codes: [ 'CA' ] 
                }, 
            ];
            var shipCode = steelToe.do($sessionStorage).get('bookingInfo.shipCode') || '';
            shipCode.toUpperCase();
            var cabinCategory = steelToe.do($sessionStorage).get('bookingInfo.stateroomCategory') || '';
            cabinCategory.toUpperCase();
            var category = 'default';
            var categoryCount = cabinCategories.length;

            for ( var i = 0; i < categoryCount; i++ ) {
                if ( cabinCategories[i].codes.indexOf( cabinCategory ) !== -1 ) {
                    category = cabinCategories[i].category.toLowerCase();
                    break;
                }
            }

            return isImage(
                './assets/images/onboard/' + shipCode + '_OLCI_stateroom_' + category + '.jpg',
                './assets/images/onboard/OLCI_stateroom_default.jpg'
            );
        }

    };
});



// interior
// I, J, K, L, M, MM, N, NN, IA, IQ, R

// ocean
// C, CA, CQ, D, DA, DD, E, EE, F, FA, FB, FF, G, H, HH, GG, OO, Q

// vista
// A, AA, AB, AS, B, BA, BB, BC, BQ

// neptune
// S, SA, SB, SC, SQ

// pinnacle
// PS

// verandah
// V, VA, VB, VC, VD, VE, VF, VH, VQ, VS, VT

// signature
// SS, SY, SZ, SU

// lanai
// CA

