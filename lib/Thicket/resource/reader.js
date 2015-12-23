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
    
    Reader.prototype.hasPackage = function(name) {
        for(var i = 0; i < this.packages.length; i++) {
            if (this.packages[i].name() === name) {
                return true;
            }
        }        
        
        return false;
    };
    
    Reader.prototype.addPackageSpecificationAndCode = function(content) {
        var that = this,
            aPackage = packageReader(content),
            native = [];
        
        that.packages.push(aPackage);
        
        native = aPackage.native();
        
        (content.definition.requires || []).forEach(function(constraint) {
            var name = Object.keys(constraint)[0];
            if (!that.hasPackage(name)) {
                native = native.concat(that.addPackageSpecificationAndCode(that.packageSpecificationAndCode(name)));
            }
        });
        
        return native;
    };

    Reader.prototype.addPackageCode = function(content) {
        var that = this,
            aPackage = packageReader(content),
            native = [];
        
        that.packages.push(packageReader(content));
        
        native = aPackage.native();

        (content.definition.requires || []).forEach(function(constraint) {
            var name = Object.keys(constraint)[0];
            if (!that.hasPackage(name)) {
                native = native.concat(that.addPackageCode(that.packageCode(name)));
            }
        });
        
        return native;
    };

    Reader.prototype.packageSpecificationAndCode = function(name) {
        return this.content(naming.packageSpecificationAndCode(name));
    };
    
    Reader.prototype.packageCode = function(name) {
        return this.content(naming.packageCode(name));
    };
    
    Reader.prototype.specification = function(name) {
        return this.content(naming.specification(name));
    };
    
    Reader.prototype.code = function(name) {
        return this.content(naming.objcode(name));
    };
    
    Reader.prototype.content = function(name) {
        var content = this.native(name);

        // TODO check this ugly code fragment
        
        try {
            return JSON.parse(content);
        } catch (e) {        
            return content;
        }
    };
    
    Reader.prototype.native = function(name) {
        var i;

        for(i = 0; i < this.packages.length; i++) {
            try {
                return this.packages[i].readContent(name);
            } catch (consume) {
                // ignore
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