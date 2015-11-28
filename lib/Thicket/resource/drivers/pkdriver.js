/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    
    function PackageDriver(packages) {
        if (Array.isArray(packages)) {
            this.packages = packages;
        } else {
            this.packages = [ packages ];
        }
    }
    
    PackageDriver.prototype.asyncReadContent = function (filename, success, error) {
        try {
            success(this.readContent(filename));
        } catch (e) {
            error(e);
        }
    };
    
    PackageDriver.prototype.readContent = function (filename) {
        for(var i = 0; i < this.packages.length; i++) {            
            if (this.packages[i].content[filename]) {
                return this.packages[i].content[filename];
            }
        }
        
        throw new Error("File " + filename + " not found");
    };
    
    return function(packages) {
        return new PackageDriver(packages);
    };
    
}());