/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    var naming = require('./naming.js'),
        fs = require('fs');

    function Reader(directory) {
        this.directory = directory;
    }
    
    Reader.prototype.dependencies = function(name) {
        return JSON.parse(fs.readFileSync(this.directory + "/" + naming.dependency(name)));
    };

    Reader.prototype.specifications = function(name) {
        return JSON.parse(fs.readFileSync(this.directory + "/" + naming.specification(name)));
    };
    
    Reader.prototype.code = function(name) {
        return fs.readFileSync(this.directory + "/" + naming.code(name)).toString();
    };
    
    return function(directory) {
        return new Reader(directory);
    };
}());