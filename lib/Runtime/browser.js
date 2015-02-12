/*global document*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports.browser = (function() {
    function load(M) {    
        M.code("string.toXml", function(n1){
            var v1 = M.$$(n1)['[this]'];                
            return document.createTextNode(v1);
        });
        
        return M;
    }
    
    return load;
}());
 