/*global document*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    function load(M) {    
        
        M.define("dom", function(native) { return { '[id]':'string','[this]':native };});
        
        M.code("string.toDom", function(n1){
            var v1 = M.$$(n1)['[this]'];
            return document.createTextNode(v1);
        });
        
        M.code("dom.elementById", function(n1){
            return function(some) {                    
                return function(none) {                    
                    var name = M.$$(M.$$(n1)['[this]']),
                        node = document.getElementById(name);
                    if (node) {
                         return M.$$(M.apply(some,node));
                    } else {
                        return M.$$(none);
                    }
                };
            };
        });

        M.code("dom.createElement", function(n1){
            var r1 = M.$$(n1),
                v1 = M.$$(r1['[this]']);

            return document.createElement(v1);
        });

        M.code("dom.setAttribute", function(n1){
            return function(n2){
                return function(n3){
                    var r1 = M.$$(n1),
                        v1 = M.$$(r1['[this]']),
                        v2 = M.$$(M.$$(n2)['[this]']),
                        v3 = M.$$(M.$$(n3)['[this]']);

                    v1.setAttribute(v2,v3);

                    return r1;
                };
            };            
        });

        M.code("dom.setFunction", function(n1){
            return function(n2){
                return function(n3){
                    var r1 = M.$$(n1),
                        v1 = M.$$(r1['[this]']),
                        v2 = M.$$(M.$$(n2)['[this]']);

                    M.define("action", M.lazy(function () { return M.$$(M.apply(n3,r1)); }));
                    
                    v1.setAttribute(v2, "MovicoRT.$$(MovicoRT.ident('action'))");

                    return r1;
                };
            };            
        });

        M.code("dom.appendChild", function(n1){
            function appendChild(v1, n2) {
                var r2 = M.$$(n2),
                    v2 = M.$$(r2['[this]']);

                v1.appendChild(v2);
            }
            
            return function(n2){
                var r1 = M.$$(n1),
                    v1 = M.$$(r1['[this]']),
                    r2 = M.$$(n2);
                    
                if (M.getType(r2) === 'Array') {
                    r2.forEach(function(n2) {
                        appendChild(v1, n2);
                    });
                } else {
                    appendChild(v1, n2);
                }

                return r1;
            };            
        });
        
        M.code("dom.removeChilds", function(n1){
            var r1 = M.$$(n1),
                v1 = M.$$(r1['[this]']),

            while (v1.firstChild) {
                v1.removeChild(v1.firstChild);
            }  
            
            return r1;
        });
        
        M.code("dom.clone", function(n1){
            var r1 = M.$$(n1),
                v1 = M.$$(r1['[this]']);

            return v1.cloneNode();
        });
        
        M.code("dom.remove", function(n1){
            var r1 = M.$$(n1),
                v1 = M.$$(r1['[this]']);

            v1.parentNode.removeChild(v1);
            
            return r1;
        });
        
        M.code("dom.replace", function(n1){
            return function(n2){
                return function(dom) {                    
                    var r1 = M.$$(n1),
                        v1 = M.$$(r1['[this]']),
                        r2 = M.$$(n2),
                        v2 = M.$$(r2['[this]']);

                    v1.parentNode.replaceChild(v1,v2);

                    return M.$$(M.apply(dom,v2));
                };
            };
        });
        
        return M;
    }
    
    return load;
}());
 