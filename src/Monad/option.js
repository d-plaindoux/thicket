/*global exports, require*/

/*
 * Movico
 * https://github.com/d-plaindoux/movico
 *
 * Copyright (c) 2014 Didier Plaindoux
 * Licensed under the LGPL2 license.
 */

exports.option = function (value) {
    
    'use strict';

    function Option(value) {
        this.value = value;
    }
    
    Option.prototype.isPresent = function () {
        if (this.value) {
            return true;
        } else {
            return false;
        }
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
            return bindCall(this.value);
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
    
    return new Option(value);
};