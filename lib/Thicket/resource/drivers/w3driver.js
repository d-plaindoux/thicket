/*global window*/
/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function() {
    
    'use strict';

    function W3Driver(directory) {
        this.directory = directory;
    }
    
    W3Driver.prototype.readContent = function (filename) {
        var request = new window.XMLHttpRequest();
        request.open('GET', this.directory + "/" + filename, false);
        request.setRequestHeader("Content-Type","application/text");
        request.send();
        return request.responseText;        
    };
    
    return function(directory) {
        return new W3Driver(directory);
    };
}());
