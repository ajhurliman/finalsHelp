

/**
 * @ngdoc directive
 * @name olci.directives.olciAccordion
 * @description Directive guest accordion.
 */
angular.module('olci.directives.olciAccordion', [
        'olci.services.ChangePageService',
        'olci.services.LoyaltyService',
        'vendor.steelToe'
    ])

    .directive('olciAccordion', function factory() {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: 'directives/olciAccordion/olciAccordion.tpl.html',
            controller: function( $scope, $state, ChangePageService ) {
                $scope.isOpen = [];
                $scope.isOpen[ 0 ] = true;  // TODO: Use function from checkinProgress.js

                $scope.isComplete = function (page, seqNumber) {
                    var result = false;
                    switch(page) {
                        case 'details':
                            result = $scope.detailsIsComplete( seqNumber );
                            break;
                        case 'passport':
                            result = $scope.passportIsComplete( seqNumber );
                            break;
                        case 'flights':
                            result = $scope.flightsIsComplete( seqNumber );
                            break;
                        case 'emergency':
                            result = $scope.emergencyIsComplete( seqNumber );
                            break;
                        case 'account':
                            result = $scope.accountIsComplete( seqNumber );
                            break;
                        case 'preferences':
                            result = $scope.preferencesIsComplete( seqNumber );
                            break;
                    }
                    return result;
                };

                $scope.prevGuest = function ( index ) {
                    $scope.isOpen.forEach( function (obj, index, arr) {
                        arr[index] = false;
                    });
                    $scope.isOpen[parseInt( index ) - 1 ] = true;
                };
                $scope.nextGuest = function ( index ) {
                    $scope.isOpen.forEach( function (obj, index, arr) {
                        arr[index] = false;
                    });
                    $scope.isOpen[parseInt( index ) + 1 ] = true;
                    var top = document.getElementsByClassName('guest-accordion-header')[index].offsetTop; //Getting Y of target element
                    window.scrollTo(0, top);
                };

                $scope.continue = function (callfirst) {
                    callfirst().then(function(res) {
                        console.log(res);
                        ChangePageService.nextPage();
                    }, function(err) {
                        console.log(err);
                    });
                };
            },
            link: function (scope, element, attr, ctrl, transclude) {
                scope.page = attr.olciAccordionPage;

                // http://angular-tips.com/blog/2014/03/transclusion-and-scopes/
                // transclude(scope, function(clone, scope) {
                //     element.append(clone);
                // });
            }
        };
    })

    .directive('passengerTransclude', function() {
        return {
            restrict: "A",
            link: function (scope, elem, attrs, ctrl, $transclude) {
                // Create a new scope that inherits from the parent of the
                // search directive ($parent.$parent) so that result can be used with other
                // items within that scope (e.g. selectResult)
                var newScope = scope.$parent.$new();
                // Put result from isolate to be available to transcluded content
                // newScope.passenger = scope.$eval(attrs.passenger);
                $transclude(newScope, function (clone) {
                    elem.append(clone);
                });
            }
        };
    });
