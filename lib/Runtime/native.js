/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    function load(M) {
        M.define('native', { '[id]':'native' });
        M.define('Pair', function(left) { return function(right) { return { '[id]':'Pair',_1:left, _2:right };};});
        M.define('string', function(native) { return { '[id]':'string','[this]':native };});
        M.define('number', function(native) { return { '[id]':'number','[this]':native };});
        M.define("dom", function(native) { return { '[id]':'string','[this]':native };});
        
        M.code("string.+", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
                return M.$$(M.string(v1+""+v2));
            };
        });
            
        M.code("number.==", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
                if (v1 === v2) {
                } else {
                }
                return M.$$(M.number(v1+v2));
            };
        });
            
        M.code("number.+", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
                return M.$$(M.number(v1+v2));
            };
        });
            
        M.code("number.*", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                
                return M.$$(M.number(v1*v2));
            };
        });

        M.code("number.-", function(n1){
                return function(n2){
                    var v1 = M.$$(n1)['[this]'],
                        v2 = M.$$(n2)['[this]'];                    
                    return M.$$(M.number(v1-v2));
                };
        });

        M.code("number./", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
                return M.$$(M.number(v1/v2));
            };
        });

        M.code("number.toString", function(n1){
            var v1 = M.$$(n1)['[this]'];                
            return M.$$(M.string(v1+"")); // TODO
        });
        
        return M;
    }
    
    return load;
}());
 