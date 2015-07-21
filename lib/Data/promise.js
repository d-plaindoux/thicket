/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var future = require('./future.js');

    function Promise() {
        this.embeddedFuture = future();
    }
            
    Promise.prototype.success = function(result) { 
        this.embeddedFuture.success(result); 
    };
    
    Promise.prototype.failure =function(result) { 
        this.embeddedFuture.failure(result); 
    };

    Promise.prototype.future = function() {
        return this.embeddedFuture;
    };
    
    return function() {
        return new Promise();
    };    
}());