angular.module('olci.directives.pageTitle', [])
    .directive('title', function($translate) {
       return {
           restrict: 'E',
           replace: false,
           link: function (scope, elem, attrs) {
               scope.$watch('pageTitle', function (newval) {
                   $translate('pageTitleTemplate', {pageTitle : newval})
                       .then(function(pageTitle) {
                           elem.html(pageTitle);
                       });
               });
               elem.html(scope.pageTitle);
           }
       };
    });