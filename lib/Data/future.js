/*
 * Thicket
 * https://github.com/d-plaindoux/thicket
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

module.exports = (function () {
    
    'use strict';
    
    var aTry = require('./atry.js'),
        option = require('./option.js');
        

    function Future() {
        this.response = option.none();
        this.successCallback = option.none();
        this.failureCallback = option.none();
        this.callbackSetup = false;
    }
    
    function notifyResponse(future, response) {
        if (!future.callbackSetup) {
            future.response = option.some(response);
            return;
        }
        
        if (response.isSuccess()) {
            future.successCallback.map(function(success) {
                success(response.success());
            });
        } else if (response.isFailure()) {
            future.failureCallback.map(function(failure) {
                failure(response.failure());
            });
        }
        
        future.successCallback = option.none();
        future.failureCallback = option.none();
        future.response = option.none();        
    }
    
    Future.prototype.success = function(result) {
        var that = this;
        
        this.response.orLazyElse(function() {
            notifyResponse(that, aTry.success(result));
        });
    };
          
    Future.prototype.failure = function(result) {
        var that = this;
        
        this.response.orLazyElse(function() {
            notifyResponse(that, aTry.failure(result));
        });
    };
    
    Future.prototype.onResult = function(success, error) {
        var that = this;
        
        if (this.callbackSetup) {
            return;
        }
        
        this.callbackSetup = true;
        this.successCallback = option.some(success);
        this.failureCallback = option.some(error);
        
        this.response.map(function(response) {
            notifyResponse(that, response);
        });
        
        return this;
    };  
    
    return function() {
        return new Future();
    };    
}());