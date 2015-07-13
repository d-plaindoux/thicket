/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var option = require('../Data/option.js');
    
    function Environment(current, packages) {
        var self = this;
        
        self.current = current;
        self.packages = packages;
    }
    
    Environment.prototype.findType = function(name) {
        var self = this;
        
        return self.packages.list().foldL(option.none(), function(result, aPackage) {
            if (result.isPresent()) {
                return result;
            } 
            
            return aPackage.findType(name);
         });
    };
    
    return function(current, packages) {
        return new Environment(current, packages);
    };
}());
