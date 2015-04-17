/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var atry = require('../../Data/atry.js');
    
    function Dependencies(loader) {
        this.modules = {};
        this.loader = loader;
    }
    
    function getKey(aModule) {
        return aModule.join('.');
    }
        
    // Modules management
    
    Dependencies.prototype.contains = function (aModule) {
        return this.modules.hasOwnProperty(getKey(aModule));
    };
    
    Dependencies.prototype.get = function (aModule) {
        return this.modules[getKey(aModule)];
    };
    
    Dependencies.prototype.set = function (aModule, contents) {
        this.modules[getKey(aModule)] = contents;
    };
    
    // Resolution behavior
    
    Dependencies.prototype.resolve = function (aModule) {
        
        if (this.contains(aModule)) {
            return atry.success(this.get(aModule));
        } 
        
        try {
            var that = this;
            
            return this.loader(aModule).map(function (contents) {
                that.set(aModule, contents);
                return contents;
            });
        } catch(e){
            return atry.failure(e);
        }
    };
    
    return function(loader) {
        return new Dependencies(loader);
    };
    
}());