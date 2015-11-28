/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    function Naming() {}
    
    Naming.prototype.package = function(name) {
        return name + ".tkt.p";
    };
    
    Naming.prototype.specification = function(name) {
        return name + ".tkt.i";
    };
    
    Naming.prototype.objcode = function(name) {
        return name + ".tkt.o";
    };
    
    return new Naming();
}());