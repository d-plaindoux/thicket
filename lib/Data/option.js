/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.option = (function () {
    
    'use strict';
    
    var type = require('./type.js').type;

    function Option(value) {
        this.value = value;
    }    
    
    Option.prototype.isPresent = function () {
        return (this.value !== null && this.value !== undefined);
    };
    
    Option.prototype.map = function (bindCall) {
        if (this.isPresent()) {
            return new Option(bindCall(this.value));
        } else {
            return this;
        }
    };

    Option.prototype.flatMap = function (bindCall) {
        if (this.isPresent()) {
            var result = bindCall(this.value);
            if (type.isa(result, 'Option')) {
                return result;
            } else {
                return new Option(result);
            }
        } else {
            return this;
        }
    };

    Option.prototype.get = function () {
        return this.value;
    };
    
    Option.prototype.orElse = function (value) {
        if (this.isPresent()) {
            return this.value;
        } else {
            return value;
        }
    };
    
    return {
        some : function (value) { return new Option(value); },
        empty : function () { return new Option(); }
    };
}());