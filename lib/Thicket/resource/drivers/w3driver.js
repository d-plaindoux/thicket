/*global XMLHttpRequest*/
/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';
    

    function W3Driver(directories) {
        if (Array.isArray(directories)) {
            this.directories = directories;
        } else {
            this.directories = [ directories ];
        }
    }
    
    W3Driver.prototype.asyncReadContent = function (filename, success, error) {
        try {
            success(this.readContent(filename));
        } catch (e) {
            error(e);
        }
    };
    
    W3Driver.prototype.readContent = function (filename) {
        for(var i = 0; i < this.directories.length; i++) {
            var request = new XMLHttpRequest();
            request.open('GET', this.directories[i] + "/" + filename, false);
            request.setRequestHeader("Content-Type","application/text");
            request.send();
            if (request.status === 200) {
                return JSON.parse(request.responseText);
            }
        }
        
        throw new Error("File " + filename + " not found");
    };
    
    return function(directories) {
        return new W3Driver(directories);
    };
}());
