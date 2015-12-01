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
        packageReader = require('./drivers/pkdriver.js');

    function Reader(drivers) {
        if (Array.isArray(drivers)) {
            this.drivers = drivers;
        } else {
            this.drivers = [ drivers ];
        }
        this.packages = [];
    }    
    
    Reader.prototype.addPackage = function(content) {
        var that = this;
        
        that.packages.push(packageReader(content));
        
        (content.definition.requires || []).forEach(function(constraint) {
            var name = Object.keys(constraint)[0];
            if (!that.hasPackage(name)) {
                that.addPackage(that.package(name));
            }
        });
    };

    Reader.prototype.hasPackage = function(name) {
        for(var i = 0; i < this.packages.length; i++) {
            if (this.packages[i].name() === name) {
                return true;
            }
        }        
        
        return false;
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
        var i;
        
        for(i = 0; i < this.packages.length; i++) {
            try {
                return this.package[i].readContent(name);
            } catch (e) {
                // Skip and try the next one
            }
        }

        for(i = 0; i < this.drivers.length; i++) {
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