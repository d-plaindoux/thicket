/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    var base64 = require('../../Data/base64.js'),
        naming = require('./naming.js'),
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
    
    Reader.prototype.addPackageSpecificationAndCode = function(name) {
        var that = this,
            content = that.packageSpecificationAndCode(name),
            aPackage = packageReader(content),
            native = [];
        
        that.packages.push(aPackage);
        
        native = aPackage.native();
        
        (content.definition.requires || []).forEach(function(constraint) {
            var name = Object.keys(constraint)[0];
            if (!that.hasPackage(name)) {
                native = native.concat(that.addPackageSpecificationAndCode(name));
            }
        });
        
        return native;
    };

    Reader.prototype.addPackageCode = function(content) {
        var that = this,
            aPackage = packageReader(content),
            native = [];
        
        that.packages.push(aPackage);
        
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
        try {
            return this.json(naming.packageSpecificationAndCode(name));
        } catch (error) {
            try {
                return this.localPackageSpecificationAndCode(name);
            } catch (ignore) {
                throw error;
            }
        }
    };
    
    Reader.prototype.localPackageSpecificationAndCode = function(name) {
        // Read in the current directory | TODO add a specific entry instead 
        var aPackage = JSON.parse(require('./drivers/fsdriver.js')('.').readContent(name));

        try {
            return this.json(naming.packageSpecificationAndCode(aPackage.definition.name));
        } catch (ignore) {
            return aPackage;
        }
    };
    
    Reader.prototype.packageCode = function(name) {
        try {   
            return this.json(naming.packageCode(name));
        } catch (error) {
            try {
                return this.localPackageCode(name);
            } catch (ignore) {
                throw error;
            }
        }
    };
    
    Reader.prototype.localPackageCode = function(name) {
        // Read in the current directory | TODO add a specific entry instead 
        var aPackage = JSON.parse(require('./drivers/fsdriver.js')('.').readContent(name));

        try {
            return this.json(naming.packageCode(aPackage.definition.name));
        } catch (ignore) {
            return aPackage;
        }
    };
    
    Reader.prototype.specification = function(name) {
        return this.json(naming.specification(name));
    };
    
    Reader.prototype.code = function(name) {
        try {
            return this.json(naming.objcode(name));
        } catch (error) {
            try {
                return this.localCode(name);
            } catch (ignore) {
                throw error;
            }
        }
    };
        
    Reader.prototype.localCode = function(name) {
        // Read in the current directory | TODO add a specific entry instead 
        var aPackage = JSON.parse(require('./drivers/fsdriver.js')('.').readContent(name));

        try {
            return this.json(naming.objcode(aPackage.definition.name));
        } catch (ignore) {
            return aPackage;
        }
    };
    
    Reader.prototype.json = function(name) {
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
                return JSON.parse(this.drivers[i].readContent(name));
            } catch (e) {
                // Skip and try the next one
            }
        }
        
        throw new Error(name + " not found");
    };
        
    Reader.prototype.native = function(name) {
        var i;

        for(i = 0; i < this.packages.length; i++) {
            try {
                return base64.decode(this.packages[i].readContent(name));
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
    
    Reader.prototype.content = function(name) {
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