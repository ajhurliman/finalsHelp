/*
 * TimeUtilsService.js
 *
 * Created: Wednesday, February 12, 2014
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */

/**
 * @ngdoc service
 * @name olci.services.TimeUtilsService
 * @description Calculates trip time:<br>
 * `daysLeft()`<br>
 * `convertToHoursOrDays()`
 */
 angular.module( 'olci.services.TimeUtilsService', [


])
.service('TimeUtilsService', [ function() {
    return {


        /**
         * @ngdoc method
         * @name olci.services.TimeUtilsService#daysLeft
         * @methodOf olci.services.TimeUtilsService
         * @description calculates days left
         * @param {date} itineraryBeginDate date object
         * @param {date} currentDate date object
         * @returns {number} milliseconds of time left
         * */
        daysLeft: function(itineraryBeginDate, currentDate) {
            if (!itineraryBeginDate) {
                return 0;
            }

            // Setting time to midnight, to calculate full days.
            var departureDate = new Date(itineraryBeginDate).setHours(0, 0, 0, 0);
            var localDate = new Date(currentDate).setHours(0, 0, 0, 0);
            var milliseconds = Math.max(0, departureDate - localDate);

            //DST can cause this to return 2.04 days or 1.96 days if the time spans a changeover -JDM
            return Math.round(milliseconds / (24 * 60 * 60 * 1000));
        },
        /**
         * hours should be formatted to one decimal place
         * when hours are .9 or less the affix of "hours" will be used
         * when hours is 1 the affix "hour" will be used
         * when hours is in the range from 1.1 to 23.9 the affix "hours" will be used
         * hours will be converted into days starting with 24
         * days will always be listed as a whole number with any decimal dropped
         * when days is 1 the affix will be "day"
         * when days is greater than 1 the affix "days" will be used
         *
         * @return {{amount: Number, units: 'hours' | 'days' }}
         */

        /**
         * @ngdoc method
         * @name olci.services.TimeUtilsService#convertToHoursOrDays
         * @methodOf olci.services.TimeUtilsService
         * @description hours should be formatted to one decimal place
         <pre>
             when hours are .9 or less the affix of "hours" will be used
             when hours is 1 the affix "hour" will be used
             when hours is in the range from 1.1 to 23.9 the affix "hours"
                will be used
             hours will be converted into days starting with 24
             days will always be listed as a whole number with any decimal dropped
             when days is 1 the affix will be "day"
             when days is greater than 1 the affix "days" will be used
         </pre>
         * @param {number} hours number of hours
         * @returns {Object} result object
         * @example
         <pre>
            {{amount: Number, units: 'hours' | 'days' }}
         </pre>
         * */
        convertToHoursOrDays: function(hours) {
            var result;

            if (hours === undefined) {
                result = { amount: 0, units: 'hours', translation: 'shorexLanding.hours'};
            } else if (hours < 24) {
                // round hours to one decimal place
                var tenths = Math.round(hours * 10 ) / 10;
                result = { amount: tenths, units: 'hours', translation: tenths === 1 ? 'shorexLanding.hour' : 'shorexLanding.hours'};
            } else {
                result = { amount: Math.floor(hours / 24) + 1, units: 'days', translation: 'shorexLanding.days'};
            }

            return result;
        }
    };
}]);
