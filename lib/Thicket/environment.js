/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';

    function Environment(current, modules) {
        var self = this;
        
        self.current = current;
        self.modules = modules;
    }
    
    return function(current, modules) {
        return new Environment(modules);
    };
}());
