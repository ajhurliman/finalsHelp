

/**
 * @ngdoc directive
 * @name olci.directives.buttonGreen
 * @description Directive for turning input with typeahead into a dropdown.
 */
angular.module('olci.directives.typeaheadDropdown', ['ui.bootstrap'])

    .directive('typeaheadDropdown', function factory( $parse, $timeout ) {
        return {
            require: 'ngModel',
            scope: true,
            link: function(scope, el, attrs, ngModel) {
                // START Modified from : https://github.com/angular-ui/bootstrap/blob/master/src/typeahead/typeahead.js
                var TYPEAHEAD_REGEXP = /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w\d]*))\s+in\s+([\s\S]+?)$/;

                function parse( input ) {
                    var match = input.match(TYPEAHEAD_REGEXP);
                    if (!match) {
                        throw new Error(
                            'Expected typeahead specification in form of "_modelValue_ (as _label_)? for _item_ in _collection_"' +
                            ' but got "' + input + '".');
                    }

                    return {
                        itemName    : match[3],
                        source      : $parse(match[4]),
                        viewMapper  : $parse(match[2] || match[1]),
                        modelMapper : $parse(match[1])
                    };
                }
                // Expressions used by typeahead
                var parserResult = parse(attrs.typeahead);
                var context = this;

                // END Modified from: https://github.com/angular-ui/bootstrap/blob/master/src/typeahead/typeahead.js

                // Modified from: http://plnkr.co/edit/ZtuoTVgPLuMWDT2ejULW?p=preview
                ngModel.$parsers.push( function (inputValue) {
                    if ( !parserResult.source(scope, {$viewValue: inputValue}).length ) {
                        ngModel.$setValidity('typeahead', false);
                    }
                    else {
                        ngModel.$setValidity('typeahead', true);
                    }
                    
                    // Don't put empty space to model
                    if( inputValue === ' ' ){
                        return '';
                    }
                    return inputValue;
                });

                el.bind( 'focus', function (e) {
                    var viewValue = ngModel.$viewValue;

                    // Restore to null value so that the typeahead can detect a change
                    if (viewValue === ' ') {
                        ngModel.$setViewValue('');
                    }

                    // Force trigger the popup
                    ngModel.$setViewValue(' ');

                    // Set the actual value in case there was already a value in the input
                    ngModel.$setViewValue( viewValue || ' ' );
                });


                el.bind( 'blur', function (e) {

                        console.log(ngModel.$viewValue);
                        console.log(parserResult);
                        
                        var matchArray = parserResult.source(scope, {$viewValue: ngModel.$viewValue});
                        var match = false;

                        matchArray.forEach( function ( item ) {
                            if ( item.label === ngModel.$viewValue ) {
                                match = true;
                            }
                        });
                        if ( match ) {
                            ngModel.$setValidity('typeahead', true);
                        }
                        else {
                            if ( !e.relatedTarget ) {
                                ngModel.$setValidity('typeahead', false);
                                ngModel.$modelValue = undefined;
                            }
                        }
                    
                });

                // Maybe in $formatters? - http://stackoverflow.com/questions/17011288/angularjs-initial-form-validation-with-directives
                // el.bind( 'blur', function (e) {
                //     if ( !parserResult.source(scope, {$viewValue: ngModel.$viewValue}).length ) {
                //         ngModel.$setViewValue( '' );
                //     }
                // });


                scope.onSelect = function( item ) {
                    console.log('select');
                    // ngModel.$viewValue = item.label ;
                    // ngModel.$setValidity('typeahead', true);
                    el[0].focus();  // For some reason blur isn't working, but focus gets us the expected behaviour.
                };


                // Filter to return all items if input is blank.
                scope.emptyOrMatch = function( actual, input ) {
                    if (input === ' ') {
                        return true;
                    }
                    // var match = false;
                    // collection.forEach( function ( item ) {
                    //     if ( item.label === ngModel.$viewValue ) {
                    //         match = true;
                    //     }
                    // });
                    // ngModel.$setValidity('typeahead', match);
                    return actual.toLowerCase().indexOf( input.toLowerCase() ) > -1;
                };

                scope.startsWith = function( actual, input ) {
                    return actual.substr(0, input.length).toUpperCase() === input.toUpperCase();
                };
            }
        };
    });
