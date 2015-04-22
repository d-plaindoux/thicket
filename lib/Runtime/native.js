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
        M.define('Pair',   function(left)   { return function(right) { return { '[id]':'Pair',_1:left, _2:right };};});
        M.define('string', function(native) { return { '[id]':'string','[this]':native };});
        M.define('number', function(native) { return { '[id]':'number','[this]':native };});
        M.define("dom",    function(native) { return { '[id]':'string','[this]':native };});

        M.code("internal.apply", function(n1) {
            var name = M.$$(M.$$(n1)['[this]'])['[this]'];
            if (M.deltarules.hasOwnProperty(name)) {
                return M.deltarules[name];
            } else {
                throw new Error("no system definition for " + name);
            }
        });
           
        M.code("generic.==", function(n1){
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
        
        M.code("generic.<<", function(n1){
            return function(n2){
                return function(vTrue) {
                    return function(vFalse) {                    
                        var v1 = M.$$(n1)['[this]'],
                            v2 = M.$$(n2)['[this]'];                    
                        if (v1 < v2) {
                            return M.$$(vTrue);
                        } else {
                            return M.$$(vFalse);
                        }
                    };
                };
            };
        });
        
        M.code("string.+", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
                return M.$$(M.string(v1+""+v2));
            };
        });
            
        M.code("string.toNumber", function(n1){
            return function(vSome) {
                return function(vNone) {                    
                    var v1 = M.$$(n1)['[this]'],
                        vR = Number(v1);
                    if (isNaN(vR)) {
                        return M.$$(vNone);
                    } else {
                        return M.$$(M.apply(vSome,M.number(vR)));
                    }
                };
            };
        });
            
        M.code("string.hash", function(n1){
            var v1 = M.$$(n1)['[this]'],
                hash = 0;
            
            // cf. http://stackoverflow.com/questions/7616461/
            
            v1.split('').forEach(function(c) {
                hash = (((hash << 5) - hash) + c.charCodeAt(0)) | 0;
            });
            
            return M.$$(M.number(hash));
        });
            
        M.code("number.+", function(n1){
            return function(n2){
                var v1 = M.$$(n1)['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
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
        
        M.code("array.new", function(n1) {
            var v1 = M.$$(n1)['[this]'];
            return { array : new Array(v1) };
        });
               
        M.code("array.set", function(n1){
            return function(index){
                return function(value) {
                    return function(array) {
                        var v1 = M.$$(M.$$(n1)['[this]']),
                            vi = M.$$(index)['[this]'];
                        if (vi <= -1 || v1.array.length <= vi) {
                            // Nothing
                        } else {
                            v1.array[vi] = value;
                        }

                        return M.$$(M.apply(array,v1));
                    };
                };
            };
        });
        
        M.code("array.get", function(n1){
            return function(index){
                return function(some) {                    
                    return function(none) {                    
                        var v1 = M.$$(M.$$(n1)['[this]']),
                            vi = M.$$(index)['[this]'];
                        if (vi <= -1 || v1.array.length <= vi) {
                            return M.$$(none);
                        } else if (v1.array[vi]) {
                             return M.$$(M.apply(some,v1.array[vi]));
                        } else {
                            return M.$$(none);
                        }
                    };
                };
            };
        });
                        
        M.code("array.size", function(n1){
            var v1 = M.$$(M.$$(n1)['[this]']);
            return M.$$(M.number(v1.length));    
        });
                        
        return M;
    }
    
    return load;
}());
 