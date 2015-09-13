/*
 * FrontEndLinkService.spec.js
 *
 * Created: Thursday, February 12, 2015
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
describe( 'FrontEndLinkService', function() {
    var service, scope, Configuration;

    beforeEach(function(){
        module('olci.services.FrontEndLinkService');
        module('ApplicationConfiguration');
    });

    beforeEach(function() {
        inject(function (FrontEndLinkService, $rootScope, _Configuration_) {
            Configuration = _Configuration_;
            service = FrontEndLinkService;
            scope = $rootScope.$new();
        });
    });

    describe('HAL links', function(){

        it('my account', function(){
            expect(service.getMyAccount()).toBe(Configuration.frontend.baseUrl + '/myAccount/Announcements.action');
        });

        it('help', function(){
            expect(service.getHelp()).toBe(Configuration.frontend.baseUrl + '/cruise-vacation-planning/PlanningAndAdvice.action?tabName=New+to+Cruising');
        });

        it('checkIn', function(){
            expect(service.getCheckIn()).toBe(Configuration.frontend.baseUrl + '/cruise-vacation-planning/OnlineCheckIn.action');
        });

        it('makePayment', function(){
            expect(service.getMakePayment()).toBe(Configuration.frontend.baseUrl + '/cruise-vacation-planning/MakeOnlinePayment.action');
        });

        it('getDeckPlan', function(){
            expect(service.getDeckPlan()).toBe(Configuration.frontend.baseUrl + '/main/DeckPlansFull.action?WT.ac=pnav_Onboard_Deckplans');
        });

        it('getDocumentation', function(){
            expect(service.getDocumentation()).toBe(Configuration.frontend.baseUrl + '/cruise-vacation-planning/PlanningAndAdvice.action?tabName=Cruise+Preparation&contentMenu=Passports,+Visas+%26+Vaccinations');
        });
    });

    describe('SBN links', function(){

        beforeEach(function() {
            Configuration.appName = 'sbn';
            Configuration.frontend.baseUrl = "https://qa.seabourn.com";
        });

        it('my account', function(){
            expect(service.getMyAccount()).toBe('https://qa.seabourn.com/my-Seabourn/Announcements.action');
        });

        it('help', function(){
            expect(service.getHelp()).toBe('https://qa.seabourn.com/luxury-cruise-vacation-planning/Planning-And-Advice.action?tabName=Frequently+Asked+Questions&WT.ac=pnav_AboutFAQ');
        });

        it('checkIn', function(){
            expect(service.getCheckIn()).toBe('https://qa.seabourn.com/luxury-cruise-vacation-planning/Online-CheckIn.action');
        });

        it('makePayment', function(){
            expect(service.getMakePayment()).toBe('https://qa.seabourn.com/luxury-cruise-vacation-planning/MakeOnlinePayment.action');
        });

        it('getDeckPlan', function(){
            expect(service.getDeckPlan()).toBe('https://qa.seabourn.com/main/Deck-Plans-Full.action?WT.ac=pnav_OnbDeckplans');
        });

        it('getDocumentation', function(){
            expect(service.getDocumentation()).toBe('https://qa.seabourn.com/luxury-cruise-vacation-planning/Planning-And-Advice.action?tabName=Frequently+Asked+Questions&contentMenu=Travel+Documents');
        });

        afterEach(function(){
            Configuration.appName = 'hal';
            Configuration.frontend.baseUrl = "https://qa.hollandamerica.com";
        });
    });

});

