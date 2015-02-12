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
        M.code("string.toDom", function(n1){
            var v1 = M.$$(n1)['[this]'];                
            return M.apply(M.ident("dom"),document.createTextNode(v1));
        });
        
        M.code("document.@", function(){
            return function(n2){
                var v2 = M.$$(n2)['[this]'];                
                return M.apply(M.ident("dom"),document.getElementById(v2));
            };
        });

        M.code("dom.<<", function(n1){
            return function(n2){
                var r1 = M.$$(n1),
                    v1 = r1['[this]'],
                    v2 = M.$$(n2)['[this]'];                    
                v1.appendChild(v2);
                return r1;
            };            
        });

        return M;
    }
    
    return load;
}());
 