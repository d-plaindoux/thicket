/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    //
    // Code to be rewritten - Breaks OPC principle.
    //
    
    var naming = require('./naming.js'),
        fs = require('fs');

    function Writer(directory) {
        this.directory = directory;
    }

    function removeLocation(key,value) {
        if (key === "$location") {
            return undefined;
        } 
        
        return value;
    }

    Writer.prototype.specification = function (name, specifications, debug) {
        var destination = fs.openSync(this.directory + "/" + naming.specification(name), "w");
        
        if (debug) {
            fs.writeSync(destination, JSON.stringify(specifications, null, 2));
        } else {
            fs.writeSync(destination, JSON.stringify(specifications, removeLocation));        
        }

        fs.closeSync(destination);    
    };

    Writer.prototype.code = function (name, binary, debug) {
        var destination = fs.openSync(this.directory + "/" + naming.objcode(name),"w");
        
        if (debug) {    
            fs.writeSync(destination, JSON.stringify(binary, null, 2));
        } else {
            fs.writeSync(destination, JSON.stringify(binary));
        }
        fs.closeSync(destination);
    };

    return function(directory) {
        return new Writer(directory);
    };
}());