/*global exports*/

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
    
    function getClass(object) {
        if (typeof(object) === 'object') {
            return object.constructor.toString(object).match(/^function\s(.*)\(/)[1];
        } else {
            return typeof(object);
        }
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
            if (getClass(result) === 'Option') {
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
    
    return new Option(value);
};