

/**
 * @ngdoc directive
 * @name olci.directives.fieldRequiredValidation
 * @description Adds an alert for required field validation.
 */
angular.module('olci.directives.fieldRequiredValidation', [])

    .directive('fieldRequiredValidation', function factory() {
        return {
            restrict: 'A',
            replace: false,
            require: "^form",
            // scope: {
            //     copy: '@buttonGreenCopy',
            //     label: '@buttonGreenLabel'
            // },
            // templateUrl: 'directives/fieldRequiredValidation/fieldRequiredValidation.tpl.html',
            
            link: function( scope, el, attrs, formCtrl ) {
                // find the text box element, which has the 'name' attribute
                var inputEl   = el[0].querySelector("[name]");
                // convert the native text box element to an angular element
                var inputNgEl = angular.element(inputEl);
                // get the name on the text box so we know the property to check
                // on the form controller
                var inputName = inputNgEl.attr('name');

                // only apply the has-error class after the user leaves the text box
                inputNgEl.bind('blur', function() {
                    console.dir(formCtrl);
                    console.dir(formCtrl[inputName].$error);
                  el.toggleClass('has-required-error', formCtrl[inputName].$error.required);
                });
            }
        };
    });
