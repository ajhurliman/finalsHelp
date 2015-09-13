/*
 * FrontEndLinkService.js
 *
 * Created: Thursday, February 12, 2015
 * (c) Copyright 2014 Holland America, Inc. - All Rights Reserved
 * This is unpublished proprietary source code of Holland America, Inc.
 * The copyright notice above does not evidence any actual or intended
 * publication of such source code.
 */


/**
 * @ngdoc service
 * @name olci.services.FrontEndLinkService
 * @description Stores HAL and SBN variations of common links 
 */
angular.module('olci.services.FrontEndLinkService', [
    'ApplicationConfiguration',
    'olci.services.RoutingUtilsService'
])

.service('FrontEndLinkService', function (Configuration, RoutingUtilsService) {

    return {
        getSignout: function(){
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/myAccount/LogoutUser.action') :
                RoutingUtilsService.frontendBaseUrl('/my-Seabourn/LogoutUser.action');
        },

        getMyAccount: function(){
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/myAccount/Announcements.action') :
                RoutingUtilsService.frontendBaseUrl('/my-Seabourn/Announcements.action');
        },

        getHelp: function() {
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/cruise-vacation-planning/PlanningAndAdvice.action?tabName=New+to+Cruising') :
                RoutingUtilsService.frontendBaseUrl('/luxury-cruise-vacation-planning/Planning-And-Advice.action?tabName=Frequently+Asked+Questions&WT.ac=pnav_AboutFAQ');
        },

        getCheckIn: function() {
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/cruise-vacation-planning/OnlineCheckIn.action') :
                RoutingUtilsService.frontendBaseUrl('/luxury-cruise-vacation-planning/Online-CheckIn.action');
        },

        getMakePayment: function() {
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/cruise-vacation-planning/MakeOnlinePayment.action') :
                RoutingUtilsService.frontendBaseUrl('/luxury-cruise-vacation-planning/MakeOnlinePayment.action');
        },

        getDeckPlan: function() {
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/main/DeckPlansFull.action?WT.ac=pnav_Onboard_Deckplans') :
                RoutingUtilsService.frontendBaseUrl('/main/Deck-Plans-Full.action?WT.ac=pnav_OnbDeckplans');
        },

        getDocumentation: function() {
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/cruise-vacation-planning/PlanningAndAdvice.action?tabName=Cruise+Preparation&contentMenu=Passports,+Visas+%26+Vaccinations') :
                RoutingUtilsService.frontendBaseUrl('/luxury-cruise-vacation-planning/Planning-And-Advice.action?tabName=Frequently+Asked+Questions&contentMenu=Travel+Documents');
        },
        getChatCallTemplate: function(){
            return Configuration.appName === 'hal' ?
                RoutingUtilsService.frontendBaseUrl('/main/LoadChatCallData.action') :
                RoutingUtilsService.frontendBaseUrl('/main/LoadChatCallData.action');
        }

    };
});

