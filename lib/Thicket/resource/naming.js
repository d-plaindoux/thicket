/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    function Naming() {}
    
    Naming.prototype.packageSpecificationAndCode = function(name) {
        return name + ".tkt.io.p";
    };
    
    Naming.prototype.packageCode = function(name) {
        return name + ".tkt.o.p";
    };
    
    Naming.prototype.specification = function(name) {
        return name + ".tkt.i";
    };
    
    Naming.prototype.objcode = function(name) {
        return name + ".tkt.o";
    };
    
    return new Naming();
}());