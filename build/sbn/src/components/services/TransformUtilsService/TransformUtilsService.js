angular.module('olci.services.TransformUtilsService', [
    'ngStorage',
    'ApplicationConfiguration',
    'vendor.steelToe'
])

.factory('TransformUtilsService', function( $sessionStorage, Configuration, steelToe ) {

    return {
        //copies properies from one object to another
        transformObject: function( readObj, writeObj, paths ) {
            paths.forEach(function( el, index, array ) {
                var readItem = steelToe.do( readObj ).get( el.read );
                steelToe.do( writeObj ).set( el.write, readItem );
            });
        },

        transformRequestObject: function( obj ) {
            var str = [];
            for (var p in obj) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
            var results = str.join("&");
            console.log(results);
            return str.join("&");
        },

        zeroPad: function( n, width, z ) {
            z = z || '0';
            width = width || 2;
            n = n + '';
            return n.length >= width ? n : new Array( width - n.length + 1 ).join( z ) + n;
        }

    };
    
});