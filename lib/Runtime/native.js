/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    function load(M) {
        var codes = {};
        
        function code(name, value) {
            codes[name] = value;
        }
        
        M.define('native', { '[id]':'native' });
        M.define('Pair',   function(left)   { return function(right) { return { '[id]':'Pair',_1:left, _2:right };};});
        M.define('string', function(native) { return { '[id]':'string','[this]':native };});
        M.define('number', function(native) { return { '[id]':'number','[this]':native };});
        M.define("dom",    function(native) { return { '[id]':'string','[this]':native };});
        
        M.code("internal.apply", function(n1) {
            var name = M.$$(M.$$(n1)['[this]'])['[this]'];
            return codes[name];
        });
                   
        code("string.+", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
                return M.$$(M.string(v1+""+v2));
            };
        });
            
        code("string.==", function(n1){
            return function(n2){
                return function(vTrue) {
                    return function(vFalse) {                    
                        var v1 = M.$$(n1)['[this]'],
                            v2 = M.$$(n2)['[this]']; 
                        console.log(v1);
                        if (v1 === v2) {
                            return M.$$(vTrue);
                        } else {
                            return M.$$(vFalse);
                        }
                    };
                };
            };
        });
            
        code("string.toNumber", function(n1){
            return function(vSome) {
                return function(vNone) {                    
                    var v1 = M.$$(n1)['[this]'],
                        vR = Number(v1);
                    if (isNaN(vR)) {
                        return M.$$(vNone);
                    } else {
                        return M.$$(M.apply(vSome,vR));
                    }
                };
            };
        });
            
        code("number.==", function(n1){
            return function(n2){
                return function(vTrue) {
                    return function(vFalse) {                    
                        var v1 = M.$$(n1)['[this]'],
                            v2 = M.$$(n2)['[this]'];                    
                        if (v1 === v2) {
                            return M.$$(vTrue);
                        } else {
                            return M.$$(vFalse);
                        }
                    };
                };
            };
        });

                    
        code("number.+", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
                return M.$$(M.number(v1+v2));
            };
        });
        
        code("number.+", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
                return M.$$(M.number(v1+v2));
            };
        });
            
        code("number.*", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                
                return M.$$(M.number(v1*v2));
            };
        });

        code("number.-", function(n1){
                return function(n2){
                    var v1 = M.$$(n1)['[this]'],
                        v2 = M.$$(n2)['[this]'];                    
                    return M.$$(M.number(v1-v2));
                };
        });

        code("number./", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
                return M.$$(M.number(v1/v2));
            };
        });

        code("number.toString", function(n1){
            var v1 = M.$$(n1)['[this]'];                
            return M.$$(M.string(v1+"")); // TODO
        });
        
        return M;
    }
    
    return load;
}());
 