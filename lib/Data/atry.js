/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.atry = (function () {
    
    'use strict';

    function Try(value,error) {
        this.value = value;
        this.error = error;
    }    
    
    Try.prototype.isSuccess = function () {
        return this.error === null;
    };
    
    Try.prototype.isFailure = function () {
        return !this.isSuccess();
    };
    
    Try.prototype.map = function (bindCall) {
        if (this.isSuccess()) {
            try {
                return new Try(bindCall(this.value), null);
            } catch (e) {
                return new Try(null, e);
            }                
        } else {
            return this;
        }
    };

    Try.prototype.flatmap = function (bindCall) {
        if (this.isSuccess()) {
            try {
                return bindCall(this.value);
            } catch (e) {
                return new Try(null, e);
            }
        } else {
            return this;
        }
    };

    Try.prototype.success = function () {
        return this.value;
    };
    
    Try.prototype.failure = function () {
        return this.error;
    };
    
    Try.prototype.orElse = function (value) {
        if (this.isSuccess()) {
            return this.value;
        } else {
            return value;
        }
    };
    
    return {
        success : function (value) { return new Try(value, null); },
        failure : function (error) { return new Try(null, error); }
    };
}());
