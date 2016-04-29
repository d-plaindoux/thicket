/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015-2016 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    function ThicketError(entity, message, aborted) {
        this.aborted = aborted;
        this.message = message;
        this.locate(entity);
        this.stack = (new Error(message)).stack;
    }

    ThicketError.prototype.getMessage = function () {
        if (this.location) {
            return this.message + " at " + this.location;
        }
        
        return this.message;
    };
    
    ThicketError.prototype.locate = function (entity) {
        if (this.location) {
            return;
        }
        
        if (entity && entity.$location) {
            this.location = entity.$location;    
            this.message = this.message + " at " + this.location;            
        }        
    };
    
    return function (data, reason, doAbort) {  
        return new ThicketError(data, reason, doAbort);
    };
}());