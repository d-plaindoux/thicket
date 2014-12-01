/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.exception = (function () {
    
    'use strict';
    
    var type = require('./type.js').type;

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
            return new Try(bindCall(this.value), null);
        } else {
            return this;
        }
    };

    Try.prototype.flatMap = function (bindCall) {
        if (this.isPresent()) {
            var result = bindCall(this.value);
            if (type.isa(result, 'Try')) {
                return result;
            } else {
                return new Try(result, null);
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
        if (this.isPresent()) {
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