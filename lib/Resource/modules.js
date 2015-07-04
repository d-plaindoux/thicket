/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    
    function Modules(manager) {
        this.modules = {};
        this.manager = manager;
    }
    
    Modules.prototype.contains = function(name) {
        return this.modules.hasOwnProperty(name);  
    };
    
    Modules.prototype.define = function(name, definitions) {
        this.modules[name] = definitions;
        
        this.manager.map(function(manager) {
            manager(name);
        });
    };
    
    return function (manager) {
        return new Modules(manager);
    };
}());