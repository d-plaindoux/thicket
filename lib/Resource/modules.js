/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    
    var option = require('../Data/option.js');
    
    // 
    // Modules management component
    //
    
    function Modules(manager) {
        this.modules = {};
        this.manager = manager;
    }
    
    Modules.prototype.contains = function(name) {
        return this.modules.hasOwnProperty(name);  
    };
    
    Modules.prototype.define = function(name, definitions) {
        this.modules[name] = definitions;
        
        definitions.entities.map(function(entity) {
            entity.namespace = name;
        });
        
        this.manager.map(function(manager) {
            manager(name);
        });
    };    
    
    Modules.prototype.retrieve = function(name) {
        if (this.contains(name)) {
            return option.some(this.modules[name]);
        }
        
        return option.none();
    };
        
    return function (manager) {
        return new Modules(manager);
    };
}());