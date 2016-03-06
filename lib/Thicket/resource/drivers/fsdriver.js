/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    
    var fs = require('fs');

    function FileSystemDriver(directories) {
        if (Array.isArray(directories)) {
            this.directories = directories;
        } else {
            this.directories = [ directories ];
        }
    }

    FileSystemDriver.prototype.readContent = function (filename) {
        for(var i = 0; i < this.directories.length; i++) {
            if (fs.existsSync(this.directories[i] + "/" + filename)) {
                return fs.readFileSync(this.directories[i] + "/" + filename).toString();
            }
        }
        
        throw new Error("File " + filename + " not found");
    };
        
    return function(directories) {
        return new FileSystemDriver(directories);
    };
    
}());