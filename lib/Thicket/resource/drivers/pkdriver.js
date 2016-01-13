/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    
    function PackageDriver(aPackage) {
        this.package = aPackage;
    }
    
    PackageDriver.prototype.name = function() {
        return this.package.definition.name;
    };
        
    PackageDriver.prototype.asyncReadContent = function (filename, success, error) {
        try {
            success(this.readContent(filename));
        } catch (e) {
            error(e);
        }
    };
    
    PackageDriver.prototype.native = function() {
        if (this.package.definition.native && this.package.definition.native.javascript) {
            return this.package.definition.native.javascript;
        }
        
        return [];
    };
    
    PackageDriver.prototype.readContent = function (filename) {
        if (this.package.content[filename]) {
            return this.package.content[filename];
        }
        
        throw new Error("File " + filename + " not found");
    };
    
    return function(aPackage) {
        return new PackageDriver(aPackage);
    };
    
}());