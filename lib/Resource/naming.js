/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    function Naming(directory) {
        this.directory = directory;
    }
    
    Naming.prototype.dependency = function(name) {
        return name + ".mvc.d";
    };

    Naming.prototype.specification = function(name) {
        return name + ".mvc.i";
    };

    Naming.prototype.code = function(name) {
        return name + ".mvc.js";
    };
    
    return new Naming();
}());