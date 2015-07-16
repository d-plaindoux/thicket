/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    
    var fs = require('fs');

    function FileSystemDriver(directory) {
        this.directory = directory;
    }
    
    FileSystemDriver.prototype.readContent = function (filename) {
        return fs.readFileSync(this.directory + "/" + filename);
    };
    
    return function(directory) {
        return new FileSystemDriver(directory);
    };
    
}());