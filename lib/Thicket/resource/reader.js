/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    var naming = require('./naming.js'),
        packReader = require('./drivers/pkdriver.js');

    function Reader(drivers) {
        if (Array.isArray(drivers)) {
            this.drivers = drivers;
        } else {
            this.drivers = [ drivers ];
        }
    }    
    
    Reader.prototype.driver = function(content) {
        this.drivers.unshift(packReader(content));
    };

    Reader.prototype.package = function(name) {
        return this.content(naming.package(name));
    };
    
    Reader.prototype.specification = function(name) {
        return this.content(naming.specification(name));
    };
    
    Reader.prototype.code = function(name) {
        return this.content(naming.objcode(name));
    };
    
    Reader.prototype.content = function(name) {
        for(var i = 0; i < this.drivers.length; i++) {
            try {
                return this.drivers[i].readContent(name);
            } catch (e) {
                // Skip and try the next one
            }
        }
        
        throw new Error(name + " not found");
    };
    
    return function(drivers) {
        return new Reader(drivers);
    };
}());