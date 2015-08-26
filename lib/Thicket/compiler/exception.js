/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    function Abort(message, filename, linenumber) {
        this.name = 'Abort';
        this.message = message;
        this.filename = filename;
        this.linenumber = linenumber;
        this.stack = (new Error()).stack;
    }

    Abort.prototype = new Error();
    
    function abort(data, reason) {
        if (data.$location) {
            return new Abort(reason + " at " + data.$location, data.$location.filename, data.$location.line);
        } else {
            return new Abort(reason);
        }        
    }

    function error(data, reason) {
        if (data.$location) {
            return new Error(reason + " at " + data.$location, data.$location.filename, data.$location.line);
        } else {
            return new Error(reason);
        }        
    }
    
    return function (data, reason, doAbort) {  
        if (doAbort) {
            return abort(data, reason);
        }
        
        return error(data, reason);
    };
}());