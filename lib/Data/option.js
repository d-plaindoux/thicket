/*global exports*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2015 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.option = (function () {
    
    'use strict';

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

    Option.prototype.flatmap = function (bindCall) {
        if (this.isPresent()) {
            return bindCall(this.value);
        } else {
            return this;
        }
    };

    Option.prototype.filter = function (f) {
        if (this.isPresent() && f(this.value)) {
            return this;
        }
        
        return new Option(null);
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
    
    Option.prototype.orLazyElse = function (value) {
        if (this.isPresent()) {
            return this.value;
        } else {
            return value();
        }
    };
    
    return {
        some : function (value) { return  new Option(value); },
        empty : function () { return new Option(); }
    };
}());